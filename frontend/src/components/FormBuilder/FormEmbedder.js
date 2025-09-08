import {
    AlertCircle,
    CheckCircle,
    Code, Copy,
    ExternalLink,
    Info, Zap
} from 'lucide-react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';

const FormEmbedder = ({ formId, onClose }) => {
  const { api } = useContext(AuthContext);
  const [form, setForm] = useState(null);
  const [embedCode, setEmbedCode] = useState('');
  const [embedType, setEmbedType] = useState('inline'); // inline, popup, sidebar
  const [embedStyle, setEmbedStyle] = useState('modern'); // modern, minimal, compact
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [embedSettings, setEmbedSettings] = useState({
    width: '100%',
    height: 'auto',
    showTitle: true,
    showDescription: true,
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    shadow: true,
    customCSS: '',
    redirectAfterSubmit: false,
    redirectUrl: '',
    hideAfterSubmit: false
  });

  const fetchForm = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forms/admin/${formId}`);
      setForm(response.data.form);
    } catch (error) {
      console.error('Error fetching form:', error);
      setError('Failed to fetch form data');
    } finally {
      setLoading(false);
    }
  }, [api, formId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const generateEmbedCode = useCallback(() => {
    if (!form) return;

    const baseUrl = process.env.REACT_APP_API_URL || window.location.origin;
    const formUrl = `${baseUrl}/forms/embed/${form._id}`;
    
    const generateInlineCode = (formUrl) => {
      const containerStyle = {
        width: embedSettings.width,
        height: embedSettings.height,
        backgroundColor: embedSettings.backgroundColor,
        borderRadius: embedSettings.borderRadius,
        padding: embedSettings.padding,
        boxShadow: embedSettings.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      };

      const styleString = Object.entries(containerStyle)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

      return `<!-- BHAVYA Form Embed: ${form.title} -->
<div class="bhavya-form-container" style="${styleString}">
  <iframe 
    src="${formUrl}?style=${embedStyle}&showTitle=${embedSettings.showTitle}&showDescription=${embedSettings.showDescription}"
    width="100%" 
    height="${embedSettings.height === 'auto' ? '600' : embedSettings.height.replace('px', '')}" 
    frameborder="0" 
    scrolling="auto"
    title="${form.title}"
    allow="clipboard-write"
  ></iframe>
</div>

${embedSettings.customCSS ? `<style>
${embedSettings.customCSS}
</style>` : ''}

<script>
// Auto-resize iframe based on content
(function() {
  const iframe = document.querySelector('.bhavya-form-container iframe');
  if (iframe) {
    window.addEventListener('message', function(e) {
      if (e.origin !== '${new URL(formUrl).origin}') return;
      if (e.data.type === 'bhavya-form-height') {
        iframe.style.height = e.data.height + 'px';
      }
      ${embedSettings.redirectAfterSubmit ? `
      if (e.data.type === 'bhavya-form-submitted') {
        ${embedSettings.redirectUrl ? `window.location.href = '${embedSettings.redirectUrl}';` : ''}
        ${embedSettings.hideAfterSubmit ? `iframe.style.display = 'none';` : ''}
      }` : ''}
    });
  }
})();
</script>`;
    };

    const generatePopupCode = (formUrl) => {
      return `<!-- BHAVYA Form Popup: ${form.title} -->
<button id="bhavya-form-trigger" style="
  background: linear-gradient(135deg, #3B82F6, #1D4ED8);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
  Open ${form.title}
</button>

<div id="bhavya-form-popup" style="
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  backdrop-filter: blur(4px);
">
  <div style="
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  ">
    <button id="bhavya-form-close" style="
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      z-index: 1;
      color: #6B7280;
    ">×</button>
    <iframe 
      src="${formUrl}?style=${embedStyle}&popup=true"
      width="100%" 
      height="600" 
      frameborder="0"
      title="${form.title}"
    ></iframe>
  </div>
</div>

<script>
(function() {
  const trigger = document.getElementById('bhavya-form-trigger');
  const popup = document.getElementById('bhavya-form-popup');
  const close = document.getElementById('bhavya-form-close');
  
  trigger.addEventListener('click', () => {
    popup.style.display = 'block';
    document.body.style.overflow = 'hidden';
  });
  
  close.addEventListener('click', () => {
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
  
  // Listen for form submission to close popup
  window.addEventListener('message', function(e) {
    if (e.data.type === 'bhavya-form-submitted') {
      popup.style.display = 'none';
      document.body.style.overflow = 'auto';
      ${embedSettings.redirectAfterSubmit && embedSettings.redirectUrl ? 
        `setTimeout(() => window.location.href = '${embedSettings.redirectUrl}', 1000);` : ''}
    }
  });
})();
</script>`;
    };

    const generateSidebarCode = (formUrl) => {
      return `<!-- BHAVYA Form Sidebar: ${form.title} -->
<div id="bhavya-form-tab" style="
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #3B82F6, #1D4ED8);
  color: white;
  padding: 16px 8px;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  z-index: 9999;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-weight: 600;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
" onmouseover="this.style.transform='translateY(-50%) translateX(-4px)'" onmouseout="this.style.transform='translateY(-50%)'">
  ${form.title}
</div>

<div id="bhavya-form-sidebar" style="
  position: fixed;
  right: -400px;
  top: 0;
  width: 400px;
  height: 100vh;
  background: white;
  z-index: 10000;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease-in-out;
  overflow: auto;
">
  <div style="
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
  ">
    <h3 style="margin: 0; color: #1f2937;">${form.title}</h3>
    <button id="bhavya-sidebar-close" style="
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
    ">×</button>
  </div>
  <iframe 
    src="${formUrl}?style=${embedStyle}&sidebar=true"
    width="100%" 
    height="calc(100vh - 70px)" 
    frameborder="0"
    title="${form.title}"
  ></iframe>
</div>

<script>
(function() {
  const tab = document.getElementById('bhavya-form-tab');
  const sidebar = document.getElementById('bhavya-form-sidebar');
  const close = document.getElementById('bhavya-sidebar-close');
  
  tab.addEventListener('click', () => {
    sidebar.style.right = '0';
    tab.style.display = 'none';
  });
  
  close.addEventListener('click', () => {
    sidebar.style.right = '-400px';
    tab.style.display = 'block';
  });
  
  // Listen for form submission
  window.addEventListener('message', function(e) {
    if (e.data.type === 'bhavya-form-submitted') {
      sidebar.style.right = '-400px';
      tab.style.display = 'block';
      ${embedSettings.redirectAfterSubmit && embedSettings.redirectUrl ? 
        `setTimeout(() => window.location.href = '${embedSettings.redirectUrl}', 1000);` : ''}
    }
  });
})();
</script>`;
    };

    let code = '';

    switch (embedType) {
      case 'inline':
        code = generateInlineCode(formUrl);
        break;
      case 'popup':
        code = generatePopupCode(formUrl);
        break;
      case 'sidebar':
        code = generateSidebarCode(formUrl);
        break;
      default:
        code = generateInlineCode(formUrl);
    }

    setEmbedCode(code);
  }, [form, embedType, embedStyle, embedSettings]);

  useEffect(() => {
    generateEmbedCode();
  }, [generateEmbedCode]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getPreviewUrl = () => {
    if (!form) return '';
    const baseUrl = process.env.REACT_APP_API_URL || window.location.origin;
    return `${baseUrl}/forms/embed/${form._id}?style=${embedStyle}&showTitle=${embedSettings.showTitle}&showDescription=${embedSettings.showDescription}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle size={20} className="mr-2" />
            <h3 className="text-lg font-semibold">Error</h3>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Embed Form</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate embed code for: <span className="font-medium">{form?.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Settings Panel */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Embed Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Embed Type</label>
                <div className="space-y-2">
                  {[
                    { value: 'inline', label: 'Inline', desc: 'Embed directly in page content' },
                    { value: 'popup', label: 'Popup Modal', desc: 'Opens in a modal overlay' },
                    { value: 'sidebar', label: 'Sidebar', desc: 'Slides in from the side' }
                  ].map(type => (
                    <label key={type.value} className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="embedType"
                        value={type.value}
                        checked={embedType === type.value}
                        onChange={(e) => setEmbedType(e.target.value)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Style Theme</label>
                <select
                  value={embedStyle}
                  onChange={(e) => setEmbedStyle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="compact">Compact</option>
                  <option value="professional">Professional</option>
                </select>
              </div>

              {/* Display Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Display Options</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={embedSettings.showTitle}
                      onChange={(e) => setEmbedSettings(prev => ({ ...prev, showTitle: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show form title</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={embedSettings.showDescription}
                      onChange={(e) => setEmbedSettings(prev => ({ ...prev, showDescription: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show form description</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={embedSettings.shadow}
                      onChange={(e) => setEmbedSettings(prev => ({ ...prev, shadow: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Add shadow</span>
                  </label>
                </div>
              </div>

              {/* Dimensions (for inline) */}
              {embedType === 'inline' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Dimensions</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Width</label>
                      <input
                        type="text"
                        value={embedSettings.width}
                        onChange={(e) => setEmbedSettings(prev => ({ ...prev, width: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="100%, 600px, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Height</label>
                      <select
                        value={embedSettings.height}
                        onChange={(e) => setEmbedSettings(prev => ({ ...prev, height: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="auto">Auto (Recommended)</option>
                        <option value="400px">400px</option>
                        <option value="500px">500px</option>
                        <option value="600px">600px</option>
                        <option value="800px">800px</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Colors</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={embedSettings.backgroundColor}
                      onChange={(e) => setEmbedSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-full h-8 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* After Submit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">After Submit</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={embedSettings.redirectAfterSubmit}
                      onChange={(e) => setEmbedSettings(prev => ({ ...prev, redirectAfterSubmit: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Redirect to URL</span>
                  </label>
                  {embedSettings.redirectAfterSubmit && (
                    <input
                      type="url"
                      value={embedSettings.redirectUrl}
                      onChange={(e) => setEmbedSettings(prev => ({ ...prev, redirectUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="https://example.com/thank-you"
                    />
                  )}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={embedSettings.hideAfterSubmit}
                      onChange={(e) => setEmbedSettings(prev => ({ ...prev, hideAfterSubmit: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Hide form after submit</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
            <div className="border-b border-gray-200 px-6 pt-6">
              <nav className="flex space-x-8">
                <button className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                  <Code size={16} className="inline mr-2" />
                  Embed Code
                </button>
              </nav>
            </div>

            {/* Code Output */}
            <div className="flex-1 p-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900">Generated Code</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Info size={14} className="mr-1" />
                      Copy and paste this code into your website
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(getPreviewUrl(), '_blank')}
                      className="flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      Test Live
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} className="mr-2" />
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-auto">
                  <pre className="whitespace-pre-wrap">{embedCode}</pre>
                </div>

                {/* Usage Instructions */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Zap size={16} className="text-blue-600 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <h4 className="font-medium text-blue-900 mb-1">Usage Instructions:</h4>
                      <ul className="text-blue-800 space-y-1">
                        <li>1. Copy the code above</li>
                        <li>2. Paste it into your website's HTML</li>
                        <li>3. The form will automatically load and resize</li>
                        {embedType === 'popup' && <li>4. Visitors click the button to open the form</li>}
                        {embedType === 'sidebar' && <li>4. Visitors click the tab to slide in the form</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormEmbedder;
