const User = require('../models/User');

/**
 * Middleware to check if user has admin privileges
 * Must be used after the auth middleware
 */
const adminAuth = async (req, res, next) => {
  try {
    // Ensure req.user exists (auth middleware should run first)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Authentication required' });
    }
    
    // Find the user to check if they're an admin
    const user = await User.findById(req.user.id).select('planType');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.planType !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }
    
    // User is an admin, proceed to the route handler
    next();
  } catch (err) {
    console.error('Admin authorization error:', err);
    res.status(500).json({ msg: 'Server error during admin authorization' });
  }
};

module.exports = adminAuth;
