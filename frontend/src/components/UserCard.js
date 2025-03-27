import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Star, ShieldCheck, Eye } from 'lucide-react';
import '../styles/UserCard.css';

const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150?text=Member';

const UserCard = ({ user, canContact, currentUser, searchTerm }) => {
  const navigate = useNavigate();
  
  const viewProfile = () => {
    navigate(`/user-profile/${user._id}`);
  };
  
  const upgradeToContact = () => {
    navigate('/upgrade-membership');
  };
  
  // Determine if this is the current user's card
  const isOwnProfile = currentUser?._id === user._id;
  
  return (
    <div className="user-card">
      <div className="user-card-header">
        {/* Status badges in a badge container */}
        <div className="status-badges">
          {user.isPublic && (
            <span className="status-badge public">
              <Eye size={12} />
              <span>Public</span>
            </span>
          )}
          {user.accountStatus === 'active' && (
            <span className="status-badge active">
              <ShieldCheck size={12} />
              <span>Active</span>
            </span>
          )}
          {user.planType === 'premium' && (
            <span className="status-badge premium">
              <Star size={12} />
              <span>Premium</span>
            </span>
          )}
        </div>
        
        {/* User image */}
        <div className="user-image-container">
          <img
            src={user.profileImage || DEFAULT_PROFILE_IMAGE}
            alt={`${user.name}'s profile`}
            className="user-image"
            onError={(e) => { e.target.src = DEFAULT_PROFILE_IMAGE }}
          />
        </div>
      </div>
      
      <div className="user-card-body">
        <h3 className="user-name">{user.name}</h3>
        <p className="user-occupation">{user.occupation}</p>
        
        {user.profession && (
          <div className="mb-2">
            <span className="text-sm font-medium text-primary-600">{user.profession}</span>
          </div>
        )}

        {user.location && (
          <div className="user-location">
            <MapPin size={14} />
            <span>{user.location}</span>
          </div>
        )}
        
        {/* Contact information - only shown if user can contact */}
        {canContact && (
          <div className="contact-details">
            {user.phoneNumber && (
              <div className="contact-item">
                <Phone size={14} />
                <span>{user.phoneNumber}</span>
              </div>
            )}
            {user.email && (
              <div className="contact-item">
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Profession if available */}
        {user.profession && (
          <div className="mt-2">
            <div className="text-xs text-neutral-500 mb-1">Profession:</div>
            <div className="flex flex-wrap gap-1 justify-center">
              <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                {user.profession}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="user-card-footer">
        {isOwnProfile ? (
          <button className="btn-primary" onClick={viewProfile}>
            View My Profile
          </button>
        ) : (
          <>
            <button className="btn-primary" onClick={viewProfile}>
              View Profile
            </button>
            
            {!canContact && (
              <button className="btn-premium" onClick={upgradeToContact}>
                <Star size={14} className="mr-1" />
                Upgrade to Contact
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserCard;
