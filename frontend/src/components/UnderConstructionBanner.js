import React from 'react';
import { AlertTriangle } from 'lucide-react';
import '../styles/UnderConstructionBanner.css';

/**
 * A site-wide banner to show that a page is under construction
 * @param {Object} props
 * @param {string} props.message - Custom message to display (optional)
 */
const UnderConstructionBanner = ({ message = "This page is currently under development. Some features may not be fully functional." }) => {
  return (
    <div className="under-construction-banner">
      <div className="under-construction-content">
        <AlertTriangle size={18} className="icon" />
        <p>{message}</p>
      </div>
    </div>
  );
};

export default UnderConstructionBanner;