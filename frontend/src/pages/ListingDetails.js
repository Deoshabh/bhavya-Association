import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { withRetry } from '../utils/serverUtils';
import { MapPin, Phone, Mail, Share2, Calendar, Tag } from 'lucide-react';
import BackButton from '../components/BackButton';

const ListingDetails = () => {
  // Get listing ID from URL parameters
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user, serverStatus, refreshToken } = useContext(AuthContext);
  
  // State management
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Default image for listings without an image
  const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='150' height='150'%3E%3Cpath fill='%23d1d5db' d='M3 5c0-1.1.9-2 2-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm6 1H5v4h4V6zm10 0h-4v4h4V6zm0 10h-4v4h4v-4zm-10 4v-4H5v4h4z'/%3E%3C/svg%3E";
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Fetch listing details with improved error handling
  const fetchListingDetails = useCallback(async () => {
    if (!serverStatus) {
      setError('Server appears to be offline. Please try again later.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      if (!user) {
        setError('You need to be logged in to view listing details.');
        setLoading(false);
        return;
      }
      
      // Use withRetry with auth error handler
      const response = await withRetry(
        () => api.get(`/api/listings/${id}`), 
        2,
        `listing-details-${id}`,
        false,
        async () => {
          // Try to refresh the token if available
          if (refreshToken) {
            return await refreshToken();
          }
          // If no refresh function, we can't recover
          return false;
        }
      );
      
      if (response && response.data) {
        setListing(response.data);
        setError('');
      } else {
        setError('Failed to load listing details. Please try again.');
      }
    } catch (err) {
      console.error('Failed to fetch listing details:', err);
      if (err.response?.status === 401) {
        // Redirect to login if authentication failed
        navigate('/login', { state: { from: `/service-listings/${id}` } });
        setError('Please log in to view listing details.');
      } else {
        setError('Failed to load listing details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, api, user, serverStatus, navigate, refreshToken]);
  
  // Share listing on WhatsApp
  const shareOnWhatsApp = () => {
    if (!listing) return;
    
    const shareText = `${listing.title}\nCategory: ${listing.category}\n${
      !listing.premiumRequired 
        ? `Contact: ${listing.contactPhone}${listing.contactEmail ? `\nEmail: ${listing.contactEmail}` : ''}` 
        : 'Contact details available on Bhavya Association'
    }\n${listing.description}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // Fetch data when component mounts
  useEffect(() => {
    fetchListingDetails();
  }, [fetchListingDetails]);
  
  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading listing details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="listing-details-container">
        <div className="listing-details-card">
          <div className="error-content">
            <h2>Error Loading Listing</h2>
            <p>{error}</p>
            <div className="action-buttons">
              <BackButton />
              <button className="retry-button" onClick={fetchListingDetails}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Not found state
  if (!listing) {
    return (
      <div className="listing-details-container">
        <div className="listing-details-card not-found">
          <div className="not-found-content">
            <h2>Listing Not Found</h2>
            <p>The listing you're looking for doesn't exist or has been removed.</p>
            <BackButton />
          </div>
        </div>
      </div>
    );
  }
  
  // Main content - Listing details
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        
        <button 
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition"
          onClick={shareOnWhatsApp}
          aria-label="Share on WhatsApp"
        >
          <Share2 size={18} className="mr-2" />
          <span>Share</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Image Section */}
          <div className="md:w-1/2 lg:w-2/5">
            <div className="h-64 md:h-full relative">
              <img 
                src={listing.image || DEFAULT_IMAGE} 
                alt={listing.title} 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = DEFAULT_IMAGE }}
              />
            </div>
          </div>
          
          {/* Details Section */}
          <div className="md:w-1/2 lg:w-3/5 p-6 md:p-8">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">{listing.title}</h1>
              <div className="flex flex-wrap gap-3 mt-2">
                <div className="flex items-center text-neutral-600">
                  <Tag size={16} className="mr-1" />
                  <span>{listing.category}</span>
                </div>
                <div className="flex items-center text-neutral-600">
                  <Calendar size={16} className="mr-1" />
                  <span>Listed on {formatDate(listing.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-neutral-50 rounded mb-6">
              <p className="text-sm">Service provided by: <strong>{listing.user.name}</strong></p>
              <p className="text-neutral-600 text-sm">{listing.user.occupation}</p>
            </div>
            
            <h2 className="text-xl font-semibold mb-3 text-neutral-800">Description</h2>
            <div className="bg-white rounded mb-6">
              <p className="text-neutral-700">{listing.description}</p>
            </div>
            
            <h2 className="text-xl font-semibold mb-3 text-neutral-800">Location</h2>
            <div className="flex items-start mb-6">
              <div className="bg-neutral-100 p-2 rounded-full mr-3">
                <MapPin size={20} className="text-neutral-700" />
              </div>
              <p className="text-neutral-700">Service available in Bhavya Association area</p>
            </div>
            
            {/* Contact Section */}
            <div>
              <h2 className="text-xl font-semibold mb-3 text-neutral-800">Contact Information</h2>
              
              {listing.premiumRequired && !['premium', 'admin'].includes(user?.planType) ? (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Premium Access Required</h3>
                  <p className="text-neutral-700 mb-4">Contact details are available to premium members only</p>
                  <button 
                    className="bg-warning text-dark hover:bg-yellow-600 font-medium py-2 px-6 rounded transition"
                    onClick={() => navigate('/upgrade-membership')}
                  >
                    Upgrade to Premium
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg border p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-full mr-3">
                        <Phone size={20} className="text-primary-700" />
                      </div>
                      <div>
                        <span className="block text-sm text-neutral-500">Phone</span>
                        <span className="font-medium">{listing.contactPhone}</span>
                      </div>
                    </div>
                    
                    {listing.contactEmail && (
                      <div className="flex items-center">
                        <div className="bg-primary-100 p-2 rounded-full mr-3">
                          <Mail size={20} className="text-primary-700" />
                        </div>
                        <div>
                          <span className="block text-sm text-neutral-500">Email</span>
                          <span class="font-medium">{listing.contactEmail}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a 
                      href={`tel:${listing.contactPhone}`} 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded flex items-center justify-center"
                      aria-label="Call service provider"
                    >
                      <Phone size={18} className="mr-2" />
                      Call Now
                    </a>
                    
                    {listing.contactEmail && (
                      <a 
                        href={`mailto:${listing.contactEmail}`} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded flex items-center justify-center"
                        aria-label="Email service provider"
                      >
                        <Mail size={18} className="mr-2" />
                        Send Email
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
