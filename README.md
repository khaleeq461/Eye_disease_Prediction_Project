# Explainable Retinal Disease Detection System

## Overview

This project implements an AI-powered system for detecting and diagnosing retinal diseases from eye fundus images. The system uses a two-stage machine learning pipeline to identify diseases like diabetes, glaucoma, cataracts, and myopia. Beyond just making predictions, the system provides explainability through visual heatmaps that highlight which parts of the eye image the AI focused on to make its diagnosis.

### Key Features

- **Automated Disease Detection**: Analyzes fundus images to detect abnormalities
- **Explainable AI**: Generates heatmaps showing where the model focused for its decision
- **User-Friendly Interface**: Web-based application for doctors and patients
- **Appointment Management**: Integrated scheduling system for patient consultations
- **Secure Authentication**: Role-based access (Patient, Doctor, Admin)
- **Real-time Predictions**: Fast inference using optimized ML models

---

## System Architecture

The application is built as a distributed system with three main components:

### 1. Frontend (React + Vite)
- Modern, responsive web interface
- Real-time image upload and prediction display
- Patient dashboard and appointment booking
- Doctor review interface

### 2. Backend (Node.js + Express)
- RESTful API for all operations
- User authentication and authorization
- Appointment and report management
- MongoDB database integration
- File upload handling

### 3. ML Server (Python + FastAPI)
- Deep learning inference engine
- Two-stage hierarchical classification
- Heatmap generation for explainability
- CUDA support for GPU acceleration

---

## How It Works

### The Two-Stage Pipeline

**Stage 1: Binary Classification**
- Determines if the eye fundus image is normal or diseased
- Model: EfficientNet-B3 (binary_FINAL.pth)
- If disease is detected, proceeds to Stage 2

**Stage 2: Disease Classification**
- Identifies the specific disease type
- Model: EfficientNet-B3 (disease_FINAL.pth)
- Outputs probabilities for: Diabetes, Glaucoma, Cataract, Myopia

**Confidence Threshold**: Predictions below 70% are flagged for doctor review

### Disease Classes

| Disease | Medical Term | Description |
|---------|-------------|-------------|
| Diabetes | Diabetic Retinopathy | Blood vessel damage in the retina due to diabetes |
| Glaucoma | Glaucoma | Increased eye pressure damaging the optic nerve |
| Cataract | Cataract | Clouding of the eye lens |
| Myopia | Myopia | Nearsightedness/refractive error |
| Normal | Healthy | No signs of disease detected |

---

## Installation & Setup

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- MongoDB (local or remote)
- CUDA 11.8+ (optional, for GPU acceleration)

### Quick Start (Recommended)

The easiest way to get everything running:

```bash
# Navigate to the models directory
cd models

# Run the startup script (handles all setup)
python start_all.py
```

This will automatically:
1. Install Python dependencies
2. Start the ML Server (Port 5001)
3. Install Node.js dependencies for backend
4. Start the Backend Server (Port 5000)
5. Display instructions for starting the frontend

### Manual Setup

If you prefer to start each component separately:

**Terminal 1: Start ML Server**
```bash
cd models
pip install -r requirements.txt
python ml_server.py
# ML Server will be running on http://localhost:5001
```

**Terminal 2: Start Backend**
```bash
cd backend
npm install
npm run dev
# Backend will be running on http://localhost:5000
```

**Terminal 3: Start Frontend**
```bash
cd frontend
npm install
npm run dev
# Frontend will be running on http://localhost:3000
```

Once all three are running, open your browser to: **http://localhost:3000**

---

## Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/ai_eye_care

# Authentication
JWT_SECRET=your_secure_secret_key_here

# ML Server Connection
ML_SERVER_URL=http://localhost:5001

# CORS (for local development)
CORS_ORIGIN=http://localhost:3000
```

### Database Setup

MongoDB will be automatically used. For local development, ensure MongoDB is running:

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

---

## Project Structure

```
FYP/
├── frontend/                          # React web interface
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Application pages
│   │   ├── store/                    # State management (Zustand)
│   │   ├── config.js                 # API configuration
│   │   └── App.jsx                   # Main app component
│   ├── package.json
│   └── vite.config.js
│
├── backend/                           # Node.js API server
│   ├── src/
│   │   ├── models/                   # MongoDB schemas
│   │   ├── routes/                   # API endpoints
│   │   ├── middleware/               # Auth, upload handlers
│   │   └── services/                 # Business logic
│   ├── uploads/                      # Uploaded images & reports
│   ├── package.json
│   └── server.js                     # Entry point
│
├── models/                            # ML components
│   ├── binary_FINAL.pth              # Binary classification model
│   ├── disease_FINAL.pth             # Disease classification model
│   ├── ml_server.py                  # FastAPI server
│   ├── requirements.txt              # Python dependencies
│   └── start_all.py                  # Automated startup script
│
├── dataset/                           # Training dataset (not included)
│   ├── train/
│   ├── val/
│   └── test/
│
└── README.md                          # This file
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Predictions
- `POST /api/prediction/predict` - Upload image for diagnosis
- `GET /api/prediction/history` - Get prediction history
- `GET /api/prediction/:id` - Get specific prediction details

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - List appointments
- `PUT /api/appointments/:id` - Update appointment

### Reports
- `GET /api/reports` - Download medical reports

### ML Server
- `GET /health` - Check if ML models are loaded
- `POST /predict` - Send image for prediction (multipart/form-data)
- `POST /predict-base64` - Send base64 encoded image

---

## Usage Guide

### For Patients

