import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Zap,
  Scale,
  ShieldCheck,
  CheckCircle2,
  X,
  RefreshCw,
  Cpu,
  Database,
  Wifi,
  WifiOff,
  Server,
  ShieldAlert,
  Gauge,
  Radio,
  Play,
  RotateCcw,
  Layers,
  Terminal,
  Droplets,
  Flame,
  Wrench,
  Share2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface SparklinePoint {
  time: string;
  flow: number;
  pressure: number;
  turbidity: number;
}

export function SwarmCommandCenter() {
  // System State
  const [pumpActive, setPumpActive] = useState<boolean>(true);
  const [mqttConnected, setMqttConnected] = useState<boolean>(true);
  const [bufferQueue, setBufferQueue] = useState<number>(0);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Telemetry state with jitter
  const [pressure, setPressure] = useState<number>(0.85); // bar
  const [flowRate, setFlowRate] = useState<number>(1.85); // L/min
  const [turbidity, setTurbidity] = useState<number>(1.2); // NTU
  const [tds, setTds] = useState<number>(285); // ppm
  const [ph, setPh] = useState<number>(7.15); // pH
  const [rawLevel, setRawLevel] = useState<number>(74.2); // %
  const [cleanLevel, setCleanLevel] = useState<number>(88.5); // %
  const [carbonDeltaP, setCarbonDeltaP] = useState<number>(0.12); // bar
  const [uvStatus, setUvStatus] = useState<string>('254 nm ACTIVE');
  const [bypassActive, setBypassActive] = useState<boolean>(false);

  // Federated Swarm State
  const [federatedRound, setFederatedRound] = useState<number>(14);
  const [globalWeightSyncTime, setGlobalWeightSyncTime] = useState<string>('12s ago');

  // AI & Scenario state
  const [aiClassification, setAiClassification] = useState<'NOMINAL_FLOW' | 'BED_COMPACTION_CLOG' | 'SENSOR_DRIFT_ALGAE' | 'SEAL_PRESSURE_RISK'>('NOMINAL_FLOW');
  const [aiConfidence, setAiConfidence] = useState<number>(98.2);
  const [activeScenario, setActiveScenario] = useState<string>('Nominal Operating Conditions');
  const [activityLogs, setActivityLogs] = useState<string[]>([
    '[00:00:01] Master Node ESP32-01 initialized successfully.',
    '[00:00:03] MQTT Broker connected at broker.hive.local:1883',
    '[00:00:05] Supabase RLS connection verified. Zero packets buffered.'
  ]);

  // Sparkline history data (60s rolling)
  const [sparklineData, setSparklineData] = useState<SparklinePoint[]>([
    { time: '-60s', flow: 1.8, pressure: 0.82, turbidity: 1.1 },
    { time: '-50s', flow: 1.85, pressure: 0.85, turbidity: 1.2 },
    { time: '-40s', flow: 1.82, pressure: 0.84, turbidity: 1.2 },
    { time: '-30s', flow: 1.87, pressure: 0.86, turbidity: 1.3 },
    { time: '-20s', flow: 1.84, pressure: 0.85, turbidity: 1.2 },
    { time: '-10s', flow: 1.85, pressure: 0.85, turbidity: 1.2 },
    { time: 'NOW', flow: 1.85, pressure: 0.85, turbidity: 1.2 }
  ]);

  // Simulation effect for telemetry jitter & MQTT buffer accumulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (pumpActive) {
        const jitterP = (Math.random() - 0.5) * 0.03;
        const jitterF = (Math.random() - 0.5) * 0.05;
        const jitterT = (Math.random() - 0.5) * 0.08;

        setPressure(prev => Math.max(0.1, parseFloat((prev + jitterP * (activeScenario.includes('Seal') ? 0.2 : 0.05)).toFixed(2))));
        setFlowRate(prev => Math.max(0.0, parseFloat((prev + jitterF).toFixed(2))));
        setTurbidity(prev => Math.max(0.1, parseFloat((prev + jitterT).toFixed(2))));

        setSparklineData(prev => {
          const next = [...prev.slice(1), {
            time: 'NOW',
            flow: flowRate,
            pressure: pressure,
            turbidity: turbidity
          }];
          return next;
        });
      }

      if (!mqttConnected) {
        setBufferQueue(prev => prev + 1);
        addActivityLog(`[OFFLINE BUFFER] Packet queued to SQLite WAL (-/edge_buffer.db). Total: ${bufferQueue + 1}`);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pumpActive, mqttConnected, activeScenario, flowRate, pressure, turbidity, bufferQueue]);

  const addActivityLog = (msg: string) => {
    setActivityLogs(prev => [msg, ...prev.slice(0, 15)]);
  };

  const handleToggleMqtt = () => {
    if (mqttConnected) {
      setMqttConnected(false);
      addActivityLog('[NETWORK ALERT] MQTT connection lost. Switching to Local SQLite Edge Buffer.');
    } else {
      setMqttConnected(true);
      const flushedCount = bufferQueue;
      setBufferQueue(0);
      setSyncToast(`Synced ${flushedCount} packets to Supabase Cloud RLS successfully!`);
      addActivityLog(`[SYNC OK] SQLite Buffer flushed. ${flushedCount} packets uploaded to Supabase.`);
      setTimeout(() => setSyncToast(null), 5000);
    }
  };

  const handleEmergencyShutoff = () => {
    setPumpActive(false);
    setBypassActive(true);
    setEmergencyModalOpen(true);
    addActivityLog('[CRITICAL EMERGENCY] SYSTEM_HALT executed. Pump disabled, high-pressure bypass open.');
  };

  const handleTriggerNode03Anomaly = () => {
    setFederatedRound(prev => prev + 1);
    setGlobalWeightSyncTime('Just now');
    setAiClassification('BED_COMPACTION_CLOG');
    setAiConfidence(95.6);
    addActivityLog('Node-03 detected novel plume -> Global weights aggregated -> Node-01 model updated autonomously.');
    setSyncToast('Swarm Federated Anomaly Event: Node-03 plume learned globally across all nodes!');
    setTimeout(() => setSyncToast(null), 6000);
  };

  const applyPreset = (preset: 'nominal' | 'clog' | 'algae' | 'seal') => {
    if (preset === 'nominal') {
      setActiveScenario('Nominal Operating Conditions');
      setPumpActive(true);
      setPressure(0.85);
      setFlowRate(1.85);
      setTurbidity(1.2);
      setTds(285);
      setPh(7.15);
      setCarbonDeltaP(0.12);
      setUvStatus('254 nm ACTIVE');
      setBypassActive(false);
      setAiClassification('NOMINAL_FLOW');
      setAiConfidence(98.4);
      addActivityLog('[SCENARIO] Applied Nominal Operating Conditions. AI Confidence 98.4%.');
    } else if (preset === 'clog') {
      setActiveScenario('Carbon Bed Compaction Clog');
      setPumpActive(true);
      setPressure(2.30);
      setFlowRate(0.12);
      setTurbidity(2.1);
      setCarbonDeltaP(1.85);
      setBypassActive(true);
      setAiClassification('BED_COMPACTION_CLOG');
      setAiConfidence(94.2);
      addActivityLog('[AI ALERT] Carbon bed compaction detected (Delta-P 1.85 bar). Activating bypass loop.');
    } else if (preset === 'algae') {
      setActiveScenario('Algal Bloom / Sensor Drift');
      setPumpActive(true);
      setPressure(0.88);
      setFlowRate(1.80);
      setTurbidity(45.0);
      setCarbonDeltaP(0.14);
      setBypassActive(false);
      setAiClassification('SENSOR_DRIFT_ALGAE');
      setAiConfidence(91.7);
      addActivityLog('[AI ALERT] Turbidity spike (45 NTU) with stable flow & pressure. Classified as Sensor Algae Drift, not filter blockage.');
    } else if (preset === 'seal') {
      setActiveScenario('Seal Pressure Risk / Rupture');
      setPumpActive(true);
      setPressure(7.45);
      setFlowRate(0.05);
      setTurbidity(1.5);
      setBypassActive(true);
      setAiClassification('SEAL_PRESSURE_RISK');
      setAiConfidence(99.1);
      addActivityLog('[CRITICAL ALERT] Pressure spike 7.45 bar! Seal failure imminent. Emergency failsafe recommended.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] text-zinc-100 font-mono overflow-y-auto p-6">
      
      {/* 1. TOP NAVIGATION & SYSTEM HEALTH HEADER */}
      <header className="border-b border-zinc-800 pb-5 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-cyan-400 flex items-center gap-2">
              <Cpu className="text-emerald-400 animate-pulse" size={26} />
              HYDROGUARD AI // SWARM COMMAND CENTER
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Master Node: ESP32-01 [ONLINE]
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 tracking-wide">
            Autonomous Water Reclamation IoT Digital Twin • Federated Edge Learning Node
          </p>
        </div>

        {/* System Metrics Bar & Emergency Actuation */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="hidden lg:flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <Server size={14} className={mqttConnected ? 'text-emerald-400' : 'text-amber-400'} />
              <span>MQTT: <strong className="text-zinc-200">broker.hive.local</strong> ({mqttConnected ? 'Active' : 'Offline'})</span>
            </div>
            <div className="w-px h-4 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <Database size={14} className="text-cyan-400" />
              <span>Supabase RLS: <strong className="text-emerald-400">Connected</strong></span>
            </div>
            <div className="w-px h-4 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-amber-400" />
              <span>Buffer Queue: <strong className="text-amber-400 font-mono">{bufferQueue} pkts</strong></span>
            </div>
          </div>

          <button
            onClick={handleEmergencyShutoff}
            className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all border border-rose-400/40 active:scale-95 animate-pulse"
          >
            <ShieldAlert size={18} />
            [EMERGENCY SHUTOFF]
          </button>
        </div>
      </header>

      {/* SWARM FLEET OVERVIEW BAR (Requirement #5) */}
      <div className="bg-zinc-900/80 border border-indigo-500/30 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Share2 size={16} />
            <span>Swarm Fleet:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
              Node-01 [Master - Physical]
            </span>
            <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
              Node-02 [Scout Residential - Sim]
            </span>
            <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
              Node-03 [Scout Industrial - Sim]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-300">
          <span className="text-indigo-300 font-bold">Federated Aggregation Cycle: Round #{federatedRound}</span>
          <span className="w-px h-4 bg-zinc-700" />
          <span className="text-cyan-300">Global Weight Sync: {globalWeightSyncTime}</span>
        </div>
      </div>

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3 rounded-xl mb-6 flex items-center justify-between text-xs font-bold animate-fade-in shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-emerald-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Emergency Modal Banner */}
      {emergencyModalOpen && (
        <div className="bg-rose-950/95 border-2 border-rose-600 text-rose-100 p-5 rounded-2xl mb-6 flex flex-col gap-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert size={28} className="text-rose-400 animate-bounce" />
              <div>
                <h3 className="font-black text-sm tracking-wider uppercase">SYSTEM FAILSAFE TRIGGERED</h3>
                <p className="text-xs text-rose-300">Pump power cut off, high-pressure bypass valve forced open.</p>
              </div>
            </div>
            <button
              onClick={() => { setEmergencyModalOpen(false); setPumpActive(true); setBypassActive(false); applyPreset('nominal'); }}
              className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            >
              Reset Failsafe & Resume
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT GRID (Left/Center Schematic vs Right Panel) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">

        {/* 2. LEFT / CENTER PANEL: DIGITAL TWIN PROCESS FLOW SCHEMATIC (Cols 1-7) */}
        <div className="xl:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={16} /> Digital Twin Process Flow Schematic
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Physical Apparatus & Fluidic Pathway Digital Twin</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase ${pumpActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                Pump: {pumpActive ? 'RUNNING (PWM 82%)' : 'HALTED'}
              </span>
            </div>
          </div>

          {/* Horizontal Process Pipeline Schematic */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 my-4 relative">
            
            {/* 1. Raw Reservoir */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center text-center relative group hover:border-cyan-500/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
                <Droplets size={20} />
              </div>
              <span className="text-xs font-bold text-zinc-200">Raw Tank</span>
              <span className="text-[10px] text-cyan-400 font-mono mt-1">{rawLevel.toFixed(1)}% Vol</span>
              <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-cyan-400 h-full transition-all" style={{ width: `${rawLevel}%` }} />
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="hidden md:flex items-center justify-center text-cyan-500/60 animate-pulse">
              ➔
            </div>

            {/* 2. Diaphragm Pump */}
            <div className={`bg-zinc-950/80 border rounded-xl p-3 flex flex-col items-center text-center relative group transition-all ${pumpActive ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-zinc-800'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${pumpActive ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 animate-spin-slow' : 'bg-zinc-800 text-zinc-500'}`}>
                <Activity size={20} />
              </div>
              <span className="text-xs font-bold text-zinc-200">Diaphragm Pump</span>
              <span className="text-[10px] text-emerald-400 font-mono mt-1">{flowRate.toFixed(2)} L/min</span>
              <span className="text-[9px] text-zinc-400 font-mono">{pressure.toFixed(2)} bar</span>
            </div>

            {/* Arrow 2 */}
            <div className="hidden md:flex items-center justify-center text-cyan-500/60 animate-pulse">
              ➔
            </div>

            {/* 3. Dual Carbon Columns */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center text-center relative group hover:border-indigo-500/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <Layers size={20} />
              </div>
              <span className="text-xs font-bold text-zinc-200">Carbon Bed</span>
              <span className="text-[10px] text-indigo-400 font-mono mt-1">ΔP: {carbonDeltaP.toFixed(2)} bar</span>
              <span className="text-[9px] text-zinc-400 mt-0.5">Granular Activated C</span>
            </div>

            {/* Arrow 3 */}
            <div className="hidden md:flex items-center justify-center text-cyan-500/60 animate-pulse">
              ➔
            </div>

            {/* 4. UV Reactor & Clean Tank */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center text-center relative group hover:border-emerald-500/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <Zap size={20} />
              </div>
              <span className="text-xs font-bold text-zinc-200">UV + Clean Tank</span>
              <span className="text-[10px] text-emerald-400 font-mono mt-1">{cleanLevel.toFixed(1)}% Full</span>
              <span className="text-[9px] text-emerald-300 mt-0.5">{uvStatus}</span>
            </div>

          </div>

          {/* Bypass Route Indicator Banner */}
          {bypassActive && (
            <div className="bg-amber-950/80 border border-amber-500/50 text-amber-300 p-3 rounded-xl mt-4 flex items-center justify-between text-xs font-bold animate-pulse">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <span>PRESSURE BYPASS LOOP ACTIVE: Recirculating flow back to Raw Reservoir (Bleed Valve Open).</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 font-mono">BYPASS</span>
            </div>
          )}

          {/* PHYSICAL RELAY CHANNEL STRIP (Requirement #5) */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2.5">
              Physical Relay Channel Strip (High-Voltage Board)
            </span>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 block">CH1 (Pump Power)</span>
                  <span className="font-bold text-emerald-400">{pumpActive ? 'ON' : 'OFF'}</span>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${pumpActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              </div>

              <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 block">CH2 (UV Chamber)</span>
                  <span className="font-bold text-emerald-400">ON</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 block">CH3 (Bypass Valve)</span>
                  <span className={`font-bold ${bypassActive ? 'text-amber-400' : 'text-zinc-400'}`}>
                    {bypassActive ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${bypassActive ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
              </div>
            </div>
          </div>

        </div>

        {/* 3. RIGHT PANEL: TELEMETRY GAUGES & FEDERATED AI ENGINE (Cols 8-12) */}
        <div className="xl:col-span-5 flex flex-col gap-6">

          {/* Telemetry Card Grid */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Gauge size={16} /> Real-Time Telemetry Matrix
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Inline Line Pressure Card */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400">Line Pressure</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${pressure > 2.0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {pressure > 2.0 ? 'HIGH' : 'OPTIMAL'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">{pressure.toFixed(2)}</span>
                  <span className="text-xs text-zinc-400">bar</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${pressure > 2.0 ? 'bg-rose-500' : 'bg-emerald-400'}`} 
                    style={{ width: `${Math.min(100, (pressure / 3.0) * 100)}%` }} 
                  />
                </div>
                <span className="text-[9px] text-zinc-500 mt-1">Safe target: 0.5 - 1.5 bar</span>
              </div>

              {/* Flow Rate Sparkline Card */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">Flow Rate</span>
                  <span className="text-xs font-mono text-cyan-400">{flowRate.toFixed(2)} L/m</span>
                </div>
                <div className="h-12 w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData}>
                      <defs>
                        <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="flow" stroke="#00ffcc" strokeWidth={2} fillOpacity={1} fill="url(#flowGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-[9px] text-zinc-500 mt-1">60-second rolling telemetry</span>
              </div>
            </div>

            {/* Water Quality Matrix */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">Turbidity</span>
                <span className={`text-base font-black font-mono ${turbidity > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {turbidity.toFixed(1)}
                </span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">NTU (&lt;5.0)</span>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">TDS</span>
                <span className="text-base font-black font-mono text-cyan-300">
                  {tds}
                </span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">ppm (&lt;500)</span>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">pH Level</span>
                <span className="text-base font-black font-mono text-amber-300">
                  {ph.toFixed(2)}
                </span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">Units (6.5-8.5)</span>
              </div>
            </div>

          </div>

          {/* Federated Machine Learning Card & Explainability Widget */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Cpu size={16} /> Federated AI Engine
                </h2>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
                  hydroguard_rf_model_v2.pkl
                </span>
              </div>

              {/* Classification Badge & Confidence */}
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400">Real-Time Classification:</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wide ${
                    aiClassification === 'NOMINAL_FLOW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    aiClassification === 'BED_COMPACTION_CLOG' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    aiClassification === 'SENSOR_DRIFT_ALGAE' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {aiClassification}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Confidence Threshold (&gt;75% Action Trigger):</span>
                  <span className="font-mono font-bold text-indigo-400">{aiConfidence}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${aiConfidence}%` }} />
                </div>
              </div>

              {/* MODEL EXPLAINABILITY WIDGET (Requirement #5) */}
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 mb-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                  Model Explainability Widget (Random Forest Feature Importance)
                </span>
                
                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Delta-P (Pressure)</span>
                      <span className="font-mono text-cyan-400">42%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full" style={{ width: '42%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Flow Rate Decay</span>
                      <span className="font-mono text-indigo-400">33%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full" style={{ width: '33%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Turbidity Gradient</span>
                      <span className="font-mono text-amber-400">18%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full" style={{ width: '18%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>TDS Stability</span>
                      <span className="font-mono text-emerald-400">7%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: '7%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Swarm Activity Feed */}
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-bold">Swarm Activity & Federated Sync Log</span>
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 h-24 overflow-y-auto space-y-1.5 font-mono text-[11px] text-zinc-300">
                  {activityLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-cyan-500 shrink-0">›</span>
                      <span className="break-all">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 4. BOTTOM DOCK: INSEF LIVE DEMONSTRATION SUITE */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mt-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div>
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={16} /> INSEF Live Demonstration Suite (Edge Resilience & AI Scenarios)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Interactive judge control dock to test network failover, autonomous edge buffering, and ML anomaly classification in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Trigger Swarm-Wide Anomaly on Node-03 button (Requirement #5) */}
            <button
              onClick={handleTriggerNode03Anomaly}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/40"
            >
              <Share2 size={16} />
              [Trigger Swarm-Wide Anomaly on Node-03]
            </button>

            {/* MQTT Sever Toggle */}
            <button
              onClick={handleToggleMqtt}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border ${
                mqttConnected 
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' 
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
            >
              {mqttConnected ? <WifiOff size={16} /> : <Wifi size={16} />}
              {mqttConnected ? 'Sever MQTT Network (Test Offline Edge Buffer)' : 'Restore MQTT Network & Flush Buffer'}
            </button>
          </div>
        </div>

        {/* Preset Injection Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => applyPreset('nominal')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeScenario === 'Nominal Operating Conditions'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">1. Nominal Flow</span>
              <CheckCircle2 size={16} className={activeScenario === 'Nominal Operating Conditions' ? 'text-emerald-400' : 'text-zinc-600'} />
            </div>
            <p className="text-[11px] text-zinc-400">Restores all metrics to safe baseline (Press: 0.85 bar, Turb: 1.2 NTU, Flow: 1.85 L/m).</p>
          </button>

          <button
            onClick={() => applyPreset('clog')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeScenario === 'Carbon Bed Compaction Clog'
                ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">2. Carbon Bed Clog</span>
              <AlertTriangle size={16} className={activeScenario === 'Carbon Bed Compaction Clog' ? 'text-amber-400' : 'text-zinc-600'} />
            </div>
            <p className="text-[11px] text-zinc-400">Spikes pressure to 2.3 bar, drops flow, triggers BED_COMPACTION_CLOG and bypass valve.</p>
          </button>

          <button
            onClick={() => applyPreset('algae')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeScenario === 'Algal Bloom / Sensor Drift'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-500/10'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">3. Algae (Sensor Drift)</span>
              <Activity size={16} className={activeScenario === 'Algal Bloom / Sensor Drift' ? 'text-cyan-400' : 'text-zinc-600'} />
            </div>
            <p className="text-[11px] text-zinc-400">Spikes turbidity to 45 NTU with stable pressure/flow. AI flags SENSOR_DRIFT_ALGAE.</p>
          </button>

          <button
            onClick={() => applyPreset('seal')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeScenario === 'Seal Pressure Risk / Rupture'
                ? 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/10'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">4. Seal Risk</span>
              <ShieldAlert size={16} className={activeScenario === 'Seal Pressure Risk / Rupture' ? 'text-rose-400' : 'text-zinc-600'} />
            </div>
            <p className="text-[11px] text-zinc-400">Spikes pressure to 7.45 bar, triggering emergency failsafe and system cutoff animation.</p>
          </button>
        </div>

      </div>

    </div>
  );
}
