import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Star,
  MessageCircle,
  Heart,
  Search,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AdminQuestions = () => {
  const { user } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      if (user && user.planType === 'admin') {
        try {
          setLoading(true);
          const params = new URLSearchParams({
            page: currentPage,
            limit: 20,
            search: searchTerm,
            status: statusFilter !== 'all' ? statusFilter : '',
            type: typeFilter !== 'all' ? typeFilter : '',
            category: categoryFilter !== 'all' ? categoryFilter : '',
            sortBy: sortBy
          });

          const response = await api.get(`/admin/questions?${params}`);
          setQuestions(response.data.questions);
          setTotalPages(response.data.totalPages);
        } catch (error) {
          console.error('Error fetching questions:', error);
          setError('Failed to load questions');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadQuestions();
  }, [user, currentPage, searchTerm, statusFilter, typeFilter, categoryFilter, sortBy]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        type: typeFilter !== 'all' ? typeFilter : '',
        category: categoryFilter !== 'all' ? categoryFilter : '',
        sortBy: sortBy
      });

      const response = await api.get(`/admin/questions?${params}`);
      setQuestions(response.data.questions);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (questionId, newStatus) => {
    try {
      await api.put(`/admin/questions/${questionId}/status`, { status: newStatus });
      
      setQuestions(questions.map(q => 
        q._id === questionId ? { ...q, status: newStatus } : q
      ));
      
      alert(`Question ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating question status:', error);
      alert('Failed to update question status');
    }
  };

  const handleFeaturedToggle = async (questionId, currentFeatured) => {
    try {
      await api.put(`/admin/questions/${questionId}/featured`, { 
        featured: !currentFeatured 
      });
      
      setQuestions(questions.map(q => 
        q._id === questionId ? { ...q, featured: !currentFeatured } : q
      ));
      
      alert(`Question ${!currentFeatured ? 'featured' : 'unfeatured'} successfully!`);
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status');
    }
  };

  const handleDelete = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/questions/${questionId}`);
        setQuestions(questions.filter(q => q._id !== questionId));
        alert('Question deleted successfully!');
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedQuestions.length === 0) {
      alert('Please select questions first');
      return;
    }

    const confirmMessage = {
      'approve': 'Are you sure you want to approve selected questions?',
      'reject': 'Are you sure you want to reject selected questions?',
      'delete': 'Are you sure you want to delete selected questions? This action cannot be undone.',
      'feature': 'Are you sure you want to feature selected questions?'
    };

    if (window.confirm(confirmMessage[action])) {
      try {
        await api.post('/admin/questions/bulk-action', {
          questionIds: selectedQuestions,
          action: action
        });
        
        await fetchQuestions();
        setSelectedQuestions([]);
        setShowBulkActions(false);
        alert(`Bulk ${action} completed successfully!`);
      } catch (error) {
        console.error('Error performing bulk action:', error);
        alert(`Failed to perform bulk ${action}`);
      }
    }
  };

  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        const newSelection = prev.filter(id => id !== questionId);
        if (newSelection.length === 0) {
          setShowBulkActions(false);
        }
        return newSelection;
      } else {
        setShowBulkActions(true);
        return [...prev, questionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
      setShowBulkActions(false);
    } else {
      setSelectedQuestions(questions.map(q => q._id));
      setShowBulkActions(true);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'question': return '❓';
      case 'discussion': return '💬';
      case 'poll': return '📊';
      case 'opinion': return '💭';
      default: return '❓';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (!user || user.planType !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Questions</h1>
                <p className="text-gray-600 mt-2">Moderate and manage community questions</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  to="/ask-question"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Question
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Questions</h3>
                  <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {questions.filter(q => q.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Active</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {questions.filter(q => q.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Featured</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {questions.filter(q => q.featured).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="question">Questions</option>
                <option value="discussion">Discussions</option>
                <option value="poll">Polls</option>
                <option value="opinion">Opinions</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="business">Business</option>
                <option value="education">Education</option>
                <option value="technology">Technology</option>
                <option value="health">Health</option>
                <option value="social">Social</option>
                <option value="politics">Politics</option>
                <option value="culture">Culture</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-liked">Most Liked</option>
                <option value="most-answers">Most Answers</option>
                <option value="trending">Trending</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  {selectedQuestions.length} question(s) selected
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleBulkAction('feature')}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                  >
                    Feature
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setSelectedQuestions([]);
                      setShowBulkActions(false);
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading questions...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-600">No questions match your current filters.</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.length === questions.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-4 flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
                      <div className="col-span-4">Question</div>
                      <div className="col-span-2">Author</div>
                      <div className="col-span-1">Type</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-1">Priority</div>
                      <div className="col-span-2">Stats</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                  </div>
                </div>

                {/* Questions */}
                <div className="divide-y divide-gray-200">
                  {questions.map(question => (
                    <div key={question._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question._id)}
                          onChange={() => handleSelectQuestion(question._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                        />
                        <div className="ml-4 flex-1 grid grid-cols-12 gap-4">
                          {/* Question */}
                          <div className="col-span-4">
                            <div className="flex items-start space-x-3">
                              <span className="text-2xl">{getTypeIcon(question.type)}</span>
                              <div>
                                <Link
                                  to={`/questions/${question._id}`}
                                  className="text-lg font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                                >
                                  {question.title}
                                </Link>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {question.content}
                                </p>
                                <div className="flex items-center mt-2 space-x-2">
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {question.category}
                                  </span>
                                  {question.featured && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                                      Featured
                                    </span>
                                  )}
                                  {question.tags && question.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Author */}
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              <img
                                src={question.author?.profileImage || '/default-avatar.png'}
                                alt={question.author?.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {question.author?.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(question.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Type */}
                          <div className="col-span-1">
                            <span className="capitalize text-sm text-gray-600">
                              {question.type}
                            </span>
                          </div>

                          {/* Status */}
                          <div className="col-span-1">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
                              {question.status}
                            </span>
                          </div>

                          {/* Priority */}
                          <div className="col-span-1">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(question.priority)}`}>
                              {question.priority}
                            </span>
                          </div>

                          {/* Stats */}
                          <div className="col-span-2">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-4 h-4" />
                                <span>{question.likeCount || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{question.answerCount || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span>{question.views || 0}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1">
                            <div className="flex items-center space-x-2">
                              {question.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(question._id, 'active')}
                                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(question._id, 'rejected')}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => handleFeaturedToggle(question._id, question.featured)}
                                className={`p-1 rounded ${
                                  question.featured 
                                    ? 'text-yellow-600 hover:bg-yellow-100' 
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title={question.featured ? 'Unfeature' : 'Feature'}
                              >
                                <Star className={`w-4 h-4 ${question.featured ? 'fill-current' : ''}`} />
                              </button>
                              
                              <Link
                                to={`/questions/${question._id}`}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              
                              <Link
                                to={`/questions/${question._id}/edit`}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              
                              <button
                                onClick={() => handleDelete(question._id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestions;
