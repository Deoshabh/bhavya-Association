import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/RegistrationForm.css';

const RegistrationForm = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [occupation, setOccupation] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [duplicateUser, setDuplicateUser] = useState(false);
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDuplicateUser(false);
    setIsSubmitting(true);
    
    try {
      await register(name, phoneNumber, occupation, password);
      setSuccess('Registration successful! Redirecting to profile...');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      // Check if this is a duplicate user error (status code 409)
      if (err.response?.status === 409 || 
          err.response?.data?.errorType === 'DUPLICATE_USER' ||
          err.response?.data?.msg?.toLowerCase().includes('already exists')) {
        
        setDuplicateUser(true);
        setError(err.response?.data?.msg || 'This phone number is already registered. Please log in instead.');
      } else {
        // Handle other registration errors
        setError(err.response?.data?.msg || 'Registration failed. Please try again.');
      }
      console.error('Registration error:', err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      <h2>Register</h2>
      
      {error && (
        <div className={duplicateUser ? "duplicate-error" : "error"}>
          <p>{error}</p>
          {duplicateUser && (
            <div className="login-redirect">
              <p>Already have an account?</p>
              <Link to="/login" className="login-link">Log in here</Link>
            </div>
          )}
        </div>
      )}
      
      {success && <p className="success">{success}</p>}
      
      <div className="form-group">
        <label>Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
          disabled={isSubmitting}
        />
      </div>
      <div className="form-group">
        <label>Phone Number</label>
        <input 
          type="tel" 
          value={phoneNumber} 
          onChange={e => setPhoneNumber(e.target.value)} 
          required 
          disabled={isSubmitting}
          className={duplicateUser ? 'input-error' : ''}
        />
        {duplicateUser && <small className="field-error">This phone number is already registered</small>}
      </div>
      <div className="form-group">
        <label>Occupation</label>
        <input 
          type="text" 
          value={occupation} 
          onChange={e => setOccupation(e.target.value)} 
          required 
          disabled={isSubmitting}
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          disabled={isSubmitting}
        />
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
      
      <div className="form-footer">
        <p>Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </form>
  );
};

export default RegistrationForm;