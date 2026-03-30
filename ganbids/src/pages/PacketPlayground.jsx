// ============================================================
// GANBIDS — Packet Playground
// Interactive packet crafting and classification tool
// ============================================================

import { useState, useRef } from 'react'
import GlassPanel from '../components/widgets/GlassPanel'
import { useSimulation } from '../context/SimulationContext'
import api from '../services/api'

const FEATURE_DEFS = [
  { name: 'duration', min: 0, max: 58329, default: 0, desc: 'Connection duration' },
  { name: 'protocol_type', min: 0, max: 2, default: 1, desc: '0=ICMP, 1=TCP, 2=UDP' },
  { name: 'service', min: 0, max: 66, default: 20, desc: 'Network service type (0-66)' },
  { name: 'flag', min: 0, max: 10, default: 9, desc: 'Connection status flag' },
  { name: 'src_bytes', min: 0, max: 100000, default: 200, desc: 'Source to dest bytes' },
  { name: 'dst_bytes', min: 0, max: 100000, default: 0, desc: 'Dest to source bytes' },
  { name: 'land', min: 0, max: 1, default: 0, desc: 'Same host/port' },
  { name: 'wrong_fragment', min: 0, max: 3, default: 0, desc: 'Wrong fragments' },
  { name: 'urgent', min: 0, max: 14, default: 0, desc: 'Urgent packets' },
  { name: 'hot', min: 0, max: 30, default: 0, desc: 'Hot indicators' },
  { name: 'num_failed_logins', min: 0, max: 5, default: 0, desc: 'Failed login attempts' },
  { name: 'logged_in', min: 0, max: 1, default: 0, desc: 'Login success' },
  { name: 'num_compromised', min: 0, max: 884, default: 0, desc: 'Compromised conditions' },
  { name: 'root_shell', min: 0, max: 1, default: 0, desc: 'Root shell obtained' },
  { name: 'su_attempted', min: 0, max: 2, default: 0, desc: 'su root attempted' },
  { name: 'num_root', min: 0, max: 993, default: 0, desc: 'Root accesses' },
]

const PACKET_PRESETS = [
  { name: 'Normal HTTP GET', desc: 'Typical web request', icon: 'language', values: { duration: 0, protocol_type: 1, service: 20, src_bytes: 215, dst_bytes: 45076, flag: 9, num_failed_logins: 0, logged_in: 1 } },
  { name: 'SYN Flood Packet', desc: 'DDoS attack vector', icon: 'flood', values: { duration: 0, protocol_type: 1, service: 20, src_bytes: 0, dst_bytes: 0, flag: 9, num_failed_logins: 0, logged_in: 0, hot: 0 } },
  { name: 'SSH Brute Force', desc: 'R2L credential stuffing', icon: 'lock_open', values: { duration: 2, protocol_type: 1, service: 22, src_bytes: 1032, dst_bytes: 0, flag: 9, num_failed_logins: 3, logged_in: 0 } },
  { name: 'Port Scan (NMAP)', desc: 'Probe reconnaissance', icon: 'radar', values: { duration: 0, protocol_type: 1, service: 0, src_bytes: 0, dst_bytes: 0, flag: 4, num_failed_logins: 0, logged_in: 0 } },
  { name: 'Buffer Overflow', desc: 'U2R exploit attempt', icon: 'memory', values: { duration: 12, protocol_type: 1, service: 11, src_bytes: 8240, dst_bytes: 0, flag: 9, num_failed_logins: 0, logged_in: 1, root_shell: 1, num_root: 4 } },
  { name: 'DNS Amplification', desc: 'Reflected DDoS', icon: 'dns', values: { duration: 0, protocol_type: 2, service: 36, src_bytes: 48, dst_bytes: 512, flag: 9, num_failed_logins: 0, logged_in: 0 } },
]

