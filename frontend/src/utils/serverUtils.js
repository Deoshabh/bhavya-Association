import axios from 'axios';

const BASE_URL = 'https://api.bhavyasangh.com';

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

// **Directory Cache**
const directoryCache = {
  data: null,
  timestamp: 0,
};
let ongoingDirectoryFetch = null;
const DIRECTORY_CACHE_TTL = 300000; // 5 minutes

// **API Response Cache**
const apiCache = new Map();

/**
 * Normalizes an API URL path to ensure consistent format
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL
 */
const normalizeApiPath = (url) => {
  if (!url) return url;
  
  // If URL already has external protocol/domain, leave it alone
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Strip duplicate /api prefixes
  let normalizedUrl = url;
  while (normalizedUrl.includes('/api/api/')) {
    normalizedUrl = normalizedUrl.replace('/api/api/', '/api/');
  }
  
  // Handle case where url doesn't start with /api
  if (!normalizedUrl.startsWith('/api/') && !normalizedUrl.startsWith('/health')) {
    normalizedUrl = '/api' + (normalizedUrl.startsWith('/') ? normalizedUrl : '/' + normalizedUrl);
  }
  
  return normalizedUrl;
};

/**
 * Checks if the server is up with caching to avoid frequent checks.
 * @returns {Promise<boolean>} True if server is available, false otherwise
 */
export const checkServerStatus = async () => {
  const now = Date.now();

  // Return cached result if still valid
  if (now - serverStatusCache.timestamp < serverStatusCache.ttl) {
    return serverStatusCache.isUp;
  }

  try {
    // Use normalized path to ensure correct URL format
    const response = await axios.get(normalizeApiPath('/health'), { timeout: 3000 });
    const isUp = response.data && response.data.status === 'ok';
    serverStatusCache = { isUp, timestamp: now, ttl: 5000 };
    return isUp;
  } catch (error) {
    serverStatusCache = { isUp: false, timestamp: now, ttl: 30000 }; // 30 seconds on failure
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