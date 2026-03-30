// ============================================================
// GANBIDS Mock Data — Realistic simulation data for all views
// ============================================================

// ---------- System Status ----------
export const systemStatus = {
  status: 'Active',
  totalAttacks: '1.2M',
  throughput: '450k EPS',
  uptime: '99.97%',
};

// ---------- Live Dashboard Metrics ----------
export const dashboardMetrics = [
  { label: 'Detection Accuracy', value: '98.4', unit: '%', change: '+0.2%', changeType: 'positive', border: 'primary', glow: true },
  { label: 'Total Attack Vectors', value: '14', unit: '', change: '', changeType: '', border: 'primary-container' },
  { label: 'Average Latency', value: '12', unit: 'ms', change: 'STABLE', changeType: 'neutral', border: 'outline' },
  { label: 'Threat Level', value: 'LOW', unit: '', change: '', changeType: '', border: 'secondary', valueColor: 'var(--secondary)' },
];

// ---------- GAN Training Metrics ----------
export const ganMetrics = [
  { label: 'Epoch Progress', value: '1,240', unit: '', change: '/ 5,000', changeType: '', border: 'primary-container' },
  { label: 'Generator Loss', value: '0.8422', unit: '', change: '', changeType: '', border: 'secondary', valueColor: 'var(--secondary)' },
  { label: 'Discriminator Loss', value: '0.6914', unit: '', change: '', changeType: '', border: 'tertiary', valueColor: 'var(--tertiary)' },
  { label: 'Inception Score', value: '9.24', unit: '', change: '↑ 0.4', changeType: 'positive', border: 'primary' },
];

// ---------- IDS Analytics Metrics ----------
export const idsMetrics = [
  { label: 'Average Accuracy', value: '98.42%', unit: '', change: '+1.2% from last epoch', changeType: 'positive', border: 'primary-container' },
  { label: 'False Positives', value: '0.04%', unit: '', change: 'Optimized', changeType: 'negative', border: 'tertiary' },
  { label: 'Detection Latency', value: '14', unit: 'ms', change: 'P99 Percentile', changeType: '', border: 'primary-fixed' },
  { label: 'GAN Evolution', value: 'GEN_42', unit: '', change: 'Active Adversary', changeType: 'positive', border: 'secondary' },
];

// ---------- Loss Curve Data (for Chart.js) ----------
export const lossCurveData = {
  labels: Array.from({ length: 50 }, (_, i) => i * 100),
  generatorLoss: [1.8, 1.7, 1.65, 1.5, 1.4, 1.35, 1.25, 1.2, 1.15, 1.1, 1.08, 1.05, 1.0, 0.98, 0.95, 0.93, 0.92, 0.91, 0.9, 0.89, 0.88, 0.87, 0.86, 0.855, 0.85, 0.848, 0.846, 0.845, 0.844, 0.843, 0.8425, 0.842, 0.842, 0.8422, 0.8422, 0.8422, 0.842, 0.842, 0.842, 0.8422, 0.843, 0.842, 0.841, 0.842, 0.8422, 0.843, 0.842, 0.842, 0.8422, 0.8422],
  discriminatorLoss: [0.1, 0.15, 0.18, 0.25, 0.3, 0.35, 0.38, 0.42, 0.45, 0.48, 0.5, 0.52, 0.55, 0.57, 0.59, 0.6, 0.62, 0.63, 0.64, 0.65, 0.66, 0.665, 0.67, 0.675, 0.68, 0.682, 0.685, 0.687, 0.688, 0.689, 0.69, 0.6905, 0.691, 0.6912, 0.6914, 0.6914, 0.6914, 0.691, 0.6912, 0.6914, 0.692, 0.691, 0.691, 0.6914, 0.6914, 0.692, 0.691, 0.691, 0.6914, 0.6914],
};

