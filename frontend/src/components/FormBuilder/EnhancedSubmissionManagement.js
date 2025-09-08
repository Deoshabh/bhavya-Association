import {
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    Calendar,
    CheckCircle, Clock,
    Download, Eye,
    FileText,
    PieChart,
    RefreshCw,
    Search,
    TrendingDown,
    TrendingUp,
    Users,
    XCircle
} from 'lucide-react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminLayout from '../Admin/AdminLayout';

const EnhancedSubmissionManagement = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { api } = useContext(AuthContext);

  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: '30d',
    sortBy: 'newest',
    page: 1,
    limit: 20
  });

  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table, cards, analytics

  const statusOptions = [
    { value: 'all', label: 'All Statuses', icon: FileText },
    { value: 'pending', label: 'Pending Review', icon: Clock },
    { value: 'reviewed', label: 'Reviewed', icon: Eye },
    { value: 'approved', label: 'Approved', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: XCircle },
    { value: 'spam', label: 'Spam', icon: AlertTriangle }
  ];

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'rating', label: 'Rating (high to low)' },
    { value: 'status', label: 'Status' }
  ];

  const fetchForm = useCallback(async () => {
    try {
      const response = await api.get(`/forms/admin/${formId}`);
      setForm(response.data.form);
    } catch (error) {
      console.error('Error fetching form:', error);
      setError('Failed to fetch form data');
    }
  }, [api, formId]);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        status: filters.status !== 'all' ? filters.status : '',
        search: filters.search,
        sort: filters.sortBy === 'newest' ? '-createdAt' : 
              filters.sortBy === 'oldest' ? 'createdAt' :
              filters.sortBy === 'rating' ? '-rating' : 'status'
      });

      const response = await api.get(`/submissions/form/${formId}?${queryParams}`);
      setSubmissions(response.data.submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [api, formId, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get(`/submissions/form/${formId}/stats?period=${filters.dateRange}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [api, formId, filters.dateRange]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [fetchSubmissions, fetchStats]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const queryParams = new URLSearchParams({
        status: filters.status !== 'all' ? filters.status : '',
        dateFrom: '', // Can be added based on date range
        dateTo: ''
      });

      const response = await api.get(`/submissions/form/${formId}/export?${queryParams}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${form?.title}_submissions.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting submissions:', error);
      setError('Failed to export submissions');
    } finally {
      setExporting(false);
    }
  };

  const handleStatusUpdate = async (submissionId, newStatus, reviewNotes = '') => {
    try {
      await api.put(`/submissions/${submissionId}/status`, {
        status: newStatus,
        reviewNotes
      });
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update submission status');
    }
  };

  const handleBulkAction = async (action, data = {}) => {
    try {
      await api.post('/submissions/bulk-action', {
        action,
        submissionIds: selectedSubmissions,
        ...data
      });
      setSelectedSubmissions([]);
      fetchSubmissions();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'spam': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
              <dd className="text-lg font-medium text-gray-900">{stats?.totalSubmissions || 0}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
              <dd className="text-lg font-medium text-gray-900">
                {stats?.statusBreakdown?.approved || 0}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
              <dd className="text-lg font-medium text-gray-900">
                {stats?.statusBreakdown?.pending || 0}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
              <dd className="text-lg font-medium text-gray-900">
                {stats?.statusBreakdown?.rejected || 0}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const FilterPanel = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Date Range */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow' : 'text-gray-600'}`}
              title="Table View"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-white shadow' : 'text-gray-600'}`}
              title="Card View"
            >
              <Calendar size={16} />
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`p-2 rounded ${viewMode === 'analytics' ? 'bg-white shadow' : 'text-gray-600'}`}
              title="Analytics View"
            >
              <BarChart3 size={16} />
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download size={16} className="mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={() => fetchSubmissions()}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSubmissions.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedSubmissions.length} submission(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('updateStatus', { status: 'approved' })}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('updateStatus', { status: 'rejected' })}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('flag', { flagReason: 'Bulk flagged' })}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Flag
              </button>
              <button
                onClick={() => setSelectedSubmissions([])}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const TableView = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedSubmissions.length === submissions.length && submissions.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSubmissions(submissions.map(s => s._id));
                    } else {
                      setSelectedSubmissions([]);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Preview
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => (
              <tr key={submission._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedSubmissions.includes(submission._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubmissions(prev => [...prev, submission._id]);
                      } else {
                        setSelectedSubmissions(prev => prev.filter(id => id !== submission._id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {submission.submittedBy?.name || submission.submitterInfo?.name || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.submittedBy?.email || submission.submitterInfo?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(submission.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {Object.entries(submission.data || {}).slice(0, 2).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value).substring(0, 50)}...
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => navigate(`/admin/submissions/${submission._id}`)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <select
                      value={submission.status}
                      onChange={(e) => handleStatusUpdate(submission._id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="spam">Spam</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {submissions.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );

  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {submissions.map((submission) => (
        <div key={submission._id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedSubmissions.includes(submission._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSubmissions(prev => [...prev, submission._id]);
                  } else {
                    setSelectedSubmissions(prev => prev.filter(id => id !== submission._id));
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                {submission.status}
              </span>
            </div>
            <button
              onClick={() => navigate(`/admin/submissions/${submission._id}`)}
              className="text-blue-600 hover:text-blue-900"
            >
              <Eye size={16} />
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {submission.submittedBy?.name || submission.submitterInfo?.name || 'Anonymous User'}
            </h3>
            <p className="text-sm text-gray-500">
              {submission.submittedBy?.email || submission.submitterInfo?.email || 'No email provided'}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Submitted: {formatDate(submission.createdAt)}</p>
            {submission.reviewedAt && (
              <p className="text-sm text-gray-600">
                Reviewed: {formatDate(submission.reviewedAt)}
              </p>
            )}
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Data Preview:</h4>
            <div className="space-y-1">
              {Object.entries(submission.data || {}).slice(0, 3).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className="ml-2 text-gray-900">{String(value).substring(0, 30)}...</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <select
              value={submission.status}
              onChange={(e) => handleStatusUpdate(submission._id, e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="spam">Spam</option>
            </select>
          </div>
        </div>
      ))}

      {submissions.length === 0 && (
        <div className="col-span-full text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-6">
      <StatsCards />
      
      {/* Charts would go here - for now showing placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submissions Over Time</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <PieChart size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Chart visualization coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Submitters */}
      {stats?.topSubmitters && stats.topSubmitters.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Submitters</h3>
          <div className="space-y-4">
            {stats.topSubmitters.map((submitter, index) => (
              <div key={submitter.user?._id || index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {submitter.user?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {submitter.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Last submission: {formatDate(submitter.lastSubmission)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{submitter.count} submissions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (loading && !form) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/forms')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {form?.title} - Submissions
              </h1>
              <p className="text-sm text-gray-600">
                Manage and analyze form submissions
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <AlertTriangle size={16} className="text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards (always shown) */}
        <StatsCards />

        {/* Filters */}
        <FilterPanel />

        {/* Content based on view mode */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {viewMode === 'table' && <TableView />}
            {viewMode === 'cards' && <CardView />}
            {viewMode === 'analytics' && <AnalyticsView />}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default EnhancedSubmissionManagement;
