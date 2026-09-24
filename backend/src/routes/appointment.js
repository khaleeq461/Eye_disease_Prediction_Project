const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/appointments
// @desc    Book an appointment (patient books with doctor)
// @access  Private/Patient
router.post('/', auth, [
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    body('reason').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { doctorId, predictionId, date, time, type, reason } = req.body;

        // Check if user is a patient
        if (req.user.role !== 'patient') {
            return res.status(403).json({
                status: 'error',
                message: 'Only patients can book appointments'
            });
        }

        const appointment = new Appointment({
            patientId: req.user._id,
            doctorId,
            predictionId,
            date,
            time,
            type: type || 'consultation',
            reason,
            status: 'pending' // Doctor must confirm
        });

        await appointment.save();

        // Populate for response
        await appointment.populate('doctorId', 'name email specialization');
        await appointment.populate('patientId', 'name email');

        res.status(201).json({
            status: 'success',
            message: 'Appointment request sent. Waiting for doctor confirmation.',
            data: { appointment }
        });
    } catch (error) {
        console.error('Appointment booking error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/appointments
// @desc    Get user's appointments (patient sees their own, doctor sees theirs)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const role = req.user.role;
        const skip = (page - 1) * limit;

        let query = {};

        if (role === 'patient') {
            query.patientId = req.user._id;
        } else if (role === 'doctor') {
            query.doctorId = req.user._id;
        } else {
            // Admin sees all
        }

        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name email phone')
            .populate('doctorId', 'name email specialization')
            .populate('predictionId', 'prediction confidence imageUrl binaryResult diseaseResult')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Appointment.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                appointments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasMore: page * limit < total
                }
            }
        });
    } catch (error) {
        console.error('Appointments fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/appointments/upcoming
// @desc    Get upcoming appointments for current user
// @access  Private
router.get('/upcoming', auth, async (req, res) => {
    try {
        const role = req.user.role;
        let query = {
            date: { $gte: new Date() },
            status: { $in: ['scheduled', 'confirmed'] }
        };

        if (role === 'patient') {
            query.patientId = req.user._id;
        } else if (role === 'doctor') {
            query.doctorId = req.user._id;
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email')
            .populate('predictionId', 'prediction confidence')
            .sort({ date: 1, time: 1 })
            .limit(10);

        res.json({
            status: 'success',
            data: { appointments }
        });
    } catch (error) {
        console.error('Upcoming appointments fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/appointments/stats
// @desc    Get appointment statistics for dashboard
// @access  Private/Doctor
router.get('/stats', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                status: 'error',
                message: 'Only doctors can access this endpoint'
            });
        }

        const total = await Appointment.countDocuments({ doctorId: req.user._id });
        const pending = await Appointment.countDocuments({ 
            doctorId: req.user._id, 
            status: 'pending' 
        });
        const scheduled = await Appointment.countDocuments({ 
            doctorId: req.user._id, 
            status: 'scheduled' 
        });
        const completed = await Appointment.countDocuments({ 
            doctorId: req.user._id, 
            status: 'completed' 
        });

        res.json({
            status: 'success',
            data: {
                total,
                pending,
                scheduled,
                completed
            }
        });
    } catch (error) {
        console.error('Appointment stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/appointments/:id
// @desc    Get specific appointment with full details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            $or: [
                { patientId: req.user._id },
                { doctorId: req.user._id }
            ]
        })
            .populate('patientId', 'name email phone address')
            .populate('doctorId', 'name email specialization')
            .populate('predictionId');

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        res.json({
            status: 'success',
            data: { appointment }
        });
    } catch (error) {
        console.error('Appointment fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/appointments/:id/confirm
// @desc    Doctor confirms/schedules an appointment
// @access  Private/Doctor
router.put('/:id/confirm', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                status: 'error',
                message: 'Only doctors can confirm appointments'
            });
        }

        const { date, time, notes, videoLink } = req.body;

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            doctorId: req.user._id,
            status: 'pending'
        });

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found or already processed'
            });
        }

        // Update appointment
        if (date) appointment.date = date;
        if (time) appointment.time = time;
        if (notes) appointment.notes = notes;
        if (videoLink) appointment.videoLink = videoLink;
        appointment.status = 'scheduled';

        await appointment.save();
        await appointment.populate('patientId', 'name email phone');
        await appointment.populate('doctorId', 'name email specialization');

        res.json({
            status: 'success',
            message: 'Appointment confirmed and scheduled',
            data: { appointment }
        });
    } catch (error) {
        console.error('Appointment confirm error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { date, time, status, notes, doctorNotes } = req.body;

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            $or: [
                { patientId: req.user._id },
                { doctorId: req.user._id }
            ]
        });

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        // Update fields
        if (date) appointment.date = date;
        if (time) appointment.time = time;
        if (status) appointment.status = status;
        if (notes) appointment.notes = notes;
        if (doctorNotes && req.user.role === 'doctor') {
            appointment.doctorNotes = doctorNotes;
        }

        await appointment.save();

        res.json({
            status: 'success',
            message: 'Appointment updated successfully',
            data: { appointment }
        });
    } catch (error) {
        console.error('Appointment update error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const { reason } = req.body;

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            $or: [
                { patientId: req.user._id },
                { doctorId: req.user._id }
            ]
        });

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        appointment.status = 'cancelled';
        appointment.cancelledBy = req.user._id;
        appointment.cancellationReason = reason || 'User requested cancellation';

        await appointment.save();

        res.json({
            status: 'success',
            message: 'Appointment cancelled successfully'
        });
    } catch (error) {
        console.error('Appointment cancellation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router;