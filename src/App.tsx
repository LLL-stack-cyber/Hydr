import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { WaterQuality } from './pages/WaterQuality';
import { AiIntelligence } from './pages/AiIntelligence';
import { DeviceData } from './pages/DeviceData';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { telemetryService, AppState } from './services/telemetryService';
import { AdminLockScreen } from './components/AdminLockScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appState, setAppState] = useState<AppState>({ telemetry: null, ai: null, system: null });
  
  useEffect(() => {
    // Only subscribe to telemetry if authenticated
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
        
        {/* Simple Tab Routing */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'water_quality' && <WaterQuality />}
        {activeTab === 'ai' && <AiIntelligence />}
        {activeTab === 'device' && <DeviceData />}
        {activeTab === 'settings' && <Settings />}
        
      </main>
    </div>
    </AdminLockScreen>
  );
}
