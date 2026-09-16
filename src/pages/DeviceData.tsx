import React, { useState, useEffect } from 'react';
import { PipelineStage } from '../types/hydroguard';
import { Cpu, Wifi, Server, Database, BrainCircuit, LayoutDashboard, ArrowRight, AlertTriangle } from 'lucide-react';
import { telemetryService, AppState } from '../services/telemetryService';

export function DeviceData() {
  const [appState, setAppState] = useState<AppState>({ telemetry: null, ai: null, system: null });

  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((state) => {
      setAppState({ ...state });
    });
    return unsubscribe;
  }, []);

  const { system, telemetry } = appState;
  const isDisconnected = system && !system.simulation_mode && (!system.esp32_connected || !system.mqtt_connected);

  // Use real data where possible for the pipeline visualization
  const stages: PipelineStage[] = [
    { id: 'esp32', title: 'ESP32 Edge Device', subTitle: 'DevKit V1 / Sensor Array', connected: system?.esp32_connected ?? false, lastPing: '0ms ago', latencyMs: 12, packetCount: 45291, errorRate: 0.01 },
    { id: 'mqtt', title: 'Local MQTT Server', subTitle: 'LAN / Mosquitto 1883', connected: system?.mqtt_connected ?? false, lastPing: '1ms ago', latencyMs: 2, packetCount: 45291, errorRate: 0.00 },
    { id: 'backend', title: 'Express & Node Ingest', subTitle: 'Ingestion & Rules Engine', connected: system?.backend_connected ?? true, lastPing: '0ms ago', latencyMs: 4, packetCount: 45289, errorRate: 0.05 },
    { id: 'database', title: 'Supabase Cloud DB', subTitle: 'Anon Ingestion Active', connected: system?.database_connected ?? false, lastPing: '120ms ago', latencyMs: 95, packetCount: 12400, errorRate: 0.00 },
    { id: 'ai', title: 'Python AI Engine', subTitle: 'RandomForest V3 Model', connected: system?.ai_engine_connected ?? false, lastPing: '850ms ago', latencyMs: 150, packetCount: 3200, errorRate: 0.12 },
    { id: 'dashboard', title: 'React Dashboard', subTitle: 'Client Interface', connected: true, lastPing: '0ms ago', latencyMs: 25, packetCount: 45289, errorRate: 0.00 },
  ];

  const getIcon = (id: string) => {
    switch (id) {
      case 'esp32': return <Cpu size={24} />;
      case 'mqtt': return <Wifi size={24} />;
      case 'backend': return <Server size={24} />;
      case 'database': return <Database size={24} />;
      case 'ai': return <BrainCircuit size={24} />;
      case 'dashboard': return <LayoutDashboard size={24} />;
      default: return <Server size={24} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0A0A0A] p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-white mb-1">Device & Data Pipeline</h1>
           <p className="text-sm text-gray-400">End-to-end system telemetry architecture</p>
        </div>
      </div>

      <div className="bg-[#141414] rounded-2xl border border-white/5 p-8 mb-8">
         <h2 className="font-semibold text-white mb-8">Live Data Flow Architecture</h2>
         
         <div className="flex items-center justify-between">
           {stages.map((stage, i) => (
             <React.Fragment key={stage.id}>
               <div className="flex flex-col items-center w-40 relative group">
                  <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center mb-4 transition-all ${stage.connected ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                    {getIcon(stage.id)}
                  </div>
                  <h3 className="text-sm font-semibold text-white text-center">{stage.title}</h3>
                  <p className="text-[10px] text-gray-500 text-center mt-1">{stage.subTitle}</p>
                  
                  {/* Detailed Tooltip on hover */}
                  <div className="absolute top-20 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0D0D0D] border border-white/10 p-3 rounded-lg w-48 z-10 shadow-2xl pointer-events-none">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-xs text-gray-400 uppercase">Status</span>
                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stage.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                         {stage.connected ? 'ONLINE' : 'OFFLINE'}
                       </span>
                     </div>
                     <div className="space-y-1 mt-3">
                       <div className="flex justify-between text-xs">
                         <span className="text-gray-500">Latency</span>
                         <span className="text-gray-300 font-mono">{stage.latencyMs}ms</span>
                       </div>
                       <div className="flex justify-between text-xs">
                         <span className="text-gray-500">Packets</span>
                         <span className="text-gray-300 font-mono">{stage.packetCount.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                         <span className="text-gray-500">Error Rate</span>
                         <span className="text-gray-300 font-mono">{stage.errorRate}%</span>
                       </div>
                     </div>
                  </div>
               </div>

               {i < stages.length - 1 && (
                 <div className="flex-1 flex items-center justify-center -mx-4 z-0">
                    <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
                       {stage.connected && stages[i+1].connected && (
                          <div className="absolute top-0 left-0 h-full w-1/2 bg-cyan-500/50 animate-[flow_1s_linear_infinite]"></div>
                       )}
                    </div>
                    <ArrowRight size={14} className="text-gray-600 absolute ml-4" />
                 </div>
               )}
             </React.Fragment>
           ))}
         </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
         <div className={`bg-[#141414] rounded-2xl border border-white/5 p-6 relative ${isDisconnected ? 'grayscale opacity-60 pointer-events-none' : ''}`}>
            {isDisconnected && <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px] bg-black/40"><span className="text-rose-500 font-bold tracking-widest text-sm border border-rose-500/50 bg-rose-500/10 px-3 py-1 rounded-full">OFFLINE</span></div>}
            <h2 className="font-semibold text-white mb-6">ESP32 Device Status</h2>
            <div className="space-y-4">
               <div className="flex justify-between items-center pb-3 border-b border-white/5">
                 <span className="text-sm text-gray-400">Device ID</span>
                 <span className="text-sm text-gray-200 font-mono">HYDROGUARD-ESP32-01</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-white/5">
                 <span className="text-sm text-gray-400">Firmware Version</span>
                 <span className="text-sm text-gray-200 font-mono">v1.2.4-stable</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-white/5">
                 <span className="text-sm text-gray-400">Free Heap Memory</span>
                 <span className="text-sm text-emerald-400 font-mono">124.5 KB</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-white/5">
                 <span className="text-sm text-gray-400">Wi-Fi RSSI</span>
                 <span className="text-sm text-amber-400 font-mono">-65 dBm (Good)</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-white/5">
                 <span className="text-sm text-gray-400">Uptime</span>
                 <span className="text-sm text-gray-200 font-mono">14d 02h 45m</span>
               </div>
            </div>
         </div>
         
         <div className={`bg-[#141414] rounded-2xl border border-white/5 p-6 relative ${isDisconnected ? 'grayscale opacity-60 pointer-events-none' : ''}`}>
            {isDisconnected && <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px] bg-black/40"><span className="text-rose-500 font-bold tracking-widest text-sm border border-rose-500/50 bg-rose-500/10 px-3 py-1 rounded-full">OFFLINE</span></div>}
            <h2 className="font-semibold text-white mb-6">MQTT Event Log</h2>
            <div className="flex-1 bg-black/50 border border-white/5 rounded-lg p-4 font-mono text-[10px] h-[240px] overflow-y-auto">
               <div className="text-cyan-500/70 mb-2">Connecting to wss://broker.hivemq.com:8000/mqtt...</div>
               <div className="text-emerald-500/70 mb-2">Connected. Subscribing to hydroguard/+/telemetry</div>
               <div className="text-gray-400 mb-1">[{new Date().toLocaleTimeString()}] MSG: hydroguard/HYDROGUARD-ESP32-01/telemetry</div>
               <div className="text-gray-600 pl-4 mb-2">{"{ raw_level: 65.4, clean_level: 42.8, pump: true ... }"}</div>
               <div className="text-gray-400 mb-1">[{new Date().toLocaleTimeString()}] MSG: hydroguard/HYDROGUARD-ESP32-01/status</div>
               <div className="text-gray-600 pl-4 mb-2">{"{ heap: 124500, rssi: -65, status: 'nominal' }"}</div>
               <div className="text-amber-500/70 mb-1">[{new Date().toLocaleTimeString()}] PUB: hydroguard/HYDROGUARD-ESP32-01/actuator/pump</div>
               <div className="text-amber-600/70 pl-4 mb-2">{"{ state: true, user: 'dashboard' }"}</div>
               <div className="text-gray-400 mb-1">[{new Date().toLocaleTimeString()}] MSG: hydroguard/HYDROGUARD-ESP32-01/telemetry</div>
               <div className="text-gray-600 pl-4 mb-2">{"{ raw_level: 65.3, clean_level: 42.9, pump: true ... }"}</div>
            </div>
         </div>
      </div>
    </div>
  );
}
