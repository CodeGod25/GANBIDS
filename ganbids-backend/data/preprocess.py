import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
import os

class NSLKDDPreprocessor:
    """Preprocessor for NSL-KDD dataset"""
    
    # NSL-KDD features
    FEATURE_NAMES = [
        'duration', 'protocol_type', 'service', 'flag',
        'src_bytes', 'dst_bytes', 'land', 'wrong_fragment',
        'urgent', 'hot', 'num_failed_logins', 'logged_in',
        'num_compromised', 'root_shell', 'su_attempted', 'num_root',
        'num_file_creations', 'num_shells', 'num_access_files',
        'num_outbound_cmds', 'is_host_login', 'is_guest_login',
        'count', 'srv_count', 'serror_rate', 'srv_serror_rate',
        'rerror_rate', 'srv_rerror_rate', 'same_srv_rate',
        'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count',
        'dst_host_srv_count', 'dst_host_same_srv_rate',
        'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
        'dst_host_srv_diff_host_rate', 'dst_host_serror_rate',
        'dst_host_srv_serror_rate', 'dst_host_rerror_rate',
        'dst_host_srv_rerror_rate', 'attack_type'
    ]
    
    CATEGORICAL_FEATURES = ['protocol_type', 'service', 'flag']
    LABEL_ENCODERS = {}
    
    def __init__(self, data_path='data/nsl_kdd'):
        self.data_path = data_path
    
    def load_train_data(self):
        """Load and preprocess NSL-KDD training data"""
        # For now, return synthetic data that mimics NSL-KDD structure
        n_samples = 10000
        n_features = 41 - 1  # Excluding label
        
        X = np.random.randn(n_samples, n_features).astype(np.float32)
        
        # Create more realistic ranges for features
        X[:, 0] = np.random.exponential(scale=10, size=n_samples)  # duration
        X[:, 4] = np.abs(X[:, 4]) * 10000  # src_bytes
        X[:, 5] = np.abs(X[:, 5]) * 10000  # dst_bytes
        
        # Normalize
        X = (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0) + 1e-8)
        
        # Create labels: NORMAL, DDOS, PROBE, R2L, U2R
        y = np.random.choice(['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R'], size=n_samples)
        
        return X, y
    
    def load_test_data(self):
        """Load and preprocess NSL-KDD test data"""
        n_samples = 2000
        n_features = 41 - 1
        
        X = np.random.randn(n_samples, n_features).astype(np.float32)
        X = (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0) + 1e-8)
        y = np.random.choice(['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R'], size=n_samples)
        
        return X, y
    
    def load_raw_data(self, filepath):
        """Load raw NSL-KDD CSV file"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f'Dataset not found at {filepath}')
        
        df = pd.read_csv(filepath, names=self.FEATURE_NAMES, header=None)
        return df
    
    def preprocess(self, df):
        """Preprocess dataframe"""
        # Separate features and labels
        X = df.drop('attack_type', axis=1)
        y = df['attack_type']
        
        # Encode categorical features
        for col in self.CATEGORICAL_FEATURES:
            if col not in self.LABEL_ENCODERS:
                self.LABEL_ENCODERS[col] = LabelEncoder()
                X[col] = self.LABEL_ENCODERS[col].fit_transform(X[col])
            else:
                X[col] = self.LABEL_ENCODERS[col].transform(X[col])
        
        # Normalize numerical features
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        return X_scaled, y
    
    def generate_synthetic_batch(self, n_samples=128):
        """Generate synthetic batch of NSL-KDD-like data"""
        X = np.random.randn(n_samples, 40).astype(np.float32)
        X = (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0) + 1e-8)
        return X
