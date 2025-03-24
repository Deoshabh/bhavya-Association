import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';
import '../styles/ProfileCard.css';
import logo from '../assets/logo4-1.png'; // Adjust the path if necessary

// Use a data URL for the default profile image instead of importing an asset
const DEFAULT_PROFILE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='150' height='150'%3E%3Cpath fill='%23d1d5db' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const ProfileCard = ({ user, setEditMode }) => {
  const { api, logout } = useContext(AuthContext);
  const [actionState, setActionState] = useState({
    showDeleteConfirm: false,
    showDeactivateConfirm: false,
    isDeleting: false,
    isDeactivating: false,
    error: ''
  });
  const navigate = useNavigate();

  // Construct a share text for WhatsApp
  const shareText = `Check out my profile on Bhavya Association!
Name: ${user.name}
Phone: ${user.phoneNumber}
Occupation: ${user.occupation}
Bio: ${user.bio}
Address: ${user.address}
Interests: ${user.interests.join(', ')}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

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
      alert('Your account has been deleted successfully');
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
      alert('Your account has been deactivated successfully');
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
      showDeleteConfirm: false,
      showDeactivateConfirm: false,
      isDeleting: false,
      isDeactivating: false,
      error: ''
    });
  };

  return (
    <div className="profile-card">
      {/* Header Section */}
      <div className="profile-card-header">
        {/* Logo */}
        <img
          src={logo}
          alt="Society Logo"
          className="profile-card-logo"
        />
        {/* Text Container */}
        <div className="text-container">
          <span className="ex">INTERNATIONAL BHAVYA DIRECTORY</span>
          <span className="extra">
            संघ रजि नः 803 | Reg No.: {user.registrationNumber || '67736'}
          </span>
        </div>
      </div>

      {/* Body Section */}
      <div className="profile-card-body">
        {/* Profile Image */}
        <div className="profile-card-img">
          <img
            src={user.profileImage || DEFAULT_PROFILE_IMAGE}
            alt={`${user.name}'s profile`}
            onError={handleImageError}
          />
        </div>

        {/* Content */}
        <div className="profile-card-content">
          <h3>{user.name}</h3>
          <p className="occupation">
            {user.occupation || 'No Occupation'}
            {user.accountStatus === 'deactivated' && (
              <span style={{ color: 'red', marginLeft: '10px' }}>
                (Deactivated)
              </span>
            )}
          </p>
          <p><strong>Phone:</strong> {user.phoneNumber}</p>
          <p><strong>Bio:</strong> {user.bio || 'No bio provided'}</p>
          <p><strong>Address:</strong> {user.address || 'No address provided'}</p>
          <p>
            <strong>Interests:</strong>{' '}
            {user.interests && user.interests.length > 0
              ? user.interests.join(', ')
              : 'None specified'}
          </p>
          <p><strong>Location:</strong> {user.location || 'Agra, Uttar Pradesh'}</p>
          
          {/* Buttons Container */}
          <div className="button-container">
            {/* WhatsApp Share Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-button"
            >
              Share on WhatsApp
            </a>

            {/* Edit Profile Button */}
            <button className="share-button edit-button" onClick={handleEditClick}>
              Edit Profile
            </button>

            {/* Deactivate / Delete Buttons */}
            {!actionState.showDeleteConfirm && !actionState.showDeactivateConfirm && (
              <div className="button-container">
                <button
                  className="share-button deactivate-button"
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

                <button
                  className="share-button delete-button"
                  onClick={() => {
                    resetConfirmations();
                    setActionState((prev) => ({
                      ...prev,
                      showDeleteConfirm: true
                    }));
                  }}
                >
                  Delete Account
                </button>
              </div>
            )}

            {/* Confirm Dialogs */}
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
                note="This action cannot be undone!"
                confirmText="Yes, Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={actionState.isDeleting}
                errorMessage={actionState.error}
                onConfirm={handleDeleteAccount}
                onCancel={resetConfirmations}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="profile-card-footer">
        <div className="footer-left">*Not for official use</div>
        <div className="footer-right">Generated by Bhavya</div>
      </div>
    </div>
  );
};

export default ProfileCard;
