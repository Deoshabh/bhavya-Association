import React, { useState } from 'react';
import { X } from 'lucide-react';

const UserEditModal = ({ user, isCreating = false, onClose, onSave }) => {
  const initialFormData = isCreating ? {
    name: '',
    phoneNumber: '',
    occupation: '',
    password: '', // Only needed for new users
    planType: 'free',
    accountStatus: 'active',
    isPublic: true
  } : {
    name: user.name,
    phoneNumber: user.phoneNumber,
    occupation: user.occupation || '',
    planType: user.planType,
    accountStatus: user.accountStatus,
    isPublic: user.isPublic
  };

  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    // Validate required fields
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    // Password is required for new users
    if (isCreating && !formData.password) {
      errors.password = 'Password is required for new users';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const success = await onSave(isCreating ? null : user._id, formData);
      
      if (success) {
        onClose();
      } else {
        setError('Failed to save changes. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while saving changes.');
      console.error('Error saving user:', err);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="user-edit-modal">
        <div className="modal-header">
          <h2>{isCreating ? 'Create New User' : 'Edit User'}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={fieldErrors.name ? 'error' : ''}
              />
              {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={fieldErrors.phoneNumber ? 'error' : ''}
                disabled={!isCreating} // Only allow editing phone number for new users
              />
              {fieldErrors.phoneNumber && <div className="field-error">{fieldErrors.phoneNumber}</div>}
            </div>
            
            {isCreating && (
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={fieldErrors.password ? 'error' : ''}
                />
                {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="occupation">Occupation</label>
              <input
                type="text"
                id="occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="planType">Plan Type</label>
              <select
                id="planType"
                name="planType"
                value={formData.planType}
                onChange={handleChange}
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="accountStatus">Account Status</label>
              <select
                id="accountStatus"
                name="accountStatus"
                value={formData.accountStatus}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                />
                Visible in Directory
              </label>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-button" disabled={saving}>
                {saving ? 'Saving...' : isCreating ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
