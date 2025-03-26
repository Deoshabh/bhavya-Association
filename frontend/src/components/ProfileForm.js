import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { withRetry } from '../utils/serverUtils';

const ProfileForm = ({ user, setProfileCompleted, isEditing = false, setEditMode }) => {
  const { updateUser, api, serverStatus } = useContext(AuthContext);
  const [bio, setBio] = useState(user?.bio || '');
  const [address, setAddress] = useState(user?.address || '');
  const [interests, setInterests] = useState(user?.interests?.join(', ') || '');
  const [profileImage, setProfileImage] = useState('');
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageSize, setImageSize] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize form with user data if editing
  useEffect(() => {
    if (isEditing && user) {
      setBio(user.bio || '');
      setAddress(user.address || '');
      setInterests(user.interests?.join(', ') || '');
      setImagePreview(user.profileImage || null);
    }
  }, [isEditing, user]);

  // Function to compress and resize image
  const compressImage = (imageDataUrl, maxSizeMB = 1) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageDataUrl;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        let quality = 0.7; // starting quality
        
        // Calculate max dimensions for resize if needed
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        // Resize if too large
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try to get the image size under the maxSizeMB
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        
        // Compress with decreasing quality until size is under limit
        const compress = (currentQuality) => {
          if (currentQuality < 0.1) {
            // Can't compress further, return best effort
            return canvas.toDataURL('image/jpeg', 0.1);
          }
          
          const dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          // Estimate size of base64 string (subtract header and calculate actual bytes)
          const base64Size = Math.ceil((dataUrl.length - 22) * 0.75);
          
          if (base64Size <= maxSizeBytes || currentQuality <= 0.1) {
            return dataUrl;
          } else {
            // Try again with lower quality
            return compress(currentQuality - 0.1);
          }
        };
        
        resolve(compress(quality));
      };
      
      img.onerror = () => {
        resolve(imageDataUrl); // Return original if there's an error
      };
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.match('image.*')) {
      setError('Please select an image file (png, jpg, jpeg)');
      return;
    }

    // Get file size in MB
    const fileSizeMB = file.size / (1024 * 1024);
    setImageSize(fileSizeMB.toFixed(2));

    // Show warning for large images
    if (fileSizeMB > 4) {
      setError('Warning: Images larger than 4MB may cause upload issues. Consider using a smaller image.');
    } else {
      setError('');
    }

    // Create a preview of the image
    const reader = new FileReader();
    reader.onload = async (e) => {
      const originalDataUrl = e.target.result;
      
      try {
        // Compress image if it's larger than 1MB
        const processedImage = fileSizeMB > 1 
          ? await compressImage(originalDataUrl)
          : originalDataUrl;
          
        setImagePreview(processedImage);
        setProfileImage(processedImage);
        
        // Estimate new size
        const newSizeMB = (processedImage.length * 0.75) / (1024 * 1024);
        if (newSizeMB > 8) {
          setError('The image is still too large even after compression. Please select a smaller image.');
        }
      } catch (err) {
        setError('Error processing image. Please try a different image.');
      }
    };
    reader.readAsDataURL(file);
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
        interests: interests.split(',').map(i => i.trim()).filter(i => i),
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
      
      // If this is an edit and setEditMode exists, exit edit mode after a short delay
      if (isEditing && setEditMode) {
        setTimeout(() => {
          setEditMode(false);
        }, 2000);
      }
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

  return (
    <form className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6 text-center text-neutral-800">
        {isEditing ? 'Edit Your Profile' : 'Complete Your Profile'}
      </h2>
      
      {!serverStatus && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <h3 className="font-bold text-red-700">Server Connection Issues</h3>
          <p className="text-red-600">The backend server appears to be offline or unreachable. Your profile data cannot be saved until the server is back online.</p>
          <div className="mt-2 p-2 bg-neutral-100 rounded">
            <h4 className="font-medium">Troubleshooting:</h4>
            <ol className="list-decimal pl-5 text-sm">
              <li>Check if the backend server is running</li>
              <li>Run <code className="bg-neutral-200 px-1 rounded">npm run dev</code> in the backend directory</li>
              <li>Make sure your computer is connected to the internet</li>
            </ol>
          </div>
        </div>
      )}
      
      {error && <p className="text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</p>}
      {success && <p className="text-green-600 mb-4 p-3 bg-green-50 rounded">{success}</p>}
      
      <div className="space-y-6">
        <div className="form-group">
          <label className="block text-neutral-700 font-medium mb-2">Profile Photo</label>
          <div className="image-upload-container">
            {imagePreview && (
              <div className="relative w-32 h-32 mb-4">
                <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover rounded-full" />
                <button 
                  type="button" 
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  onClick={handleRemoveImage}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="block w-full text-neutral-700 mt-2"
            />
            <p className="text-sm text-neutral-500 mt-2">
              Upload an image (Max 6MB). {imageSize && `Current image: ${imageSize}MB`}
              {imageSize && imageSize > 1 ? ' - Image will be compressed automatically' : ''}
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="block text-neutral-700 font-medium mb-2">Name</label>
          <input 
            type="text" 
            value={user.name} 
            disabled 
            className="w-full px-4 py-2 bg-neutral-100 rounded border focus:outline-none"
          />
        </div>
        
        {/* Other form fields with similar styling */}
        <div className="form-group">
          <label className="block text-neutral-700 font-medium mb-2">Phone Number</label>
          <input 
            type="tel" 
            value={user.phoneNumber} 
            disabled 
            className="w-full px-4 py-2 bg-neutral-100 rounded border focus:outline-none"
          />
        </div>
        
        <div className="form-group">
          <label className="block text-neutral-700 font-medium mb-2">Bio</label>
          <textarea 
            value={bio} 
            onChange={e => setBio(e.target.value)} 
            placeholder="Tell us about yourself..."
            required 
            className="w-full px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
          />
        </div>
        
        {/* More form fields... */}
        
        <div className="flex justify-end space-x-4 mt-8">
          {isEditing && (
            <button 
              type="button" 
              className="px-6 py-2 bg-neutral-200 hover:bg-neutral-300 rounded transition" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition" 
            disabled={isSubmitting || !serverStatus}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Profile' : 'Save Profile'}
          </button>
        </div>
      </div>
      
      {!serverStatus && (
        <button 
          type="button" 
          className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      )}
    </form>
  );
};

export default ProfileForm;