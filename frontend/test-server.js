console.log('🚀 Starting basic server...');

const express = require('express');
const app = express();
const port = 3002;

console.log('📦 Express loaded');

app.get('/', (req, res) => {
  res.send('Hello from BHAVYA!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log('🔗 Routes configured');

app.listen(port, () => {
  console.log(`✅ Basic server running on port ${port}`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
});

console.log('🎯 Server setup complete');
