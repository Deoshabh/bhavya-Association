import React, { useState, useEffect } from 'react';
import {
  Users, Award, TrendingUp, Eye, Search,
  RefreshCw, Download, Gift, AlertCircle,
  CheckCircle, Clock, XCircle, Star, Crown, Trophy, Zap
} from 'lucide-react';

const AdminReferralDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    status: '',
    period: 'month',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchAnalytics();
      await fetchReferrals();
      await fetchLeaderboard();
    };
    loadData();
  }, [filters.period, filters.status, filters.search, filters.dateFrom, filters.dateTo, pagination.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/referrals/analytics?period=${filters.period}`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching referral analytics:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      
      const response = await fetch(`/api/admin/referrals?${queryParams}`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      setReferrals(data.referrals);
      setPagination(prev => ({ ...prev, total: data.pagination.total }));
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/referrals/leaderboard?limit=20', {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const updateReferralStatus = async (referralId, status, rewardGiven = null) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/referrals/${referralId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ status, rewardGiven })
      });
      fetchReferrals();
      fetchAnalytics();
    } catch (error) {
      console.error('Error updating referral:', error);
    }
  };

  const regenerateReferralCode = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/referrals/regenerate-code/${userId}`, {
        method: 'POST',
        headers: { 'x-auth-token': token }
      });
      fetchReferrals();
    } catch (error) {
      console.error('Error regenerating referral code:', error);
    }
  };

  const grantManualReward = async (userId, rewardType, reason) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/referrals/manual-reward/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ rewardType, reason })
      });
      fetchLeaderboard();
      fetchAnalytics();
    } catch (error) {
      console.error('Error granting manual reward:', error);
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'diamond': return <Crown className="w-4 h-4 text-blue-600" />;
      case 'platinum': return <Trophy className="w-4 h-4 text-purple-600" />;
      case 'gold': return <Award className="w-4 h-4 text-yellow-600" />;
      case 'silver': return <Star className="w-4 h-4 text-gray-500" />;
      default: return <Zap className="w-4 h-4 text-orange-600" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'diamond': return 'bg-blue-100 text-blue-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
            <p className="text-gray-600">Monitor and manage the referral system</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'referrals', name: 'All Referrals', icon: Users },
              { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
              { id: 'analytics', name: 'Analytics', icon: Eye }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Total Referrals</p>
                      <p className="text-2xl font-bold text-blue-900">{analytics.overallStats.totalReferrals}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Completed</p>
                      <p className="text-2xl font-bold text-green-900">{analytics.overallStats.completedReferrals}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-yellow-900">{analytics.overallStats.conversionRate}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Gift className="w-8 h-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Rewards Given</p>
                      <p className="text-2xl font-bold text-purple-900">{analytics.overallStats.rewardsGiven}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tier Distribution */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Tier Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {analytics.tierDistribution.map(tier => (
                    <div key={tier._id} className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor(tier._id)}`}>
                        {getTierIcon(tier._id)}
                        <span className="ml-1 capitalize">{tier._id}</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{tier.count}</p>
                      <p className="text-sm text-gray-600">{tier.totalReferrals} referrals</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Referrers Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Referrers</h3>
                <div className="space-y-2">
                  {analytics.topReferrers.slice(0, 5).map((user, index) => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.referralCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getTierColor(user.referralPerks.currentTier)}`}>
                          {getTierIcon(user.referralPerks.currentTier)}
                          <span className="ml-1 capitalize">{user.referralPerks.currentTier}</span>
                        </div>
                        <p className="text-sm font-medium mt-1">{user.referralStats.successfulReferrals} referrals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        placeholder="Search users..."
                        className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Referrals Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referrer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referred User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {referrals.map(referral => (
                      <tr key={referral._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{referral.referrer.name}</div>
                            <div className="text-sm text-gray-500">{referral.referrer.referralCode}</div>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getTierColor(referral.referrer.referralPerks?.currentTier)}`}>
                              {getTierIcon(referral.referrer.referralPerks?.currentTier)}
                              <span className="ml-1 capitalize">{referral.referrer.referralPerks?.currentTier}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{referral.referred.name}</div>
                            <div className="text-sm text-gray-500">{referral.referred.phoneNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(referral.status)}
                            <span className="ml-2 text-sm capitalize">{referral.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            referral.rewardGiven ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {referral.rewardGiven ? 'Given' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {referral.status === 'pending' && (
                              <button
                                onClick={() => updateReferralStatus(referral._id, 'completed')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Complete
                              </button>
                            )}
                            {!referral.rewardGiven && referral.status === 'completed' && (
                              <button
                                onClick={() => updateReferralStatus(referral._id, referral.status, true)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Give Reward
                              </button>
                            )}
                            <button
                              onClick={() => regenerateReferralCode(referral.referrer._id)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Regen Code
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Successful Referrals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Referrals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.map((user, index) => (
                      <tr key={user._id} className={index < 3 ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {index < 3 && (
                              <Trophy className={`w-5 h-5 mr-2 ${
                                index === 0 ? 'text-yellow-500' : 
                                index === 1 ? 'text-gray-400' : 'text-orange-500'
                              }`} />
                            )}
                            <span className="text-lg font-bold">{index + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.referralCode}</div>
                            <div className="text-xs text-gray-400">Joined {user.joinedDaysAgo} days ago</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor(user.referralPerks.currentTier)}`}>
                            {getTierIcon(user.referralPerks.currentTier)}
                            <span className="ml-1 capitalize">{user.referralPerks.currentTier}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-green-600">
                          {user.referralStats.successfulReferrals}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.referralStats.totalReferrals}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => grantManualReward(user._id, 'bonus_referral', 'Admin bonus')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Bonus
                            </button>
                            <button
                              onClick={() => grantManualReward(user._id, 'special_badge', 'Admin recognition')}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Badge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <label className="text-sm font-medium text-gray-700">Period:</label>
                <select
                  value={filters.period}
                  onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Daily Trends */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Daily Referral Trends</h3>
                <div className="space-y-2">
                  {analytics.dailyTrends.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm">{day._id.month}/{day._id.day}/{day._id.year}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-blue-600">{day.count} total</span>
                        <span className="text-sm text-green-600">{day.completed} completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Analysis */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Referral Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analytics.sourceAnalysis.map((source, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg">
                      <h4 className="font-medium capitalize">{source._id || 'Direct'}</h4>
                      <p className="text-2xl font-bold text-blue-600">{source.count}</p>
                      <p className="text-sm text-gray-600">{source.completed} completed</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReferralDashboard;
