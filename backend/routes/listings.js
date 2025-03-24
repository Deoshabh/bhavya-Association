const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Listing = require('../models/Listing'); // Ensure this is importing the Listing model
const User = require('../models/User'); // Ensure this is importing the User model
const { ensureConnected } = require('../config/db');
const mongoose = require('mongoose');

// Verify models are registered properly
console.log('Available models:', Object.keys(mongoose.models)); // Add this line for debugging

/**
 * @route   POST /api/listings
 * @desc    Create a new service listing
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    await ensureConnected();
    
    const { title, category, description, image, contactPhone, contactEmail } = req.body;

    // Validate required fields
    if (!title || !category || !description || !contactPhone) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Create new listing
    const newListing = new Listing({
      user: req.user.id,
      title,
      category,
      description,
      image: image || '',
      contactPhone,
      contactEmail: contactEmail || ''
    });

    const listing = await newListing.save();
    res.status(201).json(listing);
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ msg: 'Server error while creating listing' });
  }
});

/**
 * @route   GET /api/listings
 * @desc    Get all service listings with conditional contact info based on premium status
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Ensure database connection before proceeding
    await ensureConnected();
    
    // Validate user ID from token
    if (!req.user || !req.user.id) {
      console.error('Missing user ID in request');
      return res.status(401).json({ msg: 'User authentication failed' });
    }
    
    // Find all approved listings and populate user info
    // This populate statement relies on the correct model name in the ref field
    const query = { approved: true }; // Only return approved listings for regular users
    
    // Check if requesting user is an admin
    const user = await User.findById(req.user.id).select('planType');
    const isAdmin = user && user.planType === 'admin';
    
    // Admin can see all listings including unapproved ones
    if (isAdmin && req.query.showAll === 'true') {
      delete query.approved;
    }
    
    const listings = await Listing.find(query)
      .populate('user', 'name occupation')
      .sort({ createdAt: -1 });
    
    // Handle case where user is not found
    if (!user) {
      console.error(`User not found with ID: ${req.user.id}`);
      return res.status(401).json({ msg: 'User not found' });
    }
    
    const isPremiumUser = ['premium', 'admin'].includes(user.planType);
    
    // Filter contact info for non-premium users
    const filteredListings = listings.map(listing => {
      const listingObj = listing.toObject();
      
      // Only show contact info if:
      // 1. User is premium/admin OR
      // 2. User is the listing owner
      if (!isPremiumUser && listingObj.user._id.toString() !== req.user.id) {
        delete listingObj.contactPhone;
        delete listingObj.contactEmail;
        listingObj.premiumRequired = true;
      } else {
        listingObj.premiumRequired = false;
      }
      
      return listingObj;
    });
    
    res.json(filteredListings);
  } catch (err) {
    // Enhanced error logging with more context
    console.error('Error fetching listings:', {
      error: err.message,
      stack: err.stack,
      userId: req.user?.id || 'unknown'
    });
    
    // Handle specific error types
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ 
        msg: 'Invalid ID format', 
        details: 'The provided ID is not in the correct format.' 
      });
    }
    
    // Send detailed error message in development, generic in production
    res.status(500).json({ 
      msg: 'Server error while fetching listings',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @route   GET /api/listings/:id
 * @desc    Get a listing by ID with conditional contact info
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    await ensureConnected();
    
    const listing = await Listing.findById(req.params.id).populate('user', 'name occupation');
    
    if (!listing) {
      return res.status(404).json({ msg: 'Listing not found' });
    }
    
    // Check if requesting user is premium or admin
    const user = await User.findById(req.user.id).select('planType');
    const isPremiumUser = ['premium', 'admin'].includes(user.planType);
    
    const listingObj = listing.toObject();
    
    // Filter contact info if non-premium user is viewing someone else's listing
    if (!isPremiumUser && listingObj.user._id.toString() !== req.user.id) {
      delete listingObj.contactPhone;
      delete listingObj.contactEmail;
      listingObj.premiumRequired = true;
    } else {
      listingObj.premiumRequired = false;
    }
    
    res.json(listingObj);
  } catch (err) {
    console.error('Error fetching listing:', err);
    res.status(500).json({ msg: 'Server error while fetching listing' });
  }
});

/**
 * @route   DELETE /api/listings/:id
 * @desc    Delete a listing
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    await ensureConnected();
    
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ msg: 'Listing not found' });
    }
    
    // Check if user owns the listing
    if (listing.user.toString() !== req.user.id) {
      // Check if user is admin
      const user = await User.findById(req.user.id);
      if (!user || user.planType !== 'admin') {
        return res.status(401).json({ msg: 'Not authorized to delete this listing' });
      }
    }
    
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Listing removed' });
  } catch (err) {
    console.error('Error deleting listing:', err);
    res.status(500).json({ msg: 'Server error while deleting listing' });
  }
});

module.exports = router;
