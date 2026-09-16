import React, { useState, useEffect, useRef } from 'react';
import { telemetryService } from '../services/telemetryService';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PumpControlButtonProps {
  isDisconnected: boolean;
  isActive: boolean;
}

export function PumpControlButton({ isDisconnected, isActive }: PumpControlButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Subscribe to ACK messages from the status topic
    const unsubscribe = telemetryService.subscribeToAcks(({ topic, message }) => {
      // Check if this is the ACK we are waiting for
      if (message.includes('ACK: PUMP_ON')) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setLoading(false);
        setError(null);
      }
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Also reset loading state if telemetry updates and the pump is actually on
  useEffect(() => {
    if (isActive && loading) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
      setError(null);
    }
  }, [isActive, loading]);

  const handleToggle = async () => {
    if (isDisconnected || loading) return;

    // We only trigger the complex ACK flow for turning it ON,
    // as per the requirement "when the user clicks the 'Turn Pump On' button".
    // If turning it OFF, we can just send the command.
    if (!isActive) {
      setLoading(true);
      setError(null);
      
      // 5-second timeout for the ACK
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        setError('Hardware Unreachable');
        // Clear error after 3 seconds so the user can try again
        setTimeout(() => setError(null), 3000);
      }, 5000);
    }

    try {
      await telemetryService.togglePump(true); // force true for this specific flow if it's currently false
    } catch (err) {
      setLoading(false);
      setError('Network Error');
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button 
        disabled={isDisconnected || loading}
        onClick={handleToggle}
        className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all w-32 border
          ${isDisconnected ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'bg-red-500/10 border-red-500/50 text-red-400' : 
            loading ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' :
            isActive ? 'bg-green-500/20 border-green-500/50 text-green-400' : 
            'bg-[#0A0A0A] border-white/10 text-gray-400 hover:border-white/30'
          }
        `}
      >
        <span>
          {error ? 'Error' : loading ? 'Sending...' : isActive ? 'Active' : 'Turn On'}
        </span>
        
        {error ? (
          <AlertCircle size={14} className="text-red-400" />
        ) : loading ? (
          <Loader2 size={14} className="animate-spin text-indigo-400" />
        ) : isActive ? (
          <CheckCircle2 size={14} className="text-green-400" />
        ) : (
          <div className={`w-6 h-3.5 rounded-full relative transition-colors ${isActive ? 'bg-green-500' : 'bg-white/10'}`}>
            <div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-all ${isActive ? 'left-3 shadow-sm shadow-green-900' : 'left-0.5'}`}></div>
          </div>
        )}
      </button>
      
      {error && (
        <span className="text-[10px] text-red-400 font-medium absolute -bottom-5 right-0 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
}
