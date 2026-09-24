# 🚀 Free Deployment Guide: AI Eye Care System

This guide explains how to deploy the entire project **100% Free** using modern cloud platforms.

---

## 🏗️ Architecture Overview (100% Free Tier)

| Service | Platform | Free Specs | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | 512 MB Storage (M0 Free Tier) | Store users, diagnosis records, reviews |
| **ML Server** | [Hugging Face Spaces](https://huggingface.co/spaces) OR [Render](https://render.com) | 16 GB RAM (HF) / 512 MB (Render) | PyTorch EfficientNet inference & Grad-CAM |
| **Backend API** | [Render.com](https://render.com) | 512 MB RAM, HTTPS included | Node.js Express REST API & Report Generator |
| **Frontend** | [Vercel](https://vercel.com) | Global Edge CDN, HTTPS | React + Vite Single Page Application |

---

## Step 1: Push Your Code to GitHub

1. Initialize Git and commit the project (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Production ready for deployment"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```
*(Note: Model files `binary_FINAL.pth` and `disease_FINAL.pth` are ~43MB each, safely under GitHub's 100MB limit).*

---

## Step 2: Setup Free Cloud Database (MongoDB Atlas)

1. Sign up for free at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Shared / M0 (Free)** cluster.
3. Under **Database Access**:
   - Create a database user (e.g., username: `eyecare_admin`, password: `<your_password>`).
4. Under **Network Access**:
   - Add IP Address: `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** -> **Drivers** -> Copy the connection string:
   ```
   mongodb+srv://eyecare_admin:<your_password>@cluster0.xxxxx.mongodb.net/ai_eye_care?retryWrites=true&w=majority
   ```
   *(Keep this string handy for Step 4).*

---

## Step 3: Deploy the ML Inference Server (Hugging Face Spaces - Recommended)

Because PyTorch models require good RAM, **Hugging Face Spaces** gives **16 GB RAM for free**:

1. Go to [huggingface.co](https://huggingface.co) and sign in.
2. Click **New Space** -> Choose:
   - Space Name: `retinal-disease-ml`
   - License: `mit`
   - Space SDK: **Docker** -> **Blank**
   - Hardware: **CPU Basic (Free - 2 vCPU, 16 GB RAM)**
3. In the new space, upload or push files from your `models/` directory:
   - `Dockerfile`
   - `ml_server.py`
   - `binary_FINAL.pth`
   - `disease_FINAL.pth`
4. Hugging Face will automatically build and start the Docker container.
5. Once running, copy your Space URL (e.g., `https://<your-username>-retinal-disease-ml.hf.space`).

*(Alternative on Render: Create a New Web Service pointing to `models/` with Python environment or Docker).*

---

## Step 4: Deploy the Node.js Backend API (Render.com)

1. Sign in to [render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `eyecare-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `<Your MongoDB Atlas connection string from Step 2>`
   - `ML_SERVER_URL`: `<Your ML Server URL from Step 3>`
   - `JWT_SECRET`: `<Any long random secret string>`
   - `CORS_ORIGIN`: `*`
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://eyecare-backend.onrender.com`).

---

## Step 5: Deploy the React Frontend (Vercel)

1. Sign in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** -> **Project**.
3. Select your repository.
4. In the configuration settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and choose `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - Key: `VITE_BACKEND_URL`
   - Value: `<Your Render Backend URL from Step 4>` (e.g. `https://eyecare-backend.onrender.com`)
6. Click **Deploy**.
7. Vercel will build and give you a live production URL (e.g., `https://your-eye-care.vercel.app`)!

---

## 🐳 Optional: 1-Command Local or Cloud VPS Deployment (Docker)

If you ever want to run the whole stack in Docker:
```bash
docker compose up -d --build
```
Everything (MongoDB, ML Server, Backend API, and Nginx-powered Frontend) will spin up automatically!
