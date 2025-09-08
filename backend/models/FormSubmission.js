const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Handle requirement validation in route
    },
    submitterInfo: {
      ip: String,
      userAgent: String,
      email: String, // For anonymous submissions
      name: String, // For anonymous submissions
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'rejected', 'spam'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    reviewNotes: String,
    source: {
      type: String,
      enum: ['direct', 'embedded_post', 'embedded_question', 'standalone'],
      default: 'direct',
    },
    sourceRef: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'sourceModel',
    },
    sourceModel: {
      type: String,
      enum: ['News', 'Question'],
    },
    metadata: {
      submissionTime: {
        type: Number, // Time taken to fill form in seconds
      },
      deviceType: String,
      location: {
        country: String,
        state: String,
        city: String,
      },
      utm: {
        source: String,
        medium: String,
        campaign: String,
      },
    },
    files: [
      {
        fieldId: String,
        originalName: String,
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
      },
    ],
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
    score: {
      type: Number, // For quiz forms
      default: null,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
submissionSchema.index({ form: 1, createdAt: -1 });
submissionSchema.index({ submittedBy: 1, createdAt: -1 });
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ source: 1, sourceRef: 1 });
submissionSchema.index({ flagged: 1 });

// Virtual for formatted submission data
submissionSchema.virtual('formattedData').get(function() {
  const formatted = {};
  for (const [key, value] of this.data) {
    formatted[key] = value;
  }
  return formatted;
});

// Method to check if user can submit
submissionSchema.statics.canUserSubmit = async function(formId, userId) {
  const form = await mongoose.model('Form').findById(formId);
  if (!form) return { canSubmit: false, reason: 'Form not found' };
  
  if (form.status !== 'active') {
    return { canSubmit: false, reason: 'Form is not active' };
  }
  
  if (form.settings.startDate && new Date() < form.settings.startDate) {
    return { canSubmit: false, reason: 'Form has not started yet' };
  }
  
  if (form.settings.endDate && new Date() > form.settings.endDate) {
    return { canSubmit: false, reason: 'Form has ended' };
  }
  
  if (form.settings.submissionLimit && form.submissions >= form.settings.submissionLimit) {
    return { canSubmit: false, reason: 'Submission limit reached' };
  }
  
  if (!form.settings.allowMultipleSubmissions && userId) {
    const existingSubmission = await this.findOne({ form: formId, submittedBy: userId });
    if (existingSubmission) {
      return { canSubmit: false, reason: 'You have already submitted this form' };
    }
  }
  
  return { canSubmit: true };
};

module.exports = mongoose.model('FormSubmission', submissionSchema);
