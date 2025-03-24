import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * A utility to debounce navigation actions to prevent navigation throttling
 * @param {function} navigate - The navigate function from useNavigate()
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {function} A debounced navigation function
 */
export const createSafeNavigate = (navigate, delay = 300) => {
  let isNavigating = false;
  let timeoutId = null;
  
  return (to, options = {}) => {
    // If already navigating, don't trigger another navigation
    if (isNavigating) {
      console.log(`Navigation to ${to} skipped - already navigating`);
      return;
    }
    
    // Clear any existing timeout
    if (timeoutId) clearTimeout(timeoutId);
    
    // Set navigating state
    isNavigating = true;
    console.log(`Navigating to ${to}...`);
    
    // Perform the navigation
    navigate(to, options);
    
    // Reset after delay
    timeoutId = setTimeout(() => {
      isNavigating = false;
      timeoutId = null;
    }, delay);
  };
};

/**
 * A hook that creates a safe navigation function to prevent throttling
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {function} A safe navigation function
 */
export const useSafeNavigate = (delay = 300) => {
  const navigate = useNavigate();
  const navigationStateRef = useRef({
    isNavigating: false,
    timeoutId: null
  });
  
  return React.useCallback((to, options = {}) => {
    const state = navigationStateRef.current;
    
    // If already navigating, don't trigger another navigation
    if (state.isNavigating) {
      console.log(`Navigation to ${to} skipped - already navigating`);
      return;
    }
    
    // Clear any existing timeout
    if (state.timeoutId) clearTimeout(state.timeoutId);
    
    // Set navigating state
    state.isNavigating = true;
    console.log(`Navigating to ${to}...`);
    
    // Perform the navigation
    navigate(to, options);
    
    // Reset after delay
    state.timeoutId = setTimeout(() => {
      state.isNavigating = false;
      state.timeoutId = null;
    }, delay);
  }, [navigate, delay]);
};
