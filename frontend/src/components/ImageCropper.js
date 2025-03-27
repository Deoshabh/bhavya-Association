import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut } from 'lucide-react';
import Button from './Button';

/**
 * A reusable image cropper component
 * 
 * @param {Object} props - Component props
 * @param {string} props.image - Base64 or URL of the image to crop
 * @param {Function} props.onCancel - Function to call when cancel is clicked
 * @param {Function} props.onCrop - Function to call with the cropped image when confirmed
 * @param {number} props.aspectRatio - Aspect ratio for the crop (width/height)
 * @param {string} props.cropShape - Shape of crop area ('rect' or 'round')
 * @param {string} props.title - Title for the modal
 */
const ImageCropper = ({ 
  image, 
  onCancel, 
  onCrop, 
  aspectRatio = 1, 
  cropShape = 'rect',
  title = 'Crop Image'
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImage = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    
    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to cropped area size
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        
        // Draw the cropped image onto the canvas
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        
        // Convert canvas to data URL
        resolve(canvas.toDataURL('image/jpeg'));
      };
    });
  };

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const croppedImage = await getCroppedImage(image, croppedAreaPixels);
      onCrop(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        
        <div className="relative h-80">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={cropShape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-center mb-4">
            <button 
              type="button"
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 mr-4"
              onClick={() => setZoom(Math.max(1, zoom - 0.1))}
            >
              <ZoomOut size={20} />
            </button>
            
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-40 mx-4"
            />
            
            <button
              type="button"
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 ml-4"
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            >
              <ZoomIn size={20} />
            </button>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="subtle"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCropConfirm}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
