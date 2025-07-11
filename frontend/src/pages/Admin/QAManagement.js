import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Trash2, 
  MessageCircle, 
  Heart, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Clock
} from 'lucide-react';
import api from '../../services/api';

const QAManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('questions');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    status: '',
    priority: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeQuestions: 0,
    totalAnswers: 0,
    reportedContent: 0
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'technology', label: 'Technology' },
    { value: 'health', label: 'Health' },
    { value: 'social', label: 'Social' },
    { value: 'politics', label: 'Politics' },
    { value: 'culture', label: 'Culture' },
    { value: 'other', label: 'Other' }
  ];

  const types = [
    { value: '', label: 'All Types' },
    { value: 'question', label: 'Questions' },
    { value: 'discussion', label: 'Discussions' },
    { value: 'poll', label: 'Polls' },
    { value: 'opinion', label: 'Opinions' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' },
    { value: 'archived', label: 'Archived' },
    { value: 'reported', label: 'Reported' }
  ];

  const priorities = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  useEffect(() => {
    fetchStats();
    if (activeTab === 'questions') {
      fetchQuestions();
    } else {
      fetchAnswers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters, pagination.page]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/qa/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching Q&A stats:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      const response = await api.get(`/admin/questions?${params}`);
      setQuestions(response.data.questions);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search
      });

      const response = await api.get(`/admin/answers?${params}`);
      setAnswers(response.data.answers);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching answers:', error);
      setError('Failed to load answers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, type = 'question') => {
    try {
      const endpoint = type === 'question' ? `/admin/questions/${id}` : `/admin/answers/${id}`;
      await api.put(endpoint, { status: newStatus });
      
      if (activeTab === 'questions') {
        fetchQuestions();
      } else {
        fetchAnswers();
      }
      fetchStats();
    } catch (error) {
      console.error(`Error updating ${type} status:`, error);
    }
  };

  const handleDelete = async (id, type = 'question') => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      const endpoint = type === 'question' ? `/admin/questions/${id}` : `/admin/answers/${id}`;
      await api.delete(endpoint);
      
      if (activeTab === 'questions') {
        fetchQuestions();
      } else {
        fetchAnswers();
      }
      fetchStats();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  const handleFeatureToggle = async (id, featured) => {
    try {
      await api.put(`/admin/questions/${id}`, { featured: !featured });
      fetchQuestions();
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      archived: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      reported: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status] || statusConfig.active;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: 'bg-green-100 text-green-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[priority] || priorityConfig.normal}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Q&A Management</h1>
        <p className="text-gray-600">Manage questions, answers, and discussions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Questions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeQuestions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Answers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAnswers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reported Content</p>
              <p className="text-2xl font-bold text-gray-900">{stats.reportedContent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Questions
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'answers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Answers
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {activeTab === 'questions' && (
              <>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {types.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <>
              {activeTab === 'questions' ? (
                <div className="space-y-4">
                  {questions.map((question) => (
                    <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900">{question.title}</h3>
                            {question.featured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <span>By {question.author?.name || 'Unknown'}</span>
                            <span>{formatDate(question.createdAt)}</span>
                            <span className="capitalize">{question.type}</span>
                            <span className="capitalize">{question.category}</span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {question.answerCount || 0} answers
                            </div>
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {question.likeCount || 0} likes
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {question.views || 0} views
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getStatusBadge(question.status)}
                            {getPriorityBadge(question.priority)}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleFeatureToggle(question._id, question.featured)}
                            className={`p-2 rounded-md ${
                              question.featured
                                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={question.featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <Star className="h-4 w-4" />
                          </button>

                          <select
                            value={question.status}
                            onChange={(e) => handleStatusChange(question._id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                            <option value="archived">Archived</option>
                          </select>

                          <button
                            onClick={() => handleDelete(question._id, 'question')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {answers.map((answer) => (
                    <div key={answer._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm text-gray-500">Answer to:</span>
                            <span className="font-medium text-gray-900">{answer.question?.title}</span>
                            {answer.isBestAnswer && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          
                          <p className="text-gray-700 mb-2 line-clamp-2">{answer.content}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <span>By {answer.author?.name || 'Unknown'}</span>
                            <span>{formatDate(answer.createdAt)}</span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {answer.likeCount || 0} likes
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <select
                            value={answer.status}
                            onChange={(e) => handleStatusChange(answer._id, e.target.value, 'answer')}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="hidden">Hidden</option>
                            <option value="reported">Reported</option>
                          </select>

                          <button
                            onClick={() => handleDelete(answer._id, 'answer')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QAManagement;
