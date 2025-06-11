# Multi-Page App Deployment Test Script for Windows PowerShell
# Run this after deploying to test if the configuration is working

Write-Host "🔧 Testing Multi-Page App Configuration..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Set your domain
$DOMAIN = "https://bhavyasangh.com"

# Test main routes
$ROUTES = @("/", "/login", "/register", "/profile", "/directory", "/service-listings")

Write-Host "📋 Testing route accessibility..." -ForegroundColor Yellow

foreach ($route in $ROUTES) {
    Write-Host "Testing $route ... " -NoNewline
    
    try {
        # Test HTTP status
        $response = Invoke-WebRequest -Uri "$DOMAIN$route" -Method HEAD -UseBasicParsing -TimeoutSec 10
        $status = $response.StatusCode
        
        if ($status -eq 200) {
            Write-Host "✅ OK ($status)" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed ($status)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🗂️ Testing cache headers..." -ForegroundColor Yellow

# Test cache headers for HTML
Write-Host "HTML cache headers ... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$DOMAIN/" -Method HEAD -UseBasicParsing
    $cacheHeader = $response.Headers["Cache-Control"]
    
    if ($cacheHeader -like "*no-cache*") {
        Write-Host "✅ Correct (no-cache)" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong ($cacheHeader)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error checking cache headers" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Testing for SPA redirect behavior..." -ForegroundColor Yellow

# Test that routes don't redirect to index.html
Write-Host "SPA redirect test ... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$DOMAIN/nonexistent-page-test" -Method HEAD -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 404) {
        Write-Host "✅ Returns 404 (good for multi-page)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
}
catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Returns 404 (good for multi-page)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Unexpected response" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "- Test direct URL access for each route"
Write-Host "- Check browser network tab for 404s"
Write-Host "- Verify cache headers in browser dev tools"
Write-Host "- Test refresh on each page"

Write-Host ""
Write-Host "🐛 If you see 404s:" -ForegroundColor Red
Write-Host "1. Check Coolify logs"
Write-Host "2. Verify nginx configuration"
Write-Host "3. Use the RouteCacheDebugger component in your app"
Write-Host "4. Clear browser cache completely"

Write-Host ""
Write-Host "✅ Multi-page app test completed!" -ForegroundColor Green
