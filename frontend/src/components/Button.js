import React from 'react';

/**
 * Button component 
 * 
 * @param {ReactNode} children - Button content
 * @param {string} variant - Button style (primary, secondary, outline, etc)
 * @param {string} size - Button size (sm, md, lg)
 * @param {boolean} isLoading - Whether button is in loading state
 * @param {boolean} fullWidth - Make button take full width
 * @param {string} className - Additional CSS classes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  fullWidth = false,
  disabled = false,
  className = '',
  leftIcon = null,
  rightIcon = null,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white',
    accent: 'bg-accent hover:bg-accent-hover text-white',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50',
    subtle: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  };
  
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded',
    md: 'text-sm px-4 py-2 rounded',
    lg: 'text-base px-6 py-3 rounded-md',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const loadingClass = isLoading ? 'relative text-transparent' : '';
  
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center font-medium transition-all
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-opacity-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${loadingClass}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
      
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
    </button>
  );
};

export default Button;
