import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { withRetry } from '../../utils/serverUtils';
import { Save, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/Admin/AdminLayout';
import '../../styles/Admin/AdminSettings.css';

const AdminSettings = () => {
  const { api, user, serverStatus } = useContext(AuthContext);
  
  // State for directory settings
  const [directoryConfig, setDirectoryConfig] = useState({
    enforcePublicFilter: true,
    enforceActiveFilter: true,
    excludeCurrentUser: true,
    limit: 100
  });
  
  const [directoryStats, setDirectoryStats] = useState({
    totalUsers: 0,
    publicUsers: 0,
    activeUsers: 0,
    eligibleUsers: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check if user is admin
  const isAdmin = user && user.planType === 'admin';
  
  // Fetch directory configuration
  const fetchDirectoryConfig = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await withRetry(
        () => api.get('/api/directory/config'),
        2,
        'admin-directory-config'
      );
      
      if (response.data) {
        setDirectoryConfig(response.data.config || {});
        setDirectoryStats(response.data.counts || {});
      }
    } catch (err) {
      console.error('Failed to fetch directory configuration:', err);
      setError('Failed to load directory configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Save directory configuration
  const saveDirectoryConfig = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      const response = await withRetry(
        () => api.put('/api/directory/config', directoryConfig),
        2,
        'admin-save-directory-config'
      );
      
      if (response.data) {
        setSuccessMessage('Directory settings saved successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to save directory configuration:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDirectoryConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    saveDirectoryConfig();
  };
  
  // Initial fetch
  useEffect(() => {
    fetchDirectoryConfig();
  }, [isAdmin]);
  
  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return (
    <AdminLayout title="Settings" currentPage="settings">
      {!serverStatus && (
        <div className="server-warning">
          <p>⚠️ Server connection issues detected. Settings may not be available.</p>
        </div>
      )}
      
      {loading ? (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={fetchDirectoryConfig} className="retry-button">
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      ) : (
        <div className="admin-settings-content">
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          
          <section className="settings-section">
            <h2>Directory Settings</h2>
            
            <div className="directory-stats">
              <div className="stat-item">
                <span className="stat-label">Total Users:</span>
                <span className="stat-value">{directoryStats.totalUsers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Public Users:</span>
                <span className="stat-value">{directoryStats.publicUsers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Users:</span>
                <span className="stat-value">{directoryStats.activeUsers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Directory Eligible:</span>
                <span className="stat-value">{directoryStats.eligibleUsers}</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="settings-form">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="enforcePublicFilter"
                    checked={directoryConfig.enforcePublicFilter}
                    onChange={handleChange}
                  />
                  Only show users who set their profile as public
                </label>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="enforceActiveFilter"
                    checked={directoryConfig.enforceActiveFilter}
                    onChange={handleChange}
                  />
                  Only show users with active account status
                </label>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="excludeCurrentUser"
                    checked={directoryConfig.excludeCurrentUser}
                    onChange={handleChange}
                  />
                  Exclude current user from directory results
                </label>
              </div>
              
              <div className="form-group">
                <label htmlFor="limit">Maximum users to show in directory:</label>
                <input
                  type="number"
                  id="limit"
                  name="limit"
                  min="1"
                  max="1000"
                  value={directoryConfig.limit}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="refresh-button"
                  onClick={fetchDirectoryConfig}
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={saving}
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;
