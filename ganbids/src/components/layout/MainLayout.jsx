import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { AlertToastContainer } from '../widgets/AlertSystem'

export default function MainLayout() {
  return (
    <>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" id="exportable-dashboard">
          <TopBar />
          <div className="page-content technical-grid scanline">
            <Outlet />
          </div>
        </main>
      </div>
      <div className="ambient-bg">
        <div className="ambient-orb primary" />
        <div className="ambient-orb tertiary" />
      </div>
      <AlertToastContainer />
    </>
  )
}
