import React from 'react';

/**
 * FormInput component for standardized form inputs
 * 
 * @param {string} label - Input label
 * @param {string} id - Input ID
 * @param {string} name - Input name
 * @param {string} type - Input type (text, password, email, etc)
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Input placeholder
 * @param {string} helpText - Help text displayed below input
 * @param {string} error - Error message
 * @param {boolean} required - Whether input is required
 * @param {boolean} disabled - Whether input is disabled
 * @param {string} className - Additional CSS classes
 */
const FormInput = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  helpText = '',
  error = '',
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputId = id || name;
  const hasError = !!error;
  
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          block w-full px-3 py-2 bg-white border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary-500 
          disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed
          ${hasError ? 'border-red-500' : 'border-neutral-300'}
        `}
        {...props}
      />
      
      {helpText && !hasError && (
        <p className="mt-1 text-sm text-neutral-500">{helpText}</p>
      )}
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormInput;
