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
try {
  console.log("Loading routes...");

  const authRoutes = require("./routes/auth");
  console.log("✅ Auth routes loaded");

  const adminRoutes = require("./routes/admin");
  console.log("✅ Admin routes loaded");

  const userRoutes = require("./routes/users");
  console.log("✅ User routes loaded");

  const listingRoutes = require("./routes/listings");
  console.log("✅ Listing routes loaded");

  const newsRoutes = require("./routes/news");
  console.log("✅ News routes loaded");

  const questionRoutes = require("./routes/questions");
  console.log("✅ Question routes loaded");

  const answerRoutes = require("./routes/answers");
  console.log("✅ Answer routes loaded");

  const referralRoutes = require("./routes/referrals");
  console.log("✅ Referral routes loaded");

  const profileRoutes = require("./routes/profile");
  console.log("✅ Profile routes loaded");

  const directoryRoutes = require("./routes/directory");
  console.log("✅ Directory routes loaded");

  const formsRoutes = require("./routes/forms");
  console.log("✅ Forms routes loaded");

  const submissionsRoutes = require("./routes/submissions");
  console.log("✅ Submissions routes loaded");

  // Add health check route for testing
  app.get("/health", (req, res) => {
    res.json({
      status: "Server is running",
      timestamp: new Date().toISOString(),
    });
  });

  // Add debug route for testing
  app.get("/debug", (req, res) => {
    res.json({
      message: "Debug endpoint working",
      env: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      mongoConnection: {
        readyState: mongoose.connection.readyState,
        readyStates: {
          0: "disconnected",
          1: "connected",
          2: "connecting",
          3: "disconnecting",
        },
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
    });
  });

  console.log("Applying routes to app...");

  // Apply routes
  app.use("/auth", authRoutes);
  console.log("✅ Auth routes applied");

  app.use("/admin", adminRoutes);
  console.log("✅ Admin routes applied");

  app.use("/users", userRoutes);
  console.log("✅ User routes applied");

  app.use("/listings", listingRoutes);
  console.log("✅ Listing routes applied");

  app.use("/news", newsRoutes);
  console.log("✅ News routes applied");

  app.use("/questions", questionRoutes);
  console.log("✅ Question routes applied");

  app.use("/answers", answerRoutes);
  console.log("✅ Answer routes applied");

  app.use("/referrals", referralRoutes);
  console.log("✅ Referral routes applied");

  app.use("/profile", profileRoutes);
  console.log("✅ Profile routes applied");

  app.use("/directory", directoryRoutes);
  console.log("✅ Directory routes applied");

  app.use("/forms", formsRoutes);
  console.log("✅ Forms routes applied");

  app.use("/submissions", submissionsRoutes);
  console.log("✅ Submissions routes applied");

  console.log("All routes loaded successfully!");
} catch (error) {
  console.error("❌ Error loading routes:", error.message);
  console.error("Stack trace:", error.stack);
}

// Start server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
