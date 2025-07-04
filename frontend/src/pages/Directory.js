import React, { useState, useEffect, useContext, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getCachedDirectory } from '../utils/serverUtils';
import useAuthenticatedRequest from '../hooks/useAuthenticatedRequest';
import { Search, RefreshCw, Filter, ChevronDown, Users, X, Star, Shield, Mail, Phone, MapPin, Briefcase, Heart } from 'lucide-react';
import api from '../services/api';
import Alert from '../components/Alert';
import MetaTags from '../components/MetaTags';
import { generatePageMeta } from '../utils/socialShareConfig';

// Default profile image as SVG
const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='150' height='150'%3E%3Cpath fill='%23d1d5db' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Directory = () => {
  const navigate = useNavigate();
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
  const [refreshInProgress, setRefreshInProgress] = useState(false);

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
        setRefreshInProgress(true);
        console.log('Fetching directory data with token:', token.substring(0, 10) + '...');

        // Ensure token is set in the authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Direct API call without caching to troubleshoot
        const res = await api.get('/api/directory');

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
        setRefreshInProgress(false);
        fetchInProgress.current = false;
      }
    },
    [api, serverStatus, token, currentUser]
  );

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDirectory(true);
  };

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
    if (!users.length) {
      setSearchResults([]);
      return;
    }

    const filtered = users.filter((user) => {
      // Search term filter
      if (
        searchTerm &&
        !user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.profession?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Handle upgrade to premium
  const handleUpgrade = () => {
    navigate('/upgrade-membership');
  };

  // Handle view user profile
  const viewUserProfile = (userId) => {
    navigate(`/user-profile/${userId}`);
  };

  // Redirect if authentication required
  if (authRequired) return <Navigate to="/login" />;

  // Unique occupations for filter
  const occupations = [...new Set(users.map((user) => user.occupation || '').filter(Boolean))].sort();
  return (
    <>
      {/* Meta tags for directory page */}
      <MetaTags 
        {...generatePageMeta('directory')}
        type="website"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Member Directory</h1>
          <p className="text-neutral-600">
            Connect with {users.length} members of our community
          </p>
        </div>
        
        <button 
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow transition"
          onClick={handleRefresh} 
          disabled={loading || refreshInProgress}
        >
          <RefreshCw size={16} className={`mr-2 ${refreshInProgress ? "animate-spin" : ""}`} />
          <span>{refreshInProgress ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Server Status Warning */}
      {!serverStatus && (
        <Alert 
          variant="warning" 
          className="mb-6"
          title="Connection Issues"
        >
          Server connection issues detected. Directory data may not be available.
        </Alert>
      )}

      {/* Search and Filter Section */}
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
              className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full pl-10 md:pl-36 pr-10 py-2 border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500"
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

      {/* Loading State */}
      {loading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600">Loading directory...</p>
        </div>
      ) : error ? (
        <Alert 
          variant="error" 
          className="mb-6"
          title="Error Loading Directory"
        >
          <p className="mb-4">{error}</p>
          <button 
            onClick={handleRefresh} 
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded mt-2"
          >
            Try Again
          </button>
        </Alert>
      ) : (
        <>
          {/* Results Summary */}
          <div className="mb-4 flex justify-between items-center">
            {searchResults.length === 0 ? (
              <p className="text-neutral-600">No members found matching your criteria.</p>
            ) : (
              <p className="text-neutral-600">
                Showing <span className="font-medium">{searchResults.length}</span> {searchResults.length === 1 ? 'member' : 'members'}
                {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
                {filters.occupation && <span> in <span className="font-medium">{filters.occupation}</span></span>}
              </p>
            )}
          </div>

          {/* Member Grid */}
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((member) => (
                <div 
                  key={member._id} 
                  className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition group"
                >
                  {/* Member Card Header */}
                  <div className="relative bg-gradient-to-r from-primary-50 to-primary-100 h-24">
                    {/* Profile Image */}
                    <div className="absolute -bottom-10 left-6">
                      <div className="relative h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-sm bg-white">
                        <img
                          src={member.profileImage || DEFAULT_PROFILE_IMAGE}
                          alt={`${member.name}'s profile`}
                          className="h-full w-full object-cover"
                          onError={(e) => { e.target.src = DEFAULT_PROFILE_IMAGE; }}
                        />
                      </div>
                    </div>
                    
                    {/* Membership Badge */}
                    {member.planType === 'premium' && (
                      <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <Star size={12} className="mr-1" />
                        Premium
                      </div>
                    )}
                  </div>
                  
                  {/* Member Card Body */}
                  <div className="pt-12 px-6 pb-6">
                    <h3 className="text-lg font-semibold text-neutral-800 mb-1">{member.name}</h3>
                    
                    {member.occupation && (
                      <div className="flex items-center text-neutral-600 text-sm mb-3">
                        <Briefcase size={14} className="mr-1 flex-shrink-0" />
                        <span>{member.occupation}</span>
                      </div>
                    )}
                    
                    {member.bio && (
                      <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                        {member.bio}
                      </p>
                    )}
                    
                    {/* Member Profession */}
                    {member.profession && (
                      <div className="mb-4">
                        <h4 className="text-xs uppercase text-neutral-500 font-medium mb-2 flex items-center">
                          <Briefcase size={12} className="mr-1" />
                          Profession
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-block bg-neutral-100 text-neutral-700 rounded-full px-2 py-1 text-xs">
                            {member.profession}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Contact Info - For Premium Users Only */}
                    {member.interests && member.interests.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs uppercase text-neutral-500 font-medium mb-2 flex items-center">
                          <Heart size={12} className="mr-1" />
                          Interests
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {member.interests.slice(0, 3).map((interest, idx) => (
                            <span 
                              key={idx} 
                              className="inline-block bg-neutral-100 text-neutral-700 rounded-full px-2 py-1 text-xs"
                            >
                              {interest}
                            </span>
                          ))}
                          {member.interests.length > 3 && (
                            <span className="inline-block bg-neutral-100 text-neutral-700 rounded-full px-2 py-1 text-xs">
                              +{member.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Contact Info - For Premium Users Only */}
                    {(planStatus === 'premium' || currentUser?.planType === 'admin') ? (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center text-sm">
                          <Phone size={14} className="text-primary-600 mr-2 flex-shrink-0" />
                          <span className="text-neutral-700">{member.phoneNumber}</span>
                        </div>
                        {member.email && (
                          <div className="flex items-center text-sm">
                            <Mail size={14} className="text-primary-600 mr-2 flex-shrink-0" />
                            <span className="text-neutral-700 break-all">{member.email}</span>
                          </div>
                        )}
                        {member.address && (
                          <div className="flex items-start text-sm">
                            <MapPin size={14} className="text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-neutral-700">{member.address}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-md border border-blue-100">
                        <p className="text-blue-800 font-medium text-sm mb-3">Premium access required for contact details</p>
                        <button
                          onClick={handleUpgrade}
                          className="text-dark bg-warning hover:bg-yellow-600 text-sm font-medium py-2 px-3 rounded w-full transition flex items-center justify-center"
                        >
                          <Star size={14} className="mr-1.5" />
                          Upgrade to Premium
                        </button>
                      </div>
                    )}
                    
                    {/* View Profile Button */}
                    <button
                      onClick={() => viewUserProfile(member._id)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition"
                    >
                      View Full Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // No results state
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <div className="text-neutral-400 mb-4">
                <Users size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-neutral-800 mb-2">No members found</h3>
              <p className="text-neutral-600 mb-4">
                {searchTerm || filters.occupation 
                  ? 'Try adjusting your search or filters to find members'
                  : 'There are no members in the directory yet'}
              </p>
              {(searchTerm || filters.occupation) && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ occupation: '' });
                  }} 
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded inline-flex items-center"
                >
                  <RefreshCw size={14} className="mr-2" />
                  Reset Filters
                </button>
              )}
            </div>
          )}        </>
      )}
    </div>
    </>
  );
};

export default Directory;