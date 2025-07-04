const express = require('express');
const path = require('path');
const fs = require('fs');

// Simple container-friendly server
const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 BHAVYA Frontend Server Starting...');
console.log(`🔗 Port: ${port}`);
console.log(`📂 Directory: ${__dirname}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Check build directory
const buildPath = path.join(__dirname, 'build');
console.log(`📁 Build path: ${buildPath}`);

try {
  const buildExists = fs.existsSync(buildPath);
  console.log(`📁 Build exists: ${buildExists}`);
  
  if (buildExists) {
    const indexExists = fs.existsSync(path.join(buildPath, 'index.html'));
    console.log(`📄 Index.html exists: ${indexExists}`);
  }
} catch (error) {
  console.error('❌ Error checking build:', error.message);
}

// Simple middleware for headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🩺 Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: port,
    buildPath: buildPath,
    buildExists: fs.existsSync(buildPath)
  });
});

// Serve static files from build directory
app.use(express.static(buildPath, {
  index: false, // Don't serve index.html automatically
  maxAge: '1d'
}));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  console.log(`📄 Serving request: ${req.path}`);
  
  const indexPath = path.join(buildPath, 'index.html');
  
  // Check if index.html exists
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ index.html not found at: ${indexPath}`);
    return res.status(404).send(`
      <h1>Build Error</h1>
      <p>index.html not found</p>
      <p>Build path: ${buildPath}</p>
      <p>Index path: ${indexPath}</p>
      <p>Please check your build process</p>
    `);
  }
  
  // Set no-cache headers for HTML
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error serving index.html:', err.message);
      res.status(500).send(`
        <h1>Server Error</h1>
        <p>Could not serve index.html</p>
        <p>Error: ${err.message}</p>
      `);
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server with error handling
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
}).on('error', (err) => {
  console.error('❌ Server start error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM received');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📛 SIGINT received');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

console.log('🎯 Server setup complete, waiting for requests...');
