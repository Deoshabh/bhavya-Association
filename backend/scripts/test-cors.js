const http = require('http');

// Test the API for CORS headers
console.log('Testing API for CORS configuration...');

// Function to test an endpoint with OPTIONS preflight
function testCORS(endpoint, origin = 'https://bhavyasangh.com') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.bhavyasangh.com',
      port: 80,
      path: endpoint,
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`\nTesting endpoint: ${endpoint}`);
      console.log(`Status Code: ${res.statusCode}`);
      
      // Check important CORS headers
      console.log('CORS Headers:');
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers',
        'access-control-allow-credentials',
        'access-control-max-age'
      ];
      
      corsHeaders.forEach(header => {
        console.log(`${header}: ${res.headers[header] || 'NOT SET'}`);
      });
      
      // Determine if CORS is properly configured
      const hasAllowOrigin = res.headers['access-control-allow-origin'] === origin || 
                            res.headers['access-control-allow-origin'] === '*';
      
      if (hasAllowOrigin) {
        console.log('\n✅ CORS appears to be properly configured for this endpoint');
        resolve(true);
      } else {
        console.log('\n❌ CORS is not properly configured for this endpoint');
        resolve(false);
      }
    });

    req.on('error', (e) => {
      console.error(`\nError testing endpoint ${endpoint}: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

// Run tests for different endpoints
async function runTests() {
  try {
    await testCORS('/api/health');
    await testCORS('/api/auth/verify-token');
    await testCORS('/api/directory');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
