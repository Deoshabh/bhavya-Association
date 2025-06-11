// Disable WebSocket connection in production to prevent console errors
if (process.env.NODE_ENV === 'production') {
  // Override WebSocket to prevent connection attempts
  window.WebSocket = class {
    constructor() {
      // Do nothing in production
    }
    close() {}
    send() {}
  };
  
  // Disable HMR in production
  if (module.hot) {
    module.hot.accept = () => {};
    module.hot.dispose = () => {};
  }
}

// Clear development-only localStorage items
if (process.env.NODE_ENV === 'production') {
  const devKeys = Object.keys(localStorage).filter(key => 
    key.includes('__webpack') || key.includes('hot-reload') || key.includes('dev-')
  );
  devKeys.forEach(key => localStorage.removeItem(key));
}
