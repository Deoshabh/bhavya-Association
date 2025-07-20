const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ["question", "discussion", "poll", "opinion"],
      default: "question",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "general",
        "business",
        "education",
        "technology",
        "health",
        "social",
        "politics",
        "culture",
        "other",
      ],
      default: "general",
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "closed", "archived", "reported"],
      default: "active",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    // For polls
    pollOptions: [
      {
        option: {
          type: String,
          required: function () {
            return this.type === "poll";
          },
        },
        votes: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            votedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    allowMultipleVotes: {
      type: Boolean,
      default: false,
    },
    pollExpiresAt: {
      type: Date,
      required: function () {
        return this.type === "poll";
      },
    },
    // Engagement metrics
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    answers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Answer",
      },
    ],
    answerCount: {
      type: Number,
      default: 0,
    },
    bestAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },
    // Moderation
    reportCount: {
      type: Number,
      default: 0,
    },
    reports: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: {
          type: String,
          enum: [
            "spam",
            "inappropriate",
            "harassment",
            "misinformation",
            "other",
          ],
        },
        details: String,
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // SEO and search
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    embeddedForms: [
      {
        form: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Form",
          required: true,
        },
        position: {
          type: String,
          enum: ["top", "middle", "bottom", "inline"],
          default: "bottom",
        },
        displayStyle: {
          type: String,
          enum: ["inline", "popup", "sidebar"],
          default: "inline",
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
questionSchema.index({ title: 'text', content: 'text' });
questionSchema.index({ category: 1, status: 1, createdAt: -1 });
questionSchema.index({ author: 1, createdAt: -1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ slug: 1 });

// Generate slug before saving
questionSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) + '-' + Date.now();
  }
  next();
});

// Virtual for like count
questionSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for poll vote count
questionSchema.virtual('totalVotes').get(function() {
  if (this.type !== 'poll' || !this.pollOptions) return 0;
  return this.pollOptions.reduce((total, option) => {
    return total + (option.votes ? option.votes.length : 0);
  }, 0);
});

module.exports = mongoose.model('Question', questionSchema);
