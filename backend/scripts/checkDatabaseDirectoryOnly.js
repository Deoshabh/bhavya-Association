require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for directory check...'))
  .catch(err => console.error('MongoDB Connection Error:', err));

async function checkDirectoryOnly() {
  try {
    console.log('\n===== DIRECTORY USERS ONLY CHECK =====');
    
    // Explicitly log the query conditions being used
    console.log('Query conditions for directory visibility:');
    console.log('- isPublic: true');
    console.log('- accountStatus: "active"');
    
    // Get users who should be visible in directory
    const directoryUsers = await User.find({
      isPublic: true,
      accountStatus: 'active'
    }).select('name phoneNumber isPublic accountStatus planType');
    
    console.log(`\nFound ${directoryUsers.length} users who should be visible in directory:`);
    
    // Display the users who should be visible
    if (directoryUsers.length > 0) {
      console.log('\nDIRECTORY USERS PREVIEW:');
      directoryUsers.slice(0, 5).forEach((user, i) => {
        console.log(`[${i+1}] ${user.name} (${user.phoneNumber}) - ${user.planType}`);
      });
      
      if (directoryUsers.length > 5) {
        console.log(`...and ${directoryUsers.length - 5} more`);
      }
    } else {
      console.log('⚠️ NO USERS FOUND WITH DIRECTORY VISIBILITY!');
      console.log('This explains why your directory page is empty.');
    }
    
  } catch (error) {
    console.error('Error checking directory:', error);
  } finally {
    mongoose.disconnect();
    console.log('\nCheck complete - database connection closed');
  }
}

checkDirectoryOnly();
