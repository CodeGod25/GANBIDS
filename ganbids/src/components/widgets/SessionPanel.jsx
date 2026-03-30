// ============================================================
// GANBIDS — Session Panel — Save/Load/Replay simulation runs
// ============================================================

import { useState } from 'react'
import { useSimulation } from '../../context/SimulationContext'

export default function SessionPanel({ open, onClose }) {
  const { state, actions } = useSimulation()
  const [sessionName, setSessionName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSave = async () => {
    if (!sessionName.trim()) return
    setSaving(true)
    await actions.saveSession(sessionName.trim())
    setSessionName('')
    setSaving(false)
  }

  return (
    <div className="session-panel-overlay" onClick={onClose}>
      <div className="session-panel" onClick={e => e.stopPropagation()}>
        <div className="session-panel-header">
          <h3 className="section-title">SESSION_MANAGER</h3>
          <button className="topbar-icon-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Save Session */}
        <div className="session-save-form">
          <input
            type="text" className="form-input" placeholder="Session name..."
            value={sessionName} onChange={e => setSessionName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !sessionName.trim()}>
            {saving ? 'SAVING...' : 'SAVE_SESSION'}
          </button>
        </div>

        {/* Current Stats */}
        <div className="session-current-stats">
          <div className="session-stat">
            <span className="session-stat-label">Epoch</span>
            <span className="session-stat-value">{state.epoch}</span>
          </div>
          <div className="session-stat">
            <span className="session-stat-label">Accuracy</span>
            <span className="session-stat-value">{state.accuracy.toFixed(1)}%</span>
          </div>
          <div className="session-stat">
            <span className="session-stat-label">Packets</span>
            <span className="session-stat-value">{state.packetsGenerated.toLocaleString()}</span>
          </div>
        </div>

        {/* Session List */}
        <div className="session-list">
          <div className="session-list-header">
            <span>SAVED SESSIONS ({state.sessions.length})</span>
          </div>
          {state.sessions.length === 0 ? (
            <div className="session-empty">
              <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.3 }}>folder_open</span>
              <p>No saved sessions</p>
            </div>
          ) : (
            state.sessions.map((session, i) => (
              <div key={session.id || i} className="session-item">
                <div className="session-item-info">
                  <div className="session-item-name">{session.name}</div>
                  <div className="session-item-meta">
                    {new Date(session.timestamp).toLocaleString()} · Epoch {session.epoch} · {session.accuracy?.toFixed(1)}% acc
                  </div>
                </div>
                <div className="session-item-actions">
                  <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>replay</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
