import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
import numpy as np

class GANTrainer:
    """GAN Training Loop for synthetic attack generation"""
    
    def __init__(self, generator, discriminator, socketio=None, device=None, lr=0.0002, beta1=0.5):
        # Auto-detect device
        if device is None:
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        self.generator = generator.to(device)
        self.discriminator = discriminator.to(device)
        self.socketio = socketio
        self.device = device
        
        # Optimizers
        self.g_optimizer = optim.Adam(self.generator.parameters(), lr=lr, betas=(beta1, 0.999))
        self.d_optimizer = optim.Adam(self.discriminator.parameters(), lr=lr, betas=(beta1, 0.999))
        
        # Loss function
        self.criterion = nn.BCELoss()
        
        # Training metrics
        self.g_losses = []
        self.d_losses = []
    
    def train_epoch(self, train_data, batch_size=32):
        """Train one epoch - simplified version for background training"""
        # Create batches manually
        n_batches = max(1, len(train_data) // batch_size)
        g_losses_batch = []
        d_losses_batch = []
        
        for batch_idx in range(n_batches):
            start_idx = batch_idx * batch_size
            end_idx = min(start_idx + batch_size, len(train_data))
            
            real_data = torch.FloatTensor(train_data[start_idx:end_idx]).to(self.device)
            batch_size_actual = real_data.size(0)
            
            # Labels
            real_labels = torch.ones(batch_size_actual, 1).to(self.device)
            fake_labels = torch.zeros(batch_size_actual, 1).to(self.device)
            
            # ============= Train Discriminator =============
            self.d_optimizer.zero_grad()
            
            # Real samples
            d_real_output = self.discriminator(real_data)
            d_real_loss = self.criterion(d_real_output, real_labels)
            
            # Fake samples
            z = torch.randn(batch_size_actual, 100).to(self.device)
            fake_data = self.generator(z).detach()
            d_fake_output = self.discriminator(fake_data)
            d_fake_loss = self.criterion(d_fake_output, fake_labels)
            
            # Backprop
            d_loss = d_real_loss + d_fake_loss
            d_loss.backward()
            self.d_optimizer.step()
            
            # ============= Train Generator =============
            self.g_optimizer.zero_grad()
            
            z = torch.randn(batch_size_actual, 100).to(self.device)
            fake_data = self.generator(z)
            d_fake_output = self.discriminator(fake_data)
            
            # Generator tries to fool discriminator
            g_loss = self.criterion(d_fake_output, real_labels)
            g_loss.backward()
            self.g_optimizer.step()
            
            # Track losses
            g_losses_batch.append(g_loss.item())
            d_losses_batch.append(d_loss.item())
        
        avg_g_loss = np.mean(g_losses_batch) if g_losses_batch else 0.0
        avg_d_loss = np.mean(d_losses_batch) if d_losses_batch else 0.0
        
        self.g_losses.append(avg_g_loss)
        self.d_losses.append(avg_d_loss)
        
        return avg_g_loss, avg_d_loss
    
    def train(self, train_data, num_epochs=100, batch_size=32):
        """Train GAN"""
        print(f'Training GAN for {num_epochs} epochs on {len(train_data)} samples...')
        
        for epoch in range(num_epochs):
            g_loss, d_loss = self.train_epoch(train_data, batch_size)
            
            if (epoch + 1) % 10 == 0:
                print(f'Epoch [{epoch+1}/{num_epochs}] - G_Loss: {g_loss:.4f}, D_Loss: {d_loss:.4f}')
        
        print('✓ GAN training complete')
    
    def generate_samples(self, n_samples=128):
        """Generate synthetic samples"""
        z = torch.randn(n_samples, 100).to(self.device)
        with torch.no_grad():
            samples = self.generator(z).cpu().numpy()
        return samples
    
    def save_checkpoint(self, filepath):
        """Save generator and discriminator weights"""
        torch.save({
            'generator': self.generator.state_dict(),
            'discriminator': self.discriminator.state_dict(),
            'g_losses': self.g_losses,
            'd_losses': self.d_losses,
        }, filepath)
    
    def load_checkpoint(self, filepath):
        """Load generator and discriminator weights"""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.generator.load_state_dict(checkpoint['generator'])
        self.discriminator.load_state_dict(checkpoint['discriminator'])
        self.g_losses = checkpoint['g_losses']
        self.d_losses = checkpoint['d_losses']
