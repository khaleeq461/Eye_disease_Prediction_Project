# AI Eye Care System - Backend

## Project Structure
```
backend/
├── src/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── controllers/      # Business logic
│   ├── middleware/       # Auth, file upload, etc.
│   ├── config/          # Database, config
│   └── app.js           # Express app entry
├── uploads/             # Uploaded images
├── .env                 # Environment variables
├── package.json
└── server.js
```

## Setup
```bash
cd backend
npm install
npm run dev
```

## MongoDB Schema

### User Schema
- name
- email
- password (hashed)
- role (patient/doctor/admin)
- createdAt, updatedAt

### Appointment Schema
- patientId (ref: User)
- doctorId (ref: User)
- date
- time
- status (scheduled/completed/cancelled)
- notes

### Report Schema
- patientId (ref: User)
- imageUrl
- prediction (normal/diabetes/glaucoma/cataract/myopia)
- confidence
- recommendations
- createdAt

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile

### Predictions
- POST /api/prediction/diagnose - Upload eye image and get diagnosis
- GET /api/prediction/history - Get user's prediction history
- GET /api/prediction/:id - Get specific prediction details

### Appointments
- POST /api/appointments
- GET /api/appointments
- PUT /api/appointments/:id
- DELETE /api/appointments/:id

### Reports
- GET /api/reports
- GET /api/reports/:id
- GET /api/reports/download/:id

## ML Pipeline Flow

### 1. Image Upload & Preprocessing
- Accept eye fundus images (PNG, JPG)
- Validate image format and size
- Preprocess image (resize to 300x300)

### 2. Binary Classification (Normal vs Disease)
- Load binary_FINAL.pth (EfficientNet-B3)
- Input: 300x300 RGB image
- Output: [normal_prob, disease_prob]

### 3. Disease Classification (if disease detected)
- Load disease_FINAL.pth (EfficientNet-B3)
- Classes: diabetes, glaucoma, cataract, myopia
- Output: disease class + confidence

### 4. Response Generation
```json
{
  "status": "success",
  "data": {
    "prediction": "glaucoma",
    "confidence": 0.92,
    "isNormal": false,
    "recommendations": [...],
    "gradcamUrl": "/uploads/heatmaps/xxx.png"
  }
}
```

## Environment Variables
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai_eye_care
JWT_SECRET=your_secret_key
MODEL_PATH=./models
UPLOAD_PATH=./uploads
```