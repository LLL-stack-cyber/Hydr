import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { telemetryService } from '../services/telemetryService';
import { SensorTelemetry } from '../types/hydroguard';

export function WaterQuality() {
  const [dataHistory, setDataHistory] = useState<SensorTelemetry[]>([]);
  const [activeChart, setActiveChart] = useState<'ph' | 'tds' | 'turbidity'>('ph');

  useEffect(() => {
    // Collect historical data for charts
    const unsubscribe = telemetryService.subscribe(({ telemetry }) => {
      if (telemetry) {
        setDataHistory(prev => {
          const newHistory = [...prev, telemetry];
          // Keep last 30 data points for UI responsiveness
          if (newHistory.length > 30) return newHistory.slice(newHistory.length - 30);
          return newHistory;
        });
      }
    });
    return unsubscribe;
  }, []);

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const chartConfig = {
    ph: { name: 'pH Level', key: 'ph', color: '#10b981', domain: [0, 14], refLines: [{val: 6.5, label: 'Min', color: 'red'}, {val: 8.5, label: 'Max', color: 'red'}] },
    tds: { name: 'Total Dissolved Solids (ppm)', key: 'tds', color: '#f59e0b', domain: [0, 800], refLines: [{val: 500, label: 'Max', color: 'red'}] },
    turbidity: { name: 'Turbidity (NTU)', key: 'turbidity', color: '#06b6d4', domain: [0, 50], refLines: [{val: 15, label: 'Warning', color: 'red'}] },
  };

  const active = chartConfig[activeChart];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0A0A0A] p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-white mb-1">Water Quality Analytics</h1>
           <p className="text-sm text-gray-400">Live sensor telemetry and historical trend analysis</p>
        </div>
        
        <div className="flex bg-[#141414] rounded-lg border border-white/5 p-1">
           {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).map(key => (
             <button
               key={key}
               onClick={() => setActiveChart(key)}
               className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeChart === key ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               {chartConfig[key].name.split(' ')[0]}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
         {/* Live stat cards */}
         {dataHistory.length > 0 && (
           <>
              <div className="bg-[#141414] p-5 rounded-2xl border border-white/5">
                 <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">Current pH</p>
                 <div className="text-3xl font-bold text-emerald-400 font-mono">
                    {dataHistory[dataHistory.length - 1].ph.toFixed(2)}
                 </div>
              </div>
              <div className="bg-[#141414] p-5 rounded-2xl border border-white/5">
                 <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">Current TDS</p>
                 <div className="text-3xl font-bold text-amber-400 font-mono flex items-end gap-2">
                    {dataHistory[dataHistory.length - 1].tds.toFixed(0)}
                    <span className="text-sm text-gray-500 font-sans mb-1">ppm</span>
                 </div>
              </div>
              <div className="bg-[#141414] p-5 rounded-2xl border border-white/5">
                 <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">Current Turbidity</p>
                 <div className="text-3xl font-bold text-cyan-400 font-mono flex items-end gap-2">
                    {dataHistory[dataHistory.length - 1].turbidity.toFixed(1)}
                    <span className="text-sm text-gray-500 font-sans mb-1">NTU</span>
                 </div>
              </div>
           </>
         )}
      </div>

      <div className="flex-1 bg-[#141414] rounded-2xl border border-white/5 p-6 min-h-[400px] flex flex-col">
        <h2 className="font-semibold text-white mb-6 tracking-wide">{active.name} Trend</h2>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime} 
                stroke="#6b7280" 
                fontSize={12}
                tickMargin={10}
              />
              <YAxis 
                domain={active.domain} 
                stroke="#6b7280" 
                fontSize={12}
                tickFormatter={(val) => val.toFixed(0)}
                width={40}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#141414', borderColor: '#ffffff20', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: active.color }}
                labelFormatter={formatTime}
              />
              
              {active.refLines.map((line, i) => (
                <ReferenceLine key={i} y={line.val} stroke={line.color} strokeDasharray="3 3">
                  {/* Label omitted for clean UI, but line remains */}
                </ReferenceLine>
              ))}

              <Line 
                type="monotone" 
                dataKey={active.key} 
                stroke={active.color} 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: active.color, stroke: '#0D0D0D', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
