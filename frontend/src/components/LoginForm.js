import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/LoginForm.css';

const LoginForm = ({ onLoginSuccess }) => {
  const { login, loading } = useContext(AuthContext);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Timeout reference for cleanup
  const redirectTimeoutRef = useRef(null);
  
  // Add mount/unmount effect
  useEffect(() => {
    isMountedRef.current = true;
    console.log('LoginForm mounted');
    
    // Check if user is already authenticated on mount
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Token found in storage, user should be redirected');
      }
    };
    
    checkAuth();
    
    return () => {
      isMountedRef.current = false;
      console.log('LoginForm unmounted - cleanup');
      
      // Clear any pending timeouts
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('Already processing login request');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    setDebugInfo(null);
    
    // Clear any existing timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    
    try {
      // Basic validation
      if (!phoneNumber || !password) {
        setError('Please enter both phone number and password');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Starting login process with phone number:', phoneNumber);
      
      // Login process
      const response = await login(phoneNumber, password);
      
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('Component unmounted during login - aborting state updates');
        return;
      }
      
      if (response && response.success) {
        console.log('Login successful - preparing to redirect');
        setSuccess('Login successful! Redirecting to profile...');
        
        // Verify token is set in localStorage
        const token = localStorage.getItem('token');
        console.log('Token present after login:', !!token);
        
        // First try callback-based navigation if provided (React Router)
        if (onLoginSuccess && typeof onLoginSuccess === 'function') {
          console.log('Using provided navigation callback');
          redirectTimeoutRef.current = setTimeout(() => {
            onLoginSuccess();
          }, 1000);
        } 
        // Fallback to direct page navigation
        else {
          console.log('Using direct page navigation');
          redirectTimeoutRef.current = setTimeout(() => {
            // Use window.location.assign for more reliable navigation
            window.location.assign('/profile');
          }, 1000);
        }
      } else {
        setError(response?.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Login error:', err);
      
      // Special handling for throttle errors
      if (err.message && err.message.includes('throttled')) {
        setSuccess('Login successful, but data is loading slowly. Redirecting...');
        
        // Handle throttled login with safer redirect approach
        redirectTimeoutRef.current = setTimeout(() => {
          // Ensure all promises settle before navigation
          Promise.resolve().then(() => {
            window.location.href = '/';
          });
        }, 1500);
        
        return;
      }
      
      // Error handling
      const debugData = {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      };
      setDebugInfo(debugData);
      
      // Set appropriate error message
      if (err.response?.data?.error === 'NO_DB_CONNECTION' || 
          err.response?.data?.error === 'DB_NOT_CONNECTED' || 
          err.response?.data?.error === 'MONGO_NETWORK_ERROR') {
        setError('Database connection issue. Please try again later.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.msg || 'Invalid credentials.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please try again.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Rest of the component remains the same
  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <div className="form-group">
        <label htmlFor="phoneNumber">Phone Number</label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          placeholder="Enter registered phone number"
          autoComplete="tel"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
        />
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
      
      {debugInfo && process.env.NODE_ENV !== 'production' && (
        <div className="debug-section">
          <p className="debug-title">Debug Information:</p>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          <p className="debug-hint">
            This information can help diagnose login issues. 
            Most common cause is incorrect phone number format or unregistered account.
          </p>
        </div>
      )}
      
      <div className="form-footer">
        <p>
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;