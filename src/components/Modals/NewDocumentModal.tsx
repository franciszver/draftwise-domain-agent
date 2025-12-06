import { useState } from 'react';

interface NewDocumentModalProps {
  onClose: () => void;
  onCreate: (title: string) => void;
}

export function NewDocumentModal({ onClose, onCreate }: NewDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    onCreate(title.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">New Document</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="docTitle" className="label">Document Title</label>
              <input
                id="docTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="e.g., Pacifico Datacenter Compliance Plan"
                autoFocus
                disabled={loading}
              />
              <p className="mt-1 text-xs text-slate-500">
                Give your planning document a descriptive name
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">What happens next?</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5">1.</span>
                  <span>Configure your regulatory domain (country, site, regulations)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5">2.</span>
                  <span>AI will discover and index relevant compliance sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5">3.</span>
                  <span>Start drafting with real-time compliance suggestions</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <span className="spinner mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Document'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