// ---------- Confusion Matrix ----------
export const confusionMatrix = {
  labels: ['DDOS', 'R2L', 'U2R', 'PROBE'],
  data: [
    [992, 4, 0, 12],
    [8, 876, 42, 5],
    [0, 15, 941, 2],
    [3, 2, 1, 988],
  ],
};

// ---------- Classification Metrics ----------
export const classificationMetrics = [
  { category: 'DDoS', precision: 0.994, recall: 0.982, f1: 0.988 },
  { category: 'R2L', precision: 0.921, recall: 0.945, f1: 0.933 },
  { category: 'U2R', precision: 0.967, recall: 0.952, f1: 0.959 },
  { category: 'Probe', precision: 0.998, recall: 0.991, f1: 0.994 },
];

// ---------- Top Detected Patterns ----------
export const topPatterns = [
  { name: 'SYN_FLOOD_V4', instances: '425k', width: 85 },
  { name: 'SQL_INJECT_POLY', instances: '212k', width: 55 },
  { name: 'ROOT_KIT_OFS', instances: '98k', width: 25 },
  { name: 'SSH_BRUTE_FORCE', instances: '45k', width: 15 },
  { name: 'BUFFER_OVER_GEN', instances: '12k', width: 8 },
];

// ---------- Feature Importance ----------
export const featureImportance = [
  { name: 'protocol_type', score: 0.892, width: 89 },
  { name: 'dst_bytes', score: 0.745, width: 74 },
  { name: 'logged_in', score: 0.612, width: 61 },
  { name: 'num_failed_logins', score: 0.438, width: 43 },
  { name: 'service', score: 0.221, width: 22 },
];

// ---------- Synthetic Packets ----------
export const syntheticPackets = [
  { id: '#PKT_0821A', class: 'DOS', protocol: 'TCP', service: 'HTTP', srcBytes: '1,042', duration: '0.0004s' },
  { id: '#PKT_0821B', class: 'PROBE', protocol: 'UDP', service: 'PRIVATE', srcBytes: '48', duration: '0.0215s' },
  { id: '#PKT_0821C', class: 'R2L', protocol: 'TCP', service: 'FTP_DATA', srcBytes: '8,210', duration: '1.42s' },
  { id: '#PKT_0821D', class: 'DOS', protocol: 'ICMP', service: 'ECO_I', srcBytes: '512', duration: '0.0000s' },
];

// ---------- Attack Event Log ----------
export const attackEvents = [
  { time: '14:22:01:042', type: 'SYN_FLOOD', source: 'GAN_GEN_V3', status: 'BLOCKED_BY_IDS', severity: 'detected' },
  { time: '14:21:58:912', type: 'PORT_SCAN', source: 'GAN_GEN_V3', status: 'LOGGED_ANALYSIS', severity: 'detected' },
  { time: '14:21:55:002', type: 'R_U_DEAD_YET', source: 'GAN_GEN_V4', status: 'IDS_BYPASS_ATTEMPT', severity: 'alert' },
  { time: '14:21:50:331', type: 'HTTP_FUZZ', source: 'GAN_GEN_V3', status: 'MITIGATED_FILTER', severity: 'detected' },
  { time: '14:21:44:119', type: 'ICMP_ECHO', source: 'GAN_GEN_V2', status: 'BLOCKED_BY_IDS', severity: 'detected' },
  { time: '14:21:38:005', type: 'SYN_FLOOD', source: 'GAN_GEN_V3', status: 'BLOCKED_BY_IDS', severity: 'detected' },
  { time: '14:21:35:442', type: 'BRUTE_FORCE', source: 'GAN_GEN_V1', status: 'AUTH_DENIED', severity: 'detected' },
];

