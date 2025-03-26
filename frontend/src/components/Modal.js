import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal component
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to close the modal
 * @param {ReactNode} children - Modal content
 * @param {string} title - Modal title
 * @param {string} size - Modal size (sm, md, lg, xl, 2xl, full)
 * @param {boolean} closeOnBackdropClick - Whether to close on backdrop click
 * @param {boolean} closeOnEsc - Whether to close on ESC key
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  title = '',
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEsc = true
}) => {
  const modalRef = useRef(null);
  
  useEffect(() => {
    const handleEscKey = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };
    
    // Add event listener for ESC key
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEsc]);
  
  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Don't render anything if modal is not open
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    'full': 'max-w-full mx-4'
  };
  
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} mx-auto overflow-hidden transform transition-all`}
      >
        {title && (
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 id="modal-title" className="text-lg font-semibold text-neutral-900">{title}</h3>
            <button
              type="button"
              className="text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 p-1 rounded-full"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
  
  // Use portal to render modal at the root level
  return createPortal(modalContent, document.body);
};

export default Modal;
