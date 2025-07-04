import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import AdminLayout from '../../components/Admin/AdminLayout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  RefreshCw,
  Save,
  X
} from 'lucide-react';

const NewsManagement = () => {
  const { api } = useContext(AuthContext);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
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

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'news',
    status: 'draft',
    featured: false,
    eventDate: '',
    eventLocation: '',
    tags: ''
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const categories = [
    { value: 'news', label: 'News' },
    { value: 'event', label: 'Event' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'press-release', label: 'Press Release' },
    { value: 'photo-gallery', label: 'Photo Gallery' },
    { value: 'notice', label: 'Notice' }
  ];

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ];

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await api.get(`/news/admin/all?${params}`);
      setNews(response.data.news);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, [api, pagination.page, pagination.limit, filters]);

  // Fetch news data on component mount and when dependencies change
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.title || !formData.content || !formData.excerpt || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    // Event validation
    if (formData.category === 'event' && (!formData.eventDate || !formData.eventLocation)) {
      setError('Event date and location are required for events');
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields with explicit handling
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('excerpt', formData.excerpt);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('featured', formData.featured);
      
      if (formData.eventDate) {
        formDataToSend.append('eventDate', formData.eventDate);
      }
      if (formData.eventLocation) {
        formDataToSend.append('eventLocation', formData.eventLocation);
      }
      if (formData.tags) {
        formDataToSend.append('tags', formData.tags);
      }

      // Add image file if selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      console.log('📝 Submitting form data:', {
        title: formData.title,
        content: formData.content.substring(0, 100) + '...',
        excerpt: formData.excerpt,
        category: formData.category,
        status: formData.status,
        featured: formData.featured,
        hasImage: !!selectedImage
      });

      if (editingNews) {
        await api.put(`/news/${editingNews._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await api.post('/news', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setShowModal(false);
      setEditingNews(null);
      resetForm();
      fetchNews();
    } catch (error) {
      console.error('Error saving news:', error);
      setError('Failed to save news');
    }
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      excerpt: newsItem.excerpt,
      category: newsItem.category,
      status: newsItem.status,
      featured: newsItem.featured,
      eventDate: newsItem.eventDate ? new Date(newsItem.eventDate).toISOString().split('T')[0] : '',
      eventLocation: newsItem.eventLocation || '',
      tags: newsItem.tags ? newsItem.tags.join(', ') : ''
    });
    
    // Set existing image preview
    if (newsItem.image) {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://api.bhavyasangh.com';
      setImagePreview(`${baseUrl}${newsItem.image}`);
    } else {
      setImagePreview(null);
    }
    
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await api.delete(`/news/${id}`);
        fetchNews();
      } catch (error) {
        console.error('Error deleting news:', error);
        setError('Failed to delete news');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'news',
      status: 'draft',
      featured: false,
      eventDate: '',
      eventLocation: '',
      tags: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">News & Events Management</h1>
          <button
            onClick={() => {
              resetForm();
              setEditingNews(null);
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" />
            Add News/Event
          </button>
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
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Search news..."
                />
              </div>
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
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
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
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchNews}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* News List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading news...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {news.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.image && (
                            <div className="w-10 h-10 mr-3 flex-shrink-0">
                              <img
                                src={`${process.env.REACT_APP_API_URL || 'https://api.bhavyasangh.com'}${item.image}`}
                                alt={item.title}
                                className="w-10 h-10 object-cover rounded"
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.title}
                              {item.featured && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                  Featured
                                </span>
                              )}
                              {item.image && (
                                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                  📷 Image
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.excerpt.substring(0, 80)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {categories.find(c => c.value === item.category)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(item.status)}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye size={14} className="mr-1" />
                          {item.views || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 hover:text-red-900"
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
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingNews ? 'Edit News/Event' : 'Add News/Event'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt *
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                  maxLength="300"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.excerpt.length}/300 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="8"
                  required
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <div className="space-y-3">
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, GIF. Max size: 10MB
                  </p>
                </div>
              </div>

              {formData.category === 'event' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={formData.category === 'event'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Location *
                    </label>
                    <input
                      type="text"
                      value={formData.eventLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={formData.category === 'event'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                  Featured (will be highlighted)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Save size={16} className="mr-2" />
                  {editingNews ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default NewsManagement;
