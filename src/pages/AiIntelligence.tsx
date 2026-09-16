import React, { useState, useEffect } from 'react';
import { telemetryService, AppState } from '../services/telemetryService';
import { AiPredictionResult } from '../types/hydroguard';
import { BrainCircuit, Cpu, Zap, ActivitySquare, ServerCrash } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export function AiIntelligence() {
  const [appState, setAppState] = useState<AppState>({ telemetry: null, ai: null, system: null });

  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((state) => {
      setAppState({ ...state });
    });
    return unsubscribe;
  }, []);

  const prediction = appState.ai;

  if (!prediction) return null;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0A0A0A] p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
             <BrainCircuit className="text-indigo-400" />
             AI Engine (Random Forest)
           </h1>
           <p className="text-sm text-gray-400">Scikit-learn trained predictive model for anomaly detection</p>
        </div>
        <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
           </span>
           {prediction.model_status}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
             <ActivitySquare size={80} />
           </div>
           <div>
             <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Model Accuracy</p>
             <div className="text-3xl font-bold text-white font-mono">{prediction.model_accuracy?.toFixed(1)}%</div>
           </div>
           <div className="mt-4 text-xs text-emerald-400">Validated on cross-test split</div>
        </div>
        
        <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
             <DatabaseIcon size={80} />
           </div>
           <div>
             <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Training Samples</p>
             <div className="text-3xl font-bold text-white font-mono">{prediction.training_samples?.toLocaleString()}</div>
           </div>
           <div className="mt-4 text-xs text-gray-500">Historical telemetry vectors</div>
        </div>

        <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
             <Zap size={80} />
           </div>
           <div>
             <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Current Inference</p>
             <div className={`text-2xl font-bold ${prediction.anomaly_type !== 'NONE' ? 'text-rose-400' : 'text-emerald-400'}`}>
               {prediction.anomaly_type === 'NONE' ? 'NOMINAL' : prediction.anomaly_type.replace(/_/g, ' ')}
             </div>
           </div>
           <div className="mt-4 text-xs text-gray-400 leading-tight">
             {prediction.anomaly_details}
           </div>
        </div>
      </div>

      <div className="flex gap-6 h-[400px]">
         <div className="flex-[2] bg-[#141414] rounded-2xl border border-white/5 p-6 flex flex-col">
            <h2 className="font-semibold text-white mb-6">Feature Importance</h2>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={prediction.feature_importances || []} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={true} vertical={false} />
                   <XAxis type="number" stroke="#6b7280" fontSize={10} domain={[0, 'dataMax + 0.1']} tickFormatter={(val) => val.toFixed(2)} />
                   <YAxis dataKey="feature" type="category" stroke="#9ca3af" fontSize={11} width={120} tickLine={false} />
                   <RechartsTooltip 
                      cursor={{fill: '#ffffff05'}}
                      contentStyle={{ backgroundColor: '#141414', borderColor: '#ffffff20', color: '#fff' }}
                      formatter={(value: number) => [value.toFixed(3), 'Gini Importance']}
                   />
                   <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                     {
                       (prediction.feature_importances || []).map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : index === 1 ? '#60a5fa' : '#38bdf8'} />
                       ))
                     }
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
         
         <div className="flex-1 bg-[#141414] rounded-2xl border border-indigo-500/10 p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <h2 className="font-semibold text-white mb-6">Model Architecture</h2>
            
            <div className="space-y-6 z-10 flex-1">
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Algorithm</p>
                  <p className="text-sm text-gray-300">RandomForestClassifier</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Hyperparameters</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                     <div className="p-2 bg-white/[0.02] rounded border border-white/5 text-gray-400">n_estimators: 100</div>
                     <div className="p-2 bg-white/[0.02] rounded border border-white/5 text-gray-400">max_depth: 12</div>
                     <div className="p-2 bg-white/[0.02] rounded border border-white/5 text-gray-400">min_samples_split: 5</div>
                     <div className="p-2 bg-white/[0.02] rounded border border-white/5 text-gray-400">criterion: 'gini'</div>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Target Classes (Quality)</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                     <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">EXCELLENT</span>
                     <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400">GOOD</span>
                     <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">WARNING</span>
                     <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400">CRITICAL</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

// Temporary icon to avoid importing an unused one above
function DatabaseIcon({ size }: { size: number }) {
  return <ServerCrash size={size} />; // Just using a lucide icon
}
