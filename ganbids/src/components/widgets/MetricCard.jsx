import { useEffect, useRef, useState } from 'react'

function AnimatedValue({ value, decimals = 0 }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = prevRef.current
    const to = typeof value === 'number' ? value : parseFloat(value) || 0
    if (isNaN(to)) { setDisplay(value); return }

    const duration = 400
    const start = performance.now()

    const animate = (now) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      const current = from + (to - from) * eased
      setDisplay(current.toFixed(decimals))
      if (t < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    prevRef.current = to
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, decimals])

  return <>{display}</>
}

export default function MetricCard({ label, value, unit, change, changeType, border, glow, valueColor, decimals }) {
  const borderClass = border ? `border-${border}` : ''
  const isNumeric = !isNaN(parseFloat(value))
  const dec = decimals !== undefined ? decimals : (String(value).includes('.') ? (String(value).split('.')[1]?.length || 0) : 0)

  return (
    <div className={`metric-card ${borderClass} ${glow ? 'glow' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={valueColor ? { color: valueColor } : {}}>
        {isNumeric
          ? <AnimatedValue value={parseFloat(value)} decimals={dec} />
          : value
        }
        {unit && <span className="unit">{unit}</span>}
        {change && <span className={`change ${changeType}`}>{change}</span>}
      </div>
    </div>
  )
}
