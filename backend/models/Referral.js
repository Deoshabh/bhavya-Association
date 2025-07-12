const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  referralDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  rewardGiven: {
    type: Boolean,
    default: false
  },
  rewardType: {
    type: String,
    enum: ['tier_upgrade', 'feature_unlock', 'badge_earned'],
    default: null
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: String // e.g., 'direct_link', 'social_share', 'email'
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
ReferralSchema.index({ referrer: 1, status: 1 });
ReferralSchema.index({ referralCode: 1, status: 1 });

// Method to complete referral
ReferralSchema.methods.completeReferral = async function() {
  if (this.status !== 'pending') {
    throw new Error('Referral is not in pending status');
  }

  this.status = 'completed';
  this.completionDate = new Date();
  
  // Update referrer's stats
  const User = mongoose.model('User');
  const referrer = await User.findById(this.referrer);
  
  if (referrer) {
    referrer.referralStats.successfulReferrals += 1;
    referrer.referralStats.activeReferrals += 1;
    
    // Check for tier upgrade
    await referrer.updateReferralTier();
  }

  return this.save();
};

// Static method to get referral analytics
ReferralSchema.statics.getAnalytics = async function(userId, timeframe = 'all') {
  const matchStage = { referrer: new mongoose.Types.ObjectId(userId) };
  
  if (timeframe !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    if (startDate) {
      matchStage.referralDate = { $gte: startDate };
    }
  }

  const analytics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalReferrals: { $sum: 1 },
        completedReferrals: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingReferrals: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        conversionRate: {
          $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);

  return analytics[0] || {
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    conversionRate: 0
  };
};

module.exports = mongoose.model('Referral', ReferralSchema);
