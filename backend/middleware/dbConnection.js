const { ensureConnected, isDbConnected, getConnectionState } = require('../config/db');

/**
 * Middleware to ensure database is connected before proceeding with route handlers
 */
const requireDbConnection = async (req, res, next) => {
  if (isDbConnected()) {
    // If already connected, proceed immediately
    return next();
  }
  
  try {
    // Attempt to establish connection
    console.log('Establishing database connection before processing request...');
    await ensureConnected();
    next();
  } catch (err) {
    console.error('Failed to establish database connection for request:', err);
    
    // Get detailed connection state for diagnostics
    const connState = getConnectionState();
    
    res.status(500).json({
      msg: 'Database connection is currently unavailable',
      error: 'DB_CONNECTION_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        errorMessage: err.message,
        errorName: err.name,
        connectionState: {
          isConnecting: connState.isConnecting,
          isConnected: connState.isConnected,
          hasError: !!connState.connectionError
        }
      } : undefined
    });
  }
};

module.exports = requireDbConnection;
