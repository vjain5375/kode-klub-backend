const mongoose = require('mongoose');

const DPPSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },

    tags: [{
        type: String,
        enum: ['DSA', 'Arrays', 'DP', 'Graph', 'String', 'Math', 'Trees', 'LinkedList', 'Sorting', 'Searching', 'Recursion', 'Greedy']
    }],

    description: {
        type: String,
        required: true
    },

    leetcodeUrl: {
        type: String,
        required: true,
        trim: true
    },

    publishDate: {
        type: Date,
        default: Date.now
    },

    isActive: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DPP', DPPSchema);
