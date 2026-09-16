import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { SensorStatus } from '../types/hydroguard';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  trendValue?: string;
  status: SensorStatus;
}

export function KpiCard({ title, value, unit, trend, trendValue, status }: KpiCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'ONLINE':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'WARNING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'OFFLINE':
      case 'OUT_OF_RANGE':
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const statusColorClass = getStatusColor();

  return (
    <div className="bg-[#141414] p-5 rounded-2xl border border-white/5 flex flex-col relative overflow-hidden group">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex items-center justify-between mb-3 z-10">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{title}</p>
        <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border uppercase ${statusColorClass}`}>
          {status}
        </div>
      </div>
      
      <div className="flex items-end gap-1.5 z-10">
        <span className="text-2xl font-semibold text-white font-['JetBrains_Mono']">{value}</span>
        <span className="text-sm text-gray-500 mb-1">{unit}</span>
      </div>
      
      <div className="mt-3 text-xs flex items-center gap-1 z-10">
        {trend === 'UP' && <ArrowUpRight size={14} className="text-rose-400" />}
        {trend === 'DOWN' && <ArrowDownRight size={14} className="text-emerald-400" />}
        {trend === 'STABLE' && <Minus size={14} className="text-gray-500" />}
        
        <span className={trend === 'UP' ? 'text-rose-400' : trend === 'DOWN' ? 'text-emerald-400' : 'text-gray-500'}>
          {trendValue}
        </span>
        <span className="text-gray-600">from last hr</span>
      </div>
    </div>
  );
}
