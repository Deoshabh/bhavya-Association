import axios from 'axios';

// This utility helps diagnose common deployment issues

// Test URLs with various formats to see which one works
export const testEndpoints = async () => {
  const baseUrl = 'https://bhavyasangh.com';
  const apiBaseUrl = 'https://api.bhavyasangh.com';
  
  const testUrls = [
    // Test direct server health endpoints
    { url: `${apiBaseUrl}/health`, method: 'get', name: 'Direct API health' },
    { url: `${apiBaseUrl}/api/health`, method: 'get', name: 'API /api/health' },
    
    // Test login URL variants to find which format works
    { url: `${apiBaseUrl}/auth/login`, method: 'options', name: 'CORS preflight /auth/login' },
    { url: `${apiBaseUrl}/api/auth/login`, method: 'options', name: 'CORS preflight /api/auth/login' },
  ];
  
  console.group('🔍 Testing API Endpoints');
  console.log('This will test various URL formats to determine the correct configuration');
  
  const results = [];
  
  for (const test of testUrls) {
    try {
      console.log(`Testing ${test.name}: ${test.method.toUpperCase()} ${test.url}`);
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000
      });
      
      results.push({
        ...test,
        status: response.status,
        success: true,
        message: 'Success'
      });
      
      console.log(`✅ SUCCESS: ${test.name} (Status: ${response.status})`);
    } catch (error) {
      results.push({
        ...test,
        status: error.response?.status,
        success: false,
        message: error.message,
        details: error.response?.data
      });
      
      console.log(`❌ FAILED: ${test.name} (${error.message})`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      }
    }
  }
  
  console.groupEnd();
  
  return {
    results,
    summary: `${results.filter(r => r.success).length} of ${results.length} tests passed`
  };
};

// Function to help check if your Nginx CORS config is correct
export const diagnoseDeploymentIssue = () => {
  console.group('🔧 Deployment Issue Diagnosis');
  
  console.log('1. Checking for URL duplication issues...');
  const currentUrl = window.location.href;
  const apiUrls = [];
  
  // Extract recent API URLs from performance entries if available
  if (window.performance && window.performance.getEntries) {
    const entries = window.performance.getEntries();
    const apiCalls = entries.filter(e => 
      e.name && (e.name.includes('/api/') || e.name.includes('auth/'))
    );
    
    apiCalls.forEach(call => {
      apiUrls.push(call.name);
    });
  }
  
  console.log('Recent API URLs:', apiUrls);
  
  // Look for common issues
  const issues = [];
  
  if (apiUrls.some(url => url.includes('/api/api/'))) {
    issues.push('Duplicate /api/api/ in URLs detected');
  }
  
  if (currentUrl.includes('bhavyasangh.com') && 
      apiUrls.some(url => url.includes('bhavyasangh.com/api/'))) {
    issues.push('Frontend making requests to itself instead of API server');
  }
  
  console.log('2. Checking environment configuration...');
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'Not set');
  
  // Recommend fixes
  console.log('\n🩺 Diagnosis Results:');
  
  if (issues.length > 0) {
    console.log('Issues found:');
    issues.forEach((issue, i) => {
      console.log(`${i+1}. ${issue}`);
    });
    
    console.log('\nRecommended fixes:');
    console.log('1. Ensure your REACT_APP_API_URL is set correctly in your environment');
    console.log('2. Check that your Nginx config is routing /api requests to your backend');
    console.log('3. Verify that CORS is properly configured on your backend');
  } else {
    console.log('No common issues detected in the frontend configuration.');
    console.log('The issue might be with your backend or Nginx configuration.');
  }
  
  console.groupEnd();
  
  return {
    issues,
    apiUrls,
    environment: {
      apiUrl: process.env.REACT_APP_API_URL || 'Not set'
    }
  };
};

export default {
  testEndpoints,
  diagnoseDeploymentIssue
};
