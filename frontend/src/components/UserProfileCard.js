import React from 'react';
import { Phone, Mail, MapPin, Award, User } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import '../styles/UserProfileCard.css';

// Default avatar SVG as data URL
const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='150' height='150'%3E%3Cpath fill='%23d1d5db' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const UserProfileCard = ({ 
  user, 
  isPremium = false, 
  isOwnProfile = false, 
  onContactClick,
  onUpgradeClick,
  onShareProfile
}) => {
  if (!user) return null;
  
  // Format comma-separated list of interests
  const formattedInterests = user.interests && user.interests.length > 0 
    ? user.interests.join(', ') 
    : 'None specified';
  
  // Handle image loading errors  
  const handleImageError = (e) => {
    e.target.src = DEFAULT_PROFILE_IMAGE;
  };
  
  // Contact section - different based on premium status and whether it's own profile
  const renderContactSection = () => {
    if (isOwnProfile) {
      return (
        <div className="contact-section">
          <h3 className="section-title">Contact Information</h3>
          <div className="contact-item">
            <Phone size={18} />
            <span>{user.phoneNumber}</span>
          </div>
          {user.email && (
            <div className="contact-item">
              <Mail size={18} />
              <span>{user.email}</span>
            </div>
          )}
          <Button
            variant="success"
            fullWidth
            className="share-button"
            onClick={onShareProfile}
          >
            Share Profile on WhatsApp
          </Button>
        </div>
      );
    } else if (isPremium) {
      return (
        <div className="contact-section">
          <h3 className="section-title">Contact Information</h3>
          <div className="contact-item">
            <Phone size={18} />
            <span>{user.phoneNumber}</span>
          </div>
          {user.email && (
            <div className="contact-item">
              <Mail size={18} />
              <span>{user.email}</span>
            </div>
          )}
          <div className="contact-actions">
            <a href={`tel:${user.phoneNumber}`} className="call-button">
              Call Now
            </a>
            <Button
              variant="success"
              className="share-button"
              onClick={onShareProfile}
            >
              Share Contact
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="premium-upgrade-section">
          <div className="premium-badge">
            <Award size={24} />
          </div>
          <h3>Premium Membership Required</h3>
          <p>Upgrade to view contact information and connect with this member.</p>
          <Button
            variant="warning"
            fullWidth
            onClick={onUpgradeClick}
          >
            Upgrade to Premium
          </Button>
        </div>
      );
    }
  };
  
  return (
    <Card className="user-profile-card">
      <div className="profile-header">
        <div className="profile-image-container">
          <img 
            src={user.profileImage || DEFAULT_PROFILE_IMAGE} 
            alt={`${user.name}'s profile`} 
            className="profile-image"
            onError={handleImageError}
          />
        </div>
        <h2>{user.name}</h2>
        <p className="profile-occupation">{user.occupation}</p>
      </div>
      
      <div className="profile-sections">
        <div className="profile-info-section">
          <div className="info-section">
            <h3 className="section-title"><User size={18} /> About Me</h3>
            <p className="bio">{user.bio || "No bio provided"}</p>
          </div>
          
          {user.address && (
            <div className="info-section">
              <h3 className="section-title"><MapPin size={18} /> Address</h3>
              <p>{user.address}</p>
            </div>
          )}
          
          <div className="info-section">
            <h3 className="section-title">Interests</h3>
            <div className="interests-container">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest, index) => (
                  <span key={index} className="interest-tag">{interest}</span>
                ))
              ) : (
                <p>No interests specified</p>
              )}
            </div>
          </div>
        </div>
        
        {renderContactSection()}
      </div>
    </Card>
  );
};

export default UserProfileCard;
