const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to local backend during development
  if (process.env.NODE_ENV === 'development') {
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:5000',
        changeOrigin: true,
        logLevel: 'debug',
        // Handle both /api and /api/api paths
        pathRewrite: {
          '^/api/api': '/api', // Remove duplicate /api prefix
        },
      })
    );
  }
};
