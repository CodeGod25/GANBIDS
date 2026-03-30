import { useEffect, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import MetricCard from '../components/widgets/MetricCard'
import GlassPanel from '../components/widgets/GlassPanel'
import { useSimulation } from '../context/SimulationContext'
import api from '../services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

function LossChart({ epochs, gLosses, dLosses }) {
  const data = {
    labels: epochs.length > 0 ? epochs.map(String) : ['0'],
    datasets: [
      {
        label: 'G-LOSS',
        data: gLosses.length > 0 ? gLosses : [0],
        borderColor: '#2FF801',
        backgroundColor: 'rgba(47, 248, 1, 0.05)',
        borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.4, fill: true,
      },
      {
        label: 'D-LOSS',
        data: dLosses.length > 0 ? dLosses : [0],
        borderColor: '#FF7073',
        backgroundColor: 'rgba(255, 112, 115, 0.05)',
        borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.4, fill: true,
      },
    ],
  }

  const options = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#22262F',
        titleFont: { family: 'JetBrains Mono', size: 10 },
        bodyFont: { family: 'JetBrains Mono', size: 10 },
        borderColor: 'rgba(105, 218, 255, 0.2)', borderWidth: 1, padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { font: { family: 'JetBrains Mono', size: 9 }, color: '#73757d', maxTicksLimit: 8 },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { font: { family: 'JetBrains Mono', size: 9 }, color: '#73757d' },
        min: 0, max: 2,
      },
    },
  }

  return <Line data={data} options={options} />
}

function RadarSVG() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', padding: 16 }}>
      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(115,117,125,0.1)" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(115,117,125,0.1)" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(115,117,125,0.1)" strokeWidth="0.5" />
      <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(115,117,125,0.1)" strokeWidth="0.5" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(115,117,125,0.1)" strokeWidth="0.5" />
      <polygon points="50,20 80,40 70,80 30,75 20,40" fill="rgba(0,207,252,0.2)" stroke="#00cffc" strokeWidth="1" />
      <polygon points="50,30 70,50 60,70 40,65 30,50" fill="rgba(43,232,0,0.1)" stroke="#2be800" strokeWidth="1" strokeDasharray="2" />
      <text x="50" y="8" textAnchor="middle" fill="#73757d" fontSize="5" fontFamily="JetBrains Mono">DoS</text>
      <text x="50" y="98" textAnchor="middle" fill="#73757d" fontSize="5" fontFamily="JetBrains Mono">Probe</text>
      <text x="6" y="52" textAnchor="middle" fill="#73757d" fontSize="5" fontFamily="JetBrains Mono">R2L</text>
      <text x="94" y="52" textAnchor="middle" fill="#73757d" fontSize="5" fontFamily="JetBrains Mono">U2R</text>
    </svg>
  )
}

