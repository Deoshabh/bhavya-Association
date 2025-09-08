#!/usr/bin/env node

const axios = require('axios');

async function checkBackendHealth() {
  const endpoints = [
    'https://api.bhavyasangh.com/api/health',
    'https://api.bhavyasangh.com/api/news',
    'https://api.bhavyasangh.com/api/news/latest'
  ];

  console.log('🔍 Checking backend API health...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await axios.get(endpoint, { timeout: 10000 });
      console.log(`✅ Status: ${response.status} - OK`);
      if (endpoint.includes('health')) {
        console.log(`   Response: ${JSON.stringify(response.data)}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ Status: ${error.response?.status || 'Network Error'}`);
      console.log(`   Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      }
      console.log('');
    }
  }

  console.log('🏁 Health check complete');
}

// Run the health check
checkBackendHealth().catch(console.error);
