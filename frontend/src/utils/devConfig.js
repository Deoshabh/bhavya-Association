// Development environment configuration to suppress warnings
if (process.env.NODE_ENV === 'development') {
  // Suppress React Strict Mode warnings for third-party components
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && (
        args[0].includes('UNSAFE_componentWillMount') ||
        args[0].includes('SideEffect(NullComponent)') ||
        args[0].includes('ReactStrictModeWarnings') ||
        args[0].includes('unsafe lifecycle') ||
        args[0].includes('componentWillMount in strict mode')
      )
    ) {
      return; // Suppress these specific warnings
    }
    originalConsoleError.call(console, ...args);
  };
  
  // Also suppress console.warn for similar warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' && (
        args[0].includes('UNSAFE_componentWillMount') ||
        args[0].includes('WebSocket connection') ||
        args[0].includes('Download the React DevTools')
      )
    ) {
      return; // Suppress these warnings
    }
    originalConsoleWarn.call(console, ...args);
  };
}

export default {};
