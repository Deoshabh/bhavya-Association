require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB using the MONGODB_URI from .env
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000
})
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Function to fix all users' directory visibility
async function fixDirectoryVisibility() {
  try {
    console.log('\n===== DIRECTORY VISIBILITY FIXER =====');
    
    // First, check how many users are in the database
    const totalUsers = await User.countDocuments({});
    console.log(`Total users in database: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('No users found in the database. Nothing to fix.');
      return;
    }
    
    // Check how many users are currently visible in the directory
    const visibleBefore = await User.countDocuments({
      isPublic: true,
      accountStatus: 'active'
    });
    
    console.log(`Currently visible users: ${visibleBefore} (${Math.round(visibleBefore/totalUsers*100)}%)`);
    
    // Update all non-admin users to be public and active by default
    const updateResult = await User.updateMany(
      { planType: { $ne: 'admin' } },
      { 
        $set: { 
          isPublic: true,
          accountStatus: 'active'
        } 
      }
    );
    
    console.log(`\nUpdated ${updateResult.modifiedCount} users to be visible in directory`);
    
    // Verify the update worked
    const visibleAfter = await User.countDocuments({
      isPublic: true,
      accountStatus: 'active'
    });
    
    console.log(`\nAfter fix: ${visibleAfter} visible users (${Math.round(visibleAfter/totalUsers*100)}%)`);
    
    // List a few users who should now be visible
    const sampleUsers = await User.find({
      isPublic: true,
      accountStatus: 'active'
    })
    .select('name phoneNumber')
    .limit(5);
    
    if (sampleUsers.length > 0) {
      console.log('\nSample visible users:');
      sampleUsers.forEach((user, i) => {
        console.log(`  ${i+1}. ${user.name} (${user.phoneNumber})`);
      });
    }
    
    console.log('\n✅ Directory visibility fix complete!');
    console.log('Users should now appear in the directory page.');
    
  } catch (error) {
    console.error('Error fixing directory visibility:', error);
  } finally {
    mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
fixDirectoryVisibility();
