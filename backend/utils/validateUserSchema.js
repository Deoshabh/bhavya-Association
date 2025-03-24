require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

/**
 * Validates and normalizes the schema values for all users
 */
const validateUserSchema = async () => {
  await connectDB();
  
  console.log('\nValidating user schema values...');
  
  // Fix boolean values for isPublic field
  const publicResult = await User.updateMany(
    {}, // All users
    [
      {
        $set: {
          // Convert isPublic to Boolean, default to true if missing
          isPublic: { $cond: [{ $eq: ["$isPublic", null] }, true, { $toBool: "$isPublic" }] }
        }
      }
    ]
  );
  
  // Normalize accountStatus to one of the valid enum values
  const statusResult = await User.updateMany(
    {}, // All users
    [
      {
        $set: {
          // If accountStatus is not one of the valid values, set it to 'active'
          accountStatus: {
            $cond: [
              { $in: ["$accountStatus", ["active", "deactivated", "suspended"]] },
              "$accountStatus",
              "active"
            ]
          }
        }
      }
    ]
  );
  
  console.log(`Fixed ${publicResult.modifiedCount} users with incorrect isPublic values`);
  console.log(`Fixed ${statusResult.modifiedCount} users with incorrect accountStatus values`);
  
  // Verify all eligible users are now properly set
  const eligibleUsers = await User.countDocuments({
    isPublic: true,
    accountStatus: "active"
  });
  
  const totalUsers = await User.countDocuments({});
  
  console.log(`\nAfter validation: ${eligibleUsers} out of ${totalUsers} users are directory-eligible`);
  
  // Disconnect from database
  mongoose.disconnect();
  console.log('\nDatabase connection closed');
};

// Run if directly executed
if (require.main === module) {
  validateUserSchema().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = validateUserSchema;
