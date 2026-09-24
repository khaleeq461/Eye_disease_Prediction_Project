# How to Run the Project

This guide is for Windows PowerShell.

## 1. Start MongoDB First

Open **PowerShell as Administrator** and run:

```powershell
Start-Service MongoDB
```

Check that MongoDB is running:

```powershell
sc.exe query MongoDB
```

The service should show `STATE : 4 RUNNING`.

You can also open MongoDB Compass and connect to:

```text
mongodb://127.0.0.1:27017
```

The application uses this database:

```text
ai_eye_care
```

## 2. Install Dependencies Once

Run these commands from any PowerShell window:

```powershell
cd "D:\FYP\Explainable-retinal-disease-detection-main"

.\.venv\Scripts\python.exe -m pip install -r models\requirements.txt
npm.cmd install --prefix backend
npm.cmd install --prefix frontend
```

You do not need to repeat this on every startup unless dependencies change.

## 3. Start the ML Model Server

Open **Terminal 1** and run:

```powershell
cd "D:\FYP\Explainable-retinal-disease-detection-main"
.\.venv\Scripts\python.exe models\ml_server.py
```

Wait until the terminal displays that Uvicorn is running on port `5001` and both models are loaded.

ML server URL:

```text
http://127.0.0.1:5001
```

## 4. Start the Backend Server

Open **Terminal 2** and run:

```powershell
cd "D:\FYP\Explainable-retinal-disease-detection-main\backend"
npm.cmd run dev
```

Backend URL:

```text
http://127.0.0.1:5000
```

## 5. Start the Frontend

Open **Terminal 3** and run:

```powershell
cd "D:\FYP\Explainable-retinal-disease-detection-main\frontend"
npm.cmd run dev -- --host 127.0.0.1
```

Open the application in your browser:

```text
http://127.0.0.1:3000
```

## Correct Startup Order

Always start the services in this order:

1. MongoDB
2. ML model server
3. Backend server
4. Frontend server

## Check That Everything Is Working

Open this backend health URL:

```text
http://127.0.0.1:5000/api/health
```

A working response should include:

```json
{
  "status": "success",
  "mlServer": {
    "status": "online",
    "models_loaded": true
  }
}
```

## One-Command Startup

After dependencies are installed and MongoDB is running, you can also run this from the repository root:

```powershell
cd "D:\FYP\Explainable-retinal-disease-detection-main"
.\start.bat
```

This opens separate windows for the ML server, backend, and frontend.

## Start from VS Code Terminals

In VS Code, open four terminals with the `+` button or the split-terminal button. Run the following commands in order.

### Terminal 1: MongoDB

If MongoDB is already running, skip this terminal. Otherwise, start VS Code as Administrator and run:

```powershell
Start-Service MongoDB
```

### Terminal 2: ML Model Server

```powershell
cd "D:\FYP\Explainable-retinal-disease-detection-main"
.\.venv\Scripts\python.exe models\ml_server.py
```

Wait until both models are loaded and the server is running on port `5001`.

### Terminal 3: Backend Server

```powershell
cd "D:\FYP\Explainable-retinal-disease-detection-main\backend"
npm.cmd run dev
```

The backend runs on port `5000`.

### Terminal 4: Frontend

```powershell
cd "D:\FYP\Explainable-retinal-disease-detection-main\frontend"
npm.cmd run dev -- --host 127.0.0.1
```

Open the application at http://127.0.0.1:3000.

## Stop the Project

Close the three server terminal windows. To stop MongoDB from Administrator PowerShell:

```powershell
Stop-Service MongoDB
```

## Common PowerShell Issue

If `npm` is blocked by PowerShell execution policy, use `npm.cmd` exactly as shown in this guide.

If MongoDB is not running, start it from **PowerShell as Administrator** before starting the backend.
