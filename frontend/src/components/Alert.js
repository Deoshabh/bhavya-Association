import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Alert component for displaying notifications and messages
 * 
 * @param {ReactNode} children - Alert content
 * @param {string} variant - Alert style (info, success, warning, error)
 * @param {boolean} dismissible - Whether alert can be dismissed
 * @param {function} onDismiss - Function to call when alert is dismissed
 * @param {string} title - Optional alert title
 * @param {string} className - Additional CSS classes
 */
const Alert = ({
  children,
  variant = 'info',
  dismissible = false,
  onDismiss,
  title,
  className = '',
  ...props
}) => {
  // Variant styles configuration
  const variantConfig = {
    info: {
      containerClass: 'bg-blue-50 border-blue-200 text-blue-800',
      iconClass: 'text-blue-500',
      icon: <Info size={20} />
    },
    success: {
      containerClass: 'bg-green-50 border-green-200 text-green-800',
      iconClass: 'text-green-500',
      icon: <CheckCircle size={20} />
    },
    warning: {
      containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconClass: 'text-yellow-500',
      icon: <AlertTriangle size={20} />
    },
    error: {
      containerClass: 'bg-red-50 border-red-200 text-red-800',
      iconClass: 'text-red-500',
      icon: <AlertCircle size={20} />
    }
  };
  
  // Get configuration for the selected variant
  const config = variantConfig[variant] || variantConfig.info;
  
  return (
    <div 
      className={`rounded-md border p-4 ${config.containerClass} ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 mr-3 ${config.iconClass}`}>
          {config.icon}
        </div>
        <div className="flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button 
            type="button"
            className="flex-shrink-0 ml-3 -mt-1 -mr-1 rounded-md text-opacity-80 hover:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
