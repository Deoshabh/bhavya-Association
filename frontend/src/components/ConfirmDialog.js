import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import '../styles/ConfirmDialog.css';

const ConfirmDialog = ({ 
  title, 
  message, 
  note, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'info' // 'info', 'warning', or 'danger'
}) => {
  // Prevent clicks inside the dialog from closing it
  const handleDialogClick = (e) => {
    e.stopPropagation();
  };
  
  // Select icon based on type
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={24} className="warning-icon" />;
      case 'danger':
        return <AlertCircle size={24} className="danger-icon" />;
      case 'info':
      default:
        return <Info size={24} className="info-icon" />;
    }
  };
  
  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className={`confirm-dialog ${type}`} onClick={handleDialogClick}>
        <div className="dialog-icon">
          {getIcon()}
        </div>
        
        <div className="dialog-content">
          <h3>{title}</h3>
          <p>{message}</p>
          
          {note && <p className="dialog-note">{note}</p>}
        </div>
        
        <div className="dialog-actions">
          <button 
            className="cancel-button" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          
          <button 
            className={`confirm-button ${type}`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
