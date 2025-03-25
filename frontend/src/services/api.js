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

// Utility to fix API path duplication - completely rewritten
const normalizeApiPath = (url) => {
  if (!url) return url;
  
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
  
  // Convert to a standard format: remove leading slash if present
  let normalizedUrl = url.startsWith('/') ? url.substring(1) : url;
  
  // If the path already includes '/api/', strip it since we'll add it properly
  if (normalizedUrl.includes('api/')) {
    // Strip any 'api/' prefix to avoid duplication
    normalizedUrl = normalizedUrl.replace(/^api\//, '');
  }
  
  // Now add the /api/ prefix properly
  normalizedUrl = '/api/' + normalizedUrl;
  
  // Double check for duplications that might have been missed
  while (normalizedUrl.includes('/api/api/')) {
    normalizedUrl = normalizedUrl.replace('/api/api/', '/api/');
  }
  
  // For debugging: log the final normalized URL
  console.log('Normalized to:', normalizedUrl);
  
  return normalizedUrl;
};

// Add a request interceptor to always include the latest token and fix URL duplication
api.interceptors.request.use(
  config => {
    // Get the latest token from localStorage before each request
    const token = localStorage.getItem('token');
    
    // Enhanced logging before URL normalization
    console.log('Original request URL:', config.url);
    console.log('Full request URL:', config.baseURL + config.url);
    
    // Fix URL duplication issue by normalizing the URL
    if (config.url) {
      const originalUrl = config.url;
      config.url = normalizeApiPath(config.url);
      
      // Log only if URL was changed for debugging
      if (originalUrl !== config.url) {
        console.log(`Fixed API URL path: ${originalUrl} → ${config.url}`);
        console.log('Full normalized URL:', config.baseURL + config.url);
      }
    }
    
    // Final check for /api/api pattern - this should never happen after normalization
    if (config.url && config.url.includes('/api/api/')) {
      console.error('⚠️ CRITICAL: Double API prefix still detected after normalization:', config.url);
      console.error('Full URL with baseURL:', config.baseURL + config.url);
      
      // Emergency fix to prevent request failure - not ideal but better than failing
      config.url = config.url.replace('/api/api/', '/api/');
      console.error('Emergency fixed URL:', config.url);
      console.error('This is a bug that needs to be fixed in the code!');
    }
    
    if (token) {
      // Add Authorization header with token
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Log token being used (useful for debugging)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`API Request to ${config.url} with token: ${token.substring(0, 10)}...`);
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
