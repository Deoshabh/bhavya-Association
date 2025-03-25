import React, { useState, useEffect, useContext, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getCachedDirectory } from '../utils/serverUtils';
import useAuthenticatedRequest from '../hooks/useAuthenticatedRequest';
import UserCard from '../components/UserCard';
import DirectoryDebugConsole from '../components/DirectoryDebugConsole';
import PremiumBanner from '../components/PremiumBanner';
import PageHeader from '../components/PageHeader';
import { Search, RefreshCw, Filter, ChevronDown, Users, X } from 'lucide-react';
import '../styles/Directory.css';
import api from '../services/api';

const DirectoryDiagnostic = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const runDiagnostic = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/directory/debug');
      setDebugInfo(response.data);
    } catch (err) {
      console.error('Directory diagnostic error:', err);
      setError(err.message || 'Error running directory diagnostic');
    } finally {
      setLoading(false);
    }
  };
  
  if (!debugInfo && !loading && !error) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
        <p className="text-yellow-700">No users showing in the directory?</p>
        <button 
          onClick={runDiagnostic}
          className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded"
        >
          Run Diagnostic
        </button>
      </div>
    );
  }
  
  if (loading) {
    return <div className="p-4 bg-gray-100">Running diagnostic...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
        <p className="text-red-700">Error: {error}</p>
        <button 
          onClick={runDiagnostic}
          className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
      <h3 className="font-bold text-blue-700">Directory Diagnostic Results</h3>
      <p>Total users: {debugInfo.counts.total}</p>
      <p>Visible users: {debugInfo.counts.visible} ({debugInfo.counts.percentage}%)</p>
      
      {debugInfo.counts.visible === 0 && (
        <div className="mt-2 p-2 bg-red-100 rounded">
          <p className="text-red-700 font-semibold">No users are currently visible in the directory!</p>
          <p className="text-sm mt-1">
            To fix this issue, run the directory fixer script on the server:
            <br />
            <code className="bg-gray-200 px-1 py-0.5 rounded">node scripts/fix-directory-users.js</code>
          </p>
        </div>
      )}
      
      {debugInfo.sample.length > 0 && (
        <div className="mt-2">
          <p className="font-medium">Sample visible users:</p>
          <ul className="list-disc pl-5">
            {debugInfo.sample.map((user, i) => (
              <li key={i}>{user.name} ({user.phone}...)</li>
            ))}
          </ul>
        </div>
      )}
      
      <button 
        onClick={() => setDebugInfo(null)}
        className="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-4 rounded"
      >
        Hide Diagnostic
      </button>
    </div>
  );
};

