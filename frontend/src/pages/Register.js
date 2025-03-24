import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import RegistrationForm from '../components/RegistrationForm';
import '../styles/Register.css';

const Register = () => {
  const { user, loading, serverStatus } = useContext(AuthContext);
  
  // If user is already logged in, redirect to profile
  if (user && !loading) {
    return <Navigate to="/profile" />;
  }
  
  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="loading-container">
        <p>Checking authentication status...</p>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <BackButton />
          
        </div>
        
        {!serverStatus && (
          <div className="server-warning">
            <p>⚠️ Server connection issues detected. Registration may not be available right now.</p>
          </div>
        )}
        
        <RegistrationForm />
      </div>
    </div>
  );
};

export default Register;