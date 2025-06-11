const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

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
    'default-share.png'
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

app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${port}`);
  console.log(`Build directory: ${path.join(__dirname, 'build')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
