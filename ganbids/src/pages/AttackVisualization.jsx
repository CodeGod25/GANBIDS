import { useState, useRef, useEffect } from 'react'
import GlassPanel from '../components/widgets/GlassPanel'
import { useSimulation } from '../context/SimulationContext'

function PacketFlowVisualizer({ running }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div className="osi-stack" style={{ height: '100%' }}>
        {[
          { code: 'LAYER_07', name: 'Application' },
          { code: 'LAYER_04', name: 'Transport' },
          { code: 'LAYER_03', name: 'Network' },
          { code: 'IDS_SENTINEL', name: 'Inspection' },
        ].map((layer, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {i > 0 && <div style={{ width: 60, height: 1, background: 'linear-gradient(to right, transparent, rgba(69,72,79,0.2), transparent)' }} />}
            <div className="osi-layer">
              <div className="osi-layer-box">{layer.code}</div>
              <span className="osi-layer-name">{layer.name}</span>
            </div>
          </div>
        ))}
      </div>
      {running && (
        <>
          <div className="packet-stream synthetic" style={{ top: '35%', opacity: 0.6 }}>
            <div className="packet-particle" style={{ animationDuration: '4s' }} />
          </div>
          <div className="packet-stream synthetic" style={{ top: '38%', opacity: 0.3 }}>
            <div className="packet-particle" style={{ animationDuration: '5.5s', animationDelay: '1s' }} />
          </div>
          <div className="packet-stream attack" style={{ top: '62%', opacity: 0.6 }}>
            <div className="packet-particle" style={{ animationDuration: '2.5s' }} />
          </div>
          <div className="packet-stream attack" style={{ top: '65%', opacity: 0.3 }}>
            <div className="packet-particle" style={{ animationDuration: '3s', animationDelay: '0.8s' }} />
          </div>
        </>
      )}
    </div>
  )
}

