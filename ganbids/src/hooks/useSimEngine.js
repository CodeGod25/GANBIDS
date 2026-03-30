// ============================================================
// GANBIDS — Frontend Simulation Engine
// Generates realistic time-varying data when backend is offline
// ============================================================

import { useCallback, useRef } from 'react'

// ---------- Noise helpers ----------
function gauss(mean = 0, std = 1) {
  const u = 1 - Math.random()
  const v = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
function randi(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const ATTACK_TYPES = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
const PROTOCOLS = ['TCP', 'UDP', 'ICMP']
const SERVICES = ['HTTP', 'FTP', 'SSH', 'DNS', 'SMTP', 'TELNET', 'PRIVATE', 'FTP_DATA', 'ECO_I']
const SOURCES = ['192.168.1.100', '10.0.4.12', '172.16.0.45', '192.168.1.142', '192.168.1.201', '203.0.113.42']
const DESTINATIONS = ['10.0.4.12', '192.168.1.1', '192.168.1.100', '172.16.0.1']
const FLAGS = ['SYN', 'ACK', 'SYN,ACK', 'FIN', 'RST', 'PSH,ACK', 'RST,ACK', '']
const LOG_SOURCES = ['GAN_ENGINE', 'IDS_CORE', 'PACKET_GEN', 'NETWORK', 'FIREWALL']
const LOG_LEVELS = ['INFO', 'INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'CRIT']

const LOG_MESSAGES = {
  GAN_ENGINE: [
    'Optimized Discriminator backprop gradient normalization complete.',
    'Latent space diversity score: {v}. Stability: Nominal.',
    'Mode collapse risk detected in R2L subspace. Adjusting weight decay...',
    'Checkpoint saved at epoch {epoch}. Model: sentinel_gan_v2.pt',
    'FID score improved: {v1} → {v2}. Distribution alignment increasing.',
    'Generator gradient vanishing in U2R output layer. LR schedule adjusted.',
    'Discriminator accuracy vs Generator: {v}. Near Nash equilibrium.',
  ],
  IDS_CORE: [
    'Classification pipeline updated. Model hash: 0x{hex}.',
    'False negative detected: GAN_V4 packet bypassed SYN_FLOOD filter. Retraining triggered.',
    'Confusion matrix recalculated. F1-macro: {v}',
    'Real-time throughput: {n} events/sec. Buffer utilization: {pct}%.',
    'Ensemble vote: RF={c}, MLP={c}, SVM={c}. Consensus reached.',
    'Signature database updated. {n} new GAN-derived patterns added.',
    'ALERT: Privilege escalation attempt detected from {ip}. U2R signature match: {v}.',
  ],
  PACKET_GEN: [
    'Batch {n} generated. 128 synthetic packets emitted to IDS.',
    'UDP flood pattern generated. Payload entropy: {v} bits.',
    'R2L brute force sequence generated. {n} SSH auth attempts simulated.',
    'SQL injection polymorphic payload generated. WAF evasion score: {v}.',
  ],
  NETWORK: [
    'TCP handshake analysis: {n} SYN packets inspected. {n2} anomalous.',
    'ICMP echo request/reply pair validated. TTL: 64, hop count: {n}.',
    'ARP table audit: {n} entries validated. No spoofing detected.',
    'Packet reassembly timeout on fragment ID 0x{hex}. Possible fragmentation attack.',
    'BGP route advertisement received from AS{n}.',
  ],
  FIREWALL: [
    'ACL rule #{n} matched {n2} times in last 60s. Possible DDoS amplification.',
    'Port scan detected from {ip}. Sequential sweep on ports 22-443.',
    'ALERT: Outbound C2 beacon pattern detected. IP: {ip}, interval: 60s.',
  ],
}

function fillTemplate(tpl) {
  return tpl
    .replace(/\{v\}/g, () => (Math.random() * 1.5).toFixed(3))
    .replace(/\{v1\}/g, () => (30 + Math.random() * 20).toFixed(1))
    .replace(/\{v2\}/g, () => (25 + Math.random() * 15).toFixed(1))
    .replace(/\{n\}/g, () => randi(10, 50000))
    .replace(/\{n2\}/g, () => randi(1, 50))
    .replace(/\{pct\}/g, () => randi(10, 90))
    .replace(/\{hex\}/g, () => Math.random().toString(16).slice(2, 8).toUpperCase())
    .replace(/\{ip\}/g, () => pick(SOURCES))
    .replace(/\{c\}/g, () => pick(ATTACK_TYPES))
    .replace(/\{epoch\}/g, () => randi(100, 5000))
}

// ---------- Main engine ----------
export function useSimEngine() {
  const stateRef = useRef({
    epoch: 0,
    gLoss: 1.8,
    dLoss: 0.1,
    accuracy: 72,
    falsePositives: 0.12,
    latency: 18,
    detectionRate: 68,
    throughput: 350000,
    packetsGenerated: 0,
    packetsClassified: 0,
    packetsBlocked: 0,
    confusionMatrix: {
      labels: ['DDOS', 'R2L', 'U2R', 'PROBE', 'NORMAL'],
      data: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
    },
    lossHistory: { epochs: [], gLosses: [], dLosses: [] },
    accuracyHistory: [],
    evasionHistory: [],
    classificationFeed: [],
    attackLog: [],
    systemLogs: [],
    packetCapture: [],
    protocolDist: { TCP: 0, UDP: 0, ICMP: 0 },
  })

  const tick = useCallback((intensity = 50) => {
    const s = stateRef.current
    const intensityFactor = intensity / 100

    // ---------- Training metrics ----------
    s.epoch += 1
    // Generator loss converges down with noise
    s.gLoss = clamp(s.gLoss + gauss(-0.008, 0.012), 0.3, 2.0)
    // Discriminator loss converges up toward ~0.69
    s.dLoss = clamp(s.dLoss + gauss(0.006, 0.01), 0.05, 1.2)

    s.lossHistory.epochs.push(s.epoch)
    s.lossHistory.gLosses.push(s.gLoss)
    s.lossHistory.dLosses.push(s.dLoss)
    // Keep last 200 data points
    if (s.lossHistory.epochs.length > 200) {
      s.lossHistory.epochs.shift()
      s.lossHistory.gLosses.shift()
      s.lossHistory.dLosses.shift()
    }

    // ---------- IDS metrics ----------
    s.accuracy = clamp(s.accuracy + gauss(0.15, 0.3), 60, 99.9)
    s.falsePositives = clamp(s.falsePositives + gauss(-0.002, 0.005), 0.001, 0.5)
    s.latency = clamp(s.latency + gauss(-0.1, 0.5), 5, 50)
    s.detectionRate = clamp(s.detectionRate + gauss(0.2, 0.4), 50, 99.9)
    s.throughput = clamp(s.throughput + gauss(1000, 5000), 100000, 999999)

    s.accuracyHistory.push(s.accuracy)
    s.evasionHistory.push(clamp(100 - s.accuracy + gauss(0, 5), 0, 100))
    if (s.accuracyHistory.length > 50) {
      s.accuracyHistory.shift()
      s.evasionHistory.shift()
    }

    // ---------- Generate packets ----------
    const packetCount = Math.floor(3 + intensityFactor * 8)
    const newPackets = []
    for (let i = 0; i < packetCount; i++) {
      const proto = pick(PROTOCOLS)
      s.protocolDist[proto] = (s.protocolDist[proto] || 0) + 1
      const isAttack = Math.random() < (0.2 + intensityFactor * 0.5)
      const attackType = isAttack ? pick(ATTACK_TYPES.filter(a => a !== 'NORMAL')) : 'NORMAL'
      const confidence = isAttack ? 0.5 + Math.random() * 0.5 : 0.7 + Math.random() * 0.3
      const detected = confidence > 0.6
      const blocked = detected && isAttack

      s.packetsGenerated++
      s.packetsClassified++
      if (blocked) s.packetsBlocked++

      // Update confusion matrix
      const actualIdx = s.confusionMatrix.labels.indexOf(attackType)
      const predictedType = detected ? attackType : 'NORMAL'
      const predIdx = s.confusionMatrix.labels.indexOf(predictedType)
      if (actualIdx >= 0 && predIdx >= 0) {
        s.confusionMatrix.data[actualIdx][predIdx]++
      }

      const pkt = {
        id: s.packetsGenerated,
        time: (s.packetsGenerated * 0.001).toFixed(6),
        src: pick(SOURCES),
        dst: pick(DESTINATIONS),
        protocol: proto,
        length: randi(40, 1500),
        flags: proto === 'ICMP' ? '' : pick(FLAGS),
        service: pick(SERVICES),
        srcBytes: randi(0, 50000),
        duration: (Math.random() * 2).toFixed(4),
        attackType,
        predictedType,
        confidence,
        detected,
        blocked,
        info: `${pick(SOURCES)} → ${pick(DESTINATIONS)} [${proto}] ${isAttack ? attackType : 'Normal traffic'}`,
      }
      newPackets.push(pkt)
    }

    // Add to capture (keep last 200)
    s.packetCapture = [...s.packetCapture, ...newPackets].slice(-200)

    // Add classifications to feed (keep last 50)
    const newClassifications = newPackets
      .filter(p => p.attackType !== 'NORMAL')
      .map(p => ({
        time: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ip: p.src,
        type: p.attackType,
        sig: `${p.attackType}_${p.protocol}_${p.service}_PATTERN`.toUpperCase(),
        confidence: p.confidence,
        blocked: p.blocked,
      }))
    s.classificationFeed = [...newClassifications, ...s.classificationFeed].slice(0, 50)

    // Add attack events (keep last 30)
    const newEvents = newPackets
      .filter(p => p.attackType !== 'NORMAL' && p.detected)
      .map(p => ({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }) + ':' + String(randi(0, 999)).padStart(3, '0'),
        type: p.attackType === 'DDOS' ? pick(['SYN_FLOOD', 'UDP_FLOOD', 'ICMP_ECHO']) :
              p.attackType === 'PROBE' ? pick(['PORT_SCAN', 'NMAP_SCAN', 'OS_FINGERPRINT']) :
              p.attackType === 'R2L' ? pick(['BRUTE_FORCE', 'FTP_WRITE', 'IMAP_AUTH']) :
              p.attackType === 'U2R' ? pick(['BUFFER_OVERFLOW', 'ROOTKIT', 'PRIV_ESCALATION']) : p.attackType,
        source: `GAN_GEN_V${randi(1, 5)}`,
        status: p.blocked ? 'BLOCKED_BY_IDS' : 'IDS_BYPASS_ATTEMPT',
        severity: p.blocked ? 'detected' : 'alert',
      }))
    s.attackLog = [...newEvents, ...s.attackLog].slice(0, 30)

    // ---------- Generate log entry ----------
    const logSource = pick(LOG_SOURCES)
    const msgs = LOG_MESSAGES[logSource]
    const now = new Date()
    const logTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const newLog = {
      time: logTime,
      level: pick(LOG_LEVELS),
      source: logSource,
      msg: fillTemplate(pick(msgs)),
    }
    s.systemLogs = [...s.systemLogs, newLog].slice(-500)

    // ---------- Compute summary ----------
    const totalProto = s.protocolDist.TCP + s.protocolDist.UDP + s.protocolDist.ICMP || 1
    const protocolDistribution = [
      { name: 'TCP', percentage: Math.round((s.protocolDist.TCP / totalProto) * 100), color: '#69DAFF' },
      { name: 'UDP', percentage: Math.round((s.protocolDist.UDP / totalProto) * 100), color: '#2FF801' },
      { name: 'ICMP', percentage: Math.round((s.protocolDist.ICMP / totalProto) * 100), color: '#F59E0B' },
    ]

    // Compute classification metrics from confusion matrix
    const cm = s.confusionMatrix
    const classificationMetrics = cm.labels.map((label, idx) => {
      const tp = cm.data[idx][idx]
      const fp = cm.data.reduce((sum, row, r) => r !== idx ? sum + row[idx] : sum, 0)
      const fn = cm.data[idx].reduce((sum, val, c) => c !== idx ? sum + val : sum, 0)
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
      return { category: label, precision, recall, f1 }
    })

    return {
      epoch: s.epoch,
      gLoss: s.gLoss,
      dLoss: s.dLoss,
      accuracy: s.accuracy,
      falsePositives: s.falsePositives,
      latency: s.latency,
      detectionRate: s.detectionRate,
      throughput: s.throughput,
      packetsGenerated: s.packetsGenerated,
      packetsClassified: s.packetsClassified,
      packetsBlocked: s.packetsBlocked,
      confusionMatrix: { ...s.confusionMatrix, data: s.confusionMatrix.data.map(r => [...r]) },
      lossHistory: { ...s.lossHistory },
      accuracyHistory: [...s.accuracyHistory],
      evasionHistory: [...s.evasionHistory],
      classificationFeed: [...s.classificationFeed],
      attackLog: [...s.attackLog],
      systemLogs: [...s.systemLogs],
      packetCapture: [...s.packetCapture],
      protocolDistribution,
      classificationMetrics,
      newPackets,
    }
  }, [])

  const reset = useCallback(() => {
    const s = stateRef.current
    s.epoch = 0
    s.gLoss = 1.8
    s.dLoss = 0.1
    s.accuracy = 72
    s.falsePositives = 0.12
    s.latency = 18
    s.detectionRate = 68
    s.throughput = 350000
    s.packetsGenerated = 0
    s.packetsClassified = 0
    s.packetsBlocked = 0
    s.confusionMatrix.data = s.confusionMatrix.data.map(() => [0, 0, 0, 0, 0])
    s.lossHistory = { epochs: [], gLosses: [], dLosses: [] }
    s.accuracyHistory = []
    s.evasionHistory = []
    s.classificationFeed = []
    s.attackLog = []
    s.systemLogs = []
    s.packetCapture = []
    s.protocolDist = { TCP: 0, UDP: 0, ICMP: 0 }
  }, [])

  return { tick, reset }
}

export default useSimEngine
