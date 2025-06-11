const express = require('express');
const path = require('path');
const fs = require('fs');

// Add process error handling to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately in production, let container orchestrator handle it
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately in production, let container orchestrator handle it
  setTimeout(() => process.exit(1), 1000);
});

// Add SIGTERM and SIGINT handlers for graceful shutdown
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📛 SIGINT received, shutting down gracefully');
  process.exit(0);
});

const app = express();

const port = process.env.PORT || 3000;

console.log('🚀 Starting BHAVYA Frontend Server...');
console.log('📂 Build directory:', path.join(__dirname, 'build'));
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 Port:', port);

// Set proper security headers
app.use((req, res, next) => {
  // CORS headers for frontend
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Serve static files from build directory with proper cache headers
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1y', // Cache static assets for 1 year
  setHeaders: (res, filePath) => {
    // Don't cache HTML files
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // Cache JS and CSS aggressively
    else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache images for shorter period
    else if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
    }
  }
}));

// Handle favicon specifically with error handling
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(__dirname, 'build', 'favicon.ico');
  res.sendFile(faviconPath, (err) => {
    if (err) {
      console.error('Error serving favicon.ico:', err);
      res.status(404).send('Favicon not found');
    }
  });
});

app.get('/favicon.webp', (req, res) => {
  const faviconPath = path.join(__dirname, 'build', 'favicon.webp');
  res.sendFile(faviconPath, (err) => {
    if (err) {
      console.error('Error serving favicon.webp:', err);
      res.status(404).send('Favicon not found');
    }
  });
});

// Handle manifest and other assets
app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(__dirname, 'build', 'manifest.json');
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(manifestPath, (err) => {
    if (err) {
      console.error('Error serving manifest.json:', err);
      res.status(404).json({ error: 'Manifest not found' });
    }
  });
});

app.get('/logo192.png', (req, res) => {
  const logoPath = path.join(__dirname, 'build', 'logo192.png');
  res.sendFile(logoPath, (err) => {
    if (err) {
      console.error('Error serving logo192.png:', err);
      res.status(404).send('Logo not found');
    }
  });
});

app.get('/logo512.png', (req, res) => {
  const logoPath = path.join(__dirname, 'build', 'logo512.png');
  res.sendFile(logoPath, (err) => {
    if (err) {
      console.error('Error serving logo512.png:', err);
      res.status(404).send('Logo not found');
    }
  });
});

// Handle robots.txt
app.get('/robots.txt', (req, res) => {
  const robotsPath = path.join(__dirname, 'build', 'robots.txt');
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(robotsPath, (err) => {
    if (err) {
      console.error('Error serving robots.txt:', err);
      res.status(404).send('Robots.txt not found');
    }
  });
});

// Handle social sharing images
app.get('/share-images/:imageName', (req, res) => {
  const { imageName } = req.params;
    // Security: Only allow specific image files to prevent directory traversal
  const allowedImages = [
    'social-banner.jpg',
    'social-banner-twitter.jpg', 
    'social-banner-square.jpg',
    'default-share.png',
    'bhavya-social-share.png',
    'bhavya-social-share.svg'
  ];
  
  if (!allowedImages.includes(imageName)) {
    return res.status(404).send('Image not found');
  }
  
  const imagePath = path.join(__dirname, 'public', 'share-images', imageName);
  
  // Set appropriate content type based on extension
  const ext = path.extname(imageName).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', 
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  
  if (contentTypes[ext]) {
    res.setHeader('Content-Type', contentTypes[ext]);
  }
  
  // Cache social images for 1 week
  res.setHeader('Cache-Control', 'public, max-age=604800');
  
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error(`Error serving ${imageName}:`, err);
      res.status(404).send('Image not found');
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'frontend',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// For any other requests, serve index.html (multi-page app handling)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'build', 'index.html');
  
  // Set no-cache headers for HTML
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Internal server error - could not serve page');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Graceful server startup with retries
const startServer = (retries = 3) => {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Frontend server running on port ${port}`);
    console.log(`📂 Build directory: ${path.join(__dirname, 'build')}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Check if build directory exists
    const buildPath = path.join(__dirname, 'build');
    const indexPath = path.join(buildPath, 'index.html');
    
    if (!fs.existsSync(buildPath)) {
      console.error('❌ ERROR: Build directory does not exist:', buildPath);
      process.exit(1);
    }
    
    if (!fs.existsSync(indexPath)) {
      console.error('❌ ERROR: index.html not found:', indexPath);
      process.exit(1);
    }
    
    console.log('✅ All required files found. Server is ready.');
    console.log(`🔗 Access the application at: http://localhost:${port}`);
  });

  server.on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
      if (retries > 0) {
        console.log(`🔄 Retrying in 2 seconds... (${retries} attempts left)`);
        setTimeout(() => {
          startServer(retries - 1);
        }, 2000);
        return;
      }
    }
    
    console.error('💀 Failed to start server after retries. Exiting...');
    process.exit(1);
  });

  // Handle server shutdown gracefully
  const gracefulShutdown = () => {
    console.log('📛 Shutting down server gracefully...');
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

// Start the server
startServer();
