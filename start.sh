#!/bin/bash

# AI Eye Care System - Quick Start Script for Linux/Mac

echo "============================================================"
echo "  AI Eye Care System - Smart Eye Disease Detection"
echo "============================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
cd models
pip3 install -q torch torchvision fastapi uvicorn Pillow numpy opencv-python 2>/dev/null

echo ""
echo "============================================================"
echo "  Starting Services..."
echo "============================================================"
echo ""

# Start ML Server in background
echo "[1/2] Starting ML Server on port 5001..."
python3 ml_server.py &
ML_PID=$!

# Wait for ML server to start
sleep 5

# Start Backend
echo "[2/2] Starting Backend on port 5000..."
cd ../backend
npm install 2>/dev/null
npm run dev &
BACKEND_PID=$!

sleep 3

echo ""
echo "============================================================"
echo "  All Services Started!"
echo "============================================================"
echo ""
echo "  ML Server:  http://localhost:5001"
echo "  Backend:    http://localhost:5000"
echo "  Frontend:   http://localhost:3000 (run manually)"
echo ""
echo "  To start the frontend:"
echo "    cd frontend && npm install && npm run dev"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "============================================================"

# Handle Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $ML_PID $BACKEND_PID 2>/dev/null; echo 'Goodbye!'; exit" SIGINT

# Keep running
wait