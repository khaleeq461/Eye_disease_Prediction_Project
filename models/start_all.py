#!/usr/bin/env python3
"""
AI Eye Care - Startup Script
Starts both the ML Server and Node.js Backend
"""

import os
import sys
import subprocess
import time
import signal

def print_banner():
    print("=" * 60)
    print("  AI Eye Care System - Smart Eye Disease Detection")
    print("=" * 60)
    print()

def check_python_version():
    if sys.version_info[0] < 3 or (sys.version_info[0] == 3 and sys.version_info[1] < 8):
        print("❌ Python 3.8 or higher is required")
        print(f"   Current version: {sys.version_info[0]}.{sys.version_info[1]}")
        return False
    return True

def install_requirements():
    """Install Python requirements if needed"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        print("✅ Python dependencies installed\n")
        return True
    except subprocess.CalledProcessError:
        print("⚠️  Some packages failed to install. Continuing anyway...\n")
        return True

def start_ml_server():
    """Start the ML inference server"""
    print("🚀 Starting ML Server (port 5001)...")
    
    # Check if models exist
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "binary_FINAL.pth")
    if not os.path.exists(model_path):
        print(f"⚠️  Warning: Model file not found at {model_path}")
        print("   ML predictions may not work properly")
    
    try:
        # Start ML server
        ml_process = subprocess.Popen(
            [sys.executable, "ml_server.py"],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        # Wait for ML server to start
        time.sleep(3)
        
        # Check if process is running
        if ml_process.poll() is None:
            print("✅ ML Server started on http://localhost:5001")
            return ml_process
        else:
            print("❌ ML Server failed to start")
            return None
            
    except Exception as e:
        print(f"❌ Error starting ML server: {e}")
        return None

def start_backend():
    """Start the Node.js backend"""
    print("\n🚀 Starting Backend Server (port 5000)...")
    
    backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
    
    try:
        # Install npm dependencies if needed
        print("📦 Checking npm dependencies...")
        npm_install = subprocess.run(
            ["npm", "install"],
            cwd=backend_dir,
            capture_output=True,
            text=True
        )
        
        # Start backend
        backend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        # Wait for backend to start
        time.sleep(3)
        
        if backend_process.poll() is None:
            print("✅ Backend started on http://localhost:5000")
            return backend_process
        else:
            print("❌ Backend failed to start")
            return None
            
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return None

def main():
    print_banner()
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install requirements
    install_requirements()
    
    # Track processes
    ml_process = None
    backend_process = None
    
    try:
        # Start ML Server
        ml_process = start_ml_server()
        
        # Start Backend
        backend_process = start_backend()
        
        print("\n" + "=" * 60)
        print("  All services started successfully!")
        print("=" * 60)
        print()
        print("  🌐 Frontend (React):     http://localhost:3000")
        print("  🔧 Backend (Node.js):    http://localhost:5000")
        print("  🤖 ML Server (Python):   http://localhost:5001")
        print()
        print("  Press Ctrl+C to stop all services")
        print("=" * 60)
        print()
        
        # Wait for processes
        while True:
            time.sleep(1)
            
            # Check if processes are still running
            if ml_process and ml_process.poll() is not None:
                print("\n⚠️  ML Server stopped unexpectedly")
                break
                
            if backend_process and backend_process.poll() is not None:
                print("\n⚠️  Backend stopped unexpectedly")
                break
                
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down services...")
    finally:
        # Cleanup
        if ml_process:
            ml_process.terminate()
            print("✅ ML Server stopped")
        if backend_process:
            backend_process.terminate()
            print("✅ Backend stopped")
        
        print("\n👋 Goodbye!")

if __name__ == "__main__":
    main()