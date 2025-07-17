const mongoose = require('mongoose');
const User = require('./models/User');
const News = require('./models/News');
require('dotenv').config();

const testNewsCreation = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test admin user first
    const testUser = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      phoneNumber: '1234567890',
      occupation: 'Administrator',
      password: 'hashedpassword', // This would be hashed in real scenario
      role: 'admin',
      accountStatus: 'active',
      isPublic: false
    });

    let savedUser;
    try {
      savedUser = await testUser.save();
      console.log('✅ Test admin user created:', savedUser._id);
    } catch (err) {
      if (err.code === 11000) {
        // User already exists
        savedUser = await User.findOne({ email: 'admin@test.com' });
        console.log('📝 Using existing test admin user:', savedUser._id);
      } else {
        throw err;
      }
    }

    // Test news creation
    const testNews = new News({
      title: 'Test News Article',
      content: 'This is a test news article content.',
      excerpt: 'This is a test excerpt.',
      category: 'news',
      status: 'published',
      featured: false,
      author: savedUser._id
    });

    const savedNews = await testNews.save();
    console.log('✅ Test news article created successfully!');
    console.log('- ID:', savedNews._id);
    console.log('- Title:', savedNews.title);
    console.log('- Slug:', savedNews.slug);
    console.log('- Author:', savedNews.author);

    // Test news fetching
    const fetchedNews = await News.find({ status: 'published' })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    console.log(`✅ Fetched ${fetchedNews.length} published news articles`);

    // Clean up
    await News.findByIdAndDelete(savedNews._id);
    await User.findByIdAndDelete(savedUser._id);
    console.log('🧹 Cleaned up test data');

    console.log('\n🎉 All news operations working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing news creation:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected');
  }
};

testNewsCreation();
