const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    imageName: {
        type: String
    },
    prediction: {
        type: String,
        enum: ['normal', 'diabetes', 'glaucoma', 'cataract', 'myopia'],
        required: true
    },
    isNormal: {
        type: Boolean,
        default: false
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        required: true
    },
    // Binary classification results
    binaryResult: {
        isNormal: Boolean,
        normalProbability: Number,
        diseaseProbability: Number
    },
    // Disease classification results (if not normal)
    diseaseResult: {
        disease: String,
        confidence: Number,
        probabilities: {
            diabetes: Number,
            glaucoma: Number,
            cataract: Number,
            myopia: Number
        }
    },
    // Confidence threshold check
    confidenceThreshold: {
        type: Number,
        default: 0.7
    },
    isAccepted: {
        type: Boolean,
        default: true
    },
    rejectedReason: {
        type: String
    },
    // Grad-CAM visualization
    gradcamImageUrl: {
        type: String
    },
    // Explainable AI Etiology & Neural Attribution
    xaiEtiology: {
        type: mongoose.Schema.Types.Mixed
    },
    // Recommendations based on prediction
    recommendations: [{
        title: String,
        description: String,
        priority: {
            type: String,
            enum: ['high', 'medium', 'low']
        }
    }],
    // Doctor review
    doctorReview: {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String,
        confirmedDiagnosis: String,
        treatmentPlan: String,
        reviewedAt: Date
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'completed', 'reviewed', 'confirmed', 'rejected'],
        default: 'completed'
    },
    // Review request - which doctor this prediction is sent to
    reviewRequest: {
        sentToDoctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sentAt: Date,
        status: {
            type: String,
            enum: ['none', 'pending', 'in-review', 'completed'],
            default: 'none'
        },
        notes: String,
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment'
        }
    }
}, {
    timestamps: true
});

// Index for faster queries
predictionSchema.index({ userId: 1, createdAt: -1 });
predictionSchema.index({ prediction: 1 });
predictionSchema.index({ status: 1 });
predictionSchema.index({ 'reviewRequest.sentToDoctorId': 1 });
predictionSchema.index({ 'reviewRequest.status': 1 });

module.exports = mongoose.model('Prediction', predictionSchema);