import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProfileForm from '../components/ProfileForm';
import ProfileCard from '../components/ProfileCard';
import ProfileSettings from '../components/ProfileSettings';
import '../styles/Profile.css';

const Profile = () => {
  const { user, loading, serverStatus } = useContext(AuthContext);
  const [profileCompleted, setProfileCompleted] = useState(() => !!user?.bio);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading user profile...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">{editMode ? 'Edit Profile' : 'Your Profile'}</h1>
      </div>
      
      {!serverStatus && (
        <div className="server-warning mobile-friendly-alert">
          <p>⚠️ Server connection issues detected. Your profile data may not be saved.</p>
        </div>
      )}
      
      {profileCompleted && !editMode && (
        <div className="profile-tabs mobile-friendly-tabs">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Privacy Settings
          </button>
        </div>
      )}
      
      <div className="profile-content-container">
        {!profileCompleted ? (
          <ProfileForm user={user} setProfileCompleted={setProfileCompleted} />
        ) : editMode ? (
          <ProfileForm 
            user={user} 
            isEditing={true} 
            setEditMode={setEditMode} 
          />
        ) : activeTab === 'profile' ? (
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