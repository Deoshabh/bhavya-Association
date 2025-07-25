import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { withRetry, getCachedUserProfile } from '../utils/serverUtils';
import { generateProfileMetaTags } from '../utils/sharingImageUtil';
import ProfileForm from '../components/ProfileForm';
import { 
  User, Phone, Mail, MapPin, Briefcase, Heart, RefreshCw, ChevronLeft, 
  AlertTriangle, Star, Shield, Share2, ArrowUp, Loader, Edit,
  Clock, LogIn, UserPlus, Lock
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Alert from '../components/Alert';
import MetaTags from '../components/MetaTags';
import ReferralBadge from '../components/ReferralBadge';
import axios from 'axios';

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='150' height='150'%3E%3Cpath fill='%23d1d5db' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { api, user: currentUser, token, serverStatus } = useContext(AuthContext);
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Check if current user has premium access
  const isPremium = currentUser && currentUser.planType && 
    ['premium', 'admin'].includes(currentUser.planType);
  
  // Check if the profile belongs to the current user
  const isOwnProfile = currentUser && profileUser && currentUser._id === profileUser._id;
  
  // Check if user is authenticated
  const isAuthenticated = !!token;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        let res;
        if (token) {
          // Authenticated user flow
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Use caching wrapper for user profiles to reduce throttling
          res = await getCachedUserProfile(
            userId, 
            () => withRetry(
              () => api.get(`/api/users/${userId}`), 
              2, 
              `user-profile-${userId.slice(-20)}`,
              retryCount > 0 // Force refresh on manual retry
            )
          );
        } else {
          // Non-authenticated user flow - fetch public profile
          const baseURL = process.env.REACT_APP_API_URL || 'https://api.bhavyasangh.com';
          res = await axios.get(`${baseURL}/api/users/${userId}/public`);
        }
        
        if (res && res.data) {
          setProfileUser(res.data);
          setError('');
          setRetryCount(0); // Reset retry count on success
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        
        // Special handling for throttled requests
        if (err.message && err.message.includes('throttled')) {
          setError('This profile is being loaded too frequently. Please wait a moment and try again.');
        } else if (err.response && err.response.status === 404) {
          setError('User not found');
        } else if (err.response && err.response.status === 401 && token) {
          // Only redirect if user has a token but it's invalid
          navigate('/login');
        } else {
          setError('Failed to load user profile. Please try again later.');
        }
      } finally {
        setLoading(false);
        setIsRetrying(false);
      }
    };
    
    fetchUserProfile();
  }, [userId, api, token, navigate, retryCount]);
  
  // Handle manual retry with exponential backoff
  const handleRetry = () => {
    setIsRetrying(true);
    const backoff = Math.min(2000, 500 * Math.pow(2, retryCount));
    
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
    }, backoff);
  };
  
  const handleContactClick = () => {
    return; 
  };
  
  const handleEditClick = () => {
    setEditMode(true);
  };
  
  const handleProfileUpdate = (updatedProfile) => {
    setProfileUser({...profileUser, ...updatedProfile});
    setEditMode(false);
  };

  const handleBackClick = () => {
    navigate(-1);
  };
  
  const handleShareProfile = () => {
    // Create shareable URL for the profile
    const shareUrl = `${window.location.origin}/user-profile/${profileUser._id}`;
    
    // Prepare share text
    const shareText = `Check out ${profileUser.name}'s profile on Bhavya Associates!\n${shareUrl}`;
    
    // Try to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `${profileUser.name}'s Profile on Bhavya Associates`,
        text: `Check out ${profileUser.name}'s profile`,
        url: shareUrl,
      }).catch(err => {
        // Fallback to WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
      });
    } else {
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Use the sharing image utility to generate meta tags
  const getMetaProps = () => {
    if (!profileUser) return {};
    return generateProfileMetaTags(profileUser);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader size={40} className="animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-neutral-600">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={handleBackClick} className="mb-6 flex items-center text-neutral-600 hover:text-neutral-900">
          <ChevronLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
        
        <Card>
          <div className="p-8 text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-bold text-neutral-800 mb-3">Error Loading Profile</h3>
            <p className="text-neutral-600 mb-6">{error}</p>
            
            {error.includes('throttled') || error.includes('too frequently') ? (
              <Button 
                variant="primary"
                onClick={handleRetry} 
                disabled={isRetrying}
                leftIcon={isRetrying ? <Loader className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              >
                {isRetrying ? 'Retrying...' : 'Retry Now'}
              </Button>
            ) : (
              <Button 
                variant="subtle"
                onClick={handleBackClick}
                leftIcon={<ChevronLeft size={16} />}
              >
                Back to Directory
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={handleBackClick} className="mb-6 flex items-center text-neutral-600 hover:text-neutral-900">
          <ChevronLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
        
        <Card>
          <div className="p-8 text-center">
            <User size={48} className="mx-auto mb-4 text-neutral-400" />
            <h3 className="text-xl font-bold text-neutral-800 mb-3">User Not Found</h3>
            <p className="text-neutral-600 mb-6">The requested profile could not be found.</p>
            <Button 
              variant="subtle"
              onClick={handleBackClick}
              leftIcon={<ChevronLeft size={16} />}
            >
              Back to Directory
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  if (isOwnProfile && editMode) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <button onClick={() => setEditMode(false)} className="flex items-center text-neutral-600 hover:text-neutral-900">
            <ChevronLeft size={20} className="mr-1" />
            <span>Cancel Editing</span>
          </button>
        </div>
        
        <ProfileForm 
          user={profileUser}
          isEditing={true}
          setEditMode={setEditMode}
          onProfileUpdated={handleProfileUpdate}
        />
      </div>
    );
  }
  
  // For non-authenticated users, show a limited profile view
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card - Limited View */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Profile header with background */}
              <div className="relative bg-gradient-to-r from-primary-100 to-primary-50 pt-6 pb-20">
                <div className="absolute top-4 right-4">
                  <Badge variant="info" outline pill className="flex items-center">
                    <Lock size={12} className="mr-1" />
                    <span>Limited View</span>
                  </Badge>
                </div>
              </div>
              
              {/* Profile image - positioned to overlap header */}
              <div className="flex justify-center -mt-16 mb-4 relative z-10">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                  <img
                    src={profileUser.profileImage || DEFAULT_PROFILE_IMAGE}
                    alt={`${profileUser.name}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = DEFAULT_PROFILE_IMAGE; }}
                  />
                </div>
              </div>
              
              {/* User info section - Limited */}
              <div className="px-6 pt-2 pb-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-neutral-800">{profileUser.name}</h1>
                  <div className="flex items-center justify-center mt-1">
                    <Briefcase size={16} className="text-neutral-500 mr-2" />
                    <p className="text-neutral-700">{profileUser.occupation || 'No occupation listed'}</p>
                  </div>
                </div>
                
                {/* Bio section - Limited */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-neutral-800 mb-3 flex items-center border-b pb-2">
                    <User size={18} className="mr-2 text-primary-600" />
                    About
                  </h3>
                  <p className="text-neutral-600 whitespace-pre-line">
                    {profileUser.bio || "No bio provided"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Sidebar - Login/Signup prompt */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Auth Card */}
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-medium text-neutral-800 flex items-center">
                    <Lock size={16} className="mr-2 text-primary-600" />
                    Access Full Profile
                  </h3>
                </Card.Header>
                
                <Card.Body>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-5">
                    <h4 className="font-medium text-blue-800 mb-2">Sign up or log in to see more</h4>
                    <p className="text-blue-700 text-sm mb-0">
                      Create an account or log in to view contact information and full profile details.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <Link to="/login" className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition flex items-center justify-center">
                      <LogIn size={16} className="mr-2" />
                      Log In
                    </Link>
                    
                    <Link to="/register" className="w-full py-2.5 px-4 border border-primary-600 text-primary-700 hover:bg-primary-50 font-medium rounded-md transition flex items-center justify-center">
                      <UserPlus size={16} className="mr-2" />
                      Sign Up
                    </Link>
                  </div>
                  
                  <div className="text-sm text-neutral-500 text-center">
                    <p>Members can view contact information and full profile details</p>
                  </div>
                </Card.Body>
              </Card>
              
              {/* Features Card */}
              <Card>
                <Card.Header>
                  <h3 className="text-sm font-medium text-neutral-700">Member Benefits</h3>
                </Card.Header>
                <Card.Body>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="bg-green-100 p-1 rounded-full mr-2">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      View member contact details
                    </li>
                    <li className="flex items-center">
                      <div className="bg-green-100 p-1 rounded-full mr-2">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      Access complete profiles
                    </li>
                    <li className="flex items-center">
                      <div className="bg-green-100 p-1 rounded-full mr-2">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      Connect with the community
                    </li>
                    <li className="flex items-center">
                      <div className="bg-green-100 p-1 rounded-full mr-2">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      Create your own profile
                    </li>
                  </ul>
                </Card.Body>
              </Card>
              
              {/* Share profile button */}
              <Card>
                <Card.Body>
                  <button 
                    onClick={handleShareProfile}
                    className="w-full py-2 px-4 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium rounded-md transition flex items-center justify-center"
                  >
                    <Share2 size={16} className="mr-2" />
                    Share Profile
                  </button>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Regular authenticated user view
  return (
    <>
      {/* Add dynamic meta tags using the sharing image utility */}
      {profileUser && <MetaTags {...getMetaProps()} />}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <button onClick={handleBackClick} className="flex items-center text-neutral-600 hover:text-neutral-900">
            <ChevronLeft size={20} className="mr-1" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            {isOwnProfile && (
              <Button 
                variant="outline" 
                size="sm"
                leftIcon={<Edit size={16} />}
                onClick={handleEditClick}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
        
        {!serverStatus && (
          <Alert 
            variant="warning" 
            className="mb-6"
            title="Connection Issues"
            dismissible={false}
          >
            Server connection issues detected. Some profile data may not be available.
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Profile header with background */}
              <div className="relative bg-gradient-to-r from-primary-100 to-primary-50 pt-6 pb-20">
                {profileUser.planType === 'premium' && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="warning" outline pill className="flex items-center">
                      <Star size={12} className="mr-1" />
                      <span>Premium Member</span>
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Profile image - positioned to overlap header */}
              <div className="flex justify-center -mt-16 mb-4 relative z-10">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                  <img
                    src={profileUser.profileImage || DEFAULT_PROFILE_IMAGE}
                    alt={`${profileUser.name}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = DEFAULT_PROFILE_IMAGE; }}
                  />
                </div>
              </div>
              
              {/* User info section */}
              <div className="px-6 pt-2 pb-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-neutral-800">{profileUser.name}</h1>
                  <div className="flex items-center justify-center mt-1">
                    <Briefcase size={16} className="text-neutral-500 mr-2" />
                    <p className="text-neutral-700">{profileUser.occupation || 'No occupation listed'}</p>
                  </div>
                  
                  <div className="flex items-center justify-center mt-3 text-sm text-neutral-500">
                    <Clock size={14} className="mr-1" />
                    <span>Member since {formatDate(profileUser.createdAt)}</span>
                  </div>
                </div>
                
                {/* Bio section */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-neutral-800 mb-3 flex items-center border-b pb-2">
                    <User size={18} className="mr-2 text-primary-600" />
                    About
                  </h3>
                  <p className="text-neutral-600 whitespace-pre-line">
                    {profileUser.bio || "No bio provided"}
                  </p>
                </div>
                
                {/* Address section (if available) */}
                {profileUser.address && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-neutral-800 mb-3 flex items-center border-b pb-2">
                      <MapPin size={18} className="mr-2 text-primary-600" />
                      Address
                    </h3>
                    <p className="text-neutral-600">{profileUser.address}</p>
                  </div>
                )}
                
                {/* Professional Details */}
                {profileUser.profession && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-neutral-800 mb-3 flex items-center border-b pb-2">
                      <Briefcase size={18} className="mr-2 text-primary-600" />
                      Professional Details
                    </h3>
                    <p className="text-neutral-600">{profileUser.profession}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Sidebar - Contact Section */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Contact Card */}
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-medium text-neutral-800 flex items-center">
                    <Shield size={16} className="mr-2 text-primary-600" />
                    Contact Information
                  </h3>
                </Card.Header>
                
                <Card.Body>
                  {isPremium || isOwnProfile ? (
                    <>
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center p-3 bg-neutral-50 rounded-lg">
                          <Phone size={18} className="text-primary-600 mr-3 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-neutral-500">Phone</p>
                            <p className="text-neutral-800 font-medium">{profileUser.phoneNumber}</p>
                          </div>
                        </div>
                        
                        {profileUser.email && (
                          <div className="flex items-center p-3 bg-neutral-50 rounded-lg">
                            <Mail size={18} className="text-primary-600 mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-neutral-500">Email</p>
                              <p className="text-neutral-800 font-medium break-all">{profileUser.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {isPremium && !isOwnProfile && (
                        <div className="space-y-3">
                          <a 
                            href={`tel:${profileUser.phoneNumber}`}
                            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition flex items-center justify-center"
                          >
                            <Phone size={16} className="mr-2" />
                            Call Now
                          </a>
                          
                          {profileUser.email && (
                            <a 
                              href={`mailto:${profileUser.email}`}
                              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition flex items-center justify-center"
                            >
                              <Mail size={16} className="mr-2" />
                              Send Email
                            </a>
                          )}
                          
                          <button 
                            onClick={handleShareProfile}
                            className="w-full py-2 px-4 border border-primary-600 text-primary-700 hover:bg-primary-50 font-medium rounded-md transition flex items-center justify-center"
                          >
                            <Share2 size={16} className="mr-2" />
                            Share Profile
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="premium-upgrade-section">
                      <div className="premium-badge">
                        <Star size={24} />
                      </div>
                      <h3>Premium Membership Required</h3>
                      <p>Upgrade to view contact information and connect with this member directly.</p>
                      <button 
                        onClick={() => navigate('/upgrade-membership')}
                        className="w-full py-2 px-4 bg-warning text-dark font-medium rounded-md transition flex items-center justify-center mt-4"
                      >
                        <Star size={16} className="mr-2" />
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </Card.Body>
              </Card>
              
              {/* Account Info Card */}
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-medium text-neutral-800 flex items-center">
                    <User size={16} className="mr-2 text-primary-600" />
                    Account Information
                  </h3>
                </Card.Header>
                
                <Card.Body>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-neutral-500">Account Status</span>
                      <Badge 
                        variant={profileUser.accountStatus === 'active' ? 'success' : 'warning'} 
                        size="sm"
                        outline
                      >
                        {profileUser.accountStatus === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-neutral-500">Membership Type</span>
                      <Badge 
                        variant={profileUser.planType === 'premium' ? 'warning' : 'info'} 
                        size="sm"
                        outline
                      >
                        {profileUser.planType === 'premium' ? 'Premium' : profileUser.planType === 'admin' ? 'Admin' : 'Basic'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-neutral-500">Profile Visibility</span>
                      <Badge 
                        variant={profileUser.isPublic ? 'success' : 'neutral'} 
                        size="sm"
                        outline
                      >
                        {profileUser.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-neutral-500">Joined</span>
                      <span className="text-neutral-700 text-sm">{new Date(profileUser.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              {/* Referral Information */}
              {profileUser.referralStats && profileUser.referralStats.successfulReferrals > 0 && (
                <ReferralBadge user={profileUser} />
              )}
              
              {/* Back button for mobile view */}
              <div className="lg:hidden">
                <Button 
                  variant="subtle"
                  onClick={handleBackClick}
                  leftIcon={<ChevronLeft size={16} />}
                  fullWidth
                >
                  Back to Directory
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfilePage;
