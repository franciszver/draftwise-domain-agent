import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeSource, type RegulatorySource } from '../../store/slices/domainSlice';

interface SourcesModalProps {
  onClose: () => void;
}

export function SourcesModal({ onClose }: SourcesModalProps) {
  const dispatch = useAppDispatch();
  const { sources, categories } = useAppSelector((state) => state.domain);

  const handleRemoveSource = (sourceId: string) => {
    dispatch(removeSource(sourceId));
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || categoryId;
  };

  // Group sources by category
  const groupedSources = sources.reduce<Record<string, RegulatorySource[]>>((acc, source) => {
    const category = source.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(source);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Indexed Sources</h2>
              <p className="text-sm text-slate-500 mt-1">
                {sources.length} source{sources.length !== 1 ? 's' : ''} indexed for suggestions
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {sources.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-slate-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-slate-500">No sources indexed</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSources).map(([category, categorySources]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    {getCategoryName(category)}
                  </h3>
                  <div className="space-y-2">
                    {categorySources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {source.title}
                          </p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:underline truncate block"
                          >
                            {source.url}
                          </a>
                        </div>
                        <button
                          onClick={() => handleRemoveSource(source.id)}
                          className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove source"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Removing a source will exclude it from future suggestions
            </p>
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
