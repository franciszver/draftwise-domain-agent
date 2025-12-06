import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  updateContent,
  updateTitle,
  saveDocument,
  createSnapshot,
} from '../../store/slices/documentSlice';
import { LexicalEditor } from './LexicalEditor';
import { EditorToolbar } from './EditorToolbar';
import { debounce } from 'lodash-es';

export function EditorPanel() {
  const dispatch = useAppDispatch();
  const { currentDocument, isDirty, isAutosaving } = useAppSelector(
    (state) => state.document
  );
  const { fontSize } = useAppSelector((state) => state.ui);

  const autosaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Set up debounced autosave
  useEffect(() => {
    autosaveRef.current = debounce(async (doc: typeof currentDocument) => {
      if (doc) {
        await dispatch(saveDocument({ document: doc, isAutosave: true }));
      }
    }, 2000);

    return () => {
      autosaveRef.current?.cancel();
    };
  }, [dispatch]);

  // Trigger autosave when document changes
  useEffect(() => {
    if (isDirty && currentDocument && autosaveRef.current) {
      autosaveRef.current(currentDocument);
    }
  }, [currentDocument, isDirty]);

  const handleContentChange = useCallback(
    (content: string) => {
      dispatch(updateContent(content));
    },
    [dispatch]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(updateTitle(e.target.value));
    },
    [dispatch]
  );

  const handleManualSnapshot = useCallback(async () => {
    if (currentDocument) {
      await dispatch(
        createSnapshot({
          documentId: currentDocument.id,
          content: currentDocument.content,
          isAutoSave: false,
        })
      );
    }
  }, [dispatch, currentDocument]);

  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[fontSize];

  if (!currentDocument) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-slate-900 mb-2">No document selected</h2>
          <p className="text-slate-500">Create a new document to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Document header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <input
          type="text"
          value={currentDocument.title}
          onChange={handleTitleChange}
          className="text-2xl font-bold text-slate-900 w-full border-0 outline-none focus:ring-0 bg-transparent"
          placeholder="Untitled Document"
        />
        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
          <span className="badge-slate">{currentDocument.status}</span>
          <span>
            Created {new Date(currentDocument.createdAt).toLocaleDateString()}
          </span>
          {currentDocument.lastAutosaveAt && (
            <span>
              Last saved {new Date(currentDocument.lastAutosaveAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Editor toolbar */}
      <EditorToolbar onSnapshot={handleManualSnapshot} />

      {/* Editor content */}
      <div className={`flex-1 overflow-auto p-6 ${fontSizeClass}`}>
        <div className="max-w-4xl mx-auto">
          <LexicalEditor
            initialContent={currentDocument.content}
            onChange={handleContentChange}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t border-slate-200 px-6 py-2 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>
            {currentDocument.content.length > 0
              ? `${currentDocument.content.split(/\s+/).filter(Boolean).length} words`
              : 'Empty document'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAutosaving && (
            <span className="flex items-center gap-1">
              <span className="spinner w-3 h-3" />
              Autosaving...
            </span>
          )}
          {!isAutosaving && isDirty && <span>Unsaved changes</span>}
          {!isAutosaving && !isDirty && <span>All changes saved</span>}
        </div>
      </div>
    </div>
  );
}


