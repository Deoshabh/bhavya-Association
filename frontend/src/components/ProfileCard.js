import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';
import { User, MapPin, Briefcase, Phone, Mail, Edit, AlertTriangle, Lock } from 'lucide-react';
import Card from './Card';
import Button from './Button';

// Use a data URL for the default profile image instead of importing an asset
const DEFAULT_PROFILE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='150' height='150'%3E%3Cpath fill='%23d1d5db' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const ProfileCard = ({ user, setEditMode }) => {
  const { api, logout } = useContext(AuthContext);
  const [actionState, setActionState] = useState({
    showDeactivateConfirm: false,
    showDeleteConfirm: false,
    isDeactivating: false,
    isDeleting: false,
    error: ''
  });
  const navigate = useNavigate();

  // Construct share content - Keep this function to be passed to ProfileSettings
  const shareText = `Check out my profile on Bhavya Association!\nName: ${user.name}\nPhone: ${user.phoneNumber}\nProfession: ${user.profession || 'Not specified'}${user.bio ? `\nBio: ${user.bio}` : ''}${user.address ? `\nAddress: ${user.address}` : ''}`;
  // Keep WhatsApp URL as fallback
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  
  // Handle generalized sharing - Keep function to be used in ProfileSettings 
  const handleShare = async () => {
    // Create share data object
    const shareData = {
      title: `${user.name}'s Profile on Bhavya Association`,
      text: shareText
    };
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
        // Fall back to WhatsApp if sharing fails
        window.open(whatsappUrl, '_blank');
      }
    } else {
      // Fall back to WhatsApp if Web Share API is not available
      window.open(whatsappUrl, '_blank');
    }
  };

  // Handle profile image loading errors
  const handleImageError = (e) => {
    e.target.src = DEFAULT_PROFILE_IMAGE;
  };

  const handleEditClick = () => {
    if (setEditMode) {
      setEditMode(true);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (actionState.isDeleting) return;

    setActionState((prev) => ({ ...prev, isDeleting: true, error: '' }));

    try {
      await api.delete('/api/profile/me');
      logout(); // Log the user out after account deletion
      navigate('/'); // Redirect to home page
    } catch (err) {
      console.error('Error deleting account:', err);
      setActionState((prev) => ({
        ...prev,
        isDeleting: false,
        error: 'Failed to delete account. Please try again later.'
      }));
    }
  };

  const handleDeactivateAccount = async () => {
    if (actionState.isDeactivating) return;

    setActionState((prev) => ({ ...prev, isDeactivating: true, error: '' }));

    try {
      await api.put('/api/profile/deactivate');
      logout(); // Log the user out after deactivation
      navigate('/');
    } catch (err) {
      console.error('Error deactivating account:', err);
      setActionState((prev) => ({
        ...prev,
        isDeactivating: false,
        error: 'Failed to deactivate account. Please try again later.'
      }));
    }
  };

  // Reset all confirmations
  const resetConfirmations = () => {
    setActionState({
      showDeactivateConfirm: false,
      showDeleteConfirm: false,
      isDeactivating: false,
      isDeleting: false,
      error: ''
    });
  };

  return (
    <Card className="overflow-hidden">
      {/* Profile header with background */}
      <div className="relative bg-gradient-to-r from-primary-100 to-primary-50 pt-6 pb-20">
        <div className="px-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3 p-2 bg-white bg-opacity-50 rounded-full">
              <User size={18} className="text-primary-700" />
            </div>
            <h2 className="text-xl font-bold text-primary-900">My Profile</h2>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<Edit size={16} />}
            onClick={handleEditClick}
          >
            Edit
          </Button>
        </div>
      </div>
      
      {/* Profile image - positioned to overlap header */}
      <div className="flex justify-center -mt-16 mb-4 relative z-10">
        <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
          <img
            src={user.profileImage || DEFAULT_PROFILE_IMAGE}
            alt={`${user.name}'s profile`}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </div>
      </div>
      
      {/* Main profile content */}
      <div className="px-6 pt-2 pb-6">
        {/* User's basic info */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">{user.name}</h1>
          <div className="flex items-center justify-center mt-1">
            <Briefcase size={16} className="text-neutral-500 mr-2" />
            <p className="text-neutral-700">{user.occupation || 'No occupation listed'}</p>
          </div>
          
          {user.accountStatus === 'deactivated' && (
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              <AlertTriangle size={14} className="mr-1" />
              Account Deactivated
            </div>
          )}
        </div>
        
        {/* Contact information */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
          <h3 className="text-md font-semibold text-neutral-700 mb-3 flex items-center">
            <Lock size={16} className="mr-2 text-primary-600" />
            Contact Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Phone size={16} className="text-neutral-500 mr-3 flex-shrink-0" />
              <span className="text-neutral-800">{user.phoneNumber}</span>
            </div>
            
            {user.email && (
              <div className="flex items-center">
                <Mail size={16} className="text-neutral-500 mr-3 flex-shrink-0" />
                <span className="text-neutral-800">{user.email}</span>
              </div>
            )}
            
            {user.address && (
              <div className="flex items-start">
                <MapPin size={16} className="text-neutral-500 mr-3 flex-shrink-0 mt-1" />
                <span className="text-neutral-800">{user.address}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Bio and profession */}
        <div className="mb-6">
          <h3 className="section-title">
            <User size={18} />
            About Me
          </h3>
          <p className="bio">{user.bio || 'No bio provided'}</p>
          
          {user.profession && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-1">Profession:</h4>
              <p className="text-neutral-600">{user.profession}</p>
            </div>
          )}
        </div>
        
        {/* Removed Privacy Settings section */}
        
        {/* Removed Share Profile button */}
      </div>
      
      {/* Confirm Dialogs - keep them here as they might still be needed for other actions */}
      {actionState.showDeactivateConfirm && (
        <ConfirmDialog
          title="Deactivate Account"
          message="Are you sure you want to deactivate your account?"
          note="You can reactivate it later by logging back in."
          confirmText="Yes, Deactivate"
          cancelText="Cancel"
          type="warning"
          isLoading={actionState.isDeactivating}
          errorMessage={actionState.error}
          onConfirm={handleDeactivateAccount}
          onCancel={resetConfirmations}
        />
      )}
      
      {actionState.showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Account"
          message="Are you sure you want to permanently delete your account?"
          note="This action cannot be undone! All your data will be permanently removed."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          type="danger"
          isLoading={actionState.isDeleting}
          errorMessage={actionState.error}
          onConfirm={handleDeleteAccount}
          onCancel={resetConfirmations}
        />
      )}
    </Card>
  );
};

export default ProfileCard;
