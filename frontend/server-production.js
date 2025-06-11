const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Container-friendly logging
console.log('🚀 BHAVYA Frontend Server Starting...');
console.log(`🔗 Port: ${port}`);
console.log(`📂 Working Directory: ${process.cwd()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Check build directory exists
const buildPath = path.join(__dirname, 'build');
const indexPath = path.join(buildPath, 'index.html');

console.log(`📁 Build Path: ${buildPath}`);
console.log(`📄 Index Path: ${indexPath}`);

// Check files existence
try {
  const buildExists = fs.existsSync(buildPath);
  const indexExists = fs.existsSync(indexPath);
  
  console.log(`📁 Build directory exists: ${buildExists}`);
  console.log(`📄 Index.html exists: ${indexExists}`);
  
  if (!buildExists) {
    console.error('❌ FATAL: Build directory missing');
    console.error('💡 Solution: Run npm run build before deployment');
    process.exit(1);
  }
  
  if (!indexExists) {
    console.error('❌ FATAL: index.html missing');
    console.error('💡 Solution: Ensure build completed successfully');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ FATAL: Error checking files:', error.message);
  process.exit(1);
}

// Simple CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Health check - IMPORTANT for container orchestration
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port,
    uptime: process.uptime()
  });
});

// Serve static files from build directory
app.use(express.static(buildPath, {
  maxAge: '1d',
  index: false // We'll handle index.html manually
}));

// Handle all routes - SPA fallback
app.get('*', (req, res) => {
  // Set no-cache for HTML
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`❌ Error serving ${req.path}:`, err.message);
      res.status(500).send(`
        <h1>BHAVYA - Server Error</h1>
        <p>Could not serve the requested page</p>
        <p>Error: ${err.message}</p>
        <p>Path: ${req.path}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `);
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`📛 ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('💀 Forced exit after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Prevent crashes from unhandled errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server successfully started on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🌐 Application: http://localhost:${port}`);
  console.log('🎯 Server is ready to accept connections');
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
    console.error('💡 Solution: Change PORT environment variable');
  } else if (err.code === 'EACCES') {
    console.error(`❌ Permission denied for port ${port}`);
    console.error('💡 Solution: Use port > 1024 or run with proper permissions');
  }
  
  process.exit(1);
});

// Keep process alive
process.stdin.resume();
