import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { withRetry } from '../../utils/serverUtils';
import { Save, RefreshCw, CheckCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

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
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <p className="text-yellow-700 font-medium flex items-center">
            <span className="mr-2">⚠️</span> 
            Server connection issues detected. Settings may not be available.
          </p>
        </div>
      )}
      
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading settings...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchDirectoryConfig} 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-center">
              <CheckCircle size={20} className="text-green-500 mr-3 flex-shrink-0" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}
          
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Directory Settings</h2>
            </div>
            
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <span className="block text-gray-500 mb-1">Total Users</span>
                  <span className="text-2xl font-semibold text-gray-900">{directoryStats.totalUsers}</span>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <span className="block text-gray-500 mb-1">Public Users</span>
                  <span className="text-2xl font-semibold text-gray-900">{directoryStats.publicUsers}</span>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <span className="block text-gray-500 mb-1">Active Users</span>
                  <span className="text-2xl font-semibold text-gray-900">{directoryStats.activeUsers}</span>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <span className="block text-gray-500 mb-1">Directory Eligible</span>
                  <span className="text-2xl font-semibold text-gray-900">{directoryStats.eligibleUsers}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="enforcePublicFilter"
                      type="checkbox"
                      name="enforcePublicFilter"
                      checked={directoryConfig.enforcePublicFilter}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enforcePublicFilter" className="ml-2 block text-sm text-gray-700">
                      Only show users who set their profile as public
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="enforceActiveFilter"
                      type="checkbox"
                      name="enforceActiveFilter"
                      checked={directoryConfig.enforceActiveFilter}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enforceActiveFilter" className="ml-2 block text-sm text-gray-700">
                      Only show users with active account status
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="excludeCurrentUser"
                      type="checkbox"
                      name="excludeCurrentUser"
                      checked={directoryConfig.excludeCurrentUser}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="excludeCurrentUser" className="ml-2 block text-sm text-gray-700">
                      Exclude current user from directory results
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum users to show in directory:
                  </label>
                  <input
                    type="number"
                    id="limit"
                    name="limit"
                    min="1"
                    max="1000"
                    value={directoryConfig.limit}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-32 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button" 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={fetchDirectoryConfig}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Refresh
                  </button>
                  <button 
                    type="submit" 
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={saving}
                  >
                    <Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;
