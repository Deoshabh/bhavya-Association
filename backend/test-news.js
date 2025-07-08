const mongoose = require('mongoose');

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.log('❌ Test timed out');
  process.exit(1);
}, 10000); // 10 seconds timeout

// Test News model standalone
async function testNews() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/bhavya-associates');
    console.log('✅ Connected to MongoDB');

    // Import News model
    const News = require('./models/News');
    console.log('✅ News model imported successfully');

    // Test creating a news item
    const testNews = new News({
      title: 'Test News Article',
      content: 'This is a test news article content.',
      excerpt: 'This is a test excerpt.',
      category: 'news',
      status: 'published',
      author: new mongoose.Types.ObjectId(), // Create dummy ObjectId
      tags: ['test', 'news']
    });

    console.log('✅ Test news object created');
    
    // Try to save
    const saved = await testNews.save();
    console.log('✅ Test news saved successfully');
    console.log('Generated slug:', saved.slug);

    // Test fetching
    const allNews = await News.find();
    console.log('✅ All news fetched:', allNews.length, 'articles');

    // Cleanup
    await News.deleteMany({ title: 'Test News Article' });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    clearTimeout(timeout);
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  }
}

testNews();
