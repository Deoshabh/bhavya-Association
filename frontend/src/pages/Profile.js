import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProfileForm from '../components/ProfileForm';
import ProfileCard from '../components/ProfileCard';
import ProfileSettings from '../components/ProfileSettings';
import { User, Settings, AlertTriangle, Loader } from 'lucide-react';
import Alert from '../components/Alert';

const Profile = () => {
  const { user, loading, serverStatus } = useContext(AuthContext);
  const [profileCompleted, setProfileCompleted] = useState(() => !!user?.bio);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader size={40} className="animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-neutral-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If profile is not completed, show only the profile form
  if (!profileCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Complete Your Profile</h1>
          <p className="text-neutral-600">Please provide some additional information to complete your profile.</p>
        </div>
        
        {!serverStatus && (
          <Alert 
            variant="warning" 
            className="mb-6"
            title="Connection Issues"
            dismissible={false}
          >
            Server connection issues detected. Your profile data may not be saved until the connection is restored.
          </Alert>
        )}
        
        <ProfileForm user={user} setProfileCompleted={setProfileCompleted} />
      </div>
    );
  }

  // If in edit mode, show only the profile form
  if (editMode) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Edit Your Profile</h1>
          <p className="text-neutral-600">Update your profile information below.</p>
        </div>
        
        {!serverStatus && (
          <Alert 
            variant="warning" 
            className="mb-6"
            title="Connection Issues"
            dismissible={false}
          >
            Server connection issues detected. Your profile changes may not be saved until the connection is restored.
          </Alert>
        )}
        
        <ProfileForm 
          user={user} 
          isEditing={true} 
          setEditMode={setEditMode} 
        />
      </div>
    );
  }

  // Otherwise, show the profile or settings based on active tab
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Your Profile</h1>
        <p className="text-neutral-600">View and manage your profile information and settings.</p>
      </div>
      
      {!serverStatus && (
        <Alert 
          variant="warning" 
          className="mb-6"
          title="Connection Issues"
          dismissible={false}
        >
          <AlertTriangle className="mr-2" size={16} />
          Server connection issues detected. Some features may be unavailable.
        </Alert>
      )}
      
      <div className="mb-6 border-b border-neutral-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <User size={16} className="mr-2" />
            <span>Profile</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <Settings size={16} className="mr-2" />
            <span>Privacy Settings</span>
          </button>
        </nav>
      </div>
      
      <div className="profile-content">
        {activeTab === 'profile' ? (
          <ProfileCard 
            user={user} 
            setEditMode={setEditMode} 
          />
        ) : (
          <ProfileSettings user={user} />
        )}
      </div>
    </div>
  );
};

export default Profile;