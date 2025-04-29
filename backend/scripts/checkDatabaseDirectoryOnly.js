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
  console.error('node scripts/checkDatabaseDirectoryOnly.js --uri=mongodb://localhost:27017/bhavya-Associates\n');
  process.exit(1);
}

// Connect to MongoDB with a longer timeout for Docker environments
mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  connectTimeoutMS: 30000
})
  .then(() => console.log('MongoDB Connected for directory check...'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

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
