import axios from 'axios';

// Create a centralized API instance
const api = axios.create({
  baseURL: 'http://api.bhavyasangh.com'
});

// Add a request interceptor to always include the latest token
api.interceptors.request.use(
  config => {
    // Get the latest token from localStorage before each request
    const token = localStorage.getItem('token');
    
    if (token) {
      // Add Authorization header with token
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Ensure headers object exists and is properly structured
      if (!config.headers) {
        config.headers = {};
      }
      
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
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token-related errors
api.interceptors.response.use(
  response => response,
  async error => {
    // Log detailed error information for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', {
        endpoint: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        hasToken: !!localStorage.getItem('token')
      });
    }
    
    // Add check for login success but token cleared issue
    if (error.response?.status === 401 && 
        error.config?.url?.includes('/api/profile') && 
        localStorage.getItem('token')) {
      console.warn('Auth error despite token in localStorage - possible sync issue');
      // Can add additional recovery logic here if needed
    }
    
    return Promise.reject(error);
  }
);

export default api;
