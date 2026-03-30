import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import LoadingScreen from './components/layout/LoadingScreen'
import LiveDashboard from './pages/LiveDashboard'
import GANTraining from './pages/GANTraining'
import IDSAnalytics from './pages/IDSAnalytics'
import AttackVisualization from './pages/AttackVisualization'
import SimulationLogs from './pages/SimulationLogs'
import ScenarioBuilder from './pages/ScenarioBuilder'
import PacketPlayground from './pages/PacketPlayground'
import TopologyEditor from './pages/TopologyEditor'

export default function App() {
  const [booting, setBooting] = useState(true)

  if (booting) {
    return <LoadingScreen onComplete={() => setBooting(false)} />
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<LiveDashboard />} />
        <Route path="training" element={<GANTraining />} />
        <Route path="analytics" element={<IDSAnalytics />} />
        <Route path="visualization" element={<AttackVisualization />} />
        <Route path="logs" element={<SimulationLogs />} />
        <Route path="scenarios" element={<ScenarioBuilder />} />
        <Route path="playground" element={<PacketPlayground />} />
        <Route path="topology" element={<TopologyEditor />} />
      </Route>
    </Routes>
  )
}
