import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { withRetry } from '../utils/serverUtils';
import { MapPin, Phone, Mail, Share2, Calendar, Tag } from 'lucide-react';
import BackButton from '../components/BackButton';
import '../styles/ListingDetails.css';

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
      <div className="listing-details-container">
        <div className="loading-animation">
          <div className="loading-spinner"></div>
          <p>Loading listing details...</p>
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
    <div className="listing-details-container">
      <div className="listing-details-header">
        <BackButton />
        
        <button 
          className="share-button" 
          onClick={shareOnWhatsApp}
          aria-label="Share on WhatsApp"
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>
      
      <div className="listing-details-card">
        <div className="listing-details-grid">
          {/* Image Section */}
          <div className="listing-image-section">
            <div className="listing-image-container">
              <img 
                src={listing.image || DEFAULT_IMAGE} 
                alt={listing.title} 
                className="listing-image"
                onError={(e) => { e.target.src = DEFAULT_IMAGE }}
              />
            </div>
          </div>
          
          {/* Details Section */}
          <div className="listing-info-section">
            <div className="listing-title-section">
              <h1 className="listing-title">{listing.title}</h1>
              <div className="listing-meta">
                <div className="listing-category">
                  <Tag size={16} />
                  <span>{listing.category}</span>
                </div>
                <div className="listing-date">
                  <Calendar size={16} />
                  <span>Listed on {formatDate(listing.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="listing-provider-info">
              <p>Service provided by: <strong>{listing.user.name}</strong></p>
              <p className="provider-occupation">{listing.user.occupation}</p>
            </div>
            
            <h2 className="section-title">Description</h2>
            <div className="listing-description">
              <p>{listing.description}</p>
            </div>
            
            <h2 className="section-title">Location</h2>
            <div className="listing-location">
              <div className="location-icon">
                <MapPin size={20} />
              </div>
              <p>Service available in Bhavya Association area</p>
            </div>
            
            {/* Contact Section - Conditional based on premium status */}
            <div className="listing-contact-section">
              <h2 className="section-title">Contact Information</h2>
              
              {listing.premiumRequired ? (
                <div className="premium-required-card">
                  <div className="premium-required-content">
                    <h3>Premium Access Required</h3>
                    <p>Contact details are available to premium members only</p>
                    <button 
                      className="upgrade-button"
                      onClick={() => navigate('/upgrade-membership')}
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                </div>
              ) : (
                <div className="contact-details-grid">
                  <div className="contact-item">
                    <div className="contact-icon">
                      <Phone size={20} />
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">Phone</span>
                      <span className="contact-value">{listing.contactPhone}</span>
                    </div>
                  </div>
                  
                  {listing.contactEmail && (
                    <div className="contact-item">
                      <div className="contact-icon">
                        <Mail size={20} />
                      </div>
                      <div className="contact-info">
                        <span className="contact-label">Email</span>
                        <span className="contact-value">{listing.contactEmail}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="contact-actions">
                    <a 
                      href={`tel:${listing.contactPhone}`} 
                      className="call-button"
                      aria-label="Call service provider"
                    >
                      <Phone size={18} />
                      Call Now
                    </a>
                    
                    {listing.contactEmail && (
                      <a 
                        href={`mailto:${listing.contactEmail}`} 
                        className="email-button"
                        aria-label="Email service provider"
                      >
                        <Mail size={18} />
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
