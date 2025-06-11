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

/**
 * Clear all browser caches including service worker
 */
export const clearAllBrowserCaches = async () => {
  try {
    console.log('🧹 Clearing all browser caches...');
    
    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Found ${cacheNames.length} cache(s) to clear`);
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          console.log(`Clearing cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }
    
    // Clear application caches
    resetAppState();
    
    // Clear local storage items related to routing
    const routingKeys = Object.keys(localStorage).filter(key => 
      key.includes('route') || key.includes('navigation') || key.includes('page')
    );
    routingKeys.forEach(key => localStorage.removeItem(key));
    
    console.log('✅ All caches cleared successfully');
    
    // Force reload without cache
    window.location.reload(true);
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    // Fallback to regular reload
    window.location.reload();
  }
};

/**
 * Clear route-specific caches for multi-page app
 */
export const clearRouteCaches = () => {
  // Clear route-specific localStorage items
  Object.keys(localStorage).forEach(key => {
    if (key.includes('route_') || key.includes('page_') || key.includes('nav_')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear route-specific sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('route_') || key.includes('page_') || key.includes('nav_')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('Route caches cleared');
};

/**
 * Clear browser history cache entries
 */
export const clearHistoryCache = () => {
  // Clear any cached history entries
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, '', window.location.href);
  }
  
  console.log('History cache cleared');
};

/**
 * Full cache clear for multi-page app issues
 */
export const clearAllMultiPageCaches = async () => {
  try {
    // Clear application caches
    clearRouteCaches();
    clearHistoryCache();
    clearAllCookies();
    clearLocalStorage();
    
    // Clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    console.log('All multi-page caches cleared');
    return true;
  } catch (error) {
    console.error('Error clearing multi-page caches:', error);
    return false;
  }
};