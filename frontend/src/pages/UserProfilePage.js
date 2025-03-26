import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { withRetry, getCachedUserProfile } from '../utils/serverUtils';
import ProfileForm from '../components/ProfileForm';
import UpgradeMembershipModal from '../components/UpgradeMembershipModal';
import BackButton from '../components/BackButton';

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
    navigate('/directory');
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="user-profile-page">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          {error.includes('throttled') || error.includes('too frequently') ? (
            <button 
              className="retry-button" 
              onClick={handleRetry} 
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry Now'}
            </button>
          ) : (
            <button className="back-button" onClick={handleBackClick}>
              Back to Directory
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <div className="user-profile-page">
        <div className="error-message">
          <h3>User Not Found</h3>
          <p>The requested profile could not be found.</p>
          <button className="back-button" onClick={handleBackClick}>
            Back to Directory
          </button>
        </div>
      </div>
    );
  }
  
  if (isOwnProfile && editMode) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-header">
          <button className="back-button" onClick={() => setEditMode(false)}>
            &larr; Cancel Edit
          </button>
          <h1>Edit Your Profile</h1>
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
    <div className="user-profile-page">
      <div className="user-profile-header">
        <BackButton />
        <h1>Member Profile</h1>
        
        {isOwnProfile && (
          <button className="edit-button" onClick={handleEditClick}>
            Edit Profile
          </button>
        )}
      </div>
      
      {!serverStatus && (
        <div className="server-warning">
          <p>⚠️ Server connection issues detected. Some profile data may not be available.</p>
        </div>
      )}
      
      <div className="user-profile-content">
        <div className="user-profile-main-info">
          <div className="profile-image-container">
            <img
              src={profileUser.profileImage || DEFAULT_PROFILE_IMAGE}
              alt={`${profileUser.name}'s profile`}
              className="profile-image"
              onError={(e) => { e.target.src = DEFAULT_PROFILE_IMAGE }}
            />
          </div>
          
          <div className="profile-basic-info">
            <h2>{profileUser.name}</h2>
            <p className="occupation">{profileUser.occupation}</p>
            
            {isPremium || isOwnProfile ? (
              <div className="contact-info">
                <h3>Contact Information</h3>
                <p><strong>Phone:</strong> {profileUser.phoneNumber}</p>
                <button 
                  className="whatsapp-share-button"
                  onClick={() => {
                    const shareText = `Name: ${profileUser.name}\nPhone: ${profileUser.phoneNumber}\nOccupation: ${profileUser.occupation}\nBio: ${profileUser.bio || "No bio available"}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  Share on WhatsApp
                </button>
              </div>
            ) : (
              <div className="premium-prompt">
                <p>Upgrade to premium to view contact information</p>
                <button 
                  className="upgrade-button"
                  onClick={handleContactClick}
                >
                  Upgrade Membership
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="user-profile-details">
          <div className="profile-section">
            <h3>About</h3>
            <p>{profileUser.bio || "No bio available"}</p>
          </div>
          
          {profileUser.address && (
            <div className="profile-section">
              <h3>Address</h3>
              <p>{profileUser.address}</p>
            </div>
          )}
          
          {profileUser.interests && profileUser.interests.length > 0 && (
            <div className="profile-section">
              <h3>Interests</h3>
              <div className="interests-list">
                {profileUser.interests.map((interest, index) => (
                  <span key={index} className="interest-tag">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
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
