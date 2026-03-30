# GANBIDS Backend Startup Script
Write-Host "🚀 Starting GANBIDS Backend (Flask + SocketIO)" -ForegroundColor Cyan

# Check Python
$pythonVersion = python --version 2>&1
Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green

# Install requirements
Write-Host "`n📦 Installing requirements..." -ForegroundColor Yellow
pip install -r requirements.txt

# Start backend
Write-Host "`n🔌 Starting backend on http://localhost:5000" -ForegroundColor Cyan
python app.py
