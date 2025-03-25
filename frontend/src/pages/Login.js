import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import LoginForm from '../components/LoginForm';
import '../styles/Login.css';
import { AUTH } from '../utils/apiConfig';

const Login = () => {
  const { user, loading, serverStatus } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  
  // Check authentication status on mount and when user/loading changes
  useEffect(() => {
    // If user is authenticated and not loading, redirect to profile
    if (user && !loading) {
      console.log('User already authenticated, redirecting to profile');
      navigate('/profile', { replace: true });
    }
  }, [user, loading, navigate]);
  
  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="loading-container">
        <p>Checking authentication status...</p>
      </div>
    );
  }

  // If user is authenticated, render redirect component
  if (user) {
    return <Navigate to="/profile" replace />;
  }

  // Otherwise, show login form
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <BackButton />
        </div>
        
        {!serverStatus && (
          <div className="server-warning">
            <p>⚠️ Server connection issues detected. Login may not be available right now.</p>
          </div>
        )}
        
        {loginError && (
          <div className="login-error">
            <p>{loginError}</p>
          </div>
        )}
        
        <LoginForm 
          onLoginSuccess={() => navigate('/profile')} 
          onLoginError={(err) => setLoginError(err)}
        />
      </div>
    </div>
  );
};

export default Login;