const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateExistingUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Updating existing users with referral fields...');
    
    // Update all existing users to have referral fields
    const result = await User.updateMany(
      { referralCode: { $exists: false } },
      {
        $set: {
          referralStats: {
            totalReferrals: 0,
            successfulReferrals: 0,
            activeReferrals: 0,
            totalRewardsEarned: 0
          },
          referralPerks: {
            currentTier: 'bronze',
            unlockedFeatures: [],
            specialBadges: []
          }
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users with referral fields`);

    // Generate referral codes for existing users
    const usersWithoutCodes = await User.find({ referralCode: { $exists: false } });
    console.log(`Found ${usersWithoutCodes.length} users without referral codes`);

    for (const user of usersWithoutCodes) {
      let attempts = 0;
      let referralCode;
      let isUnique = false;

      while (!isUnique && attempts < 10) {
        referralCode = user.generateReferralCode();
        const existingUser = await User.findOne({ referralCode });
        if (!existingUser) {
          isUnique = true;
        }
        attempts++;
      }

      if (isUnique) {
        user.referralCode = referralCode;
        await user.save();
        console.log(`Generated referral code ${referralCode} for user ${user.name}`);
      } else {
        console.error(`Failed to generate unique referral code for user ${user.name}`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
updateExistingUsers();
