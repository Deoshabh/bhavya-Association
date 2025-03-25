const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { ensureConnected } = require('../config/db');

// Configuration settings
const CONFIG = {
  // Set this to false to show all profiles regardless of visibility
  enforcePublicFilter: true,
  // Set this to false to show all accounts regardless of status
  enforceActiveFilter: true,
  // Always exclude the requesting user from results
  excludeCurrentUser: true,
  // Maximum users to return in directory
  limit: 100,
  // Always hide admin users
  hideAdminUsers: true
};

/**
 * @route   GET /api/directory/config
 * @desc    Get directory configuration
 * @access  Private (admin)
 */
router.get('/config', auth, async (req, res) => {
  try {
    // Get the requesting user to check if they're an admin
    const user = await User.findById(req.user.id);
    
    if (!user || user.planType !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    res.json({
      config: CONFIG,
      counts: {
        totalUsers: await User.countDocuments({}),
        publicUsers: await User.countDocuments({ isPublic: true }),
        activeUsers: await User.countDocuments({ accountStatus: 'active' }),
        eligibleUsers: await User.countDocuments({
          isPublic: true,
          accountStatus: 'active'
        })
      }
    });
  } catch (err) {
    console.error('Config retrieval error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   PUT /api/directory/config
 * @desc    Update directory configuration
 * @access  Private (admin)
 */
router.put('/config', auth, async (req, res) => {
  try {
    // Get the requesting user to check if they're an admin
    const user = await User.findById(req.user.id);
    
    if (!user || user.planType !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    // Update configuration
    const { enforcePublicFilter, enforceActiveFilter, excludeCurrentUser, limit } = req.body;
    
    if (typeof enforcePublicFilter === 'boolean') {
      CONFIG.enforcePublicFilter = enforcePublicFilter;
    }
    
    if (typeof enforceActiveFilter === 'boolean') {
      CONFIG.enforceActiveFilter = enforceActiveFilter;
    }
    
    if (typeof excludeCurrentUser === 'boolean') {
      CONFIG.excludeCurrentUser = excludeCurrentUser;
    }
    
    if (typeof limit === 'number' && limit > 0) {
      CONFIG.limit = limit;
    }
    
    res.json({ 
      msg: 'Directory configuration updated',
      config: CONFIG
    });
  } catch (err) {
    console.error('Config update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/directory
 * @desc    Get all users for directory
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    await ensureConnected();
    
    // Get the current user for exclusion
    const currentUserId = req.user.id;
    
    // Build query
    const query = {};
    
    // Only show public profiles if enforced
    if (CONFIG.enforcePublicFilter) {
      query.isPublic = true;
    }
    
    // Only show active accounts if enforced
    if (CONFIG.enforceActiveFilter) {
      query.accountStatus = 'active';
    }
    
    // Exclude current user if configured
    if (CONFIG.excludeCurrentUser) {
      query._id = { $ne: currentUserId };
    }
    
    // Always hide admin users regardless of other settings
    if (CONFIG.hideAdminUsers) {
      query.planType = { $ne: 'admin' };
    }
    
    // Get all users matching query with sensitive fields excluded
    const users = await User.find(query)
      .select('-password -__v')
      .sort({ name: 1 })
      .limit(CONFIG.limit);
    
    res.json(users);
  } catch (err) {
    console.error('Directory fetch error:', err);
    res.status(500).json({ msg: 'Server error when fetching directory' });
  }
});

/**
 * @route   POST /api/directory/toggle-visibility
 * @desc    Toggle the public visibility of user's profile in directory
 * @access  Private
 */
router.post('/toggle-visibility', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Toggle the isPublic flag
    user.isPublic = !user.isPublic;
    await user.save();
    
    res.json({
      isPublic: user.isPublic,
      message: user.isPublic ? 'Your profile is now visible in directory' : 'Your profile is now hidden from directory'
    });
  } catch (err) {
    console.error('Toggle visibility error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/directory/debug
 * @desc    Get directory debug information
 * @access  Public
 */
router.get('/debug', async (req, res) => {
  try {
    console.log('Directory debug endpoint accessed');
    
    // Check if we can find users that should be visible
    const visibleUsers = await User.find({
      isPublic: true,
      accountStatus: 'active'
    }).select('name phoneNumber').limit(5);
    
    // Get count of all users and visible users
    const totalUsers = await User.countDocuments({});
    const visibleCount = await User.countDocuments({
      isPublic: true,
      accountStatus: 'active'
    });
    
    console.log(`Found ${visibleCount} visible users out of ${totalUsers} total users`);
    
    res.json({
      debug: true,
      counts: {
        total: totalUsers,
        visible: visibleCount,
        percentage: Math.round((visibleCount / totalUsers) * 100)
      },
      sample: visibleUsers.map(user => ({
        id: user._id,
        name: user.name,
        phone: user.phoneNumber ? user.phoneNumber.substring(0, 3) + '***' : 'N/A'
      })),
      query: {
        isPublic: true,
        accountStatus: 'active'
      }
    });
  } catch (err) {
    console.error('Directory debug error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
