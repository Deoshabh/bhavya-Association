const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function fixReferralFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find users with missing or null referral fields
    const usersToUpdate = await User.find({
      $or: [
        { referralStats: { $exists: false } },
        { referralStats: null },
        { referralPerks: { $exists: false } },
        { referralPerks: null },
        { referralCode: { $exists: false } },
        { referralCode: null }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users that need referral field updates`);

    for (const user of usersToUpdate) {
      console.log(`Updating user: ${user.name} (${user._id})`);

      // Initialize referralStats if missing
      if (!user.referralStats) {
        user.referralStats = {
          totalReferrals: 0,
          successfulReferrals: 0,
          activeReferrals: 0,
          totalRewardsEarned: 0
        };
      }

      // Initialize referralPerks if missing
      if (!user.referralPerks) {
        user.referralPerks = {
          currentTier: 'bronze',
          unlockedFeatures: [],
          specialBadges: [],
          lastRewardDate: null
        };
      }

      // Generate referral code if missing
      if (!user.referralCode) {
        user.referralCode = user.generateReferralCode();
        
        // Check for duplicates and regenerate if necessary
        let attempts = 0;
        while (attempts < 10) {
          const existing = await User.findOne({ 
            referralCode: user.referralCode, 
            _id: { $ne: user._id } 
          });
          
          if (!existing) break;
          
          user.referralCode = user.generateReferralCode();
          attempts++;
        }
      }

      await user.save();
      console.log(`Updated user: ${user.name} with referral code: ${user.referralCode}`);
    }

    console.log('Referral field migration completed successfully');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixReferralFields();
