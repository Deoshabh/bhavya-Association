import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import { Eye, EyeOff, AlertTriangle, CheckCircle, Loader, ShieldCheck, ShieldOff, Info, Lock, Share2 } from 'lucide-react';
import Card from './Card';
import { useNavigate } from 'react-router-dom';

const ProfileSettings = ({ user }) => {
  const { api, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Add states for account actions (moved from ProfileCard)
  const [actionState, setActionState] = useState({
    showDeactivateConfirm: false,
    showDeleteConfirm: false,
    isDeactivating: false,
    isDeleting: false,
    error: ''
  });
  
  // Toggle visibility handler
  const handleToggleVisibility = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await api.post('/api/directory/toggle-visibility');
      updateUser({ isPublic: res.data.isPublic });
      setIsPublic(res.data.isPublic);
      setSuccess(res.data.message);
      setShowConfirmation(false);
    } catch (err) {
      console.error('Error toggling profile visibility:', err);
      setError('Failed to update profile visibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const requestToggleVisibility = () => {
    if (isPublic) {
      // Show confirmation before hiding profile
      setShowConfirmation(true);
    } else {
      // Direct toggle to make profile public again
      handleToggleVisibility();
    }
  };
  
  // Add account deactivation handler (moved from ProfileCard)
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
  
  // Add account deletion handler (moved from ProfileCard)
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
  
  // Add reset confirmations handler (moved from ProfileCard)
  const resetConfirmations = () => {
    setActionState({
      showDeactivateConfirm: false,
      showDeleteConfirm: false,
      isDeactivating: false,
      isDeleting: false,
      error: ''
    });
  };
  
  // Add share handler
  const handleShare = async () => {
    // Construct share content
    const shareText = `Check out my profile on Bhavya Association!\nName: ${user.name}\nPhone: ${user.phoneNumber}\nProfession: ${user.profession || 'Not specified'}${user.bio ? `\nBio: ${user.bio}` : ''}${user.address ? `\nAddress: ${user.address}` : ''}`;
    
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
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
      }
    } else {
      // Fall back to WhatsApp if Web Share API is not available
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };
  
  return (
    <Card>
      <Card.Header className="bg-gradient-to-r from-primary-100 to-primary-50">
        <h2 className="text-xl font-bold text-primary-900">Privacy Settings</h2>
      </Card.Header>
      
      <Card.Body>
        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-50 border-l-4 border-red-500 text-red-800">
            <div className="flex">
              <AlertTriangle className="flex-shrink-0 mr-3 h-5 w-5 text-red-500" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 rounded-md bg-green-50 border-l-4 border-green-500 text-green-800">
            <div className="flex">
              <CheckCircle className="flex-shrink-0 mr-3 h-5 w-5 text-green-500" />
              <p>{success}</p>
            </div>
          </div>
        )}
        
        {showConfirmation ? (
          <ConfirmDialog
            title="Hide Your Profile"
            message="Are you sure you want to hide your profile from the member directory?"
            note="Other members will not be able to find or view your profile."
            confirmText="Yes, Hide My Profile"
            cancelText="Cancel"
            type="warning"
            isLoading={loading}
            onConfirm={handleToggleVisibility}
            onCancel={() => setShowConfirmation(false)}
          />
        ) : (
          <div>
            {/* Section 1: Privacy Status Card */}
            <div className="p-6 bg-white rounded-lg border border-neutral-200 mb-6 relative overflow-hidden">
              {/* Visual status indicator */}
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-green-400 to-green-500" 
                   style={{ backgroundColor: isPublic ? '#10B981' : '#EF4444', opacity: 0.7 }}></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="mb-5 md:mb-0">
                  <div className="flex items-center">
                    {isPublic 
                      ? <ShieldCheck size={22} className="text-green-500 mr-2" /> 
                      : <ShieldOff size={22} className="text-red-500 mr-2" />
                    }
                    <h3 className="text-lg font-medium text-neutral-800">Profile Visibility</h3>
                  </div>
                  <p className="text-neutral-600 mt-1 ml-7">Control who can see your profile in the member directory</p>
                </div>
                
                <div className="flex flex-col items-start md:items-end">
                  {/* Status indicator (not a button) */}
                  <div className={`inline-flex items-center px-3.5 py-1.5 rounded-full font-medium ${
                    isPublic 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isPublic ? <Eye size={16} className="mr-2" /> : <EyeOff size={16} className="mr-2" />}
                    <span>{isPublic ? 'Public' : 'Hidden'}</span>
                  </div>
                  
                  <p className="text-sm text-neutral-500 mt-2">
                    Current status: 
                    <span className={isPublic ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {isPublic ? ' Visible to all members' : ' Hidden from directory'}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <div className="mt-6 pt-5 border-t border-neutral-100">
                <label htmlFor="privacy-toggle" className="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="privacy-toggle"
                    className="sr-only"
                    checked={isPublic}
                    onChange={requestToggleVisibility}
                    disabled={loading}
                  />
                  <div className={`w-14 h-7 bg-gray-200 rounded-full peer dark:bg-neutral-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all
                    ${isPublic ? 'bg-green-500' : 'bg-red-300'}`}></div>
                  <span className="ml-3 text-sm font-medium text-neutral-700">
                    {isPublic ? 'Visible in Directory' : 'Hidden from Directory'}
                  </span>
                  
                  {loading && <Loader size={16} className="ml-2 animate-spin text-primary-600" />}
                </label>
              </div>
            </div>
            
            {/* Section 2: Share Profile - Moved from ProfileCard */}
            <div className="p-6 bg-white rounded-lg border border-neutral-200 mb-6">
              <div className="flex items-center mb-4">
                <Share2 size={20} className="text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-neutral-800">Share Your Profile</h3>
              </div>
              <p className="text-neutral-600 mb-4">Share your profile information with others via WhatsApp or other platforms</p>
              <button
                onClick={handleShare}
                className="flex items-center justify-center py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors w-full"
              >
                <Share2 size={18} className="mr-2" />
                Share Profile
              </button>
            </div>
            
            {/* Section 3: Account Management - Moved from ProfileCard */}
            <div className="p-6 bg-white rounded-lg border border-neutral-200">
              <div className="flex items-center mb-4">
                <Lock size={20} className="text-red-500 mr-2" />
                <h3 className="text-lg font-medium text-neutral-800">Account Management</h3>
              </div>
              
              <div className="space-y-6">
                {/* Deactivate Account */}
                <div>
                  <h4 className="text-md font-medium text-neutral-700 mb-2">Deactivate Account</h4>
                  <p className="text-neutral-600 text-sm mb-3">
                    Account deactivation temporarily hides your profile from the directory. You can reactivate by logging in again.
                  </p>
                  <button
                    className="py-2 px-4 border border-yellow-500 text-yellow-700 hover:bg-yellow-50 font-medium rounded-md transition-colors w-full"
                    onClick={() => {
                      resetConfirmations();
                      setActionState((prev) => ({
                        ...prev,
                        showDeactivateConfirm: true
                      }));
                    }}
                  >
                    Deactivate Account
                  </button>
                </div>
                
                <div className="border-t border-neutral-100 pt-6"></div>
                
                {/* Delete Account */}
                <div>
                  <h4 className="text-md font-medium text-red-600 mb-2">Delete Account</h4>
                  <p className="text-neutral-600 text-sm mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button 
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors w-full"
                    onClick={() => {
                      resetConfirmations();
                      setActionState((prev) => ({
                        ...prev,
                        showDeleteConfirm: true
                      }));
                    }}
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Confirmation Dialogs - Moved from ProfileCard */}
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
      </Card.Body>
    </Card>
  );
};

export default ProfileSettings;