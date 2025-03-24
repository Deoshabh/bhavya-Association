# bhavya-association

## Deployment Instructions

This guide provides instructions for deploying the Bhavya Association application on Coolify. The application consists of two separate components - the frontend and backend - that need to be deployed individually.

### Frontend Deployment

For deploying the React frontend application:

1. In Coolify, create a new service and select the GitHub repository
2. Set the application type to "Static Site"
3. Configure the following settings:
   - **App directory**: `frontend`
   - **Build command**: Use the custom nixpacks configuration
   - **Publish directory**: `build`

The frontend deployment uses a custom nixpacks configuration (`.nixpacks.toml` in the frontend directory) that handles:
- Installing Node.js dependencies
- Building the React application
- Serving the static files using `serve`

### Frontend Directory Structure

The frontend application follows a standard React application structure:

### Backend Deployment

For deploying the Express.js backend:

1. In Coolify, create a new service and select the GitHub repository
2. Set the application type to "Node.js"
3. Configure the following settings:
   - **App directory**: `backend`
   - **Start command**: `npm start` (This runs `node app.js` as defined in package.json)
   - **Build command**: `npm install`

4. Set the following environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT token generation
   - `PORT`: Port for the server (usually 5000)

### Post-Deployment Configuration

After both services are deployed:

1. Ensure the frontend is configured to connect to the backend by setting the appropriate API base URL
2. Verify database connectivity through the backend's health check endpoint
3. Set up an admin user by following the instructions in the Admin Guide

For troubleshooting deployment issues, check the deployment logs in Coolify or run the application locally using the development commands.