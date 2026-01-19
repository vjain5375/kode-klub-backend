const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  studentName: {
    type: String,
    required: true,
    trim: true
  },

  studentId: {
    type: String, // roll no / email / phone (flexible)
    required: false
  },

  answers: {
    type: [Number], // Storing indices of selected options
    required: true
  },

  score: {
    type: Number,
    required: true
  },

  timeTaken: {
    type: Number,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Attempt', AttemptSchema);
