import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os

class IDSClassifier:
    """Intrusion Detection System using Random Forest"""
    def __init__(self, model_path='models/ids_classifier.pkl', scaler_path='models/scaler.pkl'):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.classes = ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R']
    
    def load_or_train(self, preprocessor=None):
        """Load existing model or train a new one"""
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            print('Loading pre-trained IDS classifier...')
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
        else:
            print('Training new IDS classifier...')
            self.train(preprocessor)
    
    def train(self, preprocessor=None):
        """Train IDS classifier on NSL-KDD data"""
        try:
            # Load and preprocess data
            if preprocessor is None:
                from data.preprocess import NSLKDDPreprocessor
                preprocessor = NSLKDDPreprocessor()
            
            X_train, y_train = preprocessor.load_train_data()
            
            # Fit scaler
            self.scaler.fit(X_train)
            X_train_scaled = self.scaler.transform(X_train)
            
            # Train Random Forest
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=15,
                n_jobs=-1,
                random_state=42
            )
            self.model.fit(X_train_scaled, y_train)
            
            # Save models
            os.makedirs('models', exist_ok=True)
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            
            print('✓ IDS classifier trained and saved')
        except Exception as e:
            print(f'✗ Error training IDS classifier: {e}')
    
    def predict(self, X):
        """Predict class for samples"""
        if self.model is None:
            raise ValueError('Model not initialized')
        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        return predictions
    
    def predict_proba(self, X):
        """Predict class probabilities"""
        if self.model is None:
            raise ValueError('Model not initialized')
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)
    
    def evaluate(self, X_test, y_test):
        """Evaluate classifier on test data"""
        from sklearn.metrics import classification_report, confusion_matrix
        
        X_scaled = self.scaler.transform(X_test)
        y_pred = self.model.predict(X_scaled)
        
        report = classification_report(y_test, y_pred, output_dict=True)
        cm = confusion_matrix(y_test, y_pred)
        
        return {
            'report': report,
            'confusion_matrix': cm.tolist(),
        }
