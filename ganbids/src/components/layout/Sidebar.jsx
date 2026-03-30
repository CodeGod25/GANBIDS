import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSimulation } from '../../context/SimulationContext'
import SessionPanel from '../widgets/SessionPanel'

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Live Dashboard' },
  { path: '/training', icon: 'model_training', label: 'GAN Training' },
  { path: '/analytics', icon: 'analytics', label: 'IDS Analytics' },
  { path: '/visualization', icon: 'blur_on', label: 'Attack Viz' },
  { path: '/logs', icon: 'terminal', label: 'Sim Logs' },
  { path: '/scenarios', icon: 'science', label: 'Scenario Builder' },
  { path: '/playground', icon: 'build', label: 'Packet Lab' },
  { path: '/topology', icon: 'hub', label: 'Topology Editor' },
]

export default function Sidebar() {
  const { state, actions } = useSimulation()
  const [sessionOpen, setSessionOpen] = useState(false)

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 32, height: 32,
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            padding: '4px'
          }}>
            <img src="/vite.svg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span className="sidebar-brand-name">GANBIDS</span>
        </div>
        <div className="sidebar-brand-status">
          <div className="pulse-dot" style={{
            background: state.simulationRunning ? 'var(--secondary)' :
                         state.backendOnline ? 'var(--primary)' : 'var(--outline)',
          }} />
          <span>{state.simulationRunning ? 'Simulation Active' : state.backendOnline ? 'Backend Online' : 'Offline Mode'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="btn-simulation"
          style={{
            background: state.simulationRunning ? 'var(--tertiary)' : 'var(--primary-container)',
            color: state.simulationRunning ? '#fff' : 'var(--on-primary-container)',
          }}
          onClick={() => state.simulationRunning ? actions.stopSimulation() : actions.startSimulation()}
        >
          {state.simulationRunning ? 'STOP_SIMULATION' : 'START_SIMULATION'}
        </button>

        <button
          className="btn-simulation"
          style={{ marginTop: 8, background: 'var(--surface-container-high)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.05)' }}
          onClick={() => setSessionOpen(true)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4, verticalAlign: 'middle' }}>save</span>
          SESSIONS
        </button>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">ANALYST_01</div>
            <div className="sidebar-user-role">
              {state.backendOnline ? '● Connected' : '○ Offline'} · EP {state.epoch}
            </div>
          </div>
        </div>
      </div>

      <SessionPanel open={sessionOpen} onClose={() => setSessionOpen(false)} />
    </aside>
  )
}
