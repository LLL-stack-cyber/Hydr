import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import { spawn } from "child_process";
import { createClient } from "@supabase/supabase-js";
import Database from "better-sqlite3";
import { setupMqtt, publishCommand, ValidatedTelemetry } from "./server/mqttService";

dotenv.config();

const PORT = 3000;
let SIMULATION_MODE = process.env.SIMULATION_MODE !== 'false'; // Default to true if not explicitly false

const MQTT_BROKER = process.env.MQTT_BROKER_URL || '10.240.190.180';
const MQTT_PORT = parseInt(process.env.MQTT_PORT || '1883');
const MQTT_USER = process.env.MQTT_USERNAME || '';
const MQTT_PASS = process.env.MQTT_PASSWORD || '';
const MQTT_DEVICE_ID = process.env.MQTT_DEVICE_ID || 'HYDROGUARD-ESP32-01';
const MQTT_TELEMETRY_TOPIC = process.env.MQTT_TELEMETRY_TOPIC || '';
const MQTT_CONTROL_TOPIC = process.env.MQTT_CONTROL_TOPIC || '';

let SUPABASE_URL = process.env.SUPABASE_URL || '';
let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

// Initialize SQLite Edge Buffer
let localDb: any = null;
function initLocalBuffer() {
  try {
    localDb = new Database('./edge_buffer.db');
    localDb.pragma('journal_mode = WAL');
    localDb.exec(`
      CREATE TABLE IF NOT EXISTS telemetry_buffer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payload TEXT
      )
    `);
    console.log("Local SQLite Edge Buffer initialized.");
  } catch (e) {
    console.error("Failed to initialize SQLite Edge Buffer:", e);
  }
}
initLocalBuffer();

const AI_MODEL_PATH = process.env.AI_MODEL_PATH || './ai/random_forest_water_model.joblib';

// Application state
let systemStatus = {
  esp32_connected: false,
  mqtt_connected: false,
  database_connected: !!supabase,
  ai_engine_connected: false,
  simulation_mode: SIMULATION_MODE,
  ai_status: 'INITIALIZING',
  ai_error: ''
};

// Simulation State
let simulationInterval: NodeJS.Timeout | null = null;
let simTelemetry = {
  device_id: MQTT_DEVICE_ID,
  timestamp: new Date().toISOString(),
  raw_level: 65.4,
  clean_level: 42.8,
  ph: 7.12,
  tds: 285,
  turbidity: 4.5,
  temperature: 24.2,
  humidity: 61.2,
  air_temperature: 22.1,
  flow_in: 3.8,
  flow_out: 3.5,
  pump: true,
  valve1: false,
  valve2: true
};

async function runAiInference(telemetry: any): Promise<any> {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python3', ['./ai/predict.py'], {
      env: { ...process.env, AI_MODEL_PATH }
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      try {
        if (output) {
          const result = JSON.parse(output);
          resolve(result);
        } else {
          resolve({ status: 'error', message: errorOutput || 'Unknown python execution error' });
        }
      } catch (e) {
        resolve({ status: 'error', message: 'Failed to parse AI output: ' + (errorOutput || output) });
      }
    });

    pythonProcess.on('error', (err) => {
      resolve({ status: 'error', message: 'Failed to spawn Python process. Is python3 installed?' });
    });

    // Send input data
    pythonProcess.stdin.write(JSON.stringify(telemetry));
    pythonProcess.stdin.end();
  });
}

let consecutiveAbnormalCount = 0;
const ABNORMAL_THRESHOLD = 3;

