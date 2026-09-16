import React, { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface AdminLockScreenProps {
  children: ReactNode;
}

export function AdminLockScreen({ children }: AdminLockScreenProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  // Auto-lock on idle
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (!isLocked) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setIsLocked(true);
          setPin(''); // Clear pin on auto-lock
        }, IDLE_TIMEOUT_MS);
      }
    };

    if (!isLocked) {
      // Start initial timer
      resetTimer();

      // Setup event listeners
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('mousedown', resetTimer);
      window.addEventListener('keypress', resetTimer);
      window.addEventListener('touchmove', resetTimer);
      window.addEventListener('scroll', resetTimer);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('touchmove', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isLocked, IDLE_TIMEOUT_MS]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    setError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '2026') {
      setIsLocked(false);
      setError(false);
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
      fontFamily: 'monospace',
      color: '#00ffcc'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
        border: '1px solid rgba(0, 255, 204, 0.3)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        boxShadow: '0 0 30px rgba(0,255,204,0.1)',
        borderRadius: '4px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ShieldCheck size={48} style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 8px rgba(0,255,204,0.8))' }} />
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            margin: 0,
            textShadow: '0 0 5px rgba(0,255,204,0.5)'
          }}>
            HYDROGUARD OS
          </h1>
          <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7, letterSpacing: '0.1em' }}>
            SECURE ADMIN TERMINAL
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Enter Access PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={handlePinChange}
            maxLength={4}
            autoFocus
            style={{
              width: '128px',
              backgroundColor: 'transparent',
              border: error ? '2px solid #ef4444' : '2px solid rgba(0, 255, 204, 0.5)',
              color: error ? '#ef4444' : '#00ffcc',
              textAlign: 'center',
              fontSize: '24px',
              letterSpacing: '0.5em',
              padding: '12px',
              outline: 'none',
              borderRadius: '4px',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
            }}
            placeholder="****"
          />

          <div style={{ height: '40px', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {error ? (
              <div style={{ display: 'flex', alignItems: 'center', color: '#ef4444', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                <AlertTriangle size={18} style={{ marginRight: '8px' }} />
                <span>[!] ACCESS DENIED</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={pin.length < 4}
                style={{
                  padding: '8px 24px',
                  border: '1px solid rgba(0, 255, 204, 0.5)',
                  backgroundColor: 'transparent',
                  color: '#00ffcc',
                  fontSize: '14px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: pin.length < 4 ? 'not-allowed' : 'pointer',
                  opacity: pin.length < 4 ? 0.3 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Authenticate
              </button>
            )}
          </div>
        </form>
        
        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(0, 255, 204, 0.4)', fontSize: '10px', textTransform: 'uppercase' }}>
          <span>Sys.Stat: LOCKED</span>
          <span>AUTH REQ</span>
        </div>
      </div>
    </div>
  );
}
