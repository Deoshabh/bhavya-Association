import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import '../styles/SidebarLayout.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SidebarLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const collapseTimerRef = useRef(null);
  
  // Function to start collapse timer
  const startCollapseTimer = () => {
    // Clear any existing timer
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
    
    // Set a new timer to collapse the sidebar after 4 seconds
    collapseTimerRef.current = setTimeout(() => {
      if (!isHovering) {
        setIsCollapsed(true);
      }
    }, 4000);
  };
  
  // Reset timer when component mounts or when user interacts
  useEffect(() => {
    startCollapseTimer();
    
    // Clean up timer when component unmounts
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, );

  // Handle mouse enter event
  const handleMouseEnter = () => {
    setIsHovering(true);
    setIsCollapsed(false);
    
    // Clear any existing timer
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
  };
  
  // Handle mouse leave event
  const handleMouseLeave = () => {
    setIsHovering(false);
    startCollapseTimer();
  };
  
  // Toggle sidebar collapse state manually
  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
    
    if (isCollapsed) {
      // Reset timer when manually expanding
      startCollapseTimer();
    } else {
      // Clear timer when manually collapsing
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    }
  };

  return (
    <div className={`sidebar-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div 
        className="sidebar-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Sidebar isCollapsed={isCollapsed} />
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <main className="sidebar-layout-main">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
