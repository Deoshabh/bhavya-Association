const express = require('express');
const router = express.Router();
const News = require('../models/News');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Get all published news/events (public route)
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      featured, 
      limit = 10, 
      page = 1, 
      search,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const news = await News.find(query)
      .populate('author', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await News.countDocuments(query);
    
    res.json({
      news,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ message: 'Error fetching news' });
  }
});

// Get latest news for home page (limited)
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    
    const latestNews = await News.find({ 
      status: 'published' 
    })
    .populate('author', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title excerpt category slug createdAt image eventDate eventLocation')
    .lean();

    res.json(latestNews);
  } catch (error) {
    console.error('Error fetching latest news:', error);
    res.status(500).json({ message: 'Error fetching latest news' });
  }
});

// Get single news article by slug (public route)
router.get('/:slug', async (req, res) => {
  try {
    const news = await News.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    })
    .populate('author', 'name email')
    .populate('comments.user', 'name');

    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    // Increment view count
    await News.findByIdAndUpdate(news._id, { $inc: { views: 1 } });

    res.json(news);
  } catch (error) {
    console.error('Error fetching news article:', error);
    res.status(500).json({ message: 'Error fetching news article' });
  }
});

// Create news (admin only)
router.post('/', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('📝 Creating news - Request body:', req.body);
    console.log('📷 Uploaded file:', req.file);
    console.log('👤 User:', req.user ? req.user.id : 'No user');
    
    const {
      title,
      content,
      excerpt,
      category,
      status,
      featured,
      eventDate,
      eventLocation,
      tags
    } = req.body;

    // Validation
    if (!title || !content || !excerpt || !category) {
      return res.status(400).json({ 
        message: 'Title, content, excerpt, and category are required' 
      });
    }

    // Additional validation for events
    if (category === 'event' && (!eventDate || !eventLocation)) {
      return res.status(400).json({ 
        message: 'Event date and location are required for events' 
      });
    }

    // Handle uploaded image
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/news/${req.file.filename}`;
    }

    const news = new News({
      title,
      content,
      excerpt,
      category,
      status: status || 'draft',
      featured: featured === 'true' || featured === true,
      image: imageUrl,
      eventDate: eventDate || null,
      eventLocation: eventLocation || null,
      author: req.user.id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await news.save();
    
    const populatedNews = await News.findById(news._id)
      .populate('author', 'name email');

    res.status(201).json(populatedNews);
  } catch (error) {
    console.error('❌ Error creating news:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Request file:', req.file);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ 
      message: 'Error creating news article',
      error: error.message 
    });
  }
});

// Update news (admin only)
router.put('/:id', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      status,
      featured,
      eventDate,
      eventLocation,
      tags
    } = req.body;

    const updateData = {
      title,
      content,
      excerpt,
      category,
      status,
      featured,
      eventDate,
      eventLocation,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };

    // Handle image update
    if (req.file) {
      // Get the existing news to delete old image
      const existingNews = await News.findById(req.params.id);
      if (existingNews && existingNews.image) {
        const oldImagePath = path.join(__dirname, '../', existingNews.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      updateData.image = `/uploads/news/${req.file.filename}`;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const news = await News.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    res.json(news);
  } catch (error) {
    console.error('Error updating news:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ message: 'Error updating news article' });
  }
});

// Delete news (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    // Delete associated image file
    if (news.image) {
      const imagePath = path.join(__dirname, '../', news.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await News.findByIdAndDelete(req.params.id);

    res.json({ message: 'News article deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ message: 'Error deleting news article' });
  }
});

// Like/Unlike news (authenticated users)
router.post('/:id/like', auth, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    const userId = req.user.id;
    const isLiked = news.likes.includes(userId);

    if (isLiked) {
      // Unlike
      news.likes = news.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      news.likes.push(userId);
    }

    await news.save();

    res.json({ 
      liked: !isLiked, 
      likeCount: news.likes.length 
    });
  } catch (error) {
    console.error('Error liking news:', error);
    res.status(500).json({ message: 'Error liking news article' });
  }
});

// Add comment (authenticated users)
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    news.comments.push({
      user: req.user.id,
      content: content.trim()
    });

    await news.save();

    // Populate the new comment
    const updatedNews = await News.findById(req.params.id)
      .populate('comments.user', 'name');

    const newComment = updatedNews.comments[updatedNews.comments.length - 1];

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Get all news for admin (admin only)
router.get('/admin/all', auth, adminAuth, async (req, res) => {
  try {
    const { 
      status,
      category,
      limit = 20,
      page = 1,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const news = await News.find(query)
      .populate('author', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await News.countDocuments(query);
    
    res.json({
      news,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin news:', error);
    res.status(500).json({ message: 'Error fetching news' });
  }
});

module.exports = router;
