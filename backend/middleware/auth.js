const jwt = require('jsonwebtoken');
require('dotenv').config();

// Track recent token verifications to reduce logging and prevent repeated verifications
const verificationCache = new Map();
// Add a cache specifically for tracking recently expired tokens
const expiredTokensCache = new Map();
const CACHE_TTL = 30000; // 30 seconds for cache TTL
const EXPIRED_CACHE_TTL = 300000; // 5 minutes for expired tokens cache (longer to reduce noise)

// The actual middleware function
const authMiddleware = (req, res, next) => {
  // Log the path being accessed for debugging
  console.log(`Auth middleware accessed for ${req.method} ${req.originalUrl}`);
  
  // Get token from header
  const authHeader = req.header('Authorization');

  // Check if no header or not properly formatted
  if (!authHeader) {
    console.log(`No auth header provided for ${req.originalUrl}`);
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Check if header format is correct
  if (!authHeader.startsWith('Bearer ')) {
    console.log(`Invalid auth header format for ${req.originalUrl}: ${authHeader.substring(0, 15)}`);
    return res.status(401).json({ msg: 'Invalid token format' });
  }

  // Extract token from header
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    console.log(`Empty token after Bearer prefix for ${req.originalUrl}`);
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('Error: JWT_SECRET is not configured in environment variables!');
      return res.status(500).json({ 
        msg: 'Server configuration error: JWT_SECRET missing',
        envError: true
      });
    }
    
    // Log the JWT_SECRET first few chars for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Using JWT_SECRET: ${process.env.JWT_SECRET.substring(0, 5)}...`);
      console.log(`Token first 10 chars: ${token.substring(0, 10)}...`);
    }
    
    // Check if token is known to be expired (to avoid repeated verification and logging)
    const tokenLastChars = token.slice(-20); // Use last 20 chars as identifier
    if (expiredTokensCache.has(tokenLastChars)) {
      // Token is known to be expired, return 401 without additional verification or logging
      return res.status(401).json({
        msg: 'Token has expired',
        errorType: 'TokenExpiredError'
      });
    }
    
    // Check cache first to reduce logging and processing
    const cacheKey = token.slice(-20); // Use part of token as key to avoid storing full tokens
    const currentTime = Date.now();
    const cachedVerification = verificationCache.get(cacheKey);

    if (cachedVerification && (currentTime - cachedVerification.timestamp < CACHE_TTL)) {
      // Use cached result if that's still valid
      req.user = cachedVerification.user;
      return next();
    }

    // Verify token if not in cache or cache expired
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Only log verification once every 10 seconds per token
      if (!cachedVerification || (currentTime - cachedVerification.logTimestamp > 10000)) {
        console.log(`Token verified for user ID: ${decoded.user.id}`);

        // Clean up old cache entries periodically if cache size exceeds 100
        if (verificationCache.size > 100) {
          const keysToDelete = [];
          verificationCache.forEach((value, key) => {
            if (currentTime - value.timestamp > CACHE_TTL) {
              keysToDelete.push(key);
            }
          });
          keysToDelete.forEach((key) => verificationCache.delete(key));
        }

        // Cache the verification with a new logTimestamp
        verificationCache.set(cacheKey, {
          user: decoded.user,
          timestamp: currentTime,
          logTimestamp: currentTime,
        });
      } else {
        // Update cache with new timestamp but preserve old logTimestamp
        verificationCache.set(cacheKey, {
          user: decoded.user,
          timestamp: currentTime,
          logTimestamp: cachedVerification.logTimestamp,
        });
      }

      // Set user from token payload
      req.user = decoded.user;
      next();
    } catch (verifyErr) {
      // Handle specific JWT errors
      if (verifyErr.name === 'JsonWebTokenError') {
        console.error('JWT Verification Error:', {
          error: verifyErr.message,
          tokenSnippet: `${token.substring(0, 10)}...${token.substring(token.length - 10)}`,
          secretSnippet: process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 5)}...` : 'undefined'
        });
        return res.status(401).json({ 
          msg: 'Token is invalid - signature verification failed', 
          errorType: verifyErr.name,
          errorDetails: verifyErr.message
        });
      } else if (verifyErr.name === 'TokenExpiredError') {
        // Cache this token as expired to avoid re-verification and repeated logging
        expiredTokensCache.set(tokenLastChars, {
          timestamp: currentTime,
          expiredAt: verifyErr.expiredAt
        });
        
        // Clean up expired tokens cache if it grows too large
        if (expiredTokensCache.size > 500) {
          const keysToDelete = [];
          expiredTokensCache.forEach((value, key) => {
            if (currentTime - value.timestamp > EXPIRED_CACHE_TTL) {
              keysToDelete.push(key);
            }
          });
          keysToDelete.forEach(key => expiredTokensCache.delete(key));
        }
        
        // Log expired token error only if we haven't logged it recently
        // or if this is a verify-token endpoint (which needs accurate response)
        if (req.originalUrl.includes('/api/auth/verify-token') || 
            !cachedVerification || 
            (currentTime - cachedVerification.logTimestamp > 60000)) { // Log once per minute max
          console.log(`Token expired at ${verifyErr.expiredAt} for request to ${req.originalUrl}`);
        }
        
        return res.status(401).json({
          msg: 'Token has expired',
          errorType: 'TokenExpiredError',
          expiredAt: verifyErr.expiredAt
        });
      } else {
        throw verifyErr; // Re-throw unexpected errors
      }
    }
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token verification failed', error: err.message });
  }
};

// Export the middleware and the verification cache for debug purposes
module.exports = authMiddleware;
module.exports.getVerificationCache = () => verificationCache;
module.exports.getExpiredTokensCache = () => expiredTokensCache; // Export for debugging

// Optional auth middleware - adds user info if token is present but doesn't block unauthenticated requests
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  // If no auth header, continue without user info
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    // If token is invalid, continue without user info (don't block the request)
    console.log('Invalid token in optional auth, continuing without user info:', err.message);
    req.user = null;
    next();
  }
};

module.exports.optionalAuth = optionalAuthMiddleware;
