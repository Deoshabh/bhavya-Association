import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Bell, Lock, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import ConfirmDialog from '../components/ConfirmDialog';

const PrivacySettings = () => {
  const { user, updateUser, api, deleteAccount } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isPublic, setIsPublic] = useState(user?.isPublic || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleVisibilityChange = async (e) => {
    const newValue = e.target.checked;
    setIsPublic(newValue);
    
    try {
      await api.put('/api/profile/update-privacy', { isPublic: newValue });
      updateUser({ isPublic: newValue });
    } catch (err) {
      console.error('Failed to update privacy settings:', err);
      setIsPublic(!newValue); // Revert on error
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setError('');

    try {
      await deleteAccount();
      // No need to navigate - the auth context will handle logout and redirection
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again later.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <BackButton />
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Privacy Settings</h1>

      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
            <Shield className="mr-2 text-primary-600" size={20} />
            Profile Visibility
          </h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="directory-visibility"
                  name="directory-visibility"
                  type="checkbox"
                  checked={isPublic}
                  onChange={handleVisibilityChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="directory-visibility" className="font-medium text-neutral-700">
                  Show my profile in member directory
                </label>
                <p className="text-neutral-500">
                  When enabled, your profile will be visible to other members in the directory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-red-600" size={20} />
            Danger Zone
          </h2>

          <div className="border-t border-neutral-200 pt-4 mt-4">
            <p className="text-neutral-700 mb-1">Delete Account</p>
            <p className="text-neutral-500 text-sm mb-3">
              Permanently delete your account and all of your data. This action cannot be undone.
            </p>
            <p 
              className="text-red-600 text-sm font-medium cursor-pointer hover:underline" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete my account
            </p>
          </div>
        </div>
      </Card>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Account"
          message="Are you sure you want to permanently delete your account?"
          note="This action cannot be undone! All your data will be permanently removed."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeleting}
          errorMessage={error}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default PrivacySettings;
