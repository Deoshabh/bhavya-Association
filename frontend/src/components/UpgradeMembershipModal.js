import React from 'react';

const UpgradeMembershipModal = ({ onClose, onUpgrade }) => {
  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleModalClick}>
        <button className="modal-close-button" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <h2>Premium Membership Required</h2>
        </div>
        
        <div className="modal-body">
          <p>You need a premium membership to contact other members directly.</p>
          
          <div className="membership-benefits">
            <h3>Premium Benefits:</h3>
            <ul>
              <li>Contact any member in the directory</li>
              <li>Access to phone numbers and full contact details</li>
              <li>Share profiles via WhatsApp</li>
              <li>Get priority support</li>
              <li>And much more!</li>
            </ul>
          </div>
          
          <div className="membership-pricing">
            <div className="price-tag">
              <span className="currency">₹</span>
              <span className="amount">499</span>
              <span className="period">/year</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>Not Now</button>
          <button className="upgrade-button" onClick={onUpgrade}>Upgrade Now</button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeMembershipModal;
