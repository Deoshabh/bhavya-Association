const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Debug environment variables
console.log('🔧 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('Current directory:', __dirname);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Import News model
const News = require('./models/News');

// Simple test route
app.get('/api/news', async (req, res) => {
  try {
    console.log('🔍 GET /api/news called');
    const news = await News.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('✅ Found', news.length, 'news articles');
    res.json({
      news,
      pagination: {
        total: news.length,
        page: 1,
        limit: 10,
        pages: 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    res.status(500).json({ message: 'Error fetching news' });
  }
});

// Test POST route (without auth for testing)
app.post('/api/news', async (req, res) => {
  try {
    console.log('📝 POST /api/news called');
    console.log('Request body:', req.body);
    
    const { title, content, excerpt, category } = req.body;
    
    if (!title || !content || !excerpt || !category) {
      return res.status(400).json({ 
        message: 'Title, content, excerpt, and category are required' 
      });
    }
    
    const news = new News({
      title,
      content,
      excerpt,
      category,
      status: 'published',
      author: new mongoose.Types.ObjectId(), // Dummy author
      tags: []
    });
    
    const saved = await news.save();
    console.log('✅ News saved:', saved.title);
    res.status(201).json(saved);
  } catch (error) {
    console.error('❌ Error creating news:', error.message);
    res.status(500).json({ message: 'Error creating news' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📡 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/news`);
  console.log(`   POST http://localhost:${PORT}/api/news`);
});
