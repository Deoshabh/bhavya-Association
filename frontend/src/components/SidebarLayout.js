import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
// Remove import for './Sidebar' since it's been deleted
import '../styles/SidebarLayout.css';

const SidebarLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Toggle sidebar open/closed state for mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle sidebar collapsed/expanded state for desktop
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Close sidebar on window resize (e.g., when switching from mobile to desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`sidebar-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Since Sidebar.js is deleted, we'll show a basic sidebar replacement or nothing */}
      <div className="sidebar-container">
        {/* Sidebar content would go here if needed */}
        {/* For now, we'll leave this empty since Sidebar.js was deleted */}
      </div>

      {/* Toggle button for desktop */}
      <button
        className="sidebar-toggle"
        onClick={toggleSidebarCollapse}
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isSidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
      </button>

      {/* Mobile menu toggle */}
      <div className="md:hidden">
        <button
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Main content area */}
      <main className="sidebar-layout-main">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
