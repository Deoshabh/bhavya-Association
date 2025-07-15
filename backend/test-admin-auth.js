#!/usr/bin/env node

const axios = require('axios');

async function testAdminAuth() {
  console.log('🔍 Testing Admin Authentication...\n');

  // Test endpoints that require admin auth
  const endpoints = [
    { url: 'https://api.bhavyasangh.com/api/admin/referrals/analytics', method: 'GET' },
    { url: 'https://api.bhavyasangh.com/api/admin/referrals', method: 'GET' },
    { url: 'https://api.bhavyasangh.com/api/admin/referrals/leaderboard', method: 'GET' }
  ];

  // You'll need to replace this with an actual admin token
  const testToken = 'YOUR_ADMIN_TOKEN_HERE';

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.method} ${endpoint.url}`);
      
      // Test with correct Authorization header
      const response = await axios({
        method: endpoint.method,
        url: endpoint.url,
        headers: { 
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`✅ Status: ${response.status} - OK`);
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      console.log('');
    } catch (error) {
      console.log(`❌ Status: ${error.response?.status || 'Network Error'}`);
      console.log(`   Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      }
      if (error.response?.headers) {
        console.log(`   Content-Type: ${error.response.headers['content-type']}`);
      }
      console.log('');
    }
  }

  console.log('📝 Instructions:');
  console.log('1. Replace YOUR_ADMIN_TOKEN_HERE with an actual admin JWT token');
  console.log('2. Get a token by logging in as admin and checking localStorage.getItem("token")');
  console.log('3. Run this script to test authentication: node test-admin-auth.js');
  console.log('');
  console.log('🏁 Admin auth test complete');
}

// Run the test
testAdminAuth().catch(console.error);
