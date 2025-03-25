import axios from 'axios';

// Create a centralized API instance
const api = axios.create({
  // Remove the `/api` from the baseURL as it's included in the endpoint paths
  baseURL: process.env.REACT_APP_API_URL || 'https://api.bhavyasangh.com',
  timeout: 15000,
  // Add withCredentials to work with CORS cookies if needed
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to always include the latest token
api.interceptors.request.use(
  config => {
    // Get the latest token from localStorage before each request
    const token = localStorage.getItem('token');
    
    // Fix URL duplication issue by removing any double `/api` prefixes
    if (config.url && config.url.startsWith('/api/')) {
      // URLs should start with /api/, not /api/api/
      if (config.url.startsWith('/api/api/')) {
        config.url = config.url.replace('/api/api/', '/api/');
        console.log(`Fixed duplicate API prefix in URL: ${config.url}`);
      }
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
