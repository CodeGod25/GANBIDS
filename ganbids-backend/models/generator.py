import torch
import torch.nn as nn

class Generator(nn.Module):
    """GAN Generator - Creates synthetic network traffic"""
    def __init__(self, input_size=100, output_size=41, hidden_size=256):
        super(Generator, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.ReLU(inplace=True),
            
            nn.Linear(hidden_size, hidden_size * 2),
            nn.BatchNorm1d(hidden_size * 2),
            nn.ReLU(inplace=True),
            
            nn.Linear(hidden_size * 2, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.ReLU(inplace=True),
            
            nn.Linear(hidden_size, output_size),
            nn.Tanh()  # Output in [-1, 1] range
        )
    
    def forward(self, z):
        """
        Generate synthetic samples
        z: noise vector of shape (batch_size, input_size)
        Returns: synthetic samples of shape (batch_size, output_size)
        """
        return self.model(z)

class Discriminator(nn.Module):
    """GAN Discriminator - Classifies real vs generated traffic"""
    def __init__(self, input_size=41, hidden_size=256):
        super(Discriminator, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Dropout(0.3),
            
            nn.Linear(hidden_size, hidden_size // 2),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Dropout(0.3),
            
            nn.Linear(hidden_size // 2, 1),
            nn.Sigmoid()  # Output probability [0, 1]
        )
    
    def forward(self, x):
        """
        Discriminate real vs fake samples
        x: samples of shape (batch_size, input_size)
        Returns: probability of being real of shape (batch_size, 1)
        """
        return self.model(x)
