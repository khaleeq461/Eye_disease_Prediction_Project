/**
 * Seed Admin User Script
 * Run this script to create an admin user
 * 
 * Usage: node seed-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai_eye_care');
        console.log('Connected to MongoDB');

        // Check if admin exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin user already exists:');
            console.log(`  Email: ${existingAdmin.email}`);
            console.log(`  Role: ${existingAdmin.role}`);
            console.log('\nTo reset password, delete this user and run seed again.');
        } else {
            // Create admin user
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            const admin = new User({
                name: 'System Admin',
                email: 'admin@aiyecare.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true
            });

            await admin.save();
            console.log('Admin user created successfully!');
        }

        console.log('\n--- Admin Login Credentials ---');
        console.log('Email: admin@aiyecare.com');
        console.log('Password: admin123');
        console.log('-------------------------------\n');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

seedAdmin();