const express = require('express');
const Prediction = require('../models/Prediction');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports
// @desc    Get all reports (for doctors/admin)
// @access  Private (Doctor/Admin)
router.get('/', auth, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const prediction = req.query.prediction;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) query.status = status;
        if (prediction) query.prediction = prediction;

        const reports = await Prediction.find(query)
            .populate('userId', 'name email phone')
            .populate('doctorReview.doctorId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Prediction.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                reports,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasMore: page * limit < total
                }
            }
        });
    } catch (error) {
        console.error('Reports fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/reports/:id
// @desc    Get specific report
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const report = await Prediction.findById(req.params.id)
            .populate('userId', 'name email phone address')
            .populate('doctorReview.doctorId', 'name email specialization');

        if (!report) {
            return res.status(404).json({
                status: 'error',
                message: 'Report not found'
            });
        }

        // Check if user has access (owner, doctor, or admin)
        if (report.userId._id.toString() !== req.user._id.toString() && 
            req.user.role === 'patient') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }

        res.json({
            status: 'success',
            data: { report }
        });
    } catch (error) {
        console.error('Report fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/reports/:id/review
// @desc    Add doctor review to report
// @access  Private (Doctor only)
router.put('/:id/review', auth, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { notes, confirmedDiagnosis, treatmentPlan } = req.body;

        const report = await Prediction.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                status: 'error',
                message: 'Report not found'
            });
        }

        report.doctorReview = {
            doctorId: req.user._id,
            notes,
            confirmedDiagnosis,
            treatmentPlan,
            reviewedAt: new Date()
        };
        report.status = confirmedDiagnosis ? 'confirmed' : 'reviewed';

        await report.save();

        res.json({
            status: 'success',
            message: 'Review added successfully',
            data: { report }
        });
    } catch (error) {
        console.error('Review add error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/reports/stats
// @desc    Get report statistics
// @access  Private (Doctor/Admin)
router.get('/stats/summary', auth, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const totalReports = await Prediction.countDocuments();
        const pendingReports = await Prediction.countDocuments({ status: 'pending' });
        const reviewedReports = await Prediction.countDocuments({ status: 'reviewed' });
        const confirmedReports = await Prediction.countDocuments({ status: 'confirmed' });

        const byPrediction = await Prediction.aggregate([
            {
                $group: {
                    _id: '$prediction',
                    count: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' }
                }
            }
        ]);

        const byStatus = await Prediction.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            status: 'success',
            data: {
                totalReports,
                pendingReports,
                reviewedReports,
                confirmedReports,
                byPrediction,
                byStatus
            }
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router;