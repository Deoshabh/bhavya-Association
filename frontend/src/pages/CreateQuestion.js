import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  X, 
  Plus, 
  Minus, 
  AlertCircle,
  HelpCircle,
  MessageSquare,
  BarChart3,
  ThumbsUp
} from 'lucide-react';
import api from '../services/api';
import BackButton from '../components/BackButton';

const CreateQuestion = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'question',
    category: 'general',
    tags: [''],
    priority: 'normal',
    pollOptions: ['', ''],
    allowMultipleVotes: false,
    pollExpiresAt: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'general', label: 'General', icon: '💬' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'technology', label: 'Technology', icon: '💻' },
    { value: 'health', label: 'Health', icon: '🏥' },
    { value: 'social', label: 'Social', icon: '👥' },
    { value: 'politics', label: 'Politics', icon: '🏛️' },
    { value: 'culture', label: 'Culture', icon: '🎭' },
    { value: 'other', label: 'Other', icon: '🔗' }
  ];

  const types = [
    { 
      value: 'question', 
      label: 'Question', 
      icon: HelpCircle, 
      description: 'Ask a question to get specific answers from the community' 
    },
    { 
      value: 'discussion', 
      label: 'Discussion', 
      icon: MessageSquare, 
      description: 'Start an open discussion on a topic' 
    },
    { 
      value: 'poll', 
      label: 'Poll', 
      icon: BarChart3, 
      description: 'Create a poll to gather community opinions' 
    },
    { 
      value: 'opinion', 
      label: 'Opinion', 
      icon: ThumbsUp, 
      description: 'Share your thoughts and get feedback' 
    }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600 bg-blue-50' },
    { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-50' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagChange = (index, value) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  const addTag = () => {
    if (formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, ''] }));
    }
  };

  const removeTag = (index) => {
    if (formData.tags.length > 1) {
      const newTags = formData.tags.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, tags: newTags }));
    }
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...formData.pollOptions];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, pollOptions: newOptions }));
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
      setFormData(prev => ({ ...prev, pollOptions: newOptions }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (formData.type === 'poll') {
      const validOptions = formData.pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        setError('Polls must have at least 2 options');
        return;
      }
      if (!formData.pollExpiresAt) {
        setError('Poll expiration date is required');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const submitData = {
        ...formData,
        tags: formData.tags.filter(tag => tag.trim()),
        pollOptions: formData.type === 'poll' 
          ? formData.pollOptions.filter(opt => opt.trim()).map(opt => ({ option: opt }))
          : undefined
      };

      const response = await api.post('/questions', submitData);
      
      // Navigate to the created question
      navigate(`/questions/${response.data.question._id}`);
    } catch (error) {
      console.error('Error creating question:', error);
      setError(error.response?.data?.message || 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BackButton />
          
          <div className="bg-white rounded-lg shadow-sm mt-6">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
              <p className="text-gray-600 mt-1">
                Share your questions, start discussions, or create polls with the community
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* Post Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Post Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {types.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <label
                        key={type.value}
                        className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
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
                        <IconComponent className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </label>
                    );
                  })}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a clear, descriptive title..."
                  maxLength="200"
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  {formData.title.length}/200 characters
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
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide detailed information about your question, discussion topic, or opinion..."
                  maxLength="2000"
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  {formData.content.length}/2000 characters
                </div>
              </div>

              {/* Poll Options (only show for polls) */}
              {formData.type === 'poll' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Options *
                  </label>
                  <div className="space-y-2">
                    {formData.pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handlePollOptionChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${index + 1}`}
                          maxLength="100"
                        />
                        {formData.pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removePollOption(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {formData.pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={addPollOption}
                      className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </button>
                  )}

                  <div className="mt-4 flex items-center">
                    <input
                      type="checkbox"
                      id="allowMultipleVotes"
                      name="allowMultipleVotes"
                      checked={formData.allowMultipleVotes}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowMultipleVotes" className="ml-2 text-sm text-gray-700">
                      Allow multiple votes per person
                    </label>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="pollExpiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                      Poll Expires At *
                    </label>
                    <input
                      type="datetime-local"
                      id="pollExpiresAt"
                      name="pollExpiresAt"
                      value={formData.pollExpiresAt}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Optional)
                </label>
                <div className="space-y-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => handleTagChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Tag ${index + 1}`}
                        maxLength="30"
                      />
                      {formData.tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {formData.tags.length < 5 && (
                  <button
                    type="button"
                    onClick={addTag}
                    className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Tag
                  </button>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorities.map((priority) => (
                    <label
                      key={priority.value}
                      className={`px-3 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${
                        formData.priority === priority.value
                          ? priority.color + ' ring-2 ring-offset-2 ring-blue-500'
                          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={formData.priority === priority.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      {priority.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/questions')}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Post
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestion;
