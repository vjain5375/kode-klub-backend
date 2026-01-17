const express = require('express');
const Quiz = require('../models/Quiz');

const router = express.Router();



router.post('/create', async (req, res) => {
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
      quizData: {
        quizTitle: quiz.quizData.quizTitle,
        questions: quiz.quizData.questions.map(q => ({
          id: q.id,
          question: q.question,
          image: q.image || null,
          options: q.options
        }))
      }
    };

    res.json(safeQuiz);
  } catch (error) {
    res.status(400).json({ message: 'Invalid quiz id' });
  }
});


module.exports = router;
