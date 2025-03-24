const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Listing = require('../models/Listing');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    // Get user statistics
    const userStats = {
      total: await User.countDocuments({}),
      active: await User.countDocuments({ accountStatus: 'active' }),
      deactivated: await User.countDocuments({ accountStatus: 'deactivated' }),
      suspended: await User.countDocuments({ accountStatus: 'suspended' }),
      public: await User.countDocuments({ isPublic: true }),
      premium: await User.countDocuments({ planType: 'premium' }),
      admins: await User.countDocuments({ planType: 'admin' })
    };
    
    // Get listing statistics
    const listingStats = {
      total: await Listing.countDocuments({}),
      byCategory: {}
    };
    
    // Get listing counts by category
    const categories = await Listing.distinct('category');
    for (const category of categories) {
      listingStats.byCategory[category] = await Listing.countDocuments({ category });
    }
    
    // Get recent users
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name phoneNumber planType accountStatus createdAt');
      
    res.json({
      userStats,
      listingStats,
      recentUsers
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering
 * @access  Admin
 */
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      planType, 
      accountStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (planType) {
      query.planType = planType;
    }
    
    if (accountStatus) {
      query.accountStatus = accountStatus;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { occupation: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');
      
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Admin user list error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get detailed user information
 * @access  Admin
 */
router.get('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get additional user information
    const userListings = await Listing.find({ user: req.params.userId })
      .select('title category createdAt');
      
    res.json({
      user,
      listings: userListings
    });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user details as admin
 * @access  Admin
 */
router.put('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { 
      planType, 
      accountStatus, 
      isPublic,
      name,
      occupation
    } = req.body;
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update fields if provided
    if (planType) user.planType = planType;
    if (accountStatus) user.accountStatus = accountStatus;
    if (isPublic !== undefined) user.isPublic = isPublic;
    if (name) user.name = name;
    if (occupation) user.occupation = occupation;
    
    await user.save();
    
    res.json({
      msg: 'User updated successfully',
      user
    });
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user
 * @access  Admin
 */
router.post('/users', auth, adminAuth, async (req, res) => {
  try {
    const { 
      name, 
      phoneNumber, 
      password,
      occupation, 
      planType, 
      accountStatus, 
      isPublic 
    } = req.body;
    
    // Validate required fields
    if (!name || !phoneNumber || !password) {
      return res.status(400).json({ 
        msg: 'Name, phone number, and password are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ 
        msg: 'User with this phone number already exists' 
      });
    }
    
    // Create new user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      name,
      phoneNumber,
      password: hashedPassword,
      occupation: occupation || '',
      planType: planType || 'free',
      accountStatus: accountStatus || 'active',
      isPublic: isPublic !== undefined ? isPublic : true
    });
    
    await newUser.save();
    
    // Return user data without password
    const userData = newUser.toObject();
    delete userData.password;
    
    res.status(201).json({
      msg: 'User created successfully',
      user: userData
    });
  } catch (err) {
    console.error('Admin user creation error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete a user
 * @access  Admin
 */
router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    // Don't allow deleting self
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ msg: 'Cannot delete your own account' });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Delete user's listings first
    await Listing.deleteMany({ user: req.params.userId });
    
    // Then delete the user
    await User.findByIdAndDelete(req.params.userId);
    
    res.json({ msg: 'User and associated listings deleted successfully' });
  } catch (err) {
    console.error('Admin user deletion error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/listings
 * @desc    Get all listings with filtering
 * @access  Admin
 */
router.get('/listings', auth, adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const listings = await Listing.find(query)
      .populate('user', 'name phoneNumber')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await Listing.countDocuments(query);
    
    res.json({
      listings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Admin listing list error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   PUT /api/admin/listings/:listingId
 * @desc    Update a listing as admin
 * @access  Admin
 */
router.put('/listings/:listingId', auth, adminAuth, async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      approved
    } = req.body;
    
    const listing = await Listing.findById(req.params.listingId);
    
    if (!listing) {
      return res.status(404).json({ msg: 'Listing not found' });
    }
    
    // Update fields if provided
    if (title) listing.title = title;
    if (category) listing.category = category;
    if (description) listing.description = description;
    if (approved !== undefined) listing.approved = approved;
    
    await listing.save();
    
    res.json({
      msg: 'Listing updated successfully',
      listing
    });
  } catch (err) {
    console.error('Admin listing update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
