import axios from 'axios';

// Create a centralized API instance
const api = axios.create({
  // Use environment variable if available, otherwise use production URL
  baseURL: process.env.REACT_APP_API_URL || 'https://api.bhavyasangh.com',
  timeout: 15000
});

// Add a request interceptor to always include the latest token
api.interceptors.request.use(
  config => {
    // Get the latest token from localStorage before each request
    const token = localStorage.getItem('token');
    
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
    // Enhanced error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    return Promise.reject(error);
  }
);

export default api;