// ---------- Classification Feed ----------
export const classificationFeed = [
  { time: '2024-05-20 14:02:11', ip: '192.168.1.142', type: 'PROBE', typeColor: 'var(--primary)', sig: 'NMAP_SCAN_OS_FINGERPRINT_DETECTION', conf: 0.998 },
  { time: '2024-05-20 14:02:08', ip: '10.0.4.12', type: 'DDOS', typeColor: 'var(--tertiary)', sig: 'UDP_FLOOD_ANOMALY_MALFORMED_HEADER', conf: 0.942 },
  { time: '2024-05-20 14:01:55', ip: '172.16.0.45', type: 'U2R', typeColor: 'var(--primary)', sig: 'SUDO_OVERFLOW_PRIV_ESCALATION_ATTEMPT', conf: 0.976 },
  { time: '2024-05-20 14:01:42', ip: '192.168.1.201', type: 'R2L', typeColor: 'var(--primary)', sig: 'BRUTE_FORCE_SSH_REPEATED_AUTH_FAILURE', conf: 0.921 },
];

// ---------- Threat Timeline Data ----------
export const threatTimeline = {
  labels: ['EP_01', 'EP_04', 'EP_08', 'EP_12', 'EP_16', 'EP_20', 'EP_24'],
  idsAccuracy: [72, 78, 84, 89, 93, 96, 98.4],
  ganEvasion: [85, 78, 65, 50, 35, 18, 8],
};

// ---------- Confidence Distribution ----------
export const confidenceDistribution = {
  labels: ['0.0-0.1', '0.1-0.2', '0.2-0.3', '0.3-0.4', '0.4-0.5', '0.5-0.6', '0.6-0.8', '0.8-1.0'],
  values: [10, 15, 8, 20, 35, 55, 85, 100],
};

// ---------- Simulation Logs ----------
export const simulationLogs = [
  { time: '09:42:01', level: 'INFO', source: 'GAN_ENGINE', msg: 'Optimized Discriminator backprop gradient normalization complete.' },
  { time: '09:42:02', level: 'INFO', source: 'GAN_ENGINE', msg: 'Latent space diversity score: 0.814. Stability: Nominal.' },
  { time: '09:42:04', level: 'WARN', source: 'GAN_ENGINE', msg: 'Mode collapse risk detected in R2L subspace. Adjusting weight decay...' },
  { time: '09:42:05', level: 'INFO', source: 'IDS_CORE', msg: 'Classification pipeline updated. Model hash: 0x4FA2B1C.' },
  { time: '09:42:06', level: 'INFO', source: 'PACKET_GEN', msg: 'Batch 1240 generated. 128 synthetic packets emitted to IDS.' },
  { time: '09:42:08', level: 'INFO', source: 'GAN_ENGINE', msg: 'Checkpoint saved at epoch 1240. Model: sentinel_gan_v2.pt' },
  { time: '09:42:10', level: 'ERROR', source: 'IDS_CORE', msg: 'False negative detected: GAN_V4 packet bypassed SYN_FLOOD filter. Retraining triggered.' },
  { time: '09:42:11', level: 'INFO', source: 'NETWORK', msg: 'TCP handshake analysis: 14,291 SYN packets inspected. 12 anomalous.' },
  { time: '09:42:13', level: 'WARN', source: 'FIREWALL', msg: 'ACL rule #42 matched 892 times in last 60s. Possible DDoS amplification.' },
  { time: '09:42:14', level: 'INFO', source: 'IDS_CORE', msg: 'Confusion matrix recalculated. F1-macro: 0.9685' },
  { time: '09:42:16', level: 'INFO', source: 'PACKET_GEN', msg: 'UDP flood pattern generated. Payload entropy: 7.2 bits.' },
  { time: '09:42:18', level: 'CRIT', source: 'IDS_CORE', msg: 'ALERT: Privilege escalation attempt detected from 172.16.0.45. U2R signature match: 0.976.' },
  { time: '09:42:20', level: 'INFO', source: 'NETWORK', msg: 'ICMP echo request/reply pair validated. TTL: 64, hop count: 4.' },
  { time: '09:42:22', level: 'INFO', source: 'GAN_ENGINE', msg: 'Discriminator accuracy vs Generator: 0.52. Near Nash equilibrium.' },
  { time: '09:42:24', level: 'WARN', source: 'FIREWALL', msg: 'Port scan detected from 10.0.4.12. Sequential sweep on ports 22-443.' },
  { time: '09:42:25', level: 'INFO', source: 'PACKET_GEN', msg: 'R2L brute force sequence generated. 500 SSH auth attempts simulated.' },
  { time: '09:42:27', level: 'INFO', source: 'IDS_CORE', msg: 'Real-time throughput: 452,891 events/sec. Buffer utilization: 34%.' },
  { time: '09:42:29', level: 'ERROR', source: 'NETWORK', msg: 'Packet reassembly timeout on fragment ID 0x7FA2. Possible fragmentation attack.' },
  { time: '09:42:31', level: 'INFO', source: 'GAN_ENGINE', msg: 'FID score improved: 42.1 → 38.7. Distribution alignment increasing.' },
  { time: '09:42:33', level: 'INFO', source: 'IDS_CORE', msg: 'Signature database updated. 14 new GAN-derived patterns added.' },
  { time: '09:42:35', level: 'INFO', source: 'NETWORK', msg: 'ARP table audit: 128 entries validated. No spoofing detected.' },
  { time: '09:42:37', level: 'WARN', source: 'GAN_ENGINE', msg: 'Generator gradient vanishing in U2R output layer. LR schedule adjusted.' },
  { time: '09:42:39', level: 'INFO', source: 'PACKET_GEN', msg: 'SQL injection polymorphic payload generated. WAF evasion score: 0.78.' },
  { time: '09:42:41', level: 'INFO', source: 'IDS_CORE', msg: 'Ensemble vote: RF=DoS, MLP=DoS, SVM=DoS. Consensus reached.' },
  { time: '09:42:43', level: 'CRIT', source: 'FIREWALL', msg: 'ALERT: Outbound C2 beacon pattern detected. IP: 203.0.113.42, interval: 60s.' },
];

