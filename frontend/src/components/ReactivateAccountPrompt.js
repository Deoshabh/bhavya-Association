import React from 'react';
import '../styles/ReactivateAccountPrompt.css';

const ReactivateAccountPrompt = ({ onReactivate, onCancel, isReactivating }) => {
  return (
    <div className="reactivate-overlay">
      <div className="reactivate-modal">
        <div className="reactivate-content">
          <h2>Deactivated Account</h2>
          
          <div className="reactivate-icon">⚠️</div>
          
          <p>Your account is currently deactivated. You won't appear in the member directory and your profile is hidden.</p>
          
          <p className="reactivate-question">Would you like to reactivate your account now?</p>
          
          <div className="reactivate-buttons">
            <button 
              className="btn-cancel" 
              onClick={onCancel} 
              disabled={isReactivating}
            >
              Not Now
            </button>
            <button 
              className="btn-reactivate" 
              onClick={onReactivate} 
              disabled={isReactivating}
            >
              {isReactivating ? 'Reactivating...' : 'Reactivate My Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactivateAccountPrompt;
