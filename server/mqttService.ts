import mqtt from "mqtt";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

const TelemetrySchema = z.object({
  device_id: z.string().optional().default("HYDROGUARD-ESP32-01"),
  timestamp: z.string().optional(),
  ph: z.number().optional(),
  pH: z.number().optional(),
  tds: z.number().optional(),
  turbidity: z.number().optional(),
  temperature: z.number().optional(),
  water_temp: z.number().optional(),
  flow_in: z.number().optional(),
  flow_out: z.number().optional(),
  raw_level: z.number().optional(),
  clean_level: z.number().optional(),
  air_temperature: z.number().optional(),
  air_temp: z.number().optional(),
  humidity: z.number().optional(),
  air_humidity: z.number().optional(),
  pump: z.boolean().optional().default(true),
  valve1: z.boolean().optional().default(false),
  valve2: z.boolean().optional().default(true),
  safety_lockout: z.boolean().optional(),
}).transform((data) => ({
  device_id: data.device_id,
  timestamp: data.timestamp,
  ph: data.pH ?? data.ph ?? 7.0,
  tds: data.tds ?? 0,
  turbidity: data.turbidity ?? 0,
  temperature: data.water_temp ?? data.temperature ?? 25.0,
  flow_in: data.flow_in ?? 0,
  flow_out: data.flow_out ?? 0,
  raw_level: data.raw_level ?? 0,
  clean_level: data.clean_level ?? 0,
  air_temperature: data.air_temp ?? data.air_temperature ?? 25.0,
  humidity: data.air_humidity ?? data.humidity ?? 50.0,
  pump: !data.safety_lockout && data.pump, 
  valve1: data.valve1,
  valve2: data.valve2,
}));

export type ValidatedTelemetry = z.infer<typeof TelemetrySchema>;

let mqttClient: mqtt.MqttClient | null = null;
let lastTelemetryTime = 0;
const TELEMETRY_TIMEOUT_MS = 15000;
let watchdogInterval: NodeJS.Timeout | null = null;
let currentControlTopic = `hydroguard/control`;

export function disconnectMqtt() {
  if (mqttClient) {
    mqttClient.end(true);
    mqttClient = null;
  }
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
}

