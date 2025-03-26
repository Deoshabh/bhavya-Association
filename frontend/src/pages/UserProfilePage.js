import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { withRetry, getCachedUserProfile } from '../utils/serverUtils';
import ProfileForm from '../components/ProfileForm';
import UpgradeMembershipModal from '../components/UpgradeMembershipModal';
import { 
  User, Phone, Mail, MapPin, Briefcase, Heart, RefreshCw, ChevronLeft, 
  AlertTriangle, Star, Shield, Share2, ArrowUp, Loader
} from 'lucide-react';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import Alert from '../components/Alert';

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='150' height='150'%3E%3Cpath fill='%23d1d5db' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { api, user: currentUser, token, serverStatus } = useContext(AuthContext);
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Check if current user has premium access
  const isPremium = currentUser && currentUser.planType && 
    ['premium', 'admin'].includes(currentUser.planType);
  
  // Check if the profile belongs to the current user
  const isOwnProfile = currentUser && profileUser && currentUser._id === profileUser._id;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        // Ensure the auth header is properly set
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Use caching wrapper for user profiles to reduce throttling
        const res = await getCachedUserProfile(
          userId, 
          () => withRetry(
            () => api.get(`/api/users/${userId}`), 
            2, 
            `user-profile-${userId.slice(-20)}`,
            retryCount > 0 // Force refresh on manual retry
          )
        );
        
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
        } else if (err.response && err.response.status === 401) {
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
  
  // New function to handle manual retry with exponential backoff
  const handleRetry = () => {
    setIsRetrying(true);
    const backoff = Math.min(2000, 500 * Math.pow(2, retryCount));
    
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
    }, backoff);
  };
  
  const handleContactClick = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
    }
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
    const shareText = `Name: ${profileUser.name}${isPremium ? `\nPhone: ${profileUser.phoneNumber}` : ''}
Occupation: ${profileUser.occupation}${profileUser.bio ? `\nBio: ${profileUser.bio}` : ''}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
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
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={handleBackClick} className="flex items-center text-neutral-600 hover:text-neutral-900">
          <ChevronLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
        
        <h1 className="text-2xl font-bold text-neutral-800">Member Profile</h1>
        
        {isOwnProfile && (
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<User size={16} />}
            onClick={handleEditClick}
          >
            Edit Profile
          </Button>
        )}
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
            <h2 className="text-2xl font-bold text-neutral-800">{profileUser.name}</h2>
            <div className="flex items-center justify-center mt-1">
              <Briefcase size={16} className="text-neutral-500 mr-2" />
              <p className="text-neutral-700">{profileUser.occupation || 'No occupation listed'}</p>
            </div>
          </div>
          
          {/* Contact section */}
          <div className="mb-8">
            {isPremium || isOwnProfile ? (
              <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-200">
                <h3 className="text-md font-semibold text-neutral-700 mb-4 flex items-center">
                  <Shield size={16} className="mr-2 text-primary-600" />
                  Contact Information
                </h3>
                
                <div className="space-y-3 mb-5">
                  <div className="flex items-center">
                    <Phone size={16} className="text-neutral-500 mr-3 flex-shrink-0" />
                    <span className="text-neutral-800">{profileUser.phoneNumber}</span>
                  </div>
                  
                  {profileUser.email && (
                    <div className="flex items-center">
                      <Mail size={16} className="text-neutral-500 mr-3 flex-shrink-0" />
                      <span className="text-neutral-800">{profileUser.email}</span>
                    </div>
                  )}
                </div>
                
                {isPremium && !isOwnProfile && (
                  <div className="flex gap-3">
                    <a 
                      href={`tel:${profileUser.phoneNumber}`}
                      className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition flex items-center justify-center"
                    >
                      <Phone size={16} className="mr-2" />
                      Call
                    </a>
                    <button 
                      onClick={handleShareProfile}
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition flex items-center justify-center"
                    >
                      <Share2 size={16} className="mr-2" />
                      Share
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-100">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <Shield size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-blue-900 mb-2">Premium Access Required</h3>
                    <p className="text-blue-800 mb-4">Upgrade to view contact information and connect with this member.</p>
                    <Button 
                      variant="primary"
                      onClick={handleContactClick}
                      leftIcon={<ArrowUp size={16} />}
                    >
                      Upgrade Membership
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* About section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-3 flex items-center">
              <User size={18} className="mr-2 text-primary-600" />
              About
            </h3>
            <p className="text-neutral-600">
              {profileUser.bio || "No bio provided"}
            </p>
          </div>
          
          {/* Address section (if available) */}
          {profileUser.address && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-3 flex items-center">
                <MapPin size={18} className="mr-2 text-primary-600" />
                Address
              </h3>
              <p className="text-neutral-600">{profileUser.address}</p>
            </div>
          )}
          
          {/* Interests section (if available) */}
          {profileUser.interests && profileUser.interests.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-3 flex items-center">
                <Heart size={18} className="mr-2 text-primary-600" />
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileUser.interests.map((interest, index) => (
                  <span key={index} className="inline-block bg-neutral-100 rounded-full px-3 py-1 text-sm text-neutral-700">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {showUpgradeModal && (
        <UpgradeMembershipModal 
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => navigate('/upgrade-membership')}
        />
      )}
    </div>
  );
};

export default UserProfilePage;
