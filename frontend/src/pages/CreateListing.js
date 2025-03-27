import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, Upload, X, AlertTriangle, CheckCircle, Camera, Loader } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Alert from '../components/Alert';
import ImageCropper from '../components/ImageCropper';
import { handleImageUpload, processCroppedImage } from '../utils/imageUtils';

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
  
  // New state for image cropping
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  
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
  
  // Handle image upload
  const handleImageChange = (e) => {
    handleImageUpload(
      e.target.files[0],
      setOriginalImage,
      setShowCropModal,
      setError,
      setImageSize
    );
  };
  
  const handleCropComplete = async (croppedImage) => {
    const processedImage = await processCroppedImage(
      croppedImage,
      setError,
      setImageSize,
      6 // 6MB limit for listing images
    );
    
    if (processedImage) {
      setImagePreview(processedImage);
      setImage(processedImage);
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
      
      {/* Image Crop Modal */}
      {showCropModal && (
        <ImageCropper
          image={originalImage}
          onCancel={handleCropCancel}
          onCrop={handleCropComplete}
          aspectRatio={16/9}
          cropShape="rect"
          title="Crop Service Image"
        />
      )}
    </div>
  );
};

export default CreateListing;
