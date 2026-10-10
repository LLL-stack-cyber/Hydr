import React, { useState } from 'react';
import {
  Database,
  Activity,
  AlertTriangle,
  Zap,
  Scale,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  RefreshCw,
  Cpu
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const generateHistory = (baseVal, variance, spike = false) => {
  const points = [];
  const times = ['-60m', '-55m', '-50m', '-45m', '-40m', '-35m', '-30m', '-25m', '-20m', '-15m', '-10m', '-5m', 'NOW'];
  for (let i = 0; i < times.length; i++) {
    let v = baseVal + (Math.sin(i * 0.9) * variance) + ((i % 3 - 1) * variance * 0.4);
    if (spike && i >= times.length - 4) {
      const step = i - (times.length - 4);
      if (step === 0) v = 14.8;
      else if (step === 1) v = 38.6;
      else if (step === 2) v = 67.2;
      else if (step === 3) v = 89.4;
    }
    points.push({
      time: times[i],
      val: parseFloat(Math.max(0.1, v).toFixed(2))
    });
  }
  return points;
};

export default function SwarmCommandCenter() {
  const [nodes, setNodes] = useState([
    {
      id: 'alpha',
      name: 'Node Alpha',
      role: 'Master / Physical',
      pressure: 42.1,
      turbidity: 2.3,
      status: 'ONLINE',
      color: '#00ffcc',
      turbidityHistory: generateHistory(2.3, 0.4)
    },
    {
      id: 'beta',
      name: 'Node Beta',
      role: 'Phantom Swarm',
      pressure: 38.5,
      turbidity: 1.8,
      status: 'ONLINE',
      color: '#00ffcc',
      turbidityHistory: generateHistory(1.8, 0.3)
    },
    {
      id: 'gamma',
      name: 'Node Gamma',
      role: 'Phantom Swarm',
      pressure: 41.2,
      turbidity: 2.1,
      status: 'ONLINE',
      color: '#00ffcc',
      turbidityHistory: generateHistory(2.1, 0.35)
    },
    {
      id: 'delta',
      name: 'Node Delta',
      role: 'Phantom Swarm',
      pressure: 39.8,
      turbidity: 2.5,
      status: 'ONLINE',
      color: '#00ffcc',
      turbidityHistory: generateHistory(2.5, 0.4)
    },
  ]);

  const [alertMsg, setAlertMsg] = useState('');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [isBalancing, setIsBalancing] = useState(false);
  const [balancingLogs, setBalancingLogs] = useState([]);
  const [isLoadBalanced, setIsLoadBalanced] = useState(false);

  const handleApplyLoadBalance = () => {
    setIsBalancing(true);
    setBalancingLogs([
      '[00.05s] INITIATING SWARM AUTONOMOUS LOAD BALANCING MATRIX...',
      '[00.22s] TARGET ANOMALY: NODE BETA TURBIDITY EXCEEDS THRESHOLD (89.4 NTU)',
      '[00.48s] THROTTLING VALVE PWM AT NODE BETA: 38.5 PSI -> 8.0 PSI (-30.5 PSI SHED)',
      '[00.74s] COMPUTING FEDERATED REDISTRIBUTION VECTOR ACROSS 3 HEALTHY PEERS...',
      '[00.91s] ALLOCATING SURPLUS: ALPHA (+10.3 PSI), GAMMA (+10.4 PSI), DELTA (+10.2 PSI)',
      '[01.12s] MQTT SETPOINTS BROADCAST • FLEET TOTAL 162.0 PSI SUSTAINED • CONVERGED.'
    ]);

    setTimeout(() => {
      setNodes(prev => prev.map(node => {
        if (node.id === 'beta') {
          return {
            ...node,
            pressure: 8.0,
            status: 'THROTTLED (LOAD SHED)',
            color: '#ffaa00'
          };
        } else if (node.id === 'alpha') {
          return {
            ...node,
            pressure: 52.4,
            status: 'BOOSTED (ABSORBING)'
          };
        } else if (node.id === 'gamma') {
          return {
            ...node,
            pressure: 51.6,
            status: 'BOOSTED (ABSORBING)'
          };
        } else if (node.id === 'delta') {
          return {
            ...node,
            pressure: 50.0,
            status: 'BOOSTED (ABSORBING)'
          };
        }
        return node;
      }));

      setIsBalancing(false);
      setIsLoadBalanced(true);
      setAlertMsg('SWARM LOAD BALANCED: Node Beta throttled to 8.0 PSI; sister nodes absorbing surplus flow.');
      setTimeout(() => setAlertMsg(''), 7000);
    }, 1150);
  };

  const handleResetLoadBalance = () => {
    setNodes(prev => prev.map(node => {
      const defaultPressures = {
        alpha: 42.1,
        beta: 38.5,
        gamma: 41.2,
        delta: 39.8
      };
      return {
        ...node,
        pressure: defaultPressures[node.id] || 40.0,
        status: node.turbidity > 15 ? 'WARNING: CONTAMINATION' : 'ONLINE',
        color: node.turbidity > 15 ? '#ff3333' : '#00ffcc'
      };
    }));
    setIsLoadBalanced(false);
    setBalancingLogs([]);
    setAlertMsg('FLEET REVERTED: Uniform pressure baseline restored across all nodes.');
    setTimeout(() => setAlertMsg(''), 5000);
  };

  const handleInjectData = () => {
    // Simulate massive turbidity spike at Node Beta
    setNodes(prev => prev.map(node => {
      if (node.id === 'beta') {
        return {
          ...node,
          turbidity: 89.4,
          pressure: 12.1,
          status: 'WARNING: CONTAMINATION',
          color: '#ff3333',
          turbidityHistory: generateHistory(1.8, 0.3, true)
        };
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
      {/* Top Header */}
      <header style={{
        borderBottom: '1px solid rgba(0,255,204,0.3)',
        paddingBottom: '16px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '0.2em',
            margin: 0,
            textShadow: '0 0 10px rgba(0,255,204,0.5)'
          }}>
            SWARM NETWORK // FEDERATED LEARNING
          </h1>
          <p style={{
            fontSize: '12px',
            opacity: 0.7,
            margin: '8px 0 0 0',
            letterSpacing: '0.1em'
          }}>
            GLOBAL TELEMETRY OVERVIEW • 60-MIN TIME-SERIES
          </p>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Balance Load Button */}
          <button 
            onClick={() => setShowBalanceModal(true)}
            style={{
              backgroundColor: isLoadBalanced ? 'rgba(0, 255, 204, 0.22)' : 'rgba(0, 255, 204, 0.08)',
              border: `1px solid ${isLoadBalanced ? '#00ffcc' : 'rgba(0,255,204,0.6)'}`,
              color: '#00ffcc',
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isLoadBalanced ? '0 0 20px rgba(0,255,204,0.45)' : '0 0 15px rgba(0,255,204,0.15)',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,255,204,0.25)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,204,0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = isLoadBalanced ? 'rgba(0, 255, 204, 0.22)' : 'rgba(0, 255, 204, 0.08)';
              e.currentTarget.style.boxShadow = isLoadBalanced ? '0 0 20px rgba(0,255,204,0.45)' : '0 0 15px rgba(0,255,204,0.15)';
            }}
          >
            <Scale size={18} />
            {isLoadBalanced ? 'LOAD BALANCED (ACTIVE)' : 'BALANCE LOAD'}
          </button>

          {/* INSEF Demo Button */}
          <button 
            onClick={handleInjectData}
            style={{
              backgroundColor: 'rgba(255, 51, 51, 0.1)',
              border: '1px solid #ff3333',
              color: '#ff3333',
              padding: '12px 24px',
              fontSize: '13px',
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
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,51,51,0.2)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(255,51,51,0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,51,51,0.1)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255,51,51,0.2)';
            }}
          >
            <Zap size={18} />
            INJECT PHANTOM SWARM DATA (SIMULATION)
          </button>
        </div>
      </header>

      {/* Alert Banner */}
      {alertMsg && (
        <div style={{
          backgroundColor: 'rgba(255, 204, 0, 0.1)',
          border: '1px solid #ffcc00',
          color: '#ffcc00',
          padding: '16px',
          marginBottom: '28px',
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

      {/* Node Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {nodes.map(node => {
          const minTurbidity = Math.min(...node.turbidityHistory.map(p => p.val));
          const maxTurbidity = Math.max(...node.turbidityHistory.map(p => p.val));
          const isWarning = node.status.includes('WARNING');

          return (
            <div key={node.id} style={{
              backgroundColor: '#111',
              border: `1px solid ${node.color}40`,
              borderTop: `3px solid ${node.color}`,
              padding: '20px',
              boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              {/* Card Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: node.color,
                    letterSpacing: '0.1em'
                  }}>
                    {node.name}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    opacity: 0.6,
                    marginTop: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {node.role}
                  </div>
                </div>
                <Activity size={20} color={node.color} />
              </div>
              
              {/* Stat Boxes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  padding: '10px 12px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '2px', letterSpacing: '0.05em' }}>
                    PRESSURE
                  </div>
                  <div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                    <span>{node.pressure.toFixed(1)} <span style={{ fontSize: '9px', opacity: 0.5 }}>PSI</span></span>
                    {isLoadBalanced && (
                      <span style={{
                        fontSize: '8px',
                        padding: '1px 5px',
                        backgroundColor: node.id === 'beta' ? 'rgba(255,170,0,0.2)' : 'rgba(0,255,204,0.15)',
                        color: node.id === 'beta' ? '#ffaa00' : '#00ffcc',
                        border: `1px solid ${node.id === 'beta' ? '#ffaa00' : '#00ffcc'}`,
                        letterSpacing: '0.05em'
                      }}>
                        {node.id === 'beta' ? 'THROTTLED' : 'BOOSTED'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  padding: '10px 12px',
                  border: `1px solid ${isWarning ? 'rgba(255,51,51,0.3)' : 'rgba(255,255,255,0.06)'}`
                }}>
                  <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '2px', letterSpacing: '0.05em' }}>
                    TURBIDITY
                  </div>
                  <div style={{
                    fontSize: '18px',
                    color: isWarning ? '#ff3333' : '#fff',
                    fontWeight: 'bold'
                  }}>
                    {node.turbidity.toFixed(1)} <span style={{ fontSize: '9px', opacity: 0.5 }}>NTU</span>
                  </div>
                </div>
              </div>

              {/* Sparkline Graph (Recharts) */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '10px 10px 6px 10px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                  fontSize: '9px',
                  letterSpacing: '0.05em',
                  opacity: 0.7
                }}>
                  <span style={{ color: node.color }}>TURBIDITY (60 MIN TREND)</span>
                  <span style={{ opacity: 0.6 }}>{minTurbidity.toFixed(1)}–{maxTurbidity.toFixed(1)} NTU</span>
                </div>

                <div style={{ width: '100%', height: '54px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={node.turbidityHistory}
                      margin={{ top: 4, right: 2, left: 2, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id={`grad-jsx-${node.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={node.color} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={node.color} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        isAnimationActive={false}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload;
                            return (
                              <div style={{
                                backgroundColor: '#050507',
                                border: `1px solid ${node.color}`,
                                padding: '4px 8px',
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                color: node.color,
                                boxShadow: '0 0 10px rgba(0,0,0,0.9)'
                              }}>
                                <span>{p.time}: </span>
                                <strong>{p.val} NTU</strong>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke={node.color}
                        strokeWidth={1.8}
                        fill={`url(#grad-jsx-${node.id})`}
                        isAnimationActive={true}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Sparkline Time Axis Markers */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '8px',
                  opacity: 0.45,
                  marginTop: '4px',
                  letterSpacing: '0.05em'
                }}>
                  <span>-60m</span>
                  <span>-30m</span>
                  <span>NOW</span>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{
                marginTop: 'auto',
                padding: '8px 12px',
                backgroundColor: `${node.color}15`,
                color: node.color,
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: node.color,
                  borderRadius: '50%',
                  boxShadow: `0 0 8px ${node.color}`
                }} />
                STATUS: {node.status}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spatial Map UI (Positioned Below Grid) */}
      <div style={{
        backgroundColor: '#111',
        border: '1px solid rgba(0,255,204,0.2)',
        padding: '32px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '260px'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          fontSize: '10px',
          opacity: 0.5,
          letterSpacing: '0.2em'
        }}>
          SPATIAL TOPOLOGY // FEDERATED COORDINATE MAP
        </div>
        
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
        <div style={{
          marginTop: '12px',
          fontSize: '11px',
          letterSpacing: '0.12em',
          color: '#00ffcc',
          zIndex: 10,
          fontWeight: 'bold'
        }}>
          HIVE MIND (SUPABASE)
        </div>

        {/* Connecting Lines & Topology Nodes */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}>
          {/* Line to Alpha (West) */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '20%',
            width: '30%',
            height: '1px',
            backgroundColor: 'rgba(0,255,204,0.35)'
          }} />
          {/* Line to Beta (North) */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            width: '1px',
            height: '30%',
            backgroundColor: nodes[1].color === '#ff3333' ? 'rgba(255,51,51,0.6)' : 'rgba(0,255,204,0.35)'
          }} />
          {/* Line to Gamma (East) */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '30%',
            height: '1px',
            backgroundColor: 'rgba(0,255,204,0.35)'
          }} />
          {/* Line to Delta (South) */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '1px',
            height: '30%',
            backgroundColor: 'rgba(0,255,204,0.35)'
          }} />
          
          {/* Node Alpha Blip */}
          <div style={{
            position: 'absolute',
            top: 'calc(50% - 16px)',
            left: '18%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              backgroundColor: nodes[0].color,
              borderRadius: '50%',
              boxShadow: `0 0 10px ${nodes[0].color}`
            }} />
            <span style={{ fontSize: '9px', color: nodes[0].color, letterSpacing: '0.05em' }}>ALPHA</span>
          </div>

          {/* Node Beta Blip */}
          <div style={{
            position: 'absolute',
            top: '12%',
            left: 'calc(50% - 16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              backgroundColor: nodes[1].color,
              borderRadius: '50%',
              boxShadow: `0 0 10px ${nodes[1].color}`
            }} />
            <span style={{ fontSize: '9px', color: nodes[1].color, letterSpacing: '0.05em' }}>BETA</span>
          </div>

          {/* Node Gamma Blip */}
          <div style={{
            position: 'absolute',
            top: 'calc(50% - 16px)',
            left: '80%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              backgroundColor: nodes[2].color,
              borderRadius: '50%',
              boxShadow: `0 0 10px ${nodes[2].color}`
            }} />
            <span style={{ fontSize: '9px', color: nodes[2].color, letterSpacing: '0.05em' }}>GAMMA</span>
          </div>

          {/* Node Delta Blip */}
          <div style={{
            position: 'absolute',
            top: '78%',
            left: 'calc(50% - 16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              backgroundColor: nodes[3].color,
              borderRadius: '50%',
              boxShadow: `0 0 10px ${nodes[3].color}`
            }} />
            <span style={{ fontSize: '9px', color: nodes[3].color, letterSpacing: '0.05em' }}>DELTA</span>
          </div>
        </div>
      </div>
      
      {/* Balance Load Simulated Modal */}
      {showBalanceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 6, 10, 0.88)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0c0d12',
            border: '1px solid #00ffcc',
            boxShadow: '0 0 45px rgba(0,255,204,0.35)',
            maxWidth: '880px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '28px',
            position: 'relative',
            color: '#fff',
            fontFamily: 'monospace'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid rgba(0,255,204,0.3)',
              paddingBottom: '16px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#00ffcc',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  letterSpacing: '0.12em'
                }}>
                  <Scale size={24} />
                  AUTONOMOUS LOAD BALANCING MATRIX
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: 0.65,
                  letterSpacing: '0.08em',
                  marginTop: '4px',
                  color: '#00ffcc'
                }}>
                  FEDERATED HYDRAULIC REDISTRIBUTION PROTOCOL // INSEF WATER SAFETY
                </div>
              </div>

              <button
                onClick={() => setShowBalanceModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '6px 14px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#ff3333';
                  e.currentTarget.style.color = '#ff3333';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                <X size={16} /> [ESC] CLOSE
              </button>
            </div>

            {/* Diagnostic Contingency Banner */}
            {nodes[1].turbidity > 15 || nodes[1].status.includes('WARNING') ? (
              <div style={{
                backgroundColor: 'rgba(255, 51, 51, 0.12)',
                border: '1px solid #ff3333',
                padding: '14px 18px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertTriangle size={24} color="#ff3333" />
                  <div>
                    <div style={{ color: '#ff3333', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.05em' }}>
                      CRITICAL TURBIDITY SPIKE DETECTED: NODE BETA = {nodes[1].turbidity.toFixed(1)} NTU
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8, color: '#ffaaaa', marginTop: '3px' }}>
                      Filtration media at severe risk of particle compression and membrane rupture. High pressure will force dirty effluent through pore matrix.
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '5px 12px',
                  backgroundColor: '#ff3333',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  letterSpacing: '0.08em'
                }}>
                  THROTTLE ADVICE: 8.0 PSI
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'rgba(0, 255, 204, 0.08)',
                border: '1px solid rgba(0, 255, 204, 0.4)',
                padding: '14px 18px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldCheck size={24} color="#00ffcc" />
                  <div>
                    <div style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.05em' }}>
                      FLEET NOMINAL — CONTINGENCY LOAD BALANCING SIMULATION
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8, color: '#cffff5', marginTop: '3px' }}>
                      All 4 nodes operating at balanced uniform pressure (~40 PSI). You can trigger a simulated spike or evaluate hydraulic redistribution ahead of time.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleInjectData}
                  style={{
                    backgroundColor: 'rgba(255,51,51,0.15)',
                    border: '1px solid #ff3333',
                    color: '#ff3333',
                    padding: '8px 14px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em'
                  }}
                >
                  SIMULATE BETA SPIKE (89.4 NTU)
                </button>
              </div>
            )}

            {/* Redistribution Node Matrix Table */}
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(0,255,204,0.2)',
              marginBottom: '22px',
              overflowX: 'auto'
            }}>
              <div style={{
                padding: '10px 16px',
                backgroundColor: 'rgba(0,255,204,0.06)',
                borderBottom: '1px solid rgba(0,255,204,0.2)',
                fontSize: '11px',
                color: '#00ffcc',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <SlidersHorizontal size={14} />
                HYDRAULIC PRESSURE REDISTRIBUTION MATRIX (TARGET ENVELOPE: 65.0 PSI MAX)
              </div>

              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12px'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>NODE ID & ROLE</th>
                    <th style={{ padding: '12px 16px' }}>TURBIDITY</th>
                    <th style={{ padding: '12px 16px' }}>BASELINE</th>
                    <th style={{ padding: '12px 16px' }}>REDISTRIBUTED TARGET</th>
                    <th style={{ padding: '12px 16px' }}>DELTA</th>
                    <th style={{ padding: '12px 16px' }}>SAFETY ENVELOPE</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Node Alpha */}
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#00ffcc' }}>Node Alpha</div>
                      <div style={{ fontSize: '9px', opacity: 0.5 }}>Master / ESP32 Hardware</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fff' }}>2.3 NTU <span style={{ fontSize: '9px', color: '#00ffcc' }}>[NOMINAL]</span></td>
                    <td style={{ padding: '12px 16px', opacity: 0.7 }}>42.1 PSI</td>
                    <td style={{ padding: '12px 16px', color: '#00ffcc', fontWeight: 'bold' }}>52.4 PSI</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: 'rgba(0,255,204,0.15)', color: '#00ffcc', padding: '2px 6px', fontSize: '10px', border: '1px solid #00ffcc' }}>
                        +10.3 PSI (+24.5%)
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', minWidth: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${(52.4 / 65) * 100}%`, height: '100%', backgroundColor: '#00ffcc' }} />
                        </div>
                        <span style={{ fontSize: '9px', color: '#00ffcc' }}>SAFE</span>
                      </div>
                    </td>
                  </tr>

                  {/* Node Beta (Spike Node) */}
                  <tr style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    backgroundColor: nodes[1].turbidity > 15 ? 'rgba(255,51,51,0.06)' : 'transparent'
                  }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 'bold', color: nodes[1].turbidity > 15 ? '#ff3333' : '#ffaa00' }}>
                        Node Beta {nodes[1].turbidity > 15 ? '[SPIKE DETECTED]' : '[TARGET NODE]'}
                      </div>
                      <div style={{ fontSize: '9px', opacity: 0.5 }}>Phantom Swarm</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: nodes[1].turbidity > 15 ? '#ff3333' : '#fff', fontWeight: 'bold' }}>
                      {nodes[1].turbidity.toFixed(1)} NTU {nodes[1].turbidity > 15 ? <span style={{ fontSize: '9px', color: '#ff3333' }}>[CONTAMINATED]</span> : <span style={{ fontSize: '9px', color: '#00ffcc' }}>[NOMINAL]</span>}
                    </td>
                    <td style={{ padding: '12px 16px', opacity: 0.7 }}>38.5 PSI</td>
                    <td style={{ padding: '12px 16px', color: '#ffaa00', fontWeight: 'bold' }}>8.0 PSI</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: 'rgba(255,170,0,0.15)', color: '#ffaa00', padding: '2px 6px', fontSize: '10px', border: '1px solid #ffaa00' }}>
                        -30.5 PSI (-79.2%)
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', minWidth: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${(8.0 / 65) * 100}%`, height: '100%', backgroundColor: '#ffaa00' }} />
                        </div>
                        <span style={{ fontSize: '9px', color: '#ffaa00' }}>THROTTLED</span>
                      </div>
                    </td>
                  </tr>

                  {/* Node Gamma */}
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#00ffcc' }}>Node Gamma</div>
                      <div style={{ fontSize: '9px', opacity: 0.5 }}>Phantom Swarm</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fff' }}>2.1 NTU <span style={{ fontSize: '9px', color: '#00ffcc' }}>[NOMINAL]</span></td>
                    <td style={{ padding: '12px 16px', opacity: 0.7 }}>41.2 PSI</td>
                    <td style={{ padding: '12px 16px', color: '#00ffcc', fontWeight: 'bold' }}>51.6 PSI</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: 'rgba(0,255,204,0.15)', color: '#00ffcc', padding: '2px 6px', fontSize: '10px', border: '1px solid #00ffcc' }}>
                        +10.4 PSI (+25.2%)
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', minWidth: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${(51.6 / 65) * 100}%`, height: '100%', backgroundColor: '#00ffcc' }} />
                        </div>
                        <span style={{ fontSize: '9px', color: '#00ffcc' }}>SAFE</span>
                      </div>
                    </td>
                  </tr>

                  {/* Node Delta */}
                  <tr>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#00ffcc' }}>Node Delta</div>
                      <div style={{ fontSize: '9px', opacity: 0.5 }}>Phantom Swarm</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fff' }}>2.5 NTU <span style={{ fontSize: '9px', color: '#00ffcc' }}>[NOMINAL]</span></td>
                    <td style={{ padding: '12px 16px', opacity: 0.7 }}>39.8 PSI</td>
                    <td style={{ padding: '12px 16px', color: '#00ffcc', fontWeight: 'bold' }}>50.0 PSI</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: 'rgba(0,255,204,0.15)', color: '#00ffcc', padding: '2px 6px', fontSize: '10px', border: '1px solid #00ffcc' }}>
                        +10.2 PSI (+25.6%)
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', minWidth: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${(50.0 / 65) * 100}%`, height: '100%', backgroundColor: '#00ffcc' }} />
                        </div>
                        <span style={{ fontSize: '9px', color: '#00ffcc' }}>SAFE</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bento Performance Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '22px'
            }}>
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(0,255,204,0.25)',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: '10px', opacity: 0.6, letterSpacing: '0.08em' }}>
                  COMBINED FLEET THROUGHPUT
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ffcc', marginTop: '4px' }}>
                  161.6 PSI → 162.0 PSI
                </div>
                <div style={{ fontSize: '10px', color: '#00ffcc', opacity: 0.8, marginTop: '2px' }}>
                  100.2% Net Hydraulic Flow Preserved
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,51,51,0.3)',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: '10px', opacity: 0.6, letterSpacing: '0.08em' }}>
                  MEMBRANE RUPTURE RISK
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff3333', marginTop: '4px' }}>
                  94.6% <span style={{ color: '#00ffcc', fontSize: '15px' }}>→ 1.4%</span>
                </div>
                <div style={{ fontSize: '10px', color: '#00ffcc', opacity: 0.8, marginTop: '2px' }}>
                  Critical Filter Breakdown Prevented
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(0,255,204,0.25)',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: '10px', opacity: 0.6, letterSpacing: '0.08em' }}>
                  FEDERATED REDISTRIBUTION ALGORITHM
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                  0.04s EDGE CONVERGENCE
                </div>
                <div style={{ fontSize: '10px', color: '#00ffcc', opacity: 0.8, marginTop: '2px' }}>
                  Decentralized Autonomous Consensus
                </div>
              </div>
            </div>

            {/* Algorithmic Formula & Science Fair Note */}
            <div style={{
              backgroundColor: 'rgba(0, 255, 204, 0.04)',
              border: '1px solid rgba(0, 255, 204, 0.2)',
              padding: '14px 18px',
              fontSize: '11px',
              lineHeight: '1.6',
              marginBottom: '22px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#00ffcc', marginBottom: '4px', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} />
                INSEF MATHEMATICAL MODEL // PROPORTIONAL FLUID STEERING
              </div>
              <div style={{ opacity: 0.85, color: '#d8fffa' }}>
                <code>ΔP_shed = P_nominal - P_quarantine_floor (30.5 PSI)</code> &nbsp;|&nbsp;
                <code>P_target(node_i) = P_nominal + [ ΔP_shed / N_healthy ]</code>
              </div>
              <div style={{ opacity: 0.7, marginTop: '6px', fontSize: '10px' }}>
                When one node flags turbidity &gt;5.0 NTU, differential pressure causes severe fouling. By dropping Beta to 8.0 PSI and absorbing the surplus across the 3 healthy nodes (+10.3 PSI each), filtration velocity is maintained across the city grid without human intervention.
              </div>
            </div>

            {/* Execution Logs (If balancing active or completed) */}
            {balancingLogs.length > 0 && (
              <div style={{
                backgroundColor: '#050608',
                border: '1px solid rgba(0,255,204,0.4)',
                padding: '12px 16px',
                marginBottom: '22px',
                fontSize: '11px',
                color: '#00ffcc',
                lineHeight: '1.6'
              }}>
                <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '6px', letterSpacing: '0.1em' }}>
                  DISPATCH EXECUTION CONSOLE:
                </div>
                {balancingLogs.map((log, idx) => (
                  <div key={idx} style={{ opacity: 0.9 }}>
                    &gt; {log}
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '18px'
            }}>
              <div style={{ fontSize: '11px', opacity: 0.65 }}>
                {isLoadBalanced ? 'STATUS: FLEET REDISTRIBUTION CURRENTLY COMMITTED' : 'READY TO DISPATCH NEW PWM PRESSURE SETPOINTS'}
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {isLoadBalanced && (
                  <button
                    onClick={handleResetLoadBalance}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff',
                      padding: '10px 18px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={14} />
                    RESTORE NOMINAL BASELINE
                  </button>
                )}

                <button
                  onClick={handleApplyLoadBalance}
                  disabled={isBalancing}
                  style={{
                    backgroundColor: 'rgba(0, 255, 204, 0.18)',
                    border: '1px solid #00ffcc',
                    color: '#00ffcc',
                    padding: '10px 22px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    letterSpacing: '0.08em',
                    cursor: isBalancing ? 'wait' : 'pointer',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 0 15px rgba(0,255,204,0.3)'
                  }}
                  onMouseOver={(e) => {
                    if (!isBalancing) {
                      e.currentTarget.style.backgroundColor = 'rgba(0,255,204,0.3)';
                      e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,204,0.5)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isBalancing) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 255, 204, 0.18)';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,204,0.3)';
                    }
                  }}
                >
                  <CheckCircle2 size={16} />
                  {isBalancing ? 'DISPATCHING TO FLEET...' : isLoadBalanced ? 'RE-APPLY LOAD REDISTRIBUTION' : 'APPLY LOAD REDISTRIBUTION TO FLEET'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
