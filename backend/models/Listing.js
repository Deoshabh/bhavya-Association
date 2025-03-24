const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  contactPhone: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    default: ''
  },
  approved: {
    type: Boolean,
    default: true // Default to approved for backward compatibility
  },
  premiumRequired: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Listing', ListingSchema);
