require('dotenv').config(); // Load environment variables first
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const directoryRoutes = require('./routes/directory');
const usersRoutes = require('./routes/users');
const listingsRoutes = require('./routes/listings'); // Add this line
const adminRoutes = require('./routes/admin'); // Add this line
const validateUserSchema = require('./utils/validateUserSchema');
const requireDbConnection = require('./middleware/dbConnection');
const { verifyModels } = require('./utils/modelUtil');

// Create Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Basic health check endpoint - doesn't require DB connection
app.get('/api/health', (req, res) => {
  // Check database connection status
  const { isDbConnected, getConnectionState } = require('./config/db');
  const connectionState = getConnectionState();
  
  res.json({
    status: 'ok',
    message: 'Server is running',
    database: {
      connected: isDbConnected(),
      connecting: connectionState.isConnecting,
      connectionError: connectionState.connectionError ? {
        name: connectionState.connectionError.name,
        message: connectionState.connectionError.message
      } : null,
      uri: process.env.MONGODB_URI ? 'Configured (hidden)' : 'Not configured'
    },
    time: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      port: process.env.PORT || 5000
    }
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  // Check database connection status
  const { isDbConnected, getConnectionState } = require('./config/db');
  const connectionState = getConnectionState();
  
  res.json({
    message: 'Debug endpoint working',
    jwt_configured: !!process.env.JWT_SECRET,
    mongodb_configured: !!process.env.MONGODB_URI,
    mongodb_connected: isDbConnected(),
    mongodb_connecting: connectionState.isConnecting,
    server_time: new Date().toISOString()
  });
});

// Apply DB connection middleware to all database-dependent routes
app.use('/api/auth', requireDbConnection, authRoutes);
app.use('/api/profile', requireDbConnection, profileRoutes);
app.use('/api/directory', requireDbConnection, directoryRoutes);
app.use('/api/users', requireDbConnection, usersRoutes);
app.use('/api/listings', requireDbConnection, listingsRoutes); // Add this line
app.use('/api/admin', requireDbConnection, adminRoutes); // Add this line

// Initialize database connection before setting up routes
async function startServer() {
  try {
    // Connect to database first - will throw error if connection fails
    await connectDB();
    console.log('Database connection established successfully');
    
    // Set up a periodic connection check to ensure we stay connected
    setInterval(async () => {
      const { isDbConnected, ensureConnected } = require('./config/db');
      if (!isDbConnected()) {
        console.log('Database connection check: Disconnected - attempting to reconnect...');
        try {
          await ensureConnected();
          console.log('Database reconnection successful');
        } catch (err) {
          console.error('Failed to reestablish database connection:', err.message);
        }
      }
    }, 30000); // Check every 30 seconds
    
    // Validate schema once database is connected
    if (process.env.NODE_ENV !== 'test') {
      console.log('Validating user schema...');
      try {
        await validateUserSchema();
      } catch (schemaErr) {
        console.error('Schema validation error:', schemaErr);
        // Continue despite schema errors - they're not fatal
      }
    }

    // After connecting to database and registering all models
    verifyModels();
    
    // Start the server only after database is connected
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    console.error('Application cannot start without database connection');
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1); // Exit in production
    } else {
      console.log('Retrying database connection in 5 seconds...');
      setTimeout(() => startServer(), 5000); // Retry in development
    }
  }
}

// Start the server
startServer();

// Export app for testing purposes
module.exports = app;