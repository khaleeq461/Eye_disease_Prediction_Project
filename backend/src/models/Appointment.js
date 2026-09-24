const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    predictionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prediction'
    },
    date: {
        type: Date,
        required: [true, 'Appointment date is required']
    },
    time: {
        type: String,
        required: [true, 'Appointment time is required']
    },
    duration: {
        type: Number,
        default: 30 // minutes
    },
    status: {
        type: String,
        enum: ['pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['consultation', 'follow-up', 'review', 'emergency'],
        default: 'consultation'
    },
    reason: {
        type: String,
        trim: true
    },
    notes: {
        type: String
    },
    // Doctor's notes after appointment
    doctorNotes: {
        diagnosis: String,
        treatment: String,
        prescription: String,
        nextAppointment: Date,
        followUpNotes: String
    },
    // Video consultation link
    videoLink: {
        type: String
    },
    // Reminders
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderDate: Date,
    // Cancellation details
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: String
}, {
    timestamps: true
});

// Index for faster queries
appointmentSchema.index({ patientId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1 });
appointmentSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);