const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const MatrimonialProfile = require('../models/MatrimonialProfile');
const User = require('../models/User');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/matrimonial');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = path.extname(file.originalname);
    cb(null, `${timestamp}_${random}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'biodata') {
    // Only allow PDF files for biodata
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Biodata must be a PDF file'), false);
    }
  } else if (file.fieldname === 'profileImages') {
    // Only allow image files for profile pictures
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Profile images must be image files'), false);
    }
  } else {
    cb(new Error('Invalid field name'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

/**
 * @route   GET /api/matrimonial/profiles
 * @desc    Get public matrimonial profiles with filtering
 * @access  Public
 */
router.get('/profiles', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      gender,
      ageMin,
      ageMax,
      city,
      state,
      caste,
      education,
      occupation,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filters
    const filters = {};
    if (gender) filters.gender = gender;
    if (ageMin) filters.ageMin = parseInt(ageMin);
    if (ageMax) filters.ageMax = parseInt(ageMax);
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (caste) filters.caste = caste;
    if (education) filters.education = education;
    if (occupation) filters.occupation = occupation;

    // Get base query
    const query = {
      status: 'approved',
      isActive: true,
      isPublic: true
    };

    // Apply filters
    if (gender) query.gender = gender;
    if (ageMin || ageMax) {
      query.age = {};
      if (ageMin) query.age.$gte = parseInt(ageMin);
      if (ageMax) query.age.$lte = parseInt(ageMax);
    }
    if (city) query.city = new RegExp(city, 'i');
    if (state) query.state = new RegExp(state, 'i');
    if (caste) query.caste = new RegExp(caste, 'i');
    if (education) query.education = new RegExp(education, 'i');
    if (occupation) query.occupation = new RegExp(occupation, 'i');

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get profiles
    const profiles = await MatrimonialProfile.find(query)
      .populate('user', 'name planType')
      .select('-contactNumber -email -biodataFile.filePath -adminNotes -rejectionReason')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await MatrimonialProfile.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      profiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (err) {
    console.error('Error fetching matrimonial profiles:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/matrimonial/profiles/:id
 * @desc    Get single matrimonial profile
 * @access  Public (with restrictions)
 */
router.get('/profiles/:id', async (req, res) => {
  try {
    const profile = await MatrimonialProfile.findById(req.params.id)
      .populate('user', 'name planType')
      .populate('approvedBy', 'name');

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Check if profile is publicly accessible
    if (profile.status !== 'approved' || !profile.isActive || !profile.isPublic) {
      return res.status(403).json({ msg: 'Profile not accessible' });
    }

    // Create response object
    const responseProfile = profile.toObject();

    // Remove sensitive information for non-premium users
    const requestingUser = req.user; // Will be null if not authenticated
    
    if (!profile.canViewContactDetails(requestingUser)) {
      delete responseProfile.contactNumber;
      delete responseProfile.email;
    }

    if (!profile.canDownloadBiodata(requestingUser)) {
      delete responseProfile.biodataFile;
    }

    // Always remove admin notes and rejection reason from public view
    delete responseProfile.adminNotes;
    delete responseProfile.rejectionReason;

    res.json(responseProfile);
  } catch (err) {
    console.error('Error fetching matrimonial profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   POST /api/matrimonial/profiles
 * @desc    Create new matrimonial profile
 * @access  Private (authenticated users only)
 */
router.post('/profiles', auth, upload.fields([
  { name: 'biodata', maxCount: 1 },
  { name: 'profileImages', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      profileType,
      fullName,
      dateOfBirth,
      gender,
      height,
      weight,
      contactNumber,
      email,
      city,
      state,
      country,
      caste,
      subCaste,
      religion,
      education,
      occupation,
      income,
      familyType,
      fatherOccupation,
      motherOccupation,
      siblings,
      aboutMe,
      partnerPreferences
    } = req.body;

    // Validate required fields
    if (!profileType || !fullName || !dateOfBirth || !gender || !height || 
        !contactNumber || !city || !state || !caste || !education || 
        !occupation || !familyType) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Calculate age from date of birth
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18 || age > 70) {
      return res.status(400).json({ msg: 'Age must be between 18 and 70 years' });
    }

    // Check if biodata file is uploaded
    if (!req.files || !req.files.biodata || req.files.biodata.length === 0) {
      return res.status(400).json({ msg: 'Biodata PDF file is required' });
    }

    // Process biodata file
    const biodataFile = req.files.biodata[0];
    const biodataInfo = {
      filename: biodataFile.filename,
      originalName: biodataFile.originalname,
      mimetype: biodataFile.mimetype,
      size: biodataFile.size,
      filePath: biodataFile.path
    };

    // Process profile images
    const profileImages = [];
    if (req.files.profileImages) {
      req.files.profileImages.forEach((image, index) => {
        profileImages.push({
          filename: image.filename,
          originalName: image.originalname,
          mimetype: image.mimetype,
          size: image.size,
          filePath: image.path,
          isPrimary: index === 0 // First image is primary
        });
      });
    }

    // Parse complex fields
    let parsedSiblings = {};
    let parsedPartnerPreferences = {};

    try {
      if (siblings) parsedSiblings = JSON.parse(siblings);
      if (partnerPreferences) parsedPartnerPreferences = JSON.parse(partnerPreferences);
    } catch (parseErr) {
      return res.status(400).json({ msg: 'Invalid JSON format for siblings or partner preferences' });
    }

    // Create profile
    const profileData = {
      user: req.user.id,
      profileType,
      fullName,
      dateOfBirth: birthDate,
      age,
      gender,
      height,
      weight,
      contactNumber,
      email,
      city,
      state,
      country: country || 'India',
      caste,
      subCaste,
      religion: religion || 'Hindu',
      education,
      occupation,
      income,
      familyType,
      fatherOccupation,
      motherOccupation,
      siblings: parsedSiblings,
      aboutMe,
      partnerPreferences: parsedPartnerPreferences,
      biodataFile: biodataInfo,
      profileImages,
      status: 'pending' // Requires admin approval
    };

    const matrimonialProfile = new MatrimonialProfile(profileData);
    await matrimonialProfile.save();

    res.status(201).json({
      msg: 'Matrimonial profile created successfully and submitted for approval',
      profile: matrimonialProfile
    });
  } catch (err) {
    console.error('Error creating matrimonial profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/matrimonial/my-profiles
 * @desc    Get current user's matrimonial profiles
 * @access  Private
 */
router.get('/my-profiles', auth, async (req, res) => {
  try {
    const profiles = await MatrimonialProfile.find({ user: req.user.id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(profiles);
  } catch (err) {
    console.error('Error fetching user profiles:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   PUT /api/matrimonial/profiles/:id
 * @desc    Update matrimonial profile
 * @access  Private (profile owner only)
 */
router.put('/profiles/:id', auth, upload.fields([
  { name: 'biodata', maxCount: 1 },
  { name: 'profileImages', maxCount: 5 }
]), async (req, res) => {
  try {
    const profile = await MatrimonialProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Check ownership
    if (profile.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Update fields
    const updateFields = [
      'profileType', 'fullName', 'dateOfBirth', 'gender', 'height', 'weight',
      'contactNumber', 'email', 'city', 'state', 'country', 'caste', 'subCaste',
      'religion', 'education', 'occupation', 'income', 'familyType',
      'fatherOccupation', 'motherOccupation', 'aboutMe'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    // Recalculate age if date of birth changed
    if (req.body.dateOfBirth) {
      const birthDate = new Date(req.body.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      profile.age = age;
    }

    // Handle complex fields
    if (req.body.siblings) {
      try {
        profile.siblings = JSON.parse(req.body.siblings);
      } catch (err) {
        return res.status(400).json({ msg: 'Invalid siblings format' });
      }
    }

    if (req.body.partnerPreferences) {
      try {
        profile.partnerPreferences = JSON.parse(req.body.partnerPreferences);
      } catch (err) {
        return res.status(400).json({ msg: 'Invalid partner preferences format' });
      }
    }

    // Handle file updates
    if (req.files && req.files.biodata && req.files.biodata.length > 0) {
      const biodataFile = req.files.biodata[0];
      profile.biodataFile = {
        filename: biodataFile.filename,
        originalName: biodataFile.originalname,
        mimetype: biodataFile.mimetype,
        size: biodataFile.size,
        filePath: biodataFile.path
      };
    }

    // Reset status to pending if updated (requires re-approval)
    if (profile.status === 'approved') {
      profile.status = 'pending';
    }

    await profile.save();

    res.json({
      msg: 'Profile updated successfully and submitted for re-approval',
      profile
    });
  } catch (err) {
    console.error('Error updating matrimonial profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   DELETE /api/matrimonial/profiles/:id
 * @desc    Delete matrimonial profile
 * @access  Private (profile owner only)
 */
router.delete('/profiles/:id', auth, async (req, res) => {
  try {
    const profile = await MatrimonialProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Check ownership
    if (profile.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Delete associated files
    try {
      if (profile.biodataFile && profile.biodataFile.filePath) {
        await fs.unlink(profile.biodataFile.filePath);
      }

      if (profile.profileImages && profile.profileImages.length > 0) {
        for (const image of profile.profileImages) {
          if (image.filePath) {
            await fs.unlink(image.filePath);
          }
        }
      }
    } catch (fileErr) {
      console.error('Error deleting files:', fileErr);
      // Continue with profile deletion even if file deletion fails
    }

    await MatrimonialProfile.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Profile deleted successfully' });
  } catch (err) {
    console.error('Error deleting matrimonial profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/matrimonial/download-biodata/:id
 * @desc    Download biodata PDF
 * @access  Private (premium users only)
 */
router.get('/download-biodata/:id', auth, async (req, res) => {
  try {
    const profile = await MatrimonialProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Check if user can download biodata
    const requestingUser = await User.findById(req.user.id);
    if (!profile.canDownloadBiodata(requestingUser)) {
      return res.status(403).json({ msg: 'Premium membership required to download biodata' });
    }

    if (!profile.biodataFile || !profile.biodataFile.filePath) {
      return res.status(404).json({ msg: 'Biodata file not found' });
    }

    // Check if file exists
    try {
      await fs.access(profile.biodataFile.filePath);
    } catch (fileErr) {
      return res.status(404).json({ msg: 'Biodata file not found on server' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${profile.biodataFile.originalName}"`);

    // Stream file to response
    const fileStream = require('fs').createReadStream(profile.biodataFile.filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Error downloading biodata:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route   GET /api/matrimonial/stats
 * @desc    Get matrimonial section statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalProfiles: await MatrimonialProfile.countDocuments({ status: 'approved', isActive: true }),
      maleProfiles: await MatrimonialProfile.countDocuments({ 
        status: 'approved', 
        isActive: true, 
        gender: 'male' 
      }),
      femaleProfiles: await MatrimonialProfile.countDocuments({ 
        status: 'approved', 
        isActive: true, 
        gender: 'female' 
      }),
      pendingApproval: await MatrimonialProfile.countDocuments({ status: 'pending' })
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching matrimonial stats:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
