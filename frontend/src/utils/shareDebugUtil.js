/**
 * Social Media Share Debug Utility
 * 
 * This file contains utility functions to help debug and test social media sharing functionality.
 */

/**
 * Opens the Facebook Sharing Debugger with the current URL
 * @param {string} url Optional URL to debug, defaults to current URL
 */
export const openFacebookDebugger = (url = null) => {
  const targetUrl = encodeURIComponent(url || window.location.href);
  window.open(`https://developers.facebook.com/tools/debug/?q=${targetUrl}`, '_blank');
};

/**
 * Opens the Twitter Card Validator with the current URL
 * @param {string} url Optional URL to debug, defaults to current URL
 */
export const openTwitterValidator = (url = null) => {
  const targetUrl = encodeURIComponent(url || window.location.href);
  window.open(`https://cards-dev.twitter.com/validator?url=${targetUrl}`, '_blank');
};

/**
 * Opens the LinkedIn Post Inspector with the current URL
 * @param {string} url Optional URL to debug, defaults to current URL
 */
export const openLinkedInInspector = (url = null) => {
  const targetUrl = encodeURIComponent(url || window.location.href);
  window.open(`https://www.linkedin.com/post-inspector/inspect/${targetUrl}`, '_blank');
};

/**
 * Opens multiple sharing debuggers for comprehensive testing
 * @param {string} url Optional URL to debug, defaults to current URL
 */
export const testAllPlatforms = (url = null) => {
  openFacebookDebugger(url);
  openTwitterValidator(url);
  openLinkedInInspector(url);
};

/**
 * Logs all meta tags in the document head to console for debugging
 */
export const logMetaTags = () => {
  const metaTags = document.querySelectorAll('meta');
  const result = {};
  
  metaTags.forEach(tag => {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    if (name) {
      result[name] = tag.getAttribute('content');
    }
  });
  
  console.table(result);
  return result;
};

/**
 * Creates a visual preview of how the current page might appear when shared
 * This can be used by developers to test sharing appearance without using external tools
 * @returns {HTMLElement} A preview element that can be mounted to the DOM
 */
export const createSharePreview = () => {
  // Get meta information
  const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
                document.title;
  
  const description = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                      document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                      'No description available';
  
  const imageUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                   document.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content') ||
                   'https://bhavyasangh.com/share-images/default-share.png';
  
  const url = document.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
              window.location.href;
  
  const siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
                   'BHAVYA Associates';

  // Create preview element
  const previewContainer = document.createElement('div');
  previewContainer.style.position = 'fixed';
  previewContainer.style.bottom = '20px';
  previewContainer.style.right = '20px';
  previewContainer.style.width = '360px';
  previewContainer.style.backgroundColor = '#fff';
  previewContainer.style.borderRadius = '8px';
  previewContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  previewContainer.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  previewContainer.style.zIndex = '9999';
  previewContainer.style.overflow = 'hidden';
  previewContainer.style.border = '1px solid #ddd';
  
  // Create header
  const header = document.createElement('div');
  header.style.padding = '12px 16px';
  header.style.borderBottom = '1px solid #eee';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.innerHTML = `
    <div style="font-weight:600;">Share Preview</div>
    <div style="display:flex;gap:8px;">
      <button id="facebook-debug" style="padding:4px 8px;border:none;background:#4267B2;color:white;border-radius:4px;cursor:pointer;font-size:12px;">FB</button>
      <button id="twitter-debug" style="padding:4px 8px;border:none;background:#1DA1F2;color:white;border-radius:4px;cursor:pointer;font-size:12px;">TW</button>
      <button id="linkedin-debug" style="padding:4px 8px;border:none;background:#0077B5;color:white;border-radius:4px;cursor:pointer;font-size:12px;">LI</button>
      <button id="close-preview" style="padding:4px 8px;border:none;background:#f44336;color:white;border-radius:4px;cursor:pointer;font-size:12px;">X</button>
    </div>
  `;
  
  // Create content
  const content = document.createElement('div');
  content.style.padding = '16px';
  content.innerHTML = `
    <div style="margin-bottom:12px;">
      <img src="${imageUrl}" alt="Share preview" style="width:100%;height:180px;object-fit:cover;border-radius:4px;" />
    </div>
    <div style="color:#777;font-size:12px;margin-bottom:4px;text-transform:uppercase;">${siteName}</div>
    <h3 style="margin:0 0 8px;font-size:16px;line-height:1.4;">${title}</h3>
    <p style="margin:0;color:#444;font-size:14px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${description}</p>
    <div style="margin-top:12px;font-size:12px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${url}</div>
  `;
  
  // Assemble and add event listeners
  previewContainer.appendChild(header);
  previewContainer.appendChild(content);
  
  // Return element with attached event listeners
  setTimeout(() => {
    document.getElementById('facebook-debug')?.addEventListener('click', () => openFacebookDebugger());
    document.getElementById('twitter-debug')?.addEventListener('click', () => openTwitterValidator());
    document.getElementById('linkedin-debug')?.addEventListener('click', () => openLinkedInInspector());
    document.getElementById('close-preview')?.addEventListener('click', () => previewContainer.remove());
  }, 100);
  
  return previewContainer;
};

/**
 * Shows a visual preview of how the current page might appear when shared
 * @param {number} duration How long to show the preview (in ms), defaults to 0 (indefinite)
 */
export const showSharePreview = (duration = 0) => {
  const previewElement = createSharePreview();
  document.body.appendChild(previewElement);
  
  if (duration > 0) {
    setTimeout(() => {
      if (document.body.contains(previewElement)) {
        document.body.removeChild(previewElement);
      }
    }, duration);
  }
  
  return previewElement;
};

/**
 * Helper function to quickly test your Open Graph tags
 */
export const debugOpenGraph = () => {
  logMetaTags();
  showSharePreview();
};

// Add to window for easy access in development through console
if (process.env.NODE_ENV === 'development') {
  window.shareDebug = {
    openFacebookDebugger,
    openTwitterValidator,
    openLinkedInInspector,
    testAllPlatforms,
    logMetaTags,
    showSharePreview,
    debugOpenGraph
  };
}