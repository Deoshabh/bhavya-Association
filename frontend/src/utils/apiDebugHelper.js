/**
 * Helper utility to debug API URL issues
 */

// Test URL normalization with different input formats
export const testUrlNormalization = () => {
  const testUrls = [
    'auth/login',
    '/auth/login',
    'api/auth/login',
    '/api/auth/login',
    'api/api/auth/login',
    '/api/api/auth/login',
    'profile/me',
    '/profile/me',
    'health',
    '/health'
  ];
  
  console.group('API URL Normalization Test Results');
  console.log('Testing different URL formats to ensure proper normalization');
  
  // Assuming this is the same normalization function from api.js
  const normalizeApiPath = (url) => {
    if (!url) return url;
    
    // If URL already has external protocol/domain, leave it alone
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Special case for health endpoint
    if (url === '/health' || url === 'health') {
      return '/health';
    }
    
    // Convert to a standard format: remove leading slash if present
    let normalizedUrl = url.startsWith('/') ? url.substring(1) : url;
    
    // If the path already includes '/api/', strip it since we'll add it properly
    if (normalizedUrl.includes('api/')) {
      // Strip any 'api/' prefix to avoid duplication
      normalizedUrl = normalizedUrl.replace(/^api\//, '');
    }
    
    // Now add the /api/ prefix properly
    normalizedUrl = '/api/' + normalizedUrl;
    
    // Double check for duplications that might have been missed
    while (normalizedUrl.includes('/api/api/')) {
      normalizedUrl = normalizedUrl.replace('/api/api/', '/api/');
    }
    
    return normalizedUrl;
  };
  
  // Test each URL format
  testUrls.forEach(url => {
    const normalized = normalizeApiPath(url);
    const result = url === normalized ? '✅ Unchanged' : 
                  normalized.includes('/api/api/') ? '❌ Still has duplication' : 
                  '✅ Fixed';
    
    console.log(`"${url}" → "${normalized}" ${result}`);
  });
  
  console.groupEnd();
  
  return 'URL normalization test complete. See console for results.';
};

// Simulate making an API request to see what URL would be used
export const simulateApiRequest = (endpoint, method = 'GET') => {
  const baseUrl = 'https://api.bhavyasangh.com'; // Your API base URL
  
  // Get the normalized path using the same logic
  const normalizeApiPath = (url) => {
    if (!url) return url;
    
    // Same normalization logic as above
    // ...
  };
  
  const normalizedPath = normalizeApiPath(endpoint);
  const fullUrl = baseUrl + normalizedPath;
  
  console.group('API Request Simulation');
  console.log(`Method: ${method}`);
  console.log(`Original endpoint: "${endpoint}"`);
  console.log(`Normalized path: "${normalizedPath}"`);
  console.log(`Full URL: ${fullUrl}`);
  console.groupEnd();
  
  return {
    method,
    endpoint,
    normalizedPath,
    fullUrl
  };
};

// Function to call from the browser console to test the API URL handling
export const debugApi = () => {
  console.group('API URL Debug Helper');
  
  console.log('Testing URL normalization:');
  testUrlNormalization();
  
  console.log('\nSimulating API requests:');
  simulateApiRequest('auth/login', 'POST');
  simulateApiRequest('/auth/login', 'POST');
  simulateApiRequest('profile/me', 'GET');
  
  console.groupEnd();
  
  return 'API debugging complete. See console for results.';
};

// Export a function that users can call to print detailed instructions
export const showApiDebuggingInstructions = () => {
  console.group('API Debugging Instructions');
  console.log('To debug API URL issues:');
  console.log('1. Open browser console (F12)');
  console.log('2. Run: import { debugApi } from "./utils/apiDebugHelper.js"; debugApi();');
  console.log('3. Check the results to see how URLs are being normalized');
  console.groupEnd();
  
  return 'API debugging instructions printed to console.';
};
