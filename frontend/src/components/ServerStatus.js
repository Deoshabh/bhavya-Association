import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { checkServerStatus as checkServerApi } from '../utils/serverUtils';
import '../styles/ServerStatus.css';

const ServerStatus = () => {
  // Get serverStatus from context but manage setting it locally
  const { serverStatus: contextServerStatus, setServerStatus: contextSetServerStatus } = useContext(AuthContext);
  const [localServerStatus, setLocalServerStatus] = useState(true);
  
  // Use either context status (if context has proper setter) or local status
  const serverStatus = typeof contextSetServerStatus === 'function' ? contextServerStatus : localServerStatus;
  
  useEffect(() => {
    let intervalId;
    
    // Function to check server status
    const checkStatus = async () => {
      try {
        const isUp = await checkServerApi();
        
        // Update local state
        setLocalServerStatus(isUp);
        
        // Also update context if possible
        if (typeof contextSetServerStatus === 'function') {
          contextSetServerStatus(isUp);
        }
      } catch (err) {
        console.warn('Server health check failed:', err.message);
        setLocalServerStatus(false);
        
        // Also update context if possible
        if (typeof contextSetServerStatus === 'function') {
          contextSetServerStatus(false);
        }
      }
    };
    
    // Check immediately on component mount
    checkStatus();
    
    // Then check every 30 seconds
    intervalId = setInterval(checkStatus, 30000);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [contextSetServerStatus]);
  
  // Only render the offline notification when the server is detected as offline
  if (serverStatus !== false) {
    return null;
  }
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  return (
    <div className="server-status-offline">
      <div className="server-status-content">
        <div className="server-status-icon">
          <span className="status-indicator"></span>
        </div>
        <p>Server connection issues detected. Some features may be unavailable.</p>
        <button className="refresh-button" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default ServerStatus;
