import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { clearAllBrowserCaches, clearRouteCaches } from '../utils/cacheUtils';
import { forceReload, clearRouteAndRedirect } from '../utils/routeUtils';

const RouteCacheDebugger = () => {
  const location = useLocation();
  const [show404Helper, setShow404Helper] = useState(false);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    // Listen for navigation errors and failed fetches
    const handleError = (event) => {
      const is404 = event.target?.status === 404 || 
                   event.message?.includes('404') ||
                   event.message?.includes('Not Found') ||
                   (event.target?.tagName === 'IMG' && event.target?.src?.includes('404'));
      
      if (is404) {
        setLastError({
          path: location.pathname,
          timestamp: new Date().toISOString(),
          type: event.type || 'unknown'
        });
        setShow404Helper(true);
      }
    };

    const handleUnhandledRejection = (event) => {
      if (event.reason?.response?.status === 404 || 
          event.reason?.message?.includes('404')) {
        setLastError({
          path: location.pathname,
          timestamp: new Date().toISOString(),
          type: 'promise_rejection'
        });
        setShow404Helper(true);
      }
    };

    // Listen for various error types
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Check for React Router navigation failures
    const checkRouteStatus = () => {
      // If we're on a route but the content seems to be missing
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.children.length === 0 && location.pathname !== '/') {
        console.warn('Route navigation may have failed - empty root element');
        setLastError({
          path: location.pathname,
          timestamp: new Date().toISOString(),
          type: 'empty_route'
        });
        setShow404Helper(true);
      }
    };

    // Delay check to allow React to render
    const timer = setTimeout(checkRouteStatus, 100);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      clearTimeout(timer);
    };
  }, [location.pathname]);

  // Auto-hide helper after 15 seconds
  useEffect(() => {
    if (show404Helper) {
      const timer = setTimeout(() => setShow404Helper(false), 15000);
      return () => clearTimeout(timer);
    }
  }, [show404Helper]);
  const handleQuickFix = () => {
    clearRouteCaches();
    setShow404Helper(false);
    // Use force reload instead of React Router navigation
    forceReload();
  };

  const handleFullCacheClear = () => {
    clearAllBrowserCaches();
    // Force reload after clearing caches
    setTimeout(() => forceReload(), 100);
  };

  const handlePageReload = () => {
    clearRouteAndRedirect(window.location.pathname);
  };

  const handleDismiss = () => {
    setShow404Helper(false);
  };

  if (!show404Helper) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-sm animate-slideIn">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-sm font-bold">!</span>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-red-800">Route Cache Issue Detected</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>Issue on: <code className="bg-red-100 px-1 rounded text-xs">{lastError?.path}</code></p>
            <p className="text-xs mt-1 text-red-600">Type: {lastError?.type}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">            <button
              onClick={handleQuickFix}
              className="bg-red-100 text-red-800 px-3 py-1 rounded text-xs hover:bg-red-150 transition-colors border border-red-200"
              title="Clear route caches and reload"
            >
              Quick Fix
            </button>
            <button
              onClick={handlePageReload}  
              className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-xs hover:bg-orange-150 transition-colors border border-orange-200"
              title="Clear route cache and reload page"
            >
              Page Reload
            </button>
            <button
              onClick={handleFullCacheClear}  
              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
              title="Clear all browser caches and reload"
            >
              Full Reset
            </button>
            <button
              onClick={handleDismiss}
              className="text-red-400 hover:text-red-600 text-xs px-2 py-1"
              title="Dismiss this notification"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 text-xs text-red-500">
            This helper will auto-hide in 15 seconds
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteCacheDebugger;
