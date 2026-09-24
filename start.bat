@echo off
REM AI Eye Care System - Quick Start Script for Windows

echo ============================================================
echo   AI Eye Care System - Smart Eye Disease Detection
echo ============================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Install Python dependencies
echo Installing Python dependencies...
cd /d "%~dp0models"
set "PYTHON=%~dp0.venv\Scripts\python.exe"
if not exist "%PYTHON%" set "PYTHON=python"
"%PYTHON%" -m pip install -q -r requirements.txt 2>nul
if errorlevel 1 (
    echo WARNING: Some packages may not have installed correctly
)

echo.
echo ============================================================
echo   Starting Services...
echo ============================================================
echo.

REM Start ML Server in background
echo [1/3] Starting ML Server on port 5001...
start "AI Eye Care - ML Server" cmd /k "cd /d %~dp0models && \"%PYTHON%\" ml_server.py"

REM Wait for ML server to start
timeout /t 5 /nobreak >nul

REM Start Backend
echo [2/3] Starting Backend on port 5000...
cd /d "%~dp0backend"
call npm install 2>nul
start "AI Eye Care - Backend" cmd /k "npm run dev"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [3/3] Starting Frontend on port 3000...
cd /d "%~dp0frontend"
call npm install 2>nul
start "AI Eye Care - Frontend" cmd /k "npm run dev -- --host 127.0.0.1"

echo.
echo ============================================================
echo   All Services Started!
echo ============================================================
echo.
echo   ML Server:  http://localhost:5001
echo   Backend:    http://localhost:5000
echo   Frontend:   http://localhost:3000
echo.
echo   The servers are running in their own windows.
echo.
pause >nul