// ---------- Topology Nodes ----------
export const topologyNodes = [
  { id: 'gan', label: 'GAN_GEN', x: 100, y: 200, type: 'generator', color: '#00CFFC' },
  { id: 'fw', label: 'FIREWALL', x: 300, y: 200, type: 'firewall', color: '#F59E0B' },
  { id: 'ids', label: 'IDS_NODE', x: 500, y: 150, type: 'ids', color: '#2FF801' },
  { id: 'web', label: 'WEB_SRV', x: 700, y: 100, type: 'server', color: '#ECEDF6' },
  { id: 'db', label: 'DB_SRV', x: 700, y: 250, type: 'server', color: '#ECEDF6' },
  { id: 'dns', label: 'DNS_SRV', x: 700, y: 350, type: 'server', color: '#ECEDF6' },
  { id: 'attacker', label: 'ATTACKER', x: 100, y: 400, type: 'attacker', color: '#FF7073' },
];

export const topologyEdges = [
  { from: 'gan', to: 'fw', color: '#00CFFC', animated: true },
  { from: 'attacker', to: 'fw', color: '#FF7073', animated: true },
  { from: 'fw', to: 'ids', color: '#F59E0B', animated: true },
  { from: 'ids', to: 'web', color: '#2FF801', animated: false },
  { from: 'ids', to: 'db', color: '#2FF801', animated: false },
  { from: 'ids', to: 'dns', color: '#2FF801', animated: false },
];

// ---------- Protocol Distribution ----------
export const protocolDistribution = [
  { name: 'TCP', percentage: 62, color: '#69DAFF' },
  { name: 'UDP', percentage: 24, color: '#2FF801' },
  { name: 'ICMP', percentage: 14, color: '#F59E0B' },
];

