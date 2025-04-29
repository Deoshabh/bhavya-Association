import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BackButton from '../components/BackButton';

const UpgradeMembership = () => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // If user is already premium, no need to upgrade
  if (user.planType === 'premium' || user.planType === 'admin') {
    return (
      <div className="upgrade-page">
        <div className="upgrade-container already-premium">
          <div className="upgrade-header">
            <BackButton />
            <h1>Premium Membership</h1>
          </div>
          <div className="premium-badge">
            <span>✓</span>
          </div>
          <h2>You already have premium access!</h2>
          <p>You can enjoy all benefits of our premium membership:</p>
          <ul className="benefit-list">
            <li>Contact any member in the directory</li>
            <li>Access to phone numbers and full contact details</li>
            <li>Share profiles via WhatsApp</li>
            <li>Get priority support</li>
          </ul>
        </div>
      </div>
    );
  }
  
  return (
    <div className="upgrade-page">
      <div className="upgrade-container">
        <div className="upgrade-header">
          <BackButton />
          <h1>Upgrade to Premium</h1>
        </div>
        
        <div className="pricing-box">
          <div className="price-tag">
            <span className="currency">₹</span>
            <span className="amount">499</span>
            <span className="period">/year</span>
          </div>
          
          <ul className="benefit-list">
            <li>Contact any member in the directory</li>
            <li>Access to phone numbers and full contact details</li>
            <li>Share profiles via WhatsApp</li>
            <li>Get priority support</li>
            <li>Early access to new features</li>
          </ul>
          
          <button className="upgrade-button">
            Proceed to Payment
          </button>
          
          <p className="disclaimer">
            * We use secure payment processing. Membership is valid for 1 year from the date of purchase.
          </p>
        </div>
        
        <div className="support-info">
          <p>Need help? Contact our support team at <strong>support@bhavya-Associates.org</strong></p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeMembership;
