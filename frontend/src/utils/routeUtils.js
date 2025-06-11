/**
 * Route utilities for multi-page navigation without SPA behavior
 */

/**
 * Navigate to a new page using full page reload (non-SPA)
 * @param {string} url - The URL to navigate to
 * @param {boolean} replace - Whether to replace current history entry
 */
export const navigateToPage = (url, replace = false) => {
  if (replace) {
    window.location.replace(url);
  } else {
    window.location.href = url;
  }
};

/**
 * Refresh current page with cache busting
 */
export const refreshPage = () => {
  // Add timestamp to bust cache
  const url = new URL(window.location);
  url.searchParams.set('_refresh', Date.now());
  window.location.href = url.toString();
};

/**
 * Clear route-specific caches and redirect
 * @param {string} targetUrl - URL to redirect to after clearing cache
 */
export const clearRouteAndRedirect = (targetUrl) => {
  // Clear any route-specific localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('route_') || key.includes('page_'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear sessionStorage route data
  sessionStorage.removeItem('lastRoute');
  sessionStorage.removeItem('routeData');
  
  // Navigate to target URL
  navigateToPage(targetUrl);
};

/**
 * Check if current route is accessible
 * @returns {boolean} - Whether the route loads properly
 */
export const validateCurrentRoute = () => {
  try {
    // Check if page content loaded properly
    const rootElement = document.getElementById('root');
    const hasContent = rootElement && rootElement.children.length > 0;
    
    // Check for React error boundaries
    const hasErrors = document.querySelector('[data-reactroot]') === null;
    
    return hasContent && !hasErrors;
  } catch (error) {
    console.warn('Route validation failed:', error);
    return false;
  }
};

/**
 * Force reload with cache clearing
 */
export const forceReload = () => {
  // Clear all caches first
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Force reload bypassing cache
  window.location.reload(true);
};
