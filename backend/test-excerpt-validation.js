const mongoose = require('mongoose');
const News = require('./models/News');
require('dotenv').config();

const testExcerptLength = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test with the exact excerpt that was failing
    const testExcerpt = `To empower the youth of Uttar Pradesh by promoting self-employment through the establishment of micro-enterprises and service-based ventures.
Annual target: Establish 100,000 micro-enterprises/service units to connect youth with self-employment opportunities.
Long-term goal: Provide self-employment `;

    console.log(`\n=== EXCERPT LENGTH TEST ===`);
    console.log(`Excerpt length: ${testExcerpt.length} characters`);
    console.log(`New limit: 500 characters`);
    console.log(`Status: ${testExcerpt.length <= 500 ? '✅ VALID' : '❌ TOO LONG'}`);

    // Test creating a news article with this excerpt
    const testNews = new News({
      title: 'Test Article - CM-YUVA Campaign',
      content: 'This is test content for validation.',
      excerpt: testExcerpt,
      category: 'announcement',
      status: 'draft',
      featured: false,
      author: new mongoose.Types.ObjectId() // dummy author ID
    });

    // Validate without saving
    await testNews.validate();
    console.log('✅ Validation passed! The news article would be accepted.');

    console.log('\n=== MULTIPLE EXCERPT TESTS ===');
    
    // Test various excerpt lengths
    const testCases = [
      { length: 250, description: 'Short excerpt' },
      { length: 300, description: 'Old limit excerpt' },
      { length: 400, description: 'Medium excerpt' },
      { length: 500, description: 'Max new limit excerpt' },
      { length: 550, description: 'Over limit excerpt' }
    ];

    for (const testCase of testCases) {
      const testExcerptForLength = 'A'.repeat(testCase.length);
      const tempNews = new News({
        title: `Test - ${testCase.description}`,
        content: 'Test content',
        excerpt: testExcerptForLength,
        category: 'news',
        status: 'draft',
        featured: false,
        author: new mongoose.Types.ObjectId()
      });

      try {
        await tempNews.validate();
        console.log(`✅ ${testCase.length} chars (${testCase.description}): VALID`);
      } catch (error) {
        console.log(`❌ ${testCase.length} chars (${testCase.description}): INVALID - ${error.message}`);
      }
    }

    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected');
  }
};

testExcerptLength();
