import { useCallback } from 'react';
import { useAppSelector } from '../../store/hooks';
import { formatDistanceToNow, format } from 'date-fns';

export function HistoryPanel() {
  const { snapshots, currentDocument } = useAppSelector((state) => state.document);

  const handleRestore = useCallback(
    async (snapshotId: string) => {
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      if (snapshot && currentDocument) {
        // In production, this would restore the document content
        console.log('Restoring snapshot:', snapshotId);
        // For now, we just log - actual restore would update document content
      }
    },
    [snapshots, currentDocument]
  );

  if (!currentDocument) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-slate-500 text-sm">No document selected</p>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-slate-500 text-sm mb-2">No snapshots yet</p>
          <p className="text-slate-400 text-xs">
            Create a snapshot to save a version of your document
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-900">Version History</h3>
          <span className="text-xs text-slate-500">
            {snapshots.length} / 20 snapshots
          </span>
        </div>

        <div className="space-y-2">
          {snapshots.map((snapshot, index) => (
            <div
              key={snapshot.id}
              className="card p-3 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 text-sm truncate">
                      {snapshot.title || `Snapshot ${snapshots.length - index}`}
                    </span>
                    {snapshot.isAutoSave && (
                      <span className="badge-slate text-xs">Auto</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDistanceToNow(new Date(snapshot.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(snapshot.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleRestore(snapshot.id)}
                    className="btn-ghost btn-sm text-xs"
                    title="Restore this version"
                  >
                    Restore
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 truncate-3">
                  {snapshot.content.slice(0, 150)}
                  {snapshot.content.length > 150 ? '...' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


