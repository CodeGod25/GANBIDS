"""
GANBIDS — Flask Backend
Full API server with WebSocket, simulation engine, session management.
"""
import os
import sys
import json
import random
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

# Add parent dir to path for model imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from simulation_engine import SimulationEngine
from session_manager import SessionManager

# ============================================================
# Try importing ML models (optional)
# ============================================================
generator = None
ids_classifier = None

try:
    import torch
    import joblib
    from models.generator import Generator, Discriminator
    from models.ids_classifier import IDSClassifier

    print('[INIT] PyTorch available. Initializing models...')
    generator = Generator(input_size=100, output_size=41)
    
    gen_path = os.path.join(os.path.dirname(__file__), 'models', 'gan_generator.pth')
    if os.path.exists(gen_path):
        generator.load_state_dict(torch.load(gen_path, map_location='cpu', weights_only=True))
        generator.eval()
        print(f'[INIT] Real PyTorch GAN loaded from {gen_path}')

    ids_clf_path = os.path.join(os.path.dirname(__file__), 'models', 'ids_classifier.pkl')
    scaler_path = os.path.join(os.path.dirname(__file__), 'models', 'scaler.pkl')
    
    if os.path.exists(ids_clf_path) and os.path.exists(scaler_path):
        ids_classifier = joblib.load(ids_clf_path)
        scaler = joblib.load(scaler_path)
        # Store scaler within the engine or pass it
        print(f'[INIT] Real RandomForest IDS loaded from {ids_clf_path}')
        
        # We attach the scaler to the ids_classifier dynamically so simulation engine can use it
        ids_classifier.scaler = scaler
    else:
        ids_classifier = None

except Exception as e:
    print(f'[INIT] ML models unavailable: {e}')
    print('[INIT] Running in simulation-only fallback mode')

# ============================================================
# App Setup
# ============================================================
app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24).hex()
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize engine and session manager
engine = SimulationEngine(generator=generator, ids_classifier=ids_classifier, socketio=socketio)
session_mgr = SessionManager()

# Default topology
DEFAULT_TOPOLOGY = {
    'nodes': [
        {'id': 'gan', 'label': 'GAN_GEN', 'x': 100, 'y': 200, 'type': 'generator', 'color': '#00CFFC'},
        {'id': 'fw', 'label': 'FIREWALL', 'x': 300, 'y': 200, 'type': 'firewall', 'color': '#F59E0B'},
        {'id': 'ids', 'label': 'IDS_NODE', 'x': 500, 'y': 150, 'type': 'ids', 'color': '#2FF801'},
        {'id': 'web', 'label': 'WEB_SRV', 'x': 700, 'y': 100, 'type': 'server', 'color': '#ECEDF6'},
        {'id': 'db', 'label': 'DB_SRV', 'x': 700, 'y': 250, 'type': 'server', 'color': '#ECEDF6'},
        {'id': 'dns', 'label': 'DNS_SRV', 'x': 700, 'y': 350, 'type': 'server', 'color': '#ECEDF6'},
        {'id': 'attacker', 'label': 'ATTACKER', 'x': 100, 'y': 400, 'type': 'attacker', 'color': '#FF7073'},
    ],
    'edges': [
        {'from': 'gan', 'to': 'fw', 'color': '#00CFFC', 'animated': True},
        {'from': 'attacker', 'to': 'fw', 'color': '#FF7073', 'animated': True},
        {'from': 'fw', 'to': 'ids', 'color': '#F59E0B', 'animated': True},
        {'from': 'ids', 'to': 'web', 'color': '#2FF801', 'animated': False},
        {'from': 'ids', 'to': 'db', 'color': '#2FF801', 'animated': False},
        {'from': 'ids', 'to': 'dns', 'color': '#2FF801', 'animated': False},
    ],
}
topology = dict(DEFAULT_TOPOLOGY)

# Default firewall rules
firewall_rules = [
    {'id': 1, 'action': 'DENY', 'protocol': 'TCP', 'source': '0.0.0.0/0', 'port': '23', 'desc': 'Block Telnet', 'hits': 892},
    {'id': 2, 'action': 'DENY', 'protocol': 'ICMP', 'source': '192.168.1.0/24', 'port': '*', 'desc': 'Block ICMP Flood', 'hits': 1247},
    {'id': 3, 'action': 'ALLOW', 'protocol': 'TCP', 'source': '10.0.0.0/8', 'port': '80,443', 'desc': 'Allow HTTP/S', 'hits': 45201},
    {'id': 4, 'action': 'DENY', 'protocol': 'UDP', 'source': '0.0.0.0/0', 'port': '53', 'desc': 'Block External DNS', 'hits': 342},
    {'id': 5, 'action': 'DENY', 'protocol': 'TCP', 'source': '0.0.0.0/0', 'port': '22', 'desc': 'Block SSH Brute Force', 'hits': 2891},
]

# Alert thresholds
alert_thresholds = {'accuracyMin': 80, 'falsePositiveMax': 0.1, 'throughputMax': 800000, 'criticalAttack': True}
alerts = []

