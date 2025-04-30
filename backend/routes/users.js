const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { ensureConnected } = require('../config/db');

// Simple in-memory cache for user profile requests
const profileCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get('/:userId', auth, async (req, res) => {
  try {
    // Explicitly ensure DB is connected before any operations
    const connection = await ensureConnected();
    if (!connection) {
      throw new Error('Database connection could not be established');
    }

    const userId = req.params.userId;
    const cacheKey = userId;
    const now = Date.now();
    
    // Check cache first
    const cachedProfile = profileCache.get(cacheKey);
    if (cachedProfile && (now - cachedProfile.timestamp < CACHE_TTL)) {
      // Return cached profile and update timestamp
      return res.json(cachedProfile.profile);
    }
    
    // Not in cache or cache expired, fetch from database
    const user = await User.findById(userId).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // If the user's profile is not public, only admins can view it
    if (!user.isPublic && req.user.id !== userId) {
      // Get the requesting user to check if they're an admin
      const requestingUser = await User.findById(req.user.id);
      if (!requestingUser || requestingUser.planType !== 'admin') {
        return res.status(403).json({ msg: 'This profile is private' });
      }
    }
    
    // Cache the profile
    profileCache.set(cacheKey, {
      profile: user,
      timestamp: now
    });
    
    // Periodically clean old cache entries
    if (profileCache.size > 50) {
      for (const [key, value] of profileCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          profileCache.delete(key);
        }
      }
    }
    
    // Return the user profile
    res.json(user);
  } catch (err) {
    console.error('Get user by ID error:', err.message);
    
    // Special handling for connection errors
    if (err.name === 'MongoNotConnectedError' || 
        err.message.includes('Client must be connected')) {
      return res.status(500).json({ 
        msg: 'Database connection is not available. Please try again in a moment.',
        error: 'DB_NOT_CONNECTED'
      });
    }
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.name });
  }
});

/**
 * @route   GET /api/users/:userId/public
 * @desc    Get limited public user profile by ID (no authentication required)
 * @access  Public
 */
router.get('/:userId/public', async (req, res) => {
  try {
    // Explicitly ensure DB is connected before any operations
    const connection = await ensureConnected();
    if (!connection) {
      throw new Error('Database connection could not be established');
    }

    const userId = req.params.userId;
    const publicCacheKey = `public-${userId}`;
    const now = Date.now();
    
    // Check cache first
    const cachedPublicProfile = profileCache.get(publicCacheKey);
    if (cachedPublicProfile && (now - cachedPublicProfile.timestamp < CACHE_TTL)) {
      // Return cached public profile
      return res.json(cachedPublicProfile.profile);
    }
    
    // Not in cache or cache expired, fetch from database
    // Only select fields that should be visible to non-authenticated users
    const user = await User.findById(userId).select('name bio occupation profileImage createdAt planType isPublic');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Only return data if the profile is public
    if (!user.isPublic) {
      return res.status(403).json({ msg: 'This profile is private' });
    }
    
    // Create limited public profile object
    const publicProfile = {
      _id: user._id,
      name: user.name,
      bio: user.bio,
      occupation: user.occupation,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      // Include minimal account info but don't expose sensitive details
      planType: user.planType === 'premium' ? 'premium' : 'basic', // Simplify plan types for public view
      isPublic: user.isPublic
    };
    
    // Cache the public profile
    profileCache.set(publicCacheKey, {
      profile: publicProfile,
      timestamp: now
    });
    
    // Return the limited public profile
    res.json(publicProfile);
  } catch (err) {
    console.error('Get public user profile error:', err.message);
    
    // Special handling for connection errors
    if (err.name === 'MongoNotConnectedError' || 
        err.message.includes('Client must be connected')) {
      return res.status(500).json({ 
        msg: 'Database connection is not available. Please try again in a moment.',
        error: 'DB_NOT_CONNECTED'
      });
    }
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.name });
  }
});

module.exports = router;
