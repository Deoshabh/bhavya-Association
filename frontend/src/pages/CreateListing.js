import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import '../styles/CreateListing.css';

const CreateListing = () => {
  const navigate = useNavigate();
  const { api, serverStatus } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageSize, setImageSize] = useState(null);
  
  // Common categories for the dropdown
  const categories = [
    'Plumber',
    'Electrician',
    'Carpenter',
    'Painter',
    'Cleaning Service',
    'Tutor',
    'Catering',
    'Photographer',
    'Driver',
    'Gardener',
    'IT Support',
    'Other'
  ];
  
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
          // Estimate size of base64 string
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
  
  // Handle image upload
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
      setError('Warning: Images larger than 4MB may cause upload issues. The image will be compressed.');
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
        setImage(processedImage);
        
        // Estimate new size
        const newSizeMB = (processedImage.length * 0.75) / (1024 * 1024);
        if (newSizeMB > 6) {
          setError('The image is too large even after compression. Please select a smaller image.');
        }
      } catch (err) {
        setError('Error processing image. Please try a different image.');
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Remove uploaded image
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImage('');
    setImageSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validate form
    if (!title || !category || !description || !contactPhone) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    
    // Validate image size
    if (image && image.length > 8 * 1024 * 1024) { // 8MB limit
      setError('Image is too large. Please select a smaller image or compress it further.');
      setLoading(false);
      return;
    }
    
    if (!serverStatus) {
      setError('Server is currently unavailable. Please try again later.');
      setLoading(false);
      return;
    }
    
    try {
      // Prepare listing data
      const listingData = {
        title,
        category,
        description,
        contactPhone,
        contactEmail
      };
      
      // Only include image if provided
      if (image) {
        listingData.image = image;
      }
      
      // Submit to API
      await api.post('/api/listings', listingData);
      
      // Success
      setSuccess('Service listing created successfully!');
      
      // Reset form after success
      setTimeout(() => {
        navigate('/service-listings');
      }, 2000);
    } catch (err) {
      console.error('Error creating listing:', err);
      
      if (err.response?.status === 413) {
        setError('Data is too large to upload. Please reduce the image size.');
      } else if (err.message.includes('Network Error')) {
        setError('Could not connect to the server. Please check your internet connection.');
      } else {
        setError(err.response?.data?.msg || 'Failed to create listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel and go back to listings
  const handleCancel = () => {
    navigate('/service-listings');
  };
  
  return (
    <div className="create-listing-page">
      <div className="create-listing-container">
        <div className="create-listing-header">
          <BackButton />
          <h1>Add New Service Listing</h1>
        </div>
        
        {!serverStatus && (
          <div className="server-warning">
            <p>⚠️ Server connection issues detected. You may not be able to create a listing right now.</p>
          </div>
        )}
        
        <form className="listing-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="title">Service Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Professional Plumbing Services"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Service Category *</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {category === 'Other' && (
              <input
                type="text"
                placeholder="Please specify category"
                className="other-category"
                onChange={(e) => setCategory(e.target.value === 'Other' ? '' : e.target.value)}
              />
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Service Description *</label>
            <textarea
              id="description"
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your services in detail..."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="image">Service Image</label>
            <div className="image-upload-container">
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Service preview" />
                  <button 
                    type="button" 
                    className="remove-image" 
                    onClick={handleRemoveImage}
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
              />
              <p className="image-hint">
                Upload an image for your service (Max 6MB). {imageSize && `Current size: ${imageSize}MB`}
                {imageSize && imageSize > 1 ? ' - Image will be compressed automatically' : ''}
              </p>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="contactPhone">Contact Phone *</label>
            <input
              type="tel"
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Your contact phone number"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="contactEmail">Contact Email</label>
            <input
              type="email"
              id="contactEmail"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Your contact email (optional)"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !serverStatus}
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
