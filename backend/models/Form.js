const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'text',
      'email',
      'phone',
      'number',
      'textarea',
      'select',
      'radio',
      'checkbox',
      'date',
      'time',
      'file',
      'rating',
      'url',
      'password'
    ],
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  placeholder: {
    type: String,
    trim: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: [
    {
      label: String,
      value: String,
    },
  ], // For select, radio, checkbox fields
  validation: {
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
    pattern: String, // regex pattern
  },
  helpText: {
    type: String,
    trim: true,
  },
  defaultValue: mongoose.Schema.Types.Mixed,
  order: {
    type: Number,
    default: 0,
  },
  conditional: {
    field: String, // Field ID to watch
    value: mongoose.Schema.Types.Mixed, // Value to match
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
      default: 'equals',
    },
  },
});

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    fields: [fieldSchema],
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'archived'],
      default: 'draft',
    },
    settings: {
      allowMultipleSubmissions: {
        type: Boolean,
        default: false,
      },
      requireLogin: {
        type: Boolean,
        default: true,
      },
      submissionLimit: {
        type: Number,
        default: null, // null means no limit
      },
      startDate: Date,
      endDate: Date,
      successMessage: {
        type: String,
        default: 'Thank you for your submission!',
      },
      redirectUrl: String,
      emailNotification: {
        enabled: {
          type: Boolean,
          default: false,
        },
        recipients: [String], // Email addresses
        subject: String,
      },
      captcha: {
        type: Boolean,
        default: false,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submissions: {
      type: Number,
      default: 0,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    tags: [String],
    category: {
      type: String,
      enum: ['survey', 'registration', 'feedback', 'contact', 'poll', 'quiz', 'application', 'other'],
      default: 'other',
    },
    embedSettings: {
      allowedPosts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'News',
        },
      ],
      allowedQuestions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
      ],
      displayStyle: {
        type: String,
        enum: ['inline', 'popup', 'sidebar', 'bottom'],
        default: 'inline',
      },
      showTitle: {
        type: Boolean,
        default: true,
      },
      showDescription: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
formSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    // Add timestamp if slug might not be unique
    if (this.isNew) {
      this.slug += '-' + Date.now().toString().slice(-6);
    }
  }
  next();
});

// Create indexes
formSchema.index({ slug: 1 });
formSchema.index({ status: 1 });
formSchema.index({ createdBy: 1 });
formSchema.index({ 'embedSettings.allowedPosts': 1 });
formSchema.index({ 'embedSettings.allowedQuestions': 1 });

module.exports = mongoose.model('Form', formSchema);
