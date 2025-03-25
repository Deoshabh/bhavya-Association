import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/DebugPanel.css';

const DebugPanel = () => {
  const { token, api } = useContext(AuthContext);
  const [envData, setEnvData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEndpoint, setActiveEndpoint] = useState('');
  const baseUrl = 'http://api.bhavyasangh.com';

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        setLoading(true);
        setActiveEndpoint('/api/health');
        // Try the direct health endpoint first
        const healthResponse = await axios.get(`${baseUrl}/api/health`);
        setHealthData(healthResponse.data);
        
        // Then try the debug endpoint
        try {
          setActiveEndpoint('/api/debug');
          const debugResponse = await axios.get(`${baseUrl}/api/debug`);
          setEnvData(debugResponse.data);
        } catch (debugErr) {
          console.warn('Debug endpoint error:', debugErr.message);
        }
        
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to connect to server');
        console.error('Server health check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkServerHealth();
  }, []);

  const testEndpoint = async (endpoint) => {
    try {
      setLoading(true);
      setActiveEndpoint(endpoint);
      const response = await axios.get(`${baseUrl}${endpoint}`);
      if (endpoint === '/api/health') {
        setHealthData(response.data);
      } else if (endpoint === '/api/debug') {
        setEnvData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error(`Error testing ${endpoint}:`, err);
      setError(`Failed to access ${endpoint}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthEndpoint = async () => {
    if (!token) {
      setError('No authentication token available. Please log in first.');
      return;
    }
    
    try {
      setLoading(true);
      setActiveEndpoint('/api/profile/me');
      const response = await api.get('/api/profile/me');
      setProfileData(response.data);
      setError(null);
    } catch (err) {
      console.error('Auth endpoint test failed:', err);
      setError(`Authentication test failed: ${err.response?.data?.msg || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Parse and display token info
  const analyzeToken = () => {
    if (!token) {
      setError('No token available to analyze');
      return;
    }

    try {
      setLoading(true);
      // Split the token and decode the payload (middle part)
      const parts = token.split('.');
      if (parts.length !== 3) {
        setError('Token is not in valid JWT format (should have 3 parts)');
        return;
      }

      // Decode the base64 payload
      const payload = JSON.parse(atob(parts[1]));
      
      setTokenData({
        header: JSON.parse(atob(parts[0])),
        payload: payload,
        expiry: new Date(payload.exp * 1000).toLocaleString(),
        isExpired: Date.now() > payload.exp * 1000,
        timeRemaining: Math.max(0, Math.floor((payload.exp * 1000 - Date.now()) / 1000))
      });
      
      setError(null);
    } catch (err) {
      console.error('Token analysis failed:', err);
      setError(`Failed to analyze token: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add a new section to display information about connection optimization
  const renderPerformanceInfo = () => {
    return (
      <div className="success-box">
        <h3>Connection Optimization</h3>
        <div className="optimization-info">
          <p>The application has been optimized to reduce server load:</p>
          <ul>
            <li><strong>Token verification caching:</strong> Token verifications are cached for 10 seconds</li>
            <li><strong>API request throttling:</strong> Prevents excessive API calls</li>
            <li><strong>Server status caching:</strong> Health check results are cached for 5-30 seconds</li>
            <li><strong>Request debouncing:</strong> Multiple rapid requests are consolidated</li>
          </ul>
          <p>These optimizations help reduce the token verification loop issue that was occurring.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="debug-panel">
      <h2>API Connection Test</h2>
      <div className="endpoint-buttons">
        <button 
          onClick={() => testEndpoint('/api/health')}
          className={activeEndpoint === '/api/health' ? 'active' : ''}
        >
          Test /api/health
        </button>
        <button 
          onClick={() => testEndpoint('/api/debug')}
          className={activeEndpoint === '/api/debug' ? 'active' : ''}
        >
          Test /api/debug
        </button>
        <button 
          onClick={testAuthEndpoint}
          className={activeEndpoint === '/api/profile/me' ? 'active' : ''}
        >
          Test Authentication
        </button>
        <button 
          onClick={analyzeToken}
          className={activeEndpoint === 'token-analysis' ? 'active' : ''}
        >
          Analyze Token
        </button>
      </div>
      
      {loading && <p>Loading data from {activeEndpoint}...</p>}
      
      {error && (
        <div className="error-box">
          <h3>Connection Error</h3>
          <p>{error}</p>
          <div className="troubleshooting">
            <h4>Troubleshooting Steps:</h4>
            <ol>
              <li>Make sure your backend server is running at port 5000</li>
              <li>Run the server with <code>npm run dev</code> to enable auto-restart</li>
              <li>Check if the JWT_SECRET is set in your .env file</li>
              <li>Check your browser console for CORS errors</li>
              <li>For authentication errors, try logging out and logging in again</li>
            </ol>
          </div>
        </div>
      )}

      {healthData && (
        <div className="success-box">
          <h3>Server Health Check</h3>
          <pre>{JSON.stringify(healthData, null, 2)}</pre>
        </div>
      )}
      
      {envData && (
        <div className="success-box">
          <h3>Environment Configuration</h3>
          <pre>{JSON.stringify(envData, null, 2)}</pre>
        </div>
      )}
      
      {profileData && (
        <div className="success-box">
          <h3>Authentication Test - User Profile</h3>
          <pre>{JSON.stringify(profileData, null, 2)}</pre>
        </div>
      )}
      
      {tokenData && (
        <div className="success-box">
          <h3>Token Analysis</h3>
          <div className="token-info">
            <p><strong>Algorithm:</strong> {tokenData.header?.alg || 'Unknown'}</p>
            <p><strong>Type:</strong> {tokenData.header?.typ || 'Unknown'}</p>
            <p><strong>User ID:</strong> {tokenData.payload?.user?.id || 'Not found'}</p>
            <p><strong>Issued At:</strong> {tokenData.payload?.iat ? new Date(tokenData.payload.iat * 1000).toLocaleString() : 'Unknown'}</p>
            <p><strong>Expires At:</strong> {tokenData.expiry || 'Unknown'}</p>
            <p><strong>Status:</strong> {tokenData.isExpired ? 
              <span className="token-expired">Expired</span> : 
              <span className="token-valid">Valid (Expires in {tokenData.timeRemaining} seconds)</span>}
            </p>
          </div>
          <h4>Full Token Payload:</h4>
          <pre>{JSON.stringify(tokenData.payload, null, 2)}</pre>
        </div>
      )}

      {renderPerformanceInfo()}

      <div className="manual-test">
        <h3>Authentication Status</h3>
        <p>{token ? 'You are logged in' : 'You are not logged in'}</p>
        
        <h3>Direct API Links</h3>
        <p>Click to open in a new tab:</p>
        <ul>
          <li>
            <a 
              href={`${baseUrl}/api/health`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Health Endpoint
            </a>
          </li>
          <li>
            <a 
              href={`${baseUrl}/api/debug`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Debug Endpoint
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DebugPanel;
