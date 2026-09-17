import React, { useState } from 'react';
import { Database, Activity, AlertTriangle, Zap } from 'lucide-react';

export function SwarmCommandCenter() {
  const [nodes, setNodes] = useState([
    { id: 'alpha', name: 'Node Alpha', role: 'Master / Physical', pressure: 42.1, turbidity: 2.3, status: 'ONLINE', color: '#00ffcc' },
    { id: 'beta', name: 'Node Beta', role: 'Phantom Swarm', pressure: 38.5, turbidity: 1.8, status: 'ONLINE', color: '#00ffcc' },
    { id: 'gamma', name: 'Node Gamma', role: 'Phantom Swarm', pressure: 41.2, turbidity: 2.1, status: 'ONLINE', color: '#00ffcc' },
    { id: 'delta', name: 'Node Delta', role: 'Phantom Swarm', pressure: 39.8, turbidity: 2.5, status: 'ONLINE', color: '#00ffcc' },
  ]);

  const [alertMsg, setAlertMsg] = useState('');

  const handleInjectData = () => {
    // Simulate turbidity spike at Node Beta
    setNodes(prev => prev.map(node => {
      if (node.id === 'beta') {
        return { ...node, turbidity: 89.4, pressure: 12.1, status: 'WARNING: CONTAMINATION', color: '#ff3333' };
      }
      return node;
    }));

    setAlertMsg('Swarm Data Injected to Supabase. Local AI Retraining Initiated.');

    // TODO: Supabase Insert Logic
    /*
      try {
        const { error } = await supabase.from('swarm_telemetry').insert([
          {
            node_id: 'beta_phantom_01',
            turbidity: 89.4,
            pressure: 12.1,
            status: 'CONTAMINATION_DETECTED',
            timestamp: new Date().toISOString()
          }
        ]);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to inject swarm data:', err);
      }
    */

    setTimeout(() => {
      setAlertMsg('');
    }, 6000);
  };

  return (
    <div style={{
      backgroundColor: '#0a0a0c',
      color: '#00ffcc',
      fontFamily: 'monospace',
      minHeight: '100%',
      padding: '32px',
      overflowY: 'auto'
    }}>
      <header style={{ borderBottom: '1px solid rgba(0,255,204,0.3)', paddingBottom: '16px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.2em', margin: 0, textShadow: '0 0 10px rgba(0,255,204,0.5)' }}>
            SWARM NETWORK // FEDERATED LEARNING
          </h1>
          <p style={{ fontSize: '12px', opacity: 0.7, margin: '8px 0 0 0', letterSpacing: '0.1em' }}>GLOBAL TELEMETRY OVERVIEW</p>
        </div>
        
        <button 
          onClick={handleInjectData}
          style={{
            backgroundColor: 'rgba(255, 51, 51, 0.1)',
            border: '1px solid #ff3333',
            color: '#ff3333',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 15px rgba(255,51,51,0.2)',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,51,51,0.2)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(255,51,51,0.4)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,51,51,0.1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,51,51,0.2)'; }}
        >
          <Zap size={18} />
          INJECT PHANTOM SWARM DATA (SIMULATION)
        </button>
      </header>

      {alertMsg && (
        <div style={{
          backgroundColor: 'rgba(255, 204, 0, 0.1)',
          border: '1px solid #ffcc00',
          color: '#ffcc00',
          padding: '16px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          animation: 'pulse 2s infinite'
        }}>
          <AlertTriangle size={24} />
          {alertMsg}
        </div>
      )}

      {/* Spatial Map UI */}
      <div style={{
        backgroundColor: '#111',
        border: '1px solid rgba(0,255,204,0.2)',
        padding: '32px',
        marginBottom: '32px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '250px'
      }}>
        <div style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '10px', opacity: 0.5, letterSpacing: '0.2em' }}>SPATIAL TOPOLOGY</div>
        
        {/* Central Hive Mind */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0,255,204,0.1)',
          border: '2px solid #00ffcc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0,255,204,0.4)',
          zIndex: 10
        }}>
          <Database size={32} color="#00ffcc" />
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', letterSpacing: '0.1em', color: '#00ffcc', zIndex: 10 }}>HIVE MIND (SUPABASE)</div>

        {/* Connecting Lines & Nodes conceptually positioned */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' }}>
           {/* Line to Alpha */}
           <div style={{ position: 'absolute', top: '50%', left: '25%', width: '25%', height: '1px', backgroundColor: 'rgba(0,255,204,0.3)' }} />
           {/* Line to Beta */}
           <div style={{ position: 'absolute', top: '25%', left: '50%', width: '1px', height: '25%', backgroundColor: nodes[1].color === '#ff3333' ? 'rgba(255,51,51,0.5)' : 'rgba(0,255,204,0.3)' }} />
           {/* Line to Gamma */}
           <div style={{ position: 'absolute', top: '50%', left: '50%', width: '25%', height: '1px', backgroundColor: 'rgba(0,255,204,0.3)' }} />
           {/* Line to Delta */}
           <div style={{ position: 'absolute', top: '50%', left: '50%', width: '1px', height: '25%', backgroundColor: 'rgba(0,255,204,0.3)' }} />
           
           {/* Small blips at ends of lines representing nodes */}
           <div style={{ position: 'absolute', top: 'calc(50% - 4px)', left: '25%', width: '8px', height: '8px', backgroundColor: nodes[0].color, borderRadius: '50%', boxShadow: `0 0 10px ${nodes[0].color}` }} />
           <div style={{ position: 'absolute', top: '25%', left: 'calc(50% - 4px)', width: '8px', height: '8px', backgroundColor: nodes[1].color, borderRadius: '50%', boxShadow: `0 0 10px ${nodes[1].color}` }} />
           <div style={{ position: 'absolute', top: 'calc(50% - 4px)', left: '75%', width: '8px', height: '8px', backgroundColor: nodes[2].color, borderRadius: '50%', boxShadow: `0 0 10px ${nodes[2].color}` }} />
           <div style={{ position: 'absolute', top: '75%', left: 'calc(50% - 4px)', width: '8px', height: '8px', backgroundColor: nodes[3].color, borderRadius: '50%', boxShadow: `0 0 10px ${nodes[3].color}` }} />
        </div>
      </div>

      {/* Node Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {nodes.map(node => (
          <div key={node.id} style={{
            backgroundColor: '#111',
            border: `1px solid ${node.color}40`,
            borderTop: `3px solid ${node.color}`,
            padding: '20px',
            boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: node.color, letterSpacing: '0.1em' }}>{node.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', textTransform: 'uppercase' }}>{node.role}</div>
              </div>
              <Activity size={20} color={node.color} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '4px' }}>PRESSURE</div>
                <div style={{ fontSize: '20px', color: '#fff' }}>{node.pressure.toFixed(1)} <span style={{ fontSize: '10px', opacity: 0.5 }}>PSI</span></div>
              </div>
              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '4px' }}>TURBIDITY</div>
                <div style={{ fontSize: '20px', color: node.turbidity > 50 ? '#ff3333' : '#fff' }}>{node.turbidity.toFixed(1)} <span style={{ fontSize: '10px', opacity: 0.5 }}>NTU</span></div>
              </div>
            </div>

            <div style={{
              marginTop: 'auto',
              padding: '8px 12px',
              backgroundColor: `${node.color}15`,
              color: node.color,
              fontSize: '12px',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: node.color, borderRadius: '50%', boxShadow: `0 0 8px ${node.color}` }}></div>
              STATUS: {node.status}
            </div>
          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}} />
    </div>
  );
}
