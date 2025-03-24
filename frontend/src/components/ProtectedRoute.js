import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Protected Route component
 * Only allows access to the wrapped component if the user is authenticated
 * Otherwise redirects to login page
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="protected-route-loading">
        <p>Checking authentication...</p>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    // Store the attempted location for potential redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render the protected component
  return children;
};

export default ProtectedRoute;
