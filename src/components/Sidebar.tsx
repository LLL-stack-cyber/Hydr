import React from 'react';
import { LayoutDashboard, Droplets, Brain, Server, Settings, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'water_quality', label: 'Water Quality', icon: Droplets },
    { id: 'ai', label: 'AI Intelligence', icon: Brain },
    { id: 'device', label: 'Device & Data', icon: Server },
    { id: 'settings', label: 'History & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0D0D0D] flex flex-col font-sans">
      <div className="p-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-black font-bold">
          <Activity size={20} />
        </div>
        <span className="text-xl font-semibold tracking-tight text-[#E5E7EB] font-['Chakra_Petch']">HYDROGUARD</span>
      </div>
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-white/5 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon size={20} className="opacity-70" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="p-6 mt-auto">
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">System Health</p>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-indigo-500 w-[98%]"></div>
          </div>
          <p className="text-[10px] text-gray-400">98% Optimal</p>
        </div>
      </div>
    </aside>
  );
}
