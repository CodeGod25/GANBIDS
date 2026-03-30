import { useState, useEffect } from 'react'

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('BOOTING_SYSTEM...')
  const [loaded, setLoaded] = useState(false)

  const steps = [
    { threshold: 15, text: 'INITIALIZING_NEURAL_NETS...' },
    { threshold: 40, text: 'LOADING_NSL_KDD_WEIGHTS...' },
    { threshold: 65, text: 'ESTABLISHING_WSS_UPLINK...' },
    { threshold: 85, text: 'SECURING_PERIMETER_NODES...' },
    { threshold: 100, text: 'SYSTEM_READY' }
  ]

  useEffect(() => {
    let t = 0
    const interval = setInterval(() => {
      t += Math.random() * 4 + 1
      if (t >= 100) {
        t = 100
        setProgress(100)
        setStatus('SYSTEM_READY')
        clearInterval(interval)
        setTimeout(() => {
          setLoaded(true)
          setTimeout(onComplete, 800) // allow fade out
        }, 600)
      } else {
        setProgress(t)
        const currentStep = steps.find(s => t <= s.threshold)
        if (currentStep) setStatus(currentStep.text)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className={`loading-screen ${loaded ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="loading-logo">
          <img src="/vite.svg" alt="App Logo" className="loading-icon" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          <h1>GANBIDS</h1>
        </div>
        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading-status">
          <span className="loading-text">{status}</span>
          <span className="loading-pct">{Math.floor(progress)}%</span>
        </div>
      </div>
    </div>
  )
}
