// ============================================================
// GANBIDS — Alert System — Toast notifications + bell dropdown
// ============================================================

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSimulation } from '../../context/SimulationContext'

function AlertToast({ alert, onDismiss }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setExiting(true)
      setTimeout(onDismiss, 300)
    }, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const sevColor = alert.severity === 'critical' ? 'var(--tertiary)' :
                   alert.severity === 'warning' ? '#F59E0B' : 'var(--primary)'

  return (
    <div className={`alert-toast ${exiting ? 'exit' : 'enter'}`} style={{ borderLeftColor: sevColor }}>
      <div className="alert-toast-header">
        <span className="alert-toast-severity" style={{ color: sevColor }}>
          {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵'} {alert.severity?.toUpperCase()}
        </span>
        <button className="alert-toast-close" onClick={() => { setExiting(true); setTimeout(onDismiss, 300) }}>✕</button>
      </div>
      <div className="alert-toast-message">{alert.message}</div>
      <div className="alert-toast-time">{new Date(alert.time).toLocaleTimeString()}</div>
    </div>
  )
}

export function AlertToastContainer() {
  const { alertQueue, setAlertQueue } = useSimulation()
  const [visibleAlerts, setVisibleAlerts] = useState([])

  useEffect(() => {
    if (alertQueue.length > 0) {
      setVisibleAlerts(prev => [...alertQueue.slice(0, 3), ...prev].slice(0, 5))
      setAlertQueue([])
    }
  }, [alertQueue, setAlertQueue])

  return (
    <div className="alert-toast-container">
      {visibleAlerts.map((alert, i) => (
        <AlertToast
          key={alert.id || i}
          alert={alert}
          onDismiss={() => setVisibleAlerts(prev => prev.filter((_, idx) => idx !== i))}
        />
      ))}
    </div>
  )
}

export function AlertBell() {
  const { state, actions } = useSimulation()
  const [open, setOpen] = useState(false)
  const unread = state.alerts.filter(a => !a.read).length

  return (
    <div className="alert-bell-container">
      <button className="topbar-icon-btn" onClick={() => setOpen(!open)}>
        <span className="material-symbols-outlined">notifications</span>
        {unread > 0 && <span className="notification-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <>
          <div className="alert-bell-backdrop" onClick={() => setOpen(false)} />
          <div className="alert-bell-dropdown">
            <div className="alert-bell-header">
              <span>ALERTS ({state.alerts.length})</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.5rem' }} onClick={() => {
                  // Hack to clear alerts by using dismissing each or a generic action
                  if (actions.clearAlerts) actions.clearAlerts()
                  else state.alerts.forEach((_, i) => actions.dismissAlert(0))
                }}>CLEAR ALL</button>
                <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.5rem' }} onClick={() => setOpen(false)}>CLOSE</button>
              </div>
            </div>
            <div className="alert-bell-list">
              {state.alerts.length === 0 ? (
                <div className="alert-bell-empty">No alerts</div>
              ) : (
                state.alerts.slice(0, 20).map((alert, i) => {
                  const sevColor = alert.severity === 'critical' ? 'var(--tertiary)' :
                                   alert.severity === 'warning' ? '#F59E0B' : 'var(--primary)'
                  return (
                    <div key={i} className="alert-bell-item" style={{ borderLeftColor: sevColor }}>
                      <div className="alert-bell-item-msg">{alert.message}</div>
                      <div className="alert-bell-item-time">
                        {alert.time ? new Date(alert.time).toLocaleTimeString() : ''}
                      </div>
                      <button className="alert-bell-dismiss" onClick={() => actions.dismissAlert(i)}>✕</button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function AlertConfigModal({ open, onClose }) {
  const { state, actions } = useSimulation()
  const [thresholds, setThresholds] = useState(state.alertThresholds)

  if (!open) return null

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="section-title">ALERT_CONFIGURATION</h3>
          <button className="topbar-icon-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Min Detection Accuracy (%)</label>
            <input type="number" className="form-input" value={thresholds.accuracyMin}
              onChange={e => setThresholds(t => ({ ...t, accuracyMin: Number(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Max False Positive Rate</label>
            <input type="number" step="0.01" className="form-input" value={thresholds.falsePositiveMax}
              onChange={e => setThresholds(t => ({ ...t, falsePositiveMax: Number(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Max Throughput (events/sec)</label>
            <input type="number" className="form-input" value={thresholds.throughputMax}
              onChange={e => setThresholds(t => ({ ...t, throughputMax: Number(e.target.value) }))} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="toggle">
              <input type="checkbox" checked={thresholds.criticalAttack}
                onChange={e => setThresholds(t => ({ ...t, criticalAttack: e.target.checked }))} />
              <span className="toggle-slider" />
            </label>
            <span className="form-label" style={{ margin: 0 }}>Alert on critical attacks (U2R)</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>CANCEL</button>
          <button className="btn btn-primary" onClick={() => { actions.setAlertThresholds(thresholds); onClose() }}>APPLY</button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default AlertToastContainer
