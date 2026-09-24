const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/doctors
// @desc    Get all doctors
// @access  Private
router.get('/doctors', auth, async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor', isActive: true })
            .select('name email specialization phone');

        res.json({
            status: 'success',
            data: { doctors }
        });
    } catch (error) {
        console.error('Doctors fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), [
    body('role').optional().isIn(['patient', 'doctor', 'admin']),
    body('isActive').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: errors.array()[0].msg
            });
        }

        const { role, isActive } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;

        await user.save();

        res.json({
            status: 'success',
            message: 'User updated successfully',
            data: { user }
        });
    } catch (error) {
        console.error('User update error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', auth, authorize('admin'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const role = req.query.role;
        const skip = (page - 1) * limit;

        const query = {};
        if (role) query.role = role;

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasMore: page * limit < total
                }
            }
        });
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router;