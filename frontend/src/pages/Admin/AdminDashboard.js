import React, { useState, useEffect, useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { withRetry } from '../../utils/serverUtils';
import { Users, Briefcase, DollarSign, UserCheck, UserX, Shield, RefreshCw, Share2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

// Enhanced stat card component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    'blue': 'bg-blue-50 text-blue-700 border-blue-200',
    'green': 'bg-green-50 text-green-700 border-green-200',
    'red': 'bg-red-50 text-red-700 border-red-200',
    'purple': 'bg-purple-50 text-purple-700 border-purple-200',
    'gold': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'dark-blue': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border ${color ? `border-${color}-100` : 'border-gray-200'}`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

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
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <p className="text-yellow-700 font-medium flex items-center">
            <span className="mr-2">⚠️</span> 
            Server connection issues detected. Dashboard data may not be available.
          </p>
        </div>
      )}
      
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stat cards in grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Users" 
              value={stats?.userStats.total || 0}
              icon={<Users size={20} />}
              color="blue"
            />
            <StatCard 
              title="Premium Members" 
              value={stats?.userStats.premium || 0}
              icon={<DollarSign size={20} />} 
              color="gold"
            />
            <StatCard 
              title="Active Users" 
              value={stats?.userStats.active || 0}
              icon={<UserCheck size={20} />}
              color="green"
            />
            <StatCard 
              title="Total Listings" 
              value={stats?.listingStats.total || 0}
              icon={<Briefcase size={20} />}
              color="purple"
            />
          </section>

          {/* Secondary stats row */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Referrals" 
              value={stats?.referralStats?.total || 0}
              icon={<Share2 size={20} />}
              color="blue"
            />
            <StatCard 
              title="Completed Referrals" 
              value={stats?.referralStats?.completed || 0}
              icon={<UserCheck size={20} />}
              color="green"
            />
            <StatCard 
              title="Deactivated Users" 
              value={(stats?.userStats.deactivated || 0) + (stats?.userStats.suspended || 0)}
              icon={<UserX size={20} />}
              color="red"
            />
            <StatCard 
              title="Admin Users" 
              value={stats?.userStats.admins || 0}
              icon={<Shield size={20} />}
              color="dark-blue"
            />
          </section>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent users section */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Recent Users</h3>
              </div>
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentUsers.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phoneNumber}</td>
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
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.accountStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">No recent users found</div>
              )}
            </div>
            
            {/* Listings by category */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Listings by Category</h3>
              </div>
              <div className="p-6">
                {stats?.listingStats.byCategory && 
                 Object.keys(stats.listingStats.byCategory).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.listingStats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, (count / stats.listingStats.total) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="ml-4 min-w-[100px] flex items-center justify-between">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No listing categories found</div>
                )}
              </div>
            </div>
          </div>

          {/* Referral Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Referrers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800">Top Referrers</h3>
                <Link to="/admin/referrals" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All →
                </Link>
              </div>
              {stats?.topReferrers && stats.topReferrers.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {stats.topReferrers.slice(0, 5).map((user, index) => (
                    <div key={user._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.referralCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{user.referralStats?.successfulReferrals || 0}</p>
                        <p className="text-xs text-gray-500">referrals</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">No referrers found</div>
              )}
            </div>

            {/* Recent Referral Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Recent Referral Activity</h3>
              </div>
              {stats?.recentReferrals && stats.recentReferrals.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {stats.recentReferrals.slice(0, 5).map((referral) => (
                    <div key={referral._id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {referral.referrer?.name} → {referral.referred?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(referral.referralDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : referral.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {referral.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">No recent referral activity</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent users section */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Recent Users</h3>
              </div>
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentUsers.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phoneNumber}</td>
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
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.accountStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">No recent users found</div>
              )}
            </div>
            
            {/* Listings by category */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Listings by Category</h3>
              </div>
              <div className="p-6">
                {stats?.listingStats.byCategory && 
                 Object.keys(stats.listingStats.byCategory).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.listingStats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, (count / stats.listingStats.total) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="ml-4 min-w-[100px] flex items-center justify-between">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No listing categories found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
