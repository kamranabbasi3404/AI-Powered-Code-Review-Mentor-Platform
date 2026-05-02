const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Review = require('../models/Review');

const router = express.Router();

// GET /api/users/stats - Get user dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const reviews = await Review.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-code');

    // Calculate stats
    const allReviews = await Review.find({ userId: req.user.userId });
    const totalReviews = allReviews.length;

    let avgScores = { quality: 0, security: 0, performance: 0, bestPractices: 0, overall: 0 };
    let languageBreakdown = {};
    let severityCount = { critical: 0, warning: 0, info: 0 };

    if (totalReviews > 0) {
      allReviews.forEach(review => {
        avgScores.quality += review.scores.quality;
        avgScores.security += review.scores.security;
        avgScores.performance += review.scores.performance;
        avgScores.bestPractices += review.scores.bestPractices;
        avgScores.overall += review.scores.overall;

        // Language breakdown
        const lang = review.language || 'unknown';
        languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1;

        // Severity count
        review.issues.forEach(issue => {
          if (severityCount[issue.severity] !== undefined) {
            severityCount[issue.severity]++;
          }
        });
      });

      Object.keys(avgScores).forEach(key => {
        avgScores[key] = Math.round(avgScores[key] / totalReviews);
      });
    }

    res.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        profileUrl: user.profileUrl,
        totalReviews,
        avgScore: avgScores.overall
      },
      avgScores,
      languageBreakdown,
      severityCount,
      recentReviews: reviews
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
