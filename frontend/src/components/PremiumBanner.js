import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Star, Shield, Users } from 'lucide-react';
import '../styles/PremiumBanner.css';

const PremiumBanner = ({ planStatus, searchContext = '' }) => {
  const navigate = useNavigate();
  
  // If user is already premium, show a different message
  if (planStatus !== 'free') {
    return (
      <div className="premium-banner premium-active">
        <div className="premium-banner-icon">
          <Award size={24} />
        </div>
        <div className="premium-banner-content">
          <h3>Premium Access Active</h3>
          <p>You have full access to all member contact information and premium features.</p>
        </div>
      </div>
    );
  }

  // Different message based on if user is searching or just browsing
  const title = searchContext ? 
    'Unlock Contact Info for These Members' : 
    'Upgrade to Premium Membership';
  
  const description = searchContext ?
    'Upgrade to contact members matching your search and access all premium features.' :
    'Get full access to member contact information and premium features.';

  return (
    <div className="premium-banner">
      <div className="premium-banner-header">
        <div className="premium-banner-icon">
          <Star size={24} />
        </div>
        <h3>{title}</h3>
      </div>
      
      <div className="premium-banner-content">
        <p>{description}</p>
        
        <div className="premium-features">
          <div className="premium-feature">
            <Shield size={16} />
            <span>Direct member contact</span>
          </div>
          <div className="premium-feature">
            <Users size={16} />
            <span>Access to full profiles</span>
          </div>
        </div>
        
        <button 
          className="premium-upgrade-button"
          onClick={() => navigate('/upgrade-membership')}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
};

export default PremiumBanner;
