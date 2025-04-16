import { clearAllCaches } from './serverUtils';

/**
 * Clears all cookies from the browser
 */
export const clearAllCookies = () => {
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
  
  console.log('All cookies cleared');
};

/**
 * Clears local storage tokens and caches
 */
export const clearLocalStorage = () => {
  // Remove the auth token
  localStorage.removeItem('token');
  
  // Clear other application storage if needed
  // Add any additional localStorage items that need to be cleared
  
  console.log('Local storage cleared');
};

/**
 * Reset application state by clearing all caches, cookies, and local storage
 */
export const resetAppState = () => {
  // Clear all in-memory caches
  clearAllCaches();
  
  // Clear cookies
  clearAllCookies();
  
  // Clear localStorage
  clearLocalStorage();
  
  console.log('Application state reset complete');
  
  return true;
};

/**
 * Performs a hard refresh of the page to ensure all assets are reloaded
 */
export const hardRefresh = () => {
  window.location.reload(true);
};