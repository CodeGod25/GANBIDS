import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '../components/widgets/MetricCard'
import GlassPanel from '../components/widgets/GlassPanel'
import { useSimulation } from '../context/SimulationContext'

function NetworkCanvas() {
  const canvasRef = useRef(null)
  const animRef = useRef(0)
  const { state } = useSimulation()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const W = rect.width, H = rect.height

    const nodes = state.topologyNodes.map(n => ({
      ...n,
      x: (n.x / 800) * W,
      y: (n.y / 450) * H,
    }))
    const nodeMap = {}
    nodes.forEach(n => nodeMap[n.id] = n)

    let particles = []
    const spawnParticle = (edge) => {
      const from = nodeMap[edge.from], to = nodeMap[edge.to]
      if (!from || !to) return
      particles.push({
        x: from.x, y: from.y,
        tx: to.x, ty: to.y,
        progress: 0,
        speed: 0.005 + Math.random() * 0.008,
        color: edge.color,
        size: 2 + Math.random() * 2,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Draw edges
      state.topologyEdges.forEach(edge => {
        const from = nodeMap[edge.from], to = nodeMap[edge.to]
        if (!from || !to) return
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = edge.color + '30'
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      // Draw particles
      particles.forEach(p => {
        p.progress += p.speed
        const x = p.x + (p.tx - p.x) * p.progress
        const y = p.y + (p.ty - p.y) * p.progress
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.shadowBlur = 0
      })
      particles = particles.filter(p => p.progress < 1)

      // Draw nodes
      nodes.forEach(n => {
        // Outer glow
        ctx.beginPath()
        ctx.arc(n.x, n.y, 24, 0, Math.PI * 2)
        ctx.strokeStyle = n.color + '15'
        ctx.lineWidth = 4
        ctx.stroke()

        // Node body
        ctx.beginPath()
        ctx.arc(n.x, n.y, 18, 0, Math.PI * 2)
        ctx.fillStyle = '#0B0E14'
        ctx.strokeStyle = n.color + '60'
        ctx.lineWidth = 1.5
        ctx.fill()
        ctx.stroke()

        // Icon
        ctx.fillStyle = n.color
        ctx.font = '8px "JetBrains Mono"'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n.label.substring(0, 3), n.x, n.y)

        // Label
        ctx.fillStyle = '#64748b'
        ctx.font = '7px "JetBrains Mono"'
        ctx.fillText(n.label, n.x, n.y + 30)
      })

      // Spawn particles based on simulation intensity
      const spawnRate = state.simulationRunning ? 0.03 + (state.intensity / 100) * 0.15 : 0.02
      if (Math.random() < spawnRate) {
        const edge = state.topologyEdges[Math.floor(Math.random() * state.topologyEdges.length)]
        if (edge?.animated) spawnParticle(edge)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [state.topologyNodes, state.topologyEdges, state.simulationRunning, state.intensity])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}

export default function LiveDashboard() {
  const { state, actions } = useSimulation()
  const navigate = useNavigate()

  const threatLevel = state.accuracy > 95 ? 'LOW' : state.accuracy > 85 ? 'MEDIUM' : state.accuracy > 0 ? 'HIGH' : 'N/A'
  const threatColor = threatLevel === 'LOW' ? 'var(--secondary)' :
                      threatLevel === 'MEDIUM' ? '#F59E0B' : 'var(--tertiary)'

  const metrics = [
    { label: 'Detection Accuracy', value: state.accuracy > 0 ? state.accuracy.toFixed(1) : '0.0', unit: '%', change: state.simulationRunning ? '↑ LIVE' : '', changeType: 'positive', border: 'primary', glow: state.simulationRunning, decimals: 1 },
    { label: 'Packets Classified', value: state.packetsClassified, unit: '', change: state.simulationRunning ? 'STREAMING' : '', changeType: 'neutral', border: 'primary-container', decimals: 0 },
    { label: 'Average Latency', value: state.latency > 0 ? state.latency.toFixed(0) : '0', unit: 'ms', change: 'P99', changeType: 'neutral', border: 'outline', decimals: 0 },
    { label: 'Threat Level', value: threatLevel, unit: '', change: '', changeType: '', border: 'secondary', valueColor: threatColor },
  ]

  return (
    <div className="space-y">
      {/* Metrics */}
      <div className="metrics-row">
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* Main Grid */}
      <div className="grid-12">
        {/* Network Visualization */}
        <div className="col-span-8">
          <GlassPanel style={{ padding: '24px', height: 500, display: 'flex', flexDirection: 'column' }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div>
                <h3 className="section-title">Synthetic Attack Flow</h3>
                <p className="text-mono-data" style={{ color: 'var(--primary)', marginTop: 4 }}>
                  {state.simulationRunning ? 'LIVE — GAN GENERATOR → IDS INFRASTRUCTURE' : 'IDLE — START SIMULATION TO ACTIVATE'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-primary">NODE_COUNT: {state.topologyNodes.length}</span>
                <span className="badge badge-secondary">
                  {state.simulationRunning ? `FLOWS: ${state.packetsGenerated % 100}` : 'STANDBY'}
                </span>
              </div>
            </div>
            <div className="topology-container" style={{ flex: 1 }}>
              <NetworkCanvas />
              <div className="topology-overlay">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: state.simulationRunning ? 'var(--secondary)' : 'var(--outline)', animation: state.simulationRunning ? 'pulse-glow 2s infinite' : 'none' }} />
                  <span>{state.simulationRunning ? 'GEN_01: GENERATING...' : 'GEN_01: IDLE'}</span>
                </div>
                <div style={{ color: 'var(--on-surface-variant)' }}>Epoch: {state.epoch}</div>
                <div style={{ color: 'var(--on-surface-variant)' }}>G-Loss: {state.gLoss.toFixed(4)}</div>
              </div>
            </div>
          </GlassPanel>

          {/* Control Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 24 }}>
            <GlassPanel style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, marginRight: 48 }}>
                <div className="flex-between" style={{ marginBottom: 16 }}>
                  <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Attack Intensity</span>
                  <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--primary)' }}>{state.intensity}%</span>
                </div>
                <input type="range" className="range-input" min="1" max="100"
                  value={state.intensity} onChange={e => actions.setIntensity(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <label className="toggle">
                    <input type="checkbox" checked={state.autoTuning} onChange={() => actions.setAutoTuning(!state.autoTuning)} />
                    <span className="toggle-slider" />
                  </label>
                  <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Auto-Tuning</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '12px 32px', fontWeight: 900, fontSize: '0.875rem', letterSpacing: '-0.02em',
                    background: state.simulationRunning ? 'var(--tertiary)' : 'var(--secondary)',
                    color: state.simulationRunning ? '#fff' : 'var(--on-secondary)',
                  }}
                  onClick={() => state.simulationRunning ? actions.stopSimulation() : actions.startSimulation()}
                >
                  {state.simulationRunning ? 'STOP_SIM' : 'START_SIM'}
                </button>
              </div>
            </GlassPanel>

            <GlassPanel style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
              <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Detection Rate</span>
              <div className="metric-value">{state.detectionRate > 0 ? state.detectionRate.toFixed(1) : '0'}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--outline)' }}>%</span></div>
              <div className="progress-bar progress-bar-thin" style={{ marginTop: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${state.detectionRate}%`, transition: 'width 0.8s ease' }} />
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* Event Log */}
        <div className="col-span-4">
          <GlassPanel style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="event-log">
              <div className="event-log-header">
                <h3>Attack Event Log</h3>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: state.simulationRunning ? 'var(--secondary)' : 'var(--primary)' }}>terminal</span>
              </div>
              <div className="event-log-body">
                {state.attackLog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--outline)', fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
                    {state.simulationRunning ? 'AWAITING EVENTS...' : 'START SIMULATION TO SEE EVENTS'}
                  </div>
                ) : (
                  state.attackLog.map((evt, i) => (
                    <div key={i} className={`event-item ${evt.severity === 'alert' ? 'alert' : ''} animate-fade-in`}>
                      <div className="event-item-header">
                        <span className="event-item-time">{evt.time}</span>
                        <span className={`event-item-status ${evt.severity}`}>
                          [{evt.severity === 'alert' ? 'ALERT' : 'DETECTED'}]
                        </span>
                      </div>
                      <div className="event-item-detail">
                        <div><span className="label">TYPE:</span> {evt.type}</div>
                        <div><span className="label">SRC:</span> {evt.source}</div>
                      </div>
                      <div className={`event-item-result ${evt.severity === 'alert' ? 'bypass' : 'blocked'}`}>
                        STATUS: {evt.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="event-log-footer" onClick={() => navigate('/analytics')} style={{ cursor: 'pointer' }}>
                View Detailed Report →
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
