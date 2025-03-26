import React from 'react';
import '../styles/Card.css';

/**
 * Card component for containing content in a visually distinct container
 * 
 * @param {ReactNode} children - Card content
 * @param {ReactNode} header - Optional card header content
 * @param {ReactNode} footer - Optional card footer content
 * @param {boolean} hover - Whether to show hover effects
 * @param {boolean} noPadding - Whether to remove default padding
 * @param {string} className - Additional CSS classes
 */
const Card = ({
  children,
  header,
  footer,
  hover = false,
  noPadding = false,
  className = '',
  ...props
}) => {
  const hoverClass = hover ? 'hover:shadow-md hover:-translate-y-1 transition-all duration-300' : '';
  const paddingClass = noPadding ? '' : 'p-6';
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${hoverClass} ${className}`}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-neutral-200">
          {header}
        </div>
      )}
      
      <div className={paddingClass}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
          {footer}
        </div>
      )}
    </div>
  );
};

// Additional export for card subcomponents
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-b border-neutral-200 ${className}`} {...props}>
    {children}
  </div>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 bg-neutral-50 border-t border-neutral-200 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