export const tcpFlags = [
  { name: 'SYN', count: 45200 },
  { name: 'ACK', count: 38100 },
  { name: 'FIN', count: 12400 },
  { name: 'RST', count: 8900 },
  { name: 'PSH', count: 6200 },
];

// ---------- Packet Capture Data ----------
export const packetCapture = [
  { id: 1, time: '0.000000', src: '192.168.1.100', dst: '10.0.4.12', protocol: 'TCP', length: 74, flags: 'SYN', info: '49152 → 80 [SYN] Seq=0 Win=64240' },
  { id: 2, time: '0.000342', src: '10.0.4.12', dst: '192.168.1.100', protocol: 'TCP', length: 74, flags: 'SYN,ACK', info: '80 → 49152 [SYN, ACK] Seq=0 Ack=1' },
  { id: 3, time: '0.000455', src: '192.168.1.100', dst: '10.0.4.12', protocol: 'TCP', length: 66, flags: 'ACK', info: '49152 → 80 [ACK] Seq=1 Ack=1' },
  { id: 4, time: '0.001204', src: '192.168.1.100', dst: '10.0.4.12', protocol: 'TCP', length: 534, flags: 'PSH,ACK', info: 'HTTP GET / HTTP/1.1' },
  { id: 5, time: '0.002881', src: '172.16.0.45', dst: '192.168.1.1', protocol: 'UDP', length: 128, flags: '', info: '53 → 41923 DNS Standard query A evil.com' },
  { id: 6, time: '0.003102', src: '192.168.1.142', dst: '10.0.4.12', protocol: 'TCP', length: 60, flags: 'SYN', info: '59201 → 22 [SYN] Seq=0 - NMAP Scan' },
  { id: 7, time: '0.003445', src: '192.168.1.142', dst: '10.0.4.12', protocol: 'TCP', length: 60, flags: 'SYN', info: '59202 → 23 [SYN] Seq=0 - NMAP Scan' },
  { id: 8, time: '0.004201', src: '10.0.4.12', dst: '192.168.1.142', protocol: 'TCP', length: 54, flags: 'RST,ACK', info: '23 → 59202 [RST, ACK] - Port Closed' },
  { id: 9, time: '0.005000', src: '192.168.1.201', dst: '10.0.4.12', protocol: 'ICMP', length: 98, flags: '', info: 'Echo (ping) request id=0x0001 seq=1 ttl=64' },
  { id: 10, time: '0.005342', src: '10.0.4.12', dst: '192.168.1.201', protocol: 'ICMP', length: 98, flags: '', info: 'Echo (ping) reply id=0x0001 seq=1 ttl=64' },
  { id: 11, time: '0.006120', src: '192.168.1.100', dst: '10.0.4.12', protocol: 'TCP', length: 1514, flags: 'PSH,ACK', info: 'HTTP POST /login - SQL Injection attempt' },
  { id: 12, time: '0.007891', src: '203.0.113.42', dst: '192.168.1.1', protocol: 'UDP', length: 64, flags: '', info: 'C2 Beacon - Interval 60s - Suspicious' },
];

// ---------- Firewall Rules ----------
export const firewallRules = [
  { id: 1, action: 'DENY', protocol: 'TCP', source: '0.0.0.0/0', port: '23', desc: 'Block Telnet', hits: 892 },
  { id: 2, action: 'DENY', protocol: 'ICMP', source: '192.168.1.0/24', port: '*', desc: 'Block ICMP Flood', hits: 1247 },
  { id: 3, action: 'ALLOW', protocol: 'TCP', source: '10.0.0.0/8', port: '80,443', desc: 'Allow HTTP/S', hits: 45201 },
  { id: 4, action: 'DENY', protocol: 'UDP', source: '0.0.0.0/0', port: '53', desc: 'Block External DNS', hits: 342 },
  { id: 5, action: 'DENY', protocol: 'TCP', source: '0.0.0.0/0', port: '22', desc: 'Block SSH Brute Force', hits: 2891 },
];