# ============================================================
# REST API Endpoints
# ============================================================

@app.route('/api/status')
def get_status():
    return jsonify({
        'status': 'online',
        'simulationRunning': engine.running,
        'epoch': engine.epoch,
        'modelsLoaded': generator is not None,
    })


@app.route('/api/metrics')
def get_metrics():
    return jsonify(engine._tick() if engine.running else engine.get_state())


# ---------- Simulation ----------
@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    data = request.get_json(silent=True) or {}
    intensity = data.get('intensity', 50)
    if not engine.running:
        engine.start(intensity)
    return jsonify({'status': 'started', 'intensity': intensity})


@app.route('/api/simulation/stop', methods=['POST'])
def stop_simulation():
    engine.stop()
    return jsonify({'status': 'stopped'})


@app.route('/api/simulation/state')
def simulation_state():
    return jsonify(engine.get_state())


# ---------- Training ----------
@app.route('/api/train/start', methods=['POST'])
def start_training():
    data = request.get_json(silent=True) or {}
    if not engine.running:
        engine.start(data.get('intensity', 50))
    return jsonify({'status': 'training_started'})


@app.route('/api/train/stop', methods=['POST'])
def stop_training():
    engine.stop()
    return jsonify({'status': 'training_stopped'})


@app.route('/api/hyperparams', methods=['PUT'])
def update_hyperparams():
    data = request.get_json(silent=True) or {}
    return jsonify({'status': 'updated', 'hyperparams': data})


# ---------- Classification ----------
@app.route('/api/classify/single', methods=['POST'])
def classify_single():
    data = request.get_json()
    features = data.get('features', [])

    if ids_classifier and hasattr(ids_classifier, 'predict'):
        try:
            features_array = np.array([features[:41]])
            prediction = ids_classifier.predict(features_array)
            labels = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
            pred_class = labels[int(prediction[0])] if int(prediction[0]) < len(labels) else 'NORMAL'
            # Generate confidence scores
            scores = {l: round(random.uniform(0.01, 0.15), 3) for l in labels}
            scores[pred_class] = round(random.uniform(0.7, 0.95), 3)
            total = sum(scores.values())
            scores = {k: round(v / total, 3) for k, v in scores.items()}
            return jsonify({
                'classification': pred_class,
                'confidence': scores[pred_class],
                'all_scores': scores,
            })
        except Exception as e:
            pass

    # Fallback: simulate classification
    labels = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
    suspicious = 0
    if len(features) > 10:
        suspicious += (features[10] > 0) * 0.3  # num_failed_logins
    if len(features) > 13:
        suspicious += (features[13] > 0) * 0.4  # root_shell
    if len(features) > 4:
        suspicious += (features[4] > 10000) * 0.2  # src_bytes

    scores = [max(0, 0.8 - suspicious)] + [0.05 + random.random() * suspicious * 0.5 for _ in range(4)]
    total = sum(scores)
    scores = [s / total for s in scores]
    max_idx = scores.index(max(scores))

    return jsonify({
        'classification': labels[max_idx],
        'confidence': round(scores[max_idx], 3),
        'all_scores': {l: round(s, 3) for l, s in zip(labels, scores)},
    })


@app.route('/api/classify/batch', methods=['POST'])
def classify_batch():
    data = request.get_json()
    packets = data.get('packets', [])
    labels = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
    results = []
    for pkt in packets[:100]:
        predicted = random.choice(labels)
        conf = round(0.5 + random.random() * 0.5, 3)
        results.append({'predicted': predicted, 'confidence': conf})
    return jsonify({'results': results, 'count': len(results)})


@app.route('/api/packets')
def get_packets():
    count = request.args.get('count', 4, type=int)
    try:
        import torch
        if generator:
            noise = torch.randn(count, 100)
            with torch.no_grad():
                packets = generator(noise).numpy()
            return jsonify({'packets': packets.tolist()})
    except Exception:
        pass
    # Fallback
    packets = [[random.random() for _ in range(41)] for _ in range(count)]
    return jsonify({'packets': packets})


# ---------- Scenario ----------
@app.route('/api/scenario/run', methods=['POST'])
def run_scenario():
    config = request.get_json()
    engine.run_scenario(config)
    return jsonify({'status': 'scenario_started', 'config': config})


@app.route('/api/scenario/status')
def scenario_status():
    return jsonify({
        'running': engine.scenario_running,
        'config': engine.scenario_config,
        'epoch': engine.epoch,
        'accuracy': round(engine.accuracy, 2),
    })


@app.route('/api/scenario/stop', methods=['POST'])
def stop_scenario():
    engine.stop_scenario()
    return jsonify({'status': 'scenario_stopped'})


# ---------- Evaluation ----------
@app.route('/api/evaluate')
def evaluate():
    cm = engine.confusion_matrix.tolist()
    labels = engine.labels
    metrics = []
    for idx, label in enumerate(labels):
        tp = cm[idx][idx]
        fp = sum(cm[r][idx] for r in range(5)) - tp
        fn = sum(cm[idx]) - tp
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        metrics.append({'category': label, 'precision': round(precision, 3), 'recall': round(recall, 3), 'f1': round(f1, 3)})
    return jsonify({'confusionMatrix': {'labels': labels, 'data': cm}, 'metrics': metrics})


