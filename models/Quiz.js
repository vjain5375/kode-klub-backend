const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  quizData: {
    type: Object,   // PURE JSON
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  showLeaderboard: {
    type: Boolean,
    default: false  // Hidden by default, admin must enable
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);