1. **Register/Login** - Create an account or sign in
2. **Upload Eye Image** - Take a fundus photo or upload existing image
3. **Get Diagnosis** - AI analyzes and provides results
4. **View Report** - Download detailed report with recommendations
5. **Book Appointment** - Schedule consultation with a doctor
6. **Track History** - View all previous diagnoses and reports

### For Doctors

1. **Login** - Access doctor dashboard
2. **Review Cases** - Review patient submissions and low-confidence predictions
3. **Manage Appointments** - Schedule and track consultations
4. **Generate Reports** - Create detailed medical reports

### For Administrators

1. **User Management** - Manage doctors and patients
2. **System Monitoring** - View system health and usage statistics
3. **Report Generation** - Access comprehensive system reports

---

## Model Details

### Architecture

Both binary and disease classification models use **EfficientNet-B3**:

- **Input Size**: 300×300 RGB fundus images
- **Architecture**: EfficientNet-B3 with custom classifier head
- **Dropout**: 0.4 for regularization
- **Normalization**: ImageNet standard (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])

### Training Approach

- **Transfer Learning**: Used pre-trained weights as starting point
- **Phase 1**: Frozen backbone (5 epochs) + training classifier
- **Phase 2**: Fine-tuning entire network (20 epochs)
- **Optimization**: Adam optimizer with learning rate decay
- **Data Augmentation**: Rotation, flipping, brightness/contrast adjustment

### Explainability

The system generates heatmaps using Grad-CAM (Gradient-weighted Class Activation Mapping) to show which regions of the eye image the model considered important for its prediction. This builds trust and allows doctors to verify the AI's reasoning.

---

## Troubleshooting

### ML Server Issues

**Error: "No module named 'torch'"**
```bash
pip install torch torchvision
```

**Error: "Models not found"**
- Ensure `binary_FINAL.pth` and `disease_FINAL.pth` are in the `models/` directory
- Check file sizes (should be ~200MB each)

**Error: "CUDA out of memory"**
- The system will automatically fall back to CPU
- Reduce batch size in ml_server.py if needed

**ML Server not responding**
```bash
# Check if it's running
curl http://localhost:5001/health
```

### Backend Issues

**Error: "MongoDB connection failed"**
- Ensure MongoDB is running on localhost:27017
- Check `MONGO_URI` in `.env` file
- Verify MongoDB is installed

**Error: "Port 5000 already in use"**
```bash
# Kill process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Frontend Issues

**Error: "Cannot reach backend"**
- Ensure backend is running on port 5000
- Check `config.js` for correct API URL
- Check CORS settings in backend

**Vite compilation error**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Dependencies

### Frontend
- React 18.2+
- Vite (build tool)
- React Router (navigation)
- Zustand (state management)
- Tailwind CSS (styling)
- Axios (HTTP client)

### Backend
- Express.js (web framework)
- Mongoose (MongoDB ODM)
- JWT (authentication)
- Multer (file upload)
- Helmet (security)

### ML Server
- PyTorch 2.0+
- FastAPI (web framework)
- Pillow (image processing)
- OpenCV (computer vision)
- pytorch-grad-cam (explainability)

---

## Performance Optimization

### Inference Speed
- Binary classification: ~100-200ms per image
- Disease classification: ~100-200ms per image
- Total time with both stages: ~400-500ms

### GPU Acceleration
The system automatically detects and uses CUDA if available:
- Inference is ~3-5x faster with GPU
- Recommended: NVIDIA GPU with 2GB+ VRAM

### Production Deployment
- Use GPU instances for better performance
- Implement caching for repeated predictions
- Use load balancing for multiple inference servers
- Monitor system health regularly

---

## Data Privacy & Security

- All user passwords are hashed using bcryptjs
- API requests are protected with JWT authentication
- File uploads are validated and scanned
- HTTPS recommended for production deployment
- Medical data handling follows security best practices

---

## Future Improvements

- Multi-image analysis for better diagnosis
- Comparison with patient's previous scans
- Integration with patient EHR systems
- Mobile application for easy access
- Federated learning for privacy-preserving model training
- Automated report generation with NLP

---

## Contributing

This project was developed as part of an MS thesis. For any improvements or bug reports, please create an issue or contact the development team.

---

## Citation

If you use this project in your research or work, please cite as:

```bibtex
@thesis{ExplainableRetinalDisease2024,
  title={Explainable Retinal Disease Detection Using Hierarchical Deep Learning},
  author={Ahmad Jawad},
  school={Your University Name},
  year={2024}
}
```

---

## License

This project is provided for educational and research purposes. All rights reserved.

---

## Support & Contact

For technical support or questions:
- GitHub Issues: [Create an issue](https://github.com/ahmedjawad24/Explainable-retinal-disease-detection/issues)
- Email: [your-email@example.com]

---

## Acknowledgments

- Training data sourced from [ODIR dataset]
- EfficientNet architecture from [Timm library]
- FastAPI and PyTorch communities
- All contributors and reviewers

---

**Last Updated**: May 2024
**Version**: 1.0.0
**Status**: Production Ready
│   ├── server.js              # Entry point
│   └── package.json
│
├── frontend/                  # React Application
│   ├── src/
│   │   ├── pages/            # React Pages
│   │   ├── layouts/          # Layouts
│   │   └── store/            # State Management
│   ├── package.json
│   └── vite.config.js
│
├── models/                    # ML Models & Server
│   ├── binary_FINAL.pth       # Binary classifier
│   ├── disease_FINAL.pth      # Disease classifier
│   ├── ml_server.py          # FastAPI ML server
│   ├── start_all.py          # Startup script
│   └── requirements.txt      # Python dependencies
│
└── dataset/                   # Training data
    ├── train/
    ├── val/
    └── test/
```

## License

MIT License - Free to use for educational purposes.