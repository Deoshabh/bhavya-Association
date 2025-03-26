import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DeleteConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="delete-confirm-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="warning-icon">
            <AlertTriangle size={48} />
          </div>
          
          <p className="warning-message">{message}</p>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="delete-button" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
