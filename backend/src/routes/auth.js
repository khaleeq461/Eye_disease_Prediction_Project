const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'ai_eye_care_secret_key_2024',
        { expiresIn: '30d' }
    );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['patient', 'doctor'])
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { name, email, password, role, phone, dateOfBirth, address, specialization } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Email already registered'
            });
        }

        // Create new user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password,
            role: role || 'patient',
            phone,
            dateOfBirth,
            address,
            specialization
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error during registration'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                status: 'error',
                message: 'Account is deactivated'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error during login'
        });
    }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        res.json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, phone, dateOfBirth, address, profileImage, specialization } = req.body;
        
        const user = await User.findById(req.user._id);
        
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (address) user.address = { ...user.address, ...address };
        if (profileImage) user.profileImage = profileImage;
        if (specialization) user.specialization = specialization;
        
        await user.save();

        res.json({
            status: 'success',
            message: 'Profile updated successfully',
            data: { user }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', auth, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user._id);
        
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                status: 'error',
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            status: 'success',
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
    try {
        const token = generateToken(req.user._id);
        
        res.json({
            status: 'success',
            data: { token }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/users', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin only.'
            });
        }

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            status: 'success',
            data: { users }
        });
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/auth/doctors/:id/verify
// @desc    Verify a doctor (Admin only)
// @access  Private/Admin
router.put('/doctors/:id/verify', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin only.'
            });
        }

        const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
        
        if (!doctor) {
            return res.status(404).json({
                status: 'error',
                message: 'Doctor not found'
            });
        }

        doctor.isActive = true;
        await doctor.save();

        res.json({
            status: 'success',
            message: 'Doctor verified successfully',
            data: { doctor }
        });
    } catch (error) {
        console.error('Doctor verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/auth/doctors/:id
// @desc    Delete a doctor (Admin only)
// @access  Private/Admin
router.delete('/doctors/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin only.'
            });
        }

        const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
        
        if (!doctor) {
            return res.status(404).json({
                status: 'error',
                message: 'Doctor not found'
            });
        }

        await User.deleteOne({ _id: req.params.id });

        res.json({
            status: 'success',
            message: 'Doctor deleted successfully'
        });
    } catch (error) {
        console.error('Doctor deletion error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router;