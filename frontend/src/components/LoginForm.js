import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/LoginForm.css';

const LoginForm = ({ onLoginSuccess, onLoginError }) => {
  const { login } = useContext(AuthContext);
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
      
      // Call the login function from AuthContext
      const result = await login(phoneNumber, password);
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        console.log('Component unmounted during login - aborting state updates');
        return;
      }
      
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        
        // If onLoginSuccess is provided, call it
        if (onLoginSuccess) {
          // Set a short timeout to show success message before redirect
          redirectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              onLoginSuccess();
            }
          }, 500);
        }
      } else {
        const errorMessage = result.message || 'Login failed. Please try again.';
        setError(errorMessage);
        
        if (onLoginError) {
          onLoginError(errorMessage);
        }
        
        // Debug info for development
        if (process.env.NODE_ENV !== 'production') {
          setDebugInfo({
            error: result.error,
            field: result.field
          });
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
      
      if (onLoginError) {
        onLoginError(err.message || 'An unexpected error occurred');
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