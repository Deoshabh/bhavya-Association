const axios = require('axios');

const testRoutes = async () => {
  const baseUrl = 'http://localhost:5000';
  
  const routes = [
    '/health',
    '/debug',
    '/auth/check-env',
    '/forms/admin/all',
    '/forms/public/test-slug'
  ];
  
  console.log('Testing API routes...');
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${baseUrl}${route}`);
      console.log(`✅ ${route} - Status: ${response.status}`);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      
      // 401 and 403 are expected for protected routes
      if (status === 401 || status === 403) {
        console.log(`🔒 ${route} - Status: ${status} (Protected route - requires authentication)`);
      } else {
        console.log(`❌ ${route} - Status: ${status || 'ERROR'} - ${message}`);
      }
    }
  }
};

testRoutes();
