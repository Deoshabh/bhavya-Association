import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { withRetry } from '../utils/serverUtils';
import { Search, ExternalLink, PlusCircle, X, RefreshCw, MessageCircle, Tag, Phone, Mail, Star } from 'lucide-react';
import api from '../services/api';

const ServiceListings = () => {
  const navigate = useNavigate();
  const { api: contextApi, user, token, serverStatus } = useContext(AuthContext);

  // State management
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  // Default image for listings without an image
  const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='150' height='150'%3E%3Cpath fill='%23d1d5db' d='M3 5c0-1.1.9-2 2-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm6 1H5v4h4V6zm10 0h-4v4h4V6zm0 10h-4v4h4v-4zm-10 4v-4H5v4h4z'/%3E%3C/svg%3E";

  // Fetch listings with improved authentication handling
  const fetchListings = async () => {
    // Don't attempt to fetch if the server is offline
    if (!serverStatus) {
      setError('Server appears to be offline. Please try again later.');
      setLoading(false);
      return;
    }

    // Prevent concurrent requests
    if (isRequestInProgress) {
      console.log("Directory fetch already in progress, skipping duplicate request.");
      return;
    }

    // Check if token exists before making the request
    if (!token) {
      console.warn("No authentication token available - cannot fetch listings");
      setError('You must be logged in to view listings. Please log in and try again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setIsRequestInProgress(true);
      setError(''); // Clear any previous errors

      console.log("Fetching listings with token:", token ? `${token.substring(0, 10)}...` : 'No token');
      
      // Don't manually set headers here - let the API interceptor handle it
      // The api instance will automatically add the Authorization header
      const response = await withRetry(
        () => api.get('/api/listings'),
        3, // Increase max attempts to 3
        'service-listings'
      );

      // Verify response data exists
      if (!response || !response.data) {
        throw new Error('Empty response received from server');
      }

      // Process the listings data
      setListings(response.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(listing => listing.category))];
      setCategories(uniqueCategories.sort());
      
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      
      // Safe error handling - first check if error object exists
      if (err) {
        if (err.response) {
          // Server responded with an error status
          if (err.response.status === 401 || err.response.status === 403) {
            setError('Your session has expired. Please log in again.');
          } else if (err.response.status === 500) {
            setError('The server encountered an error. Please try again later.');
          } else {
            setError(`Error: ${err.response.data?.msg || 'Failed to load listings'}`);
          }
        } else if (err.request) {
          // Request was made but no response received
          setError('No response received from server. Please check your connection.');
        } else if (err.message && err.message.includes('throttled')) {
          // Handle throttling errors
          setError('Too many requests. Please wait a moment before trying again.');
        } else {
          // Something else caused the error
          setError(err.message || 'An unexpected error occurred. Please try again later.');
        }
      } else {
        // Fallback if err is undefined
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
      setIsRequestInProgress(false);
    }
  };

  // Filter listings based on search and category
  useEffect(() => {
    if (!listings.length) {
      setFilteredListings([]);
      return;
    }

    let results = [...listings];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(listing =>
        listing.title.toLowerCase().includes(term) ||
        listing.description.toLowerCase().includes(term) ||
        listing.category.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      results = results.filter(listing => listing.category === selectedCategory);
    }

    setFilteredListings(results);
  }, [listings, searchTerm, selectedCategory]);

  // Handle creating a new listing
  const handleCreateListing = () => {
    if (user) {
      navigate('/create-listing');
    } else {
      navigate('/login', { state: { from: '/create-listing' } });
    }
  };

  // Handle viewing listing details
  const viewListingDetails = (listingId) => {
    navigate(`/service-listings/${listingId}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  // Initial fetch - wait for authentication
  useEffect(() => {
    if (token && user) {
      fetchListings();
    } else if (!token) {
      setError('Please log in to view the Business Directory.');
      setLoading(false);
    }
  }, [token, user, serverStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Business Directory</h1>
          <p className="text-neutral-600">Find and connect with service providers in our community</p>
        </div>
        
        <button
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow transition"
          onClick={handleCreateListing}
        >
          <PlusCircle size={16} className="mr-2" />
          {user ? 'Add New Service' : 'Login to Add Service'}
        </button>
      </div>

      {!user && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
          <p>Please <a href="/login" className="font-medium text-blue-700 underline">login</a> or <a href="/register" className="font-medium text-blue-700 underline">register</a> to access the full features of the Business Directory.</p>
        </div>
      )}

      {!serverStatus && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700">
          <p>⚠️ Server connection issues detected. Some data may not be available.</p>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Search for services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="relative min-w-[200px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
              <Tag size={16} />
            </div>
          </div>

          {(searchTerm || selectedCategory) && (
            <button 
              className="px-4 py-2 text-neutral-600 border rounded hover:bg-neutral-50 inline-flex items-center justify-center"
              onClick={resetFilters}
            >
              <RefreshCw size={14} className="mr-2" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600">Loading service listings...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchListings} 
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded"
            disabled={isRequestInProgress}
          >
            {isRequestInProgress ? (
              <span className="inline-flex items-center">
                <RefreshCw size={14} className="mr-2 animate-spin" />
                Retrying...
              </span>
            ) : (
              <span className="inline-flex items-center">
                <RefreshCw size={14} className="mr-2" />
                Try Again
              </span>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Results Summary */}
          <div className="mb-4 flex justify-between items-center">
            {filteredListings.length === 0 ? (
              <p className="text-neutral-600">No services found matching your criteria.</p>
            ) : (
              <p className="text-neutral-600">
                Showing <span className="font-medium">{filteredListings.length}</span> {filteredListings.length === 1 ? 'service' : 'services'}
                {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
                {selectedCategory && <span> in <span className="font-medium">{selectedCategory}</span></span>}
              </p>
            )}
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <div key={listing._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition">
                <div 
                  className="relative cursor-pointer h-48 overflow-hidden" 
                  onClick={() => viewListingDetails(listing._id)}
                >
                  <img
                    src={listing.image || DEFAULT_IMAGE}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-full p-2">
                      <ExternalLink size={20} className="text-primary-600" />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                      {listing.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">{listing.title}</h3>
                  
                  <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                    {listing.description}
                  </p>
                  
                  <div className="text-sm text-neutral-500 mb-4">
                    <span>By: {listing.user.name}</span>
                  </div>
                  
                  {/* Contact Details Section */}
                  {listing.premiumRequired ? (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-md border border-blue-100 mb-4">
                      <p className="text-blue-800 font-medium text-sm mb-3">Premium access required for contact details</p>
                      <button
                        onClick={() => navigate('/upgrade-membership')}
                        className="text-dark bg-warning hover:bg-yellow-600 text-sm font-medium py-2 px-3 rounded w-full transition flex items-center justify-center"
                      >
                        <Star size={14} className="mr-1.5" />
                        Upgrade to Premium
                      </button>
                    </div>
                  ) : (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center text-sm">
                        <Phone size={14} className="text-primary-600 mr-2 flex-shrink-0" />
                        <span className="text-neutral-700">{listing.contactPhone}</span>
                      </div>
                      {listing.contactEmail && (
                        <div className="flex items-center text-sm">
                          <Mail size={14} className="text-primary-600 mr-2 flex-shrink-0" />
                          <span className="text-neutral-700 break-all">{listing.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!listing.premiumRequired && (
                      <button
                        onClick={() => {
                          const shareText = `${listing.title}\nCategory: ${listing.category}\nContact: ${listing.contactPhone}${listing.contactEmail ? `\nEmail: ${listing.contactEmail}` : ''}\n${listing.description}`;
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded"
                      >
                        <MessageCircle size={16} className="mr-2" />
                        Share
                      </button>
                    )}
                    <button
                      onClick={() => viewListingDetails(listing._id)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* No Results */}
          {filteredListings.length === 0 && (
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <div className="text-neutral-400 mb-4">
                <Search size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-neutral-800 mb-2">No listings found</h3>
              <p className="text-neutral-600 mb-4">Try adjusting your search or filters to find what you're looking for.</p>
              <button 
                onClick={resetFilters} 
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded inline-flex items-center"
              >
                <RefreshCw size={14} className="mr-2" />
                Reset Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ServiceListings;