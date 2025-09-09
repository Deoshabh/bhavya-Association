# Multi-stage Dockerfile for BHAVYA Association
# Optimized for Docker Swarm / VPS deployment with MongoDB

# ----------------------
# Stage 1: Build Frontend
# ----------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies (production only)
RUN npm ci --only=production --silent

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build:prod

# ----------------------
# Stage 2: Build Backend Dependencies
# ----------------------
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (production only)
RUN npm ci --only=production --silent

# ----------------------
# Stage 3: Production Runtime
# ----------------------
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init bash

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bhavya -u 1001

# Set working directory
WORKDIR /app

# Copy backend dependencies
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy production server that serves both API and frontend  
COPY production-server.js ./backend/

# Create uploads directory and set permissions
RUN mkdir -p /app/backend/uploads && \
    chown -R bhavya:nodejs /app

# Switch to non-root user
USER bhavya

# Set environment variables for Node and MongoDB
ENV NODE_ENV=production
ENV PORT=5000
ENV MONGO_URI="mongodb://admin:StrongPassword123@mongo-db-mongodb-avaxdz:27017/bhavya-association"

# Expose port
EXPOSE 5000

# Health check for API
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: process.env.PORT || 5000, path: '/api/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the combined production server
CMD ["node", "/app/backend/production-server.js"]
