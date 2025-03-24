const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    // Check payload size early
    const profileImageSize = req.body.profileImage ? 
      Buffer.byteLength(req.body.profileImage) / (1024 * 1024) : 0; // Size in MB
    
    if (profileImageSize > 8) {
      return res.status(413).json({ 
        msg: 'Profile image too large',
        details: `Image size: ${profileImageSize.toFixed(2)}MB, max allowed: 8MB`
      });
    }
    
    const { bio, address, interests, profileImage } = req.body;
    const user = await User.findById(req.user.id);
    
    user.bio = bio || user.bio;
    user.address = address || user.address;
    user.interests = interests || user.interests;
    
    // Handle profile image update if provided
    if (profileImage) {
      user.profileImage = profileImage;
    }
    
    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   DELETE /api/profile/me
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/me', auth, async (req, res) => {
  try {
    // Find and delete the user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ msg: 'User account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   PUT /api/profile/deactivate
 * @desc    Deactivate user account (soft delete)
 * @access  Private
 */
router.put('/deactivate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    user.accountStatus = 'deactivated';
    user.isPublic = false; // Hide deactivated profiles from directory
    await user.save();
    
    res.json({ 
      msg: 'Account deactivated successfully',
      user: {
        id: user._id,
        accountStatus: user.accountStatus
      }
    });
  } catch (err) {
    console.error('Error deactivating account:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   PUT /api/profile/reactivate
 * @desc    Reactivate a deactivated user account
 * @access  Private
 */
router.put('/reactivate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.accountStatus !== 'deactivated') {
      return res.status(400).json({ msg: 'Account is not deactivated' });
    }
    
    user.accountStatus = 'active';
    // Don't automatically make profile public again
    await user.save();
    
    res.json({ 
      msg: 'Account reactivated successfully',
      user: {
        id: user._id,
        accountStatus: user.accountStatus
      }
    });
  } catch (err) {
    console.error('Error reactivating account:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;