import { useState, useRef, useEffect } from 'react'
import { useSimulation } from '../../context/SimulationContext'
import { generateThreatReport } from '../../utils/pdfGenerator'
import { AlertBell, AlertConfigModal } from '../widgets/AlertSystem'

export default function TopBar() {
  const { state, actions } = useSimulation()
  const [alertConfigOpen, setAlertConfigOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return String(n)
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-stats">
          <span className="topbar-stat active" style={{
            color: state.simulationRunning ? '#2FF801' : state.backendOnline ? '#00D1FF' : '#73757D'
          }}>
            System Status: {state.simulationRunning ? 'SIMULATING' : state.backendOnline ? 'READY' : 'OFFLINE'}
          </span>
          <span className="topbar-stat muted">
            Packets: {formatNumber(state.packetsGenerated)}
          </span>
          <span className="topbar-stat muted">
            Throughput: {formatNumber(Math.round(state.throughput))} EPS
          </span>
          <span className="topbar-stat muted">
            Accuracy: {state.accuracy > 0 ? state.accuracy.toFixed(1) + '%' : '--'}
          </span>
        </div>
      </div>
      
      <div className="topbar-right">
        <div className="topbar-search" style={{ position: 'relative' }}>
          <span className="material-symbols-outlined">search</span>
          <input 
            type="text" 
            placeholder="QUERY_SYSTEM..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          {searchFocused && searchQuery.length > 0 && (
            <div className="alert-bell-dropdown" style={{ top: '100%', left: 0, width: '100%' }}>
              <div className="alert-bell-header" style={{ padding: '8px 12px' }}>SEARCH RESULTS</div>
              <div className="alert-bell-list" style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                Searching for IP / Node: <strong>{searchQuery}</strong>...
                <br /><br />
                <em>No exact matches found in current logs.</em>
              </div>
            </div>
          )}
        </div>
        
        <button className="topbar-icon-btn" onClick={() => setAlertConfigOpen(true)} title="Alert Settings">
          <span className="material-symbols-outlined">tune</span>
        </button>
        
        <AlertBell />
        
        <div style={{ position: 'relative' }}>
          <button className="topbar-icon-btn" title="User Profile" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <span className="material-symbols-outlined">account_circle</span>
          </button>
          
          {userMenuOpen && (
            <>
              <div className="alert-bell-backdrop" onClick={() => setUserMenuOpen(false)} />
              <div className="alert-bell-dropdown" style={{ width: 220, right: 0, left: 'auto' }}>
                <div className="alert-bell-header">
                  <span>ROOT_ADMIN</span>
                  <span style={{ fontSize: '0.6rem', color: '#2FF801' }}>[AUTHED]</span>
                </div>
                <div className="alert-bell-list" style={{ padding: '8px 0' }}>
                  <button className="btn btn-ghost" style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start', padding: '8px 16px', borderRadius: 0 }} onClick={() => {
                    actions.stopSimulation();
                    actions.resetSimulation();
                    setUserMenuOpen(false);
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: 8 }}>restart_alt</span>
                    Reset Global State
                  </button>
                  <button className="btn btn-ghost" style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start', padding: '8px 16px', borderRadius: 0 }} onClick={() => {
                    const data = {
                      timestamp: new Date().toISOString(),
                      metrics: {
                        accuracy: state.accuracy,
                        packetsGenerated: state.packetsGenerated,
                        throughput: state.throughput
                      },
                      systemLogs: state.systemLogs,
                      attackLog: state.attackLog
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ganbids_logs_${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setUserMenuOpen(false);
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: 8 }}>download</span>
                    Export System Logs
                  </button>
                  <button className="btn btn-ghost" style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start', padding: '8px 16px', borderRadius: 0 }} onClick={async () => {
                    setUserMenuOpen(false);
                    await generateThreatReport('exportable-dashboard');
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: 8 }}>picture_as_pdf</span>
                    Export PDF Report
                  </button>
                  <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
                  <button className="btn btn-ghost" style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start', padding: '8px 16px', color: 'var(--tertiary)', borderRadius: 0 }} onClick={() => {
                    setUserMenuOpen(false);
                    actions.stopSimulation();
                    setTimeout(() => window.location.reload(), 300);
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: 8 }}>logout</span>
                    Disconnect Session
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <AlertConfigModal open={alertConfigOpen} onClose={() => setAlertConfigOpen(false)} />
    </header>
  )
}
