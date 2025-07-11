import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import BackButton from '../components/BackButton';

const AskQuestion = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'question',
    category: 'general',
    tags: '',
    priority: 'normal',
    pollOptions: ['', ''],
    allowMultipleVotes: false,
    pollExpiresAt: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Categories and types
  const categories = [
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
    { value: 'question', label: 'Question', description: 'Ask for specific information or help' },
    { value: 'discussion', label: 'Discussion', description: 'Start a general discussion topic' },
    { value: 'poll', label: 'Poll', description: 'Create a poll with multiple options' },
    { value: 'opinion', label: 'Opinion', description: 'Share your thoughts and get feedback' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...formData.pollOptions];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      pollOptions: newOptions
    }));
  };

  const addPollOption = () => {
    if (formData.pollOptions.length < 6) {
      setFormData(prev => ({
        ...prev,
        pollOptions: [...prev.pollOptions, '']
      }));
    }
  };

  const removePollOption = (index) => {
    if (formData.pollOptions.length > 2) {
      const newOptions = formData.pollOptions.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        pollOptions: newOptions
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return false;
    }
    if (formData.type === 'poll') {
      const validOptions = formData.pollOptions.filter(option => option.trim().length > 0);
      if (validOptions.length < 2) {
        setError('Polls must have at least 2 options');
        return false;
      }
      if (!formData.pollExpiresAt) {
        setError('Poll expiration date is required');
        return false;
      }
      const expirationDate = new Date(formData.pollExpiresAt);
      if (expirationDate <= new Date()) {
        setError('Poll expiration date must be in the future');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        category: formData.category,
        priority: formData.priority
      };

      // Add tags if provided
      if (formData.tags.trim()) {
        submitData.tags = formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }

      // Add poll-specific data
      if (formData.type === 'poll') {
        submitData.pollOptions = formData.pollOptions
          .filter(option => option.trim().length > 0)
          .map(option => option.trim());
        submitData.allowMultipleVotes = formData.allowMultipleVotes;
        submitData.pollExpiresAt = formData.pollExpiresAt;
      }

      const response = await api.post('/questions', submitData);
      
      setSuccess('Question posted successfully!');
      
      // Redirect to the question page after a short delay
      setTimeout(() => {
        navigate(`/questions/${response.data.question.slug || response.data.question._id}`);
      }, 1500);

    } catch (error) {
      console.error('Error creating question:', error);
      setError(error.response?.data?.message || 'Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BackButton />
          
          <div className="bg-white rounded-lg shadow-sm p-8 mt-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask a Question</h1>
              <p className="text-gray-600">
                Share your question with the community and get helpful answers
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center">
                  <div className="w-5 h-5 text-green-600 mr-2">✓</div>
                  <p className="text-green-800">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type of Post
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {types.map(type => (
                    <label
                      key={type.value}
                      className={`relative p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.type === type.value && (
                            <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a clear, descriptive title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={200}
                  required
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {formData.title.length}/200
                </div>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Provide details about your question..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={2000}
                  required
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {formData.content.length}/2000
                </div>
              </div>

              {/* Poll Options (only for polls) */}
              {formData.type === 'poll' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Options *
                  </label>
                  <div className="space-y-3">
                    {formData.pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handlePollOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {formData.pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removePollOption(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.pollOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={addPollOption}
                        className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </button>
                    )}
                  </div>
                  
                  {/* Poll Settings */}
                  <div className="mt-4 space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="allowMultipleVotes"
                        checked={formData.allowMultipleVotes}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow multiple votes per user</span>
                    </label>
                    
                    <div>
                      <label htmlFor="pollExpiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                        Poll Expires At *
                      </label>
                      <input
                        type="datetime-local"
                        id="pollExpiresAt"
                        name="pollExpiresAt"
                        value={formData.pollExpiresAt}
                        onChange={handleInputChange}
                        min={getMinDateTime()}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Enter tags separated by commas (e.g., help, advice, urgent)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tags help categorize your question and make it easier to find
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/questions')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Posting...' : 'Post Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskQuestion;
