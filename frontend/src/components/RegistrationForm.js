import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, CheckCircle, ArrowRight, Users, Gift } from 'lucide-react';

const RegistrationForm = () => {
  const { register, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [occupation, setOccupation] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [duplicateUser, setDuplicateUser] = useState(false);
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralInfo, setReferralInfo] = useState(null);
  const [validatingReferral, setValidatingReferral] = useState(false);

  // Check for referral code in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      validateReferralCode(refCode);
    }
  }, [location]);

  // Validate referral code
  const validateReferralCode = async (code) => {
    if (!code || code.length < 3) {
      setReferralInfo(null);
      return;
    }

    try {
      setValidatingReferral(true);
      const response = await api.get(`/api/referrals/validate/${code}`);
      if (response.data.valid) {
        setReferralInfo(response.data.referrer);
      } else {
        setReferralInfo(null);
      }
    } catch (err) {
      setReferralInfo(null);
    } finally {
      setValidatingReferral(false);
    }
  };

  // Handle referral code change
  const handleReferralCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setReferralCode(code);
    
    // Debounce validation
    setTimeout(() => {
      validateReferralCode(code);
    }, 500);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDuplicateUser(false);
    setIsSubmitting(true);
    
    try {
      const registrationData = { name, phoneNumber, occupation, password };
      if (referralCode) {
        registrationData.referralCode = referralCode;
      }
      
      const result = await register(registrationData.name, registrationData.phoneNumber, registrationData.occupation, registrationData.password, registrationData.referralCode);
      
      let successMessage = 'Registration successful! Redirecting to profile...';
      if (result?.referralInfo) {
        successMessage = `Welcome! You were successfully referred by ${result.referralInfo.referredBy}. Redirecting to profile...`;
      }
      
      setSuccess(successMessage);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      // Check if this is a duplicate user error (status code 409)
      if (err.response?.status === 409 || 
          err.response?.data?.errorType === 'DUPLICATE_USER' ||
          err.response?.data?.msg?.toLowerCase().includes('already exists')) {
        
        setDuplicateUser(true);
        setError(err.response?.data?.msg || 'This phone number is already registered. Please log in instead.');
      } else if (err.response?.data?.errorType === 'INVALID_REFERRAL_CODE') {
        setError('Invalid referral code. Please check the code and try again.');
      } else {
        // Handle other registration errors
        setError(err.response?.data?.msg || 'Registration failed. Please try again.');
      }
      console.error('Registration error:', err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className={`mb-6 p-4 rounded-md ${duplicateUser ? 'bg-blue-50 border border-blue-200 text-blue-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
              
              {duplicateUser && (
                <div className="mt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <p className="text-sm">Already have an account?</p>
                  <Link 
                    to="/login" 
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Log in here
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200 text-green-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="form-group">
          <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="name">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={isSubmitting}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="form-group">
          <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="phoneNumber">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            required
            disabled={isSubmitting}
            className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm
              ${duplicateUser ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300'}`}
            placeholder="Enter your phone number"
          />
          {duplicateUser && (
            <p className="mt-1 text-sm text-red-600">This phone number is already registered</p>
          )}
        </div>
        
        <div className="form-group">
          <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="occupation">
            Occupation
          </label>
          <input
            type="text"
            id="occupation"
            value={occupation}
            onChange={e => setOccupation(e.target.value)}
            required
            disabled={isSubmitting}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter your occupation"
          />
        </div>
        
        <div className="form-group">
          <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Create a password"
            minLength="6"
          />
          <p className="mt-1 text-xs text-neutral-500">Password must be at least 6 characters long</p>
        </div>

        {/* Referral Code Section */}
        <div className="form-group">
          <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="referralCode">
            Referral Code <span className="text-neutral-500">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="referralCode"
              value={referralCode}
              onChange={handleReferralCodeChange}
              disabled={isSubmitting}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter referral code"
              style={{ textTransform: 'uppercase' }}
            />
            {validatingReferral && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
          
          {referralInfo && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">
                  You will be referred by <strong>{referralInfo.name}</strong>
                </span>
              </div>
              <div className="flex items-center mt-1">
                <Gift className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-xs text-green-700">
                  {referralInfo.tier} tier member with {referralInfo.totalReferrals} successful referrals
                </span>
              </div>
            </div>
          )}
          
          {referralCode && !referralInfo && !validatingReferral && (
            <p className="mt-1 text-xs text-red-500">Invalid referral code</p>
          )}
          
          <p className="mt-1 text-xs text-neutral-500">
            Have a referral code? Enter it to connect with the member who invited you!
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating your account...
            </>
          ) : 'Create Account'}
        </button>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Login here
          </Link>
        </p>
      </div>
      
      <div className="mt-4 text-xs text-center text-neutral-500">
        By registering, you agree to our{' '}
        <Link to="/terms" className="text-primary-600 hover:text-primary-500">
          Terms &amp; Conditions
        </Link>
      </div>
    </form>
  );
};

export default RegistrationForm;