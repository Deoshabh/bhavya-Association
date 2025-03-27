/**
 * Compresses and resizes an image
 * @param {string} imageDataUrl - The data URL of the image
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {Promise<string>} - Compressed image data URL
 */
export const compressImage = (imageDataUrl, maxSizeMB = 1) => {
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

/**
 * Estimates the size of a data URL in MB
 * @param {string} dataUrl 
 * @returns {number} - Size in MB
 */
export const getDataUrlSizeInMB = (dataUrl) => {
  if (!dataUrl) return 0;
  // Base64 strings use approximately 4 characters per 3 bytes
  const base64Length = dataUrl.includes('base64,') 
    ? dataUrl.split(',')[1].length 
    : dataUrl.length;
  const sizeInBytes = Math.ceil(base64Length * 0.75);
  return sizeInBytes / (1024 * 1024);
};

/**
 * Handles the image upload workflow including cropping and compression
 * @param {File} file - The image file to process
 * @param {Function} setOriginalImage - Function to set the original image for cropping
 * @param {Function} setShowCropModal - Function to control crop modal visibility
 * @param {Function} setError - Function to set error message
 * @param {Function} setImageSize - Function to set image size display
 * @returns {boolean} - Whether the process was initiated successfully
 */
export const handleImageUpload = (file, setOriginalImage, setShowCropModal, setError, setImageSize) => {
  if (!file) return false;

  // Validate file is an image
  if (!file.type.match('image.*')) {
    setError('Please select an image file (png, jpg, jpeg)');
    return false;
  }

  // Get file size in MB
  const fileSizeMB = file.size / (1024 * 1024);
  if (setImageSize) {
    setImageSize(fileSizeMB.toFixed(2));
  }

  // Show warning for large images
  if (fileSizeMB > 4 && setError) {
    setError('Warning: Images larger than 4MB may cause upload issues. The image will be compressed.');
  } else if (setError) {
    setError('');
  }

  // Create a preview of the image and show cropper
  const reader = new FileReader();
  reader.onload = (e) => {
    const originalDataUrl = e.target.result;
    
    // Store original image and show crop modal
    setOriginalImage(originalDataUrl);
    setShowCropModal(true);
  };
  reader.readAsDataURL(file);
  return true;
};

/**
 * Process a cropped image by compressing if needed
 * @param {string} croppedImage - Cropped image data URL
 * @param {Function} setError - Function to set error message
 * @param {Function} setImageSize - Function to set image size
 * @param {number} maxSizeMB - Maximum allowed size in MB
 * @returns {Promise<string>} - Processed image data URL
 */
export const processCroppedImage = async (croppedImage, setError, setImageSize, maxSizeMB = 8) => {
  // Get file size of cropped image
  const base64Size = Math.ceil((croppedImage.length - 22) * 0.75);
  const fileSizeMB = base64Size / (1024 * 1024);
  
  if (setImageSize) {
    setImageSize(fileSizeMB.toFixed(2));
  }
  
  // Apply compression if needed
  const processedImage = fileSizeMB > 1 
    ? await compressImage(croppedImage)
    : croppedImage;
  
  // Estimate new size after compression
  const newSizeMB = (processedImage.length * 0.75) / (1024 * 1024);
  if (newSizeMB > maxSizeMB && setError) {
    setError(`The image is still too large even after compression. Please select a smaller image. Maximum size: ${maxSizeMB}MB`);
    return null;
  } else if (setError) {
    setError('');
  }
  
  return processedImage;
};
