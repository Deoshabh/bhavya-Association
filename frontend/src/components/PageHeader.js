import React from 'react';
import '../styles/PageHeader.css';

/**
 * Reusable page header component for consistent styling across pages
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Main page title
 * @param {string} [props.description] - Optional page description
 * @param {React.ReactNode} [props.actions] - Optional action buttons/content for the header
 * @param {React.ReactNode} [props.icon] - Optional icon to display next to the title
 * @param {string} [props.className] - Optional additional CSS class
 * @returns {React.ReactElement} PageHeader component
 */
const PageHeader = ({ 
  title, 
  description, 
  actions, 
  icon, 
  className = '' 
}) => {
  return (
    <header className={`page-header ${className}`}>
      <div className="page-header-content">
        <div className="header-title-section">
          {icon && <div className="header-icon">{icon}</div>}
          <div className="header-text">
            <h1>{title}</h1>
            {description && <p className="header-description">{description}</p>}
          </div>
        </div>
        
        {actions && (
          <div className="header-actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
