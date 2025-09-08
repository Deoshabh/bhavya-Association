import { Plus, Search, X } from 'lucide-react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import FormRenderer from '../FormRenderer';

const FormEmbeddingModal = ({ isOpen, onClose, onEmbed, postType, postId }) => {
  const { api } = useContext(AuthContext);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState(null);
  const [embeddingSettings, setEmbeddingSettings] = useState({
    position: 'bottom',
    showTitle: true,
    showDescription: true,
    displayStyle: 'inline'
  });

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/forms/admin?status=active');
      setForms(response.data.forms);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isOpen) {
      fetchForms();
    }
  }, [isOpen, fetchForms]);

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmbed = () => {
    if (selectedForm) {
      onEmbed({
        formId: selectedForm._id,
        formTitle: selectedForm.title,
        ...embeddingSettings
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Embed Form in {postType === 'news' ? 'News Post' : 'Q&A Discussion'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex h-full max-h-[calc(90vh-80px)]">
          {/* Form Selection */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Form</h3>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Forms List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading forms...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredForms.map((form) => (
                  <div
                    key={form._id}
                    onClick={() => setSelectedForm(form)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedForm?._id === form._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">{form.title}</h4>
                    {form.description && (
                      <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{form.fields.length} fields</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        form.category === 'survey' ? 'bg-blue-100 text-blue-800' :
                        form.category === 'feedback' ? 'bg-green-100 text-green-800' :
                        form.category === 'poll' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {form.category}
                      </span>
                    </div>
                  </div>
                ))}
                
                {filteredForms.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {searchTerm ? 'No forms found matching your search' : 'No active forms available'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings & Preview */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Embedding Settings</h3>
            
            {selectedForm ? (
              <>
                {/* Settings */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <select
                      value={embeddingSettings.position}
                      onChange={(e) => setEmbeddingSettings(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="top">Top of content</option>
                      <option value="bottom">Bottom of content</option>
                      <option value="after-paragraph-1">After first paragraph</option>
                      <option value="after-paragraph-2">After second paragraph</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Style
                    </label>
                    <select
                      value={embeddingSettings.displayStyle}
                      onChange={(e) => setEmbeddingSettings(prev => ({ ...prev, displayStyle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="inline">Inline with content</option>
                      <option value="card">Card style</option>
                      <option value="modal">Modal popup</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={embeddingSettings.showTitle}
                        onChange={(e) => setEmbeddingSettings(prev => ({ ...prev, showTitle: e.target.checked }))}
                        className="mr-2"
                      />
                      Show form title
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={embeddingSettings.showDescription}
                        onChange={(e) => setEmbeddingSettings(prev => ({ ...prev, showDescription: e.target.checked }))}
                        className="mr-2"
                      />
                      Show form description
                    </label>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Preview</h4>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <FormRenderer
                      formId={selectedForm._id}
                      className="scale-90 origin-top-left transform"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Plus size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Select a form to configure embedding settings</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleEmbed}
            disabled={!selectedForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Embed Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormEmbeddingModal;
