import React, { useState } from 'react';
import { X } from 'lucide-react';
import '../../styles/Admin/ListingEditModal.css';

const ListingEditModal = ({ listing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: listing.title,
    category: listing.category,
    description: listing.description,
    approved: listing.approved !== false // Default to true if undefined
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      
      const success = await onSave(listing._id, formData);
      
      if (success) {
        onClose();
      } else {
        setError('Failed to update listing. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while saving changes.');
      console.error('Error saving listing:', err);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="listing-edit-modal">
        <div className="modal-header">
          <h2>Edit Listing</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="approved"
                  checked={formData.approved}
                  onChange={handleChange}
                />
                Approved (visible to users)
              </label>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-button" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <div className="listing-owner-info">
            <p><strong>Created By:</strong> {listing.user?.name || 'Unknown'}</p>
            <p><strong>Contact:</strong> {listing.contactPhone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingEditModal;
