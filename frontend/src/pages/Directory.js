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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Member Directory</h1>
          <p className="text-neutral-600">Connect with {users.length} members of our community</p>
        </div>
        <button 
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow transition"
          onClick={handleRefresh} 
          disabled={loading}
        >
          <RefreshCw size={14} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {!serverStatus && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 text-yellow-700">
          <p>⚠️ Server connection issues detected. Directory data may not be available.</p>
        </div>
      )}

      {/* Premium Banner - only show when needed */}
      {planStatus === 'free' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Star size={24} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-blue-800">
              {searchTerm || filters.occupation ? 'Unlock Contact Info for These Members' : 'Upgrade to Premium Membership'}
            </h3>
          </div>
          
          <p className="text-neutral-700 mb-4">
            {searchTerm || filters.occupation 
              ? 'Upgrade to contact members matching your search and access all premium features.' 
              : 'Get full access to member contact information and premium features.'}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-between">
            <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-0">
              <div className="flex items-center">
                <Shield size={16} className="text-blue-600 mr-2" />
                <span>Direct member contact</span>
              </div>
              <div className="flex items-center">
                <Users size={16} className="text-blue-600 mr-2" />
                <span>Access to full profiles</span>
              </div>
            </div>
            
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow transition"
              onClick={() => navigate('/upgrade-membership')}
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Improved Search and Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search members by name, occupation, or interests..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-10 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search members"
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                onClick={clearSearch} 
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="relative min-w-[220px]">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center text-neutral-500">
              <Filter size={16} className="mr-2" />
              <span className="text-sm hidden md:inline">Filter Occupations</span>
            </div>
            <select
              value={filters.occupation}
              onChange={(e) => setFilters({ ...filters, occupation: e.target.value })}
              aria-label="Filter by occupation"
              className="w-full pl-10 md:pl-36 pr-8 py-2 border rounded appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Occupations</option>
              {occupations.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={14} />
          </div>
        </div>
      </div>

      {/* Rest of the component with proper spacing... */}
      {loading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600">Loading directory...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Directory results display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((user) => (
              <div key={user._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition">
                {/* User card content */}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Directory;