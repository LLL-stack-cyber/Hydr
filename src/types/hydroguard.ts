export type SensorStatus = 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'OUT_OF_RANGE';

export type OverallWaterQuality = 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' | 'INSUFFICIENT_DATA';

export type FiltrationStatus = 'OPTIMAL' | 'NORMAL' | 'DEGRADED' | 'BACKWASH_REQUIRED' | 'CLOGGED';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'AI';

export type AlertType =
  | 'SENSOR_OFFLINE'
  | 'FLOW_ANOMALY'
  | 'TANK_LEVEL_LOW'
  | 'TANK_LEVEL_HIGH'
  | 'PH_OUT_OF_RANGE'
  | 'TDS_OUT_OF_RANGE'
  | 'TURBIDITY_HIGH'
  | 'PUMP_FAILURE'
  | 'VALVE_FAILURE'
  | 'ESP32_OFFLINE'
  | 'MQTT_DISCONNECTED'
  | 'AI_ANOMALY';

export interface SensorTelemetry {
  device_id: string;
  timestamp: string; // ISO string
  raw_level: number; // % (0-100)
  clean_level: number; // % (0-100)
  ph: number; // pH units (0-14)
  tds: number; // ppm (0-1000)
  turbidity: number; // NTU (0-100)
  temperature: number; // °C (water DS18B20)
  humidity: number; // % (DHT11)
  air_temperature: number; // °C (DHT11)
  flow_in: number; // L/min (ZJ-S201)
  flow_out: number; // L/min (ZJ-S201)
  pump: boolean;
  valve1: boolean; // Solenoid 1 (Bypass/Flush)
  valve2: boolean; // Solenoid 2 (Clean Outlet)
  rssi?: number;
  free_heap?: number;
  uptime_seconds?: number;
}

export interface SensorHealthRecord {
  id: string;
  name: string;
  model: string;
  hardware_pin: string;
  value: number;
  unit: string;
  min_seen: number;
  max_seen: number;
  status: SensorStatus;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trend_delta: number;
  last_updated: string;
  anomaly_detected: boolean;
  diagnostic: string;
}

export interface ActuatorState {
  pump: boolean;
  solenoid1: boolean; // Bypass / Flush
  solenoid2: boolean; // Main Clean
  emergency_stopped: boolean;
  pending_command?: string | null;
  last_command_time?: string;
  confirmation_received: boolean;
}

export interface FiltrationMetrics {
  flow_in: number;
  flow_out: number;
  flow_difference: number; // L/min (flow_in - flow_out)
  flow_loss_percentage: number; // %
  filtration_efficiency: number; // % based on turbidity/tds reduction
  status: FiltrationStatus;
  recommended_backwash: boolean;
}

export interface AiPredictionResult {
  model_status: 'TRAINED' | 'MODEL_NOT_TRAINED' | 'TRAINING' | 'ONLINE' | 'ERROR' | 'OFFLINE';
  water_quality: OverallWaterQuality;
  confidence: number; // 0 - 100%
  anomaly_type: 'NONE' | 'FILTER_RESISTANCE_SPIKE' | 'TURBIDITY_BREAKTHROUGH' | 'SENSOR_DRIFT' | 'FLOW_RESTRICTION' | 'ORGANIC_OVERLOAD';
  filtration_performance?: FiltrationStatus;
  sensor_anomaly_flag?: boolean;
  anomaly_details?: string;
  recommended_action?: string;
  model_accuracy?: number; // e.g. 96.4%
  training_samples?: number;
  feature_importances?: { feature: string; importance: number }[];
  confusion_matrix?: number[][];
  last_evaluated?: string;
}

export interface SystemHealthMetrics {
  overall_score?: number; // 0 - 100%
  esp32_connected: boolean;
  mqtt_connected: boolean;
  backend_connected?: boolean;
  database_connected: boolean;
  ai_engine_connected: boolean;
  simulation_mode?: boolean;
  ai_status?: string;
  ai_error?: string;
  subsystems?: {
    esp32: number;
    mqtt: number;
    backend: number;
    database: number;
    ai: number;
    sensors: number;
    pump: number;
    solenoid1: number;
    solenoid2: number;
  };
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  acknowledged: boolean;
}

export interface PipelineStage {
  id: 'esp32' | 'mqtt' | 'backend' | 'database' | 'ai' | 'dashboard';
  title: string;
  subTitle: string;
  connected: boolean;
  lastPing: string;
  latencyMs: number;
  packetCount: number;
  errorRate: number;
}

export interface HistoricalDataPoint {
  timestamp: string;
  timeLabel: string;
  raw_level: number;
  clean_level: number;
  ph: number;
  tds: number;
  turbidity: number;
  temperature: number;
  flow_in: number;
  flow_out: number;
  flow_difference: number;
  water_quality_score: number;
}

export interface SystemSettings {
  device_id: string;
  mqtt_broker_url: string;
  mqtt_port: number;
  mqtt_username: string;
  mqtt_password?: string;
  api_url: string;
  database_url: string;
  simulation_mode: boolean;
  simulation_speed_multiplier: number;
  fault_injection: {
    clog_filter: boolean;
    turbidity_spike: boolean;
    sensor_drift: boolean;
    pump_overheat: boolean;
  };
  thresholds: {
    ph_min: number;
    ph_max: number;
    tds_max: number;
    turbidity_max: number;
    temp_max: number;
    flow_loss_max_percent: number;
    tank_low_level: number;
    tank_high_level: number;
  };
  ai: {
    auto_inference: boolean;
    confidence_threshold: number;
    anomaly_sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}
