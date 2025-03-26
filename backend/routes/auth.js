const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// Import the auth middleware
const auth = require('../middleware/auth');
require('dotenv').config();

// Add a debug route to check if JWT_SECRET is loaded and token validation works
router.get('/check-env', (req, res) => {
  console.log('Debug route accessed');
  
  // Check .env variables
  const hasJwtSecret = !!process.env.JWT_SECRET;
  const mongoUri = process.env.MONGODB_URI || 'Not configured';
  const port = process.env.PORT || 'Using default';
  
  // Test JWT signing/verification if JWT_SECRET exists
  let jwtTest = { success: false, error: 'JWT_SECRET not configured' };
  
  if (hasJwtSecret) {
    try {
      // Create a test token
      const testPayload = { test: 'data' };
      const testToken = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '5m' });
      
      // Try to verify the token
      const verified = jwt.verify(testToken, process.env.JWT_SECRET);
      jwtTest = { 
        success: true, 
        tokenCreated: !!testToken,
        tokenVerified: !!verified,
      };
    } catch (err) {
      jwtTest = { 
        success: false, 
        error: err.message 
      };
    }
  }
  
  res.json({ 
    message: 'Environment check successful',
    hasJwtSecret,
    jwtTest,
    envVars: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: port,
      MONGODB_URI: mongoUri ? 'Configured' : 'Not configured',
      JWT_SECRET: hasJwtSecret ? 'Configured' : 'NOT CONFIGURED - THIS IS REQUIRED'
    },
    serverTime: new Date().toISOString()
  });
});

