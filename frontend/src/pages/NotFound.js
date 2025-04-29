import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';
import '../styles/NotFound.css';
import UnderConstructionBanner from '../components/UnderConstructionBanner';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <UnderConstructionBanner message="This page is currently under construction and will be available soon." />
      
      <div className="not-found-content">
        <div className="not-found-icon">
          <AlertTriangle size={64} />
        </div>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        
        <div className="not-found-actions">
          <Link to="/" className="not-found-button home">
            <Home size={18} />
            <span>Go to Home</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="not-found-button back"
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;