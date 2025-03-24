require('dotenv').config();
const mongoose = require('mongoose');

async function checkDbConnection() {
  console.log('Checking MongoDB connection...');
  
  if (!process.env.MONGODB_URI) {
    console.error('ERROR: MONGODB_URI environment variable is not set');
    console.error('Make sure you have a .env file with MONGODB_URI=your_connection_string');
    process.exit(1);
  }
  
  try {
    // Try to connect with a short timeout
    await mongoose.connect(process.env.MONGODB_URI, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB connection successful');
    console.log(`Connected to: ${mongoose.connection.name}`);
    
    // Check if we can run a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);
    
    // List all collections
    if (collections.length > 0) {
      console.log('Collections:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    } else {
      console.log('No collections found - database might be empty');
    }
    
    // Close the connection
    await mongoose.disconnect();
    console.log('Connection closed');
  } catch (err) {
    console.error('❌ MongoDB connection failed');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    // Provide more helpful information based on error type
    if (err.name === 'MongoNetworkError') {
      console.error('\nPossible causes:');
      console.error('1. MongoDB server is not running');
      console.error('2. MongoDB URI is incorrect');
      console.error('3. Network/firewall is blocking the connection');
      console.error('\nTry these solutions:');
      console.error('1. Check if MongoDB is running on your system or server');
      console.error('2. Verify the MONGODB_URI in your .env file');
      console.error('3. Try connecting with the mongo shell: mongo "your-connection-string"');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkDbConnection().catch(err => {
    console.error('Check failed:', err);
    process.exit(1);
  });
}

module.exports = checkDbConnection;
