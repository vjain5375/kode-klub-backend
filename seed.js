/**
 * Seed script to create initial user
 * Run: node seed.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if user exists
        const existingUser = await User.findOne({ email: '24cd3049@rgipt.ac.in' });

        if (existingUser) {
            console.log('User already exists:', existingUser.email);
        } else {
            // Create new user
            const user = new User({
                email: '24cd3049@rgipt.ac.in',
                password: 'V@nsh2005',
                name: 'Vansh Jain',
                role: 'user'
            });

            await user.save();
            console.log('User created successfully!');
            console.log('Email:', user.email);
            console.log('Name:', user.name);
        }

        await mongoose.disconnect();
        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

seedUser();
