const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const Quiz = require('./models/Quiz');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const quizzes = await Quiz.find({}).lean();
        console.log(`Found ${quizzes.length} quizzes`);

        // Write to file for cleaner output
        fs.writeFileSync('quiz_dump.json', JSON.stringify(quizzes, null, 2));
        console.log('Wrote quiz data to quiz_dump.json');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
    }
};

connectDB();
