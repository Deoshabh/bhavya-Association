require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

// Function to determine MongoDB URI from various sources
function getMongoURI() {
  // Priority 1: Command line argument (--uri=mongodb://...)
  const uriArg = process.argv.find(arg => arg.startsWith('--uri='));
  if (uriArg) {
    return uriArg.split('=')[1];
  }
  
  // Priority 2: Environment variable
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }
  
  // Priority 3: Check for local config.json file
  try {
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.mongoURI) {
        return config.mongoURI;
      }
    }
  } catch (err) {
    console.error('Error reading config file:', err.message);
  }
  
  // Priority 4: Check for other possible environment variable names
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.DB_URI) return process.env.DB_URI;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  
  // No valid URI found
  return null;
}

// Get MongoDB URI
const mongoURI = getMongoURI();

if (!mongoURI) {
  console.error('\n❌ ERROR: MongoDB URI not found!');
  console.error('Please provide a MongoDB URI using one of these methods:');
  console.error('1. Set MONGO_URI in your .env file');
  console.error('2. Provide it as a command line argument: --uri=mongodb://...');
  console.error('3. Create a config.json file in the backend directory with a mongoURI property');
  console.error('\nExample command:');
  console.error('node scripts/directoryFixer.js --uri=mongodb://localhost:27017/bhavya-Associates\n');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Check and fix directory visibility issues
async function directoryFixer() {
  try {
    console.log('\n===== DIRECTORY VISIBILITY DIAGNOSTIC =====');
    
    // Get total users
    const totalUsers = await User.countDocuments({});
    console.log(`Total users in database: ${totalUsers}`);
    
    // Get users visible in directory (isPublic: true AND accountStatus: 'active')
    const visibleUsers = await User.find({
      isPublic: true,
      accountStatus: 'active'
    }).select('name phoneNumber isPublic accountStatus planType');
    
    console.log(`Visible users in directory: ${visibleUsers.length} (${Math.round(visibleUsers.length/totalUsers*100)}%)`);
    
    // Get users with isPublic: false
    const privateUsers = await User.find({ isPublic: false })
      .select('name phoneNumber isPublic accountStatus planType');
    console.log(`Private users (isPublic: false): ${privateUsers.length}`);
    
    // Get users with non-active status
    const inactiveUsers = await User.find({ accountStatus: { $ne: 'active' } })
      .select('name phoneNumber isPublic accountStatus planType');
    console.log(`Inactive users: ${inactiveUsers.length}`);

    // Get admins (which are typically hidden)
    const adminUsers = await User.find({ planType: 'admin' })
      .select('name phoneNumber isPublic accountStatus planType');
    console.log(`Admin users: ${adminUsers.length}`);
    
    // If command line argument is 'fix', attempt to fix visibility issues
    if (process.argv[2] === 'fix') {
      console.log('\n===== ATTEMPTING TO FIX VISIBILITY ISSUES =====');
      
      // Make all users with active status public by default
      const updateResult = await User.updateMany(
        { accountStatus: 'active', isPublic: false, planType: { $ne: 'admin' } },
        { $set: { isPublic: true } }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} users to be visible in directory`);
    } else {
      console.log('\nTo fix directory visibility issues, run: node directoryFixer.js fix');
    }
    
    console.log('\n===== CHECK FRONTEND API CONNECTIONS =====');
    console.log('1. Verify the frontend is calling the correct API endpoint for directory users');
    console.log('2. Ensure directory component is properly rendering the user data');
    console.log('3. Check browser network tab for API errors when loading the directory page');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
}

directoryFixer();
