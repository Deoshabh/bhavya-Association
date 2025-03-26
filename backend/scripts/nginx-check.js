/**
 * This script helps verify if your Nginx configuration is correct
 * Run this on your server to test your setup
 */

const http = require('http');
const https = require('https');

// Function to make HTTP/HTTPS requests
const makeRequest = (url, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Bhavya-Nginx-Check/1.0'
      }
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
};

// Main function to check Nginx config
const checkNginxConfig = async () => {
  console.log('===== Bhavya Association Nginx Configuration Check =====');
  console.log('Testing various endpoints to verify Nginx routing...\n');
  
  const testUrls = [
    'https://api.bhavyasangh.com/health',
    'https://api.bhavyasangh.com/api/health',
    'https://bhavyasangh.com/',
    'https://bhavyasangh.com/api/health'
  ];
  
  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    try {
      const response = await makeRequest(url);
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Headers: ${JSON.stringify(response.headers, null, 2)}`);
      console.log(`  Data: ${response.data.substring(0, 100)}${response.data.length > 100 ? '...' : ''}`);
      
      // Check for routing issues
      if (url.includes('bhavyasangh.com/api/') && response.statusCode === 405) {
        console.log(`  ❌ ERROR: API requests to frontend domain are not being routed correctly`);
        console.log(`     This suggests your Nginx config isn't properly routing /api requests to your backend.`);
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('\n===== Nginx Configuration Recommendations =====');
  console.log('If you see 405 Method Not Allowed errors, check your Nginx configuration:');
  console.log('1. Ensure location /api blocks are configured correctly');
  console.log('2. Check that proxy_pass is pointing to your backend server');
  console.log('3. Verify CORS headers are being set properly');
  console.log('\nExample Nginx configuration:');
  console.log(`
server {
    listen 80;
    server_name bhavyasangh.com;
    
    # Frontend app
    location / {
        root /path/to/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        
        # Respond to preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
  `);
};

// Run the check
checkNginxConfig().catch(console.error);
