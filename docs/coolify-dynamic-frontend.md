# Coolify Dynamic Frontend Configuration

## Overview
Since your frontend is deployed as a **dynamic service** on Coolify (not static), it needs proper Express server configuration to serve static assets correctly.

## Current Issue
Static assets (favicon.ico, favicon.webp, logo192.png) are returning 500 errors because the dynamic service isn't configured to serve them properly.

## Solution: Add Express Static Server

### 1. **Create Server Configuration**
Create `frontend/server.js`:

```javascript
const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle favicon specifically
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'favicon.ico'));
});

app.get('/favicon.webp', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'favicon.webp'));
});

// Handle manifest and other assets
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'manifest.json'));
});

app.get('/logo192.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'logo192.png'));
});

// For any other requests, serve index.html (multi-page app handling)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${port}`);
});
```

### 2. **Update package.json**
Add express dependency and start script:

```json
{
  "dependencies": {
    "express": "^4.18.2"
  },
  "scripts": {
    "start": "node server.js",
    "build": "GENERATE_SOURCEMAP=false react-scripts build",
    "dev": "react-scripts start"
  }
}
```

### 3. **Coolify Configuration**
In your Coolify frontend service settings:

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

**Port:** `3000`

**Environment Variables:**
```
NODE_ENV=production
PORT=3000
REACT_APP_API_URL=https://api.bhavyasangh.com
```

### 4. **Alternative: Use serve package**
If you prefer not to create a custom server:

**Install serve:**
```json
{
  "dependencies": {
    "serve": "^14.2.0"
  },
  "scripts": {
    "start": "serve -s build -l 3000",
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

**Coolify Start Command:**
```
npm start
```

## File Structure After Build
Ensure your build process creates:
```
frontend/
├── build/
│   ├── favicon.ico
│   ├── favicon.webp
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   ├── index.html
│   └── static/
│       ├── css/
│       └── js/
├── package.json
└── server.js (if using custom server)
```

## Testing After Deployment
1. **Check static assets directly:**
   - https://bhavyasangh.com/favicon.ico
   - https://bhavyasangh.com/favicon.webp
   - https://bhavyasangh.com/manifest.json

2. **Verify in browser:**
   - No 500 errors in Network tab
   - Favicon loads properly
   - Manifest validation passes

## Debug Commands
If issues persist:

```bash
# Check if files exist in container
docker exec -it <container_id> ls -la /app/build/

# Check server logs
docker logs <container_id>

# Test endpoints
curl -I https://bhavyasangh.com/favicon.ico
```

## Benefits of Dynamic Frontend
- ✅ Better control over static asset serving
- ✅ Custom error handling
- ✅ Environment-specific configurations
- ✅ Server-side redirects if needed
- ✅ Proper MIME type handling
