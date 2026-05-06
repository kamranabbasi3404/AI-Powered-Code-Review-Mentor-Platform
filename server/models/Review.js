const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  lineNumbers: [{
    type: Number
  }],
  suggestion: {
    type: String,
    default: ''
  },
  codeExample: {
    type: String,
    default: ''
  }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    default: 'javascript'
  },
  code: {
    type: String,
    required: true
  },
  updatedCode: {
    type: String,
    default: ''
  },
  shareId: {
    type: String,
    unique: true,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  scores: {
    quality: { type: Number, default: 0 },
    security: { type: Number, default: 0 },
    performance: { type: Number, default: 0 },
    bestPractices: { type: Number, default: 0 },
    overall: { type: Number, default: 0 },
    grade: { type: String, default: 'N/A' }
  },
  issues: [issueSchema],
  summary: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for fast lookups
reviewSchema.index({ shareId: 1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
