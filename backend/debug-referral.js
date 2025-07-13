const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Referral = require('./models/Referral');

async function debugReferralIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`Total users: ${userCount}`);

    // Check if any referrals exist
    const referralCount = await Referral.countDocuments();
    console.log(`Total referrals: ${referralCount}`);

    // Get a sample user to test the analytics function
    const sampleUser = await User.findOne().select('_id name referralCode referralStats referralPerks');
    if (sampleUser) {
      console.log('Sample user:', {
        id: sampleUser._id,
        name: sampleUser.name,
        referralCode: sampleUser.referralCode,
        referralStats: sampleUser.referralStats,
        referralPerks: sampleUser.referralPerks
      });

      // Test the analytics function
      try {
        const analytics = await Referral.getAnalytics(sampleUser._id);
        console.log('Analytics:', analytics);
      } catch (analyticsError) {
        console.error('Analytics error:', analyticsError);
      }

      // Test tier info
      try {
        const tierInfo = User.getReferralTiers();
        console.log('Tier info available:', tierInfo.length > 0);
      } catch (tierError) {
        console.error('Tier error:', tierError);
      }
    } else {
      console.log('No users found');
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugReferralIssue();
