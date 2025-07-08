const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { upload } = require('../middleware/upload');

// Debug endpoint for upload testing
router.post('/upload', auth, adminAuth, upload.single('image'), (req, res) => {
  try {
    console.log('🔍 DEBUG UPLOAD REQUEST 🔍');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    // Check upload directory
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads');
    const newsUploadsDir = path.join(uploadsDir, 'news');
    
    console.log('Uploads directory exists:', fs.existsSync(uploadsDir));
    console.log('News uploads directory exists:', fs.existsSync(newsUploadsDir));
    
    if (req.file) {
      // Check if file was actually saved
      const savedFilePath = path.join(newsUploadsDir, req.file.filename);
      console.log('File saved path:', savedFilePath);
      console.log('File exists at path:', fs.existsSync(savedFilePath));
      console.log('Directory contents:', fs.readdirSync(newsUploadsDir));
    }
    
    res.json({
      success: true,
      file: req.file,
      body: req.body,
      uploadDirs: {
        uploadsExists: fs.existsSync(uploadsDir),
        newsUploadsExists: fs.existsSync(newsUploadsDir)
      }
    });
  } catch (error) {
    console.error('❌ Debug upload error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
