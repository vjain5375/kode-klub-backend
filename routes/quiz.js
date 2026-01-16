const express = require('express');
const Quiz = require('../models/Quiz');

const router = express.Router();

router.post('/create', async (req, res) => {
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

module.exports = router;
