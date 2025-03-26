import React from 'react';

/**
 * ThemedComponent that applies consistent styling based on theme and variant
 * 
 * @param {ReactNode} children - Component content
 * @param {string} theme - Theme name (light, dark) 
 * @param {string} variant - Variant name (primary, secondary, etc)
 * @param {string} size - Component size (sm, md, lg)
 * @param {string} className - Additional CSS classes
 * @param {string} as - Component to render as (div, section, article, etc)
 */
const ThemedComponent = ({
  children,
  theme = 'light',
  variant = 'primary',
  size = 'md',
  className = '',
  as: Component = 'div',
  ...props
}) => {
  // Theme styles
  const themeClasses = {
    light: {
      primary: 'bg-white text-neutral-800 border border-neutral-200',
      secondary: 'bg-neutral-50 text-neutral-800 border border-neutral-200',
      accent: 'bg-primary-50 text-primary-900 border border-primary-100',
      info: 'bg-blue-50 text-blue-900 border border-blue-100',
      success: 'bg-green-50 text-green-900 border border-green-100',
      warning: 'bg-yellow-50 text-yellow-900 border border-yellow-100',
      danger: 'bg-red-50 text-red-900 border border-red-100',
    },
    dark: {
      primary: 'bg-neutral-800 text-white border border-neutral-700',
      secondary: 'bg-neutral-700 text-white border border-neutral-600',
      accent: 'bg-primary-900 text-white border border-primary-800',
      info: 'bg-blue-900 text-white border border-blue-800',
      success: 'bg-green-900 text-white border border-green-800',
      warning: 'bg-yellow-900 text-white border border-yellow-800',
      danger: 'bg-red-900 text-white border border-red-800',
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'p-2 text-sm rounded',
    md: 'p-4 text-base rounded-md',
    lg: 'p-6 text-lg rounded-lg',
  };
  
  // Combine classes based on theme, variant, and size
  const combinedClasses = `
    ${themeClasses[theme][variant]} 
    ${sizeClasses[size]}
    ${className}
  `;
  
  return (
    <Component className={combinedClasses} {...props}>
      {children}
    </Component>
  );
};

export default ThemedComponent;
