# Coolify Configuration for Multi-Page React App

Since you're deploying a React app without SPA behavior on Coolify, you'll need to configure your deployment properly to handle traditional page requests.

## Coolify Configuration Steps:

### 1. **Build Settings**
In your Coolify frontend service:
- Build Command: `npm run build`
- Install Command: `npm install`
- Publish Directory: `build`

### 2. **Server Configuration**
Add these headers to your Coolify service environment or nginx config:

```nginx
# For HTML files - prevent caching
location ~* \.(html)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

# For static assets - aggressive caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# For API requests - no caching
location /api/ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 3. **Environment Variables**
Set these in your Coolify frontend service:

```
GENERATE_SOURCEMAP=false
REACT_APP_API_URL=your_backend_url
PUBLIC_URL=https://your-domain.com
```

### 4. **Deployment Process**
1. Remove SPA redirects (already done)
2. Build the React app normally
3. Deploy to Coolify
4. Configure nginx headers as above
5. Test each route individually

### 5. **Monitoring 404 Issues**
- Check Coolify logs for specific routes that fail
- Use the RouteCacheDebugger component included in your app
- Monitor browser network tab for failed requests

### 6. **Debug Commands**
If you get 404s, you can debug on your VPS:

```bash
# Check nginx logs
tail -f /var/log/nginx/error.log

# Test specific routes
curl -I https://your-domain.com/directory
curl -I https://your-domain.com/profile

# Check if files exist
ls -la /path/to/build/
```

## Important Notes:

1. **No _redirects SPA behavior** - Each route must correspond to an actual file or be handled by your server
2. **HTML caching disabled** - Prevents stale route caches
3. **Static assets cached** - JS/CSS/images cached for performance
4. **API requests not cached** - Ensures fresh data

## Testing Your Setup:

1. Clear browser cache completely
2. Visit each route directly in the address bar
3. Check that refresh works on each page
4. Verify that 404s are properly handled

This configuration should resolve your 404 cache issues while maintaining a multi-page app structure.
