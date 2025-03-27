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
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <p className="text-yellow-700 font-medium flex items-center">
            <span className="mr-2">⚠️</span> 
            Server connection issues detected. Listing data may not be available.
          </p>
        </div>
      )}
      
      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-auto md:flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search listings by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3 justify-start">
            <div className="relative inline-flex">
              <label className="inline-flex items-center text-sm text-gray-700 mr-2 whitespace-nowrap">
                <Filter size={14} className="mr-1" />
                Category:
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="block bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button 
              className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => fetchListings(pagination.page)}
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading listings...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => fetchListings(pagination.page)} 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.length > 0 ? (
                    listings.map(listing => (
                      <tr key={listing._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{listing.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{listing.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{listing.user ? listing.user.name : 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {listing.approved !== false ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => handleEditListing(listing)}
                              title="Edit Listing"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className={listing.approved !== false ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                              onClick={() => handleToggleApproval(listing._id, listing.approved !== false)}
                              title={listing.approved !== false ? 'Reject Listing' : 'Approve Listing'}
                            >
                              {listing.approved !== false ? <XCircle size={18} /> : <CheckCircle size={18} />}
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteListing(listing._id)}
                              title="Delete Listing"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No listings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination controls */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{listings.length}</span> of <span className="font-medium">{pagination.total}</span> listings
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </div>
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