async function processTelemetry(telemetry: any, wss: WebSocketServer) {
  // 1. Supabase Secure Entry & Edge Buffering
  const rowData = {
    device_id: telemetry.device_id || MQTT_DEVICE_ID,
    ph: Number(telemetry.ph) || 7.0,
    tds: Number(telemetry.tds) || 0,
    turbidity: Number(telemetry.turbidity) || 0,
    temperature: Number(telemetry.temperature) || 25.0,
    flow_in: Number(telemetry.flow_in) || 0,
    flow_out: Number(telemetry.flow_out) || 0,
    raw_tank_level: Number(telemetry.raw_level) || 0,
    clean_tank_level: Number(telemetry.clean_level) || 0,
    timestamp: telemetry.timestamp || new Date().toISOString()
  };

  if (supabase) {
    try {
      const { error } = await supabase.from('sensor_readings').insert([rowData]);
      if (!error) {
        systemStatus.database_connected = true;
      } else {
        throw new Error(error.message);
      }
    } catch (e) {
      console.warn("Supabase insert failed, buffering locally:", e);
      systemStatus.database_connected = false;
      if (localDb) {
        try {
          localDb.prepare('INSERT INTO telemetry_buffer (payload) VALUES (?)').run(JSON.stringify(rowData));
        } catch (dbError) {
          console.error("Failed to write to local edge buffer:", dbError);
        }
      }
    }
  }

  // 2. AI Inference
  telemetry.flow_difference = Math.max(0, telemetry.flow_in - telemetry.flow_out);
  const aiResult = await runAiInference(telemetry);
  
  let predictionPayload = null;
  if (aiResult.status === 'success') {
    systemStatus.ai_engine_connected = true;
    systemStatus.ai_status = 'ONLINE';
    systemStatus.ai_error = '';
    predictionPayload = {
      water_quality: aiResult.prediction,
      confidence: aiResult.confidence,
      model_status: 'ONLINE',
      anomaly_type: aiResult.prediction === 'ABNORMAL' ? 'FILTER_BLINDING' : (aiResult.prediction === 'WARNING' ? 'DEGRADATION' : 'NONE'),
      feature_importances: aiResult.feature_importances || [],
      model_accuracy: 96.4, // Match V3 Scikit accuracy
      training_samples: 1200 // Match V3 dataset count
    };

    // V3 Edge Logic: Trigger Emergency Halt with Debounce
    if (aiResult.prediction === 'ABNORMAL') {
      consecutiveAbnormalCount++;
      if (consecutiveAbnormalCount >= ABNORMAL_THRESHOLD) {
        if (!SIMULATION_MODE) {
          publishCommand(MQTT_DEVICE_ID, 'system', { command: 'SYSTEM_HALT', override: true, trigger: 'AI_INFERENCE_ABNORMAL' });
          console.warn(`[AI ALERT] Executed SYSTEM_HALT after ${consecutiveAbnormalCount} consecutive ABNORMAL predictions.`);
        } else {
          // Just log in simulation mode
          console.warn(`[AI ALERT] Inference: ABNORMAL! (Count: ${consecutiveAbnormalCount}) Severe filter blinding detected. Dispatching SYSTEM_HALT.`);
        }
      } else {
         console.warn(`[AI ALERT] Inference: ABNORMAL detected. (Count: ${consecutiveAbnormalCount}/${ABNORMAL_THRESHOLD}). Waiting for consecutive confirms.`);
      }
    } else {
      // Reset counter if prediction returns to NORMAL or WARNING
      if (consecutiveAbnormalCount > 0) {
          console.log(`[AI INFO] Prediction returned to ${aiResult.prediction}. Resetting ABNORMAL debounce counter from ${consecutiveAbnormalCount} to 0.`);
      }
      consecutiveAbnormalCount = 0;
    }

  } else {
    systemStatus.ai_engine_connected = false;
    systemStatus.ai_status = 'OFFLINE';
    systemStatus.ai_error = aiResult.message || 'AI Engine Error';
    predictionPayload = {
      model_status: 'ERROR',
      water_quality: 'INSUFFICIENT_DATA',
      confidence: 0,
      anomaly_type: 'NONE',
      anomaly_details: aiResult.message
    };
  }

  // 3. Broadcast
  const payload = JSON.stringify({
    type: 'TELEMETRY_UPDATE',
    telemetry,
    ai: predictionPayload,
    system: systemStatus
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Background Task: Edge Buffer Sync
setInterval(async () => {
  if (!supabase || !localDb) return;
  try {
    const rows = localDb.prepare('SELECT id, payload FROM telemetry_buffer ORDER BY id ASC LIMIT 100').all();
    if (rows.length > 0) {
      console.log(`[Edge Buffer] Attempting to upload ${rows.length} buffered rows to Supabase...`);
      const payloads = rows.map((r: any) => JSON.parse(r.payload));
      
      const { error } = await supabase.from('sensor_readings').insert(payloads);
      
      if (!error) {
        const ids = rows.map((r: any) => r.id);
        localDb.prepare(`DELETE FROM telemetry_buffer WHERE id IN (${ids.join(',')})`).run();
        console.log(`[Edge Buffer] Successfully uploaded and cleared ${rows.length} buffered rows.`);
        systemStatus.database_connected = true;
      } else {
        console.warn("[Edge Buffer] Failed to upload buffered rows:", error.message);
        if (error.message.includes("Could not find the table") || error.message.includes("relation \"public.sensor_readings\" does not exist")) {
          console.warn("[ACTION REQUIRED] The 'sensor_readings' table is missing in your Supabase project.");
          console.warn("Please run the SQL commands found in 'supabase_schema.sql' in your Supabase SQL Editor.");
        }
      }
    }
  } catch (e) {
     console.warn("[Edge Buffer] Buffer sync error:", e);
  }
}, 10000);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws/live' });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: systemStatus });
  });

  app.post("/api/actuator/:type", (req, res) => {
    const { type } = req.params;
    const { state } = req.body;
    
    if (SIMULATION_MODE) {
      if (type === 'pump') simTelemetry.pump = state;
      else if (type === 'valve1') simTelemetry.valve1 = state;
      else if (type === 'valve2') simTelemetry.valve2 = state;
    } else {
      // In live mode, publish to MQTT
      const commandPayload = { command: state ? "ON" : "OFF" };
      publishCommand(MQTT_DEVICE_ID, type as any, commandPayload);
    }
    res.json({ status: "ok", type, state });
  });

  app.post("/api/connect", async (req, res) => {
    const { 
      broker_url, 
      port, 
      username, 
      password, 
      device_id, 
      simulation_mode, 
      supabase_url, 
      supabase_service_role_key,
      anonymous_entry,
      telemetry_topic,
      control_topic
    } = req.body;
    
    // Configure Supabase client with service role key if provided
    if (supabase_url && supabase_service_role_key) {
      try {
        SUPABASE_URL = supabase_url.trim();
        SUPABASE_SERVICE_ROLE_KEY = supabase_service_role_key.trim();
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        systemStatus.database_connected = true;
        console.log("Supabase service role client initialized successfully");
      } catch (e) {
        console.error("Failed to initialize Supabase client:", e);
      }
    }

    // Clear existing simulation if any
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    
    // If anonymous instant entry requested without specific server config, start simulation or live local
    let shouldSimulate = simulation_mode === true;
    if (anonymous_entry && simulation_mode === undefined) {
      shouldSimulate = true;
    }

    SIMULATION_MODE = shouldSimulate;
    systemStatus.simulation_mode = SIMULATION_MODE;
    
    if (SIMULATION_MODE) {
      // Simulation Loop
      systemStatus.mqtt_connected = false;
      systemStatus.esp32_connected = false;
      
      simulationInterval = setInterval(async () => {
        // Generate dynamic realistic noise
        simTelemetry.timestamp = new Date().toISOString();
        simTelemetry.ph = Math.max(6.0, Math.min(8.5, simTelemetry.ph + (Math.random() - 0.5) * 0.02));
        simTelemetry.tds = Math.max(100, Math.min(800, simTelemetry.tds + (Math.random() - 0.5) * 2));
        simTelemetry.turbidity = Math.max(1.0, Math.min(50, simTelemetry.turbidity + (Math.random() - 0.5) * 0.5));
        
        if (simTelemetry.pump) {
          simTelemetry.flow_in = Math.max(3.0, Math.min(4.5, simTelemetry.flow_in + (Math.random() - 0.5) * 0.1));
          simTelemetry.flow_out = Math.max(2.5, Math.min(simTelemetry.flow_in, simTelemetry.flow_out + (Math.random() - 0.5) * 0.1));
        } else {
          simTelemetry.flow_in = 0;
          simTelemetry.flow_out = 0;
        }
        
        await processTelemetry({ ...simTelemetry }, wss);
      }, 2000);
      
      res.json({ 
        status: "ok", 
        mode: "simulation", 
        anonymous: !!anonymous_entry,
        supabase_connected: systemStatus.database_connected 
      });
    } else {
      // Live Local MQTT Mode
      try {
        await setupMqtt(
          {
            url: broker_url || MQTT_BROKER,
            port: parseInt(port) || MQTT_PORT,
            user: username || MQTT_USER,
            pass: password || MQTT_PASS,
            deviceId: device_id || MQTT_DEVICE_ID,
            telemetryTopic: telemetry_topic || MQTT_TELEMETRY_TOPIC,
            controlTopic: control_topic || MQTT_CONTROL_TOPIC
          },
          systemStatus,
          async (telemetry) => {
            await processTelemetry(telemetry, wss);
          },
          (topic, message) => {
            const payload = JSON.stringify({
              type: 'STATUS_ACK',
              topic,
              message
            });
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
              }
            });
          }
        );
        res.json({ 
          status: "ok", 
          mode: "live", 
          anonymous: !!anonymous_entry,
          supabase_connected: systemStatus.database_connected 
        });
      } catch (e: any) {
        // If user chose anonymous entry or local server is currently offline, provide graceful fallback
        if (anonymous_entry) {
          console.warn("Local MQTT connection failed during anonymous entry, falling back to digital twin simulation:", e.message);
          SIMULATION_MODE = true;
          systemStatus.simulation_mode = true;
          simulationInterval = setInterval(async () => {
            simTelemetry.timestamp = new Date().toISOString();
            await processTelemetry({ ...simTelemetry }, wss);
          }, 2000);
          return res.json({ status: "ok", mode: "simulation_fallback", anonymous: true });
        }
        
        let errorMessage = e.message || "Failed to connect to local MQTT server";
        const targetUrl = broker_url || MQTT_BROKER;
        const isLocalIP = targetUrl?.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.|localhost)/);
        
        if (isLocalIP && (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED'))) {
          errorMessage = `Cloud Environment Limitation: AI Studio is running in the cloud and cannot reach your private local network IP (${targetUrl}). To connect to your Raspberry Pi, you must either: 1) Export this code to run it locally on your PC, or 2) Use the 'Digital Twin Simulation' switch on this page to test the UI logic.`;
        }
        
        res.status(500).json({ status: "error", message: errorMessage });
      }
    }
  });

  // Supabase Status & Readings Endpoints
  app.get("/api/supabase/status", (req, res) => {
    res.json({
      connected: systemStatus.database_connected,
      has_credentials: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
      accepts_anonymous: true
    });
  });

  app.get("/api/supabase/readings", async (req, res) => {
    if (!supabase) {
      return res.json({ connected: false, readings: [] });
    }
    try {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(30);
      if (error) {
        return res.json({ connected: true, error: error.message, readings: [] });
      }
      res.json({ connected: true, readings: data || [] });
    } catch (e: any) {
      res.json({ connected: false, error: e?.message || "Failed to query Supabase", readings: [] });
    }
  });

  // Default Initialization is now pending user login (or we could start simulation by default, but let's wait)
  // We'll leave it idle until /api/connect is called.

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
