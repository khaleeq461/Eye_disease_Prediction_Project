const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/auth');
const predictionRoutes = require('./src/routes/prediction');
const appointmentRoutes = require('./src/routes/appointment');
const reportRoutes = require('./src/routes/report');
const userRoutes = require('./src/routes/user');

const app = express();

// Middleware
// Disable helmet for development (CSP blocks cross-origin images)
// In production, configure this properly
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const heatmapDir = path.join(uploadDir, 'heatmaps');
const reportsDir = path.join(uploadDir, 'reports');

[uploadDir, heatmapDir, reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ML Server configuration
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5001';

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai_eye_care');
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
    }
};

// Check ML server health
const checkMLServer = () => {
    return new Promise((resolve) => {
        http.get(`${ML_SERVER_URL}/health`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const mlStatus = await checkMLServer();
    res.json({ 
        status: 'success', 
        message: 'AI Eye Care API is running',
        timestamp: new Date().toISOString(),
        mlServer: mlStatus ? {
            status: 'online',
            models_loaded: mlStatus.models_loaded
        } : {
            status: 'offline',
            note: 'Start ML server with: python ../models/ml_server.py'
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'AI Eye Care System API',
        version: '1.0.0',
        description: 'Backend API for AI-powered eye disease detection',
        mlServer: ML_SERVER_URL,
        endpoints: {
            auth: '/api/auth',
            prediction: '/api/prediction',
            appointments: '/api/appointments',
            reports: '/api/reports',
            users: '/api/users',
            health: '/api/health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    await connectDB();
    
    // Check ML server status on startup
    const mlStatus = await checkMLServer();
    if (mlStatus) {
        console.log('✅ ML Server connected');
        if (mlStatus.binary_model && mlStatus.disease_model) {
            console.log('✅ ML Models loaded and ready');
        }
    } else {
        console.log('⚠️  ML Server not running');
        console.log('   To enable AI predictions, run: python ../models/ml_server.py');
        console.log('   ML predictions will be disabled until ML server is started\n');
    }
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    });
};

startServer();

module.exports = app;