// Load environment variables at the very beginning
require('dotenv').config();

// Log the environment configuration on startup
console.log('Environment configuration:');
console.log('- Node Environment:', process.env.NODE_ENV || 'development');
console.log('- Port:', process.env.PORT || '5000 (default)');
console.log('- MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
console.log('- JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'NOT SET (CRITICAL ERROR)');

// If JWT_SECRET is not set, log a warning
if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not set! Authentication will fail.');
  console.error('Please check your .env file and restart the server.');
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 5000;

// Enhanced security middleware
app.use(helmet());

// Configure CORS with credentials
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://bhavyasangh.com',
  credentials: true
}));

// Parse cookies and JSON
app.use(cookieParser());
app.use(express.json());

// Cookie security middleware
app.use((req, res, next) => {
  res.cookie = function(name, value, options) {
    options = options || {};
    
    // Add security settings to all cookies
    options.httpOnly = options.httpOnly !== false;
    options.secure = process.env.NODE_ENV === 'production';
    options.sameSite = options.sameSite || 'lax';
    
    return express.response.cookie.call(this, name, value, options);
  };
  next();
});

// Cache control for static assets
app.use('/static', express.static(path.join(__dirname, '../frontend/build/static'), {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // No cache for HTML files
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.endsWith('.css') || path.endsWith('.js')) {
      // Long-term caching for CSS and JS with versioning
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
      // Images can be cached for 1 week
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

// MongoDB connection
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
});

// Routes
// Add your routes here like this:
// const someRouter = require('./routes/some');
// app.use('/api/some', someRouter);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});