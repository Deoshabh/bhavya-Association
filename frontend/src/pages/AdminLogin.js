import React, { useState, useContext, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, LogIn, AlertTriangle } from 'lucide-react';
import '../styles/AdminLogin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const { isAuthenticated, login, user } = useContext(AuthContext);
  
  useEffect(() => {
    // Clear any previous errors when the component mounts
    setErrors({});
    setLoginError('');
  }, []);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear field-specific error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setLoginError('');
    
    try {
      // Extract phone number and password to ensure they are strings
      const phoneNumber = formData.phoneNumber.trim();
      const password = formData.password;
      
      // Pass true as the second parameter to indicate admin login
      const response = await login(phoneNumber, password, true);
      
      // Safely check for success property
      if (!response || !response.success) {
        setLoginError(response?.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Safe error handling
      const errorMessage = err?.response?.data?.msg || 
                          'Login failed. Please check your credentials and try again.';
      setLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Change isAuthenticated check to use token since it isn't directly exposed
  // If already authenticated and is admin, redirect to admin dashboard
  if (user && user.planType === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  }
  
  // If authenticated but not admin, redirect to home
  if (user && user.planType !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <Shield size={32} className="admin-icon" />
          <h1>Admin Login</h1>
          <p>Access the administration panel</p>
        </div>
        
        {loginError && (
          <div className="login-error">
            <AlertTriangle size={16} />
            <span>{loginError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your registered phone number"
              className={errors.phoneNumber ? 'error' : ''}
              disabled={loading}
            />
            {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
              disabled={loading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <button 
            type="submit" 
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>
        
        <div className="admin-login-footer">
          <Link to="/" className="back-to-site">Back to main site</Link>
          <small className="admin-login-note">
            Only administrators can access this area
          </small>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
