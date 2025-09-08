import { ArrowLeft, Star, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const FormPreview = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState(null);
  const [submissionData, setSubmissionData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setFormData(parsedData);
        // Initialize submission data
        const initialData = {};
        parsedData.fields.forEach(field => {
          if (field.type === 'checkbox') {
            initialData[field.id] = [];
          } else {
            initialData[field.id] = field.defaultValue || '';
          }
        });
        setSubmissionData(initialData);
      } catch (error) {
        console.error('Error parsing form data:', error);
      }
    }
  }, [searchParams]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    formData.fields.forEach(field => {
      const fieldErrors = validateField(field, submissionData[field.id]);
      if (fieldErrors.length > 0) {
        newErrors[field.id] = fieldErrors;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulate submission
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Form submission preview completed!');
    }, 1000);
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
              onChange={(e) => handleInputChange(field.id, e.target.files[0])}
              className="hidden"
              id={`file-${field.id}`}
              required={field.required}
            />
            <label
              htmlFor={`file-${field.id}`}
              className={`${commonClasses} cursor-pointer flex items-center justify-center text-gray-500 hover:bg-gray-50`}
            >
              <Upload size={20} className="mr-2" />
              {fieldValue ? fieldValue.name : 'Choose file...'}
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

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading form preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => window.close()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Close Preview
          </button>
          
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">
              📋 <strong>Form Preview Mode</strong> - This is how your form will appear to users. 
              Submissions in preview mode are not saved.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {formData.title}
            </h1>
            {formData.description && (
              <p className="text-gray-600">{formData.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formData.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {renderField(field)}
                
                {field.helpText && (
                  <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
                )}
                
                {errors[field.id] && (
                  <div className="mt-1">
                    {errors[field.id].map((error, index) => (
                      <p key={index} className="text-sm text-red-600">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Form (Preview)'
                )}
              </button>
            </div>
          </form>

          {/* Form Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Category:</strong> {formData.category}</p>
              <p><strong>Status:</strong> {formData.status}</p>
              <p><strong>Fields:</strong> {formData.fields.length}</p>
              {formData.settings.requireLogin && (
                <p><strong>Login Required:</strong> Yes</p>
              )}
              {formData.settings.submissionLimit && (
                <p><strong>Submission Limit:</strong> {formData.settings.submissionLimit}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
