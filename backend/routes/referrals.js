const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Referral = require('../models/Referral');

// Get user's referral information
router.get('/info', auth, async (req, res) => {
  try {
    console.log("Fetching referral info for user:", req.user.id);

    const user = await User.findById(req.user.id)
      .select("referralCode referralStats referralPerks name")
      .lean();

    if (!user) {
      console.log("User not found:", req.user.id);
      return res.status(404).json({ msg: "User not found" });
    }

    console.log("User found:", {
      id: user._id,
      name: user.name,
      hasReferralCode: !!user.referralCode,
      hasReferralStats: !!user.referralStats,
      hasReferralPerks: !!user.referralPerks,
    });

    // Initialize default values if missing
    if (!user.referralStats) {
      console.log("Initializing missing referralStats");
      user.referralStats = {
        totalReferrals: 0,
        successfulReferrals: 0,
        activeReferrals: 0,
        totalRewardsEarned: 0,
      };
    }

    if (!user.referralPerks) {
      console.log("Initializing missing referralPerks");
      user.referralPerks = {
        currentTier: "bronze",
        unlockedFeatures: [],
        specialBadges: [],
        lastRewardDate: null,
      };
    }

    // Get referral analytics with error handling
    let analytics;
    try {
      console.log("Fetching analytics for user:", user._id);
      analytics = await Referral.getAnalytics(user._id);
      console.log("Analytics fetched:", analytics);
    } catch (analyticsError) {
      console.error("Analytics error:", analyticsError);
      analytics = {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        conversionRate: 0,
      };
    }

    // Get recent referrals with error handling
    let recentReferrals;
    try {
      console.log("Fetching recent referrals for user:", user._id);
      recentReferrals = await Referral.find({ referrer: user._id })
        .populate("referred", "name createdAt")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      console.log("Recent referrals fetched:", recentReferrals.length);
    } catch (referralsError) {
      console.error("Recent referrals error:", referralsError);
      recentReferrals = [];
    }

    // Get tier information
    try {
      console.log("Getting tier information");
      const tierInfo = User.getReferralTiers();
      const currentTierIndex = tierInfo.findIndex(
        (t) => t.tier === user.referralPerks.currentTier
      );
      const nextTier = tierInfo[currentTierIndex + 1] || null;

      const responseData = {
        referralCode: user.referralCode,
        referralStats: user.referralStats,
        referralPerks: user.referralPerks,
        analytics,
        recentReferrals,
        tierInfo: {
          current: tierInfo[currentTierIndex >= 0 ? currentTierIndex : 0],
          next: nextTier,
          all: tierInfo,
        },
        referralLink: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/register?ref=${user.referralCode}`,
      };

      console.log("Sending response data for user:", user.name);
      res.json(responseData);
    } catch (tierError) {
      console.error("Tier info error:", tierError);
      throw tierError;
    }
  } catch (err) {
    console.error('Error fetching referral info:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get referral leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { limit = 20, timeframe = 'all' } = req.query;
    
    // Build match stage for timeframe
    let matchStage = {};
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
        matchStage.createdAt = { $gte: startDate };
      }
    }

    // Get top referrers
    const leaderboard = await User.find(matchStage)
      .select('name referralStats referralPerks.currentTier referralPerks.specialBadges')
      .sort({ 'referralStats.successfulReferrals': -1 })
      .limit(parseInt(limit))
      .lean();

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    res.json({
      leaderboard: rankedLeaderboard,
      timeframe,
      totalUsers: rankedLeaderboard.length
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Validate referral code
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const referrer = await User.findOne({ 
      referralCode: code.toUpperCase() 
    }).select('name referralStats referralPerks.currentTier');

    if (!referrer) {
      return res.status(404).json({ 
        valid: false, 
        msg: 'Invalid referral code' 
      });
    }

    res.json({
      valid: true,
      referrer: {
        name: referrer.name,
        tier: referrer.referralPerks.currentTier,
        totalReferrals: referrer.referralStats.successfulReferrals
      },
      msg: `You will be referred by ${referrer.name}`
    });
  } catch (err) {
    console.error('Error validating referral code:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get user's referral history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let filter = { referrer: req.user.id };
    if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const referrals = await Referral.find(filter)
      .populate('referred', 'name phoneNumber createdAt')
      .sort({ referralDate: -1 })
      .skip(offset)
      .limit(parseInt(limit))
      .lean();

    const total = await Referral.countDocuments(filter);

    res.json({
      referrals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching referral history:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Generate new referral code (if current one is compromised)
router.post('/regenerate-code', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate new unique referral code
    let newCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      newCode = user.generateReferralCode();
      const existing = await User.findOne({ referralCode: newCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ msg: 'Unable to generate unique referral code' });
    }

    user.referralCode = newCode;
    await user.save();

    res.json({
      msg: 'Referral code regenerated successfully',
      newReferralCode: newCode,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${newCode}`
    });
  } catch (err) {
    console.error('Error regenerating referral code:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get referral analytics for a specific time period
router.get('/analytics/:period', auth, async (req, res) => {
  try {
    const { period } = req.params; // 'week', 'month', 'year', 'all'
    
    const analytics = await Referral.getAnalytics(req.user.id, period);
    
    // Get period-specific data
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = null;
    }

    // Get trend data (daily/weekly/monthly based on period)
    const trendData = await Referral.aggregate([
      {
        $match: {
          referrer: req.user.id,
          ...(startDate && { referralDate: { $gte: startDate } })
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'year' ? '%Y-%m' : '%Y-%m-%d',
              date: '$referralDate'
            }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      analytics,
      trendData,
      period
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
