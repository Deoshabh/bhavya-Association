const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createTestAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ phoneNumber: '9999999999' });
    if (existingAdmin) {
      console.log('✅ Test admin user already exists');
      console.log('Phone Number: 9999999999');
      console.log('Password: admin123');
      mongoose.connection.close();
      return;
    }

    // Create test admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      name: 'Admin User',
      phoneNumber: '9999999999',
      occupation: 'Administrator',
      password: hashedPassword,
      planType: 'admin',
      isPublic: false,
      bio: 'System Administrator',
      address: 'Admin Office'
    });

    await adminUser.save();
    console.log('✅ Test admin user created successfully!');
    console.log('Phone Number: 9999999999');
    console.log('Password: admin123');
    console.log('Email: admin@bhavyasangh.com');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

createTestAdmin();
