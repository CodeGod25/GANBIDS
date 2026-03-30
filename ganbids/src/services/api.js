// ============================================================
// GANBIDS — Centralized API Service
// All REST calls to the Flask backend go through here
// ============================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }
  try {
    const res = await fetch(url, config)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    return await res.json()
  } catch (e) {
    if (e.message === 'Failed to fetch') {
      throw new Error('BACKEND_OFFLINE')
    }
    throw e
  }
}

// ---------- Status & Metrics ----------
export const api = {
  getStatus: () => request('/api/status'),
  getMetrics: () => request('/api/metrics'),

  // ---------- Training ----------
  startTraining: (params = {}) =>
    request('/api/train/start', { method: 'POST', body: JSON.stringify(params) }),
  stopTraining: () =>
    request('/api/train/stop', { method: 'POST' }),
  updateHyperparams: (params) =>
    request('/api/hyperparams', { method: 'PUT', body: JSON.stringify(params) }),

  // ---------- Simulation ----------
  startSimulation: (config = {}) =>
    request('/api/simulation/start', { method: 'POST', body: JSON.stringify(config) }),
  stopSimulation: () =>
    request('/api/simulation/stop', { method: 'POST' }),
  getSimulationState: () =>
    request('/api/simulation/state'),

  // ---------- Classification ----------
  classifyPacket: (features) =>
    request('/api/classify/single', { method: 'POST', body: JSON.stringify({ features }) }),
  classifyBatch: (packets) =>
    request('/api/classify/batch', { method: 'POST', body: JSON.stringify({ packets }) }),
  getPackets: (count = 4) =>
    request(`/api/packets?count=${count}`),

  // ---------- Scenario ----------
  runScenario: (config) =>
    request('/api/scenario/run', { method: 'POST', body: JSON.stringify(config) }),
  getScenarioStatus: () =>
    request('/api/scenario/status'),
  stopScenario: () =>
    request('/api/scenario/stop', { method: 'POST' }),

  // ---------- Evaluation ----------
  evaluate: () => request('/api/evaluate'),

  // ---------- Topology ----------
  getTopology: () => request('/api/topology'),
  updateTopology: (data) =>
    request('/api/topology', { method: 'PUT', body: JSON.stringify(data) }),

  // ---------- Alerts ----------
  getAlerts: () => request('/api/alerts'),
  updateThresholds: (thresholds) =>
    request('/api/alerts/thresholds', { method: 'PUT', body: JSON.stringify(thresholds) }),

  // ---------- Sessions ----------
  getSessions: () => request('/api/sessions'),
  saveSession: (name) =>
    request('/api/sessions/save', { method: 'POST', body: JSON.stringify({ name }) }),
  replaySession: (id) => request(`/api/sessions/${id}/replay`),
  deleteSession: (id) =>
    request(`/api/sessions/${id}`, { method: 'DELETE' }),

  // ---------- File Upload ----------
  uploadFile: async (file) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/upload/pcap`, { method: 'POST', body: form })
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
  },

  // ---------- Firewall ----------
  getFirewallRules: () => request('/api/firewall'),
  addFirewallRule: (rule) =>
    request('/api/firewall', { method: 'POST', body: JSON.stringify(rule) }),
  updateFirewallRule: (id, rule) =>
    request(`/api/firewall/${id}`, { method: 'PUT', body: JSON.stringify(rule) }),
  deleteFirewallRule: (id) =>
    request(`/api/firewall/${id}`, { method: 'DELETE' }),

  // ---------- Logs ----------
  getLogs: (limit = 100) => request(`/api/logs?limit=${limit}`),
}

export default api
