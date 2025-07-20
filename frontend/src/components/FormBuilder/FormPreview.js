import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    Monitor,
    Send,
    Smartphone,
    Star,
    Tablet,
    Upload
} from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const FormPreview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { api, user } = useContext(AuthContext);
  
  const [formData, setFormData] = useState(null);
  const [submissionData, setSubmissionData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState('desktop');

  useEffect(() => {
    const fetchFormData = async (id) => {
      try {
        const response = await api.get(`/forms/public/${id}`);
        setFormData(response.data.form);
      } catch (error) {
        console.error('Error fetching form:', error);
      }
    };

    // Get form data from URL params (for preview) or fetch from API
    const dataParam = searchParams.get('data');
    const formId = searchParams.get('id');

    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam));
        setFormData(data);
      } catch (error) {
        console.error('Error parsing form data:', error);
      }
    } else if (formId) {
      fetchFormData(formId);
    }
  }, [searchParams, api]);

  const handleInputChange = (fieldId, value) => {
    setSubmissionData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear field error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    formData.fields.forEach(field => {
      const value = submissionData[field.id];

      // Required field validation
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field.id] = 'This field is required';
        return;
      }

      // Skip validation if field is empty and not required
      if (!value) return;

      // Type-specific validation
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[field.id] = 'Please enter a valid email address';
          }
          break;

        case 'phone':
          const phoneRegex = /^\+?[\d\s\-()]+$/;
          if (!phoneRegex.test(value)) {
            newErrors[field.id] = 'Please enter a valid phone number';
          }
          break;

        case 'url':
          try {
            new URL(value);
          } catch {
            newErrors[field.id] = 'Please enter a valid URL';
          }
          break;

        case 'text':
        case 'textarea':
          if (field.validation?.minLength && value.length < field.validation.minLength) {
            newErrors[field.id] = `Minimum ${field.validation.minLength} characters required`;
          }
          if (field.validation?.maxLength && value.length > field.validation.maxLength) {
            newErrors[field.id] = `Maximum ${field.validation.maxLength} characters allowed`;
          }
          break;

        case 'number':
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            newErrors[field.id] = 'Please enter a valid number';
          } else {
            if (field.validation?.min !== undefined && numValue < field.validation.min) {
              newErrors[field.id] = `Minimum value is ${field.validation.min}`;
            }
            if (field.validation?.max !== undefined && numValue > field.validation.max) {
              newErrors[field.id] = `Maximum value is ${field.validation.max}`;
            }
          }
          break;
          
        default:
          // No additional validation for other field types
          break;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if login is required
    if (formData.settings?.requireLogin && !user) {
      alert('Please log in to submit this form');
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/forms/${formData._id || 'preview'}/submit`, {
        data: submissionData,
        submitterInfo: !user ? {
          name: submissionData.name || 'Anonymous',
          email: submissionData.email || ''
        } : undefined
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = submissionData[field.id] || '';
    const error = errors[field.id];
    const isRequired = field.required;

    const inputClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`;

    const labelClasses = `block text-sm font-medium text-gray-700 mb-2 ${
      field.styling?.alignment === 'center' ? 'text-center' : 
      field.styling?.alignment === 'right' ? 'text-right' : 'text-left'
    }`;

    const containerClasses = `mb-6 ${
      field.styling?.width === 'half' ? 'w-1/2' :
      field.styling?.width === 'third' ? 'w-1/3' :
      field.styling?.width === 'quarter' ? 'w-1/4' : 'w-full'
    }`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type === 'phone' ? 'tel' : field.type}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={inputClasses}
            />
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              className={inputClasses}
            />
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={inputClasses}
            />
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={inputClasses}
            >
              <option value="">{field.placeholder || 'Choose an option'}</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleInputChange(field.id, [...currentValues, option.value]);
                      } else {
                        handleInputChange(field.id, currentValues.filter(v => v !== option.value));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="date"
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={inputClasses}
              />
              <Calendar size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'time':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="time"
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={inputClasses}
              />
              <Clock size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className={`${inputClasses} cursor-pointer hover:bg-gray-50`}>
              <input
                type="file"
                onChange={(e) => handleInputChange(field.id, e.target.files[0])}
                className="hidden"
                id={field.id}
              />
              <label htmlFor={field.id} className="flex items-center justify-center cursor-pointer">
                <Upload size={16} className="mr-2 text-gray-400" />
                <span className="text-gray-600">
                  {value ? value.name : (field.placeholder || 'Choose file')}
                </span>
              </label>
            </div>
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'rating':
        return (
          <div key={field.id} className={containerClasses}>
            <label className={labelClasses}>
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleInputChange(field.id, rating)}
                  className={`p-1 rounded transition-colors ${
                    value >= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                  }`}
                >
                  <Star size={24} fill={value >= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
              {value && (
                <span className="ml-2 text-sm text-gray-600">({value}/5)</span>
              )}
            </div>
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-600">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'divider':
        return (
          <div key={field.id} className={containerClasses}>
            <hr className="border-gray-300 my-6" />
            {field.label && (
              <div className="text-center -mt-3">
                <span className="bg-white px-4 text-sm font-medium text-gray-500">
                  {field.label}
                </span>
              </div>
            )}
          </div>
        );

      case 'html':
        return (
          <div key={field.id} className={containerClasses}>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: field.content || field.label }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            {formData.settings?.successMessage || 'Your form has been submitted successfully.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const containerWidth = 
    previewMode === 'mobile' ? 'max-w-sm' :
    previewMode === 'tablet' ? 'max-w-2xl' : 'max-w-4xl';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Editor
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-3">Preview:</span>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow' : 'text-gray-600'}`}
                title="Mobile"
              >
                <Smartphone size={14} />
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-white shadow' : 'text-gray-600'}`}
                title="Tablet"
              >
                <Tablet size={14} />
              </button>
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow' : 'text-gray-600'}`}
                title="Desktop"
              >
                <Monitor size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <div className={`mx-auto ${containerWidth} transition-all duration-300`}>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold mb-2">{formData.title}</h1>
              {formData.description && (
                <p className="text-blue-100">{formData.description}</p>
              )}
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {formData.fields?.map(renderField)}
              </div>

              {/* Submit Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={20} className="mr-2" />
                      Submit Form
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Form Info */}
          <div className="mt-4 text-center text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-4">
              {formData.settings?.requireLogin && (
                <div className="flex items-center">
                  <Eye size={14} className="mr-1" />
                  Login required
                </div>
              )}
              {formData.settings?.captcha && (
                <div className="flex items-center">
                  <CheckCircle size={14} className="mr-1" />
                  CAPTCHA protected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
