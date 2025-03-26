import axios from 'axios';

// Create a centralized API instance
const api = axios.create({
  // IMPORTANT: Check if the URL already has /api in it, which could cause duplication
  baseURL: process.env.REACT_APP_API_URL || 'https://api.bhavyasangh.com',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Enhanced debugging to print the baseURL
console.log('API baseURL set to:', api.defaults.baseURL);

// Completely rewrite the normalizeApiPath function to fix the URL duplication issue
const normalizeApiPath = (url) => {
  // If url is undefined or null, return a safe default
  if (!url) {
    console.warn('Attempting to normalize undefined or null URL');
    return '/api'; // Return a safe default
  }
  
  // Ensure url is a string
  if (typeof url !== 'string') {
    console.warn(`URL is not a string but ${typeof url}:`, url);
    return '/api';
  }
  
  // For debugging: log the incoming URL
  console.log('Normalizing URL path:', url);
  
  // If URL already has external protocol/domain, leave it alone
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Special case for health endpoint
  if (url === '/health' || url === 'health') {
    return '/health';
  }
  
  // Remove leading slash if present
  let normalizedUrl = url.startsWith('/') ? url.substring(1) : url;
  
  // Check if baseURL exists before checking if it includes /api
  const baseUrlHasApi = api.defaults.baseURL ? 
    api.defaults.baseURL.includes('/api') : false;
  
  // If baseURL already has /api AND path includes api/, we need to remove the api/ prefix from the path
  if (baseUrlHasApi && normalizedUrl.includes('api/')) {
    normalizedUrl = normalizedUrl.replace(/^api\//, '');
    normalizedUrl = normalizedUrl.replace(/\/api\//, '/');
  } else if (!baseUrlHasApi) {
    // If baseURL doesn't have /api, ensure path has it
    if (!normalizedUrl.startsWith('api/')) {
      normalizedUrl = 'api/' + normalizedUrl;
    }
  }
  
  // Final check to remove any remaining duplicate /api/api/
  while (normalizedUrl.includes('/api/api/')) {
    normalizedUrl = normalizedUrl.replace('/api/api/', '/api/');
  }
  
  // Add leading slash for consistency
  if (!normalizedUrl.startsWith('/')) {
    normalizedUrl = '/' + normalizedUrl;
  }
  
  console.log('Normalized URL:', normalizedUrl);
  return normalizedUrl;
};

// Add a request interceptor to always include the latest token and fix URL duplication
api.interceptors.request.use(
  async (config) => {
    // Get the latest token from localStorage before each request
    const token = localStorage.getItem('token');
    
    // Make sure config.url exists before trying to construct a full URL
    if (!config.url) {
      console.warn('Request interceptor received config with undefined URL');
      config.url = '/api'; // Set a default to prevent errors
    }
    
    // Safe full URL construction
    const baseURL = config.baseURL || '';
    const fullUrlBefore = `${baseURL}${config.url || ''}`;
    
    // IMPROVED URL LOGGING - Log the full URL being requested
    console.log(`Full URL before normalization: ${fullUrlBefore}`);
    
    // Fix URL duplication issue by normalizing the URL
    if (config.url) {
      config.url = normalizeApiPath(config.url);
      
      // Log the full fixed URL for debugging
      const fullUrlAfter = `${baseURL}${config.url || ''}`;
      console.log(`Full URL after normalization: ${fullUrlAfter}`);
      
      // Emergency check - if we still see /api/api/ pattern, fix it immediately
      if (config.url.includes('/api/api/')) {
        console.error('⚠️ CRITICAL: Double API prefix still detected after normalization:', config.url);
        config.url = config.url.replace('/api/api/', '/api/');
      }
    }
    
    if (token) {
      // Add Authorization header with token
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Log token being used (useful for debugging)
      if (process.env.NODE_ENV !== 'production') {
        // Safe substring operation
        const tokenPreview = typeof token === 'string' ? 
          `${token.substring(0, 10)}...` : 'invalid-token';
        console.log(`API Request to ${config.url} with token: ${tokenPreview}`);
      }
    } else {
      // Log when no token is available
      if (process.env.NODE_ENV !== 'production') {
        console.log(`API Request to ${config.url} without token - no token in localStorage`);
      }
    }
    
    return config;
  },
  error => {
    console.error('API request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better debugging
api.interceptors.response.use(
  response => {
    // Log successful responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Response from ${response.config.url}:`, {
        status: response.status,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not an array',
        dataType: typeof response.data
      });
    }
    return response;
  },
  error => {
    // Enhanced error logging for CORS issues
    if (process.env.NODE_ENV !== 'production') {
      const errorInfo = {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      };
      
      // Check for URL duplication issues
      if (error.config?.url && error.config.url.includes('/api/api/')) {
        console.error('API URL DUPLICATION DETECTED:', error.config.url);
        console.error('This is likely caused by a misconfiguration in the API URL construction.');
      }
      // Specifically check for CORS errors
      else if (error.message && error.message.includes('Network Error') && !error.response) {
        console.error('CORS Error detected:', errorInfo);
        console.error('This is likely a CORS configuration issue. Check that the backend allows requests from this origin.');
      } else {
        console.error('API Error:', errorInfo);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
