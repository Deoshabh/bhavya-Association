import React from 'react';
import '../styles/Card.css';

const Card = ({ 
  title, 
  children, 
  footer,
  className = '',
  fullWidth = false,
  noPadding = false
}) => {
  return (
    <div className={`card ${className} ${fullWidth ? 'card-full-width' : ''}`}>
      {title && (
        <div className="card-header">
          {typeof title === 'string' ? <h2 className="card-title">{title}</h2> : title}
        </div>
      )}
      
      <div className={`card-body ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
