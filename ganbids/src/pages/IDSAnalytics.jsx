import { useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import MetricCard from '../components/widgets/MetricCard'
import GlassPanel from '../components/widgets/GlassPanel'
import { useSimulation } from '../context/SimulationContext'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

function ThreatTimelineChart({ accuracyHistory, evasionHistory }) {
  const labels = accuracyHistory.map((_, i) => `EP_${i + 1}`)
  const data = {
    labels: labels.length > 0 ? labels : ['--'],
    datasets: [
      {
        label: 'IDS Accuracy', data: accuracyHistory.length > 0 ? accuracyHistory : [0],
        borderColor: '#69DAFF', backgroundColor: 'rgba(105,218,255,0.05)',
        borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true,
      },
      {
        label: 'GAN Evasion Rate', data: evasionHistory.length > 0 ? evasionHistory : [0],
        borderColor: '#FF716C', borderWidth: 2, borderDash: [6, 3], pointRadius: 0, tension: 0.4,
      },
    ],
  }
  const options = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#22262F', titleFont: { family: 'JetBrains Mono', size: 10 }, bodyFont: { family: 'JetBrains Mono', size: 10 } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { font: { family: 'JetBrains Mono', size: 9 }, color: '#73757d', maxTicksLimit: 8 } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { font: { family: 'JetBrains Mono', size: 9 }, color: '#73757d' }, min: 0, max: 100 },
    },
  }
  return <Line data={data} options={options} />
}

function ConfidenceChart({ feed }) {
  const buckets = [0, 0, 0, 0, 0, 0, 0, 0]
  const labels = ['0.0-0.1', '0.1-0.2', '0.2-0.3', '0.3-0.4', '0.4-0.5', '0.5-0.6', '0.6-0.8', '0.8-1.0']
  feed.forEach(f => {
    const c = f.confidence
    if (c < 0.1) buckets[0]++
    else if (c < 0.2) buckets[1]++
    else if (c < 0.3) buckets[2]++
    else if (c < 0.4) buckets[3]++
    else if (c < 0.5) buckets[4]++
    else if (c < 0.6) buckets[5]++
    else if (c < 0.8) buckets[6]++
    else buckets[7]++
  })
  const data = {
    labels,
    datasets: [{ data: buckets, backgroundColor: buckets.map((_, i) => `rgba(105, 218, 255, ${0.15 + (i / 8) * 0.85})`), borderWidth: 0, borderRadius: 2 }],
  }
  const options = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { font: { family: 'JetBrains Mono', size: 8 }, color: '#73757d' } }, y: { display: false } },
  }
  return <Bar data={data} options={options} />
}

function getCMClass(val, diagIdx, cellIdx) {
  if (diagIdx === cellIdx) return val > 0 ? 'high' : 'zero'
  if (val > 20) return 'medium'
  if (val > 0) return 'low'
  return 'zero'
}

