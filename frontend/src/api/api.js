import axios from 'axios';

// Create a map to track in-progress requests
const pendingRequests = new Map();

// Generate a unique key for each request
const getRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    
    // Set auth header if token exists
    if (token) {
      // Trim token string to prevent logging full token
      const tokenPreview = token.substring(0, 10) + '...';
      console.log(`API Request to ${config.url} with token: ${tokenPreview}`);
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Authorization header: Bearer ${tokenPreview}`);
    } else {
      console.log(`API Request to ${config.url} without token - no token in localStorage`);
      delete config.headers.Authorization;
    }
    
    // Deduplicate identical in-flight requests
    const requestKey = getRequestKey(config);
    
    // Check if this is a GET request that can be deduplicated
    if (config.method.toLowerCase() === 'get' && !config.bypassDeduplication) {
      const pendingRequest = pendingRequests.get(requestKey);
      
      if (pendingRequest) {
        // Return the existing request promise to prevent duplicate
        console.log(`Deduplicating request to ${config.url}`);
        return Promise.reject({
          __CANCEL__: true,
          pendingRequest
        });
      }
      
      // Create a promise for this request and store it
      const requestPromise = new Promise((resolve, reject) => {
        config.__resolveRequest = resolve;
        config.__rejectRequest = reject;
      });
      
      pendingRequests.set(requestKey, requestPromise);
      config.__requestKey = requestKey;
    }
    
    return config;
  },
  (error) => {
    console.error('API request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    // Resolve any pending request
    const requestKey = response.config.__requestKey;
    if (requestKey) {
      const pendingRequest = pendingRequests.get(requestKey);
      if (pendingRequest && response.config.__resolveRequest) {
        response.config.__resolveRequest(response);
      }
      pendingRequests.delete(requestKey);
    }
    
    return response;
  },
  (error) => {
    // If this was a cancelled request due to deduplication
    if (error.__CANCEL__ && error.pendingRequest) {
      return error.pendingRequest;
    }
    
    // Reject any pending request
    const requestKey = error.config?.__requestKey;
    if (requestKey) {
      const pendingRequest = pendingRequests.get(requestKey);
      if (pendingRequest && error.config.__rejectRequest) {
        error.config.__rejectRequest(error);
      }
      pendingRequests.delete(requestKey);
    }
    
    return Promise.reject(error);
  }
);

export default api;
