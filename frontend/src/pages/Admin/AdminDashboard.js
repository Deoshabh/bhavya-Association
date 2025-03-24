import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { withRetry } from '../../utils/serverUtils';
import { Users, ShoppingBag, Briefcase, DollarSign, UserCheck, UserX, Shield } from 'lucide-react';
import AdminLayout from '../../components/Admin/AdminLayout';
import StatCard from '../../components/Admin/StatCard';
import '../../styles/Admin/AdminDashboard.css';

const AdminDashboard = () => {
  const { api, user, serverStatus } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Check if user is admin
  const isAdmin = user && user.planType === 'admin';
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAdmin) return;
      
      try {
        setLoading(true);
        const response = await withRetry(
          () => api.get('/api/admin/dashboard'),
          2,
          'admin-dashboard'
        );
        
        setStats(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch admin dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [api, isAdmin]);
  
  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return (
    <AdminLayout title="Admin Dashboard" currentPage="dashboard">
      {!serverStatus && (
        <div className="server-warning">
          <p>⚠️ Server connection issues detected. Dashboard data may not be available.</p>
        </div>
      )}
      
      {loading ? (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      ) : (
        <div className="admin-dashboard-content">
          <section className="stat-cards">
            <StatCard 
              title="Total Users" 
              value={stats?.userStats.total || 0}
              icon={<Users />}
              color="blue"
            />
            <StatCard 
              title="Premium Members" 
              value={stats?.userStats.premium || 0}
              icon={<DollarSign />} 
              color="gold"
            />
            <StatCard 
              title="Active Users" 
              value={stats?.userStats.active || 0}
              icon={<UserCheck />}
              color="green"
            />
            <StatCard 
              title="Deactivated Users" 
              value={(stats?.userStats.deactivated || 0) + (stats?.userStats.suspended || 0)}
              icon={<UserX />}
              color="red"
            />
            <StatCard 
              title="Total Listings" 
              value={stats?.listingStats.total || 0}
              icon={<Briefcase />}
              color="purple"
            />
            <StatCard 
              title="Admin Users" 
              value={stats?.userStats.admins || 0}
              icon={<Shield />}
              color="dark-blue"
            />
          </section>
          
          <section className="recent-activity">
            <div className="recent-users-section">
              <h3>Recent Users</h3>
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="recent-users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentUsers.map(user => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.phoneNumber}</td>
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
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No recent users found</p>
              )}
            </div>
          </section>
          
          <section className="listing-categories">
            <h3>Listings by Category</h3>
            {stats?.listingStats.byCategory && 
             Object.keys(stats.listingStats.byCategory).length > 0 ? (
              <div className="category-stats">
                {Object.entries(stats.listingStats.byCategory).map(([category, count]) => (
                  <div className="category-item" key={category}>
                    <h4>{category}</h4>
                    <div className="category-count">{count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No listing categories found</p>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
