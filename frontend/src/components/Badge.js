import React from 'react';

/**
 * Badge component for displaying status indicators and labels
 * 
 * @param {ReactNode} children - Content to display inside the badge
 * @param {string} variant - Color variant (primary, secondary, success, etc.)
 * @param {string} size - Size of the badge (sm, md, lg)
 * @param {boolean} outline - Whether to display an outlined style
 * @param {boolean} pill - Whether to display with full rounded corners
 * @param {string} className - Additional CSS classes
 */
const Badge = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  outline = false,
  pill = true,
  className = '',
  ...props 
}) => {
  const variantClasses = {
    primary: outline 
      ? 'border border-primary-500 text-primary-600 bg-transparent' 
      : 'bg-primary-100 text-primary-800',
    secondary: outline 
      ? 'border border-secondary-500 text-secondary-600 bg-transparent' 
      : 'bg-secondary-100 text-secondary-800',
    success: outline 
      ? 'border border-green-500 text-green-600 bg-transparent' 
      : 'bg-green-100 text-green-800',
    warning: outline 
      ? 'border border-yellow-500 text-yellow-600 bg-transparent' 
      : 'bg-yellow-100 text-yellow-800',
    danger: outline 
      ? 'border border-red-500 text-red-600 bg-transparent' 
      : 'bg-red-100 text-red-800',
    info: outline 
      ? 'border border-blue-500 text-blue-600 bg-transparent' 
      : 'bg-blue-100 text-blue-800',
    neutral: outline 
      ? 'border border-neutral-500 text-neutral-600 bg-transparent' 
      : 'bg-neutral-100 text-neutral-800'
  };
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1'
  };
  
  const radiusClass = pill ? 'rounded-full' : 'rounded';
  
  return (
    <span 
      className={`inline-flex items-center font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${radiusClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