function ClusteringMap({ packets }) {
  // Generate points from actual packet data
  const clusters = { DDOS: [], R2L: [], U2R: [], PROBE: [], NORMAL: [] }
  const clusterColors = { DDOS: '#2BE800', R2L: '#69DAFF', U2R: '#E90036', PROBE: '#F59E0B', NORMAL: '#73757d' }
  const clusterCenters = { DDOS: [40, 40], R2L: [140, 150], U2R: [150, 50], PROBE: [50, 150], NORMAL: [100, 100] }

  packets.slice(-60).forEach(p => {
    const type = p.attackType || p.predictedType || 'NORMAL'
    if (clusters[type]) {
      const [cx, cy] = clusterCenters[type] || [100, 100]
      clusters[type].push([cx + (Math.random() - 0.5) * 30, cy + (Math.random() - 0.5) * 30])
    }
  })

  return (
    <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: 16, borderRadius: 'var(--radius-sm)' }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
        <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(255,255,255,0.05)" />
        <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(255,255,255,0.05)" />
        {Object.entries(clusters).map(([type, points]) =>
          points.map(([x, y], i) => (
            <circle key={`${type}-${i}`} cx={x} cy={y} r="2" fill={clusterColors[type]} opacity="0.7">
              <animate attributeName="opacity" values="0;0.7" dur="0.3s" fill="freeze" />
            </circle>
          ))
        )}
      </svg>
      {Object.entries(clusters).filter(([_, pts]) => pts.length > 0).map(([type, pts]) => {
        const avgX = pts.reduce((s, p) => s + p[0], 0) / pts.length
        const avgY = pts.reduce((s, p) => s + p[1], 0) / pts.length
        return (
          <div key={type} style={{
            position: 'absolute', left: `${(avgX / 200) * 100}%`, top: `${(avgY / 200) * 100}%`,
            padding: '2px 6px', background: `${clusterColors[type]}15`, border: `1px solid ${clusterColors[type]}60`,
            borderRadius: 12, fontFamily: 'var(--font-mono)', fontSize: '0.4rem', color: clusterColors[type],
            transform: 'translate(-50%, -50%)', pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            {type} ({pts.length})
          </div>
        )
      })}
    </div>
  )
}

function TrafficReplay({ packetCapture }) {
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(42)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setPosition(p => p >= 98 ? (setPlaying(false), 0) : p + 0.5)
      }, 100)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing])

  const waveform = packetCapture.slice(-35).map(p => Math.min(10, Math.max(1, Math.floor(p.length / 150))))
  while (waveform.length < 35) waveform.push(Math.floor(Math.random() * 5) + 1)
  const attackBars = packetCapture.slice(-35).map((p, i) => p.attackType !== 'NORMAL' ? i : -1).filter(i => i >= 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div>
        <h2 className="section-title" style={{ marginBottom: 8 }}>Traffic Replay</h2>
        <p className="font-mono" style={{ fontSize: '0.625rem', color: '#64748b' }}>
          Analyzing captured sequence: <span style={{ color: 'var(--secondary-dim)' }}>LIVE_CAPTURE_{packetCapture.length}</span>
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32 }}>
        <div style={{ position: 'relative', paddingTop: 24 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#64748b' }}>00:00:00</div>
          <div style={{ position: 'absolute', top: 0, right: 0, fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#64748b' }}>
            00:{String(Math.floor(packetCapture.length / 20)).padStart(2, '0')}:00
          </div>
          <div style={{ height: 48, width: '100%', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              setPosition(((e.clientX - rect.left) / rect.width) * 100)
            }}
          >
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 2, padding: '0 4px', opacity: 0.3 }}>
              {waveform.map((h, i) => (
                <div key={i} style={{ width: 3, height: h * 4, background: attackBars.includes(i) ? 'var(--tertiary)' : 'var(--primary)', flexShrink: 0 }} />
              ))}
            </div>
            <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'var(--secondary-dim)', boxShadow: '0 0 15px #2be800', left: `${position}%`, zIndex: 10, transition: playing ? 'none' : 'left 0.2s' }}>
              <div style={{ position: 'absolute', top: -3, left: -3, width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary-dim)' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <button className="topbar-icon-btn" onClick={() => setPosition(0)}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>skip_previous</span>
          </button>
          <button onClick={() => setPlaying(!playing)} style={{
            width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,207,252,0.2)', border: '1px solid rgba(105,218,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>
              {playing ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className="topbar-icon-btn" onClick={() => setPosition(98)}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>skip_next</span>
          </button>
        </div>
      </div>
      <div className="flex-between" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
        <span style={{ color: '#64748b' }}>FRAME: {Math.floor(packetCapture.length * position / 100)}</span>
        <span style={{ color: 'var(--tertiary-dim)', fontWeight: 700 }}>PACKETS: {packetCapture.length}</span>
      </div>
    </div>
  )
}

export default function AttackVisualization() {
  const { state } = useSimulation()

  const featureImportance = [
    { name: 'protocol_type', score: 0.892 },
    { name: 'dst_bytes', score: 0.745 },
    { name: 'logged_in', score: 0.612 },
    { name: 'num_failed_logins', score: 0.438 },
    { name: 'service', score: 0.221 },
  ]

  const handleExport = () => {
    const data = { packets: state.packetCapture.slice(-100), classificationFeed: state.classificationFeed, metrics: { accuracy: state.accuracy, epoch: state.epoch } }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ganbids_attack_vectors_${Date.now()}.json`
    a.click()
  }

  return (
    <div className="space-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">ATTACK_PATTERN_VISUALIZATION</h1>
          <p className="page-subtitle">Analysis Tool // Synthetic vs Real-world Traffic Mapping {state.simulationRunning ? '(LIVE)' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExport}>EXPORT_VECTOR</button>
          <button className="btn btn-primary" onClick={() => {}} style={{ background: state.simulationRunning ? 'var(--secondary)' : 'var(--primary)' }}>
            {state.simulationRunning ? '● LIVE_SYNC' : 'LIVE_SYNC'}
          </button>
        </div>
      </div>

      <div className="grid-12">
        <div className="col-span-8">
          <div className="glass-panel-solid" style={{ padding: 24, height: 400, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div className="flex-between" style={{ marginBottom: 24, position: 'relative', zIndex: 10 }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: state.simulationRunning ? 'var(--primary)' : 'var(--outline)', animation: state.simulationRunning ? 'pulse-glow 2s infinite' : 'none' }} />
                Packet Flow Visualizer
              </h2>
            </div>
            <PacketFlowVisualizer running={state.simulationRunning} />
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <span className="font-mono" style={{ fontSize: '0.5rem', color: '#64748b', textTransform: 'uppercase' }}>Packets Generated</span>
                  <div className="font-mono" style={{ fontSize: '0.875rem', color: 'var(--on-surface)' }}>{state.packetsGenerated.toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-mono" style={{ fontSize: '0.5rem', color: '#64748b', textTransform: 'uppercase' }}>Packets Blocked</span>
                  <div className="font-mono" style={{ fontSize: '0.875rem', color: 'var(--tertiary)' }}>{state.packetsBlocked.toLocaleString()}</div>
                </div>
              </div>
              <span className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--primary)', textTransform: 'uppercase', alignSelf: 'flex-end' }}>
                Epoch {state.epoch} · {state.simulationRunning ? 'STREAMING' : 'IDLE'}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="glass-panel-solid" style={{ padding: 24, height: 400, display: 'flex', flexDirection: 'column' }}>
            <div className="flex-between" style={{ marginBottom: 24 }}>
              <h2 className="section-title">Clustering Map (t-SNE)</h2>
            </div>
            <ClusteringMap packets={state.packetCapture} />
            <div className="flex-between" style={{ marginTop: 16 }}>
              <span className="font-mono" style={{ fontSize: '0.5625rem', color: '#64748b' }}>K-means: k=5 // {state.packetCapture.length} pts</span>
            </div>
          </div>
        </div>

        <div className="col-span-6">
          <div className="glass-panel-solid" style={{ padding: 24, height: 320 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Feature Importance Profile</h2>
            <div>
              {featureImportance.map((f, i) => (
                <div key={i} className="feature-bar">
                  <div className="feature-bar-header">
                    <span className="feature-bar-name">{f.name}</span>
                    <span className="feature-bar-value">{f.score.toFixed(3)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${f.score * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-6">
          <div className="glass-panel-solid" style={{ padding: 24, height: 320 }}>
            <TrafficReplay packetCapture={state.packetCapture} />
          </div>
        </div>
      </div>
    </div>
  )
}