export function setupMqtt(
  config: { url: string; port: number; user: string; pass: string; deviceId: string; telemetryTopic?: string; controlTopic?: string },
  systemStatus: any,
  onValidTelemetry: (data: ValidatedTelemetry) => Promise<void>,
  onStatusMessage?: (topic: string, message: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    disconnectMqtt();
    
    currentControlTopic = config.controlTopic || `hydroguard/control`;
    const statusTopic = config.controlTopic ? config.controlTopic.replace('/control', '/status') : `hydroguard/${config.deviceId}/status`;

    // Normalize local server IP or hostname (e.g., "127.0.0.1", "192.168.1.45", "localhost")
    let targetUrl = (config.url || "127.0.0.1").trim();
    if (!targetUrl.startsWith("mqtt://") && !targetUrl.startsWith("tcp://") && !targetUrl.startsWith("ws://") && !targetUrl.startsWith("wss://")) {
      targetUrl = `mqtt://${targetUrl}`;
    }

    const portNumber = Number(config.port) || 1883;
    console.log(`Connecting to MQTT Server: ${targetUrl}:${portNumber}`);

    const clientOptions: mqtt.IClientOptions = {
      port: portNumber,
      clientId: `hydroguard-node-${Math.random().toString(16).slice(2, 8)}`,
      keepalive: 30,
      connectTimeout: 7000,
    };

    // Only supply credentials if explicitly provided (local Mosquitto servers accept anonymous by default)
    if (config.user && config.user.trim().length > 0) {
      clientOptions.username = config.user.trim();
    }
    if (config.pass && config.pass.trim().length > 0) {
      clientOptions.password = config.pass.trim();
    }

    mqttClient = mqtt.connect(targetUrl, clientOptions);

    let resolved = false;

    mqttClient.on('connect', () => {
      console.log('MQTT Server Connected');
      systemStatus.mqtt_connected = true;
      
      // Subscribe to both universal hardware topics and device-specific topics
      if (config.telemetryTopic) {
        mqttClient?.subscribe(config.telemetryTopic);
      }
      mqttClient?.subscribe(statusTopic);
      mqttClient?.subscribe(`hydroguard/telemetry`);
      mqttClient?.subscribe(`hydroguard/${config.deviceId}/telemetry`);
      mqttClient?.subscribe(`hydroguard/status`);
      mqttClient?.subscribe(`hydroguard/${config.deviceId}/status`);
      
      if (!resolved) {
        resolved = true;
        resolve();
      }
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT Error:', err);
      systemStatus.mqtt_connected = false;
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

  mqttClient.on('offline', () => {
    systemStatus.mqtt_connected = false;
  });
  
  mqttClient.on('close', () => {
    systemStatus.mqtt_connected = false;
  });

  mqttClient.on('message', async (topic, message) => {
    const messageStr = message.toString();
    
    // Pass raw status messages up if requested (e.g. for ACK receipts)
    if (onStatusMessage && (topic === statusTopic || topic === `hydroguard/${config.deviceId}/status` || topic === `hydroguard/status`)) {
      onStatusMessage(topic, messageStr);
    }
    
    if (topic === `hydroguard/${config.deviceId}/status`) {
      try {
        const statusData = JSON.parse(messageStr);
        if (statusData.status === 'online') {
          systemStatus.esp32_connected = true;
        } else if (statusData.status === 'offline') {
          systemStatus.esp32_connected = false;
        }
      } catch (e) {
        // ignore malformed status
      }
      // Do not return here if we want other handlers to process it, but in the old code we returned.
      // Wait, we can return if it's the specific old JSON status, but for ACK messages, they might be raw strings.
      // Since we already invoked onStatusMessage, returning here is fine for the old topic.
      // Actually, if it's `statusTopic` (e.g. `hydroguard_shreyas_insef26/status`), it might be just "ACK: PUMP_ON".
      // We shouldn't return if it's a general status topic we just added, unless we want to skip telemetry check. 
      // Telemetry check is an 'if' so skipping it is fine if we just continue.
    }
    
    if (topic === config.telemetryTopic || topic === `hydroguard/${config.deviceId}/telemetry` || topic === `hydroguard/telemetry`) {
      try {
        const rawData = JSON.parse(message.toString());
        // Validate with Zod
        const result = TelemetrySchema.safeParse(rawData);
        
        if (result.success) {
          lastTelemetryTime = Date.now();
          systemStatus.esp32_connected = true; // Implicitly online if sending data
          
          const telemetry = result.data;
          // Add timestamp if missing
          if (!telemetry.timestamp) {
            telemetry.timestamp = new Date().toISOString();
          }
          
          await onValidTelemetry(telemetry);
        } else {
          console.warn("Invalid telemetry dropped:", result.error.issues);
        }
      } catch (e) {
        console.error("Failed to parse telemetry JSON:", e);
      }
    }
  });

  // Watchdog timer to detect ESP32 disconnects
  watchdogInterval = setInterval(() => {
    if (systemStatus.esp32_connected && Date.now() - lastTelemetryTime > TELEMETRY_TIMEOUT_MS) {
      console.warn(`No telemetry received from ESP32 in ${TELEMETRY_TIMEOUT_MS}ms. Marking offline.`);
      systemStatus.esp32_connected = false;
    }
  }, 5000);
  });
}

export function publishCommand(deviceId: string, actuator: 'pump' | 'valve1' | 'valve2' | 'system', command: any) {
  if (mqttClient && mqttClient.connected) {
    // Determine the raw payload for the V3 C++ ESP32 code
    let rawPayload = "";
    if (actuator === 'system' && command.command === 'SYSTEM_HALT') {
      rawPayload = "SYSTEM_HALT";
    } else if (actuator === 'pump') {
      rawPayload = command.command === 'ON' ? "PUMP_ON" : "PUMP_OFF";
    }
    
    if (rawPayload) {
      // Publish to the universal control topic for the ESP32 V3 code
      mqttClient.publish(currentControlTopic, rawPayload, { qos: 1 });
    }
    
    // Also publish to the legacy dashboard topic for backward compatibility
    const legacyTopic = `hydroguard/${deviceId}/command/${actuator}`;
    mqttClient.publish(legacyTopic, JSON.stringify(command), { qos: 1 });
  } else {
    console.warn("Cannot publish command. MQTT disconnected.");
  }
}
