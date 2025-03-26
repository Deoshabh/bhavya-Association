import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import { Eye, EyeOff, AlertTriangle, CheckCircle, Loader, ShieldCheck, ShieldOff, Info } from 'lucide-react';
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
            {/* Privacy Status Card */}
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
            
            {/* Action button - only show if it would change the state */}
            <div className="flex justify-center mb-6">
              <button 
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  isPublic 
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300' 
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
                      </div>
                    )}
                  </Card.Body>
                </Card>
              );
            };
            
            export default ProfileSettings;