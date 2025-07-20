import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Calendar,
    CheckCircle,
    Clock,
    Code,
    Copy,
    Eye,
    FileText,
    GripVertical,
    Hash,
    Layers,
    Link2,
    Mail,
    Monitor,
    Palette,
    Phone,
    Plus, Save,
    Settings,
    Smartphone,
    Star,
    Tablet,
    ToggleLeft,
    Trash2,
    Type,
    Upload
} from 'lucide-react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminLayout from '../Admin/AdminLayout';

const EnhancedFormBuilder = () => {
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
    styling: {
      theme: 'modern',
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      borderRadius: 'medium',
      spacing: 'normal',
      typography: 'default'
    }
  });

  const [activeTab, setActiveTab] = useState('builder');
  const [selectedField, setSelectedField] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Enhanced field types with better categorization
  const fieldCategories = {
    basic: {
      label: 'Basic Fields',
      icon: Type,
      fields: [
        { type: 'text', label: 'Text Input', icon: Type, description: 'Single line text input' },
        { type: 'textarea', label: 'Text Area', icon: FileText, description: 'Multi-line text input' },
        { type: 'email', label: 'Email', icon: Mail, description: 'Email address input with validation' },
        { type: 'phone', label: 'Phone', icon: Phone, description: 'Phone number input' },
        { type: 'number', label: 'Number', icon: Hash, description: 'Numeric input with validation' },
        { type: 'url', label: 'URL', icon: Link2, description: 'Website URL input' }
      ]
    },
    selection: {
      label: 'Selection Fields',
      icon: ToggleLeft,
      fields: [
        { type: 'select', label: 'Dropdown', icon: ToggleLeft, description: 'Single selection dropdown' },
        { type: 'radio', label: 'Radio Buttons', icon: ToggleLeft, description: 'Single selection from options' },
        { type: 'checkbox', label: 'Checkboxes', icon: CheckCircle, description: 'Multiple selection options' },
        { type: 'rating', label: 'Rating', icon: Star, description: 'Star rating input' }
      ]
    },
    dateTime: {
      label: 'Date & Time',
      icon: Calendar,
      fields: [
        { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker input' },
        { type: 'time', label: 'Time', icon: Clock, description: 'Time picker input' },
        { type: 'datetime', label: 'Date & Time', icon: Calendar, description: 'Date and time picker' }
      ]
    },
    advanced: {
      label: 'Advanced Fields',
      icon: Settings,
      fields: [
        { type: 'file', label: 'File Upload', icon: Upload, description: 'File upload with validation' },
        { type: 'signature', label: 'Signature', icon: FileText, description: 'Digital signature capture' },
        { type: 'divider', label: 'Section Divider', icon: Layers, description: 'Visual section separator' },
        { type: 'html', label: 'HTML Content', icon: Code, description: 'Custom HTML content block' }
      ]
    }
  };

  const themes = [
    { value: 'modern', label: 'Modern', colors: { primary: '#3B82F6', bg: '#FFFFFF' } },
    { value: 'minimal', label: 'Minimal', colors: { primary: '#000000', bg: '#FAFAFA' } },
    { value: 'warm', label: 'Warm', colors: { primary: '#F59E0B', bg: '#FEF3C7' } },
    { value: 'nature', label: 'Nature', colors: { primary: '#10B981', bg: '#ECFDF5' } },
    { value: 'professional', label: 'Professional', colors: { primary: '#1F2937', bg: '#F9FAFB' } }
  ];

  const fetchForm = useCallback(async () => {
    if (!isEditing) return;
    
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
  }, [api, id, isEditing]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Form title is required';
    }
    
    if (formData.fields.length === 0) {
      errors.fields = 'At least one field is required';
    }

    // Validate individual fields
    formData.fields.forEach((field, index) => {
      if (!field.label.trim()) {
        errors[`field_${index}_label`] = 'Field label is required';
      }
      
      if (['select', 'radio', 'checkbox'].includes(field.type) && (!field.options || field.options.length < 2)) {
        errors[`field_${index}_options`] = 'At least 2 options are required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: fieldCategories.basic.fields.find(f => f.type === type)?.label || 
             fieldCategories.selection.fields.find(f => f.type === type)?.label ||
             fieldCategories.dateTime.fields.find(f => f.type === type)?.label ||
             fieldCategories.advanced.fields.find(f => f.type === type)?.label ||
             'New Field',
      placeholder: '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ] : [],
      validation: {},
      helpText: '',
      defaultValue: '',
      conditional: {
        enabled: false,
        field: '',
        value: '',
        action: 'show'
      },
      styling: {
        width: 'full',
        alignment: 'left'
      }
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    
    setSelectedField(newField.id);
  };

  const updateField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const duplicateField = (fieldId) => {
    const fieldToDuplicate = formData.fields.find(f => f.id === fieldId);
    if (fieldToDuplicate) {
      const newField = {
        ...fieldToDuplicate,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: `${fieldToDuplicate.label} (Copy)`
      };
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, newField]
      }));
    }
  };

  const removeField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const moveField = (fieldId, direction) => {
    const fieldIndex = formData.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newFields = [...formData.fields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
      setFormData(prev => ({ ...prev, fields: newFields }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors before saving');
      return;
    }

    try {
      setLoading(true);
      setError('');

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
    const previewData = encodeURIComponent(JSON.stringify(formData));
    window.open(`/forms/preview?data=${previewData}`, '_blank');
  };

  const FieldToolbox = () => (
    <div className="bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Fields</h3>
      
      {Object.entries(fieldCategories).map(([categoryKey, category]) => (
        <div key={categoryKey} className="mb-6">
          <div className="flex items-center mb-3">
            <category.icon size={16} className="text-gray-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-700">{category.label}</h4>
          </div>
          
          <div className="space-y-2">
            {category.fields.map((field) => (
              <button
                key={field.type}
                onClick={() => addField(field.type)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group"
              >
                <div className="flex items-start">
                  <field.icon size={16} className="text-gray-500 group-hover:text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                      {field.label}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-blue-700">
                      {field.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const FieldEditor = ({ field }) => {
    if (!field) {
      return (
        <div className="p-8 text-center text-gray-500">
          <Layers size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Select a field to edit its properties</p>
        </div>
      );
    }

    const needsOptions = ['select', 'radio', 'checkbox'].includes(field.type);

    return (
      <div className="p-4 space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <GripVertical size={16} className="text-gray-400 mr-2" />
            Field Settings
          </h3>
        </div>

        {/* Basic Properties */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Label *
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter field label"
            />
            {validationErrors[`field_${formData.fields.indexOf(field)}_label`] && (
              <p className="text-sm text-red-600 mt-1">
                {validationErrors[`field_${formData.fields.indexOf(field)}_label`]}
              </p>
            )}
          </div>

          {field.type !== 'divider' && field.type !== 'html' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder Text
              </label>
              <input
                type="text"
                value={field.placeholder}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter placeholder text"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Help Text
            </label>
            <textarea
              value={field.helpText}
              onChange={(e) => updateField(field.id, { helpText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Help text to guide users"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Required field</span>
            </label>
          </div>
        </div>

        {/* Options for selection fields */}
        {needsOptions && (
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Options *
              </label>
              <div className="space-y-2">
                {field.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...field.options];
                        newOptions[index] = {
                          ...option,
                          label: e.target.value,
                          value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                        };
                        updateField(field.id, { options: newOptions });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      onClick={() => {
                        if (field.options.length > 1) {
                          const newOptions = field.options.filter((_, i) => i !== index);
                          updateField(field.id, { options: newOptions });
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                      disabled={field.options.length <= 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...field.options, {
                      label: `Option ${field.options.length + 1}`,
                      value: `option${field.options.length + 1}`
                    }];
                    updateField(field.id, { options: newOptions });
                  }}
                  className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Plus size={16} className="inline mr-2" />
                  Add Option
                </button>
              </div>
              {validationErrors[`field_${formData.fields.indexOf(field)}_options`] && (
                <p className="text-sm text-red-600 mt-1">
                  {validationErrors[`field_${formData.fields.indexOf(field)}_options`]}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Validation Rules */}
        {(field.type === 'text' || field.type === 'textarea' || field.type === 'email') && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Validation Rules</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Length</label>
                <input
                  type="number"
                  value={field.validation?.minLength || ''}
                  onChange={(e) => updateField(field.id, {
                    validation: { 
                      ...field.validation, 
                      minLength: parseInt(e.target.value) || undefined 
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Length</label>
                <input
                  type="number"
                  value={field.validation?.maxLength || ''}
                  onChange={(e) => updateField(field.id, {
                    validation: { 
                      ...field.validation, 
                      maxLength: parseInt(e.target.value) || undefined 
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Styling Options */}
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Styling</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <select
                value={field.styling?.width || 'full'}
                onChange={(e) => updateField(field.id, {
                  styling: { ...field.styling, width: e.target.value }
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="full">Full Width</option>
                <option value="half">Half Width</option>
                <option value="third">One Third</option>
                <option value="quarter">One Quarter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Alignment</label>
              <select
                value={field.styling?.alignment || 'left'}
                onChange={(e) => updateField(field.id, {
                  styling: { ...field.styling, alignment: e.target.value }
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FormCanvas = () => (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Form Title"
            className="w-full text-2xl font-bold border-none outline-none placeholder-gray-400"
          />
          {validationErrors.title && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.title}</p>
          )}
          
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Form description (optional)"
            className="w-full mt-3 text-gray-600 border-none outline-none placeholder-gray-400 resize-none"
            rows="2"
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {formData.fields.map((field, index) => (
            <div
              key={field.id}
              onClick={() => setSelectedField(field.id)}
              className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                selectedField === field.id 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <GripVertical size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    {field.type.toUpperCase()}
                  </span>
                  {field.required && <span className="text-red-500">*</span>}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveField(field.id, 'up'); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    disabled={index === 0}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveField(field.id, 'down'); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    disabled={index === formData.fields.length - 1}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                
                {/* Field Preview */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled
                  />
                )}
                
                {field.type === 'textarea' && (
                  <textarea
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                    disabled
                  />
                )}
                
                {field.type === 'select' && (
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled>
                    <option>{field.placeholder || 'Choose an option'}</option>
                    {field.options?.map((option, i) => (
                      <option key={i} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                )}
                
                {field.type === 'radio' && (
                  <div className="space-y-2">
                    {field.options?.map((option, i) => (
                      <label key={i} className="flex items-center">
                        <input type="radio" name={field.id} className="mr-2" disabled />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}
                
                {field.type === 'checkbox' && (
                  <div className="space-y-2">
                    {field.options?.map((option, i) => (
                      <label key={i} className="flex items-center">
                        <input type="checkbox" className="mr-2" disabled />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}

                {field.helpText && (
                  <p className="text-xs text-gray-500">{field.helpText}</p>
                )}
              </div>
            </div>
          ))}
          
          {formData.fields.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Layers size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No fields added yet</p>
              <p className="text-sm">Add fields from the toolbox on the left</p>
            </div>
          )}
          
          {validationErrors.fields && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-red-600 mr-2" />
                <p className="text-sm text-red-600">{validationErrors.fields}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SettingsPanel = () => (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="survey">Survey</option>
              <option value="registration">Registration</option>
              <option value="feedback">Feedback</option>
              <option value="contact">Contact</option>
              <option value="application">Application</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.settings.requireLogin}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, requireLogin: e.target.checked }
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Require login to submit</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.settings.allowMultipleSubmissions}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, allowMultipleSubmissions: e.target.checked }
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Allow multiple submissions</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.settings.captcha}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, captcha: e.target.checked }
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Enable CAPTCHA protection</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Success Message</label>
            <textarea
              value={formData.settings.successMessage}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, successMessage: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Message to show after successful submission"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const StylingPanel = () => (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Styling</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    styling: { ...prev.styling, theme: theme.value, primaryColor: theme.colors.primary }
                  }))}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    formData.styling.theme === theme.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <span className="text-sm font-medium">{theme.label}</span>
                  </div>
                  <div 
                    className="w-full h-8 rounded"
                    style={{ backgroundColor: theme.colors.bg }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <input
              type="color"
              value={formData.styling.primaryColor}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                styling: { ...prev.styling, primaryColor: e.target.value }
              }))}
              className="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
            <select
              value={formData.styling.borderRadius}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                styling: { ...prev.styling, borderRadius: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
            <select
              value={formData.styling.spacing}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                styling: { ...prev.styling, spacing: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && isEditing) {
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
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Form' : 'Create New Form'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Build beautiful, responsive forms with our drag-and-drop editor
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Preview Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow' : 'text-gray-600'}`}
                >
                  <Monitor size={16} />
                </button>
                <button
                  onClick={() => setPreviewMode('tablet')}
                  className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-white shadow' : 'text-gray-600'}`}
                >
                  <Tablet size={16} />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow' : 'text-gray-600'}`}
                >
                  <Smartphone size={16} />
                </button>
              </div>

              <button
                onClick={handlePreview}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                disabled={!formData.title || formData.fields.length === 0}
              >
                <Eye size={16} className="mr-2" />
                Preview
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save size={16} className="mr-2" />
                {loading ? 'Saving...' : 'Save Form'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              {[
                { key: 'builder', label: 'Builder', icon: Layers },
                { key: 'settings', label: 'Settings', icon: Settings },
                { key: 'styling', label: 'Styling', icon: Palette }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
            <div className="flex items-center">
              <AlertCircle size={16} className="text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex">
          {activeTab === 'builder' && (
            <>
              {/* Field Toolbox */}
              <div className="w-80 bg-white border-r border-gray-200">
                <FieldToolbox />
              </div>

              {/* Form Canvas */}
              <FormCanvas />

              {/* Properties Panel */}
              <div className="w-80 bg-white border-l border-gray-200">
                <FieldEditor field={formData.fields.find(f => f.id === selectedField)} />
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 bg-gray-50">
              <div className="max-w-2xl mx-auto py-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <SettingsPanel />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'styling' && (
            <div className="flex-1 bg-gray-50">
              <div className="max-w-2xl mx-auto py-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <StylingPanel />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EnhancedFormBuilder;
