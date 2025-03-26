import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';

const ProfileSettings = ({ user }) => {
  const { api, updateUser } = useContext(AuthContext);
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
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
  
  return (
    <div className="profile-settings">
      <h2>Privacy Settings</h2>
      
      {error && <p className="settings-error">{error}</p>}
      {success && <p className="settings-success">{success}</p>}
      
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
        <div className="settings-group">
          <div className="visibility-setting">
            <div className="setting-info">
              <h3>Profile Visibility</h3>
              <p>Control who can see your profile in the member directory.</p>
              
              <div className={`status-indicator ${isPublic ? 'visible' : 'hidden'}`}>
                {isPublic ? 'Your profile is publicly visible' : 'Your profile is hidden'}
              </div>
            </div>
            
            <button 
              className={`toggle-button ${isPublic ? 'hide-profile' : 'show-profile'}`}
              onClick={requestToggleVisibility}
              disabled={loading}
            >
              {loading 
                ? 'Updating...' 
                : isPublic 
                  ? 'Hide My Profile' 
                  : 'Make Profile Visible'
              }
            </button>
          </div>
          
          <div className="setting-note">
            <p>
              <strong>Note:</strong> {isPublic 
                ? 'Your profile is currently visible to all members in the directory.' 
                : 'Your profile is currently hidden from the member directory.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
