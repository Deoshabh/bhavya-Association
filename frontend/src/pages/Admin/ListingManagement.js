import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { withRetry } from '../../utils/serverUtils';
import { Search, Filter, RefreshCw, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '../../components/Admin/AdminLayout';
import ListingEditModal from '../../components/Admin/ListingEditModal';

const ListingManagement = () => {
  const { api, user, serverStatus } = useContext(AuthContext);
  
  // State management
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ category: '' });
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [editingListing, setEditingListing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Check if user is admin
  const isAdmin = user && user.planType === 'admin';
  
  // Fetch listings with filtering and pagination
  const fetchListings = async (page = 1) => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      
      let url = `/api/admin/listings?page=${page}&limit=${pagination.limit}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (filters.category) {
        url += `&category=${encodeURIComponent(filters.category)}`;
      }
      
      const response = await withRetry(
        () => api.get(url),
        2,
        'admin-listings'
      );
      
      setListings(response.data.listings);
      setPagination(response.data.pagination);
      
      // Extract categories for filter dropdown
      if (!categories.length) {
        const uniqueCategories = [...new Set(response.data.listings.map(listing => listing.category))];
        setCategories(uniqueCategories.sort());
      }
      
      setError('');
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchListings();
  }, [isAdmin, searchTerm, filters]);
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchListings(newPage);
  };
  
  // Handle edit listing
  const handleEditListing = (listing) => {
    setEditingListing(listing);
    setShowEditModal(true);
  };
  
  // Handle listing update
  const handleListingUpdate = async (listingId, updates) => {
    try {
      const response = await withRetry(
        () => api.put(`/api/admin/listings/${listingId}`, updates),
        2,
        `admin-update-listing-${listingId}`
      );
      
      // Update the listing in the local state
      setListings(prevListings => 
        prevListings.map(listing => 
          listing._id === listingId ? { ...listing, ...updates } : listing
        )
      );
      
      setShowEditModal(false);
      return true;
    } catch (err) {
      console.error('Failed to update listing:', err);
      return false;
    }
  };
  
  // Handle listing delete
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }
    
    try {
      await withRetry(
        () => api.delete(`/api/listings/${listingId}`),
        2,
        `admin-delete-listing-${listingId}`
      );
      
      // Remove the listing from the local state
      setListings(prevListings => 
        prevListings.filter(listing => listing._id !== listingId)
      );
    } catch (err) {
      console.error('Failed to delete listing:', err);
      alert('Failed to delete listing. Please try again.');
    }
  };
  
  // Handle toggle approval
  const handleToggleApproval = async (listingId, currentApprovalStatus) => {
    try {
      await handleListingUpdate(listingId, { approved: !currentApprovalStatus });
    } catch (err) {
      console.error('Failed to toggle approval status:', err);
    }
  };
  
  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return (
    <AdminLayout title="Listing Management" currentPage="listings">
      {!serverStatus && (
        <div className="server-warning">
          <p>⚠️ Server connection issues detected. Listing data may not be available.</p>
        </div>
      )}
      
      <div className="admin-toolbar">
        <div className="search-filter-container">
          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search listings by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-section">
            <div className="filter-dropdown">
              <label>
                <Filter size={14} />
                Category:
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button className="refresh-button" onClick={() => fetchListings(pagination.page)}>
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading listings...</p>
        </div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={() => fetchListings(pagination.page)} className="retry-button">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="listings-table-container">
            <table className="listings-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.length > 0 ? (
                  listings.map(listing => (
                    <tr key={listing._id}>
                      <td>{listing.title}</td>
                      <td>{listing.category}</td>
                      <td>{listing.user ? listing.user.name : 'Unknown'}</td>
                      <td>
                        {listing.approved !== false ? (
                          <span className="status-badge status-approved">Approved</span>
                        ) : (
                          <span className="status-badge status-pending">Pending</span>
                        )}
                      </td>
                      <td>{new Date(listing.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-button edit"
                            onClick={() => handleEditListing(listing)}
                            title="Edit Listing"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className={`action-button ${listing.approved !== false ? 'reject' : 'approve'}`}
                            onClick={() => handleToggleApproval(listing._id, listing.approved !== false)}
                            title={listing.approved !== false ? 'Reject Listing' : 'Approve Listing'}
                          >
                            {listing.approved !== false ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                          <button 
                            className="action-button delete"
                            onClick={() => handleDeleteListing(listing._id)}
                            title="Delete Listing"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No listings found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
      
      {showEditModal && (
        <ListingEditModal
          listing={editingListing}
          onClose={() => setShowEditModal(false)}
          onSave={handleListingUpdate}
        />
      )}
    </AdminLayout>
  );
};

export default ListingManagement;
