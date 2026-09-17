import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { WaterQuality } from './pages/WaterQuality';
import { AiIntelligence } from './pages/AiIntelligence';
import { DeviceData } from './pages/DeviceData';
import { Settings } from './pages/Settings';
import { SwarmCommandCenter } from './pages/SwarmCommandCenter';
import { Login } from './pages/Login';
import { telemetryService, AppState } from './services/telemetryService';
import { AdminLockScreen } from './components/AdminLockScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appState, setAppState] = useState<AppState>({ telemetry: null, ai: null, system: null });
  
  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = telemetryService.subscribe((state) => {
         setAppState({ ...state });
      });
      return unsubscribe;
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AdminLockScreen>
    <div className="h-screen w-full bg-[#0A0A0A] text-[#E5E7EB] font-sans flex overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          systemHealth={appState.system} 
          isSimulation={appState.system?.simulation_mode || false} 
          deviceId={appState.telemetry?.device_id || "HYDROGUARD-ESP32-01"}
          lastUpdate={appState.telemetry?.timestamp}
        />
        
        {appState.system && appState.system.esp32_connected === false && appState.system.simulation_mode === false && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-10 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 text-rose-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span className="text-sm font-medium">ESP32 Offline: The device is currently not connected to the Wi-Fi or is not powered on.</span>
            </div>
          </div>
        )}
        
        {appState.system && appState.system.esp32_connected === true && appState.system.simulation_mode === false && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-10 py-2 flex items-center justify-between shrink-0 transition-opacity duration-1000">
            <div className="flex items-center gap-3 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              <span className="text-xs font-medium">ESP32 Connected and transmitting telemetry.</span>
            </div>
          </div>
        )}
        
        {/* Simple Tab Routing */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'water_quality' && <WaterQuality />}
        {activeTab === 'ai' && <AiIntelligence />}
        {activeTab === 'device' && <DeviceData />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'swarm' && <SwarmCommandCenter />}
      </main>
    </div>
    </AdminLockScreen>
  );
}
