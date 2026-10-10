import React, { useState, useEffect, useRef } from 'react';
import { SensorTelemetry } from '../types/hydroguard';
import { AlertTriangle, ShieldAlert, Info, X } from 'lucide-react';

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  severity: 'warning' | 'critical' | 'info';
  timestamp: Date;
}

interface AlertSystemProps {
  telemetry: SensorTelemetry | null;
}

export function AlertSystem({ telemetry }: AlertSystemProps) {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const lastAlertTimes = useRef<Record<string, number>>({});

  const addToast = (key: string, title: string, message: string, severity: 'warning' | 'critical' | 'info') => {
    const now = Date.now();
    // Cooldown per alert key (30 seconds) to prevent spamming
    if (lastAlertTimes.current[key] && now - lastAlertTimes.current[key] < 30000) {
      return;
    }
    lastAlertTimes.current[key] = now;

    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastAlert = {
      id,
      title,
      message,
      severity,
      timestamp: new Date()
    };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (!telemetry) return;

    // Check pH
    if (telemetry.ph < 6.0) {
      addToast('ph_low', 'Critical pH Level Low', `pH is critically acidic at ${telemetry.ph.toFixed(2)} (Safe: 6.5 - 8.5)`, 'critical');
    } else if (telemetry.ph > 9.0) {
      addToast('ph_high', 'Critical pH Level High', `pH is critically alkaline at ${telemetry.ph.toFixed(2)} (Safe: 6.5 - 8.5)`, 'critical');
    } else if (telemetry.ph < 6.5 || telemetry.ph > 8.5) {
      addToast('ph_warn', 'pH Level Warning', `pH level is out of optimal range at ${telemetry.ph.toFixed(2)}`, 'warning');
    }

    // Check Turbidity
    if (telemetry.turbidity > 15.0) {
      addToast('turbidity_crit', 'High Turbidity Critical', `Turbidity reached ${telemetry.turbidity.toFixed(1)} NTU. Filtration backwash required!`, 'critical');
    } else if (telemetry.turbidity > 8.0) {
      addToast('turbidity_warn', 'Turbidity Warning', `Turbidity elevated at ${telemetry.turbidity.toFixed(1)} NTU.`, 'warning');
    }

    // Check TDS
    if (telemetry.tds > 700) {
      addToast('tds_high', 'High TDS Warning', `Total Dissolved Solids elevated at ${telemetry.tds} ppm.`, 'warning');
    }

    // Check Tank Levels
    if (telemetry.raw_level < 15) {
      addToast('raw_tank_low', 'Raw Tank Low', `Raw water tank level is low (${telemetry.raw_level.toFixed(1)}%).`, 'warning');
    }
    if (telemetry.clean_level < 15) {
      addToast('clean_tank_low', 'Clean Tank Low', `Clean water output tank level is low (${telemetry.clean_level.toFixed(1)}%).`, 'critical');
    }

    // Check flow anomaly
    if (telemetry.pump && telemetry.flow_in < 0.5) {
      addToast('flow_anomaly', 'Flow Restriction / Pump Dry', `Pump is running but inlet flow is near zero (${telemetry.flow_in} L/min). Check intake!`, 'critical');
    }

  }, [telemetry]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isCritical = toast.severity === 'critical';
        const isWarning = toast.severity === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in ${
              isCritical
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                : 'bg-slate-900/90 border-cyan-500/30 text-cyan-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isCritical ? (
                <ShieldAlert className="text-rose-400" size={20} />
              ) : isWarning ? (
                <AlertTriangle className="text-amber-400" size={20} />
              ) : (
                <Info className="text-cyan-400" size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider">{toast.title}</h4>
                <span className="text-[10px] opacity-70">
                  {toast.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1"
              aria-label="Close toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
