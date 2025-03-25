/**
 * Centralized API endpoints configuration
 * This helps avoid duplication of API paths
 */

// Important: These paths should NOT include the /api prefix
// The interceptor will add it if needed

// Base API paths
export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_TOKEN: '/auth/verify-token',
  REFRESH: '/auth/refresh',
  TOKEN_STATUS: '/auth/token-status'
};

export const PROFILE = {
  ME: '/profile/me',
  UPDATE: '/profile/update',
  CHANGE_PASSWORD: '/profile/password'
};

export const DIRECTORY = {
  LIST: '/directory',
  CONFIG: '/directory/config',
  DEBUG: '/directory/debug',
  TOGGLE_VISIBILITY: '/directory/toggle-visibility'
};

export const ADMIN = {
  DASHBOARD: '/admin/dashboard',
  USERS: '/admin/users',
  LISTINGS: '/admin/listings',
  DIRECTORY_DIAGNOSTIC: '/admin/directory-diagnostic'
};

export const LISTINGS = {
  LIST: '/listings',
  CREATE: '/listings',
  UPDATE: (id) => `/listings/${id}`,
  DELETE: (id) => `/listings/${id}`
};

// Helper function to ensure API paths are correctly formatted
export const getApiPath = (path) => {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Ensure no duplicate /api prefixes
  if (normalizedPath.includes('/api/api/')) {
    return normalizedPath.replace('/api/api/', '/api/');
  }
  
  // Add /api if it's not already there
  if (!normalizedPath.startsWith('/api/')) {
    return `/api${normalizedPath}`;
  }
  
  return normalizedPath;
};
