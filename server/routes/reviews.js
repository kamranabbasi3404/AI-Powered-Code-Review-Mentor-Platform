const express = require('express');
const { nanoid } = require('nanoid');
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const User = require('../models/User');
const { analyzeCode } = require('../services/groqService');
const { updateUserStats } = require('../services/userStats');

const router = express.Router();

// POST /api/reviews - Create a new code review
router.post('/', auth, async (req, res) => {
  try {
    const { code, language, title } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (code.length > 50000) {
      return res.status(400).json({ error: 'Code exceeds maximum length (50000 chars)' });
    }

    // Analyze code with Groq AI
    const analysis = await analyzeCode(code, language || 'javascript');

    // Create review
    const review = await Review.create({
      userId: req.user.userId,
      title: title || `${(language || 'javascript').charAt(0).toUpperCase() + (language || 'javascript').slice(1)} Code Review`,
      language: language || 'javascript',
      code,
      shareId: nanoid(10),
      isPublic: true,
      scores: analysis.scores,
      issues: analysis.issues,
      summary: analysis.summary,
      updatedCode: analysis.updatedCode
    });

    // Update user stats
    await updateUserStats(req.user.userId);

    res.status(201).json(review);
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create review' });
  }
});

// GET /api/reviews - Get all reviews for current user
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-code');

    const total = await Review.countDocuments({ userId: req.user.userId });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/share/:shareId - Get a public review by shareId
router.get('/share/:shareId', async (req, res) => {
  try {
    const review = await Review.findOne({
      shareId: req.params.shareId,
      isPublic: true
    }).populate('userId', 'username displayName avatarUrl');

    if (!review) {
      return res.status(404).json({ error: 'Review not found or is private' });
    }

    res.json(review);
  } catch (error) {
    console.error('Fetch shared review error:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// GET /api/reviews/:id - Get a single review
router.get('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Fetch review error:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update user stats
    await updateUserStats(req.user.userId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
