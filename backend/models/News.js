const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 300
  },
  category: {
    type: String,
    required: true,
    enum: ['news', 'event', 'announcement', 'press-release', 'photo-gallery', 'notice'],
    default: 'news'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  image: {
    url: String,
    alt: String
  },
  eventDate: {
    type: Date,
    required: function() {
      return this.category === 'event';
    }
  },
  eventLocation: {
    type: String,
    required: function() {
      return this.category === 'event';
    }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  slug: {
    type: String,
    unique: true,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better search performance
newsSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
newsSchema.index({ category: 1, status: 1, createdAt: -1 });
newsSchema.index({ slug: 1 });
newsSchema.index({ featured: 1, status: 1, createdAt: -1 });

// Generate slug from title before saving
newsSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') + '-' + Date.now();
  }
  next();
});

// Virtual for like count
newsSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
newsSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Virtual for read time estimation (words per minute = 200)
newsSchema.virtual('readTime').get(function() {
  const wordCount = this.content.split(' ').length;
  const readTime = Math.ceil(wordCount / 200);
  return readTime;
});

// Ensure virtual fields are serialized
newsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('News', newsSchema);
