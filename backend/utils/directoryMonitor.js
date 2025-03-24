require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Monitors directory health and reports issues
 */
async function monitorDirectory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
    
    // Get counts
    const totalUsers = await User.countDocuments({});
    const eligibleUsers = await User.countDocuments({
      isPublic: true,
      accountStatus: 'active'
    });
    
    // Calculate percentage of eligible users
    const eligiblePercentage = totalUsers > 0 
      ? Math.round((eligibleUsers / totalUsers) * 100) 
      : 0;
    
    console.log(`\n===== DIRECTORY HEALTH REPORT =====`);
    console.log(`Total users: ${totalUsers}`);
    console.log(`Directory-eligible users: ${eligibleUsers} (${eligiblePercentage}%)`);
    
    // Alert if less than 70% of users are visible
    if (eligiblePercentage < 70 && totalUsers > 0) {
      console.log('\n⚠️ WARNING: Less than 70% of users are visible in the directory!');
      console.log('This could indicate a problem with user visibility settings.');
      console.log('Consider running: node utils/directoryFixer.js diagnose');
    } else {
      console.log('\n✓ Directory health looks good!');
    }
    
  } catch (err) {
    console.error('Error monitoring directory:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  monitorDirectory().catch(err => {
    console.error('Monitor failed:', err);
    process.exit(1);
  });
}

module.exports = monitorDirectory;
