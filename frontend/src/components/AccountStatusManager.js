import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/AccountStatusManager.css';

const AccountStatusManager = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only run this check if a user is logged in
    if (user) {
      // Check account status
      if (user.accountStatus === 'suspended') {
        // For suspended accounts, show a notification and log them out after a delay
        const timer = setTimeout(() => {
          logout();
          navigate('/login', { 
            state: { 
              message: 'Your account has been suspended. Please contact support for more information.' 
            } 
          });
        }, 5000); // 5 second delay to let user read the message
        
        return () => clearTimeout(timer);
      } else if (user.accountStatus === 'deactivated') {
        // For deactivated accounts, redirect to the reactivation page
        navigate('/reactivate-account');
      }
    }
  }, [user, logout, navigate]);
  
  if (!user || user.accountStatus === 'active') {
    return null;
  }
  
  // Render a warning for suspended accounts
  if (user.accountStatus === 'suspended') {
    return (
      <div className="account-status-warning suspended">
        <div className="account-status-content">
          <div className="status-icon">⚠️</div>
          <div className="status-message">
            <p>Your account has been suspended due to a violation of our terms. You will be logged out shortly.</p>
            <p>Please contact support for more information.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default AccountStatusManager;