router.post('/register', async (req, res) => {
  const { name, phoneNumber, occupation, password } = req.body;
  
  // Add validation for required fields
  if (!name || !phoneNumber || !occupation || !password) {
    return res.status(400).json({ 
      msg: 'Missing required fields',
      missing: Object.entries({name, phoneNumber, occupation, password})
        .filter(([_, value]) => !value)
        .map(([key]) => key)
    });
  }

  try {
    // Enhanced duplicate user check
    let existingUser = await User.findOne({ phoneNumber });
    
    if (existingUser) {
      // Return more informative error with specific error code
      return res.status(409).json({ 
        msg: 'User with this phone number already exists. Please log in instead.',
        errorType: 'DUPLICATE_USER',
        field: 'phoneNumber'
      });
    }

    // No duplicate found, proceed with user creation
    const user = new User({ name, phoneNumber, occupation, password });
    user.password = await bcrypt.hash(password, 10);
    
    try {
      await user.save();
    } catch (validationError) {
      // Handle mongoose validation errors
      if (validationError.name === 'ValidationError') {
        const errors = Object.keys(validationError.errors).reduce((acc, key) => {
          acc[key] = validationError.errors[key].message;
          return acc;
        }, {});
        return res.status(400).json({ msg: 'Validation error', errors });
      }
      throw validationError;
    }

    const payload = { user: { id: user.id } };
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: 'JWT_SECRET not configured' });
    }
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update the login route with better error handling
router.post('/login', async (req, res) => {
  // Log the request for debugging
  console.log('Login attempt received:', {
    phoneNumber: req.body.phoneNumber ? `${req.body.phoneNumber.slice(0, 3)}...` : 'missing',
    hasPassword: !!req.body.password
  });
  
  const { phoneNumber, password } = req.body;
  
  // Validate input with detailed error messages
  if (!phoneNumber && !password) {
    return res.status(400).json({ 
      msg: 'Please provide both phone number and password',
      missingFields: ['phoneNumber', 'password']
    });
  }
  
  if (!phoneNumber) {
    return res.status(400).json({ 
      msg: 'Please provide a phone number',
      missingFields: ['phoneNumber']
    });
  }
  
  if (!password) {
    return res.status(400).json({ 
      msg: 'Please provide a password',
      missingFields: ['password']
    });
  }
  
  try {
    // Import the isDbConnected helper 
    const { isDbConnected } = require('../config/db');
    
    // Check if MongoDB is connected
    if (!isDbConnected()) {
      console.error('MongoDB not connected during login attempt');
      return res.status(500).json({ 
        msg: 'Database connection is not established. Please try again.',
        error: 'NO_DB_CONNECTION'
      });
    }
    
    // Find user by phone number
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      console.log(`Login failed: No user found with phone number starting with ${phoneNumber.substring(0, 3)}`);
      return res.status(400).json({ msg: 'Invalid credentials', field: 'phoneNumber' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`Login failed: Invalid password for user ${user.id} (${user.name})`);
      return res.status(400).json({ msg: 'Invalid credentials', field: 'password' });
    }

    // Create token payload
    const payload = { 
      user: { 
        id: user.id 
      }
    };
    
    // Verify JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ msg: 'Server configuration error' });
    }
    
    // Generate and return token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Log successful login for debugging
    console.log(`User ${user.id} (${user.name}) logged in successfully`);
    
    // Return token with explicit 200 status
    return res.status(200).json({ 
      token,
      success: true
    });
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    
    // More descriptive error messages based on the error type
    if (err.name === 'MongoNetworkError') {
      return res.status(500).json({ 
        msg: 'Database connection issue. Please try again later.', 
        error: 'MONGO_NETWORK_ERROR' 
      });
    }
    
    if (err.message.includes('Client must be connected')) {
      return res.status(500).json({ 
        msg: 'Database connection is not ready. Please try again.', 
        error: 'DB_NOT_CONNECTED' 
      });
    }
    
    return res.status(500).json({ 
      msg: 'Server error during login process. Please try again later.',
      errorType: err.name, 
      errorDetails: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// Admin login route - similar to regular login but checks for admin privileges
router.post('/admin-login', async (req, res) => {
  console.log('Admin login attempt received:', {
    phoneNumber: req.body.phoneNumber ? `${req.body.phoneNumber.slice(0, 3)}...` : 'missing',
    hasPassword: !!req.body.password
  });
  
  const { phoneNumber, password } = req.body;
  
  // Validate input
  if (!phoneNumber || !password) {
    return res.status(400).json({ 
      msg: 'Please provide both phone number and password',
      missingFields: !phoneNumber ? ['phoneNumber'] : !password ? ['password'] : ['phoneNumber', 'password']
    });
  }
  
  try {
    // Import the isDbConnected helper 
    const { isDbConnected } = require('../config/db');
    
    // Check if MongoDB is connected
    if (!isDbConnected()) {
      console.error('MongoDB not connected during admin login attempt');
      return res.status(500).json({ 
        msg: 'Database connection is not established. Please try again.',
        error: 'NO_DB_CONNECTION'
      });
    }
    
    // Find user by phone number
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      console.log(`Admin login failed: No user found with phone number starting with ${phoneNumber.substring(0, 3)}`);
      return res.status(400).json({ msg: 'Invalid credentials', field: 'phoneNumber' });
    }

    // Check if user is an admin
    if (user.planType !== 'admin') {
      console.log(`Admin login failed: User ${user.id} (${user.name}) is not an admin`);
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.', field: 'phoneNumber' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`Admin login failed: Invalid password for admin user ${user.id} (${user.name})`);
      return res.status(400).json({ msg: 'Invalid credentials', field: 'password' });
    }

    // Create token payload
    const payload = { 
      user: { 
        id: user.id 
      }
    };
    
    // Verify JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ msg: 'Server configuration error' });
    }
    
    // Generate and return token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Log successful login for debugging
    console.log(`Admin user ${user.id} (${user.name}) logged in successfully`);
    
    // Return token with explicit 200 status
    return res.status(200).json({ 
      token,
      success: true,
      message: 'Admin login successful'
    });
  } catch (err) {
    console.error('Admin login error:', err.message, err.stack);
    
    // More descriptive error messages based on the error type
    if (err.name === 'MongoNetworkError') {
      return res.status(500).json({ 
        msg: 'Database connection issue. Please try again later.', 
        error: 'MONGO_NETWORK_ERROR' 
      });
    }
    
    if (err.message.includes('Client must be connected')) {
      return res.status(500).json({ 
        msg: 'Database connection is not ready. Please try again.', 
        error: 'DB_NOT_CONNECTED' 
      });
    }
    
    return res.status(500).json({ 
      msg: 'Server error during login process. Please try again later.',
      errorType: err.name, 
      errorDetails: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// Add a new endpoint to verify token status
router.get('/token-status', auth, (req, res) => {
  // If the auth middleware passes, the token is valid
  return res.json({ 
    valid: true, 
    userId: req.user.id,
    message: 'Token is valid'
  });
});

// Add a token verification endpoint
router.post('/verify-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ msg: 'No token provided' });
  }
  
  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ 
        msg: 'Server configuration error: JWT_SECRET missing',
        envError: true
      });
    }
    
    // Check if this token is already known to be expired
    // (Import the cache if implemented in the auth middleware)
    const { getExpiredTokensCache } = require('../middleware/auth');
    const expiredTokensCache = getExpiredTokensCache();
    const tokenLastChars = token.slice(-20);
    
    if (expiredTokensCache && expiredTokensCache.has(tokenLastChars)) {
      const expiredData = expiredTokensCache.get(tokenLastChars);
      // No need to log again - we already know this token is expired
      return res.status(401).json({
        valid: false,
        errorType: 'TokenExpiredError',
        expiredAt: expiredData.expiredAt,
        msg: 'Token has expired (cached response)'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return res.status(200).json({
      valid: true,
      user: decoded.user,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (err) {
    // If this is a token expiration error, add it to the cache
    if (err.name === 'TokenExpiredError') {
      const currentTime = Date.now();
      const tokenLastChars = token.slice(-20);
      
      // Get the cache if available
      const { getExpiredTokensCache } = require('../middleware/auth');
      const expiredTokensCache = getExpiredTokensCache();
      
      if (expiredTokensCache) {
        expiredTokensCache.set(tokenLastChars, {
          timestamp: currentTime,
          expiredAt: err.expiredAt
        });
      }
      
      // Log the error (but only once per token)
      console.log(`Token verified as expired at ${err.expiredAt}`);
      
      return res.status(401).json({
        valid: false,
        errorType: 'TokenExpiredError',
        expiredAt: err.expiredAt,
        msg: 'Token has expired'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        valid: false,
        errorType: 'JsonWebTokenError',
        msg: err.message
      });
    } else {
      return res.status(500).json({
        valid: false,
        errorType: err.name,
        msg: err.message
      });
    }
  }
});

// DEVELOPMENT ONLY - DELETE IN PRODUCTION
// Temporary route to create an admin user for testing
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-create-admin', async (req, res) => {
    try {
      const { phoneNumber, password } = req.body;
      
      if (!phoneNumber || !password) {
        return res.status(400).json({ msg: 'Please provide phone number and password' });
      }
      
      // Find the user
      const user = await User.findOne({ phoneNumber });
      
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ msg: 'Invalid credentials' });
      }
      
      // Update user to admin
      user.planType = 'admin';
      await user.save();
      
      res.json({ 
        msg: 'User promoted to admin successfully',
        user: {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          planType: user.planType
        }
      });
    } catch (err) {
      console.error('Error in dev admin creation:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  });
}

module.exports = router;