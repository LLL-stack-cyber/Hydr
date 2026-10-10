import React, { useState } from 'react';
import { Settings2, Save, RefreshCw, Download, Database, ShieldAlert, Cpu } from 'lucide-react';

export function Settings() {
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [trainingState, setTrainingState] = useState<'idle' | 'training' | 'complete'>('idle');
  const [trainingProgress, setTrainingProgress] = useState(0);

  const [serverHost, setServerHost] = useState('wss://broker.hivemq.com:8884/mqtt');
  const [serverPort, setServerPort] = useState('8884');
  const [deviceId, setDeviceId] = useState('HYDROGUARD-ESP32-01');
  const [telemetryTopic, setTelemetryTopic] = useState('hydroguard_shreyas_insef26/telemetry');
  const [controlTopic, setControlTopic] = useState('hydroguard_shreyas_insef26/control');
  const [supabaseUrl, setSupabaseUrl] = useState('https://fuuefqovodauzarvahiy.supabase.co');
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('hydroguard_mqtt_creds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.serverHost) setServerHost(parsed.serverHost);
        else if (parsed.brokerUrl) setServerHost(parsed.brokerUrl.replace('mqtt://', ''));
        if (parsed.port) setServerPort(parsed.port);
        if (parsed.deviceId) setDeviceId(parsed.deviceId);
        if (parsed.telemetryTopic) setTelemetryTopic(parsed.telemetryTopic);
        if (parsed.controlTopic) setControlTopic(parsed.controlTopic);
        if (parsed.supabaseUrl) setSupabaseUrl(parsed.supabaseUrl);
        if (parsed.supabaseServiceRoleKey) setSupabaseServiceRoleKey(parsed.supabaseServiceRoleKey);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  const handleSaveConfig = async () => {
    localStorage.setItem('hydroguard_mqtt_creds', JSON.stringify({
      serverHost,
      port: serverPort,
      deviceId,
      telemetryTopic,
      controlTopic,
      supabaseUrl,
      supabaseServiceRoleKey
    }));

    try {
      await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker_url: serverHost,
          port: serverPort,
          device_id: deviceId,
          telemetry_topic: telemetryTopic,
          control_topic: controlTopic,
          supabase_url: supabaseUrl,
          supabase_service_role_key: supabaseServiceRoleKey
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to apply settings to backend", e);
    }
  };

  const handleTrainModel = async () => {
    alert('Model training is managed externally via Python scripts in the live architecture. Update AI_MODEL_PATH after training.');
  };

  const handleSimulationSpeedChange = (val: number) => {
    setSimulationSpeed(val);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0A0A0A] p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-white mb-1">Configuration & Tools</h1>
           <p className="text-sm text-gray-400">System parameters, AI management, and data export</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
         
         {/* Simulation Controls */}
         <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 flex flex-col">
            <h2 className="font-semibold text-white mb-6 flex items-center gap-2">
              <Cpu size={18} className="text-amber-400" /> Digital Twin Simulation
            </h2>
            
            <div className="space-y-6 flex-1">
               <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3 block">Simulation Speed Multiplier</label>
                  <div className="flex items-center gap-4">
                     <input 
                       type="range" 
                       min="0.5" max="5" step="0.5" 
                       value={simulationSpeed} 
                       onChange={(e) => handleSimulationSpeedChange(parseFloat(e.target.value))}
                       className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                     />
                     <span className="text-amber-400 font-mono font-bold w-12">{simulationSpeed}x</span>
                  </div>
               </div>
               
               <div className="pt-4 border-t border-white/5">
                 <label className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3 block">Fault Injection (Stress Testing)</label>
                 <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-white/20 group-hover:border-white/50 flex items-center justify-center"></div>
                      <span className="text-sm text-gray-300">Simulate Filter Clog (High Flow Resistance)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-white/20 group-hover:border-white/50 flex items-center justify-center"></div>
                      <span className="text-sm text-gray-300">Simulate Turbidity Spike (Raw Water Contamination)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-white/20 group-hover:border-white/50 flex items-center justify-center"></div>
                      <span className="text-sm text-gray-300">Simulate pH Sensor Drift</span>
                    </label>
                 </div>
               </div>
            </div>
         </div>
         
         {/* AI Engine Management */}
         <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 flex flex-col">
            <h2 className="font-semibold text-white mb-6 flex items-center gap-2">
              <ShieldAlert size={18} className="text-indigo-400" /> Random Forest Engine
            </h2>
            
            <div className="space-y-6 flex-1">
               <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                 <h3 className="text-sm font-medium text-indigo-300 mb-2">Model Retraining Pipeline</h3>
                 <p className="text-xs text-gray-500 mb-4">
                   Triggers a new RandomForestClassifier training job on the backend using the latest 2,800 validated telemetry samples.
                 </p>
                 
                 {trainingState === 'idle' && (
                   <button 
                     onClick={handleTrainModel}
                     className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                   >
                     <RefreshCw size={14} /> Train New Model
                   </button>
                 )}
                 
                 {trainingState === 'training' && (
                   <div className="w-full">
                      <div className="flex justify-between text-xs mb-2">
                         <span className="text-indigo-400">Training across 100 trees...</span>
                         <span className="text-indigo-400 font-mono">{trainingProgress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 transition-all duration-75" style={{ width: `${trainingProgress}%` }}></div>
                      </div>
                   </div>
                 )}
                 
                 {trainingState === 'complete' && (
                   <div className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-widest text-center">
                     Model Updated Successfully
                   </div>
                 )}
               </div>
               
               <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3 block">Anomaly Sensitivity Limit</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 outline-none focus:border-indigo-500/50">
                    <option>High Sensitivity (Early Warning)</option>
                    <option>Balanced (Standard operation)</option>
                    <option>Low Sensitivity (Reduce false positives)</option>
                  </select>
               </div>
            </div>
         </div>
         
         {/* Hardware Connection Config */}
         <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 flex flex-col col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Database size={18} className="text-cyan-400" /> MQTT Local Server & Supabase Configuration
              </h2>
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                  Configuration Saved & Applied
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1 block">MQTT Local Server (IP or Hostname)</label>
                    <input 
                      type="text" 
                      value={serverHost} 
                      onChange={(e) => setServerHost(e.target.value)}
                      placeholder="127.0.0.1 or 192.168.1.X"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" 
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">Local server IP on LAN (e.g. Raspberry Pi Mosquitto)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium mb-1 block">MQTT Port</label>
                      <input 
                        type="text" 
                        value={serverPort} 
                        onChange={(e) => setServerPort(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium mb-1 block">Device ID</label>
                      <input 
                        type="text" 
                        value={deviceId} 
                        onChange={(e) => setDeviceId(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium mb-1 block">Telemetry Topic</label>
                      <input 
                        type="text" 
                        value={telemetryTopic} 
                        onChange={(e) => setTelemetryTopic(e.target.value)}
                        placeholder="hydroguard/telemetry"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium mb-1 block">Control Topic</label>
                      <input 
                        type="text" 
                        value={controlTopic} 
                        onChange={(e) => setControlTopic(e.target.value)}
                        placeholder="hydroguard/control"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" 
                      />
                    </div>
                  </div>
               </div>
               
               <div className="space-y-4 flex flex-col">
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1 block">Supabase Project URL</label>
                    <input 
                      type="text" 
                      value={supabaseUrl} 
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyz.supabase.co" 
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-400 font-medium block">Supabase Service Role Key (Public Key)</label>
                      <span className="text-[10px] text-emerald-400 font-mono">Accepts Anonymous Enters</span>
                    </div>
                    <input 
                      type="password" 
                      value={supabaseServiceRoleKey} 
                      onChange={(e) => setSupabaseServiceRoleKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500" 
                    />
                  </div>
                  
                  <div className="mt-auto pt-2 flex gap-4">
                    <button 
                      onClick={handleSaveConfig}
                      className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <Save size={14} /> Apply & Save Configuration
                    </button>
                  </div>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}
