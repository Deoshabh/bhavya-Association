// Ensure we use the centralized API service for consistent token handling
import api from '../services/api';
import { withRetry } from '../utils/serverUtils';

// Component code here...

export const fetchListings = async () => {
  try {
    // Make sure we're using the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token available for listings fetch');
    }
    
    // Log the auth header for debugging
    console.log('Auth header before listings request:', 
      token ? `Bearer ${token.substring(0, 10)}...` : 'None');
    
    // Use the centralized API instance with proper auth
    const response = await withRetry(
      () => api.get('/api/listings'),
      3,
      'listings'
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    throw error;
  }
};

// Rest of the component...
