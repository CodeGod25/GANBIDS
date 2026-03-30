// ============================================================
// GANBIDS — Global Simulation Context
// Central state container shared across all pages
// ============================================================

import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { useSocket } from '../hooks/useSocket'
import { useSimEngine } from '../hooks/useSimEngine'
import api from '../services/api'

const SimulationContext = createContext(null)

// ---------- Initial State ----------
const initialState = {
  // Connection
  backendOnline: false,
  socketConnected: false,

  // Simulation
  simulationRunning: false,
  intensity: 50,
  autoTuning: true,

  // Training
  epoch: 0,
  gLoss: 0,
  dLoss: 0,
  lossHistory: { epochs: [], gLosses: [], dLosses: [] },
  hyperparams: { learningRate: 0.0002, batchSize: 32, noiseDim: 100 },

  // IDS Metrics
  accuracy: 0,
  falsePositives: 0,
  latency: 0,
  detectionRate: 0,
  throughput: 0,
  accuracyHistory: [],
  evasionHistory: [],

  // Packets & Classification
  packetsGenerated: 0,
  packetsClassified: 0,
  packetsBlocked: 0,
  classificationFeed: [],
  confusionMatrix: {
    labels: ['DDOS', 'R2L', 'U2R', 'PROBE', 'NORMAL'],
    data: [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  },
  classificationMetrics: [],
  protocolDistribution: [
    { name: 'TCP', percentage: 62, color: '#69DAFF' },
    { name: 'UDP', percentage: 24, color: '#2FF801' },
    { name: 'ICMP', percentage: 14, color: '#F59E0B' },
  ],

  // Logs & Events
  attackLog: [],
  systemLogs: [],
  packetCapture: [],

  // Topology
  topologyNodes: [
    { id: 'gan', label: 'GAN_GEN', x: 100, y: 200, type: 'generator', color: '#00CFFC' },
    { id: 'fw', label: 'FIREWALL', x: 300, y: 200, type: 'firewall', color: '#F59E0B' },
    { id: 'ids', label: 'IDS_NODE', x: 500, y: 150, type: 'ids', color: '#2FF801' },
    { id: 'web', label: 'WEB_SRV', x: 700, y: 100, type: 'server', color: '#ECEDF6' },
    { id: 'db', label: 'DB_SRV', x: 700, y: 250, type: 'server', color: '#ECEDF6' },
    { id: 'dns', label: 'DNS_SRV', x: 700, y: 350, type: 'server', color: '#ECEDF6' },
    { id: 'attacker', label: 'ATTACKER', x: 100, y: 400, type: 'attacker', color: '#FF7073' },
  ],
  topologyEdges: [
    { from: 'gan', to: 'fw', color: '#00CFFC', animated: true },
    { from: 'attacker', to: 'fw', color: '#FF7073', animated: true },
    { from: 'fw', to: 'ids', color: '#F59E0B', animated: true },
    { from: 'ids', to: 'web', color: '#2FF801', animated: false },
    { from: 'ids', to: 'db', color: '#2FF801', animated: false },
    { from: 'ids', to: 'dns', color: '#2FF801', animated: false },
  ],

  // Alerts
  alerts: [],
  alertThresholds: {
    accuracyMin: 80,
    falsePositiveMax: 0.1,
    throughputMax: 800000,
    criticalAttack: true,
  },

  // Scenarios
  scenarioRunning: false,
  scenarioConfig: null,
  scenarioResults: null,
  scenarioHistory: [],

  // Sessions
  sessions: [],
  replayMode: false,

  // Firewall
  firewallRules: [
    { id: 1, action: 'DENY', protocol: 'TCP', source: '0.0.0.0/0', port: '23', desc: 'Block Telnet', hits: 892 },
    { id: 2, action: 'DENY', protocol: 'ICMP', source: '192.168.1.0/24', port: '*', desc: 'Block ICMP Flood', hits: 1247 },
    { id: 3, action: 'ALLOW', protocol: 'TCP', source: '10.0.0.0/8', port: '80,443', desc: 'Allow HTTP/S', hits: 45201 },
    { id: 4, action: 'DENY', protocol: 'UDP', source: '0.0.0.0/0', port: '53', desc: 'Block External DNS', hits: 342 },
    { id: 5, action: 'DENY', protocol: 'TCP', source: '0.0.0.0/0', port: '22', desc: 'Block SSH Brute Force', hits: 2891 },
  ],
}

// ---------- Reducer ----------
function reducer(state, action) {
  switch (action.type) {
    case 'SET_BACKEND_ONLINE':
      return { ...state, backendOnline: action.payload }
    case 'SET_SOCKET_CONNECTED':
      return { ...state, socketConnected: action.payload }
    case 'SET_SIMULATION_RUNNING':
      return { ...state, simulationRunning: action.payload }
    case 'SET_INTENSITY':
      return { ...state, intensity: action.payload }
    case 'SET_AUTO_TUNING':
      return { ...state, autoTuning: action.payload }
    case 'SET_HYPERPARAMS':
      return { ...state, hyperparams: { ...state.hyperparams, ...action.payload } }

    case 'SIMULATION_TICK': {
      const d = action.payload
      return {
        ...state,
        epoch: d.epoch,
        gLoss: d.gLoss,
        dLoss: d.dLoss,
        accuracy: d.accuracy,
        falsePositives: d.falsePositives,
        latency: d.latency,
        detectionRate: d.detectionRate,
        throughput: d.throughput,
        packetsGenerated: d.packetsGenerated,
        packetsClassified: d.packetsClassified,
        packetsBlocked: d.packetsBlocked,
        lossHistory: d.lossHistory,
        accuracyHistory: d.accuracyHistory,
        evasionHistory: d.evasionHistory,
        classificationFeed: d.classificationFeed,
        classificationMetrics: d.classificationMetrics,
        confusionMatrix: d.confusionMatrix,
        attackLog: d.attackLog,
        systemLogs: d.systemLogs,
        packetCapture: d.packetCapture,
        protocolDistribution: d.protocolDistribution,
      }
    }

    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts].slice(0, 100) }
    case 'DISMISS_ALERT':
      return { ...state, alerts: state.alerts.filter((_, i) => i !== action.payload) }
    case 'CLEAR_ALERTS':
      return { ...state, alerts: [] }
    case 'SET_ALERT_THRESHOLDS':
      return { ...state, alertThresholds: { ...state.alertThresholds, ...action.payload } }

    case 'SET_TOPOLOGY_NODES':
      return { ...state, topologyNodes: action.payload }
    case 'SET_TOPOLOGY_EDGES':
      return { ...state, topologyEdges: action.payload }
    case 'UPDATE_TOPOLOGY':
      return { ...state, topologyNodes: action.payload.nodes, topologyEdges: action.payload.edges }
    case 'ADD_TOPOLOGY_NODE':
      return { ...state, topologyNodes: [...state.topologyNodes, action.payload] }
    case 'REMOVE_TOPOLOGY_NODE': {
      const nodeId = action.payload
      return {
        ...state,
        topologyNodes: state.topologyNodes.filter(n => n.id !== nodeId),
        topologyEdges: state.topologyEdges.filter(e => e.from !== nodeId && e.to !== nodeId),
      }
    }
    case 'ADD_TOPOLOGY_EDGE':
      return { ...state, topologyEdges: [...state.topologyEdges, action.payload] }

    case 'SET_SCENARIO_RUNNING':
      return { ...state, scenarioRunning: action.payload }
    case 'SET_SCENARIO_CONFIG':
      return { ...state, scenarioConfig: action.payload }
    case 'SET_SCENARIO_RESULTS':
      return { ...state, scenarioResults: action.payload, scenarioRunning: false, scenarioHistory: [...state.scenarioHistory, action.payload] }

    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload }
    case 'ADD_SESSION':
      return { ...state, sessions: [action.payload, ...state.sessions] }
    case 'SET_REPLAY_MODE':
      return { ...state, replayMode: action.payload }

    case 'ADD_FIREWALL_RULE':
      return { ...state, firewallRules: [...state.firewallRules, { ...action.payload, id: Math.max(0, ...state.firewallRules.map(r => r.id)) + 1, hits: 0 }] }
    case 'UPDATE_FIREWALL_RULE':
      return { ...state, firewallRules: state.firewallRules.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) }
    case 'DELETE_FIREWALL_RULE':
      return { ...state, firewallRules: state.firewallRules.filter(r => r.id !== action.payload) }

    default:
      return state
  }
}

