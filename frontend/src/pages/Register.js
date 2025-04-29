import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import RegistrationForm from '../components/RegistrationForm';
import { AlertTriangle } from 'lucide-react';

const Register = () => {
  const { user, loading, serverStatus } = useContext(AuthContext);
  
  // If user is already logged in, redirect to profile
  if (user && !loading) {
    return <Navigate to="/profile" />;
  }
  
  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 px-4">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-t-2 border-b-2 border-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-600">Checking authentication status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6 flex justify-start">
          <BackButton />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-200">
            <h1 className="text-2xl font-bold text-primary-900">Create an Account</h1>
            <p className="text-primary-700 mt-1">Join the Bhavya Associates community</p>
          </div>
          
          {!serverStatus && (
            <div className="mx-6 mt-6 flex items-start p-4 rounded-md bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
              <p className="text-sm">
                Server connection issues detected. Registration may not be available right now.
              </p>
            </div>
          )}
          
          <div className="px-6 py-6">
            <RegistrationForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;