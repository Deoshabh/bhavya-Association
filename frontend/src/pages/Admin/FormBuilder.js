import {
    ArrowDown,
    ArrowUp,
    Copy,
    Eye,
    GripVertical,
    Save,
    Trash2
} from 'lucide-react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import { AuthContext } from '../../context/AuthContext';

const FormBuilder = () => {
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    status: 'draft',
    fields: [],
    settings: {
      allowMultipleSubmissions: false,
      requireLogin: true,
      submissionLimit: null,
      startDate: '',
      endDate: '',
      successMessage: 'Thank you for your submission!',
      redirectUrl: '',
      emailNotification: {
        enabled: false,
        recipients: [],
        subject: ''
      },
      captcha: false
    },
    tags: [],
    embedSettings: {
      allowedPosts: [],
      allowedQuestions: [],
      displayStyle: 'inline',
      showTitle: true,
      showDescription: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('builder');

  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'email', label: 'Email', icon: '📧' },
    { type: 'phone', label: 'Phone', icon: '📱' },
    { type: 'number', label: 'Number', icon: '🔢' },
    { type: 'textarea', label: 'Text Area', icon: '📄' },
    { type: 'select', label: 'Dropdown', icon: '📋' },
    { type: 'radio', label: 'Radio Buttons', icon: '⚪' },
    { type: 'checkbox', label: 'Checkboxes', icon: '☑️' },
    { type: 'date', label: 'Date', icon: '📅' },
    { type: 'time', label: 'Time', icon: '⏰' },
    { type: 'file', label: 'File Upload', icon: '📎' },
    { type: 'rating', label: 'Rating', icon: '⭐' },
    { type: 'url', label: 'URL', icon: '🔗' }
  ];

  const categories = [
    { value: 'survey', label: 'Survey' },
    { value: 'registration', label: 'Registration' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'contact', label: 'Contact' },
    { value: 'poll', label: 'Poll' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'application', label: 'Application' },
    { value: 'other', label: 'Other' }
  ];

  const fetchForm = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forms/admin/${id}`);
      setFormData(response.data.form);
    } catch (error) {
      console.error('Error fetching form:', error);
      setError('Failed to fetch form data');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (isEditing) {
      fetchForm();
    }
  }, [isEditing, fetchForm]);

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: `${fieldTypes.find(f => f.type === type)?.label || 'Field'}`,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ] : [],
      validation: {},
      helpText: '',
      defaultValue: '',
      order: formData.fields.length
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const duplicateField = (fieldId) => {
    const fieldToDuplicate = formData.fields.find(f => f.id === fieldId);
    if (fieldToDuplicate) {
      const newField = {
        ...fieldToDuplicate,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: `${fieldToDuplicate.label} (Copy)`,
        order: formData.fields.length
      };
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, newField]
      }));
    }
  };

  const moveField = (fieldId, direction) => {
    const fieldIndex = formData.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newFields = [...formData.fields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
      
      // Update order
      newFields.forEach((field, index) => {
        field.order = index;
      });

      setFormData(prev => ({
        ...prev,
        fields: newFields
      }));
    }
  };

  const addOption = (fieldId) => {
    const field = formData.fields.find(f => f.id === fieldId);
    if (field && field.options) {
      const newOption = {
        label: `Option ${field.options.length + 1}`,
        value: `option${field.options.length + 1}`
      };
      updateField(fieldId, {
        options: [...field.options, newOption]
      });
    }
  };

  const updateOption = (fieldId, optionIndex, updates) => {
    const field = formData.fields.find(f => f.id === fieldId);
    if (field && field.options) {
      const newOptions = [...field.options];
      newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
      updateField(fieldId, { options: newOptions });
    }
  };

  const removeOption = (fieldId, optionIndex) => {
    const field = formData.fields.find(f => f.id === fieldId);
    if (field && field.options && field.options.length > 1) {
      const newOptions = field.options.filter((_, index) => index !== optionIndex);
      updateField(fieldId, { options: newOptions });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.title.trim()) {
        setError('Form title is required');
        return;
      }

      if (formData.fields.length === 0) {
        setError('At least one field is required');
        return;
      }

      const endpoint = isEditing ? `/forms/${id}` : '/forms';
      const method = isEditing ? 'put' : 'post';

      await api[method](endpoint, formData);
      
      navigate('/admin/forms');
    } catch (error) {
      console.error('Error saving form:', error);
      setError(error.response?.data?.message || 'Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    // Open form preview in new tab
    const previewData = encodeURIComponent(JSON.stringify(formData));
    window.open(`/forms/preview?data=${previewData}`, '_blank');
  };

  const FieldEditor = ({ field }) => {
    const needsOptions = ['select', 'radio', 'checkbox'].includes(field.type);

    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <GripVertical size={16} className="text-gray-400 cursor-move" />
            <span className="text-sm font-medium text-gray-700">
              {fieldTypes.find(f => f.type === field.type)?.icon} {field.type.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => moveField(field.id, 'up')}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Move Up"
            >
              <ArrowUp size={16} />
            </button>
            <button
              onClick={() => moveField(field.id, 'down')}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Move Down"
            >
              <ArrowDown size={16} />
            </button>
            <button
              onClick={() => duplicateField(field.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Duplicate"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => removeField(field.id)}
              className="p-1 text-red-400 hover:text-red-600"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label *
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Field label"
            />
          </div>

          {field.type !== 'checkbox' && field.type !== 'radio' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={field.placeholder}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Placeholder text"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText}
              onChange={(e) => updateField(field.id, { helpText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Help text for users"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                className="mr-2"
              />
              Required
            </label>
          </div>
        </div>

        {needsOptions && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            {field.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => updateOption(field.id, index, { 
                    label: e.target.value,
                    value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  onClick={() => removeOption(field.id, index)}
                  className="p-2 text-red-400 hover:text-red-600"
                  disabled={field.options.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => addOption(field.id)}
              className="mt-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Add Option
            </button>
          </div>
        )}

        {/* Validation Rules */}
        {(field.type === 'text' || field.type === 'textarea') && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Length
              </label>
              <input
                type="number"
                value={field.validation?.minLength || ''}
                onChange={(e) => updateField(field.id, {
                  validation: { ...field.validation, minLength: parseInt(e.target.value) || undefined }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Length
              </label>
              <input
                type="number"
                value={field.validation?.maxLength || ''}
                onChange={(e) => updateField(field.id, {
                  validation: { ...field.validation, maxLength: parseInt(e.target.value) || undefined }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
          </div>
        )}

        {field.type === 'number' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Value
              </label>
              <input
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => updateField(field.id, {
                  validation: { ...field.validation, min: parseFloat(e.target.value) || undefined }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Value
              </label>
              <input
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => updateField(field.id, {
                  validation: { ...field.validation, max: parseFloat(e.target.value) || undefined }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && isEditing) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading form...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Form' : 'Create Form'}
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={handlePreview}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              disabled={!formData.title || formData.fields.length === 0}
            >
              <Eye size={20} className="mr-2" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={20} className="mr-2" />
              {loading ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('builder')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'builder'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Form Builder
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Form Details */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">Form Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Form title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                      placeholder="Form description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
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
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Field Types */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Add Fields</h3>
                <div className="grid grid-cols-1 gap-2">
                  {fieldTypes.map(fieldType => (
                    <button
                      key={fieldType.type}
                      onClick={() => addField(fieldType.type)}
                      className="flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg mr-3">{fieldType.icon}</span>
                      <span className="text-sm">{fieldType.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Builder */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium">Form Fields</h3>
                  {formData.fields.length === 0 && (
                    <p className="text-gray-500 mt-2">
                      Add fields from the panel on the left to start building your form.
                    </p>
                  )}
                </div>
                
                <div className="p-6">
                  {formData.fields.map((field) => (
                    <FieldEditor key={field.id} field={field} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-6">Form Settings</h3>
              
              <div className="space-y-6">
                {/* Submission Settings */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Submission Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.settings.requireLogin}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, requireLogin: e.target.checked }
                          }))}
                          className="mr-2"
                        />
                        Require login to submit
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.settings.allowMultipleSubmissions}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, allowMultipleSubmissions: e.target.checked }
                          }))}
                          className="mr-2"
                        />
                        Allow multiple submissions per user
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Submission Limit
                      </label>
                      <input
                        type="number"
                        value={formData.settings.submissionLimit || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { 
                            ...prev.settings, 
                            submissionLimit: parseInt(e.target.value) || null 
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="No limit"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.settings.captcha}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, captcha: e.target.checked }
                          }))}
                          className="mr-2"
                        />
                        Enable CAPTCHA
                      </label>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Availability</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.settings.startDate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, startDate: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.settings.endDate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, endDate: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Success Messages */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">After Submission</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Success Message
                      </label>
                      <textarea
                        value={formData.settings.successMessage}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, successMessage: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows="3"
                        placeholder="Thank you for your submission!"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Redirect URL (optional)
                      </label>
                      <input
                        type="url"
                        value={formData.settings.redirectUrl}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, redirectUrl: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="https://example.com/thank-you"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Notifications */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Email Notifications</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.settings.emailNotification.enabled}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { 
                              ...prev.settings, 
                              emailNotification: {
                                ...prev.settings.emailNotification,
                                enabled: e.target.checked
                              }
                            }
                          }))}
                          className="mr-2"
                        />
                        Send email notifications for new submissions
                      </label>
                    </div>

                    {formData.settings.emailNotification.enabled && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recipients (comma-separated emails)
                          </label>
                          <input
                            type="text"
                            value={formData.settings.emailNotification.recipients.join(', ')}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                emailNotification: {
                                  ...prev.settings.emailNotification,
                                  recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="admin@example.com, manager@example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Subject
                          </label>
                          <input
                            type="text"
                            value={formData.settings.emailNotification.subject}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                emailNotification: {
                                  ...prev.settings.emailNotification,
                                  subject: e.target.value
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="New form submission received"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FormBuilder;
