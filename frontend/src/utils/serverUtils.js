import axios from 'axios';

// Remove unused BASE_URL since we use environment variables

// **Server Status Cache**
let serverStatusCache = {
  isUp: true,
  timestamp: 0,
  ttl: 5000 // 5 seconds
};

// **Throttle Registry**
const throttleRegistry = new Map();

// **User Profile Cache**
const userProfileCache = new Map();
const ongoingUserFetches = new Map();
const USER_PROFILE_CACHE_TTL = 300000; // 5 minutes
const MAX_USER_PROFILE_CACHE_SIZE = 100;

// **Directory Cache - keeping for future use**
const directoryCache = {
  data: null,
  timestamp: 0,
};
// eslint-disable-next-line no-unused-vars
let ongoingDirectoryFetch = null;
// Note: DIRECTORY_CACHE_TTL removed as unused

// **API Response Cache**
const apiCache = new Map();

/**
 * Checks if the server is available by making a request to the health endpoint
 * @returns {Promise<boolean>} Whether the server is available
 */
export const checkServerStatus = async () => {
  try {
    // Use a cache to prevent frequent server checks
    const now = Date.now();
    const lastCheck = serverStatusCache.timestamp || 0;
    const cacheAge = now - lastCheck;
    
    // If we have a recent cached status, use it (within 30 seconds)
    if (cacheAge < 30000 && serverStatusCache.status !== undefined) {
      return serverStatusCache.status;
    }
    
    // Create a new axios instance for this specific request to avoid interceptors
    const instance = axios.create({
      timeout: 5000 // 5 second timeout to prevent long waiting periods
    });
    
    // Make a request to the health endpoint
    const response = await instance.get(
      `${process.env.REACT_APP_API_URL || 'https://api.bhavyasangh.com'}/api/health`
    );
    
    // Consider the server up if we get any valid response, even if it indicates DB issues
    const isUp = response && response.status >= 200 && response.status < 500;
    
    // Update cache
    serverStatusCache.status = isUp;
    serverStatusCache.timestamp = now;
    
    return isUp;
  } catch (error) {
    // Only update the cache if more than 10 seconds have passed since the last check
    // This prevents immediate caching of down status, reducing false negatives on temporary issues
    const now = Date.now();
    const lastCheck = serverStatusCache.timestamp || 0;
    if (now - lastCheck > 10000) {
      serverStatusCache.status = false;
      serverStatusCache.timestamp = now;
    }
    
    console.warn('Server status check failed:', error.message);
    return false;
  }
};

/**
 * Determines if a request should be throttled based on its key.
 * @param {string} key - Unique identifier for the request type
 * @returns {boolean} True if request should be throttled, false if it can proceed
 */
export const shouldThrottleRequest = (key) => {
  const cooldown = (key && (key.startsWith('profile-') || key === 'directory' || key.startsWith('user-profile-')))
    ? 1000  // 1 second for profile, directory, and user-profile requests
    : 3000; // 3 seconds for other requests

  const now = Date.now();
  const lastCallTime = throttleRegistry.get(key) || 0;

  if (now - lastCallTime < cooldown) {
    console.log(`Request to ${key} throttled (last request ${now - lastCallTime}ms ago)`);
    return true;
  }

  throttleRegistry.set(key, now);
  return false;
};

/**
 * Fetches user profile data with caching and deduplication of concurrent requests.
 * @param {string} userId - ID of the user to fetch
 * @param {Function} fetchFn - Function to fetch user profile
 * @param {boolean} [forceRefresh=false] - Bypass cache if true
 * @returns {Promise<Object>} User profile data
 */
export const getCachedUserProfile = async (userId, fetchFn, forceRefresh = false) => {
  const now = Date.now();
  const cacheKey = `user-${userId}`;
  const cacheEntry = userProfileCache.get(cacheKey);

  // Return cached data if valid and not forced to refresh
  if (!forceRefresh && cacheEntry && now - cacheEntry.timestamp < USER_PROFILE_CACHE_TTL) {
    console.log(`Using cached profile for user ${userId}`);
    return cacheEntry.data;
  }

  // Deduplicate concurrent requests
  if (ongoingUserFetches.has(cacheKey)) {
    console.log(`Waiting for ongoing fetch for user ${userId}`);
    return ongoingUserFetches.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const data = await fetchFn();
      userProfileCache.set(cacheKey, { data, timestamp: now });

      // Clean up cache if it exceeds size limit
      if (userProfileCache.size > MAX_USER_PROFILE_CACHE_SIZE) {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, entry] of userProfileCache.entries()) {
          if (entry.timestamp < oldestTime) {
            oldestTime = entry.timestamp;
            oldestKey = key;
          }
        }
        if (oldestKey) userProfileCache.delete(oldestKey);
      }

      return data;
    } catch (error) {
      if (cacheEntry) {
        console.warn(`Fetch failed for user ${userId}, using stale cache`);
        return cacheEntry.data;
      }
      throw error;
    } finally {
      ongoingUserFetches.delete(cacheKey);
    }
  })();

  ongoingUserFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
};

