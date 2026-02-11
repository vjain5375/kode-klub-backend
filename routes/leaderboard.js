const express = require('express');
const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET leaderboard for a specific quiz (public, respects visibility)
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;

    // Check if quiz exists and if leaderboard is visible
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check visibility (unless admin)
    const isAdmin = req.headers.authorization ? await checkIfAdmin(req) : false;

    if (!quiz.showLeaderboard && !isAdmin) {
      return res.json({
        visible: false,
        message: 'Leaderboard not yet published for this quiz',
        leaderboard: []
      });
    }

    // Use aggregation to group by user and pick best score (prevents duplicates)
    const leaderboard = await Attempt.aggregate([
      {
        $match: {
          quizId: new mongoose.Types.ObjectId(quizId),
          studentName: { $exists: true, $ne: '' }
        }
      },
      // Sort first to ensure we pick the best attempt for each user
      { $sort: { score: -1, timeTaken: 1, createdAt: 1 } },
      {
        $group: {
          _id: {
            $ifNull: ["$userId", "$studentId"] // Group by userId if present, else studentId (email)
          },
          doc: { $first: "$$ROOT" } // Pick determining attempt
        }
      },
      {
        $replaceRoot: { newRoot: "$doc" } // Promote that doc to top level
      },
      // Sort the final unique list
      { $sort: { score: -1, timeTaken: 1, createdAt: 1 } },
      { $limit: 100 },
      {
        $project: {
          studentName: 1,
          studentId: 1,
          score: 1,
          timeTaken: 1,
          createdAt: 1
        }
      }
    ]);

    res.json({
      visible: true,
      quizTitle: quiz.title,
      totalAttempts: leaderboard.length,
      leaderboard
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET overall leaderboard (aggregated across all quizzes)
router.get('/overall', async (req, res) => {
  try {
    // Check if overall leaderboard is visible
    const isVisible = await Settings.getSetting('showOverallLeaderboard', false);
    const isAdmin = req.headers.authorization ? await checkIfAdmin(req) : false;

    if (!isVisible && !isAdmin) {
      return res.json({
        visible: false,
        message: 'Overall leaderboard not yet published',
        leaderboard: []
      });
    }

    // Aggregate scores across all quizzes per user
    const aggregation = await Attempt.aggregate([
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quizId',
          foreignField: '_id',
          as: 'quiz'
        }
      },
      { $unwind: '$quiz' },
      {
        $project: {
          userId: 1,
          studentName: 1,
          score: 1,
          totalQuestions: { $size: '$quiz.quizData.questions' },
          percentage: {
            $multiply: [
              { $divide: ['$score', { $size: '$quiz.quizData.questions' }] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          studentName: { $first: '$studentName' },
          totalQuizzes: { $sum: 1 },
          totalScore: { $sum: '$score' },
          totalQuestions: { $sum: '$totalQuestions' },
          avgPercentage: { $avg: '$percentage' }
        }
      },
      {
        $project: {
          userId: '$_id',
          studentName: 1,
          totalQuizzes: 1,
          totalScore: 1,
          totalQuestions: 1,
          avgPercentage: { $round: ['$avgPercentage', 1] },
          overallPercentage: {
            $round: [
              { $multiply: [{ $divide: ['$totalScore', '$totalQuestions'] }, 100] },
              1
            ]
          }
        }
      },
      { $sort: { avgPercentage: -1, totalQuizzes: -1, totalScore: -1 } },
      { $limit: 100 }
    ]);

    res.json({
      visible: true,
      totalParticipants: aggregation.length,
      leaderboard: aggregation
    });

  } catch (error) {
    console.error('Overall Leaderboard Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ADMIN: Get all leaderboards for dashboard
router.get('/admin/all', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    // Get all quizzes with their leaderboard status
    const quizzes = await Quiz.find({})
      .select('title showLeaderboard createdAt')
      .sort({ createdAt: -1 });

    // Get attempt counts per quiz
    const quizLeaderboards = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = await Attempt.find({ quizId: quiz._id })
          .sort({ score: -1, timeTaken: 1 })
          .select('_id studentName score timeTaken createdAt')
          .limit(10);

        return {
          quizId: quiz._id,
          title: quiz.title,
          showLeaderboard: quiz.showLeaderboard,
          attemptCount: await Attempt.countDocuments({ quizId: quiz._id }),
          topAttempts: attempts
        };
      })
    );

    // Get overall leaderboard visibility
    const showOverallLeaderboard = await Settings.getSetting('showOverallLeaderboard', false);

    res.json({
      showOverallLeaderboard,
      quizLeaderboards
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN: Toggle overall leaderboard visibility
router.patch('/admin/toggle-overall', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const currentValue = await Settings.getSetting('showOverallLeaderboard', false);
    const newValue = !currentValue;

    await Settings.setSetting('showOverallLeaderboard', newValue);

    res.json({
      message: `Overall leaderboard ${newValue ? 'published' : 'hidden'}`,
      showOverallLeaderboard: newValue
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper to check if request is from admin
async function checkIfAdmin(req) {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    return user && user.role === 'admin';
  } catch {
    return false;
  }
}

// Legacy route for backwards compatibility
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
