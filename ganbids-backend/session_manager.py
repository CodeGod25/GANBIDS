"""
GANBIDS — Session Manager
Save/load/replay simulation sessions using JSON files.
"""
import os
import json
import time
from datetime import datetime


SESSION_DIR = os.path.join(os.path.dirname(__file__), 'sessions')


class SessionManager:
    def __init__(self):
        os.makedirs(SESSION_DIR, exist_ok=True)

    def save(self, name, state):
        """Save a simulation snapshot."""
        session = {
            'id': str(int(time.time() * 1000)),
            'name': name or f'Session {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}',
            'timestamp': datetime.now().isoformat(),
            'epoch': state.get('epoch', 0),
            'accuracy': state.get('accuracy', 0),
            'packetsGenerated': state.get('packetsGenerated', 0),
            'packetsBlocked': state.get('packetsBlocked', 0),
            'intensity': state.get('intensity', 50),
            'confusionMatrix': state.get('confusionMatrix', {}),
            'lossHistory': state.get('lossHistory', {}),
        }
        filepath = os.path.join(SESSION_DIR, f'{session["id"]}.json')
        with open(filepath, 'w') as f:
            json.dump(session, f, indent=2)
        return session

    def list_sessions(self):
        """List all saved sessions (metadata only)."""
        sessions = []
        for fname in sorted(os.listdir(SESSION_DIR), reverse=True):
            if fname.endswith('.json'):
                try:
                    with open(os.path.join(SESSION_DIR, fname)) as f:
                        data = json.load(f)
                    sessions.append({
                        'id': data.get('id', fname.replace('.json', '')),
                        'name': data.get('name', 'Unnamed'),
                        'timestamp': data.get('timestamp', ''),
                        'epoch': data.get('epoch', 0),
                        'accuracy': data.get('accuracy', 0),
                        'packetsGenerated': data.get('packetsGenerated', 0),
                    })
                except Exception:
                    pass
        return sessions

    def get_session(self, session_id):
        """Get full session data for replay."""
        filepath = os.path.join(SESSION_DIR, f'{session_id}.json')
        if os.path.exists(filepath):
            with open(filepath) as f:
                return json.load(f)
        return None

    def delete_session(self, session_id):
        """Delete a session."""
        filepath = os.path.join(SESSION_DIR, f'{session_id}.json')
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False
