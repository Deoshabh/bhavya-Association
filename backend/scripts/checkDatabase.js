require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });

// Function to display user info in a table
const displayUsers = (users, title) => {
  console.log(`\n----- ${title} (${users.length}) -----`);
  if (users.length === 0) {
    console.log('No users in this category.');
    return;
  }
  
  console.log('ID\t\tName\t\tPhone\t\tStatus\tPublic\tPlan');
  console.log('------------------------------------------------------------------------');
  users.forEach(user => {
    console.log(
      `${user._id.toString().substring(0, 8)}...\t` +
      `${user.name.padEnd(15).substring(0, 15)}\t` +
      `${user.phoneNumber.padEnd(10)}\t` +
      `${user.accountStatus.padEnd(6)}\t` +
      `${user.isPublic ? 'Yes' : 'No'}\t` +
      `${user.planType}`
    );
  });
};

// Main function
async function checkDatabase() {
  try {
    // Get all users
    const allUsers = await User.find().select('name phoneNumber isPublic accountStatus planType');
    
    // Get users visible in directory
    const visibleUsers = await User.find({
      isPublic: true,
      accountStatus: 'active'
    }).select('name phoneNumber isPublic accountStatus planType');
    
    // Get users not visible due to privacy settings
    const privateUsers = await User.find({
      isPublic: false
    }).select('name phoneNumber isPublic accountStatus planType');
    
    // Get users not visible due to inactive status
    const inactiveUsers = await User.find({
      accountStatus: { $ne: 'active' }
    }).select('name phoneNumber isPublic accountStatus planType');
    
    // Display overall stats
    console.log('\n===== DATABASE STATISTICS =====');
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Users visible in directory: ${visibleUsers.length} (${Math.round(visibleUsers.length/allUsers.length*100)}%)`);
    console.log(`Private users: ${privateUsers.length}`);
    console.log(`Inactive users: ${inactiveUsers.length}`);
    
    // Display detailed info
    displayUsers(allUsers, 'ALL USERS');
    displayUsers(visibleUsers, 'VISIBLE USERS');
    displayUsers(privateUsers, 'PRIVATE USERS');
    displayUsers(inactiveUsers, 'INACTIVE USERS');
    
    console.log('\n===== RECOMMENDATIONS =====');
    if (visibleUsers.length === 0) {
      console.log('⚠️ WARNING: No users are visible in the directory!');
      console.log('Consider updating user records to make them visible:');
      console.log('Run: node directoryFixer.js fix');
    } else if (visibleUsers.length < allUsers.length * 0.5) {
      console.log('⚠️ Only a small percentage of users are visible in the directory.');
      console.log('Check if this is intentional or if there is a configuration issue.');
    } else {
      console.log('✓ Database appears to be in good condition.');
    }
    
    if (privateUsers.length > 0) {
      console.log(`\n${privateUsers.length} user(s) are marked as private (isPublic: false)`);
    }
    
    if (inactiveUsers.length > 0) {
      console.log(`\n${inactiveUsers.length} user(s) have inactive status (accountStatus: ${inactiveUsers.map(u => u.accountStatus).join(', ')})`);
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
}

checkDatabase();
