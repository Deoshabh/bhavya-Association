import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { withRetry } from '../utils/serverUtils';
import { Upload, X, AlertTriangle, CheckCircle, Loader, ArrowLeft, Camera, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import FormInput from './FormInput';
import Button from './Button';
import ImageCropper from './ImageCropper';
import { handleImageUpload, processCroppedImage, compressImage } from '../utils/imageUtils';

const ProfileForm = ({ user, setProfileCompleted, isEditing = false, setEditMode }) => {
  const navigate = useNavigate();
  const { updateUser, api, serverStatus } = useContext(AuthContext);
  const [bio, setBio] = useState(user?.bio || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [profileImage, setProfileImage] = useState('');
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageSize, setImageSize] = useState(null);
  const fileInputRef = useRef(null);
  
  // State for image cropping
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);

  useEffect(() => {
    if (isEditing && user) {
      setBio(user.bio || '');
      setAddress(user.address || '');
      setProfession(user.profession || '');
      setImagePreview(user.profileImage || null);
    }
  }, [isEditing, user]);

  const handleCropComplete = async (croppedImage) => {
    const processedImage = await processCroppedImage(
      croppedImage,
      setError,
      setImageSize
    );
    
    if (processedImage) {
      setImagePreview(processedImage);
      setProfileImage(processedImage);
      setShowCropModal(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setOriginalImage(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = (e) => {
    handleImageUpload(
      e.target.files[0],
      setOriginalImage,
      setShowCropModal,
      setError,
      setImageSize
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    // Check if the image is too large before submission
    if (profileImage && profileImage.length > 9 * 1024 * 1024) { // 9MB limit
      setError('Image size is too large. Please select a smaller image or reduce the quality.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (!serverStatus) {
        throw new Error('Server is currently unavailable. Please try again later.');
      }
      
      const profileData = {
        bio,
        address,
        profession
      };
      
      // Only include profile image if it has been changed
      if (profileImage) {
        profileData.profileImage = profileImage;
      }
      
      // Use withRetry to handle connection issues
      const res = await withRetry(() => 
        api.put('/api/profile/me', profileData)
      );
      
      // Update user in context
      updateUser(res.data);
      
      // Show success message
      setSuccess(isEditing ? 'Profile updated successfully!' : 'Profile created successfully!');
      
      // If setProfileCompleted exists, call it
      if (setProfileCompleted) {
        setProfileCompleted(true);
      }
      
      // Only redirect in edit mode automatically
      if (isEditing && setEditMode) {
        setTimeout(() => {
          setEditMode(false);
        }, 2000);
      }
      // No automatic redirect on initial profile creation to give time to see the service listing button
    } catch (err) {
      console.error('Profile update error:', err.response?.data || err.message);
      
      if (err.response?.status === 413) {
        setError('Image is too large to upload. Please select a smaller image or compress it further.');
      } else if (err.message.includes('Network Error') || err.message.includes('not responding')) {
        setError('Could not connect to the server. Please check your internet connection and ensure the server is running.');
      } else {
        setError(err.response?.data?.msg || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (setEditMode) {
      setEditMode(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setProfileImage('');
    setImageSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add function to navigate to create listing page
  const handleCreateListing = () => {
    navigate('/create-listing');
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary-100 to-primary-50 px-6 py-4 flex items-center">
        {isEditing && (
          <button 
            type="button" 
            onClick={handleCancel} 
            className="mr-3 text-primary-700 hover:text-primary-900"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h2 className="text-xl font-bold text-primary-900">
          {isEditing ? 'Edit Your Profile' : 'Complete Your Profile'}
        </h2>
      </div>
      
      <form className="p-6" onSubmit={handleSubmit}>
        {!serverStatus && (
          <div className="mb-6 p-4 rounded-md bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
            <div className="flex">
              <AlertTriangle className="flex-shrink-0 mr-3 h-5 w-5 text-yellow-400" />
              <div>
                <h3 className="font-medium">Server Connection Issues</h3>
                <p className="text-sm mt-1">The server appears to be offline. Your profile data cannot be saved until the server is back online.</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-50 border-l-4 border-red-500 text-red-800">
            <div className="flex">
              <AlertTriangle className="flex-shrink-0 mr-3 h-5 w-5 text-red-500" />
              <div>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 rounded-md bg-green-50 border-l-4 border-green-500 text-green-800">
            <div className="flex">
              <CheckCircle className="flex-shrink-0 mr-3 h-5 w-5 text-green-500" />
              <div>
                <p>{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Profile Image Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Profile Photo</label>
            
            <div className="flex flex-col items-center">
              <div className="mb-4 relative">
                {imagePreview ? (
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border border-neutral-200">
                      <img 
                        src={imagePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <button 
                      type="button" 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm"
                      onClick={handleRemoveImage}
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="w-32 h-32 rounded-full bg-neutral-100 flex items-center justify-center border border-dashed border-neutral-300 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={32} className="text-neutral-400" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center mb-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="hidden"
                  id="profile-image-upload"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Image
                </Button>
              </div>
              
              <p className="text-xs text-neutral-500 text-center mt-1">
                Maximum size: 6MB {imageSize && `(Current: ${imageSize}MB${imageSize > 1 ? ' - will be compressed' : ''})`}
              </p>
            </div>
          </div>
          
          {/* User Basic Info - Read Only */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
              <input 
                type="text" 
                value={user.name} 
                disabled 
                className="w-full px-3 py-2 bg-neutral-50 rounded border border-neutral-200 text-neutral-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                value={user.phoneNumber} 
                disabled 
                className="w-full px-3 py-2 bg-neutral-50 rounded border border-neutral-200 text-neutral-700"
              />
            </div>
          </div>
          
          {/* Bio Section */}
                <div className="mb-6">
                <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-1">
                  Bio <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <textarea 
                  id="bio"
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="Tell us about yourself, your background, and your interests..."
                  className="w-full px-3 py-2 rounded border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[120px]"
                />
                </div>
                
                {/* Address Section */}
                <div className="mb-6">
                  <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-1">
                    city <span className="text-neutral-500 font-normal">(Optional)</span>
                  </label>
                  <textarea 
                    id="address"
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="Your address (city, state, pin code)"
                    className="w-full px-3 py-2 rounded border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[80px]"
                  />
                </div>

                {/* Profession Section */}
                <div className="mb-6">
                  <label htmlFor="profession" className="block text-sm font-medium text-neutral-700 mb-1">
                    Profession <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="profession"
                    type="text" 
                    value={profession} 
                    onChange={e => setProfession(e.target.value)} 
                    placeholder="Enter your profession"
                    className="w-full px-3 py-2 rounded border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <p className="mt-1 text-xs text-neutral-500">Your primary job or occupation</p>
                </div>

                {/* Expertization Section */}
                <div className="mb-6">
                  <label htmlFor="expertization" className="block text-sm font-medium text-neutral-700 mb-1">
                    Expertization <span className="text-neutral-500 font-normal">(Optional)</span>
                  </label>
                  <input 
                    id="expertization"
                    type="text" 
                    placeholder="Areas of expertise"
                    className="w-full px-3 py-2 rounded border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Separate different areas with commas (e.g., "Web Development, Project Management")</p>
                </div>

                {/* Add service listing option after profile is successfully created */}
                {success && !isEditing && (
                  <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="text-green-600 mr-2" size={20} />
                      <h3 className="font-medium text-green-800">Profile Created Successfully!</h3>
                    </div>
                    <p className="text-green-700 mb-4">Would you like to add your business or service to our directory?</p>
                    <Button
                      type="button"
                      onClick={handleCreateListing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      leftIcon={<Briefcase size={16} />}
                      fullWidth
                    >
                      Create Service Listing
                    </Button>
                    <p className="text-sm text-green-600 mt-2 text-center">
                      Share your services with our community
                    </p>
                  </div>
                )}

                {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-8">
            {isEditing && (
              <Button
                type="button"
                variant="subtle"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !serverStatus}
              leftIcon={isSubmitting ? <Loader className="animate-spin" size={16} /> : null}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Profile' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </form>

      {/* Image Crop Modal */}
      {showCropModal && (
        <ImageCropper
          image={originalImage}
          onCancel={handleCropCancel}
          onCrop={handleCropComplete}
          aspectRatio={1}
          cropShape="round"
          title="Crop Profile Image"
        />
      )}
    </Card>
  );
};

export default ProfileForm;