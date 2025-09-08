# BHAVYA Association - Dokploy Deployment Guide

## Overview

This guide helps you deploy the BHAVYA Association application on your VPS using Dokploy.

## Prerequisites

- VPS with Docker and Dokploy installed
- MongoDB database (local or cloud-based like MongoDB Atlas)
- Domain name pointing to your VPS

## Deployment Steps

### 1. Dokploy Setup

1. Access your Dokploy dashboard
2. Create a new application
3. Select "Git Repository" as source
4. Connect your GitHub repository: `https://github.com/Deoshabh/bhavya-Association`

### 2. Application Configuration

In Dokploy application settings:

#### Build Configuration

- **Build Command**: `docker build -t bhavya-app .`
- **Dockerfile Path**: `./Dockerfile`
- **Build Context**: Root directory

#### Runtime Configuration

- **Port**: `5000`
- **Health Check Path**: `/api/health`
- **Restart Policy**: `unless-stopped`

### 3. Environment Variables

Set these environment variables in Dokploy:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongo:DevSum@12345@mongo-db-mongo-db-yc5kum:27017/bhavya
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Note**: The MONGODB_URI uses your existing VPS MongoDB setup. The database name `bhavya` will be created automatically if it doesn't exist.

### 4. Volume Mounts

Configure persistent storage:

- **Source**: `/var/lib/dokploy/volumes/bhavya-uploads`
- **Target**: `/app/backend/uploads`
- **Type**: `bind`

### 5. Network Configuration

- **Internal Port**: `5000`
- **External Port**: `80` or `443` (with SSL)
- **Domain**: Your domain name

### 6. Database Setup - Using Your Existing VPS MongoDB

Since you already have MongoDB running on your VPS with Dokploy, you'll use the existing setup:

#### Your MongoDB Configuration:

- **Host**: `mongo-db-mongo-db-yc5kum`
- **Port**: `27017`
- **Username**: `mongo`
- **Password**: `DevSum@12345`
- **Connection String**: `mongodb://mongo:DevSum@12345@mongo-db-mongo-db-yc5kum:27017/bhavya`

#### Database Management:

- The BHAVYA application will create a separate database called `bhavya`
- This keeps your projects isolated while using the same MongoDB instance
- You can change `bhavya` to any database name you prefer for this project

#### Alternative Database Names:

If you want to use a different database name, update the MONGODB_URI:

```env
# For different database name
MONGODB_URI=mongodb://mongo:DevSum@12345@mongo-db-mongo-db-yc5kum:27017/your_preferred_db_name
```

#### MongoDB Access Notes:

- Your MongoDB is configured with authentication
- The connection will be internal within Dokploy's Docker network
- No additional MongoDB setup required

### 7. SSL/HTTPS Setup

Dokploy typically handles SSL automatically with Let's Encrypt:

1. Add your domain in Dokploy
2. Enable SSL certificate auto-generation
3. Verify HTTPS is working

### 8. Deployment Process

1. Push your code to GitHub
2. Dokploy will auto-build and deploy
3. Monitor logs for any issues
4. Test the application

## Monitoring and Maintenance

### Health Checks

The application includes built-in health checks:

- **Endpoint**: `https://yourdomain.com/api/health`
- **Expected Response**: `{"status": "healthy", ...}`

### Logs

Monitor application logs in Dokploy dashboard:

- Application logs
- Build logs
- System logs

### Backup Strategy

1. **Database**: Regular MongoDB backups
2. **Uploads**: Backup `/app/backend/uploads` directory
3. **Environment**: Keep `.env` configuration backed up

## Troubleshooting

### Common Issues

#### 1. Build Failures

- Check Dockerfile syntax
- Verify all dependencies in package.json
- Check build logs in Dokploy

#### 2. Database Connection Issues

- Verify MongoDB URI format
- Check network connectivity
- Ensure MongoDB is running

#### 3. File Upload Issues

- Verify volume mount configuration
- Check directory permissions
- Ensure sufficient disk space

#### 4. CORS Issues

- Update CORS_ORIGINS environment variable
- Include all domains (with and without www)
- Check frontend API calls

### Debug Commands

```bash
# Check container status
docker ps

# View application logs
docker logs bhavya-app

# Access container shell
docker exec -it bhavya-app sh

# Test database connection
docker exec -it bhavya-app node -e "require('./backend/utils/checkDbConnection.js')"
```

## Performance Optimization

### 1. Image Optimization

- Multi-stage build already implemented
- Minimal Alpine Linux base image
- Only production dependencies included

### 2. Caching

- Static file caching enabled
- Container layer caching
- CDN for static assets (optional)

### 3. Resource Limits

Set in Dokploy:

- **Memory**: 512MB - 1GB
- **CPU**: 0.5 - 1 core

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **Database**: Use strong passwords and restricted access
3. **HTTPS**: Always use SSL in production
4. **Updates**: Regularly update dependencies
5. **Backup**: Maintain regular backups

## Support

- Check application logs first
- Review this deployment guide
- Contact development team if needed

## Version Information

- **Node.js**: 20 LTS
- **MongoDB**: 7.x
- **Application**: Latest from main branch
