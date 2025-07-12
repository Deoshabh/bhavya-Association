const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  occupation: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  address: { type: String, default: '' },
  interests: { type: [String], default: [] },
  profileImage: { type: String, default: '' }, // URL or base64 encoded image
  planType: { type: String, enum: ['free', 'premium', 'admin'], default: 'free' },
  createdAt: { type: Date, default: Date.now },
  // Add fields to control profile visibility
  isPublic: { 
    type: Boolean, 
    default: true,
    required: true // Make it required so it can't be null or undefined
  },
  // Add account status field
  accountStatus: { 
    type: String, 
    enum: ['active', 'deactivated', 'suspended'],
    default: 'active',
    required: true
  },
  // Add last updated timestamp
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  // Referral System Fields
  referralCode: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    index: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralStats: {
    totalReferrals: { type: Number, default: 0 },
    successfulReferrals: { type: Number, default: 0 }, // Users who completed registration
    activeReferrals: { type: Number, default: 0 }, // Currently active referred users
    totalRewardsEarned: { type: Number, default: 0 }
  },
  referralPerks: {
    currentTier: { 
      type: String, 
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], 
      default: 'bronze' 
    },
    unlockedFeatures: [{ type: String }], // Array of feature names
    specialBadges: [{ type: String }], // Array of badge names
    lastRewardDate: { type: Date }
  }
});

// Add a pre-save hook to update the updatedAt timestamp
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate referral code if not exists
  if (!this.referralCode && this.isNew) {
    this.referralCode = this.generateReferralCode();
  }
  
  next();
});

// Method to generate unique referral code
UserSchema.methods.generateReferralCode = function() {
  const crypto = require('crypto');
  const prefix = this.name.substring(0, 2).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${random}`;
};

// Method to update referral tier based on successful referrals
UserSchema.methods.updateReferralTier = function() {
  const referrals = this.referralStats.successfulReferrals;
  let newTier = 'bronze';
  let newFeatures = [];
  let newBadges = [];

  if (referrals >= 50) {
    newTier = 'diamond';
    newFeatures = ['premium_features', 'priority_support', 'exclusive_events', 'custom_profile', 'advanced_analytics'];
    newBadges = ['Diamond Recruiter', 'Community Builder', 'Network Master'];
  } else if (referrals >= 25) {
    newTier = 'platinum';
    newFeatures = ['premium_features', 'priority_support', 'exclusive_events', 'custom_profile'];
    newBadges = ['Platinum Recruiter', 'Community Builder'];
  } else if (referrals >= 15) {
    newTier = 'gold';
    newFeatures = ['premium_features', 'priority_support', 'exclusive_events'];
    newBadges = ['Gold Recruiter'];
  } else if (referrals >= 10) {
    newTier = 'silver';
    newFeatures = ['premium_features', 'priority_support'];
    newBadges = ['Silver Recruiter'];
  } else if (referrals >= 5) {
    newTier = 'bronze';
    newFeatures = ['premium_features'];
    newBadges = ['Bronze Recruiter'];
  }

  // Update tier and features
  this.referralPerks.currentTier = newTier;
  this.referralPerks.unlockedFeatures = newFeatures;
  this.referralPerks.specialBadges = newBadges;
  
  if (newFeatures.length > this.referralPerks.unlockedFeatures.length) {
    this.referralPerks.lastRewardDate = new Date();
    this.referralStats.totalRewardsEarned += 1;
  }

  return this.save();
};

// Static method to get referral tier requirements
UserSchema.statics.getReferralTiers = function() {
  return [
    { tier: 'bronze', minReferrals: 5, features: ['premium_features'], badges: ['Bronze Recruiter'] },
    { tier: 'silver', minReferrals: 10, features: ['premium_features', 'priority_support'], badges: ['Silver Recruiter'] },
    { tier: 'gold', minReferrals: 15, features: ['premium_features', 'priority_support', 'exclusive_events'], badges: ['Gold Recruiter'] },
    { tier: 'platinum', minReferrals: 25, features: ['premium_features', 'priority_support', 'exclusive_events', 'custom_profile'], badges: ['Platinum Recruiter', 'Community Builder'] },
    { tier: 'diamond', minReferrals: 50, features: ['premium_features', 'priority_support', 'exclusive_events', 'custom_profile', 'advanced_analytics'], badges: ['Diamond Recruiter', 'Community Builder', 'Network Master'] }
  ];
};

module.exports = mongoose.model('User', UserSchema);