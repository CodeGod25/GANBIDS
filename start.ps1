#!/usr/bin/env pwsh
# GANBIDS Quick Start Script for Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GANBIDS — GAN-Based IDS Dashboard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get user choice
Write-Host "Select startup mode:" -ForegroundColor Yellow
Write-Host "  1 = Frontend Only (Fast, uses mock data)" -ForegroundColor Green
Write-Host "  2 = Full Stack (Frontend + Backend ML)" -ForegroundColor Cyan
Write-Host ""
$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Starting Frontend Only..." -ForegroundColor Green
    Write-Host "Opening http://localhost:5173" -ForegroundColor Cyan
    Write-Host ""
    
    cd ganbids
    Start-Process http://localhost:5173
    npm run dev
}
elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "Starting Full Stack (Backend + Frontend)..." -ForegroundColor Green
    Write-Host ""
    
    # Check if Python is installed
    $pythonCheck = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Python not found! Please install Python 3.10+" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Python found: $pythonCheck" -ForegroundColor Green
    
    # Start backend
    Write-Host ""
    Write-Host "Backend starting on http://localhost:5000..." -ForegroundColor Cyan
    $backendProcess = Start-Process -FilePath "python" `
        -ArgumentList "app.py" `
        -WorkingDirectory "ganbids-backend" `
        -PassThru `
        -NoNewWindow
    
    Write-Host "Backend PID: $($backendProcess.Id)" -ForegroundColor Gray
    
    # Wait for backend to start
    Start-Sleep -Seconds 3
    
    # Start frontend
    Write-Host ""
    Write-Host "Frontend starting on http://localhost:5173..." -ForegroundColor Cyan
    Write-Host ""
    
    cd ganbids
    Start-Process http://localhost:5173
    npm run dev
}
else {
    Write-Host "Invalid choice!" -ForegroundColor Red
    exit 1
}
