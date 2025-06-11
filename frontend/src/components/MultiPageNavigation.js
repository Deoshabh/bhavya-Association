/**
 * Multi-Page App Navigation Component
 * Replaces React Router navigation with traditional page navigation
 */
import React from 'react';
import { navigateToPage, clearRouteAndRedirect } from '../utils/routeUtils';

const MultiPageNavigation = () => {
  const handleNavigate = (url, clearCache = false) => {
    if (clearCache) {
      clearRouteAndRedirect(url);
    } else {
      navigateToPage(url);
    }
  };

  // Get current page to highlight active nav
  const currentPath = window.location.pathname;

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Login', path: '/login' },
    { label: 'Register', path: '/register' },
    { label: 'Profile', path: '/profile' },
    { label: 'Directory', path: '/directory' },
    { label: 'Services', path: '/service-listings' },
  ];

  return (
    <nav className="multi-page-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
        >
          {item.label}
        </button>
      ))}
      
      {/* Cache clear navigation button */}
      <button
        onClick={() => handleNavigate(currentPath, true)}
        className="nav-item cache-clear"
        title="Reload current page with cache clear"
      >
        🔄 Refresh
      </button>
    </nav>
  );
};

export default MultiPageNavigation;
