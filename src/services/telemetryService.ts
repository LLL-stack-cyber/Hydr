import { SensorTelemetry, AiPredictionResult, SystemHealthMetrics } from '../types/hydroguard';

export interface AppState {
  telemetry: SensorTelemetry | null;
  ai: AiPredictionResult | null;
  system: SystemHealthMetrics | null;
}

class TelemetryService {
  private listeners: ((data: AppState) => void)[] = [];
  private ackListeners: ((ack: {topic: string, message: string}) => void)[] = [];
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private state: AppState = {
    telemetry: null,
    ai: null,
    system: null
  };

  constructor() {
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // When running behind Vite dev server or proxy, connect to current host
    this.ws = new WebSocket(`${protocol}//${window.location.host}/ws/live`);

    this.ws.onopen = () => {
      console.log('WebSocket connected to backend');
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'TELEMETRY_UPDATE') {
          this.state = {
            telemetry: payload.telemetry,
            ai: payload.ai,
            system: payload.system
          };
          this.notify();
        } else if (payload.type === 'STATUS_ACK') {
          this.notifyAcks({ topic: payload.topic, message: payload.message });
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected. Reconnecting in 3s...');
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      
      if (this.state.system) {
         this.state.system.backend_connected = false;
         this.notify();
      }
    };
    
    this.ws.onerror = (error) => {
       console.error("WebSocket error", error);
    };
  }

  public subscribe(callback: (data: AppState) => void) {
    this.listeners.push(callback);
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.state));
  }

  public subscribeToAcks(callback: (ack: {topic: string, message: string}) => void) {
    this.ackListeners.push(callback);
    return () => {
      this.ackListeners = this.ackListeners.filter(cb => cb !== callback);
    };
  }

  private notifyAcks(ack: {topic: string, message: string}) {
    this.ackListeners.forEach(cb => cb(ack));
  }

  public async togglePump(state?: boolean) {
    const currentState = state !== undefined ? state : !(this.state.telemetry?.pump);
    await fetch('/api/actuator/pump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: currentState })
    });
  }
  
  public async setSolenoid1(state: boolean) {
    await fetch('/api/actuator/valve1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state })
    });
  }
  
  public async setSolenoid2(state: boolean) {
    await fetch('/api/actuator/valve2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state })
    });
  }
}

export const telemetryService = new TelemetryService();