export default function GANTraining() {
  const { state, actions } = useSimulation()
  const { lossHistory, epoch, gLoss, dLoss, hyperparams } = state

  const handleGenerateBatch = async () => {
    try {
      const data = await api.getPackets(8)
      console.log('Generated packets:', data)
    } catch {}
  }

  const ganMetrics = [
    { label: 'Epoch Progress', value: epoch, unit: '', change: state.simulationRunning ? '/ ∞' : '', changeType: '', border: 'primary-container', decimals: 0 },
    { label: 'Generator Loss', value: gLoss.toFixed(4), unit: '', change: '', border: 'secondary', valueColor: 'var(--secondary)', decimals: 4 },
    { label: 'Discriminator Loss', value: dLoss.toFixed(4), unit: '', change: '', border: 'tertiary', valueColor: 'var(--tertiary)', decimals: 4 },
    { label: 'Detection Accuracy', value: state.accuracy > 0 ? state.accuracy.toFixed(1) + '%' : '--', unit: '', change: state.accuracy > 95 ? '↑ CONVERGING' : '', changeType: 'positive', border: 'primary' },
  ]

  // Synthetic packets from recent captures
  const recentPackets = state.packetCapture.slice(-4).map((p, i) => ({
    id: `#PKT_${String(p.id).padStart(4, '0')}`,
    class: p.attackType || 'NORMAL',
    protocol: p.protocol,
    service: p.service,
    srcBytes: p.srcBytes?.toLocaleString() || '0',
    duration: p.duration + 's',
  }))

  return (
    <div className="space-y">
      {/* Hero Metrics */}
      <div className="metrics-row">
        {ganMetrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* Graphs & Parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24 }}>
        {/* Loss Curves */}
        <GlassPanel style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div className="flex-between" style={{ marginBottom: 24 }}>
            <h3 className="section-title">Loss Convergence Profile</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 2, background: '#2FF801' }} />
                <span className="text-mono-data" style={{ color: 'var(--on-surface-variant)' }}>G-LOSS {gLoss.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 2, background: '#FF7073' }} />
                <span className="text-mono-data" style={{ color: 'var(--on-surface-variant)' }}>D-LOSS {dLoss.toFixed(4)}</span>
              </div>
            </div>
          </div>
          <div style={{ height: 256 }}>
            <LossChart epochs={lossHistory.epochs} gLosses={lossHistory.gLosses} dLosses={lossHistory.dLosses} />
          </div>
        </GlassPanel>

        {/* Control Panel */}
        <div style={{ background: 'var(--surface-container-high)', padding: 24, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="section-title" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>tune</span>
            Training Control
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 12, background: state.simulationRunning ? 'rgba(47, 248, 1, 0.1)' : 'rgba(115,117,125,0.1)', borderRadius: 'var(--radius-xs)', border: `1px solid ${state.simulationRunning ? 'rgba(47, 248, 1, 0.2)' : 'rgba(115,117,125,0.2)'}` }}>
              <span className="font-mono" style={{ fontSize: '0.625rem', color: state.simulationRunning ? '#2FF801' : '#73757d', textTransform: 'uppercase' }}>
                {state.simulationRunning ? '● TRAINING ACTIVE' : '○ IDLE'}
              </span>
              <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: 8 }}>
                Epoch: {epoch}
              </div>
            </div>

            <button onClick={() => state.simulationRunning ? actions.stopSimulation() : actions.startSimulation()}
              className={`btn ${state.simulationRunning ? 'btn-danger' : 'btn-primary'}`}
              style={{ width: '100%', padding: '12px' }}>
              {state.simulationRunning ? 'STOP TRAINING' : 'START TRAINING'}
            </button>

            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 className="section-title" style={{ fontSize: '0.75rem', marginBottom: 12 }}>Hyper-Parameters</h4>
              {[
                { label: 'Learning Rate', key: 'learningRate', value: hyperparams.learningRate, step: 0.0001, min: 0.00001, max: 0.01 },
                { label: 'Batch Size', key: 'batchSize', value: hyperparams.batchSize, step: 8, min: 8, max: 256 },
                { label: 'Noise Dim', key: 'noiseDim', value: hyperparams.noiseDim, step: 10, min: 10, max: 500 },
              ].map((param, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>{param.label}</span>
                    <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--primary)' }}>{param.value}</span>
                  </div>
                  <input type="range" className="range-input" min={param.min} max={param.max} step={param.step}
                    value={param.value}
                    onChange={e => actions.updateHyperparams({ [param.key]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Synthetic Output & Radar */}
      <div className="grid-3">
        {/* Packet Cards */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="section-title">Synthetic Network Output</h3>
              <p className="text-mono-data" style={{ color: 'var(--outline)', marginTop: 4 }}>
                {state.simulationRunning ? 'Live adversarial packet generation' : 'Start simulation to generate packets'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-secondary">{state.simulationRunning ? 'Gen-Active' : 'Gen-Idle'}</span>
              <button className="btn btn-ghost" onClick={handleGenerateBatch} style={{ padding: '4px 12px', fontSize: '0.5rem' }}>
                GENERATE_BATCH
              </button>
            </div>
          </div>
          <div className="grid-2">
            {(recentPackets.length > 0 ? recentPackets : [
              { id: '#PKT_----', class: '--', protocol: '--', service: '--', srcBytes: '--', duration: '--' },
            ]).map((pkt, i) => (
              <div key={i} className="packet-card">
                <div className="packet-card-header">
                  <span className="packet-card-id">{pkt.id}</span>
                  <span className="packet-card-class">Class: {pkt.class}</span>
                </div>
                <div className="packet-card-grid">
                  <div><div className="packet-field-label">Protocol</div><div className="packet-field-value">{pkt.protocol}</div></div>
                  <div><div className="packet-field-label">Service</div><div className="packet-field-value">{pkt.service}</div></div>
                  <div><div className="packet-field-label">Src_Bytes</div><div className="packet-field-value">{pkt.srcBytes}</div></div>
                  <div><div className="packet-field-label">Duration</div><div className="packet-field-value">{pkt.duration}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar */}
        <GlassPanel style={{ padding: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="section-title" style={{ marginBottom: 24 }}>Attack Vector Diversity</h3>
          <div style={{ aspectRatio: '1', position: 'relative' }}>
            <RadarSVG />
          </div>
          <div style={{ marginTop: 24 }}>
            <div className="flex-between">
              <span className="font-mono" style={{ fontSize: '0.5625rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Packets Blocked</span>
              <span className="font-mono" style={{ fontSize: '0.5625rem', color: 'var(--secondary-dim)' }}>{state.packetsBlocked.toLocaleString()}</span>
            </div>
            <div className="progress-bar progress-bar-thin" style={{ marginTop: 8 }}>
              <div className="progress-bar-fill secondary" style={{ width: `${state.packetsGenerated > 0 ? Math.min(100, (state.packetsBlocked / state.packetsGenerated) * 100) : 0}%`, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Engine Log */}
      <div className="log-container">
        <div className="log-header">
          <span className="log-header-title">Kerrigan_Engine_Log</span>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--outline)', cursor: 'pointer' }}>expand_more</span>
        </div>
        <div className="log-body">
          {state.systemLogs.slice(-4).map((log, i) => (
            <p key={i}>
              <span className={`log-level-${log.level === 'ERROR' || log.level === 'CRIT' ? 'alert' : 'success'}`}>[{log.time}]</span>
              {' '}{log.level}: {log.msg}
            </p>
          ))}
          {state.systemLogs.length === 0 && (
            <p><span className="log-level-success">[--:--:--]</span> Awaiting simulation start...</p>
          )}
        </div>
      </div>
    </div>
  )
}
