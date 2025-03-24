const mongoose = require('mongoose');
require('dotenv').config();

// Enhanced connection state management
let connectionState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  reconnectTimer: null,
  connectionPromise: null
};

/**
 * Connect to MongoDB with proper connection state tracking
 */
const connectDB = async () => {
  // If already connected, return the existing connection
  if (connectionState.isConnected) {
    console.log('Using existing MongoDB connection');
    return mongoose.connection;
  }
  
  // If connection attempt is in progress, wait for it to complete
  if (connectionState.isConnecting && connectionState.connectionPromise) {
    console.log('Connection attempt already in progress, waiting...');
    return connectionState.connectionPromise;
  }
  
  // Start a new connection attempt
  connectionState.isConnecting = true;
  connectionState.connectionError = null;
  
  // Create a promise for this connection attempt
  connectionState.connectionPromise = new Promise(async (resolve, reject) => {
    try {
      // Clear any existing reconnect timer
      if (connectionState.reconnectTimer) {
        clearTimeout(connectionState.reconnectTimer);
        connectionState.reconnectTimer = null;
      }
      
      console.log('Attempting MongoDB connection...');
      
      // Connect to MongoDB
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        connectTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000,  // 45 seconds
      });
      
      // Update connection state on success
      connectionState.isConnected = true;
      connectionState.isConnecting = false;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      
      // Set up disconnection handler
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected - will try to reconnect...');
        connectionState.isConnected = false;
        
        // Set up automatic reconnection with exponential backoff
        if (!connectionState.reconnectTimer) {
          connectionState.reconnectTimer = setTimeout(() => {
            console.log('Attempting to reconnect to MongoDB...');
            connectionState.reconnectTimer = null;
            connectDB().catch(err => {
              console.error('Reconnection attempt failed:', err);
            });
          }, 5000); // Try to reconnect after 5 seconds
        }
      });
      
      // Set up error handler
      mongoose.connection.on('error', err => {
        console.error('MongoDB connection error:', err);
        connectionState.connectionError = err;
        connectionState.isConnected = false;
      });
      
      resolve(mongoose.connection);
    } catch (err) {
      // Handle connection errors
      connectionState.isConnecting = false;
      connectionState.connectionError = err;
      console.error(`MongoDB connection error: ${err.message}`);
      
      // Make error more detailed for troubleshooting
      if (err.name === 'MongoNetworkError') {
        console.error('Network error connecting to MongoDB - check if MongoDB server is running');
      }
      if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI environment variable is not set!');
      }
      
      // Set up automatic reconnection with exponential backoff
      if (!connectionState.reconnectTimer) {
        connectionState.reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect to MongoDB...');
          connectionState.reconnectTimer = null;
          connectDB().catch(err => {
            console.error('Reconnection attempt failed:', err);
          });
        }, 5000); // Try to reconnect after 5 seconds
      }
      
      reject(err);
    }
  });
  
  return connectionState.connectionPromise;
};

/**
 * Check if MongoDB is currently connected
 */
const isDbConnected = () => connectionState.isConnected;

/**
 * Get the current connection state object (for diagnostics)
 */
const getConnectionState = () => ({
  ...connectionState,
  connectionPromise: connectionState.connectionPromise ? 'Promise<Connection>' : null
});

/**
 * Ensure MongoDB is connected before proceeding
 * @returns {Promise<mongoose.Connection>} Mongoose connection object
 */
const ensureConnected = async () => {
  if (!connectionState.isConnected) {
    return connectDB();
  }
  return mongoose.connection;
};

/**
 * Wait for the database to be ready with a timeout
 * @param {number} timeoutMs - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} True if connected, false if timeout
 */
const waitForConnection = async (timeoutMs = 10000) => {
  if (connectionState.isConnected) {
    return true;
  }
  
  let attempts = 0;
  const maxAttempts = timeoutMs / 100;
  
  return new Promise(resolve => {
    const checkConnection = () => {
      attempts++;
      if (connectionState.isConnected) {
        resolve(true);
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.error(`Connection timeout after ${timeoutMs}ms`);
        resolve(false);
        return;
      }
      
      setTimeout(checkConnection, 100);
    };
    
    checkConnection();
  });
};

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;
module.exports.ensureConnected = ensureConnected;
module.exports.waitForConnection = waitForConnection;
module.exports.getConnectionState = getConnectionState;