// ============================================================
// GANBIDS — Topology Editor
// Drag-and-drop network topology design and simulation
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import GlassPanel from '../components/widgets/GlassPanel'
import { useSimulation } from '../context/SimulationContext'

const NODE_TYPES = [
  { type: 'server', label: 'Server', color: '#ECEDF6', icon: 'dns' },
  { type: 'firewall', label: 'Firewall', color: '#F59E0B', icon: 'shield' },
  { type: 'ids', label: 'IDS Node', color: '#2FF801', icon: 'security' },
  { type: 'generator', label: 'Generator', color: '#00CFFC', icon: 'smart_toy' },
  { type: 'attacker', label: 'Attacker', color: '#FF7073', icon: 'bug_report' },
  { type: 'router', label: 'Router', color: '#A78BFA', icon: 'router' },
  { type: 'switch', label: 'Switch', color: '#38BDF8', icon: 'hub' },
]

export default function TopologyEditor() {
  const { state, actions } = useSimulation()
  const canvasRef = useRef(null)
  const animRef = useRef(0)
  const [selectedNode, setSelectedNode] = useState(null)
  const [dragNode, setDragNode] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connecting, setConnecting] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [editNodePanel, setEditNodePanel] = useState(null)

  const nodes = state.topologyNodes
  const edges = state.topologyEdges

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const W = rect.width, H = rect.height

    const nodeMap = {}
    nodes.forEach(n => nodeMap[n.id] = n)

    let particles = []

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Grid
      ctx.strokeStyle = 'rgba(105, 218, 255, 0.03)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // Edges
      edges.forEach(edge => {
        const from = nodeMap[edge.from], to = nodeMap[edge.to]
        if (!from || !to) return
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = edge.color + '40'
        ctx.lineWidth = 2
        ctx.stroke()

        // Direction arrow
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const midX = (from.x + to.x) / 2
        const midY = (from.y + to.y) / 2
        ctx.save()
        ctx.translate(midX, midY)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.moveTo(6, 0)
        ctx.lineTo(-4, -4)
        ctx.lineTo(-4, 4)
        ctx.closePath()
        ctx.fillStyle = edge.color + '60'
        ctx.fill()
        ctx.restore()
      })

      // Particles (when simulation running)
      if (state.simulationRunning) {
        edges.forEach(edge => {
          if (!edge.animated) return
          if (Math.random() < 0.04 + (state.intensity / 100) * 0.1) {
            const from = nodeMap[edge.from], to = nodeMap[edge.to]
            if (from && to) {
              particles.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0, speed: 0.008 + Math.random() * 0.012, color: edge.color })
            }
          }
        })
        particles.forEach(p => {
          p.progress += p.speed
          const x = p.x + (p.tx - p.x) * p.progress
          const y = p.y + (p.ty - p.y) * p.progress
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = 10
          ctx.fill()
          ctx.shadowBlur = 0
        })
        particles = particles.filter(p => p.progress < 1)
      }

      // Connecting line
      if (connecting) {
        const from = nodeMap[connecting.from]
        if (from && connecting.mouseX !== undefined) {
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(connecting.mouseX, connecting.mouseY)
          ctx.strokeStyle = 'rgba(105, 218, 255, 0.5)'
          ctx.lineWidth = 2
          ctx.setLineDash([6, 4])
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Nodes
      nodes.forEach(n => {
        const isSelected = selectedNode === n.id
        const radius = isSelected ? 24 : 20

        // Glow
        if (isSelected || (state.simulationRunning && (n.type === 'ids' || n.type === 'generator'))) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, radius + 8, 0, Math.PI * 2)
          ctx.strokeStyle = n.color + '20'
          ctx.lineWidth = 6
          ctx.stroke()
        }

        // Body
        ctx.beginPath()
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = isSelected ? '#1C2028' : '#0B0E14'
        ctx.strokeStyle = isSelected ? n.color : n.color + '60'
        ctx.lineWidth = isSelected ? 2.5 : 1.5
        ctx.fill()
        ctx.stroke()

        // Label inside
        ctx.fillStyle = n.color
        ctx.font = `bold 7px "JetBrains Mono"`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n.label.substring(0, 4), n.x, n.y)

        // Label below
        ctx.fillStyle = isSelected ? '#e2e8f0' : '#64748b'
        ctx.font = '7px "JetBrains Mono"'
        ctx.fillText(n.label, n.x, n.y + 32)

        // Type badge
        ctx.fillStyle = n.color + '40'
        ctx.font = '5px "JetBrains Mono"'
        ctx.fillText(n.type.toUpperCase(), n.x, n.y + 40)
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [nodes, edges, selectedNode, connecting, state.simulationRunning, state.intensity])

  // Find node at position
  const findNode = useCallback((x, y) => {
    return nodes.find(n => Math.hypot(n.x - x, n.y - y) < 24)
  }, [nodes])

  // Mouse handlers
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = (e) => {
    if (e.button === 2) return // right click handled separately
    const pos = getCanvasPos(e)
    const node = findNode(pos.x, pos.y)
    setContextMenu(null)

    if (e.shiftKey && node) {
      // Start connecting
      setConnecting({ from: node.id, mouseX: pos.x, mouseY: pos.y })
    } else if (node) {
      setSelectedNode(node.id)
      setDragNode(node.id)
      setDragOffset({ x: pos.x - node.x, y: pos.y - node.y })
    } else {
      setSelectedNode(null)
    }
  }

  const handleMouseMove = (e) => {
    const pos = getCanvasPos(e)
    if (dragNode) {
      const updatedNodes = nodes.map(n =>
        n.id === dragNode ? { ...n, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : n
      )
      actions.updateTopology(updatedNodes, edges)
    }
    if (connecting) {
      setConnecting(prev => ({ ...prev, mouseX: pos.x, mouseY: pos.y }))
    }
  }

  const handleMouseUp = (e) => {
    const pos = getCanvasPos(e)
    if (connecting) {
      const target = findNode(pos.x, pos.y)
      if (target && target.id !== connecting.from) {
        const exists = edges.some(e => e.from === connecting.from && e.to === target.id)
        if (!exists) {
          const fromNode = nodes.find(n => n.id === connecting.from)
          actions.addEdge({ from: connecting.from, to: target.id, color: fromNode?.color || '#69DAFF', animated: true })
        }
      }
      setConnecting(null)
    }
    setDragNode(null)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    const pos = getCanvasPos(e)
    const node = findNode(pos.x, pos.y)
    setContextMenu({ x: e.clientX, y: e.clientY, canvasX: pos.x, canvasY: pos.y, node })
  }

  const handleDoubleClick = (e) => {
    const pos = getCanvasPos(e)
    const node = findNode(pos.x, pos.y)
    if (node) {
      setEditNodePanel(node)
    } else {
      addNodeAt(pos.x, pos.y)
    }
  }

  const addNodeAt = (x, y, type = 'server') => {
    const def = NODE_TYPES.find(t => t.type === type)
    const id = `node_${Date.now()}`
    const label = `${def.label.toUpperCase()}_${nodes.length + 1}`
    actions.addNode({ id, label, x, y, type, color: def.color })
    setContextMenu(null)
  }

  const selectedNodeData = nodes.find(n => n.id === selectedNode)

  return (
    <div className="space-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">TOPOLOGY_EDITOR</h1>
          <p className="page-subtitle">Network Architecture Designer // Drag • Connect • Simulate</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => {
            const data = JSON.stringify({ nodes, edges }, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'topology.json'; a.click()
          }}>EXPORT_TOPOLOGY</button>
          <button className="btn btn-primary" onClick={() => state.simulationRunning ? actions.stopSimulation() : actions.startSimulation()}
            style={{ background: state.simulationRunning ? 'var(--tertiary)' : 'var(--secondary)', color: state.simulationRunning ? '#fff' : 'var(--on-secondary)' }}>
            {state.simulationRunning ? 'STOP_SIM' : 'RUN_ON_TOPOLOGY'}
          </button>
        </div>
      </div>

      <div className="grid-12">
        {/* Canvas */}
        <div className="col-span-8">
          <div style={{ position: 'relative', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <canvas ref={canvasRef}
              style={{ width: '100%', height: 550, cursor: dragNode ? 'grabbing' : connecting ? 'crosshair' : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onContextMenu={handleContextMenu}
              onDoubleClick={handleDoubleClick}
            />
            {/* Instructions overlay */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--outline)' }}>
              <span>DRAG: Move</span>
              <span>SHIFT+DRAG: Connect</span>
              <span>DOUBLE-CLICK: Add/Edit</span>
              <span>RIGHT-CLICK: Context Menu</span>
            </div>
            {/* Status */}
            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
              <span className="badge badge-primary">NODES: {nodes.length}</span>
              <span className="badge badge-secondary">EDGES: {edges.length}</span>
              {state.simulationRunning && <span className="badge badge-tertiary" style={{ animation: 'pulse-glow 2s infinite' }}>● LIVE</span>}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Node Palette */}
          <GlassPanel style={{ padding: 16 }}>
            <h3 className="section-title" style={{ marginBottom: 12, fontSize: '0.75rem' }}>Node Palette</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {NODE_TYPES.map(nt => (
                <div key={nt.type}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', transition: 'all 0.15s', border: '1px solid transparent',
                    fontSize: '0.625rem', fontFamily: 'var(--font-mono)',
                  }}
                  onClick={() => addNodeAt(350 + Math.random() * 100, 200 + Math.random() * 100, nt.type)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = nt.color; e.currentTarget.style.background = 'var(--surface-container)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: nt.color }}>{nt.icon}</span>
                  <span style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{nt.label.toUpperCase()}</span>
                  <span style={{ fontSize: '0.5rem', color: nt.color, marginLeft: 'auto' }}>+ ADD</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Selected Node Properties */}
          {selectedNodeData ? (
            <GlassPanel style={{ padding: 16 }}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <h3 className="section-title" style={{ fontSize: '0.75rem' }}>Node Properties</h3>
                <button className="topbar-icon-btn" onClick={() => { actions.removeNode(selectedNode); setSelectedNode(null) }} style={{ color: 'var(--tertiary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'ID', value: selectedNodeData.id },
                  { label: 'Label', value: selectedNodeData.label },
                  { label: 'Type', value: selectedNodeData.type },
                  { label: 'Position', value: `${Math.round(selectedNodeData.x)}, ${Math.round(selectedNodeData.y)}` },
                  { label: 'Connections', value: edges.filter(e => e.from === selectedNode || e.to === selectedNode).length },
                ].map(item => (
                  <div key={item.label} className="flex-between">
                    <span className="font-mono" style={{ fontSize: '0.5625rem', color: 'var(--on-surface-variant)' }}>{item.label}</span>
                    <span className="font-mono" style={{ fontSize: '0.5625rem', color: 'var(--primary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          ) : (
            <GlassPanel style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', color: 'var(--outline)', fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', padding: 16 }}>
                Click a node to view properties
              </div>
            </GlassPanel>
          )}

          {/* Simulation Stats */}
          {state.simulationRunning && (
            <GlassPanel style={{ padding: 16 }}>
              <h3 className="section-title" style={{ marginBottom: 12, fontSize: '0.75rem' }}>Simulation Stats</h3>
              {[
                { label: 'Epoch', value: state.epoch },
                { label: 'Accuracy', value: state.accuracy.toFixed(1) + '%' },
                { label: 'Blocked', value: state.packetsBlocked },
                { label: 'Active Flows', value: state.packetsGenerated % 100 },
              ].map(s => (
                <div key={s.label} className="flex-between" style={{ marginBottom: 4 }}>
                  <span className="font-mono" style={{ fontSize: '0.5625rem', color: 'var(--on-surface-variant)' }}>{s.label}</span>
                  <span className="font-mono" style={{ fontSize: '0.5625rem', color: 'var(--secondary)' }}>{s.value}</span>
                </div>
              ))}
            </GlassPanel>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setContextMenu(null)} />
          <div style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 1000,
            background: 'var(--surface-container-highest)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-sm)', padding: 4, minWidth: 160,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {contextMenu.node ? (
              <>
                <div style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--outline)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{contextMenu.node.label}</div>
                <button className="context-menu-item" onClick={() => { setEditNodePanel(contextMenu.node); setContextMenu(null) }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span> Edit Node
                </button>
                <button className="context-menu-item" onClick={() => { setConnecting({ from: contextMenu.node.id }); setContextMenu(null) }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>link</span> Connect To...
                </button>
                <button className="context-menu-item" style={{ color: 'var(--tertiary)' }} onClick={() => { actions.removeNode(contextMenu.node.id); setContextMenu(null); setSelectedNode(null) }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span> Delete Node
                </button>
              </>
            ) : (
              <>
                {NODE_TYPES.slice(0, 5).map(nt => (
                  <button key={nt.type} className="context-menu-item" onClick={() => addNodeAt(contextMenu.canvasX, contextMenu.canvasY, nt.type)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: nt.color }}>{nt.icon}</span> Add {nt.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
