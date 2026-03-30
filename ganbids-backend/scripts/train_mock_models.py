import os
import sys
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.generator import Generator, Discriminator
from models.ids_classifier import IDSClassifier

print("🚀 Starting GANBIDS Tier 4 Mock Training Pipeline...")

# Features: 41 dimensions (NSL-KDD format)
# Classes: ['NORMAL', 'DDOS', 'PROBE', 'R2L', 'U2R'] -> 0, 1, 2, 3, 4
num_samples = 5000
X = np.random.randn(num_samples, 41) * 2.5 # Mock feature spread
y = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.5, 0.2, 0.1, 0.1, 0.1])

print("📦 Generated 5,000 synthetic 41-dimensional NSL-KDD vectors.")

# 1. Train Random Forest IDS & Scaler
print("🧠 Training Random Forest IDS Classifier...")
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

rf = RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42)
rf.fit(X_scaled, y)

os.makedirs('models', exist_ok=True)
joblib.dump(scaler, 'models/scaler.pkl')
joblib.dump(rf, 'models/ids_classifier.pkl')
print("✅ Saved models/scaler.pkl & models/ids_classifier.pkl")

# 2. Train PyTorch GAN
print("🔥 Initializing PyTorch GAN...")
generator = Generator(input_size=100, output_size=41)
discriminator = Discriminator(input_size=41)

criterion = nn.BCELoss()
g_optimizer = optim.Adam(generator.parameters(), lr=0.0002)
d_optimizer = optim.Adam(discriminator.parameters(), lr=0.0002)

epochs = 10
batch_size = 64
X_tensor = torch.FloatTensor(X_scaled) # Train GAN on scaled data
dataset = torch.utils.data.TensorDataset(X_tensor)
dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

print("⚡ Running PyTorch GAN Training Loop (10 Epochs)...")
for epoch in range(epochs):
    g_loss_avg = 0
    d_loss_avg = 0
    
    for batch in dataloader:
        real_data = batch[0]
        cur_batch_size = real_data.size(0)
        
        # Train Discriminator
        d_optimizer.zero_grad()
        real_labels = torch.ones(cur_batch_size, 1)
        fake_labels = torch.zeros(cur_batch_size, 1)
        
        d_real_loss = criterion(discriminator(real_data), real_labels)
        
        z = torch.randn(cur_batch_size, 100)
        fake_data = generator(z)
        d_fake_loss = criterion(discriminator(fake_data.detach()), fake_labels)
        
        d_loss = d_real_loss + d_fake_loss
        d_loss.backward()
        d_optimizer.step()
        
        # Train Generator
        g_optimizer.zero_grad()
        z = torch.randn(cur_batch_size, 100)
        fake_data = generator(z)
        
        g_loss = criterion(discriminator(fake_data), real_labels)
        g_loss.backward()
        g_optimizer.step()
        
        g_loss_avg += g_loss.item()
        d_loss_avg += d_loss.item()
        
    print(f"Epoch {epoch+1}/{epochs} - D Loss: {d_loss_avg/len(dataloader):.4f} - G Loss: {g_loss_avg/len(dataloader):.4f}")

# Save PyTorch models
torch.save(generator.state_dict(), 'models/gan_generator.pth')
torch.save(discriminator.state_dict(), 'models/gan_discriminator.pth')
print("✅ Saved models/gan_generator.pth & models/gan_discriminator.pth")

print("✨ Pipeline Complete! Tier 4 ML Backend is ready for Live Dashboard Inference.")
