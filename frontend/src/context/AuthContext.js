import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import axios from 'axios';
import { withRetry, checkServerStatus } from '../utils/serverUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState(true);
  const [showReactivatePrompt, setShowReactivatePrompt] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const lastFetchTime = useRef(0);
  const pendingRequest = useRef(null);

  // Initialize token in api headers on mount and when token changes
  useEffect(() => {
    if (token) {
      console.log('Setting Authorization header with token from AuthContext');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Log to verify header is set
      console.log('Current Authorization header:', api.defaults.headers.common['Authorization']);
    } else {
      console.log('Clearing Authorization header (no token)');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setLoading(false);
  }, []);

  // Enhance refreshToken function to handle token verification errors
  const refreshToken = useCallback(async () => {
    try {
      if (!token) {
        console.log('No token to refresh');
        return false;
      }
      
      // First verify the current token status
      try {
        console.log('Verifying token before refresh attempt...');
        const verifyResponse = await api.post('/api/auth/verify-token', { token });
        
        if (verifyResponse.data.valid) {
          console.log('Current token is still valid, no need to refresh');
          return true;
        }
      } catch (verifyErr) {
        // Token validation failed, but continue with refresh attempt
        console.log('Token validation failed:', verifyErr.response?.data?.msg || verifyErr.message);
      }
      
      // Attempt to refresh token
      console.log('Attempting to refresh token...');
      const refreshRes = await api.post('/api/auth/refresh', {
        token: token
      });
      
      if (refreshRes.data?.token) {
        // Update token in state and localStorage
        const newToken = refreshRes.data.token;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        
        // Update auth headers for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        console.log('Token refreshed successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error refreshing token:', err);
      
      // Check for specific error types
      const errorType = err.response?.data?.errorType;
      const errorMsg = err.response?.data?.msg || err.message;
      
      console.log(`Token refresh failed: ${errorType} - ${errorMsg}`);
      
      // If the refresh endpoint doesn't exist (404), don't log out immediately
      if (err.response && err.response.status === 404) {
        console.log('Token refresh endpoint not available. Using current token.');
        return true; // Continue using current token
      }
      
      // For other errors, log out
      handleLogout();
      return false;
    }
  }, [api, token, handleLogout]);

  // useEffect for token validation and auto-refresh
  useEffect(() => {
    if (!token) return;

    // Function to check token validity
    const validateToken = async () => {
      try {
        // Try to make a request using the token
        await api.get('/profile/me'); // Without the /api prefix - interceptor will add it
        // If successful, token is still valid
        return true;
      } catch (error) {
        // If we get a 401, token is invalid/expired
        if (error.response?.status === 401) {
          console.log('Token validation failed - attempting token refresh');
          try {
            // Try to refresh the token
            const refreshed = await refreshToken();
            return refreshed;
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // If refresh fails, logout
            handleLogout();
            return false;
          }
        }
        // Other errors (like network) shouldn't cause logout
        return true;
      }
    };

    // Validate token initially
    validateToken();

    // Set up periodic validation (every 10 minutes)
    const intervalId = setInterval(validateToken, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [token]);

  // Enhance fetchUserProfile to pass auth error handler
  const fetchUserProfile = useCallback(async (forceRefresh = false) => {
    if (!token) {
      setLoading(false);
      return null;
    }
    
    // Don't fetch if there's already a pending request
    if (pendingRequest.current) {
      console.log('Profile request already pending, skipping duplicate fetch');
      return null;
    }
    
    const now = Date.now();
    
    // Only fetch if forced or if cooldown period has passed
    if (!forceRefresh && now - lastFetchTime.current < 10000) { // 10-second cooldown
      console.log('Profile fetch throttled - using last data');
      setLoading(false);
      return user; // Return existing user data
    }
    
    try {
      pendingRequest.current = true;
      lastFetchTime.current = now;
      
      // Use withRetry with auth error handler
      const res = await withRetry(
        () => api.get('profile/me'), // No leading slash
        2, 
        `profile-${token.slice(-10)}`,
        forceRefresh, // Bypass throttle on login or manual refresh
        async () => {
          // Try to refresh the token
          return await refreshToken();
        }
      );
      
      if (res.data) {
        // Make sure to include planType and accountStatus in the user data
        const userData = {
          ...res.data,
          planType: res.data.planType || 'free',
          accountStatus: res.data.accountStatus || 'active'
        };
        
        // If account is deactivated, show the reactivation prompt
        if (userData.accountStatus === 'deactivated') {
          console.log('Account is deactivated');
          setShowReactivatePrompt(true);
        }
        
        setUser(userData);
        setServerStatus(true);
        setLoading(false);
        return userData;
      } else {
        throw new Error('No user data returned from server');
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      
      // Don't log out on throttle errors
      if (err.message && err.message.includes('throttled')) {
        console.log('Profile fetch throttled, will retry later');
        setLoading(false);
        return user; // Return existing user data
      }
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        // Token is invalid or expired, log out
        handleLogout();
      } else {
        // Other errors - server might be down
        setServerStatus(false);
      }
      
      setLoading(false);
      throw err;
    } finally {
      pendingRequest.current = false;
    }
  }, [token, api, handleLogout, user, refreshToken]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchUserProfile();
  }, [token, fetchUserProfile]);

  // Fix login method to eliminate URL path issues
  const login = async (phoneNumber, password, isAdminLogin = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting ${isAdminLogin ? 'admin ' : ''}login with phone:`, phoneNumber);
      
      // Use the correct endpoint without any prefix - let the interceptor handle it
      const endpoint = isAdminLogin ? 'auth/admin-login' : 'auth/login';
      console.log(`Making login request to endpoint: "${endpoint}"`);
      
      // IMPORTANT FIX: The issue is with the URL, so we'll manually construct the correct URL
      // instead of relying on the interceptor which might be adding the duplicate /api
      const response = await axios({
        method: 'post',
        url: `${api.defaults.baseURL}/api/${endpoint}`,
        data: { phoneNumber, password },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.token) {
        const newToken = response.data.token;
        console.log('Token received from server:', newToken ? 'yes (length: ' + newToken.length + ')' : 'no');
        
        // Update localStorage first
        localStorage.setItem('token', newToken);
        
        // Then update state
        setToken(newToken);
        
        // Set the header explicitly for subsequent requests
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        try {
          // Get user data
          await fetchUserProfile(true).catch(err => {
            console.warn('Profile fetch error (non-fatal):', err.message);
          });
          
          return { success: true };
        } catch (profileErr) {
          console.warn('Login successful but profile fetch failed:', profileErr);
          return { 
            success: true, 
            warning: 'Profile fetch failed, data may be incomplete'
          };
        }
      } else {
        setError('Invalid response from server. Please try again.');
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (err) {
      setLoading(false);
      console.error('Login error:', err.response?.data || err.message);
      
      return { 
        success: false, 
        message: err.response?.data?.msg || 'Login failed',
        field: err.response?.data?.field,
        error: err
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, phoneNumber, occupation, password) => {
    try {
      // Sanitize phone number to ensure consistent format
      const sanitizedPhoneNumber = phoneNumber.replace(/\s+/g, '');
      
      const res = await api.post('/api/auth/register', { 
        name, 
        phoneNumber: sanitizedPhoneNumber, 
        occupation, 
        password 
      });
      
      if (!res.data.token) {
        throw new Error('Registration successful but no token received');
      }
      
      // Set auth token
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Update auth headers for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Fetch user profile with the new token
      return fetchUserProfile(true);
    } catch (error) {
      // Enhance error logging to include response data
      console.error('Registration error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Re-throw the error to be handled by the form component
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let interval = 60000;

    const checkServer = async () => {
      const isUp = await checkServerStatus();
      if (isMounted) {
        setServerStatus(isUp);
        interval = isUp ? 60000 : Math.min(interval * 2, 300000);
      }
    };

    checkServer();
    const intervalId = setInterval(checkServer, interval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const updateUser = useCallback((updates) => setUser((prev) => ({ ...prev, ...updates })), []);

  // Add account deactivation and reactivation functions
  const deactivateAccount = useCallback(async () => {
    try {
      await api.put('/api/profile/deactivate');
      handleLogout();
      return true;
    } catch (err) {
      console.error('Error deactivating account:', err);
      throw err;
    }
  }, [api, handleLogout]);

  const reactivateAccount = useCallback(async () => {
    setIsReactivating(true);
    try {
      const res = await api.put('/api/profile/reactivate');
      
      if (res.data && res.data.user) {
        // Update the user object with the new account status
        setUser(prevUser => ({
          ...prevUser,
          accountStatus: 'active'
        }));
        
        setShowReactivatePrompt(false);
        return true;
      } else {
        throw new Error('Failed to reactivate account');
      }
    } catch (err) {
      console.error('Error reactivating account:', err);
      throw err;
    } finally {
      setIsReactivating(false);
    }
  }, [api]);

  const deleteAccount = useCallback(async () => {
    try {
      await api.delete('/api/profile/me');
      handleLogout();
      return true;
    } catch (err) {
      console.error('Error deleting account:', err);
      throw err;
    }
  }, [api, handleLogout]);

  // Handle cancel reactivation
  const cancelReactivation = () => {
    setShowReactivatePrompt(false);
  };

  // Update useEffect for token validation and auto-refresh
  useEffect(() => {
    if (!token) return;

    // Set the token in the API instance when it changes
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Token set in AuthContext:', token.substring(0, 10) + '...');
    
    // Verify token validity on mount
    const validateTokenOnMount = async () => {
      try {
        // Use 'auth/token-status' directly
        console.log('Making token status request to endpoint: "auth/token-status"');
        await api.get('auth/token-status'); 
        console.log('Token validated successfully on mount');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('Token invalid on mount, attempting refresh...');
          try {
            const refreshed = await refreshToken();
            if (!refreshed) {
              console.log('Token refresh failed, logging out');
              handleLogout();
            }
          } catch (refreshError) {
            console.error('Error during token refresh on mount:', refreshError);
            handleLogout();
          }
        }
      }
    };
    
    validateTokenOnMount();
  }, [token]);

  // Update axios interceptor to handle token errors
  useEffect(() => {
    // Set up response interceptor for handling token-related errors
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // If error is 401 Unauthorized and we have a token
        if (error.response?.status === 401 && token) {
          // Check if we've already tried to refresh for this request
          if (error.config && !error.config._isRetry) {
            try {
              console.log('Token expired, attempting refresh...');
              const success = await refreshToken();
              
              if (success) {
                // Mark this request as retried
                error.config._isRetry = true;
                
                // Update the auth header with the fresh token
                const freshToken = localStorage.getItem('token');
                error.config.headers['Authorization'] = `Bearer ${freshToken}`;
                
                // Retry the original request with the new token
                return api.request(error.config);
              }
            } catch (refreshError) {
              console.error('Error during token refresh:', refreshError);
              // Force logout on refresh failure
              handleLogout();
            }
          } else if (error.config?._isRetry) {
            // If we've already tried to refresh, log out
            console.log('Token refresh did not solve the 401 issue, logging out');
            handleLogout();
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptor on unmount
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [token, refreshToken, handleLogout, api]);

  // Add a simple auth check function that can be used throughout the app
  const isAuthenticated = useCallback(() => {
    // Check both for the token and the user object
    return !!token && !!user;
  }, [token, user]);
  return (
    <AuthContext.Provider
      value={{ 
        user, 
        token, 
        loading,
        error,
        serverStatus,
        isAuthenticated: isAuthenticated(), // Expose the result of the function
        checkAuth: isAuthenticated, // Expose the function itself for components to call
        checkAuth: isAuthenticated, // Expose the function itself for components to call
        updateUser, 
        login, 
        register, 
        logout: handleLogout, 
        refreshToken,
        deactivateAccount,
        reactivateAccount,
        deleteAccount,
        api,
        showReactivatePrompt,
        isReactivating,
        cancelReactivation
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};