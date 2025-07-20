import { AlertCircle, CheckCircle, Star, Upload } from 'lucide-react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const FormRenderer = ({ formId, onSubmissionSuccess, className = '' }) => {
  const { api, user } = useContext(AuthContext);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submissionData, setSubmissionData] = useState({});
  const [errors, setErrors] = useState({});

  const fetchForm = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forms/public/${formId}`);
      setForm(response.data.form);
      
      // Initialize submission data
      const initialData = {};
      response.data.form.fields.forEach(field => {
        if (field.type === 'checkbox') {
          initialData[field.id] = [];
        } else {
          initialData[field.id] = field.defaultValue || '';
        }
      });
      setSubmissionData(initialData);
    } catch (error) {
      console.error('Error fetching form:', error);
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  }, [api, formId]);

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId, fetchForm]);

  const handleInputChange = (fieldId, value) => {
    setSubmissionData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: undefined
      }));
    }
  };

  const handleCheckboxChange = (fieldId, optionValue, checked) => {
    setSubmissionData(prev => {
      const currentValues = prev[fieldId] || [];
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, optionValue]
        };
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter(val => val !== optionValue)
        };
      }
    });
  };

  const handleFileChange = async (fieldId, file) => {
    if (!file) {
      handleInputChange(fieldId, '');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/forms/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      handleInputChange(fieldId, response.data.fileUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors(prev => ({
        ...prev,
        [fieldId]: ['Failed to upload file']
      }));
    }
  };

  const validateField = (field, value) => {
    const errors = [];

    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors.push(`${field.label} is required`);
    }

    if (value && field.validation) {
      const { validation } = field;
      
      if (validation.minLength && value.length < validation.minLength) {
        errors.push(`${field.label} must be at least ${validation.minLength} characters`);
      }
      
      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push(`${field.label} must be no more than ${validation.maxLength} characters`);
      }
      
      if (validation.min !== undefined && parseFloat(value) < validation.min) {
        errors.push(`${field.label} must be at least ${validation.min}`);
      }
      
      if (validation.max !== undefined && parseFloat(value) > validation.max) {
        errors.push(`${field.label} must be no more than ${validation.max}`);
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.settings.requireLogin && !user) {
      setError('Please log in to submit this form');
      return;
    }

    const newErrors = {};
    form.fields.forEach(field => {
      const fieldErrors = validateField(field, submissionData[field.id]);
      if (fieldErrors.length > 0) {
        newErrors[field.id] = fieldErrors;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await api.post(`/forms/${formId}/submit`, {
        formData: submissionData
      });
      
      setSubmitted(true);
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.response?.data?.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const fieldError = errors[field.id];
    const fieldValue = submissionData[field.id];

    const commonClasses = `w-full px-3 py-2 border rounded-md ${
      fieldError ? 'border-red-500' : 'border-gray-300'
    } focus:outline-none focus:ring-2 focus:ring-blue-500`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={field.type}
            value={fieldValue || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={fieldValue || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={fieldValue || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
            rows="4"
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={fieldValue || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={commonClasses}
            required={field.required}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={fieldValue || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={commonClasses}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={fieldValue || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={commonClasses}
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={fieldValue === option.value}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="mr-2"
                  required={field.required}
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(fieldValue || []).includes(option.value)}
                  onChange={(e) => handleCheckboxChange(field.id, option.value, e.target.checked)}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="relative">
            <input
              type="file"
              onChange={(e) => handleFileChange(field.id, e.target.files[0])}
              className="hidden"
              id={`file-${field.id}`}
              required={field.required}
            />
            <label
              htmlFor={`file-${field.id}`}
              className={`${commonClasses} cursor-pointer flex items-center justify-center text-gray-500 hover:bg-gray-50`}
            >
              <Upload size={20} className="mr-2" />
              {fieldValue ? 'File uploaded' : 'Choose file...'}
            </label>
          </div>
        );

      case 'rating':
        return (
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleInputChange(field.id, rating)}
                className="focus:outline-none"
              >
                <Star
                  size={24}
                  className={`${
                    rating <= (fieldValue || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  } hover:text-yellow-400`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {fieldValue ? `${fieldValue}/5` : 'No rating'}
            </span>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={fieldValue || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading form...</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className={`p-4 border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <div className="flex items-center">
          <AlertCircle size={20} className="text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  // Check if form is available
  const now = new Date();
  const startDate = form.settings.startDate ? new Date(form.settings.startDate) : null;
  const endDate = form.settings.endDate ? new Date(form.settings.endDate) : null;

  if (startDate && now < startDate) {
    return (
      <div className={`p-4 border border-yellow-200 rounded-lg bg-yellow-50 ${className}`}>
        <p className="text-yellow-700">This form will be available from {startDate.toLocaleDateString()}</p>
      </div>
    );
  }

  if (endDate && now > endDate) {
    return (
      <div className={`p-4 border border-yellow-200 rounded-lg bg-yellow-50 ${className}`}>
        <p className="text-yellow-700">This form is no longer accepting submissions</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`p-6 border border-green-200 rounded-lg bg-green-50 text-center ${className}`}>
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-green-900 mb-2">Thank you!</h3>
        <p className="text-green-700">
          {form.settings.successMessage || 'Your submission has been received successfully.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg bg-white p-6 ${className}`}>
      {form.embedSettings?.showTitle !== false && (
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{form.title}</h3>
      )}
      
      {form.embedSettings?.showDescription !== false && form.description && (
        <p className="text-gray-600 mb-6">{form.description}</p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {form.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderField(field)}
            
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
            
            {errors[field.id] && (
              <div className="mt-1">
                {errors[field.id].map((error, index) => (
                  <p key={index} className="text-xs text-red-600">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormRenderer;
