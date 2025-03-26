import React, { useState, useEffect, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { withRetry } from '../../utils/serverUtils';
import { Search, Filter, RefreshCw, Edit, UserX, UserCheck, Award, Download, PlusCircle, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/Admin/AdminLayout';
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
        <div className="server-warning">
          <p>⚠️ Server connection issues detected. User data may not be available.</p>
        </div>
      )}
      
      <div className="admin-toolbar">
        <div className="search-filter-container">
          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search users by name, phone, or occupation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-section">
            <div className="filter-dropdown">
              <label>
                <Filter size={14} />
                Plan Type:
              </label>
              <select
                value={filters.planType}
                onChange={(e) => setFilters({ ...filters, planType: e.target.value })}
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="filter-dropdown">
              <label>
                <Filter size={14} />
                Status:
              </label>
              <select
                value={filters.accountStatus}
                onChange={(e) => setFilters({ ...filters, accountStatus: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <button className="refresh-button" onClick={() => fetchUsers(pagination.page)}>
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="action-buttons-container">
          <button 
            className="action-button create"
            onClick={handleCreateUser}
            title="Create New User"
          >
            <PlusCircle size={16} />
            <span>Create User</span>
          </button>
          
          <button 
            className="action-button export"
            onClick={exportUsersToCSV}
            disabled={users.length === 0}
            title="Export Users to CSV"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={() => fetchUsers(pagination.page)} className="retry-button">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Occupation</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.phoneNumber}</td>
                      <td>{user.occupation}</td>
                      <td>
                        <span className={`plan-badge plan-${user.planType}`}>
                          {user.planType}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${user.accountStatus}`}>
                          {user.accountStatus}
                        </span>
                      </td>
                      <td>
                        {user.isPublic ? (
                          <span className="visibility-badge visible">Public</span>
                        ) : (
                          <span className="visibility-badge hidden">Hidden</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-button edit"
                            onClick={() => handleEditUser(user)}
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="action-button view"
                            onClick={() => navigate(`/user-profile/${user._id}`)}
                            title="View Profile"
                          >
                            <UserCheck size={16} />
                          </button>
                          {user.planType !== 'admin' && (
                            <button
                              className="action-button promote"
                              onClick={() => handleUserUpdate(user._id, { 
                                planType: user.planType === 'premium' ? 'admin' : 'premium' 
                              })}
                              title={user.planType === 'premium' ? 'Make Admin' : 'Make Premium'}
                            >
                              <Award size={16} />
                            </button>
                          )}
                          {/* Add delete button */}
                          <button 
                            className="action-button delete"
                            onClick={() => handleDeleteUser(user._id)}
                            title="Delete User"
                            disabled={user._id === currentUser?._id} // Prevent deleting yourself
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No users found</td>
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
