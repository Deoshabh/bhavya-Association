import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MessageCircle, 
  Heart, 
  Eye, 
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  BarChart3
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import BackButton from '../components/BackButton';

const QuestionsAnswers = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [questions, setQuestions] = useState([]);
  const [trendingQuestions, setTrendingQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    type: searchParams.get('type') || '',
    search: searchParams.get('search') || '',
    status: 'active',
    featured: searchParams.get('featured') || ''
  });
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [activeTab, setActiveTab] = useState('all');

  // Categories and types
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

  useEffect(() => {
    fetchQuestions();
    if (activeTab === 'trending') {
      fetchTrendingQuestions();
    }
  }, [filters, pagination.page, activeTab]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sort: activeTab === 'trending' ? '-createdAt' : '-createdAt'
      });

      const response = await api.get(`/questions?${params}`);
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

  const fetchTrendingQuestions = async () => {
    try {
      const response = await api.get('/questions/trending?limit=10');
      setTrendingQuestions(response.data.questions);
    } catch (error) {
      console.error('Error fetching trending questions:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    updateURL(newFilters, 1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  const updateURL = (newFilters, page) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (page > 1) params.set('page', page);
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    updateURL(filters, newPage);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'general': 'bg-gray-100 text-gray-800',
      'business': 'bg-blue-100 text-blue-800',
      'education': 'bg-green-100 text-green-800',
      'technology': 'bg-purple-100 text-purple-800',
      'health': 'bg-red-100 text-red-800',
      'social': 'bg-pink-100 text-pink-800',
      'politics': 'bg-orange-100 text-orange-800',
      'culture': 'bg-indigo-100 text-indigo-800',
      'other': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
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

  const QuestionCard = ({ question }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTypeIcon(question.type)}</span>
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(question.category)}`}>
              {question.category}
            </span>
            {question.featured && (
              <span className="ml-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                Featured
              </span>
            )}
          </div>
        </div>
        {question.bestAnswer && (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
      </div>

      <Link 
        to={`/questions/${question.slug || question._id}`}
        className="block group"
      >
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
          {question.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {question.content}
        </p>
      </Link>

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
          {question.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{question.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Poll Results Preview */}
      {question.type === 'poll' && question.pollOptions && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Poll</span>
            <span>{question.totalVotes} votes</span>
          </div>
          <div className="space-y-1">
            {question.pollOptions.slice(0, 2).map((option, index) => (
              <div key={index} className="text-xs text-gray-700">
                • {option.option}
              </div>
            ))}
            {question.pollOptions.length > 2 && (
              <div className="text-xs text-gray-500">
                +{question.pollOptions.length - 2} more options
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats and Author */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
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
        <div className="flex items-center space-x-2">
          <img
            src={question.author?.profileImage || '/default-avatar.png'}
            alt={question.author?.name}
            className="w-6 h-6 rounded-full"
          />
          <span>{question.author?.name}</span>
          <span>•</span>
          <span>{formatDate(question.createdAt)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Questions & Answers</h1>
                <p className="text-gray-600 mt-2">
                  Ask questions, share knowledge, and participate in discussions with the community
                </p>
              </div>
              {user && (
                <Link
                  to="/create-question"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ask Question
                </Link>
              )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Questions
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'trending'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Trending
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Filter className="w-5 h-5 inline mr-2" />
                  Filters
                </h3>

                {/* Search */}
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Search
                  </button>
                </form>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {types.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Featured Filter */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.featured === 'true'}
                      onChange={(e) => handleFilterChange('featured', e.target.checked ? 'true' : '')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured only</span>
                  </label>
                </div>

                {/* Quick Stats */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Questions</span>
                      <span>{pagination.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg p-6 text-center">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={fetchQuestions}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : questions.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to ask a question in this category!
                  </p>
                  {user && (
                    <Link
                      to="/create-question"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Ask Question
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Questions List */}
                  <div className="space-y-4 mb-6">
                    {(activeTab === 'trending' ? trendingQuestions : questions).map(question => (
                      <QuestionCard key={question._id} question={question} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 border rounded-lg ${
                                pagination.page === page
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
      </div>
    </div>
  );
};

export default QuestionsAnswers;
