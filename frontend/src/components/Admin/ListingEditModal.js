import React, { useState, useEffect } from 'react';
import { X, AlertCircle, FileText, Tag, MessageSquare, User, Calendar } from 'lucide-react';

const ListingEditModal = ({ listing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    approved: false
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize form with listing data
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        category: listing.category || '',
        description: listing.description || '',
        approved: listing.approved !== false // Default to true if not explicitly false
      });
    }
  }, [listing]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title.trim() || !formData.category.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setSaving(true);
    
    try {
      const success = await onSave(listing._id, formData);
      
      if (success) {
        onClose();
      } else {
        setError('Failed to save listing. Please try again.');
      }
    } catch (err) {
      console.error('Error saving listing:', err);
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit Listing
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <MessageSquare size={16} className="text-gray-400" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                ></textarea>
              </div>
            </div>
            
            <div className="form-group">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="approved"
                  name="approved"
                  checked={formData.approved}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="approved" className="ml-2 block text-sm text-gray-700">
                  Approved (visible to users)
                </label>
              </div>
            </div>
            
            {listing && listing.user && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Listing Information</h3>
                <div className="bg-gray-50 rounded-md p-3 text-sm">
                  <div className="flex items-center mb-1">
                    <User size={14} className="text-gray-500 mr-2" />
                    <span className="text-gray-600">Owner: </span>
                    <span className="ml-1 font-medium text-gray-800">{listing.user.name}</span>
                  </div>
                  {listing.createdAt && (
                    <div className="flex items-center">
                      <Calendar size={14} className="text-gray-500 mr-2" />
                      <span className="text-gray-600">Created: </span>
                      <span className="ml-1 font-medium text-gray-800">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ListingEditModal;
