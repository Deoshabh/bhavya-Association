import React, { useState } from 'react';
import '../styles/DirectoryDebugConsole.css';

const DirectoryDebugConsole = ({ directoryData, onRefresh }) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [refreshStatus, setRefreshStatus] = useState(null);

  // Basic stats from directory data
  const stats = {
    totalUsers: directoryData?.users?.length || 0,
    premiumUsers: directoryData?.users?.filter(u => u.planType === 'premium').length || 0,
    isAdmin: directoryData?.debug?.isAdmin || false,
    lastRefresh: directoryData?.debug?.lastRefresh || new Date().toISOString(),
    cacheStatus: directoryData?.debug?.cacheStatus || 'unknown',
  };

  // Force refresh with debug flag
  const handleForceRefresh = async () => {
    try {
      setRefreshMessage('Refreshing directory data...');
      setRefreshStatus('loading');
      await onRefresh();
      setRefreshMessage('Directory refreshed successfully!');
      setRefreshStatus('success');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setRefreshMessage('');
        setRefreshStatus(null);
      }, 3000);
    } catch (error) {
      setRefreshMessage('Error refreshing directory: ' + error.message);
      setRefreshStatus('error');
    }
  };

  return (
    <div className="directory-debug-console">
      <div 
        className="debug-header" 
        onClick={() => setDetailsExpanded(!detailsExpanded)}
      >
        <h3>Directory Debug Console</h3>
        <span className="user-count-badge">{stats.totalUsers} users</span>
      </div>
      
      {detailsExpanded && (
        <div className="debug-content">
          <div className="stats-section">
            <h4>Directory Stats</h4>
            <ul>
              <li>Total Users: {stats.totalUsers}</li>
              <li>Premium Users: {stats.premiumUsers}</li>
              <li>Admin Access: {stats.isAdmin ? 'Yes' : 'No'}</li>
              <li>Last Refresh: {new Date(stats.lastRefresh).toLocaleString()}</li>
              <li>Cache Status: {stats.cacheStatus}</li>
            </ul>
          </div>
          
          <div className="filters-section">
            <h4>Current Filters</h4>
            <pre>{JSON.stringify(directoryData?.debug?.filters || {}, null, 2)}</pre>
          </div>
          
          <div className="config-section">
            <h4>Debug Actions</h4>
            <div className="config-controls">
              <button onClick={handleForceRefresh}>
                Force Refresh Directory
              </button>
            </div>
            
            {refreshMessage && (
              <div className={`${refreshStatus === 'success' ? 'success-message' : 'error-message'}`}>
                {refreshMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryDebugConsole;
