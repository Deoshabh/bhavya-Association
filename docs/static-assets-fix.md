# Static Asset Configuration for Coolify

## Problem
Your static assets (favicon.ico, favicon.webp, logo192.png) are returning 500 errors, indicating server configuration issues.

## Coolify Configuration

Add this configuration to your Coolify frontend service:

### 1. **Environment Variables**
```
PUBLIC_URL=https://bhavyasangh.com
GENERATE_SOURCEMAP=false
REACT_APP_API_URL=https://api.bhavyasangh.com
```

### 2. **Build Configuration**
```
Build Command: npm run build
Install Command: npm install
Publish Directory: build
Start Command: npx serve -s build -l 3000
```

### 3. **Nginx Configuration** (Add to server block)
```nginx
# Handle static assets
location ~* \.(ico|webp|png|jpg|jpeg|gif|svg|js|css)$ {
    root /app/build;
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri $uri/ =404;
}

# Handle favicon specifically
location = /favicon.ico {
    root /app/build;
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}

location = /favicon.webp {
    root /app/build;
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}

# Handle manifest and other PWA files
location = /manifest.json {
    root /app/build;
    expires 1h;
    add_header Cache-Control "public";
    try_files $uri =404;
}

# Handle main app routes
location / {
    root /app/build;
    try_files $uri $uri/ /index.html;
    
    # Prevent caching of index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

### 4. **Alternative: Use serve with proper mime types**
If Coolify uses `serve`, add this to your package.json:

```json
{
  "scripts": {
    "start:prod": "npx serve -s build -l 3000 --cors"
  }
}
```

### 5. **File Structure Check**
Ensure your build folder has these files:
```
build/
├── favicon.ico
├── favicon.webp
├── logo192.png
├── logo512.png
├── manifest.json
└── static/
    ├── css/
    └── js/
```

## Testing
After applying these changes:

1. Clear browser cache completely
2. Visit: https://bhavyasangh.com/favicon.ico
3. Visit: https://bhavyasangh.com/manifest.json
4. Check Network tab for 200 responses instead of 500

## If Issues Persist
Check Coolify logs:
```bash
# Check if files exist in container
docker exec -it <container_id> ls -la /app/build/

# Check nginx error logs
docker logs <container_id>
```
