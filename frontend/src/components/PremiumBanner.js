import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Star, Shield, Users, Clock } from 'lucide-react';
import moment from 'moment';

// Banner schedule configuration
const BANNER_SCHEDULE = [
  { 
    id: 'premium', 
    title: 'Upgrade to Premium Membership',
    description: 'Get full access to member contact information and premium features.',
    icon: <Star size={24} />,
    path: '/upgrade-membership',
    startTime: '00:00', // 12 AM
    endTime: '16:00',   // 4 PM
    priority: 2
  },
  {
    id: 'event',
    title: 'Join Our Upcoming Event',
    description: 'Network with other members and expand your professional connections.',
    icon: <Clock size={24} />,
    path: '/events',
    startTime: '16:00', // 4 PM
    endTime: '00:00',   // 12 AM
    priority: 1
  }
];

const PremiumBanner = ({ planStatus, searchContext = '', overrideBanner = null }) => {
  const navigate = useNavigate();
  const [activeBanner, setActiveBanner] = useState(null);
  
  useEffect(() => {
    // Function to determine which banner to show based on time
    const determineActiveBanner = () => {
      // If a specific banner is requested, show it
      if (overrideBanner) {
        return BANNER_SCHEDULE.find(banner => banner.id === overrideBanner) || BANNER_SCHEDULE[0];
      }
      
      const currentTime = moment();
      const currentHourMinute = currentTime.format('HH:mm');
      
      // Find the banner that matches the current time
      const matchingBanners = BANNER_SCHEDULE.filter(banner => {
        if (banner.startTime <= banner.endTime) {
          // Standard case: startTime is before endTime
          return currentHourMinute >= banner.startTime && currentHourMinute < banner.endTime;
        } else {
          // Wrap-around case (overnight): startTime is after endTime
          return currentHourMinute >= banner.startTime || currentHourMinute < banner.endTime;
        }
      });
      
      // Return highest priority banner, or default to the premium banner
      return matchingBanners.sort((a, b) => a.priority - b.priority)[0] || BANNER_SCHEDULE[0];
    };
    
    setActiveBanner(determineActiveBanner());
    
    // Update the banner every hour
    const intervalId = setInterval(() => {
      setActiveBanner(determineActiveBanner());
    }, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(intervalId);
  }, [overrideBanner]);
  
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
  
  // If banner hasn't been determined yet, don't render anything
  if (!activeBanner) return null;

  // Different message based on search context
  const title = searchContext ? 
    'Unlock Contact Info for These Members' : 
    activeBanner.title;
  
  const description = searchContext ?
    'Upgrade to contact members matching your search and access all premium features.' :
    activeBanner.description;

  // Handle the click for the entire banner
  const handleBannerClick = () => {
    navigate(activeBanner.path);
  };

  return (
    <div 
      className="premium-banner clickable-banner"
      onClick={handleBannerClick}
      onKeyDown={(e) => e.key === 'Enter' && handleBannerClick()}
      role="button"
      tabIndex="0"
      aria-label={title}
    >
      <div className="premium-banner-header">
        <div className="premium-banner-icon">
          {activeBanner.icon || <Star size={24} />}
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
        
        {/* Button exists inside the clickable banner but prevents click event propagation */}
        <button 
          className="premium-upgrade-button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent parent div click
            navigate(activeBanner.path);
          }}
        >
          {activeBanner.id === 'premium' ? 'Upgrade Now' : (
            activeBanner.id === 'event' ? 'Learn More' : 'Get Started'
          )}
        </button>
      </div>
    </div>
  );
};

export default PremiumBanner;