export default function IDSAnalytics() {
  const { state } = useSimulation()
  const [hoveredCell, setHoveredCell] = useState(null)

  const topPatterns = [
    { name: 'SYN_FLOOD_V4', instances: state.classificationFeed.filter(f => f.type === 'DDOS').length },
    { name: 'PORT_SCAN_OS', instances: state.classificationFeed.filter(f => f.type === 'PROBE').length },
    { name: 'SSH_BRUTE_FORCE', instances: state.classificationFeed.filter(f => f.type === 'R2L').length },
    { name: 'PRIV_ESCALATION', instances: state.classificationFeed.filter(f => f.type === 'U2R').length },
    { name: 'BUFFER_OVERFLOW', instances: Math.floor(state.packetsBlocked * 0.05) },
  ].sort((a, b) => b.instances - a.instances)
  const maxInstances = Math.max(1, ...topPatterns.map(p => p.instances))

  const idsMetrics = [
    { label: 'Average Accuracy', value: state.accuracy > 0 ? state.accuracy.toFixed(2) + '%' : '--', change: state.simulationRunning ? 'LIVE' : '', changeType: 'positive', border: 'primary-container' },
    { label: 'False Positives', value: (state.falsePositives * 100).toFixed(2) + '%', change: state.falsePositives < 0.05 ? 'Optimized' : '', changeType: 'negative', border: 'tertiary' },
    { label: 'Detection Latency', value: state.latency > 0 ? state.latency.toFixed(0) : '--', unit: 'ms', change: 'P99', border: 'primary-fixed' },
    { label: 'Packets Blocked', value: state.packetsBlocked.toLocaleString(), change: '', border: 'secondary' },
  ]

  const typeColors = { DDOS: 'var(--tertiary)', PROBE: 'var(--primary)', R2L: '#F59E0B', U2R: 'var(--secondary)', NORMAL: 'var(--outline)' }

  return (
    <div className="space-y">
      <div className="metrics-row">
        {idsMetrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      <div className="grid-12">
        {/* Confusion Matrix */}
        <div className="col-span-7">
          <GlassPanel style={{ padding: 24 }}>
            <div className="flex-between" style={{ marginBottom: 32 }}>
              <div>
                <h2 className="section-title primary">Detection Accuracy Heatmap</h2>
                <p className="section-subtitle">Confusion matrix: Actual Attack vs Predicted Vector {state.simulationRunning ? '(LIVE)' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, background: 'var(--surface-container-highest)' }} />
                  <span className="text-mono-data" style={{ color: 'var(--on-surface-variant)' }}>Low</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, background: 'var(--primary)' }} />
                  <span className="text-mono-data" style={{ color: 'var(--on-surface-variant)' }}>High</span>
                </div>
              </div>
            </div>
            <div className="confusion-matrix">
              <div />
              {state.confusionMatrix.labels.map(l => <div key={l} className="cm-header">{l}</div>)}
              {state.confusionMatrix.data.map((row, ri) => (
                <div key={ri} style={{ display: 'contents' }}>
                  <div className="cm-row-label">{state.confusionMatrix.labels[ri]}</div>
                  {row.map((val, ci) => (
                    <div key={`${ri}-${ci}`}
                      className={`cm-cell ${getCMClass(val, ri, ci)}`}
                      onMouseEnter={() => setHoveredCell({ ri, ci, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{ position: 'relative', cursor: 'pointer' }}
                    >
                      {String(val).padStart(3, '0')}
                      {hoveredCell?.ri === ri && hoveredCell?.ci === ci && (
                        <div className="cm-tooltip">
                          <div>Actual: {state.confusionMatrix.labels[ri]}</div>
                          <div>Predicted: {state.confusionMatrix.labels[ci]}</div>
                          <div>Count: {val}</div>
                          <div>{ri === ci ? '✓ Correct' : '✗ Misclassified'}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span className="text-label-sm" style={{ color: '#64748b', fontWeight: 700 }}>Actual Type (Y) vs Predicted Type (X)</span>
            </div>
          </GlassPanel>
        </div>

        {/* Right Column */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <GlassPanel style={{ padding: 24, flex: 1 }}>
            <h2 className="section-title primary" style={{ marginBottom: 24 }}>Classification Metrics</h2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid rgba(69,72,79,0.2)' }}>
                <div>Category</div><div style={{ textAlign: 'right' }}>Precision</div>
                <div style={{ textAlign: 'right' }}>Recall</div><div style={{ textAlign: 'right' }}>F1-Score</div>
              </div>
              {(state.classificationMetrics.length > 0 ? state.classificationMetrics : state.confusionMatrix.labels.map(l => ({ category: l, precision: 0, recall: 0, f1: 0 })))
                .map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '6px 0', fontSize: '0.75rem' }}>
                  <div style={{ color: 'var(--on-surface)' }}>{m.category}</div>
                  <div style={{ textAlign: 'right', color: 'var(--secondary)' }}>{m.precision.toFixed(3)}</div>
                  <div style={{ textAlign: 'right', color: 'var(--secondary)' }}>{m.recall.toFixed(3)}</div>
                  <div style={{ textAlign: 'right', color: 'var(--primary-container)' }}>{m.f1.toFixed(3)}</div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel style={{ padding: 24 }}>
            <h2 className="section-title primary" style={{ marginBottom: 24 }}>Confidence Distribution</h2>
            <div style={{ height: 128 }}>
              <ConfidenceChart feed={state.classificationFeed} />
            </div>
          </GlassPanel>
        </div>

        {/* Top Detected Patterns */}
        <div className="col-span-4">
          <GlassPanel style={{ padding: 24 }}>
            <h2 className="section-title primary" style={{ marginBottom: 32 }}>Top Detected GAN Patterns</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {topPatterns.map((p, i) => (
                <div key={i}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--on-surface)', textTransform: 'uppercase' }}>{p.name}</span>
                    <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--primary)' }}>{p.instances} inst</span>
                  </div>
                  <div className="progress-bar progress-bar-thin">
                    <div className="progress-bar-fill" style={{ width: `${(p.instances / maxInstances) * 100}%`, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Threat Evolution Timeline */}
        <div className="col-span-8">
          <GlassPanel style={{ padding: 24 }}>
            <div className="flex-between" style={{ marginBottom: 32 }}>
              <div>
                <h2 className="section-title primary">Threat Evolution Timeline</h2>
                <p className="section-subtitle">IDS Resilience vs GAN Maturity {state.simulationRunning ? '(LIVE)' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 2, background: 'var(--primary)' }} />
                  <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>IDS Accuracy</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 2, background: 'var(--tertiary)' }} />
                  <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>GAN Evasion Rate</span>
                </div>
              </div>
            </div>
            <div style={{ height: 192 }}>
              <ThreatTimelineChart accuracyHistory={state.accuracyHistory} evasionHistory={state.evasionHistory} />
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Protocol Analyzer */}
      <GlassPanel style={{ padding: 24 }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: state.simulationRunning ? 'var(--secondary)' : 'var(--outline)', animation: state.simulationRunning ? 'pulse-glow 2s infinite' : 'none' }} />
            <h2 className="text-label-lg" style={{ color: 'var(--on-surface-variant)' }}>Protocol Distribution</h2>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {state.protocolDistribution.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>{p.name}: {p.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          {state.protocolDistribution.map(p => (
            <div key={p.name} style={{ width: `${p.percentage}%`, background: p.color, transition: 'width 0.6s ease' }} />
          ))}
        </div>
      </GlassPanel>

      {/* Real-Time Classification Feed */}
      <GlassPanel style={{ padding: 16 }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: state.simulationRunning ? 'var(--secondary)' : 'var(--outline)', animation: state.simulationRunning ? 'pulse-glow 2s infinite' : 'none' }} />
            <h2 className="text-label-lg" style={{ color: 'var(--on-surface-variant)' }}>Real-Time Classification Feed</h2>
          </div>
          <span className="font-mono" style={{ fontSize: '0.5625rem', color: 'var(--outline)' }}>
            {state.classificationFeed.length} EVENTS
          </span>
        </div>
        <div className="classification-feed">
          {state.classificationFeed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--outline)', fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
              {state.simulationRunning ? 'AWAITING CLASSIFICATIONS...' : 'START SIMULATION TO SEE FEED'}
            </div>
          ) : (
            state.classificationFeed.slice(0, 10).map((row, i) => (
              <div key={i} className="feed-row animate-fade-in">
                <span className="feed-time">{row.time}</span>
                <span className="feed-ip">{row.ip}</span>
                <span className="feed-type" style={{ color: typeColors[row.type] || 'var(--primary)' }}>TYPE: {row.type}</span>
                <span className="feed-sig">SIG: {row.sig?.substring(0, 32)}</span>
                <span className="feed-conf">CONF: {row.confidence?.toFixed(3)}</span>
                <span className="feed-status" style={{ color: row.blocked ? 'var(--secondary)' : 'var(--tertiary)', fontSize: '0.5rem', fontWeight: 700 }}>
                  {row.blocked ? '■ BLOCKED' : '▲ BYPASS'}
                </span>
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </div>
  )
}
