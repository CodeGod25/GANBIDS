import { useState, useEffect, useRef } from 'react'
import GlassPanel from '../components/widgets/GlassPanel'
import { useSimulation } from '../context/SimulationContext'

const levelColors = { INFO: 'var(--primary)', WARN: '#f59e0b', ERROR: 'var(--tertiary-dim)', CRIT: '#ff0040' }
const protocolColors = { TCP: 'var(--primary)', UDP: 'var(--secondary)', ICMP: '#f59e0b' }

export default function SimulationLogs() {
  const { state, actions } = useSimulation()
  const [filter, setFilter] = useState('ALL')
  const [tab, setTab] = useState('logs')
  const [expandedPacket, setExpandedPacket] = useState(null)
  const [showFirewallModal, setShowFirewallModal] = useState(false)
  const [editRule, setEditRule] = useState(null)
  const terminalRef = useRef(null)

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current && tab === 'logs') {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [state.systemLogs, tab])

  const filteredLogs = filter === 'ALL' ? state.systemLogs : state.systemLogs.filter(l => l.level === filter)

  const handleExportLogs = () => {
    const text = filteredLogs.map(l => `[${l.time}] ${l.level} [${l.source}] ${l.msg}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ganbids_simulation.log'
    a.click()
  }

  return (
    <div className="space-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">SIMULATION_LOGS</h1>
          <p className="page-subtitle">System Console // {state.simulationRunning ? 'Live Event Stream' : 'Idle'}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportLogs}>EXPORT_LOG</button>
          <button className="btn btn-primary" onClick={actions.resetSimulation}>CLEAR_LOG</button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { id: 'logs', label: 'System Logs', icon: 'terminal', count: state.systemLogs.length },
          { id: 'packets', label: 'Packet Capture', icon: 'lan', count: state.packetCapture.length },
          { id: 'firewall', label: 'Firewall Rules', icon: 'shield', count: state.firewallRules.length },
        ].map(t => (
          <button key={t.id} className={`log-filter-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
            <span style={{ fontSize: '0.5rem', color: 'var(--outline)', marginLeft: 4 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Tab: System Logs */}
      {tab === 'logs' && (
        <>
          <div className="log-filters">
            {['ALL', 'INFO', 'WARN', 'ERROR', 'CRIT'].map(level => (
              <button key={level} className={`log-filter-btn ${filter === level ? 'active' : ''}`} onClick={() => setFilter(level)}>
                {level}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--outline)' }}>
              {filteredLogs.length} entries
            </span>
          </div>
          <div className="terminal" ref={terminalRef}>
            {filteredLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--outline)', fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
                {state.simulationRunning ? 'AWAITING LOG EVENTS...' : 'START SIMULATION TO SEE LOGS'}
              </div>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} className="terminal-line animate-fade-in">
                  <span className="timestamp">[{log.time}]</span>
                  <span className="level" style={{ color: levelColors[log.level] || 'var(--outline)' }}>{log.level}</span>
                  <span className="source">[{log.source}]</span>
                  <span className="msg">{log.msg}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Tab: Packet Capture */}
      {tab === 'packets' && (
        <div style={{ background: 'var(--surface-container-lowest)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '50px 80px 130px 130px 70px 60px 80px 1fr',
            gap: 8, padding: '10px 16px', background: 'var(--surface-container-highest)',
            fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700,
            color: 'var(--on-surface-variant)', textTransform: 'uppercase',
          }}>
            <span>#</span><span>Time</span><span>Source</span><span>Destination</span>
            <span>Proto</span><span>Len</span><span>Flags</span><span>Info</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            {state.packetCapture.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--outline)', fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
                {state.simulationRunning ? 'CAPTURING...' : 'START SIMULATION TO CAPTURE PACKETS'}
              </div>
            ) : (
              state.packetCapture.slice(-100).map((pkt, i) => (
                <div key={i}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '50px 80px 130px 130px 70px 60px 80px 1fr',
                    gap: 8, padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
                    background: expandedPacket === i ? 'var(--surface-container-high)' : i % 2 === 0 ? 'var(--surface-container-low)' : 'transparent',
                    borderLeft: `2px solid ${protocolColors[pkt.protocol] || 'transparent'}`,
                    cursor: 'pointer', transition: 'background 0.15s',
                  }} onClick={() => setExpandedPacket(expandedPacket === i ? null : i)}>
                    <span style={{ color: 'var(--outline)' }}>{pkt.id}</span>
                    <span style={{ color: '#64748b' }}>{pkt.time}</span>
                    <span style={{ color: 'var(--on-surface)' }}>{pkt.src}</span>
                    <span style={{ color: 'var(--on-surface)' }}>{pkt.dst}</span>
                    <span style={{ color: protocolColors[pkt.protocol], fontWeight: 700 }}>{pkt.protocol}</span>
                    <span style={{ color: 'var(--on-surface-variant)' }}>{pkt.length}</span>
                    <span style={{ color: pkt.flags?.includes('SYN') ? 'var(--primary)' : pkt.flags?.includes('RST') ? 'var(--tertiary)' : 'var(--on-surface-variant)' }}>{pkt.flags || '—'}</span>
                    <span style={{ color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pkt.info}</span>
                  </div>
                  {expandedPacket === i && (
                    <div className="packet-expanded animate-fade-in" style={{ padding: '12px 16px 12px 52px', background: 'rgba(0,207,252,0.03)', borderLeft: `2px solid ${protocolColors[pkt.protocol]}`, fontFamily: 'var(--font-mono)', fontSize: '0.5625rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        <div><span style={{ color: 'var(--outline)' }}>Attack Type:</span> <span style={{ color: pkt.attackType === 'NORMAL' ? 'var(--secondary)' : 'var(--tertiary)' }}>{pkt.attackType}</span></div>
                        <div><span style={{ color: 'var(--outline)' }}>Predicted:</span> <span style={{ color: 'var(--primary)' }}>{pkt.predictedType}</span></div>
                        <div><span style={{ color: 'var(--outline)' }}>Confidence:</span> <span style={{ color: 'var(--primary)' }}>{pkt.confidence?.toFixed(3)}</span></div>
                        <div><span style={{ color: 'var(--outline)' }}>Status:</span> <span style={{ color: pkt.blocked ? 'var(--secondary)' : 'var(--tertiary)' }}>{pkt.blocked ? 'BLOCKED' : pkt.detected ? 'DETECTED' : 'PASSED'}</span></div>
                        <div><span style={{ color: 'var(--outline)' }}>Service:</span> <span>{pkt.service}</span></div>
                        <div><span style={{ color: 'var(--outline)' }}>Src Bytes:</span> <span>{pkt.srcBytes?.toLocaleString()}</span></div>
                        <div><span style={{ color: 'var(--outline)' }}>Duration:</span> <span>{pkt.duration}s</span></div>
                        <div><span style={{ color: 'var(--outline)' }}>Protocol:</span> <span>{pkt.protocol}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div style={{ padding: '8px 16px', background: 'var(--surface-container-highest)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--outline)' }}>
            <span>Packets: {state.packetCapture.length} captured</span>
            <span>{state.simulationRunning ? '● LIVE CAPTURE' : 'Capture idle'}</span>
          </div>
        </div>
      )}

      {/* Tab: Firewall Rules */}
      {tab === 'firewall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => { setEditRule({ action: 'DENY', protocol: 'TCP', source: '0.0.0.0/0', port: '', desc: '' }); setShowFirewallModal(true) }}>
              + ADD_RULE
            </button>
          </div>

          <GlassPanel style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '60px 80px 80px 150px 80px 1fr 100px 60px',
              gap: 8, padding: '12px 16px', background: 'var(--surface-container-highest)',
              fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700,
              color: 'var(--on-surface-variant)', textTransform: 'uppercase',
            }}>
              <span>Rule #</span><span>Action</span><span>Protocol</span><span>Source</span>
              <span>Port</span><span>Description</span><span style={{ textAlign: 'right' }}>Hits</span><span></span>
            </div>
            {state.firewallRules.map((rule, i) => (
              <div key={rule.id} style={{
                display: 'grid', gridTemplateColumns: '60px 80px 80px 150px 80px 1fr 100px 60px',
                gap: 8, padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
                background: i % 2 === 0 ? 'rgba(16,19,26,0.5)' : 'transparent',
                borderLeft: `2px solid ${rule.action === 'DENY' ? 'var(--tertiary)' : 'var(--secondary)'}`,
              }}>
                <span style={{ color: 'var(--outline)' }}>#{rule.id}</span>
                <span style={{ color: rule.action === 'DENY' ? 'var(--tertiary)' : 'var(--secondary)', fontWeight: 700 }}>{rule.action}</span>
                <span style={{ color: protocolColors[rule.protocol] || 'var(--on-surface)' }}>{rule.protocol}</span>
                <span style={{ color: 'var(--on-surface)' }}>{rule.source}</span>
                <span style={{ color: 'var(--on-surface-variant)' }}>{rule.port}</span>
                <span style={{ color: 'var(--on-surface-variant)' }}>{rule.desc}</span>
                <span style={{ textAlign: 'right', color: 'var(--primary)' }}>{rule.hits.toLocaleString()}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="topbar-icon-btn" onClick={() => { setEditRule(rule); setShowFirewallModal(true) }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                  </button>
                  <button className="topbar-icon-btn" onClick={() => actions.deleteFirewallRule(rule.id)} style={{ color: 'var(--tertiary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </GlassPanel>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <GlassPanel style={{ padding: 20 }}>
              <div className="metric-label">Total Packets Inspected</div>
              <div className="metric-value" style={{ fontSize: '1.5rem' }}>{state.packetsClassified.toLocaleString()}</div>
            </GlassPanel>
            <GlassPanel style={{ padding: 20 }}>
              <div className="metric-label">Blocked by Rules</div>
              <div className="metric-value" style={{ fontSize: '1.5rem', color: 'var(--tertiary)' }}>{state.packetsBlocked.toLocaleString()}</div>
            </GlassPanel>
            <GlassPanel style={{ padding: 20 }}>
              <div className="metric-label">Block Rate</div>
              <div className="metric-value" style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>
                {state.packetsClassified > 0 ? ((state.packetsBlocked / state.packetsClassified) * 100).toFixed(2) : '0.00'}%
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {/* Firewall Modal */}
      {showFirewallModal && editRule && (
        <div className="modal-overlay" onClick={() => setShowFirewallModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="section-title">{editRule.id ? 'EDIT_RULE' : 'ADD_RULE'}</h3>
              <button className="topbar-icon-btn" onClick={() => setShowFirewallModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Action</label>
                <select className="form-input" value={editRule.action} onChange={e => setEditRule({ ...editRule, action: e.target.value })}>
                  <option value="DENY">DENY</option><option value="ALLOW">ALLOW</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Protocol</label>
                <select className="form-input" value={editRule.protocol} onChange={e => setEditRule({ ...editRule, protocol: e.target.value })}>
                  <option>TCP</option><option>UDP</option><option>ICMP</option><option>ANY</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Source CIDR</label>
                <input className="form-input" value={editRule.source} onChange={e => setEditRule({ ...editRule, source: e.target.value })} placeholder="0.0.0.0/0" />
              </div>
              <div className="form-group">
                <label className="form-label">Port</label>
                <input className="form-input" value={editRule.port} onChange={e => setEditRule({ ...editRule, port: e.target.value })} placeholder="80,443 or *" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={editRule.desc} onChange={e => setEditRule({ ...editRule, desc: e.target.value })} placeholder="Rule description" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFirewallModal(false)}>CANCEL</button>
              <button className="btn btn-primary" onClick={() => {
                if (editRule.id) actions.updateFirewallRule(editRule)
                else actions.addFirewallRule(editRule)
                setShowFirewallModal(false)
              }}>{editRule.id ? 'UPDATE' : 'CREATE'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
