import React, { useState, useEffect } from 'react';
import { KpiCard } from '../components/KpiCard';
import { SensorTelemetry, AiPredictionResult, SystemHealthMetrics } from '../types/hydroguard';
import { telemetryService, AppState } from '../services/telemetryService';
import { Power, AlertTriangle, Droplets } from 'lucide-react';

import { PumpControlButton } from '../components/PumpControlButton';

export function Dashboard() {
  const [appState, setAppState] = useState<AppState>({ telemetry: null, ai: null, system: null });

  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((state) => {
      setAppState({ ...state });
    });
    return unsubscribe;
  }, []);

  const { telemetry, ai: aiResult, system } = appState;

  if (!telemetry || !system) return <div className="p-10 text-gray-500 flex flex-col items-center justify-center h-full gap-4">
    <div className="animate-pulse w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
    <span>Initializing telemetry stream...</span>
  </div>;

  const isDisconnected = !system.simulation_mode && (!system.esp32_connected || !system.mqtt_connected);

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="grid grid-cols-4 gap-6 mb-8">
        <KpiCard 
          title="pH Level" 
          value={isDisconnected ? '--' : telemetry.ph.toFixed(2)} 
          status={isDisconnected ? 'OFFLINE' : telemetry.ph >= 6.8 && telemetry.ph <= 7.8 ? 'ONLINE' : 'WARNING'}
        />
        <KpiCard 
          title="TDS" 
          value={isDisconnected ? '--' : telemetry.tds.toFixed(1)} 
          unit={isDisconnected ? '' : 'ppm'}
          status={isDisconnected ? 'OFFLINE' : telemetry.tds <= 300 ? 'ONLINE' : 'WARNING'}
        />
        <KpiCard 
          title="Turbidity" 
          value={isDisconnected ? '--' : telemetry.turbidity.toFixed(2)} 
          unit={isDisconnected ? '' : 'NTU'}
          status={isDisconnected ? 'OFFLINE' : telemetry.turbidity <= 5 ? 'ONLINE' : 'WARNING'}
        />
        <KpiCard 
          title="Flow In" 
          value={isDisconnected ? '--' : telemetry.flow_in.toFixed(1)} 
          unit={isDisconnected ? '' : 'L/m'}
          status={isDisconnected ? 'OFFLINE' : telemetry.pump ? 'ONLINE' : 'OFFLINE'}
        />
        <KpiCard 
          title="Temperature" 
          value={isDisconnected ? '--' : telemetry.temperature.toFixed(1)} 
          unit={isDisconnected ? '' : '°C'}
          status={isDisconnected ? 'OFFLINE' : telemetry.temperature >= 15 && telemetry.temperature <= 35 ? 'ONLINE' : 'WARNING'}
        />
        <KpiCard 
          title="Raw Tank Level" 
          value={isDisconnected ? '--' : telemetry.raw_level.toFixed(0)} 
          unit={isDisconnected ? '' : '%'}
          status={isDisconnected ? 'OFFLINE' : telemetry.raw_level >= 20 ? 'ONLINE' : 'WARNING'}
        />
        <KpiCard 
          title="Clean Tank Level" 
          value={isDisconnected ? '--' : telemetry.clean_level.toFixed(0)} 
          unit={isDisconnected ? '' : '%'}
          status={isDisconnected ? 'OFFLINE' : telemetry.clean_level >= 20 ? 'ONLINE' : 'WARNING'}
        />
        <KpiCard 
          title="Flow Out" 
          value={isDisconnected ? '--' : telemetry.flow_out.toFixed(1)} 
          unit={isDisconnected ? '' : 'L/m'}
          status={isDisconnected ? 'OFFLINE' : telemetry.valve2 ? 'ONLINE' : 'OFFLINE'}
        />
      </div>

      <div className="flex gap-6 h-[calc(100%-160px)]">
        {/* Main Digital Twin / Flow area */}
        <div className="flex-[2] bg-[#141414] rounded-2xl border border-white/5 p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 z-10">
            <h2 className="font-semibold text-[#E5E7EB]">Digital Twin Live Flow</h2>
            {system.simulation_mode ? (
              <div className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full uppercase border border-amber-500/20 tracking-wider">
                SIMULATION MODE
              </div>
            ) : isDisconnected ? (
              <div className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded-full uppercase border border-rose-500/20 tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={12} />
                ESP32 DISCONNECTED
              </div>
            ) : (
              <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-full uppercase border border-indigo-500/20 tracking-wider">
                LIVE MODE
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/[0.02] rounded-xl border border-white/5 relative z-10 overflow-hidden">
            {isDisconnected && (
              <div className="absolute inset-0 z-50 bg-[#141414]/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Power size={48} className="text-rose-500/50 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">PROTOTYPE DISCONNECTED</h3>
                <p className="text-sm text-gray-400 max-w-md text-center">
                  The dashboard is not receiving data. Please ensure the ESP32 prototype is powered on and connected to the MQTT broker.
                </p>
              </div>
            )}
            
            <div className={`w-full flex items-center justify-between gap-4 ${isDisconnected ? 'opacity-20 grayscale' : ''}`}>
              
              {/* Raw Tank */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-40 border border-white/10 rounded-lg bg-[#0A0A0A] relative overflow-hidden flex items-end justify-center">
                  <div 
                    className="w-full bg-indigo-500/20 border-t border-indigo-500/40 transition-all duration-1000" 
                    style={{ height: `${telemetry.raw_level}%` }}
                  ></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-white/50 font-mono mb-1">{telemetry.raw_level.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Raw Tank</span>
              </div>

              {/* Pump & Line */}
              <div className="flex-1 flex flex-col items-center relative">
                 <span className="text-[10px] text-gray-500 mb-2">Flow In: {telemetry.flow_in.toFixed(1)} L/m</span>
                 <div className="h-1 w-full bg-white/5 relative overflow-hidden rounded-full">
                    {telemetry.pump && (
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-indigo-500 animate-[pulse_1.5s_linear_infinite]"></div>
                    )}
                 </div>
                 <div className={`mt-3 px-3 py-1 rounded-full border text-[10px] uppercase font-bold tracking-widest ${telemetry.pump ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-[#141414] border-white/10 text-gray-500'}`}>
                    Pump {telemetry.pump ? 'ON' : 'OFF'}
                 </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mx-2">
                {['Gravel', 'Sand', 'Carbon'].map((f, i) => (
                   <div key={f} className="flex flex-col items-center">
                      <div className={`w-12 h-28 border rounded-md mb-2 flex flex-col justify-end p-1 ${telemetry.pump ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/10 bg-[#0A0A0A]'}`}>
                         {telemetry.pump && <div className="flex-1 bg-indigo-500/10 w-full animate-pulse rounded-sm"></div>}
                      </div>
                      <span className="text-[9px] text-gray-400 uppercase font-mono">{f}</span>
                   </div>
                ))}
              </div>

              {/* Flow Path Out */}
              <div className="flex-1 flex flex-col items-center relative">
                 <span className="text-[10px] text-gray-500 mb-2">Flow Out: {telemetry.flow_out.toFixed(1)} L/m</span>
                 <div className="h-1 w-full bg-white/5 relative overflow-hidden rounded-full">
                    {telemetry.flow_out > 0 && (
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-indigo-400 animate-[pulse_1.5s_linear_infinite]"></div>
                    )}
                 </div>
                 <div className={`mt-3 px-3 py-1 rounded-full border text-[10px] uppercase font-bold tracking-widest ${telemetry.valve2 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    Valve 2 {telemetry.valve2 ? 'OPEN' : 'CLOSED'}
                 </div>
              </div>

              {/* Clean Tank */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-40 border border-indigo-500/20 rounded-lg bg-[#0A0A0A] relative overflow-hidden flex items-end justify-center shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                  <div 
                    className="w-full bg-indigo-500/30 border-t border-indigo-400 transition-all duration-1000" 
                    style={{ height: `${telemetry.clean_level}%` }}
                  ></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-white/70 font-mono mb-1">{telemetry.clean_level.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Clean Tank</span>
              </div>
              
            </div>
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex-[1.5] bg-[#141414] rounded-2xl border border-white/5 p-6 flex flex-col">
            <h2 className="font-semibold mb-4 text-[#E5E7EB] text-sm uppercase tracking-wider flex items-center justify-between">
              <span>AI Intelligence</span>
              <Droplets size={16} className="text-indigo-400 opacity-70" />
            </h2>
            {system.ai_status === 'ERROR' || system.ai_engine_connected === false ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                 <AlertTriangle size={32} className="text-rose-500 mb-3 opacity-80" />
                 <p className="text-sm font-bold text-rose-400 mb-1">AI ERROR / OFFLINE</p>
                 <p className="text-xs text-gray-500">{system.ai_error || "Model unavailable or disconnected"}</p>
               </div>
            ) : aiResult ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1 font-medium">Model: Random Forest | Status: ONLINE</p>
                  <p className="text-xs text-indigo-400 mb-2">Inference: LIVE</p>
                  <div className="flex justify-between items-end mt-1">
                    <span className={`text-xl font-bold tracking-tight ${aiResult.water_quality === 'EXCELLENT' ? 'text-indigo-400' : aiResult.water_quality === 'GOOD' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {aiResult.water_quality}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">CONF {aiResult.confidence}%</span>
                  </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex-1 flex flex-col">
                  <p className="text-xs text-gray-400 mb-2 font-medium">Recommended Action</p>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {aiResult.recommended_action || "Maintain current operating parameters."}
                  </p>
                  {aiResult.anomaly_type && aiResult.anomaly_type !== 'NONE' && (
                    <div className="mt-3 flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{aiResult.anomaly_details || 'Anomaly detected'}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                Awaiting Model Inference...
              </div>
            )}
          </div>

          <div className="flex-1 bg-[#141414] rounded-2xl border border-white/5 p-6 flex flex-col">
            <h2 className="font-semibold mb-4 text-[#E5E7EB] text-sm uppercase tracking-wider flex items-center justify-between">
              <span>Actuators</span>
              <Power size={16} className="text-gray-500 opacity-70" />
            </h2>
            <div className={`space-y-3 ${isDisconnected ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl relative">
                <span className="text-sm font-medium text-gray-300">Main Pump</span>
                <PumpControlButton isDisconnected={isDisconnected} isActive={telemetry.pump} />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-sm font-medium text-gray-300">Solenoid 1 (Bypass)</span>
                <button 
                  disabled={isDisconnected}
                  onClick={() => telemetryService.setSolenoid1(!telemetry.valve1)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${telemetry.valve1 && !isDisconnected ? 'bg-amber-500' : 'bg-[#0A0A0A] border border-white/10'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${telemetry.valve1 && !isDisconnected ? 'left-6 shadow-sm shadow-amber-900' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
