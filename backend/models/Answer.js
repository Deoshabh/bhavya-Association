const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 1500
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'reported'],
    default: 'active'
  },
  isBestAnswer: {
    type: Boolean,
    default: false
  },
  // Engagement metrics
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Comments on answers
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 300
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Moderation
  reportCount: {
    type: Number,
    default: 0
  },
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'misinformation', 'other']
    },
    details: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
answerSchema.index({ question: 1, createdAt: -1 });
answerSchema.index({ author: 1, createdAt: -1 });
answerSchema.index({ content: 'text' });

// Virtual for like count
answerSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Update question's answer count when answer is saved
answerSchema.post('save', async function() {
  const Question = mongoose.model('Question');
  await Question.findByIdAndUpdate(
    this.question,
    { $inc: { answerCount: 1 } }
  );
});

// Update question's answer count when answer is removed
answerSchema.post('deleteOne', { document: true }, async function() {
  const Question = mongoose.model('Question');
  await Question.findByIdAndUpdate(
    this.question,
    { $inc: { answerCount: -1 } }
  );
});

module.exports = mongoose.model('Answer', answerSchema);
