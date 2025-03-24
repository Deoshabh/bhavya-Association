import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { withRetry } from '../utils/serverUtils';

/**
 * Hook to provide authenticated API requests with consistent error handling
 * @returns {Object} Functions for making authenticated requests
 */
const useAuthenticatedRequest = () => {
  const { api, refreshToken, handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();

  /**
   * Make an authenticated API request with automatic token refresh on 401
   * @param {Function} requestFn - API request function to execute
   * @param {Object} options - Request options
   * @returns {Promise} Response data or throws error
   */
  const authRequest = useCallback(async (requestFn, options = {}) => {
    const {
      maxRetries = 2,
      throttleKey = null,
      bypassThrottle = false,
      redirectOnAuthFailure = true,
      redirectPath = '/login'
    } = options;

    try {
      return await withRetry(
        requestFn,
        maxRetries,
        throttleKey,
        bypassThrottle,
        async () => {
          // Try to refresh the token
          if (refreshToken) {
            return await refreshToken();
          }
          return false;
        }
      );
    } catch (error) {
      // Handle authentication failures
      if (error.response?.status === 401) {
        console.error('Authentication failed', error);
        
        // Perform cleanup
        handleLogout();
        
        // Redirect if needed
        if (redirectOnAuthFailure) {
          const currentPath = window.location.pathname;
          navigate(redirectPath, { 
            state: { from: currentPath } 
          });
        }
      }
      
      // Re-throw the error for component-specific handling
      throw error;
    }
  }, [api, refreshToken, handleLogout, navigate]);

  return { authRequest };
};

export default useAuthenticatedRequest;