const Directory = () => {
  const { api, serverStatus, user: currentUser, token } = useContext(AuthContext);
  const { authRequest } = useAuthenticatedRequest();

  // State declarations
  const [directoryData, setDirectoryData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planStatus, setPlanStatus] = useState('free');
  const [authRequired, setAuthRequired] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({ occupation: '' });
  const [showDebug] = useState(false);

  // Refs
  const fetchInProgress = useRef(false);
  const searchInputRef = useRef(null);

  // Fetch directory data with retry and caching
  const fetchDirectory = React.useCallback(
    async (forceRefresh = false) => {
      if (fetchInProgress.current && !forceRefresh) {
        console.log('Directory fetch already in progress, skipping duplicate request');
        return;
      }

      if (!token) {
        console.log('No auth token available, redirecting to login');
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (!serverStatus) {
        setError('Server appears to be offline. Please try again later.');
        setLoading(false);
        return;
      }

      try {
        fetchInProgress.current = true;
        setLoading(true);
        console.log('Fetching directory data with token:', token.substring(0, 10) + '...');

        // Ensure token is set in the authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Direct API call without caching to troubleshoot
        const res = await api.get('/api/directory');
        
        console.log('Directory API response:', {
          status: res.status,
          isArray: Array.isArray(res.data),
          dataLength: Array.isArray(res.data) ? res.data.length : 'not array',
          data: res.data
        });

        if (res && res.data) {
          if (Array.isArray(res.data)) {
            // Handle case where response is directly an array of users
            setDirectoryData({ users: res.data });
            setUsers(res.data);
            setPlanStatus(currentUser?.planType || 'free');
          } else {
            // Handle case where response is an object with users property
            setDirectoryData(res.data);
            setUsers(res.data.users || []);
            setPlanStatus(res.data.userPlan || currentUser?.planType || 'free');
          }
          setError('');
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Failed to fetch directory:', err);
        if (err.response?.status === 401) {
          console.log('Authentication error accessing directory');
          setAuthRequired(true);
        } else {
          setError(`Failed to load directory: ${err.message || 'Unknown error'}. Please try again later.`);
        }
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    },
    [api, serverStatus, token, currentUser]
  );

  // Handle manual refresh
  const handleRefresh = () => fetchDirectory(true);

  // Search handler
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsSearching(!!term);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Apply search and filters
  useEffect(() => {
    // ... existing search/filter logic ...
    if (!users.length) {
      setSearchResults([]);
      return;
    }

    const filtered = users.filter((user) => {
      // Search term filter
      if (
        searchTerm &&
        !user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.occupation.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.interests?.some((interest) =>
          interest.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        return false;
      }
      // Occupation filter
      if (filters.occupation && user.occupation !== filters.occupation) {
        return false;
      }
      return true;
    });

    setSearchResults(filtered);
  }, [users, searchTerm, filters]);

  // Initial fetch
  useEffect(() => {
    if (token) fetchDirectory();
    else {
      setAuthRequired(true);
      setLoading(false);
    }
  }, [fetchDirectory, token]);

  // Redirect if authentication required
  if (authRequired) return <Navigate to="/login" />;

  // Unique occupations for filter
  const occupations = [...new Set(users.map((user) => user.occupation))].sort();

  // Create the refresh action button for the header
  const refreshAction = (
    <button 
      className="refresh-button" 
      onClick={handleRefresh} 
      disabled={loading}
    >
      <RefreshCw size={14} className={loading ? "spin" : ""} />
      <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
    </button>
  );

  return (
    <div className="directory-container">
      <PageHeader
        title="Member Directory"
        description={`Connect with ${users.length} members of our community`}
        actions={refreshAction}
        icon={<Users size={24} />}
      />

      {!serverStatus && (
        <div className="server-warning">
          <p>⚠️ Server connection issues detected. Directory data may not be available.</p>
        </div>
      )}

      {/* Premium Banner - only show when needed */}
      {planStatus === 'free' && (
        <PremiumBanner 
          planStatus={planStatus} 
          searchContext={searchTerm || filters.occupation ? searchTerm || filters.occupation : ''}
        />
      )}

      {/* Improved Search and Filter Section */}
      <div className="directory-toolbar">
        <div className="search-filter-container">
          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search members by name, occupation, or interests..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
              aria-label="Search members"
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={clearSearch} 
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="filter-dropdown">
            <div className="dropdown-label">
              <Filter size={16} />
              <span>Filter Occupations</span>
            </div>
            <select
              value={filters.occupation}
              onChange={(e) => setFilters({ ...filters, occupation: e.target.value })}
              aria-label="Filter by occupation"
            >
              <option value="">All Occupations</option>
              {occupations.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
            <ChevronDown className="dropdown-icon" size={14} />
          </div>
        </div>
      </div>

      {isSearching && (
        <div className="search-results-count">
          <span>{searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found</span>
        </div>
      )}

      {/* Debug Console - only shown when expanded */}
      {showDebug && process.env.NODE_ENV !== 'production' && !loading && !error && (
        <DirectoryDebugConsole
          directoryData={{ users: searchResults, debug: directoryData?.debug }}
          onRefresh={handleRefresh}
        />
      )}

      {/* Loading, Error, and Results States */}
      {loading ? (
        <div className="directory-loading">
          <div className="loading-spinner"></div>
          <p>Loading directory...</p>
        </div>
      ) : error ? (
        <div className="directory-error">
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">Try Again</button>
        </div>
      ) : (
        <>
          {users.length === 0 && (
            <div className="directory-empty">
              <div className="empty-icon">👥</div>
              <h3>No Members Found</h3>
              <p>There are no users available in the directory at this time.</p>
              <button onClick={handleRefresh} className="refresh-button">
                <RefreshCw size={14} />
                <span>Refresh Directory</span>
              </button>
              <DirectoryDiagnostic />
            </div>
          )}

          {users.length > 0 && (
            <div className="directory-summary">
              <p>
                Showing <span className="highlight">{searchResults.length}</span> of <span className="highlight">{users.length}</span> members
              </p>
            </div>
          )}

          {searchResults.length > 0 ? (
            <div className="directory-grid">
              {searchResults.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  canContact={user.canContact || planStatus !== 'free'}
                  currentUser={currentUser}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          ) : (
            isSearching && (
              <div className="directory-no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No Matching Members</h3>
                <p>No members found matching your search criteria.</p>
                <button className="clear-search-button" onClick={clearSearch}>
                  Clear Search
                </button>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default Directory;