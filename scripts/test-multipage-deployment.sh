#!/bin/bash

# Multi-Page App Deployment Test Script
# Run this after deploying to test if the configuration is working

echo "🔧 Testing Multi-Page App Configuration..."
echo "=========================================="

# Set your domain
DOMAIN="https://bhavyasangh.com"

# Test main routes
ROUTES=("/" "/login" "/register" "/profile" "/directory" "/service-listings")

echo "📋 Testing route accessibility..."

for route in "${ROUTES[@]}"; do
  echo -n "Testing $route ... "
  
  # Test HTTP status
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$route")
  
  if [ "$STATUS" = "200" ]; then
    echo "✅ OK ($STATUS)"
  else
    echo "❌ Failed ($STATUS)"
  fi
done

echo ""
echo "🗂️ Testing cache headers..."

# Test cache headers for HTML
echo -n "HTML cache headers ... "
CACHE_HEADER=$(curl -s -I "$DOMAIN/" | grep -i "cache-control")
if [[ $CACHE_HEADER == *"no-cache"* ]]; then
  echo "✅ Correct (no-cache)"
else
  echo "❌ Wrong ($CACHE_HEADER)"
fi

# Test cache headers for static assets
echo -n "Static asset cache headers ... "
STATIC_CACHE=$(curl -s -I "$DOMAIN/static/css/main.css" | grep -i "cache-control")
if [[ $STATIC_CACHE == *"max-age"* ]]; then
  echo "✅ Correct (cached)"
else
  echo "❌ Wrong ($STATIC_CACHE)"
fi

echo ""
echo "🔍 Testing redirect behavior..."

# Test that routes don't redirect to index.html
echo -n "SPA redirect test ... "
REDIRECT_TEST=$(curl -s -I "$DOMAIN/nonexistent-page" | grep -i "location")
if [[ -z "$REDIRECT_TEST" ]]; then
  echo "✅ No SPA redirects (good for multi-page)"
else
  echo "⚠️ Found redirects: $REDIRECT_TEST"
fi

echo ""
echo "📊 Test Summary:"
echo "- Test direct URL access for each route"
echo "- Check browser network tab for 404s"
echo "- Verify cache headers in browser dev tools"
echo "- Test refresh on each page"

echo ""
echo "🐛 If you see 404s:"
echo "1. Check Coolify logs"
echo "2. Verify nginx configuration"
echo "3. Use the RouteCacheDebugger component in your app"
echo "4. Clear browser cache completely"

echo ""
echo "✅ Multi-page app test completed!"
