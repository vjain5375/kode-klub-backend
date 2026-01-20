const express = require('express');
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const { protect } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Helper to get user from token optionally
const getUserFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.userId;
    }
  } catch (err) {
    return null;
  }
  return null;
};

// GET /api/attempt/all - Get all attempts (Admin only)
router.get('/all', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const attempts = await Attempt.find({})
      .populate('userId', 'name email')
      .populate('quizId', 'title quizData.quizTitle')
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/attempt/history - Get user's attempt history
router.get('/history', protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.user._id })
      .populate('quizId', 'title quizData.quizTitle')
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const { quizId, answers, timeTaken, studentName, studentId } = req.body;

    // Check for logged in user
    const userId = getUserFromToken(req);

    // CRITICAL: Force Login. Anonymous attempts are NOT allowed.
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required. Please log in with your Google account to attempt the quiz.' });
    }

    if (!quizId || !answers || timeTaken == null || !studentName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already attempted this quiz (one attempt per user)
    if (userId) {
      const existingAttempt = await Attempt.findOne({
        quizId,
        userId: new mongoose.Types.ObjectId(userId)
      });
      if (existingAttempt) {
        return res.status(400).json({
          message: 'You have already attempted this quiz. Only one attempt is allowed.',
          alreadyAttempted: true,
          existingScore: existingAttempt.score
        });
      }
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questions = quiz.quizData.questions || [];

    if (answers.length !== questions.length) {
      return res.status(400).json({
        message: 'Answer count does not match number of questions'
      });
    }

    let score = 0;

    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        score++;
      }
    });

    const attempt = new Attempt({
      quizId,
      userId: userId ? new mongoose.Types.ObjectId(userId) : null, // Explicit cast
      studentName,
      studentId,
      answers,
      score,
      timeTaken
    });

    await attempt.save();

    res.status(201).json({
      studentName,
      score,
      totalQuestions: questions.length
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You have already attempted this quiz. Duplicate submission detected.',
        alreadyAttempted: true
      });
    }
    console.error("Submit Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/attempt/check/:quizId - Check if user already attempted this quiz
router.get('/check/:quizId', async (req, res) => {
  try {
    const userId = getUserFromToken(req);

    if (!userId) {
      return res.json({ attempted: false });
    }

    const existingAttempt = await Attempt.findOne({
      quizId: req.params.quizId,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (existingAttempt) {
      return res.json({
        attempted: true,
        score: existingAttempt.score,
        timeTaken: existingAttempt.timeTaken,
        createdAt: existingAttempt.createdAt,
        answers: existingAttempt.answers // Return user's answers for review
      });
    }

    res.json({ attempted: false });
  } catch (error) {
    console.error("Check Attempt Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
