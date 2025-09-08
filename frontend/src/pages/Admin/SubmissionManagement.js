import {
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Eye,
    FileText,
    Search,
    Trash2,
    Users,
    XCircle
} from 'lucide-react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import { AuthContext } from '../../context/AuthContext';

const SubmissionManagement = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { api } = useContext(AuthContext);

  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);

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
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== 'all' ? statusFilter : '',
        search: searchTerm,
        sortBy: sortBy
      });

      const response = await api.get(`/submissions/${formId}?${params}`);
      setSubmissions(response.data.submissions);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages
      }));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [api, formId, pagination.page, pagination.limit, statusFilter, searchTerm, sortBy]);

  useEffect(() => {
    fetchForm();
    fetchSubmissions();
  }, [fetchForm, fetchSubmissions]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.get(`/submissions/${formId}/export`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${form?.title || 'form'}_submissions_${new Date().toISOString().split('T')[0]}.csv`);
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

  const handleStatusUpdate = async (submissionId, newStatus) => {
    try {
      await api.put(`/submissions/${submissionId}/status`, { status: newStatus });
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update submission status');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedSubmissions.length === 0) return;

    try {
      await api.post(`/submissions/bulk-action`, {
        submissionIds: selectedSubmissions,
        action: action
      });
      
      setSelectedSubmissions([]);
      fetchSubmissions();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action');
    }
  };

  const handleDelete = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;

    try {
      await api.delete(`/submissions/${submissionId}`);
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      setError('Failed to delete submission');
    }
  };

  const toggleSubmissionSelection = (submissionId) => {
    setSelectedSubmissions(prev => {
      if (prev.includes(submissionId)) {
        return prev.filter(id => id !== submissionId);
      } else {
        return [...prev, submissionId];
      }
    });
  };

  const selectAllSubmissions = () => {
    if (selectedSubmissions.length === submissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(submissions.map(s => s._id));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    );
  };

  const formatFieldValue = (field, value) => {
    if (!value) return '-';
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (field.type === 'file' && typeof value === 'string') {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          View File
        </a>
      );
    }
    
    if (field.type === 'rating') {
      return `${value}/5 ⭐`;
    }
    
    return String(value);
  };

  if (loading && !submissions.length) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading submissions...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
            {form && (
              <p className="text-gray-600 mt-1">
                {form.title} • {pagination.total} submissions
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/admin/forms/${formId}/analytics`)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <FileText size={20} className="mr-2" />
              Analytics
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || pagination.total === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Download size={20} className="mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Users size={24} className="text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Clock size={24} className="text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {submissions.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle size={24} className="text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {submissions.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <XCircle size={24} className="text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {submissions.filter(s => s.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="user">By User</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedSubmissions.length > 0 && (
            <div className="p-4 bg-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedSubmissions.length} submission(s) selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Approve Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Reject Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedSubmissions.length === submissions.length && submissions.length > 0}
                      onChange={selectAllSubmissions}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
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
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission._id)}
                        onChange={() => toggleSubmissionSelection(submission._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.user?.name || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.user?.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1" />
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(submission.submittedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {form?.fields.slice(0, 2).map(field => {
                          const value = submission.formData[field.id];
                          return (
                            <div key={field.id} className="truncate">
                              <strong>{field.label}:</strong> {formatFieldValue(field, value)}
                            </div>
                          );
                        })}
                        {form?.fields.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{form.fields.length - 2} more fields
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/admin/submissions/${submission._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {submission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(submission._id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(submission._id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleDelete(submission._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submissions.length === 0 && !loading && (
            <div className="p-8 text-center">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No one has submitted this form yet'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === pagination.totalPages || Math.abs(page - pagination.page) <= 2)
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-3 py-1 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                          className={`px-3 py-1 border rounded text-sm ${
                            page === pagination.page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SubmissionManagement;
