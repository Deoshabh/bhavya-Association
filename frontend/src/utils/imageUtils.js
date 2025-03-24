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
