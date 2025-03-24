require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
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
 * Diagnose directory visibility issues
 */
const diagnoseDirectory = async () => {
  await connectDB();

  // Get basic stats
  const totalUsers = await User.countDocuments({});
  const publicUsers = await User.countDocuments({ isPublic: true });
  const activeUsers = await User.countDocuments({ accountStatus: 'active' });
  const eligibleUsers = await User.countDocuments({ 
    isPublic: true, 
    accountStatus: 'active' 
  });

  console.log('\n===== DIRECTORY DIAGNOSIS =====');
  console.log(`Total users in database: ${totalUsers}`);
  console.log(`Public users: ${publicUsers} (${Math.round(publicUsers/totalUsers*100)}%)`);
  console.log(`Active users: ${activeUsers} (${Math.round(activeUsers/totalUsers*100)}%)`);
  console.log(`Directory-eligible users: ${eligibleUsers} (${Math.round(eligibleUsers/totalUsers*100)}%)`);

  // List problematic users
  console.log('\n----- Users Not Visible in Directory -----');
  const hiddenUsers = await User.find({ 
    $or: [{ isPublic: false }, { accountStatus: { $ne: 'active' } }]
  }).select('name phoneNumber isPublic accountStatus');

  hiddenUsers.forEach(user => {
    console.log(`- ${user.name} (${user.phoneNumber}): isPublic=${user.isPublic}, status=${user.accountStatus}`);
  });
};

/**
 * Make all users visible in directory
 */
const makeAllUsersVisible = async () => {
  await connectDB();
  
  console.log('\nUpdating users to be visible in directory...');
  
  // Update all users to be public and active
  const result = await User.updateMany(
    { $or: [{ isPublic: false }, { accountStatus: { $ne: 'active' } }] },
    { $set: { isPublic: true, accountStatus: 'active' } }
  );
  
  console.log(`Updated ${result.modifiedCount} users to be visible in directory`);
  
  // Verify the results
  await diagnoseDirectory();
  
  // Disconnect from database
  mongoose.disconnect();
  console.log('\nDatabase connection closed');
};

/**
 * Command line interface for the utility
 */
const runUtility = async () => {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  
  if (command === 'diagnose') {
    await diagnoseDirectory();
  } else if (command === 'fix') {
    await makeAllUsersVisible();
  } else {
    console.log('Usage: node directoryFixer.js [diagnose|fix]');
    console.log('  diagnose - Check the state of users in the directory');
    console.log('  fix      - Make all users visible in the directory');
  }
  
  // Disconnect from database
  mongoose.disconnect();
};

// Run the utility if this script is executed directly
if (require.main === module) {
  runUtility().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { diagnoseDirectory, makeAllUsersVisible };
