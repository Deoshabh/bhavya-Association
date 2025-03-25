/**
 * Centralized API endpoints configuration
 * This helps avoid duplication of API paths
 */

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

// Helper function to ensure API paths don't have duplicate /api prefix
export const getApiPath = (path) => {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Check for and remove duplicate /api prefix
  if (normalizedPath.startsWith('/api/')) {
    return normalizedPath;
  }
  
  return normalizedPath;
};
