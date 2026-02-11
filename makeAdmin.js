require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = process.argv[2];

if (!email) {
    console.log('Please provide an email address: node makeAdmin.js <email>');
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User with email '${email}' not found`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();
        console.log(`Success! ${user.name} (${user.email}) is now an Admin.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
