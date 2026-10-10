import React, { useState, useEffect } from 'react';
import { Server, Cpu, Activity, LogIn, KeyRound, Database, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, googleProvider, signInWithPopup } from '../services/firebase';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  // Local MQTT Server Host (IP or hostname, not cloud broker URL)
  const [serverHost, setServerHost] = useState('wss://broker.hivemq.com:8884/mqtt');
  const [port, setPort] = useState('8884');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('HYDROGUARD-ESP32-01');
  const [telemetryTopic, setTelemetryTopic] = useState('hydroguard_shreyas_insef26/telemetry');
  const [controlTopic, setControlTopic] = useState('hydroguard_shreyas_insef26/control');
  const [simulationMode, setSimulationMode] = useState(false);
  
  // Supabase Service Role credentials
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingAnonymous, setLoadingAnonymous] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // Trigger backend connection initialization
      await handleAnonymousEnter();
    } catch (err: any) {
      setError(err.message || 'Google Sign-in failed');
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('hydroguard_mqtt_creds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.serverHost) setServerHost(parsed.serverHost);
        else if (parsed.brokerUrl) {
          // Clean up old mqtt:// url if present
          setServerHost(parsed.brokerUrl.replace('mqtt://', ''));
        }
        if (parsed.port) setPort(parsed.port);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.password) setPassword(parsed.password);
        if (parsed.deviceId) setDeviceId(parsed.deviceId);
        if (parsed.telemetryTopic) setTelemetryTopic(parsed.telemetryTopic);
        if (parsed.controlTopic) setControlTopic(parsed.controlTopic);
        if (parsed.simulationMode !== undefined) setSimulationMode(parsed.simulationMode);
        if (parsed.supabaseUrl) setSupabaseUrl(parsed.supabaseUrl);
        if (parsed.supabaseServiceRoleKey) setSupabaseServiceRoleKey(parsed.supabaseServiceRoleKey);
      } catch (e) {
        console.error("Failed to parse saved credentials", e);
      }
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('hydroguard_mqtt_creds', JSON.stringify({
      serverHost,
      port,
      username,
      password,
      deviceId,
      telemetryTopic,
      controlTopic,
      simulationMode,
      supabaseUrl,
      supabaseServiceRoleKey
    }));
  };

  // Instant Anonymous Entry
  const handleAnonymousEnter = async () => {
    setLoadingAnonymous(true);
    setError('');

    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous_entry: true,
          broker_url: serverHost || '127.0.0.1',
          port: port || '1883',
          device_id: deviceId || 'HYDROGUARD-ESP32-01',
          telemetry_topic: telemetryTopic,
          control_topic: controlTopic,
          simulation_mode: simulationMode,
          supabase_url: supabaseUrl,
          supabase_service_role_key: supabaseServiceRoleKey
        })
      });

      const data = await response.json();
      if (!response.ok && data.status === 'error') {
        throw new Error(data.message || 'Anonymous connection failed');
      }

      saveSettings();
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to enter anonymously');
    } finally {
      setLoadingAnonymous(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker_url: serverHost,
          port,
          username,
          password,
          device_id: deviceId,
          telemetry_topic: telemetryTopic,
          control_topic: controlTopic,
          simulation_mode: simulationMode,
          supabase_url: supabaseUrl,
          supabase_service_role_key: supabaseServiceRoleKey
        })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Connection failed');
      }

      saveSettings();
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-y-auto">
      {/* Background Matrix/Grid effect */}
      <div 
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.2) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10 py-6"
      >
        <div className="bg-[#0b0c10] border border-cyan-500/25 rounded-2xl p-7 sm:p-8 shadow-[0_0_50px_rgba(0,243,255,0.08)]">
          
          {/* Header & Logo */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/40 rounded-xl flex items-center justify-center relative shrink-0">
              <Activity className="text-cyan-400 w-7 h-7 relative z-10" />
              <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-xl"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                HYDROGUARD <span className="text-cyan-400">OS</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Local IoT MQTT Gateway & Supabase Anonymous Ingestion
              </p>
            </div>
          </div>

          {/* Quick Google Sign-in & Anonymous Entry CTA */}
          <div className="mb-6 space-y-3">
            <button
              id="google-signin-button"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loadingAnonymous}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-md disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google (Firebase Auth)</span>
                </>
              )}
            </button>

            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-emerald-950/20 to-black border border-cyan-500/30">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Sparkles size={16} className="text-cyan-400" />
                    <span>Anonymous Entry</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      No Auth Required
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Local MQTT & Supabase accept anonymous entries. Enter immediately without entering passwords.
                  </p>
                </div>
              </div>

              <button
                id="anonymous-entry-button"
                type="button"
                onClick={handleAnonymousEnter}
                disabled={loadingAnonymous || loading || googleLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {loadingAnonymous ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={15} />
                    <span>Enter Anonymously (Instant Access)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Mode Switch: Local Live vs Synthetic Simulation */}
            <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                <Cpu className={simulationMode ? "text-amber-400" : "text-cyan-400"} size={18} />
                <div>
                  <div className="text-xs font-semibold text-white">
                    {simulationMode ? "Digital Twin Simulation" : "Local Hardware Telemetry"}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {simulationMode ? "Synthetic sensor noise + model inference" : "Connected to local server via LAN/IP"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimulationMode(!simulationMode)}
                className={`w-11 h-6 rounded-full relative transition-colors ${simulationMode ? 'bg-amber-500' : 'bg-cyan-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${simulationMode ? 'left-6' : 'left-1'}`}></div>
              </button>
            </div>

            {/* Local MQTT Server Fields */}
            <div className={`space-y-3.5 transition-opacity duration-200 ${simulationMode ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    MQTT Broker URL
                  </label>
                  <span className="text-[10px] text-gray-500">e.g. wss://broker.hivemq.com</span>
                </div>
                
                <div className="relative">
                  <Server className="absolute left-3 top-2.5 text-gray-500" size={17} />
                  <input
                    id="mqtt-local-server-input"
                    type="text"
                    value={serverHost}
                    onChange={(e) => setServerHost(e.target.value)}
                    disabled={simulationMode}
                    className="w-full bg-black/60 border border-white/15 rounded-lg py-2 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-all"
                    placeholder="wss://broker.hivemq.com:8884/mqtt"
                  />
                </div>

                {/* Quick Selection Chips */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => { setServerHost('wss://broker.hivemq.com:8884/mqtt'); setPort('8884'); }}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${serverHost.includes('hivemq') ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                  >
                    HiveMQ Public (Cloud)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setServerHost('10.240.190.180'); setPort('1883'); }}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${serverHost === '10.240.190.180' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                  >
                    10.240.190.180 (Pi)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setServerHost('127.0.0.1'); setPort('1883'); }}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${serverHost === '127.0.0.1' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                  >
                    127.0.0.1 (Local)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Port</label>
                  <input
                    id="mqtt-port-input"
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    disabled={simulationMode}
                    className="w-full bg-black/60 border border-white/15 rounded-lg py-2 px-3 text-white text-sm font-mono focus:outline-none focus:border-cyan-500 transition-all"
                    placeholder="8884"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Device ID</label>
                  <input
                    id="mqtt-device-id-input"
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    disabled={simulationMode}
                    className="w-full bg-black/60 border border-white/15 rounded-lg py-2 px-3 text-white text-sm font-mono focus:outline-none focus:border-cyan-500 transition-all"
                    placeholder="HYDROGUARD-ESP32-01"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Telemetry Topic</label>
                  <input
                    type="text"
                    value={telemetryTopic}
                    onChange={(e) => setTelemetryTopic(e.target.value)}
                    disabled={simulationMode}
                    className="w-full bg-black/60 border border-white/15 rounded-lg py-2 px-3 text-white text-sm font-mono focus:outline-none focus:border-cyan-500 transition-all"
                    placeholder="hydroguard/telemetry"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Control Topic</label>
                  <input
                    type="text"
                    value={controlTopic}
                    onChange={(e) => setControlTopic(e.target.value)}
                    disabled={simulationMode}
                    className="w-full bg-black/60 border border-white/15 rounded-lg py-2 px-3 text-white text-sm font-mono focus:outline-none focus:border-cyan-500 transition-all"
                    placeholder="hydroguard/control"
                  />
                </div>
              </div>

              {/* Optional Authentication for Mosquitto if configured */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Username (Anonymous if empty)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={simulationMode}
                    placeholder="Optional"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Password (Anonymous if empty)</label>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-2 text-gray-600" size={14} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={simulationMode}
                      placeholder="Optional"
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Supabase Anonymous Logging Section */}
            <div className="pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowSupabaseConfig(!showSupabaseConfig)}
                className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-cyan-400 py-1 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-emerald-400" />
                  <span className="font-semibold uppercase tracking-wider">Supabase Anonymous Logging</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">
                    Anon Role
                  </span>
                </div>
                <span className="text-xs">{showSupabaseConfig ? "Hide ▲" : "Configure ▼"}</span>
              </button>

              {showSupabaseConfig && (
                <div className="mt-3 p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Supabase accepts anonymous entries through its public Service Role Key. Sensor telemetry is streamed to the <code className="text-cyan-300 font-mono">sensor_readings</code> table.
                  </p>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Supabase Project URL</label>
                    <input
                      id="supabase-url-input"
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyz.supabase.co"
                      className="w-full bg-black/60 border border-white/15 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Supabase Service Role Key (Public Key)</label>
                    <input
                      id="supabase-anon-key-input"
                      type="password"
                      value={supabaseServiceRoleKey}
                      onChange={(e) => setSupabaseServiceRoleKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-black/60 border border-white/15 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {/* Connect Button */}
            <button
              id="connect-local-server-button"
              type="submit"
              disabled={loading || loadingAnonymous}
              className="w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all mt-2 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Wifi size={15} className="text-cyan-400" />
                  <span>Connect to Local MQTT Server</span>
                </>
              )}
            </button>

          </form>

        </div>
      </motion.div>
    </div>
  );
}
