import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  type = 'button',
  className = '',
  fullWidth = false,
  disabled = false,
  loading = false,
  to = null,
  href = null,
  onClick,
  ...props
}) => {
  // CSS classes based on props
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');
  
  // If button is a link to a route
  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        {...props}
      >
        {loading ? <span className="btn-spinner"></span> : null}
        {children}
      </Link>
    );
  }
  
  // If button is an external link
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {loading ? <span className="btn-spinner"></span> : null}
        {children}
      </a>
    );
  }
  
  // Regular button
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? <span className="btn-spinner"></span> : null}
      {children}
    </button>
  );
};

export default Button;
