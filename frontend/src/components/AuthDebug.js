import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AuthDebug = () => {
  const { token, user, refreshToken } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const checkToken = async () => {
    try {
      setStatus('checking');
      setMessage('Checking token validity...');
      
      if (!token) {
        setMessage('No token available');
        setStatus('error');
        return;
      }
      
      // Try to verify token directly with backend
      try {
        const verifyResponse = await api.post('/api/auth/verify-token', { token });
        if (verifyResponse.data.valid) {
          setMessage(`Token valid until ${new Date(verifyResponse.data.expiresAt).toLocaleTimeString()}`);
          setStatus('success');
          return;
        }
      } catch (verifyErr) {
        // If backend verification fails, fallback to client-side check
        console.log('Backend token verification failed, using client-side check');
      }
      
      // Decode token to check expiry
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        setMessage('Invalid token format');
        setStatus('error');
        return;
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      if (expiryTime < now) {
        setMessage(`Token expired ${Math.round((now - expiryTime) / 1000 / 60)} minutes ago`);
        setStatus('error');
      } else {
        const minutesRemaining = Math.round((expiryTime - now) / 1000 / 60);
        setMessage(`Token valid for ${minutesRemaining} more minutes`);
        setStatus('success');
      }
    } catch (err) {
      setMessage(`Token check error: ${err.message}`);
      setStatus('error');
    }
  };

  const handleRefreshToken = async () => {
    try {
      setStatus('refreshing');
      setMessage('Refreshing token...');
      
      if (refreshToken) {
        const success = await refreshToken();
        if (success) {
          setMessage('Token refreshed successfully');
          setStatus('success');
        } else {
          setMessage('Token refresh failed');
          setStatus('error');
        }
      } else {
        setMessage('No refresh function available');
        setStatus('error');
      }
    } catch (err) {
      setMessage(`Token refresh error: ${err.message}`);
      setStatus('error');
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '10px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>
        <strong>Auth Debug:</strong>
        <div>User: {user ? user.name : 'Not logged in'}</div>
        <div>Token: {token ? `${token.substring(0, 15)}...` : 'None'}</div>
        {message && (
          <div style={{ 
            color: status === 'error' ? 'red' : status === 'success' ? 'green' : 'blue',
            marginTop: '5px'
          }}>
            {message}
          </div>
        )}
      </div>
      <div style={{ marginTop: '5px', display: 'flex', gap: '5px' }}>
        <button onClick={checkToken}>Check Token</button>
        <button onClick={handleRefreshToken}>Refresh Token</button>
      </div>
    </div>
  );
};

export default AuthDebug;