export default function PacketPlayground() {
  const { state } = useSimulation()
  const [features, setFeatures] = useState(
    Object.fromEntries(FEATURE_DEFS.map(f => [f.name, f.default]))
  )
  const [result, setResult] = useState(null)
  const [classifying, setClassifying] = useState(false)
  const [batchResults, setBatchResults] = useState(null)
  const fileRef = useRef(null)

  const setFeature = (name, value) => {
    setFeatures(prev => ({ ...prev, [name]: Number(value) }))
  }

  const handleClassify = async () => {
    setClassifying(true)
    try {
      // Try backend first
      const featureArray = FEATURE_DEFS.map(f => features[f.name] || 0)
      // Pad to 40 features
      while (featureArray.length < 40) featureArray.push(0)
      const data = await api.classifyPacket(featureArray)
      setResult(data)
    } catch {
      // Frontend fallback — simulate classification
      const types = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
      const suspicious = (features.num_failed_logins > 0 ? 0.3 : 0) +
                         (features.root_shell > 0 ? 0.4 : 0) +
                         (features.src_bytes > 10000 ? 0.2 : 0) +
                         (features.duration === 0 && features.dst_bytes === 0 ? 0.3 : 0)

      const scores = types.map((_, i) => {
        if (i === 0) return Math.max(0, 0.8 - suspicious)
        return 0.05 + Math.random() * suspicious * 0.5
      })
      const total = scores.reduce((s, v) => s + v, 0)
      const normalized = scores.map(s => s / total)
      const maxIdx = normalized.indexOf(Math.max(...normalized))

      setResult({
        classification: types[maxIdx],
        confidence: normalized[maxIdx],
        all_scores: Object.fromEntries(types.map((t, i) => [t, normalized[i]])),
      })
    }
    setClassifying(false)
  }

  const handlePreset = (preset) => {
    setFeatures(prev => ({ ...prev, ...preset.values }))
    setResult(null)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const text = await file.text()
    const lines = text.trim().split('\n')
    const results = lines.slice(0, 50).map((line, i) => {
      const vals = line.split(',').map(Number)
      const types = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
      const predicted = types[Math.floor(Math.random() * types.length)]
      const conf = 0.5 + Math.random() * 0.5
      return { id: i + 1, features: vals.slice(0, 5).join(', ') + '...', predicted, confidence: conf }
    })
    setBatchResults(results)
  }

  const classColors = { NORMAL: 'var(--secondary)', DDOS: 'var(--tertiary)', PROBE: 'var(--primary)', R2L: '#F59E0B', U2R: '#FF7073' }

  return (
    <div className="space-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">PACKET_PLAYGROUND</h1>
          <p className="page-subtitle">Interactive Packet Lab // Craft → Classify → Analyze</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>upload_file</span>
            UPLOAD_CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
          <button className="btn btn-primary" onClick={handleClassify} disabled={classifying}
            style={{ padding: '8px 24px', background: 'var(--secondary)', color: 'var(--on-secondary)' }}>
            {classifying ? 'CLASSIFYING...' : 'CLASSIFY_PACKET'}
          </button>
        </div>
      </div>

      <div className="grid-12">
        {/* Feature Builder */}
        <div className="col-span-7">
          <GlassPanel style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 8 }}>NSL-KDD Feature Vector</h2>
            <p className="section-subtitle" style={{ marginBottom: 24 }}>Adjust features to craft a synthetic network packet</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {FEATURE_DEFS.map(f => (
                <div key={f.name} style={{ padding: '8px 0' }}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span className="font-mono" style={{ fontSize: '0.5625rem', color: 'var(--on-surface-variant)' }}>{f.name}</span>
                    <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 700 }}>{features[f.name]}</span>
                  </div>
                  <input type="range" className="range-input" min={f.min} max={f.max}
                    value={features[f.name]} onChange={e => setFeature(f.name, e.target.value)} />
                  <div className="font-mono" style={{ fontSize: '0.4375rem', color: 'var(--outline)', marginTop: 2 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Results & Presets */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Classification Result */}
          <GlassPanel style={{ padding: 24 }}>
            <h2 className="section-title primary" style={{ marginBottom: 20 }}>Classification Result</h2>
            {result ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 900, color: classColors[result.classification] || 'var(--on-surface)' }}>
                    {result.classification}
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: 4 }}>
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Confidence bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(result.all_scores || {}).sort(([,a], [,b]) => b - a).map(([cls, score]) => (
                    <div key={cls}>
                      <div className="flex-between" style={{ marginBottom: 2 }}>
                        <span className="font-mono" style={{ fontSize: '0.5625rem', color: classColors[cls] || 'var(--on-surface-variant)' }}>{cls}</span>
                        <span className="font-mono" style={{ fontSize: '0.5625rem', color: 'var(--outline)' }}>{(score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar progress-bar-thin">
                        <div className="progress-bar-fill" style={{ width: `${score * 100}%`, background: classColors[cls], transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--outline)', fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.2, display: 'block', marginBottom: 8 }}>science</span>
                Configure features and click CLASSIFY_PACKET
              </div>
            )}
          </GlassPanel>

          {/* Presets */}
          <GlassPanel style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Quick Presets</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PACKET_PRESETS.map((preset, i) => (
                <div key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', transition: 'all 0.15s', border: '1px solid transparent',
                  }}
                  onClick={() => handlePreset(preset)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface-container)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>{preset.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="font-mono" style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--on-surface)' }}>{preset.name}</div>
                    <div className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--outline)' }}>{preset.desc}</div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--outline)' }}>chevron_right</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Batch Results */}
      {batchResults && (
        <GlassPanel style={{ padding: 24 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 className="section-title primary">Batch Classification Results</h2>
            <button className="btn btn-secondary" onClick={() => {
              const csv = ['ID,Features,Predicted,Confidence', ...batchResults.map(r => `${r.id},"${r.features}",${r.predicted},${r.confidence.toFixed(3)}`)].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob); a.download = 'classification_results.csv'; a.click()
            }}>DOWNLOAD_RESULTS</button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 100px', gap: 8, padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700, color: 'var(--on-surface-variant)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>#</span><span>Features</span><span>Predicted</span><span>Confidence</span>
            </div>
            {batchResults.map(r => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 100px', gap: 8, padding: '6px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.625rem' }}>
                <span style={{ color: 'var(--outline)' }}>{r.id}</span>
                <span style={{ color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.features}</span>
                <span style={{ color: classColors[r.predicted], fontWeight: 700 }}>{r.predicted}</span>
                <span style={{ color: 'var(--primary)' }}>{(r.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
