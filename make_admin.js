const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');
        const res = await User.updateOne(
            { email: '24cd3049@rgipt.ac.in' },
            { $set: { role: 'admin' } }
        );
        console.log(res);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
