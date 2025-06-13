import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { withRetry, checkServerStatus } from '../utils/serverUtils';
import { resetAppState, hardRefresh } from '../utils/cacheUtils';

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
  
  // Circuit breaker to prevent infinite refresh loops
  const refreshAttempts = useRef(0);
  const lastRefreshAttempt = useRef(0);
  const maxRefreshAttempts = 3;
  const refreshCooldown = 30000; // 30 seconds
  const isRefreshingToken = useRef(false);

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

  // Add a function to clear cache and reset cookies
  const clearCacheAndResetCookies = useCallback(() => {
    try {
      resetAppState();
      
      // Provide feedback to the user (you could also use a toast notification here)
      alert('Cache and cookies have been cleared. The page will now refresh.');
      
      // Hard refresh the page to ensure all assets are reloaded
      hardRefresh();
      
      return true;
    } catch (error) {
      console.error('Error while clearing cache and cookies:', error);
      return false;
    }
  }, []);  // Enhanced refreshToken function with circuit breaker to prevent infinite loops
  const refreshToken = useCallback(async () => {
    // Circuit breaker logic
    const now = Date.now();
    
    // Check if we're already refreshing
    if (isRefreshingToken.current) {
      console.log('Token refresh already in progress, skipping...');
      return false;
    }
    
    // Check if we've hit the retry limit
    if (refreshAttempts.current >= maxRefreshAttempts) {
      console.log(`Max refresh attempts (${maxRefreshAttempts}) reached, forcing logout`);
      handleLogout();
      return false;
    }
    
    // Check cooldown period
    if (now - lastRefreshAttempt.current < refreshCooldown) {
      console.log(`Refresh cooldown active (${refreshCooldown}ms), skipping attempt`);
      return false;
    }
    
    try {
      if (!token) {
        console.log('No token to refresh');
        return false;
      }
      
      // Set flags to prevent concurrent refresh attempts
      isRefreshingToken.current = true;
      lastRefreshAttempt.current = now;
      refreshAttempts.current += 1;
      
      console.log(`Token refresh attempt ${refreshAttempts.current}/${maxRefreshAttempts}`);
      
      // FIXED: Skip token verification to prevent infinite loops
      // Attempt to refresh token directly without verification step
      console.log('Attempting to refresh token...');
      
      // Add timeout and better error handling for the refresh request
      const refreshRes = await api.post('auth/refresh', {
        token: token
      }, {
        timeout: 10000, // 10 second timeout
        // Don't trigger interceptors for this request to avoid recursion
        _skipInterceptor: true
      });
      
      if (refreshRes.data?.token) {
        // Update token in state and localStorage
        const newToken = refreshRes.data.token;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        
        // Update auth headers for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // Reset circuit breaker on success
        refreshAttempts.current = 0;
        lastRefreshAttempt.current = 0;
        
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
        // Reset attempts since this is a server issue, not a token issue
        refreshAttempts.current = 0;
        return true; // Continue using current token
      }
      
      // For other errors, check if we should log out
      if (refreshAttempts.current >= maxRefreshAttempts) {
        console.log('Max refresh attempts reached, logging out');
        handleLogout();
      }
      
      return false;
    } finally {
      isRefreshingToken.current = false;
    }
  }, [token, handleLogout, refreshAttempts, lastRefreshAttempt, maxRefreshAttempts, refreshCooldown, isRefreshingToken]);  // Simplified token validation - only on mount and when token changes
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Set the token in the API instance when it changes
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Safe logging to prevent undefined errors
    if (token && typeof token === 'string') {
      console.log('Token set in AuthContext:', token.substring(0, 10) + '...');
    } else {
      console.log('Token set in AuthContext but is not a valid string');
    }
    
    // FIXED: Skip token validation to prevent infinite loops
    // Just set loading to false since we have a token
    console.log('Token present, skipping validation to prevent infinite loops');
    setLoading(false);
    
    // Reset any circuit breaker counters since we have a valid token
    refreshAttempts.current = 0;
    lastRefreshAttempt.current = 0;
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
      
      // Create a safe token key by checking if token exists and is a string
      const tokenKey = token && typeof token === 'string' ? 
        token.slice(-10) : 'unknown-token';
      
      // Use withRetry with auth error handler
      const res = await withRetry(
        () => api.get('profile/me'), // No leading slash
        2, 
        `profile-${tokenKey}`, // Now safely using tokenKey
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
      throw err;    } finally {
      pendingRequest.current = false;
    }
  }, [token, handleLogout, user, refreshToken]);

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
      
      // FIXED: Use the api instance instead of manual URL construction
      // The api instance has the proper normalizeApiPath logic to prevent duplicates
      const response = await api.post(endpoint, { 
        phoneNumber, 
        password 
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

  const register = async (name, phoneNumber, occupation, password) => {    try {
      // Sanitize phone number to ensure consistent format
      const sanitizedPhoneNumber = phoneNumber.replace(/\s+/g, '');
      
      const res = await api.post('auth/register', { 
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

  // Update the server status monitoring effect to require multiple failures
  useEffect(() => {
    let isMounted = true;
    let interval = 60000; // 1 minute
    let consecutiveFailures = 0;
    let consecutiveSuccesses = 0;
    
    const checkServer = async () => {
      const isUp = await checkServerStatus();
      
      if (isMounted) {
        if (isUp) {
          consecutiveSuccesses++;
          consecutiveFailures = 0;
          
          // Require at least 2 consecutive successful checks to consider the server up
          // if it was previously considered down
          if (consecutiveSuccesses >= 2 || serverStatus === true) {
            setServerStatus(true);
          }
          
          // Reset check interval to 1 minute on success
          interval = 60000;
        } else {
          consecutiveFailures++;
          consecutiveSuccesses = 0;
          
          // Only mark the server as down after 2 consecutive failures
          // This prevents temporary glitches from showing the error message
          if (consecutiveFailures >= 2) {
            setServerStatus(false);
            // Use exponential backoff for retries, but cap at 5 minutes
            interval = Math.min(interval * 2, 300000);
          }
        }
      }
    };

    checkServer();
    const intervalId = setInterval(checkServer, interval);    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [serverStatus]);
  const updateUser = useCallback((updates) => setUser((prev) => ({ ...prev, ...updates })), []);

  // Add account deactivation and reactivation functions
  const deactivateAccount = useCallback(async () => {
    try {
      await api.put('profile/deactivate');
      handleLogout();
      return true;
    } catch (err) {
      console.error('Error deactivating account:', err);
      throw err;
    }
  }, [handleLogout]);

  const reactivateAccount = useCallback(async () => {
    setIsReactivating(true);
    try {
      const res = await api.put('profile/reactivate');
      
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
      throw err;    } finally {
      setIsReactivating(false);
    }
  }, []);
  const deleteAccount = useCallback(async () => {
    try {
      await api.delete('profile/me');
      handleLogout();
      return true;
    } catch (err) {
      console.error('Error deleting account:', err);
      throw err;
    }
  }, [handleLogout]);

  // Handle cancel reactivation
  const cancelReactivation = () => {
    setShowReactivatePrompt(false);
  };  // Update axios interceptor to handle token errors with circuit breaker
  useEffect(() => {
    // Track consecutive 401 errors to prevent infinite loops
    let consecutive401Count = 0;
    const max401BeforeLogout = 3;
    
    // Set up response interceptor for handling token-related errors
    const interceptor = api.interceptors.response.use(
      (response) => {
        // Reset 401 counter on successful response
        consecutive401Count = 0;
        return response;
      },
      async (error) => {
        // Skip interceptor if the request is marked to skip (prevents recursion)
        if (error.config?._skipInterceptor) {
          return Promise.reject(error);
        }
        
        // If error is 401 Unauthorized and we have a token
        if (error.response?.status === 401 && token) {
          consecutive401Count++;
          
          console.log(`401 error #${consecutive401Count} detected`);
          
          // If we've had too many consecutive 401s, force logout
          if (consecutive401Count >= max401BeforeLogout) {
            console.log(`Too many consecutive 401s (${consecutive401Count}), forcing logout`);
            handleLogout();
            return Promise.reject(error);
          }
          
          // ENHANCED: Check circuit breaker before attempting refresh
          if (refreshAttempts.current >= maxRefreshAttempts) {
            console.log(`Circuit breaker active: max refresh attempts (${maxRefreshAttempts}) reached, forcing logout`);
            handleLogout();
            return Promise.reject(error);
          }
          
          // Check if we're already refreshing
          if (isRefreshingToken.current) {
            console.log('Token refresh already in progress, rejecting request');
            return Promise.reject(error);
          }
          
          // Check if we've already tried to refresh for this request
          if (error.config && !error.config._isRetry) {
            console.log('Attempting token refresh via interceptor...');
            
            const success = await refreshToken();
            
            if (success) {
              // Mark this request as retried
              error.config._isRetry = true;
              
              // Update the auth header with the fresh token
              const freshToken = localStorage.getItem('token');
              error.config.headers['Authorization'] = `Bearer ${freshToken}`;
              
              // Reset 401 counter after successful refresh
              consecutive401Count = 0;
              
              // Retry the original request with the new token
              return api.request(error.config);
            } else {
              console.log('Token refresh failed in interceptor, logging out');
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
  }, [token, refreshToken, handleLogout, refreshAttempts, maxRefreshAttempts, isRefreshingToken]);

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
        updateUser, 
        login, 
        register, 
        logout: handleLogout,
        clearCacheAndResetCookies, // Add the new function to the context
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