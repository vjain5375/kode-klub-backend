const express = require('express');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');

const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const { quizId, answers, timeTaken, studentName, studentId } = req.body;

    if (!quizId || !answers || timeTaken == null || !studentName) {
      return res.status(400).json({ message: 'Missing required fields' });
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
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
