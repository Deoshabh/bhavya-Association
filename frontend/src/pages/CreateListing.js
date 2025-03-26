import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, Upload, X, AlertTriangle, CheckCircle, Camera, Loader } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Alert from '../components/Alert';

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
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-neutral-800">Add New Service Listing</h1>
      </div>
      
      {/* Server status warning */}
      {!serverStatus && (
        <Alert 
          variant="warning" 
          className="mb-6"
          title="Connection Issues"
          dismissible={false}
        >
          Server connection issues detected. You may not be able to create a listing right now.
        </Alert>
      )}
      
      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            {/* Error and success messages */}
            {error && (
              <Alert 
                variant="error" 
                className="mb-6"
                onDismiss={() => setError('')}
                dismissible
              >
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert 
                variant="success" 
                className="mb-6"
                onDismiss={() => setSuccess('')}
                dismissible
              >
                {success}
              </Alert>
            )}
            
            <div className="space-y-6">
              {/* Basic Info Section */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Service Title"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Professional Plumbing Services"
                    required
                  />
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="category">
                      Service Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                        className="mt-3 block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        onChange={(e) => setCategory(e.target.value === 'Other' ? '' : e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Description Section */}
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="description">
                  Service Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows="5"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your services in detail..."
                  className="block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              {/* Image Upload Section */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Service Image</h2>
                
                <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                  {imagePreview ? (
                    <div className="relative mb-4">
                      <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-neutral-100">
                        <img 
                          src={imagePreview} 
                          alt="Service preview" 
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <button 
                        type="button" 
                        className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full shadow-sm border border-neutral-200"
                        onClick={handleRemoveImage}
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer bg-white hover:bg-neutral-50 transition-colors text-center mb-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={36} className="text-neutral-400 mb-2" />
                      <p className="text-neutral-800 font-medium mb-1">Click to upload an image</p>
                      <p className="text-neutral-500 text-sm">Recommended size: 1200 x 800px</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => fileInputRef.current?.click()}
                        leftIcon={<Upload size={16} />}
                      >
                        {imagePreview ? 'Change Image' : 'Upload Image'}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-neutral-500 text-center mt-3">
                      Maximum size: 6MB {imageSize && `(Current: ${imageSize}MB${imageSize > 1 ? ' - will be compressed' : ''})`}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Contact Section */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Contact Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Contact Phone"
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Your contact phone number"
                    required
                  />
                  
                  <FormInput
                    label="Contact Email (Optional)"
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Your contact email"
                  />
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 mt-8">
                <Button
                  type="button"
                  variant="subtle"
                  onClick={() => navigate('/service-listings')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !serverStatus}
                  isLoading={loading}
                >
                  {loading ? 'Creating...' : 'Create Listing'}
                </Button>
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateListing;
