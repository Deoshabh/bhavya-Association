import {
    BarChart3,
    Calendar,
    Copy,
    Edit3,
    Plus,
    Search,
    Settings,
    Trash2,
    Users
} from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import { AuthContext } from '../../context/AuthContext';

const FormManagement = () => {
  const { api } = useContext(AuthContext);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'survey', label: 'Survey' },
    { value: 'registration', label: 'Registration' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'contact', label: 'Contact' },
    { value: 'poll', label: 'Poll' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'application', label: 'Application' },
    { value: 'other', label: 'Other' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' }
  ];

  useEffect(() => {
    fetchForms();
  }, [filters, pagination.page]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await api.get(`/forms/admin/all?${params}`);
      setForms(response.data.forms);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching forms:', error);
      setError('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        await api.delete(`/forms/${id}`);
        fetchForms();
      } catch (error) {
        console.error('Error deleting form:', error);
        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else {
          setError('Failed to delete form');
        }
      }
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/forms/${id}`, { status: newStatus });
      fetchForms();
    } catch (error) {
      console.error('Error updating form status:', error);
      setError('Failed to update form status');
    }
  };

  const copyFormLink = (slug) => {
    const link = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
    alert('Form link copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`;
  };

  const getCategoryBadge = (category) => {
    const colors = {
      survey: 'bg-blue-100 text-blue-800',
      registration: 'bg-purple-100 text-purple-800',
      feedback: 'bg-green-100 text-green-800',
      contact: 'bg-orange-100 text-orange-800',
      poll: 'bg-pink-100 text-pink-800',
      quiz: 'bg-indigo-100 text-indigo-800',
      application: 'bg-cyan-100 text-cyan-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[category] || colors.other}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Form Management</h1>
          <Link
            to="/admin/forms/create"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Create Form
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Search forms..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ status: '', category: '', search: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Forms Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading forms...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 text-lg">No forms found</div>
              <p className="text-gray-400 mt-2">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters' 
                  : 'Create your first form to get started'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forms.map((form) => (
                    <tr key={form._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {form.title}
                          </div>
                          {form.description && (
                            <div className="text-sm text-gray-500">
                              {form.description.substring(0, 100)}
                              {form.description.length > 100 && '...'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getCategoryBadge(form.category)}>
                          {categories.find(c => c.value === form.category)?.label || form.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(form.status)}>
                          {form.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Users size={16} className="mr-1 text-gray-400" />
                          {form.submissionCount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          {formatDate(form.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/admin/forms/${form._id}/submissions`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Submissions"
                          >
                            <BarChart3 size={16} />
                          </Link>
                          
                          <button
                            onClick={() => copyFormLink(form.slug)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Copy Form Link"
                          >
                            <Copy size={16} />
                          </button>
                          
                          <Link
                            to={`/admin/forms/${form._id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Form"
                          >
                            <Edit3 size={16} />
                          </Link>
                          
                          <button
                            onClick={() => handleStatusToggle(form._id, form.status)}
                            className={`${
                              form.status === 'active' 
                                ? 'text-yellow-600 hover:text-yellow-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={form.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            <Settings size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(form._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Form"
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
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default FormManagement;