/**
 * Clears the user profile cache for a specific user or all users.
 * @param {string} [userId] - Optional user ID to clear
 */
export const clearUserProfileCache = (userId = null) => {
  if (userId) {
    const cacheKey = `user-${userId}`;
    userProfileCache.delete(cacheKey);
    ongoingUserFetches.delete(cacheKey);
  } else {
    userProfileCache.clear();
    ongoingUserFetches.clear();
  }
};

/**
 * Get directory data with caching
 * @param {Function} fetchFunction - Function to call API
 * @returns {Promise<Object>} - API response
 */
export const getCachedDirectory = async (fetchFunction) => {
  console.log('getCachedDirectory called');
  
  try {
    // Try to get response directly without caching during debugging
    console.log('Bypassing cache for directory data');
    const response = await fetchFunction();
    
    // Log response for debugging
    console.log('Directory response received:', {
      status: response.status,
      isArray: Array.isArray(response.data),
      dataLength: Array.isArray(response.data) ? response.data.length : 'not array'
    });
    
    return response;
  } catch (error) {
    console.error('Error in getCachedDirectory:', error);
    throw error;
  }
};

/**
 * Clears the directory cache.
 */
export const clearDirectoryCache = () => {
  directoryCache.data = null;
  directoryCache.timestamp = 0;
  ongoingDirectoryFetch = null;
};

/**
 * Makes an API request with automatic retries and request throttling
 * Improved error handling and retry logic
 * 
 * @param {Function} requestFn - The function that makes the API request
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {string} requestId - Unique ID for this request type for throttling purposes
 * @param {boolean} bypassThrottle - Whether to bypass throttling check
 * @param {Function} authRefreshFn - Function to refresh auth token
 * @returns {Promise} - The API response or error
 */
export const withRetry = async (
  requestFn, 
  maxRetries = 3, 
  requestId = 'request',
  bypassThrottle = false,
  authRefreshFn = null
) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if we should throttle (skip on first attempt if bypass flag is set)
      if (attempt === 1 && !bypassThrottle) {
        const throttleKey = typeof requestId === 'string' ? requestId : 'generic-request';
        const shouldThrottle = shouldThrottleRequest(throttleKey);
        
        if (shouldThrottle) {
          console.log(`Request ${throttleKey} is being throttled`);
          throw new Error(`Request ${throttleKey} is throttled. Please try again later.`);
        }
      }
      
      // Before making the request, ensure we have the latest token
      const token = localStorage.getItem('token');
      
      // Log the current attempt for debugging
      console.log(`Request ${requestId} attempt ${attempt}/${maxRetries} with token: ${token ? `${token.substring(0, 10)}...` : 'Missing'}`);
      
      // Make the request
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Log error for debugging
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Check if the error was due to authorization
      if (error.response?.status === 401) {
        console.log('Authentication error detected, attempting to refresh token');
        
        // If we have a token refresh function, try to refresh before retrying
        if (authRefreshFn) {
          try {
            const refreshSuccessful = await authRefreshFn();
            if (!refreshSuccessful) {
              console.error('Token refresh failed, aborting retry sequence');
              throw error; // Don't retry if refresh failed
            }
            console.log('Token refreshed successfully, continuing with retry');
            continue; // Skip delay and retry immediately with new token
          } catch (refreshError) {
            console.error('Error during token refresh:', refreshError);
            throw error; // Don't retry if refresh threw an error
          }
        } else {
          // If no refresh function provided, we can't recover from a 401
          console.log('No token refresh function provided, cannot recover from 401');
          throw error;
        }
      }
      
      // For other errors, if we have attempts left, wait before retrying
      if (attempt < maxRetries) {
        // Calculate exponential backoff delay: 1s, 2s, 4s, etc.
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If we've used all attempts, throw the last error
      throw lastError;
    }
  }
};

/**
 * Makes an API call with caching support.
 * @param {Function} apiCall - The API call function
 * @param {string} cacheKey - Cache key for this request
 * @param {number} [cacheTTL=60000] - Time in ms to keep cache valid
 * @returns {Promise} API response
 */
export const withCache = async (apiCall, cacheKey, cacheTTL = 60000) => {
  const cachedItem = apiCache.get(cacheKey);
  const now = Date.now();

  if (cachedItem && now - cachedItem.timestamp < cacheTTL) {
    return cachedItem.data;
  }

  const response = await apiCall();
  apiCache.set(cacheKey, { data: response, timestamp: now });
  return response;
};

/**
 * Clears all caches.
 */
export const clearAllCaches = () => {
  clearUserProfileCache();
  clearDirectoryCache();
  throttleRegistry.clear();
  apiCache.clear();
  serverStatusCache = { isUp: true, timestamp: 0, ttl: 5000 };
};