const mongoose = require('mongoose');

const MatrimonialProfileSchema = new mongoose.Schema({
  // User reference - the person who created this profile
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Profile Information
  profileType: {
    type: String,
    enum: ['self', 'son', 'daughter', 'brother', 'sister', 'relative'],
    required: true
  },
  
  // Personal Details
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 70
  },
  
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  
  height: {
    type: String, // e.g., "5'8\"" or "173 cm"
    required: true
  },
  
  weight: {
    type: String, // e.g., "65 kg"
    required: false
  },
  
  // Contact Information (premium only access)
  contactNumber: {
    type: String,
    required: true
  },
  
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true
  },
  
  // Location Details
  city: {
    type: String,
    required: true,
    trim: true
  },
  
  state: {
    type: String,
    required: true,
    trim: true
  },
  
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  
  // Caste and Religion
  caste: {
    type: String,
    required: true,
    trim: true
  },
  
  subCaste: {
    type: String,
    trim: true
  },
  
  religion: {
    type: String,
    default: 'Hindu',
    trim: true
  },
  
  // Education and Career
  education: {
    type: String,
    required: true,
    trim: true
  },
  
  occupation: {
    type: String,
    required: true,
    trim: true
  },
  
  income: {
    type: String, // Annual income range
    required: false
  },
  
  // Family Information
  familyType: {
    type: String,
    enum: ['nuclear', 'joint'],
    required: true
  },
  
  fatherOccupation: {
    type: String,
    trim: true
  },
  
  motherOccupation: {
    type: String,
    trim: true
  },
  
  siblings: {
    brothers: { type: Number, default: 0 },
    sisters: { type: Number, default: 0 },
    marriedBrothers: { type: Number, default: 0 },
    marriedSisters: { type: Number, default: 0 }
  },
  
  // About and Preferences
  aboutMe: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  
  partnerPreferences: {
    ageRange: {
      min: { type: Number, min: 18 },
      max: { type: Number, max: 70 }
    },
    heightRange: {
      min: String,
      max: String
    },
    education: [String],
    occupation: [String],
    location: [String],
    caste: [String]
  },
  
  // Biodata File (PDF)
  biodataFile: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    // File path will be stored, actual files on disk
    filePath: String
  },
  
  // Profile Images
  profileImages: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    filePath: String,
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    trim: true
  },
  
  rejectionReason: {
    type: String,
    trim: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  approvedAt: {
    type: Date
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Indexes for better query performance
MatrimonialProfileSchema.index({ status: 1, isActive: 1, isPublic: 1 });
MatrimonialProfileSchema.index({ user: 1 });
MatrimonialProfileSchema.index({ gender: 1, age: 1 });
MatrimonialProfileSchema.index({ city: 1, state: 1 });
MatrimonialProfileSchema.index({ caste: 1 });
MatrimonialProfileSchema.index({ createdAt: -1 });

// Pre-save middleware to update timestamp
MatrimonialProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating age from date of birth
MatrimonialProfileSchema.virtual('calculatedAge').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Method to check if user can view contact details (premium only)
MatrimonialProfileSchema.methods.canViewContactDetails = function(requestingUser) {
  if (!requestingUser) return false;
  
  // Profile owner can always view their own contact details
  if (this.user.toString() === requestingUser._id.toString()) return true;
  
  // Admins can view all contact details
  if (requestingUser.planType === 'admin') return true;
  
  // Premium users can view contact details
  if (requestingUser.planType === 'premium') return true;
  
  return false;
};

// Method to check if user can download biodata
MatrimonialProfileSchema.methods.canDownloadBiodata = function(requestingUser) {
  if (!requestingUser) return false;
  
  // Profile owner can always download their own biodata
  if (this.user.toString() === requestingUser._id.toString()) return true;
  
  // Admins can download all biodata
  if (requestingUser.planType === 'admin') return true;
  
  // Premium users can download biodata
  if (requestingUser.planType === 'premium') return true;
  
  return false;
};

// Static method to get public profiles for browsing
MatrimonialProfileSchema.statics.getPublicProfiles = function(filters = {}) {
  const query = {
    status: 'approved',
    isActive: true,
    isPublic: true
  };
  
  // Apply filters
  if (filters.gender) query.gender = filters.gender;
  if (filters.ageMin || filters.ageMax) {
    query.age = {};
    if (filters.ageMin) query.age.$gte = filters.ageMin;
    if (filters.ageMax) query.age.$lte = filters.ageMax;
  }
  if (filters.city) query.city = new RegExp(filters.city, 'i');
  if (filters.state) query.state = new RegExp(filters.state, 'i');
  if (filters.caste) query.caste = new RegExp(filters.caste, 'i');
  if (filters.education) query.education = new RegExp(filters.education, 'i');
  if (filters.occupation) query.occupation = new RegExp(filters.occupation, 'i');
  
  return this.find(query)
    .populate('user', 'name planType')
    .select('-contactNumber -email -biodataFile.filePath -adminNotes')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('MatrimonialProfile', MatrimonialProfileSchema);
