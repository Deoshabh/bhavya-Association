#!/bin/bash

# BHAVYA Association - Production Startup Script
# This script helps with deployment verification and health checks

set -e

echo "🚀 BHAVYA Association - Production Deployment"
echo "=============================================="

# Check if required environment variables are set
required_vars=("MONGODB_URI" "JWT_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf "   - %s\n" "${missing_vars[@]}"
    echo "💡 Please set these variables before deployment"
    exit 1
fi

echo "✅ Environment variables check passed"

# Check if uploads directory exists
if [ ! -d "/app/backend/uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p /app/backend/uploads
    chown -R node:node /app/backend/uploads
fi

echo "✅ Directory structure verified"

# Start the application
echo "🎯 Starting BHAVYA Association..."
echo "📊 Environment: ${NODE_ENV:-production}"
echo "🔗 Port: ${PORT:-5000}"
echo "🗄️ Database: ${MONGODB_URI}"

# Execute the main application
exec node /app/backend/app.js
