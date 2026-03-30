import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SimulationProvider } from './context/SimulationContext'
import App from './App'
import './styles/index.css'
import './styles/layout.css'
import './styles/components.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SimulationProvider>
        <App />
      </SimulationProvider>
    </BrowserRouter>
  </React.StrictMode>
)
