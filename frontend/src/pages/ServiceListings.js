import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { withRetry } from '../utils/serverUtils';
import { Search, ExternalLink, PlusCircle, X, RefreshCw, MessageCircle } from 'lucide-react';
import api from '../services/api'; // Import the centralized API service
import '../styles/ServiceListings.css';

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
    <div className="service-listings-page">
      <div className="service-listings-header">
        <h1>Business Directory</h1>
        <button
          className="create-listing-button"
          onClick={handleCreateListing}
        >
          <PlusCircle size={16} />
          {user ? 'Add New Service' : 'Login to Add Service'}
        </button>
      </div>

      {!user && (
        <div className="auth-warning">
          <p>Please <a href="/login">login</a> or <a href="/register">register</a> to access the full features of the Business Directory.</p>
        </div>
      )}

      <div className="search-filter-container">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search for services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="filter-section">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {(searchTerm || selectedCategory) && (
            <button className="reset-filters" onClick={resetFilters}>
              <RefreshCw size={14} />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading service listings...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button 
            onClick={fetchListings} 
            className="retry-button" 
            disabled={isRequestInProgress}
          >
            {isRequestInProgress ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      ) : (
        <>
          <div className="listings-summary">
            {filteredListings.length === 0 ? (
              <p>No services found matching your criteria.</p>
            ) : (
              <p>Showing {filteredListings.length} {filteredListings.length === 1 ? 'service' : 'services'}</p>
            )}
          </div>

          <div className="listings-grid">
            {filteredListings.map(listing => (
              <div key={listing._id} className="listing-card">
                <div
                  className="listing-card-clickable"
                  onClick={() => viewListingDetails(listing._id)}
                >
                  <div className="listing-image-container">
                    <img
                      src={listing.image || DEFAULT_IMAGE}
                      alt={listing.title}
                      className="listing-image"
                      onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                    />
                    <div className="view-details-overlay">
                      <ExternalLink size={18} />
                      <span>View Details</span>
                    </div>
                  </div>

                  <div className="listing-content">
                    <h3 className="listing-title">{listing.title}</h3>
                    <span className="listing-category">{listing.category}</span>
                    <p className="listing-description">
                      {listing.description.length > 100
                        ? `${listing.description.substring(0, 100)}...`
                        : listing.description}
                    </p>
                    <p className="listing-provider">By: {listing.user.name}</p>
                  </div>
                </div>

                <div className="listing-footer">
                  {listing.premiumRequired ? (
                    <div className="premium-required">
                      <p>Contact details for premium members only</p>
                      <div className="listing-buttons">
                        <button
                          onClick={() => navigate('/upgrade-membership')}
                          className="upgrade-button"
                        >
                          Upgrade to Premium
                        </button>
                        <button
                          onClick={() => viewListingDetails(listing._id)}
                          className="view-details-button"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="contact-details">
                      <p><strong>Phone:</strong> {listing.contactPhone}</p>
                      {listing.contactEmail && (
                        <p><strong>Email:</strong> {listing.contactEmail}</p>
                      )}
                      <div className="listing-buttons">
                        <button
                          onClick={() => {
                            const shareText = `${listing.title}\nCategory: ${listing.category}\nContact: ${listing.contactPhone}${listing.contactEmail ? `\nEmail: ${listing.contactEmail}` : ''}\n${listing.description}`;
                            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          className="share-button"
                          aria-label="Share on WhatsApp"
                        >
                          <MessageCircle size={18} /> {/* Add WhatsApp-like chat icon */}
                          Share on WhatsApp
                        </button>
                        <button
                          onClick={() => viewListingDetails(listing._id)}
                          className="view-details-button"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ServiceListings;