import React, { useState, useEffect } from 'react';
import { Wifi, Database, BrainCircuit, Cpu } from 'lucide-react';
import { SystemHealthMetrics } from '../types/hydroguard';

function TimeAgo({ timestamp }: { timestamp: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(timestamp).getTime();
      setSeconds(Math.floor(ms / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>Last telemetry: {seconds} seconds ago</span>;
}

interface HeaderProps {
  systemHealth: any; // Using any or specific type that handles null
  isSimulation: boolean;
  deviceId: string;
  lastUpdate?: string;
}

export function Header({ systemHealth, isSimulation, deviceId, lastUpdate }: HeaderProps) {
  const StatusBadge = ({ label, active, icon: Icon }: { label: string; active: boolean; icon: React.ElementType }) => (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] uppercase font-bold tracking-wider ${active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
      <Icon size={12} />
      <span>{label}</span>
    </div>
  );

  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#0D0D0D]">
      <div className="flex flex-col">
        <h1 className="text-lg font-medium text-white flex items-center gap-3">
          Overview 
          {isSimulation && (
             <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] uppercase tracking-widest font-bold">
               Simulation Mode
             </span>
          )}
          {!isSimulation && (
             <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase tracking-widest font-bold">
               Live
             </span>
          )}
        </h1>
        <p className="text-xs text-gray-500">Autonomous Water Reclamation & Safety Platform</p>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge label="ESP32" active={systemHealth?.esp32_connected || false} icon={Cpu} />
        <StatusBadge label="MQTT" active={systemHealth?.mqtt_connected || false} icon={Wifi} />
        <StatusBadge label="DB" active={systemHealth?.database_connected || false} icon={Database} />
        <StatusBadge label="AI" active={systemHealth?.ai_engine_connected || false} icon={BrainCircuit} />
        
        <div className="ml-4 pl-4 border-l border-white/10 flex flex-col items-end">
           <span className="text-xs text-gray-400 font-mono">{deviceId}</span>
           <span className="text-[10px] text-gray-500">
             {lastUpdate ? <TimeAgo timestamp={lastUpdate} /> : 'Awaiting data...'}
           </span>
        </div>
      </div>
    </header>
  );
}
