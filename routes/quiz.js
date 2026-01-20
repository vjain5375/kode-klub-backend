const express = require('express');
const Quiz = require('../models/Quiz');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET all quizzes for listing (includes full data for Edit functionality)
router.get('/all', async (req, res) => {
  try {
    const quizzes = await Quiz.find({})
      .sort({ createdAt: -1 });

    const quizList = quizzes.map(quiz => {
      // Fallback logic for mixed schema data
      const title = quiz.title || quiz.quizData?.quizTitle || 'Untitled Quiz';

      let questionCount = 0;
      if (quiz.quizData && Array.isArray(quiz.quizData.questions)) {
        questionCount = quiz.quizData.questions.length;
      } else if (Array.isArray(quiz.questions)) { // Check top-level if DB schema allows it (even if not in strict model)
        questionCount = quiz.questions.length;
      } else if (quiz.toObject && quiz.toObject().questions) {
        questionCount = quiz.toObject().questions.length;
      }

      return {
        _id: quiz._id,
        title: title,
        questionCount: questionCount,
        createdAt: quiz.createdAt,
        isActive: quiz.isActive !== false, // Default to true for legacy quizzes
        // Include full quiz data for Edit functionality
        quizData: quiz.quizData,
        questions: quiz.questions // Fallback for legacy data
      };
    });

    res.json({ quizzes: quizList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET active quizzes for students
router.get('/active', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true }) // Filter by isActive: true
      .sort({ createdAt: -1 });

    const quizList = quizzes.map(quiz => {
      // Fallback logic for mixed schema data
      const title = quiz.title || quiz.quizData?.quizTitle || 'Untitled Quiz';

      let questionCount = 0;
      if (quiz.quizData && Array.isArray(quiz.quizData.questions)) {
        questionCount = quiz.quizData.questions.length;
      } else if (Array.isArray(quiz.questions)) {
        questionCount = quiz.questions.length;
      } else if (quiz.toObject && quiz.toObject().questions) {
        questionCount = quiz.toObject().questions.length;
      }

      return {
        _id: quiz._id,
        title: title,
        questionCount: questionCount,
        createdAt: quiz.createdAt
      };
    });

    res.json({ quizzes: quizList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/create', authMiddleware, async (req, res) => {
  // Check for admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  if (
    !req.body.questions ||
    !Array.isArray(req.body.questions) ||
    req.body.questions.length === 0
  ) {
    return res.status(400).json({
      message: 'Quiz must contain at least one question'
    });
  }
  try {
    const quiz = new Quiz({
      title: req.body.quizTitle,
      quizData: req.body
    });

    await quiz.save();

    res.status(201).json({
      message: 'Quiz created successfully',
      quizId: quiz._id
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// GET quiz by id
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const safeQuiz = {
      _id: quiz._id,
      title: quiz.title,
      createdAt: quiz.createdAt,
      showLeaderboard: quiz.showLeaderboard || false,
      quizData: {
        quizTitle: quiz.quizData.quizTitle,
        questions: quiz.quizData.questions.map(q => ({
          id: q.id,
          question: q.question,
          image: q.image || null,
          options: q.options,
          correctAnswer: q.correctAnswer, // Include for results page
          explanation: q.explanation || null // Include for results page
        }))
      }
    };

    res.json(safeQuiz);
  } catch (error) {
    res.status(400).json({ message: 'Invalid quiz id' });
  }
});


// DELETE /:id - Delete quiz (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await quiz.deleteOne();
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /:id - Update quiz (Admin only)
// PUT /:id - Update quiz (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Handle payload: Frontend sends { quizTitle, questions } flattened
    // Map 'quizTitle' or 'title' to root title
    const newTitle = req.body.title || req.body.quizTitle;
    if (newTitle) quiz.title = newTitle;

    // Handle quizData update
    // If request has top-level 'questions', treat entire body as quizData (Frontend pattern)
    if (req.body.questions && Array.isArray(req.body.questions)) {
      quiz.quizData = req.body;
    }
    // Legacy support: if quizData is nested
    else if (req.body.quizData) {
      quiz.quizData = req.body.quizData;
    }

    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /:id/toggle - Toggle quiz active status (Admin only)
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Toggle the isActive status
    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.json({
      message: `Quiz ${quiz.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: quiz.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /:id/toggle-leaderboard - Toggle leaderboard visibility (Admin only)
router.patch('/:id/toggle-leaderboard', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Toggle the showLeaderboard status
    quiz.showLeaderboard = !quiz.showLeaderboard;
    await quiz.save();

    res.json({
      message: `Leaderboard ${quiz.showLeaderboard ? 'enabled' : 'disabled'} for students`,
      showLeaderboard: quiz.showLeaderboard
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
