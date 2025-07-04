// Test script to verify URL normalization fixes
// Run with: node test-url-fix.js

// Mock the normalization function from api.js
const normalizeApiPath = (url) => {
  // If url is undefined or null, return a safe default
  if (!url) {
    console.warn('Attempting to normalize undefined or null URL');
    return '/api';
  }
  
  // Ensure url is a string
  if (typeof url !== 'string') {
    console.warn(`URL is not a string but ${typeof url}:`, url);
    return '/api';
  }
  
  // For debugging: log the incoming URL
  console.log('Normalizing URL path:', url);
  
  // If URL already has external protocol/domain, leave it alone
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Special case for health endpoint
  if (url === '/health' || url === 'health') {
    return '/health';
  }
  
  // Start with the raw URL and normalize it
  let normalizedUrl = url;
  
  // Remove leading slash if present to work with clean path
  if (normalizedUrl.startsWith('/')) {
    normalizedUrl = normalizedUrl.substring(1);
  }
  
  // CRITICAL FIX: Remove any existing 'api/' or '/api/' prefix to prevent duplication
  while (normalizedUrl.startsWith('api/')) {
    normalizedUrl = normalizedUrl.substring(4); // Remove 'api/'
  }
  
  // Now add the /api/ prefix to the clean URL - ENSURE proper slash handling
  // The leading slash is crucial for proper URL construction with baseURL
  normalizedUrl = '/api/' + normalizedUrl;
  
  // Final safety check - remove any duplicate /api/api/ patterns
  while (normalizedUrl.includes('/api/api/')) {
    normalizedUrl = normalizedUrl.replace('/api/api/', '/api/');
  }
  
  // Ensure no double slashes except after protocol
  normalizedUrl = normalizedUrl.replace(/([^:]\/)\/+/g, '$1');
  
  console.log('Normalized URL:', normalizedUrl);
  return normalizedUrl;
};

// Test cases that were causing the infinite loop
const testCases = [
  'auth/verify-token',
  'auth/token-status', 
  'auth/refresh',
  '/auth/verify-token',
  '/auth/token-status',
  '/auth/refresh',
  'api/auth/verify-token',
  '/api/auth/verify-token'
];

const baseURL = 'https://api.bhavyasangh.com';

console.log('\n🧪 Testing URL normalization fixes...\n');

testCases.forEach(testUrl => {
  console.log(`\n--- Testing: "${testUrl}" ---`);
  const normalized = normalizeApiPath(testUrl);
  const fullUrl = `${baseURL}${normalized}`;
  
  // Check for the malformed pattern
  const isMalformed = fullUrl.includes('comauth') || fullUrl.includes('com/api/apiauth');
  
  console.log(`✅ Full URL: ${fullUrl}`);
  console.log(`🔍 Malformed: ${isMalformed ? '❌ YES' : '✅ NO'}`);
});

console.log('\n✅ URL normalization test completed!');
