#!/bin/bash

# BHAVYA Association - Deployment Verification Script
# Run this script to verify your deployment is working correctly

echo "🔍 BHAVYA Association - Deployment Verification"
echo "==============================================="

# Configuration
BASE_URL="${1:-http://localhost:5000}"
TIMEOUT=10

echo "🌐 Testing deployment at: $BASE_URL"

# Test 1: Health Check
echo -n "🏥 Health check... "
if curl -s --max-time $TIMEOUT "$BASE_URL/api/health" > /dev/null; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
    echo "💡 Check if the application is running and accessible"
fi

# Test 2: API Response
echo -n "🔌 API connectivity... "
health_response=$(curl -s --max-time $TIMEOUT "$BASE_URL/api/health" 2>/dev/null)
if echo "$health_response" | grep -q "healthy"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
    echo "📝 Response: $health_response"
fi

# Test 3: Frontend Serving
echo -n "🌐 Frontend serving... "
if curl -s --max-time $TIMEOUT "$BASE_URL/" | grep -q "BHAVYA\|bhavya\|html"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
    echo "💡 Check if frontend build is available"
fi

# Test 4: Database Connection (if health endpoint provides this info)
echo -n "🗄️ Database status... "
db_status=$(curl -s --max-time $TIMEOUT "$BASE_URL/api/health" 2>/dev/null | grep -o '"database":"[^"]*"' 2>/dev/null || echo "")
if [ -n "$db_status" ]; then
    echo "✅ INFO: $db_status"
else
    echo "ℹ️ INFO: Status not available via health check"
fi

echo ""
echo "🎯 Verification complete!"
echo "💡 If any tests failed, check:"
echo "   - Application logs: docker logs <container-name>"
echo "   - Environment variables"
echo "   - Network connectivity"
echo "   - Database connection"