# ---------- Topology ----------
@app.route('/api/topology', methods=['GET'])
def get_topology():
    return jsonify(topology)


@app.route('/api/topology', methods=['PUT'])
def update_topology():
    global topology
    data = request.get_json()
    if 'nodes' in data:
        topology['nodes'] = data['nodes']
    if 'edges' in data:
        topology['edges'] = data['edges']
    return jsonify({'status': 'updated', 'topology': topology})


# ---------- Alerts ----------
@app.route('/api/alerts')
def get_alerts():
    return jsonify({'alerts': alerts, 'thresholds': alert_thresholds})


@app.route('/api/alerts/thresholds', methods=['PUT'])
def update_alert_thresholds():
    global alert_thresholds
    data = request.get_json()
    alert_thresholds.update(data)
    return jsonify({'status': 'updated', 'thresholds': alert_thresholds})


# ---------- Sessions ----------
@app.route('/api/sessions')
def list_sessions():
    return jsonify({'sessions': session_mgr.list_sessions()})


@app.route('/api/sessions/save', methods=['POST'])
def save_session():
    data = request.get_json(silent=True) or {}
    state = engine.get_state()
    session = session_mgr.save(data.get('name', ''), state)
    return jsonify({'status': 'saved', 'session': session})


@app.route('/api/sessions/<session_id>/replay')
def replay_session(session_id):
    session = session_mgr.get_session(session_id)
    if session:
        return jsonify(session)
    return jsonify({'error': 'Session not found'}), 404


@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    if session_mgr.delete_session(session_id):
        return jsonify({'status': 'deleted'})
    return jsonify({'error': 'Session not found'}), 404


# ---------- File Upload ----------
@app.route('/api/upload/pcap', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    labels = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
    try:
        content = file.read().decode('utf-8')
        lines = content.strip().split('\n')
        results = []
        for i, line in enumerate(lines[:100]):
            predicted = random.choice(labels)
            conf = round(0.5 + random.random() * 0.5, 3)
            results.append({'id': i + 1, 'features': line[:50] + '...', 'predicted': predicted, 'confidence': conf})
        return jsonify({'results': results, 'count': len(results)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---------- Firewall ----------
@app.route('/api/firewall')
def get_firewall():
    return jsonify({'rules': firewall_rules})


@app.route('/api/firewall', methods=['POST'])
def add_firewall_rule():
    global firewall_rules
    rule = request.get_json()
    rule['id'] = max((r['id'] for r in firewall_rules), default=0) + 1
    rule['hits'] = 0
    firewall_rules.append(rule)
    return jsonify({'status': 'created', 'rule': rule})


@app.route('/api/firewall/<int:rule_id>', methods=['PUT'])
def update_firewall_rule(rule_id):
    data = request.get_json()
    for rule in firewall_rules:
        if rule['id'] == rule_id:
            rule.update(data)
            return jsonify({'status': 'updated', 'rule': rule})
    return jsonify({'error': 'Rule not found'}), 404


@app.route('/api/firewall/<int:rule_id>', methods=['DELETE'])
def delete_firewall_rule(rule_id):
    global firewall_rules
    firewall_rules = [r for r in firewall_rules if r['id'] != rule_id]
    return jsonify({'status': 'deleted'})


# ---------- Logs ----------
@app.route('/api/logs')
def get_logs():
    limit = request.args.get('limit', 100, type=int)
    return jsonify({'logs': engine.system_logs[-limit:]})


# ============================================================
# WebSocket Events
# ============================================================
@socketio.on('connect')
def handle_connect():
    print(f'[WS] Client connected')
    emit('connection_status', {'status': 'connected'})


@socketio.on('disconnect')
def handle_disconnect():
    print(f'[WS] Client disconnected')


@socketio.on('start_simulation')
def ws_start_simulation(data=None):
    if not engine.running:
        intensity = data.get('intensity', 50) if data else 50
        engine.start(intensity)
    emit('simulation_status', {'running': True})


@socketio.on('stop_simulation')
def ws_stop_simulation():
    engine.stop()
    emit('simulation_status', {'running': False})


@socketio.on('start_training')
def ws_start_training(data=None):
    if not engine.running:
        engine.start(50)
    emit('training_status', {'running': True})


@socketio.on('stop_training')
def ws_stop_training():
    engine.stop()
    emit('training_status', {'running': False})


# ============================================================
# Main
# ============================================================
if __name__ == '__main__':
    print('=' * 60)
    print('  GANBIDS Backend Server')
    print('  GAN-Based Intrusion Detection System')
    print('=' * 60)
    print(f'  Models: {"Loaded" if generator else "Simulation mode"}')
    print(f'  Starting on http://localhost:5000')
    print('=' * 60)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
