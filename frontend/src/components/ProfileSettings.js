import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import { Eye, EyeOff, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import Card from './Card';

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
            <div className="p-5 bg-white rounded-lg border border-neutral-200 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-lg font-medium text-neutral-800 mb-1">Profile Visibility</h3>
                  <p className="text-neutral-600">Control who can see your profile in the member directory</p>
                </div>
                
                <div className="flex flex-col items-start md:items-end">
                  <button 
                    className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
                      isPublic 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                    disabled={loading}
                    style={{ minWidth: '140px' }}
                  >
                    {isPublic ? <Eye size={18} className="mr-2" /> : <EyeOff size={18} className="mr-2" />}
                    {isPublic ? 'Public' : 'Hidden'}
                  </button>
                  
                  <p className="text-sm text-neutral-600 mt-2">
                    Status: {isPublic ? 'Visible to all members' : 'Hidden from directory'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button 
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  isPublic 
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800' 
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
                onClick={requestToggleVisibility}
                disabled={loading}
              >
                {loading && <Loader size={16} className="inline mr-2 animate-spin" />}
                {loading 
                  ? 'Updating...' 
                  : isPublic 
                    ? 'Hide My Profile' 
                    : 'Make Profile Visible'
                }
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-md text-sm text-blue-800">
              <h4 className="font-medium mb-1">Important Information</h4>
              <p>
                {isPublic 
                  ? 'When your profile is public, all members can find you in the directory. Basic members can see your name and occupation, while Premium members can also view your contact details.' 
                  : 'While hidden, your profile will not appear in directory searches and other members will not be able to view your information.'}
              </p>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProfileSettings;
