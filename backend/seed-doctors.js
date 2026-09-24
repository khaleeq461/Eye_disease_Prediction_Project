/**
 * Seed Doctors Script
 * Run this script to create sample doctor users
 * 
 * Usage: node seed-doctors.js
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
    specialization: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

const doctors = [
    {
        name: 'Dr. Ahmed Khan',
        email: 'doctor1@aiyecare.com',
        password: 'doctor123',
        role: 'doctor',
        specialization: 'Ophthalmology'
    },
    {
        name: 'Dr. Sarah Ali',
        email: 'doctor2@aiyecare.com',
        password: 'doctor123',
        role: 'doctor',
        specialization: 'Retina Specialist'
    },
    {
        name: 'Dr. Muhammad Imran',
        email: 'doctor3@aiyecare.com',
        password: 'doctor123',
        role: 'doctor',
        specialization: 'Glaucoma Specialist'
    }
];

async function seedDoctors() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai_eye_care');
        console.log('Connected to MongoDB');

        let createdCount = 0;
        
        for (const doc of doctors) {
            const existing = await User.findOne({ email: doc.email });
            
            if (existing) {
                console.log(`Doctor already exists: ${doc.email}`);
            } else {
                const hashedPassword = await bcrypt.hash(doc.password, 12);
                
                const doctor = new User({
                    name: doc.name,
                    email: doc.email,
                    password: hashedPassword,
                    role: doc.role,
                    specialization: doc.specialization,
                    isActive: true
                });

                await doctor.save();
                console.log(`Created doctor: ${doc.name} (${doc.email})`);
                createdCount++;
            }
        }

        console.log(`\n--- Created ${createdCount} new doctors ---`);
        console.log('\nDoctor Login Credentials:');
        doctors.forEach(d => {
            console.log(`  ${d.name}: ${d.email} / ${d.password}`);
        });
        console.log('\nNote: Doctors need to be verified by admin before they can login.');
        console.log('      Use Admin Dashboard to approve doctors.');

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

seedDoctors();