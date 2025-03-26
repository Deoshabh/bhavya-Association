const axios = require('axios');
const axiosRetry = require('axios-retry');

/**
 * Performs a GET request to a specified URL with automatic retry functionality
 * @param {string} url - The URL to fetch data from
 * @param {Object} [options={}] - Axios request options
 * @param {number} [maxRetries=3] - Maximum number of retry attempts
 * @returns {Promise<any>} The response data from the API
 */
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  // Create a custom axios instance for this request
  const client = axios.create();
  
  // Configure axios-retry
  axiosRetry(client, {
    retries: maxRetries,
    retryDelay: (retryCount) => {
      console.log(`Retry attempt: ${retryCount}`);
      // Exponential backoff: 1000ms, 2000ms, 3000ms, etc.
      return retryCount * 1000;
    },
    retryCondition: (error) => {
      // First check if this is a login request - never retry login requests
      const requestUrl = error.config?.url || '';
      if (requestUrl.includes('/api/auth/login')) {
        console.log('Login request failed - not retrying as per policy');
        return false;
      }
      
      // For other requests, retry on network errors and 5xx responses
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
             (error.response && error.response.status >= 500);
    },
    onRetry: (retryCount, error, requestConfig) => {
      // Log detailed information about the failure
      console.error(`Request to ${url} failed (attempt ${retryCount}/${maxRetries}):`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        code: error.code,
        method: requestConfig.method,
        url: requestConfig.url
      });
    }
  });

  try {
    // Make the request with the configured client
    const response = await client.get(url, options);
    return response.data;
  } catch (error) {
    // All retry attempts have failed
    console.error(`All ${maxRetries} retry attempts failed for ${url}:`, error.message);
    throw error;
  }
};

module.exports = fetchWithRetry;
