require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
    return true;
  } catch (err) {
    console.error('Database connection error:', err.message);
    return false;
  }
};

// Function to test the directory API query
const testDirectoryQuery = async () => {
  try {
    // This should match the query used in your directory API endpoint
    const users = await User.find({
      isPublic: true,
      accountStatus: 'active'
    }).select('name phoneNumber email flatNumber blockNumber').sort({ name: 1 });
    
    console.log(`\n===== DIRECTORY API TEST =====`);
    console.log(`Found ${users.length} users that should appear in directory:`);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`- ID: ${user._id}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Phone: ${user.phoneNumber}`);
        console.log(`- Email: ${user.email || 'N/A'}`);
        console.log(`- Flat: ${user.flatNumber || 'N/A'}`);
        console.log(`- Block: ${user.blockNumber || 'N/A'}`);
      });
    } else {
      console.log('No users found - check your User model schema');
    }
  } catch (error) {
    console.error('Error testing directory query:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
};

// Run the test
connectDB().then(connected => {
  if (connected) {
    testDirectoryQuery();
  } else {
    console.log('Failed to connect to database');
    process.exit(1);
  }
});
