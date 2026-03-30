// ============================================================
// GANBIDS — Scenario Builder
// Custom attack scenario configurator and executor
// ============================================================

import { useState } from 'react'
import GlassPanel from '../components/widgets/GlassPanel'
import MetricCard from '../components/widgets/MetricCard'
import { useSimulation } from '../context/SimulationContext'

const PRESETS = [
  { name: 'SYN Flood Stress Test', type: 'DDOS', intensity: 85, duration: 60, sources: 50, icon: 'flood' },
  { name: 'APT Multi-Vector', type: 'MIXED', intensity: 60, duration: 120, sources: 10, icon: 'bug_report' },
  { name: 'Brute Force Escalation', type: 'R2L', intensity: 70, duration: 90, sources: 5, icon: 'lock_open' },
  { name: 'Stealth Probe Sweep', type: 'PROBE', intensity: 30, duration: 180, sources: 3, icon: 'radar' },
  { name: 'Privilege Escalation', type: 'U2R', intensity: 50, duration: 45, sources: 1, icon: 'admin_panel_settings' },
  { name: 'Full Spectrum Assault', type: 'MIXED', intensity: 100, duration: 30, sources: 100, icon: 'crisis_alert' },
]

export default function ScenarioBuilder() {
  const { state, actions } = useSimulation()
  const [config, setConfig] = useState({
    name: 'Custom Scenario',
    type: 'DDOS',
    intensity: 50,
    duration: 60,
    sources: 10,
    targetNode: 'ids',
  })

  const handleRunScenario = () => {
    actions.setIntensity(config.intensity)
    actions.runScenario(config)
  }

  const handlePreset = (preset) => {
    setConfig({ ...config, ...preset })
  }

  const isRunning = state.scenarioRunning

  return (
    <div className="space-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">SCENARIO_BUILDER</h1>
          <p className="page-subtitle">Attack Simulation Engine // Design → Execute → Analyze</p>
        </div>
        <div className="page-actions">
          {isRunning ? (
            <button className="btn btn-danger" onClick={actions.stopScenario} style={{ padding: '8px 24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>stop</span>
              ABORT_SCENARIO
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleRunScenario} style={{ padding: '8px 24px', background: 'var(--secondary)', color: 'var(--on-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>play_arrow</span>
              EXECUTE_SCENARIO
            </button>
          )}
        </div>
      </div>

      {/* Live Metrics */}
      {isRunning && (
        <div className="metrics-row">
          <MetricCard label="Scenario Epoch" value={state.epoch} border="primary-container" decimals={0} />
          <MetricCard label="Detection Rate" value={state.detectionRate.toFixed(1)} unit="%" border="secondary" glow decimals={1} />
          <MetricCard label="Packets Blocked" value={state.packetsBlocked} border="tertiary" decimals={0} />
          <MetricCard label="Current Accuracy" value={state.accuracy.toFixed(1)} unit="%" border="primary" glow decimals={1} />
        </div>
      )}

      <div className="grid-12">
        {/* Config Panel */}
        <div className="col-span-5">
          <GlassPanel style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>settings</span>
              Scenario Configuration
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Scenario Name</label>
                <input className="form-input" value={config.name} onChange={e => setConfig({ ...config, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Attack Vector</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {['DDOS', 'PROBE', 'R2L', 'U2R', 'MIXED'].map(type => (
                    <button key={type}
                      className={`btn ${config.type === type ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px', fontSize: '0.625rem' }}
                      onClick={() => setConfig({ ...config, type })}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Attack Intensity</label>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{config.intensity}%</span>
                </div>
                <input type="range" className="range-input" min="1" max="100" value={config.intensity}
                  onChange={e => setConfig({ ...config, intensity: Number(e.target.value) })} />
                <div className="flex-between" style={{ marginTop: 4 }}>
                  <span className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--outline)' }}>STEALTH</span>
                  <span className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--outline)' }}>MAXIMUM</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Duration (sec)</label>
                  <input type="number" className="form-input" value={config.duration}
                    onChange={e => setConfig({ ...config, duration: Number(e.target.value) })} min={10} max={600} />
                </div>
                <div className="form-group">
                  <label className="form-label">Source Count</label>
                  <input type="number" className="form-input" value={config.sources}
                    onChange={e => setConfig({ ...config, sources: Number(e.target.value) })} min={1} max={500} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Node</label>
                <select className="form-input" value={config.targetNode}
                  onChange={e => setConfig({ ...config, targetNode: e.target.value })}>
                  {state.topologyNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                  ))}
                </select>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Presets */}
        <div className="col-span-7">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Quick Presets</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {PRESETS.map((preset, i) => (
              <div key={i}
                className="glass-panel"
                style={{
                  padding: 20, cursor: 'pointer', transition: 'all 0.2s',
                  border: config.name === preset.name ? '1px solid var(--primary)' : '1px solid transparent',
                }}
                onClick={() => handlePreset(preset)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>{preset.icon}</span>
                  <h3 className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface)' }}>{preset.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--on-surface-variant)' }}>
                  <span>TYPE: <span style={{ color: 'var(--primary)' }}>{preset.type}</span></span>
                  <span>INT: <span style={{ color: preset.intensity > 70 ? 'var(--tertiary)' : 'var(--secondary)' }}>{preset.intensity}%</span></span>
                  <span>DUR: {preset.duration}s</span>
                  <span>SRC: {preset.sources}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Scenario History */}
          {state.scenarioHistory.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h2 className="section-title" style={{ marginBottom: 16 }}>Scenario History</h2>
              <GlassPanel style={{ overflow: 'hidden' }}>
                {state.scenarioHistory.map((result, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--on-surface)' }}>{result.name || `Scenario ${i + 1}`}</span>
                    <span style={{ color: 'var(--primary)' }}>EP {result.epoch} · {result.accuracy?.toFixed(1)}% acc</span>
                  </div>
                ))}
              </GlassPanel>
            </div>
          )}
        </div>
      </div>

      {/* Live Mini Confusion Matrix (during scenario) */}
      {isRunning && (
        <GlassPanel style={{ padding: 24 }}>
          <h2 className="section-title primary" style={{ marginBottom: 16 }}>Live Scenario Results</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {state.confusionMatrix.labels.map((label, idx) => {
              const tp = state.confusionMatrix.data[idx][idx]
              const total = state.confusionMatrix.data[idx].reduce((s, v) => s + v, 0)
              const acc = total > 0 ? (tp / total * 100).toFixed(1) : '0.0'
              return (
                <GlassPanel key={label} style={{ padding: 16, textAlign: 'center' }}>
                  <div className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--on-surface-variant)', marginBottom: 8 }}>{label}</div>
                  <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: Number(acc) > 80 ? 'var(--secondary)' : 'var(--tertiary)' }}>{acc}%</div>
                  <div className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--outline)', marginTop: 4 }}>{total} samples</div>
                </GlassPanel>
              )
            })}
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
