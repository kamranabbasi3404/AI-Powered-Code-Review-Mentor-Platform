const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  profileUrl: {
    type: String,
    default: ''
  },
  accessToken: {
    type: String,
    default: ''
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  avgScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
