import React, { useState, useEffect, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { withRetry } from '../../utils/serverUtils';
import { Search, Filter, RefreshCw, Edit, UserX, UserCheck, Award, Download, PlusCircle, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import UserEditModal from '../../components/Admin/UserEditModal';
import DeleteConfirmModal from '../../components/Admin/DeleteConfirmModal';

const UserManagement = () => {
  const { api, user: currentUser, serverStatus } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    planType: '',
    accountStatus: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Check if user is admin
  const isAdmin = currentUser && currentUser.planType === 'admin';
  
  // Fetch users with filtering and pagination
  const fetchUsers = async (page = 1) => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      
      let url = `/api/admin/users?page=${page}&limit=${pagination.limit}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (filters.planType) {
        url += `&planType=${encodeURIComponent(filters.planType)}`;
      }
      
      if (filters.accountStatus) {
        url += `&accountStatus=${encodeURIComponent(filters.accountStatus)}`;
      }
      
      const response = await withRetry(
        () => api.get(url),
        2,
        'admin-users'
      );
      
      setUsers(response.data.users);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [isAdmin, searchTerm, filters]);
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchUsers(newPage);
  };
  
  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };
  
  // Handle user update
  const handleUserUpdate = async (userId, updates) => {
    try {
      const response = await withRetry(
        () => api.put(`/api/admin/users/${userId}`, updates),
        2,
        `admin-update-user-${userId}`
      );
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, ...updates } : user
        )
      );
      
      setShowEditModal(false);
      return true;
    } catch (err) {
      console.error('Failed to update user:', err);
      return false;
    }
  };
  
  // Handle user creation
  const handleCreateUser = () => {
    setEditingUser(null);
    setIsCreatingUser(true);
    setShowEditModal(true);
  };
  
  // Handle user deletion
  const handleDeleteUser = (userId) => {
    const userToDelete = users.find(u => u._id === userId);
    setUserToDelete(userToDelete);
    setShowDeleteModal(true);
  };
  
  // Confirm user deletion
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await withRetry(
        () => api.delete(`/api/admin/users/${userToDelete._id}`),
        2,
        `admin-delete-user-${userToDelete._id}`
      );
      
      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      // You could set an error message here if needed
    }
  };
  
  // Handle export users to CSV
  const exportUsersToCSV = () => {
    // Filter out sensitive data and prepare CSV content
    const csvData = users.map(user => ({
      Name: user.name,
      PhoneNumber: user.phoneNumber,
      Occupation: user.occupation || '',
      PlanType: user.planType,
      AccountStatus: user.accountStatus,
      IsPublic: user.isPublic ? 'Yes' : 'No',
      CreatedAt: new Date(user.createdAt).toLocaleDateString()
    }));
    
    // Convert to CSV format
    const csvHeader = Object.keys(csvData[0]).join(',');
    const csvRows = csvData.map(user => 
      Object.values(user)
        .map(value => `"${value}"`)
        .join(',')
    );
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle user save (both create and update)
  const handleUserSave = async (userId, userData) => {
    try {
      if (isCreatingUser) {
        // Create new user
        const response = await withRetry(
          () => api.post('/api/admin/users', userData),
          2,
          'admin-create-user'
        );
        
        // Add the new user to the local state
        setUsers(prevUsers => [response.data.user, ...prevUsers]);
        setIsCreatingUser(false);
      } else {
        // Update existing user
        const response = await withRetry(
          () => api.put(`/api/admin/users/${userId}`, userData),
          2,
          `admin-update-user-${userId}`
        );
        
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, ...userData } : user
          )
        );
      }
      
      setShowEditModal(false);
      return true;
    } catch (err) {
      console.error('Failed to save user:', err);
      return false;
    }
  };
  
  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return (
    <AdminLayout title="User Management" currentPage="users">
      {!serverStatus && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <p className="text-yellow-700 font-medium flex items-center">
            <span className="mr-2">⚠️</span> 
            Server connection issues detected. User data may not be available.
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
              placeholder="Search users by name, phone, or occupation..."
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
                Plan:
              </label>
              <select
                value={filters.planType}
                onChange={(e) => setFilters({ ...filters, planType: e.target.value })}
                className="block bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="relative inline-flex">
              <label className="inline-flex items-center text-sm text-gray-700 mr-2 whitespace-nowrap">
                <Filter size={14} className="mr-1" />
                Status:
              </label>
              <select
                value={filters.accountStatus}
                onChange={(e) => setFilters({ ...filters, accountStatus: e.target.value })}
                className="block bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <button 
              className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => fetchUsers(pagination.page)}
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleCreateUser}
            title="Create New User"
          >
            <PlusCircle size={16} className="mr-2" />
            <span>Create User</span>
          </button>
          
          <button 
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={exportUsersToCSV}
            disabled={users.length === 0}
            title="Export Users to CSV"
          >
            <Download size={16} className="mr-2" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading users...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => fetchUsers(pagination.page)} 
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupation</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map(user => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phoneNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.occupation}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.planType === 'premium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : user.planType === 'admin' 
                                ? 'bg-indigo-100 text-indigo-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.planType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.accountStatus === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : user.accountStatus === 'suspended'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.accountStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isPublic ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Public
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Hidden
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => handleEditUser(user)}
                              title="Edit User"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              className="text-green-600 hover:text-green-900"
                              onClick={() => navigate(`/user-profile/${user._id}`)}
                              title="View Profile"
                            >
                              <UserCheck size={18} />
                            </button>
                            {user.planType !== 'admin' && (
                              <button
                                className="text-purple-600 hover:text-purple-900"
                                onClick={() => handleUserUpdate(user._id, { 
                                  planType: user.planType === 'premium' ? 'admin' : 'premium' 
                                })}
                                title={user.planType === 'premium' ? 'Make Admin' : 'Make Premium'}
                              >
                                <Award size={18} />
                              </button>
                            )}
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete User"
                              disabled={user._id === currentUser?._id}
                              style={{ opacity: user._id === currentUser?._id ? 0.5 : 1 }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No users found
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
                Showing <span className="font-medium">{users.length}</span> of <span className="font-medium">{pagination.total}</span> users
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
      
      {/* Modals */}
      {showEditModal && (
        <UserEditModal
          user={editingUser}
          isCreating={isCreatingUser}
          onClose={() => {
            setShowEditModal(false);
            setIsCreatingUser(false);
          }}
          onSave={handleUserSave}
        />
      )}
      
      {showDeleteModal && (
        <DeleteConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
          onConfirm={confirmDeleteUser}
          onCancel={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default UserManagement;
