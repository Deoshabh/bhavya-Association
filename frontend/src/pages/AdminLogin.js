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
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Shield size={32} className="text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Admin Login</h1>
          <p className="text-gray-500 mb-6">Access the administrator dashboard</p>
        </div>
        
        {loginError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md flex items-start">
            <AlertTriangle size={18} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-red-700">{loginError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="phoneNumber">Phone Number</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your registered phone number"
              className={`w-full px-4 py-3 rounded-md border ${errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              disabled={loading}
            />
            {errors.phoneNumber && <span className="text-sm text-red-500 mt-1 block">{errors.phoneNumber}</span>}
          </div>
          
          <div className="form-group">
            <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`w-full px-4 py-3 rounded-md border ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              disabled={loading}
            />
            {errors.password && <span className="text-sm text-red-500 mt-1 block">{errors.password}</span>}
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>
        
        <div className="admin-login-footer mt-8 pt-4 border-t border-gray-200 flex flex-col items-center">
          <Link to="/" className="text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center">
            <span className="mr-1">←</span> Back to main site
          </Link>
          <small className="text-gray-500 text-xs">
            Only administrators can access this area
          </small>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
