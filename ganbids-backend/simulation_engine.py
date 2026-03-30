"""
GANBIDS — Simulation Engine
Core simulation loop: generates packets, classifies them, tracks metrics.
"""
import time
import random
import threading
import numpy as np
from collections import defaultdict

try:
    import torch
except ImportError:
    torch = None

ATTACK_TYPES = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
PROTOCOLS = ['TCP', 'UDP', 'ICMP']
SERVICES = ['HTTP', 'FTP', 'SSH', 'DNS', 'SMTP', 'TELNET', 'PRIVATE', 'FTP_DATA', 'ECO_I']
SOURCES = ['192.168.1.100', '10.0.4.12', '172.16.0.45', '192.168.1.142', '192.168.1.201', '203.0.113.42']
DESTINATIONS = ['10.0.4.12', '192.168.1.1', '192.168.1.100', '172.16.0.1']
FLAGS = ['SYN', 'ACK', 'SYN,ACK', 'FIN', 'RST', 'PSH,ACK', 'RST,ACK', '']


class SimulationEngine:
    def __init__(self, generator=None, ids_classifier=None, socketio=None):
        self.generator = generator
        self.ids_classifier = ids_classifier
        self.socketio = socketio

        self.running = False
        self.intensity = 50
        self.epoch = 0
        self.g_loss = 1.8
        self.d_loss = 0.1
        self.accuracy = 72.0
        self.false_positives = 0.12
        self.latency = 18.0
        self.detection_rate = 68.0
        self.throughput = 350000.0
        self.packets_generated = 0
        self.packets_classified = 0
        self.packets_blocked = 0

        # Confusion matrix: 5x5 (DDOS, R2L, U2R, PROBE, NORMAL → but we use ATTACK_TYPES order)
        self.labels = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
        self.confusion_matrix = np.zeros((5, 5), dtype=int)

        self.loss_history = {'epochs': [], 'gLosses': [], 'dLosses': []}
        self.accuracy_history = []
        self.evasion_history = []
        self.classification_feed = []
        self.attack_log = []
        self.system_logs = []
        self.packet_capture = []
        self.protocol_dist = {'TCP': 0, 'UDP': 0, 'ICMP': 0}

        self._thread = None
        self._lock = threading.Lock()

        # Scenario
        self.scenario_running = False
        self.scenario_config = None
        self.scenario_start_time = None

    def start(self, intensity=50):
        """Start the simulation engine."""
        self.running = True
        self.intensity = intensity
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop the simulation engine."""
        self.running = False
        if self._thread:
            self._thread.join(timeout=2)
        self._thread = None

    def set_intensity(self, val):
        self.intensity = max(1, min(100, val))

    def _run_loop(self):
        """Main simulation loop — runs in background thread."""
        while self.running:
            with self._lock:
                data = self._tick()
            if self.socketio:
                self.socketio.emit('simulation_tick', data)
            time.sleep(0.8)

    def _tick(self):
        """Single simulation tick — generates packets, classifies, updates metrics."""
        self.epoch += 1
        intensity_factor = self.intensity / 100.0

        # Update training loss
        self.g_loss = max(0.3, min(2.0, self.g_loss + random.gauss(-0.008, 0.012)))
        self.d_loss = max(0.05, min(1.2, self.d_loss + random.gauss(0.006, 0.01)))
        self.loss_history['epochs'].append(self.epoch)
        self.loss_history['gLosses'].append(round(self.g_loss, 4))
        self.loss_history['dLosses'].append(round(self.d_loss, 4))
        if len(self.loss_history['epochs']) > 200:
            self.loss_history['epochs'].pop(0)
            self.loss_history['gLosses'].pop(0)
            self.loss_history['dLosses'].pop(0)

        # Update IDS metrics
        self.accuracy = max(60, min(99.9, self.accuracy + random.gauss(0.15, 0.3)))
        self.false_positives = max(0.001, min(0.5, self.false_positives + random.gauss(-0.002, 0.005)))
        self.latency = max(5, min(50, self.latency + random.gauss(-0.1, 0.5)))
        self.detection_rate = max(50, min(99.9, self.detection_rate + random.gauss(0.2, 0.4)))
        self.throughput = max(100000, min(999999, self.throughput + random.gauss(1000, 5000)))

        self.accuracy_history.append(round(self.accuracy, 2))
        self.evasion_history.append(round(max(0, min(100, 100 - self.accuracy + random.gauss(0, 5))), 2))
        if len(self.accuracy_history) > 50:
            self.accuracy_history.pop(0)
            self.evasion_history.pop(0)

        # Generate packets
        packet_count = int(3 + intensity_factor * 8)
        new_packets = []

        # Real ML Inference Block
        ml_features, ml_class_labels, ml_probs = None, None, None
        if self.generator is not None and self.ids_classifier is not None and torch is not None:
            try:
                # 1. Generate 41-feature packets across batch
                z = torch.randn(packet_count, 100)
                ml_features = self.generator(z).detach().numpy()
                
                # 2. Scale & Classify with IDS Random Forest
                scaled_features = self.ids_classifier.scaler.transform(ml_features)
                ml_predictions = self.ids_classifier.predict(scaled_features)
                ml_probs = self.ids_classifier.predict_proba(scaled_features)
                
                pred_map = {0: 'NORMAL', 1: 'DDOS', 2: 'PROBE', 3: 'R2L', 4: 'U2R'}
                ml_class_labels = [pred_map.get(int(p), 'NORMAL') for p in ml_predictions]
            except Exception as e:
                print(f"PyTorch Inference engine failed, falling back: {e}")
                pass

        for i in range(packet_count):
            proto = random.choice(PROTOCOLS)
            self.protocol_dist[proto] = self.protocol_dist.get(proto, 0) + 1
            
            if ml_features is not None:
                # --- LIVE INFERENCE ROUTE ---
                predicted_type = ml_class_labels[i]
                
                # The "True" attack class vs what the IDS detected happens here.
                # In standard adversarial generators, it usually aims for 'NORMAL' evasion.
                # For UI demonstration, we'll treat the prediction as the ground truth attack_type dynamically mapping
                is_attack = (predicted_type != 'NORMAL')
                attack_type = predicted_type
                
                # Randomize a small chance the True type was actually malicious but IDS missed it (Evasion)
                if not is_attack and random.random() < 0.15:
                    attack_type = random.choice(['PROBE', 'DDOS'])
                    
                confidence = float(np.max(ml_probs[i]))
            else:
                # --- FALLBACK SIMULATION ROUTE ---
                is_attack = random.random() < (0.2 + intensity_factor * 0.5)
                attack_type = random.choice([t for t in ATTACK_TYPES if t != 'NORMAL']) if is_attack else 'NORMAL'
                confidence = 0.5 + random.random() * 0.5 if is_attack else 0.7 + random.random() * 0.3
                predicted_type = attack_type if confidence > 0.6 else 'NORMAL'

            detected = (predicted_type != 'NORMAL')
            blocked = detected and attack_type != 'NORMAL'

            self.packets_generated += 1
            self.packets_classified += 1
            if blocked:
                self.packets_blocked += 1

            # Update confusion matrix
            actual_idx = self.labels.index(attack_type)
            pred_idx = self.labels.index(predicted_type)
            self.confusion_matrix[actual_idx][pred_idx] += 1

            pkt = {
                'id': self.packets_generated,
                'time': f'{self.packets_generated * 0.001:.6f}',
                'src': random.choice(SOURCES),
                'dst': random.choice(DESTINATIONS),
                'protocol': proto,
                'length': random.randint(40, 1500),
                'flags': '' if proto == 'ICMP' else random.choice(FLAGS),
                'service': random.choice(SERVICES),
                'srcBytes': random.randint(0, 50000),
                'duration': f'{random.random() * 2:.4f}',
                'attackType': attack_type,
                'predictedType': predicted_type,
                'confidence': round(confidence, 3),
                'detected': detected,
                'blocked': blocked,
                'info': f'{random.choice(SOURCES)} → {random.choice(DESTINATIONS)} [{proto}] {attack_type}'
            }
            new_packets.append(pkt)

        self.packet_capture = (self.packet_capture + new_packets)[-200:]

        # Classification feed
        new_classifications = [
            {
                'time': time.strftime('%Y-%m-%d %H:%M:%S'),
                'ip': p['src'],
                'type': p['attackType'],
                'sig': f"{p['attackType']}_{p['protocol']}_{p['service']}_PATTERN",
                'confidence': p['confidence'],
                'blocked': p['blocked'],
            }
            for p in new_packets if p['attackType'] != 'NORMAL'
        ]
        self.classification_feed = (new_classifications + self.classification_feed)[:50]

        # Attack log
        new_events = [
            {
                'time': time.strftime('%H:%M:%S') + f':{random.randint(0,999):03}',
                'type': p['attackType'],
                'source': f'GAN_GEN_V{random.randint(1,5)}',
                'status': 'BLOCKED_BY_IDS' if p['blocked'] else 'IDS_BYPASS_ATTEMPT',
                'severity': 'detected' if p['blocked'] else 'alert',
            }
            for p in new_packets if p['attackType'] != 'NORMAL' and p['detected']
        ]
        self.attack_log = (new_events + self.attack_log)[:30]

        # Protocol distribution
        total_proto = sum(self.protocol_dist.values()) or 1
        protocol_distribution = [
            {'name': 'TCP', 'percentage': round(self.protocol_dist['TCP'] / total_proto * 100), 'color': '#69DAFF'},
            {'name': 'UDP', 'percentage': round(self.protocol_dist['UDP'] / total_proto * 100), 'color': '#2FF801'},
            {'name': 'ICMP', 'percentage': round(self.protocol_dist['ICMP'] / total_proto * 100), 'color': '#F59E0B'},
        ]

        # Classification metrics from confusion matrix
        classification_metrics = []
        for idx, label in enumerate(self.labels):
            tp = int(self.confusion_matrix[idx][idx])
            fp = int(np.sum(self.confusion_matrix[:, idx]) - tp)
            fn = int(np.sum(self.confusion_matrix[idx, :]) - tp)
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            classification_metrics.append({'category': label, 'precision': round(precision, 3), 'recall': round(recall, 3), 'f1': round(f1, 3)})

        # Check scenario timeout
        if self.scenario_running and self.scenario_config:
            elapsed = time.time() - self.scenario_start_time
            if elapsed >= self.scenario_config.get('duration', 60):
                self.scenario_running = False
                if self.socketio:
                    self.socketio.emit('scenario_complete', {
                        'epoch': self.epoch,
                        'accuracy': round(self.accuracy, 1),
                        'packetsGenerated': self.packets_generated,
                        'packetsBlocked': self.packets_blocked,
                        'name': self.scenario_config.get('name', 'Scenario'),
                    })

        return {
            'epoch': self.epoch,
            'gLoss': round(self.g_loss, 4),
            'dLoss': round(self.d_loss, 4),
            'accuracy': round(self.accuracy, 2),
            'falsePositives': round(self.false_positives, 4),
            'latency': round(self.latency, 1),
            'detectionRate': round(self.detection_rate, 2),
            'throughput': round(self.throughput),
            'packetsGenerated': self.packets_generated,
            'packetsClassified': self.packets_classified,
            'packetsBlocked': self.packets_blocked,
            'confusionMatrix': {
                'labels': self.labels,
                'data': self.confusion_matrix.tolist(),
            },
            'lossHistory': self.loss_history,
            'accuracyHistory': self.accuracy_history,
            'evasionHistory': self.evasion_history,
            'classificationFeed': self.classification_feed,
            'classificationMetrics': classification_metrics,
            'attackLog': self.attack_log,
            'systemLogs': self.system_logs[-100:],
            'packetCapture': self.packet_capture[-100:],
            'protocolDistribution': protocol_distribution,
        }

    def get_state(self):
        with self._lock:
            return {
                'running': self.running,
                'epoch': self.epoch,
                'intensity': self.intensity,
                'accuracy': round(self.accuracy, 2),
                'packetsGenerated': self.packets_generated,
                'scenarioRunning': self.scenario_running,
            }

    def run_scenario(self, config):
        """Start a scenario run."""
        self.scenario_config = config
        self.scenario_running = True
        self.scenario_start_time = time.time()
        self.intensity = config.get('intensity', 50)
        if not self.running:
            self.start(self.intensity)

    def stop_scenario(self):
        self.scenario_running = False
        self.scenario_config = None

    def reset(self):
        self.epoch = 0
        self.g_loss = 1.8
        self.d_loss = 0.1
        self.accuracy = 72.0
        self.false_positives = 0.12
        self.latency = 18.0
        self.detection_rate = 68.0
        self.throughput = 350000.0
        self.packets_generated = 0
        self.packets_classified = 0
        self.packets_blocked = 0
        self.confusion_matrix = np.zeros((5, 5), dtype=int)
        self.loss_history = {'epochs': [], 'gLosses': [], 'dLosses': []}
        self.accuracy_history = []
        self.evasion_history = []
        self.classification_feed = []
        self.attack_log = []
        self.system_logs = []
        self.packet_capture = []
        self.protocol_dist = {'TCP': 0, 'UDP': 0, 'ICMP': 0}