// ---------- Provider ----------
export function SimulationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { connected, on, emit } = useSocket()
  const { tick, reset } = useSimEngine()
  const intervalRef = useRef(null)
  const [alertQueue, setAlertQueue] = useState([])

  // Update socket connection status
  useEffect(() => {
    dispatch({ type: 'SET_SOCKET_CONNECTED', payload: connected })
  }, [connected])

  // Check backend health
  useEffect(() => {
    const check = async () => {
      try {
        await api.getStatus()
        dispatch({ type: 'SET_BACKEND_ONLINE', payload: true })
      } catch {
        dispatch({ type: 'SET_BACKEND_ONLINE', payload: false })
      }
    }
    check()
    const hc = setInterval(check, 10000)
    return () => clearInterval(hc)
  }, [])

  // Subscribe to WebSocket events when backend is available
  useEffect(() => {
    if (!connected) return

    on('simulation_tick', (data) => {
      dispatch({ type: 'SIMULATION_TICK', payload: data })
    })

    on('training_progress', (data) => {
      // Merge training data into state
      dispatch({ type: 'SIMULATION_TICK', payload: {
        epoch: data.epoch,
        gLoss: data.g_loss,
        dLoss: data.d_loss,
      }})
    })

    on('alert_triggered', (data) => {
      dispatch({ type: 'ADD_ALERT', payload: { ...data, time: new Date().toISOString(), read: false } })
      setAlertQueue(q => [...q, data])
    })

    on('scenario_complete', (data) => {
      dispatch({ type: 'SET_SCENARIO_RESULTS', payload: data })
    })
  }, [connected, on])

  // ---------- Frontend simulation engine ----------
  // Runs when simulation is active (uses backend when available, frontend engine as fallback)
  useEffect(() => {
    if (state.simulationRunning) {
      intervalRef.current = setInterval(() => {
        if (state.backendOnline) {
          // Backend handles simulation; we receive data via WebSocket
          // But if WebSocket events aren't flowing, poll
          if (!state.socketConnected) {
            api.getMetrics().then(data => {
              dispatch({ type: 'SIMULATION_TICK', payload: data })
            }).catch(() => {})
          }
        } else {
          // Frontend simulation engine
          const data = tick(state.intensity)
          dispatch({ type: 'SIMULATION_TICK', payload: data })
        }
      }, 800)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.simulationRunning, state.backendOnline, state.socketConnected, state.intensity, tick])

  // ---------- Alert checking ----------
  useEffect(() => {
    if (!state.simulationRunning) return
    const t = state.alertThresholds

    if (state.accuracy > 0 && state.accuracy < t.accuracyMin) {
      dispatch({ type: 'ADD_ALERT', payload: {
        id: Date.now(),
        type: 'accuracy_low',
        severity: 'warning',
        message: `Detection accuracy dropped to ${state.accuracy.toFixed(1)}% (threshold: ${t.accuracyMin}%)`,
        time: new Date().toISOString(),
        read: false,
      }})
    }

    if (state.falsePositives > t.falsePositiveMax) {
      dispatch({ type: 'ADD_ALERT', payload: {
        id: Date.now() + 1,
        type: 'fp_high',
        severity: 'warning',
        message: `False positive rate at ${(state.falsePositives * 100).toFixed(2)}% (threshold: ${(t.falsePositiveMax * 100).toFixed(1)}%)`,
        time: new Date().toISOString(),
        read: false,
      }})
    }
  }, [state.epoch]) // check on each epoch tick

  // ---------- Actions ----------
  const actions = {
    startSimulation: useCallback(async () => {
      dispatch({ type: 'SET_SIMULATION_RUNNING', payload: true })
      try {
        if (state.backendOnline) {
          await api.startSimulation({ intensity: state.intensity })
          emit('start_simulation')
        }
      } catch { /* fallback to frontend engine */ }
    }, [state.backendOnline, state.intensity, emit]),

    stopSimulation: useCallback(async () => {
      dispatch({ type: 'SET_SIMULATION_RUNNING', payload: false })
      try {
        if (state.backendOnline) {
          await api.stopSimulation()
          emit('stop_simulation')
        }
      } catch {}
    }, [state.backendOnline, emit]),

    setIntensity: useCallback((val) => {
      dispatch({ type: 'SET_INTENSITY', payload: Number(val) })
    }, []),

    setAutoTuning: useCallback((val) => {
      dispatch({ type: 'SET_AUTO_TUNING', payload: val })
    }, []),

    updateHyperparams: useCallback(async (params) => {
      dispatch({ type: 'SET_HYPERPARAMS', payload: params })
      if (state.backendOnline) {
        try { await api.updateHyperparams(params) } catch {}
      }
    }, [state.backendOnline]),

    runScenario: useCallback(async (config) => {
      dispatch({ type: 'SET_SCENARIO_CONFIG', payload: config })
      dispatch({ type: 'SET_SCENARIO_RUNNING', payload: true })
      reset() // reset simulation engine
      dispatch({ type: 'SET_SIMULATION_RUNNING', payload: true })
      try {
        if (state.backendOnline) {
          await api.runScenario(config)
        }
      } catch {}
    }, [state.backendOnline, reset]),

    stopScenario: useCallback(async () => {
      dispatch({ type: 'SET_SCENARIO_RUNNING', payload: false })
      dispatch({ type: 'SET_SIMULATION_RUNNING', payload: false })
      try {
        if (state.backendOnline) await api.stopScenario()
      } catch {}
    }, [state.backendOnline]),

    setAlertThresholds: useCallback((thresholds) => {
      dispatch({ type: 'SET_ALERT_THRESHOLDS', payload: thresholds })
    }, []),

    dismissAlert: useCallback((idx) => {
      dispatch({ type: 'DISMISS_ALERT', payload: idx })
    }, []),

    clearAlerts: useCallback(() => {
      dispatch({ type: 'CLEAR_ALERTS' })
    }, []),

    // Topology
    addNode: useCallback((node) => {
      dispatch({ type: 'ADD_TOPOLOGY_NODE', payload: node })
    }, []),
    removeNode: useCallback((nodeId) => {
      dispatch({ type: 'REMOVE_TOPOLOGY_NODE', payload: nodeId })
    }, []),
    addEdge: useCallback((edge) => {
      dispatch({ type: 'ADD_TOPOLOGY_EDGE', payload: edge })
    }, []),
    updateTopology: useCallback((nodes, edges) => {
      dispatch({ type: 'UPDATE_TOPOLOGY', payload: { nodes, edges } })
    }, []),

    // Firewall
    addFirewallRule: useCallback((rule) => {
      dispatch({ type: 'ADD_FIREWALL_RULE', payload: rule })
    }, []),
    updateFirewallRule: useCallback((rule) => {
      dispatch({ type: 'UPDATE_FIREWALL_RULE', payload: rule })
    }, []),
    deleteFirewallRule: useCallback((id) => {
      dispatch({ type: 'DELETE_FIREWALL_RULE', payload: id })
    }, []),

    // Sessions
    saveSession: useCallback(async (name) => {
      const session = {
        id: Date.now().toString(),
        name: name || `Session ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString(),
        epoch: state.epoch,
        accuracy: state.accuracy,
        packetsGenerated: state.packetsGenerated,
        scenarioConfig: state.scenarioConfig,
      }
      dispatch({ type: 'ADD_SESSION', payload: session })
      try {
        if (state.backendOnline) await api.saveSession(name)
      } catch {}
      return session
    }, [state]),

    resetSimulation: useCallback(() => {
      reset()
      dispatch({ type: 'SET_SIMULATION_RUNNING', payload: false })
    }, [reset]),

    dispatch,
  }

  return (
    <SimulationContext.Provider value={{ state, actions, alertQueue, setAlertQueue }}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider')
  return ctx
}

export default SimulationContext
