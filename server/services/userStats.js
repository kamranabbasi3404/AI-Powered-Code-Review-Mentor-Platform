const Review = require('../models/Review');
const User = require('../models/User');

/**
 * Recalculate and update user stats (totalReviews, avgScore).
 * Call this after creating or deleting a review.
 */
async function updateUserStats(userId) {
  const allReviews = await Review.find({ userId }).select('scores.overall');
  const totalReviews = allReviews.length;
  const avgScore = totalReviews > 0
    ? Math.round(allReviews.reduce((sum, r) => sum + r.scores.overall, 0) / totalReviews)
    : 0;

  await User.findByIdAndUpdate(userId, { totalReviews, avgScore });
}

module.exports = { updateUserStats };
