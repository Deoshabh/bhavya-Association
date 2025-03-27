import React, { useState, useEffect } from 'react';
import { X, User, Phone, Briefcase, Shield, AlertCircle } from 'lucide-react';

const UserEditModal = ({ user, isCreating, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    occupation: '',
    planType: 'free',
    accountStatus: 'active',
    isPublic: true
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize form with user data when editing
  useEffect(() => {
    if (user && !isCreating) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        password: '', // Don't populate password when editing
        occupation: user.occupation || '',
        planType: user.planType || 'free',
        accountStatus: user.accountStatus || 'active',
        isPublic: user.isPublic !== undefined ? user.isPublic : true
      });
    }
  }, [user, isCreating]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear field-specific error when user changes input
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    if (isCreating && !formData.password) {
      errors.password = 'Password is required for new users';
    } else if (isCreating && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      // Only include password if creating a new user or if it's changed
      const userData = { ...formData };
      if (!userData.password) {
        delete userData.password;
      }
      
      const success = await onSave(user?._id, userData);
      
      if (success) {
        onClose();
      } else {
        setError('Failed to save user. Please try again.');
      }
    } catch (err) {
      console.error('Error saving user:', err);
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
            {isCreating ? 'Create New User' : 'Edit User'}
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`pl-10 w-full px-3 py-2 border ${
                    fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`pl-10 w-full px-3 py-2 border ${
                    fieldErrors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
              {fieldErrors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phoneNumber}</p>
              )}
            </div>
            
            {(isCreating || formData.password) && (
              <div className="form-group">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password {isCreating && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isCreating ? "Required for new users" : "Leave blank to keep current password"}
                    className={`pl-10 w-full px-3 py-2 border ${
                      fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
                {!isCreating && (
                  <p className="mt-1 text-xs text-gray-500">Leave blank to keep current password</p>
                )}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                Occupation
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="planType" className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Type
                </label>
                <select
                  id="planType"
                  name="planType"
                  value={formData.planType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="accountStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Status
                </label>
                <select
                  id="accountStatus"
                  name="accountStatus"
                  value={formData.accountStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                  Visible in Directory (Public Profile)
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                When checked, this user will appear in the member directory.
              </p>
            </div>
            
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
                  'Save User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
