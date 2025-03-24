const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  occupation: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  address: { type: String, default: '' },
  interests: { type: [String], default: [] },
  profileImage: { type: String, default: '' }, // URL or base64 encoded image
  planType: { type: String, enum: ['free', 'premium', 'admin'], default: 'free' },
  createdAt: { type: Date, default: Date.now },
  // Add fields to control profile visibility
  isPublic: { 
    type: Boolean, 
    default: true,
    required: true // Make it required so it can't be null or undefined
  },
  // Add account status field
  accountStatus: { 
    type: String, 
    enum: ['active', 'deactivated', 'suspended'],
    default: 'active',
    required: true
  },
  // Add last updated timestamp
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add a pre-save hook to update the updatedAt timestamp
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);