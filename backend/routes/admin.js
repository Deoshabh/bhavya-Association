const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Referral = require('../models/Referral'); // Add Referral model import

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
    
    // Get recent users with referral information
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name phoneNumber planType accountStatus createdAt referredBy')
      .populate('referredBy', 'name referralCode');
      
    // Get comprehensive referral statistics
    const referralStats = {
      total: await Referral.countDocuments({}),
      completed: await Referral.countDocuments({ status: 'completed' }),
      pending: await Referral.countDocuments({ status: 'pending' }),
      cancelled: await Referral.countDocuments({ status: 'cancelled' }),
      rewardsGiven: await Referral.countDocuments({ rewardGiven: true }),
      totalUsersWithReferrals: await User.countDocuments({ 'referralStats.totalReferrals': { $gt: 0 } }),
      totalReferredUsers: await User.countDocuments({ referredBy: { $ne: null } })
    };

    // Get referral tier distribution
    const tierDistribution = await User.aggregate([
      {
        $group: {
          _id: '$referralPerks.currentTier',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top referrers for admin dashboard
    const topReferrers = await User.find({ 'referralStats.successfulReferrals': { $gt: 0 } })
      .sort({ 'referralStats.successfulReferrals': -1 })
      .limit(10)
      .select('name phoneNumber referralStats referralPerks.currentTier referralCode createdAt');

    // Get recent referral activities
    const recentReferrals = await Referral.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('referrer', 'name referralCode')
      .populate('referred', 'name phoneNumber')
      .select('referrer referred status referralDate completionDate rewardGiven');

    res.json({
      userStats,
      listingStats,
      referralStats,
      tierDistribution,
      topReferrers,
      recentUsers,
      recentReferrals
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

    // Get user's referral information
    const referralInfo = {
      referralsGiven: await Referral.find({ referrer: req.params.userId })
        .populate('referred', 'name phoneNumber createdAt')
        .sort({ createdAt: -1 }),
      referralsReceived: await Referral.find({ referred: req.params.userId })
        .populate('referrer', 'name phoneNumber referralCode')
        .sort({ createdAt: -1 }),
      totalReferrals: user.referralStats?.totalReferrals || 0,
      successfulReferrals: user.referralStats?.successfulReferrals || 0,
      currentTier: user.referralPerks?.currentTier || 'bronze',
      referralCode: user.referralCode
    };
      
    res.json({
      user,
      listings: userListings,
      referralInfo
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

/**
 * @route   GET /api/admin/directory-diagnostic
 * @desc    Get directory visibility diagnostic information
 * @access  Admin
 */
router.get('/directory-diagnostic', auth, adminAuth, async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments({});
    
    // Get users visible in directory
    const visibleUsers = await User.find({
      isPublic: true,
      accountStatus: 'active'
    }).countDocuments();
    
    // Get users with isPublic: false
    const privateUsers = await User.countDocuments({ isPublic: false });
    
    // Get users with non-active status
    const inactiveUsers = await User.countDocuments({ accountStatus: { $ne: 'active' } });

    // Get sample data - first 5 visible users
    const sampleUsers = await User.find({
      isPublic: true,
      accountStatus: 'active'
    })
    .select('name phoneNumber isPublic accountStatus planType')
    .limit(5);
    
    res.json({
      stats: {
        totalUsers,
        visibleUsers,
        privateUsers,
        inactiveUsers,
        visibilityRate: Math.round(visibleUsers/totalUsers*100)
      },
      sampleUsers
    });
  } catch (err) {
    console.error('Directory diagnostic error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/qa/stats
 * @desc    Get Q&A statistics
 * @access  Admin
 */
router.get('/qa/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments({});
    const activeQuestions = await Question.countDocuments({ status: 'active' });
    const totalAnswers = await Answer.countDocuments({});
    const reportedContent = await Question.countDocuments({ status: 'reported' }) + 
                           await Answer.countDocuments({ status: 'reported' });

    res.json({
      totalQuestions,
      activeQuestions,
      totalAnswers,
      reportedContent
    });
  } catch (err) {
    console.error('Q&A stats error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/questions
 * @desc    Get all questions with filtering
 * @access  Admin
 */
router.get('/questions', auth, adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      category,
      type,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const questions = await Question.find(query)
      .populate('author', 'name planType')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await Question.countDocuments(query);
    
    res.json({
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Admin questions list error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/answers
 * @desc    Get all answers with filtering
 * @access  Admin
 */
router.get('/answers', auth, adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const answers = await Answer.find(query)
      .populate('author', 'name planType')
      .populate('question', 'title')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await Answer.countDocuments(query);
    
    res.json({
      answers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Admin answers list error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   PUT /api/admin/questions/:id
 * @desc    Update question (admin only)
 * @access  Admin
 */
router.put('/questions/:id', auth, adminAuth, async (req, res) => {
  try {
    const {
      status,
      featured,
      priority
    } = req.body;

    const updateData = {};

    if (status) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;
    if (priority) updateData.priority = priority;

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name planType');

    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    res.json({
      msg: 'Question updated successfully',
      question
    });
  } catch (err) {
    console.error('Admin question update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   PUT /api/admin/answers/:id
 * @desc    Update answer (admin only)
 * @access  Admin
 */
router.put('/answers/:id', auth, adminAuth, async (req, res) => {
  try {
    const {
      status,
      isBestAnswer
    } = req.body;

    const updateData = {};

    if (status) updateData.status = status;
    if (isBestAnswer !== undefined) updateData.isBestAnswer = isBestAnswer;

    const answer = await Answer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name planType')
     .populate('question', 'title');

    if (!answer) {
      return res.status(404).json({ msg: 'Answer not found' });
    }

    res.json({
      msg: 'Answer updated successfully',
      answer
    });
  } catch (err) {
    console.error('Admin answer update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   DELETE /api/admin/questions/:id
 * @desc    Delete question (admin only)
 * @access  Admin
 */
router.delete('/questions/:id', auth, adminAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    // Delete all answers associated with this question
    await Answer.deleteMany({ question: req.params.id });

    // Delete the question
    await Question.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Question and associated answers deleted successfully' });
  } catch (err) {
    console.error('Admin question deletion error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   DELETE /api/admin/answers/:id
 * @desc    Delete answer (admin only)
 * @access  Admin
 */
router.delete('/answers/:id', auth, adminAuth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    
    if (!answer) {
      return res.status(404).json({ msg: 'Answer not found' });
    }

    // Update question's answer count
    await Question.findByIdAndUpdate(
      answer.question,
      { $inc: { answerCount: -1 } }
    );

    // Delete the answer
    await Answer.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Answer deleted successfully' });
  } catch (err) {
    console.error('Admin answer deletion error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==================== REFERRAL MANAGEMENT ROUTES ====================

/**
 * @route   GET /api/admin/referrals
 * @desc    Get all referrals with filtering and analytics
 * @access  Admin
 */
router.get('/referrals', auth, adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      status,
      referrer,
      referred,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo
    } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (referrer) {
      query.referrer = referrer;
    }
    
    if (referred) {
      query.referred = referred;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    // Search in referrer/referred names
    if (search) {
      const searchUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { referralCode: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = searchUsers.map(user => user._id);
      query.$or = [
        { referrer: { $in: userIds } },
        { referred: { $in: userIds } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const referrals = await Referral.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('referrer', 'name phoneNumber referralCode referralPerks.currentTier')
      .populate('referred', 'name phoneNumber createdAt accountStatus');
      
    // Get total count for pagination
    const total = await Referral.countDocuments(query);
    
    res.json({
      referrals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Admin referral list error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/referrals/analytics
 * @desc    Get comprehensive referral analytics
 * @access  Admin
 */
router.get('/referrals/analytics', auth, adminAuth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Overall referral statistics
    const overallStats = {
      totalReferrals: await Referral.countDocuments({}),
      completedReferrals: await Referral.countDocuments({ status: 'completed' }),
      pendingReferrals: await Referral.countDocuments({ status: 'pending' }),
      cancelledReferrals: await Referral.countDocuments({ status: 'cancelled' }),
      rewardsGiven: await Referral.countDocuments({ rewardGiven: true }),
      conversionRate: 0
    };

    // Calculate conversion rate
    if (overallStats.totalReferrals > 0) {
      overallStats.conversionRate = (overallStats.completedReferrals / overallStats.totalReferrals * 100).toFixed(2);
    }

    // Period-specific statistics
    const periodStats = {
      totalReferrals: await Referral.countDocuments({ createdAt: { $gte: startDate } }),
      completedReferrals: await Referral.countDocuments({ 
        status: 'completed', 
        createdAt: { $gte: startDate } 
      }),
      newReferrers: await User.countDocuments({ 
        'referralStats.totalReferrals': { $gt: 0 },
        createdAt: { $gte: startDate }
      })
    };

    // Top referrers with detailed stats
    const topReferrers = await User.find({ 'referralStats.successfulReferrals': { $gt: 0 } })
      .sort({ 'referralStats.successfulReferrals': -1 })
      .limit(20)
      .select('name phoneNumber referralStats referralPerks referralCode createdAt')
      .lean();

    // Tier distribution
    const tierDistribution = await User.aggregate([
      { 
        $match: { 'referralStats.totalReferrals': { $gt: 0 } } 
      },
      {
        $group: {
          _id: '$referralPerks.currentTier',
          count: { $sum: 1 },
          totalReferrals: { $sum: '$referralStats.successfulReferrals' }
        }
      },
      { $sort: { totalReferrals: -1 } }
    ]);

    // Daily referral trends for the period
    const dailyTrends = await Referral.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Referral source analysis
    const sourceAnalysis = await Referral.aggregate([
      {
        $group: {
          _id: '$metadata.source',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      period,
      overallStats,
      periodStats,
      topReferrers,
      tierDistribution,
      dailyTrends,
      sourceAnalysis
    });
  } catch (err) {
    console.error('Admin referral analytics error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/referrals/leaderboard
 * @desc    Get referral leaderboard with extended information
 * @access  Admin
 */
router.get('/referrals/leaderboard', auth, adminAuth, async (req, res) => {
  try {
    const { limit = 50, sortBy = 'successfulReferrals' } = req.query;
    
    const leaderboard = await User.find({ 'referralStats.totalReferrals': { $gt: 0 } })
      .sort({ [`referralStats.${sortBy}`]: -1 })
      .limit(parseInt(limit))
      .select('name phoneNumber referralStats referralPerks referralCode createdAt accountStatus')
      .lean();

    // Add additional stats for each user
    const enrichedLeaderboard = await Promise.all(
      leaderboard.map(async (user) => {
        const recentReferrals = await Referral.find({ referrer: user._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('referred', 'name createdAt')
          .select('referred status createdAt');

        return {
          ...user,
          recentReferrals,
          joinedDaysAgo: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24))
        };
      })
    );

    res.json({
      leaderboard: enrichedLeaderboard,
      totalActiveReferrers: leaderboard.length
    });
  } catch (err) {
    console.error('Admin referral leaderboard error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   PUT /api/admin/referrals/:referralId
 * @desc    Update referral status or reward status
 * @access  Admin
 */
router.put('/referrals/:referralId', auth, adminAuth, async (req, res) => {
  try {
    const { status, rewardGiven, notes } = req.body;
    
    const referral = await Referral.findById(req.params.referralId)
      .populate('referrer', 'name')
      .populate('referred', 'name');
    
    if (!referral) {
      return res.status(404).json({ msg: 'Referral not found' });
    }
    
    const updates = {};
    
    if (status) {
      updates.status = status;
      if (status === 'completed' && !referral.completionDate) {
        updates.completionDate = new Date();
      }
    }
    
    if (rewardGiven !== undefined) {
      updates.rewardGiven = rewardGiven;
    }
    
    if (notes) {
      updates['metadata.adminNotes'] = notes;
    }
    
    const updatedReferral = await Referral.findByIdAndUpdate(
      req.params.referralId,
      updates,
      { new: true }
    ).populate('referrer', 'name').populate('referred', 'name');
    
    // If marking as completed, update referrer stats
    if (status === 'completed' && referral.status !== 'completed') {
      await User.findByIdAndUpdate(referral.referrer._id, {
        $inc: { 'referralStats.successfulReferrals': 1 }
      });
      
      // Check if tier should be updated
      const referrer = await User.findById(referral.referrer._id);
      await referrer.updateReferralTier();
    }
    
    res.json({
      msg: 'Referral updated successfully',
      referral: updatedReferral
    });
  } catch (err) {
    console.error('Admin referral update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   POST /api/admin/referrals/regenerate-code/:userId
 * @desc    Regenerate referral code for a user
 * @access  Admin
 */
router.post('/referrals/regenerate-code/:userId', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Generate new referral code
    const newCode = user.generateReferralCode();
    user.referralCode = newCode;
    await user.save();
    
    res.json({
      msg: 'Referral code regenerated successfully',
      newCode,
      user: {
        id: user._id,
        name: user.name,
        referralCode: newCode
      }
    });
  } catch (err) {
    console.error('Admin referral code regeneration error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   POST /api/admin/referrals/manual-reward/:userId
 * @desc    Manually award referral rewards to a user
 * @access  Admin
 */
router.post('/referrals/manual-reward/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { rewardType, reason } = req.body;
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Manual reward logic
    switch (rewardType) {
      case 'tier_upgrade':
        // Force tier upgrade
        await user.updateReferralTier();
        user.referralPerks.lastRewardDate = new Date();
        user.referralStats.totalRewardsEarned += 1;
        break;
      
      case 'bonus_referral':
        // Add bonus referral count
        user.referralStats.successfulReferrals += 1;
        user.referralStats.totalReferrals += 1;
        await user.updateReferralTier();
        break;
      
      case 'special_badge':
        // Add special admin-awarded badge
        if (!user.referralPerks.specialBadges.includes('Admin Awarded')) {
          user.referralPerks.specialBadges.push('Admin Awarded');
        }
        break;
    }
    
    await user.save();
    
    // Log the manual reward
    const adminReward = new Referral({
      referrer: user._id,
      referred: user._id, // Self-referral for admin rewards
      referralCode: user.referralCode,
      status: 'completed',
      rewardGiven: true,
      rewardType,
      metadata: {
        adminAwarded: true,
        reason,
        awardedBy: req.user.id,
        awardedAt: new Date()
      }
    });
    
    await adminReward.save();
    
    res.json({
      msg: `Manual reward (${rewardType}) granted successfully`,
      user: {
        id: user._id,
        name: user.name,
        currentTier: user.referralPerks.currentTier,
        totalReferrals: user.referralStats.totalReferrals,
        successfulReferrals: user.referralStats.successfulReferrals
      }
    });
  } catch (err) {
    console.error('Admin manual reward error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   DELETE /api/admin/referrals/:referralId
 * @desc    Delete a referral record (admin only)
 * @access  Admin
 */
router.delete('/referrals/:referralId', auth, adminAuth, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.referralId);
    
    if (!referral) {
      return res.status(404).json({ msg: 'Referral not found' });
    }
    
    // If it was a completed referral, update referrer stats
    if (referral.status === 'completed') {
      await User.findByIdAndUpdate(referral.referrer, {
        $inc: { 
          'referralStats.successfulReferrals': -1,
          'referralStats.totalReferrals': -1
        }
      });
      
      // Recalculate tier for referrer
      const referrer = await User.findById(referral.referrer);
      if (referrer) {
        await referrer.updateReferralTier();
      }
    }
    
    await Referral.findByIdAndDelete(req.params.referralId);
    
    res.json({ msg: 'Referral deleted successfully' });
  } catch (err) {
    console.error('Admin referral deletion error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
