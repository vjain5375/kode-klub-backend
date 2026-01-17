const express = require('express');
const Attempt = require('../models/Attempt');

const router = express.Router();

// GET leaderboard for a quiz
router.get('/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;

    const leaderboard = await Attempt.find({
        quizId,
        studentName: { $exists: true, $ne: '' }
    })
        .sort({ score: -1, timeTaken: 1, createdAt: 1 })
        .select('studentName studentId score timeTaken createdAt');


    res.json({
      totalAttempts: leaderboard.length,
      leaderboard
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
