import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

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

  return (
    <form className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6 text-center text-neutral-800">Login</h2>
      
      {error && <p className="text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</p>}
      {success && <p className="text-green-600 mb-4 p-3 bg-green-50 rounded">{success}</p>}
      
      <div className="space-y-4">
        <div className="form-group">
          <label htmlFor="phoneNumber" className="block text-neutral-700 font-medium mb-2">Phone Number</label>
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
            className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="block text-neutral-700 font-medium mb-2">Password</label>
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
            className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded transition mt-4"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </div>
      
      {debugInfo && process.env.NODE_ENV !== 'production' && (
        <div className="mt-6 p-3 bg-neutral-100 rounded text-sm">
          <p className="font-medium mb-1">Debug Information:</p>
          <pre className="bg-neutral-200 p-2 rounded overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          <p className="mt-2 text-neutral-600">
            This information can help diagnose login issues. 
            Most common cause is incorrect phone number format or unregistered account.
          </p>
        </div>
      )}
      
      <div className="text-center mt-6 text-neutral-600">
        <p>
          Don't have an account? <a href="/Register" className="text-primary-600 hover:text-primary-800">Register here</a>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;