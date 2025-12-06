import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { saveDocument, createSnapshot } from '../store/slices/documentSlice';
import { debounce } from 'lodash-es';

interface UseAutosaveOptions {
  debounceMs?: number;
  snapshotInterval?: number; // Create snapshot every N saves
}

export function useAutosave(options: UseAutosaveOptions = {}) {
  const { debounceMs = 2000, snapshotInterval = 5 } = options;
  
  const dispatch = useAppDispatch();
  const { currentDocument, isDirty } = useAppSelector((state) => state.document);
  const saveCountRef = useRef(0);

  // Create debounced save function
  const debouncedSave = useRef(
    debounce(async (doc: typeof currentDocument) => {
      if (!doc) return;

      await dispatch(saveDocument({ document: doc, isAutosave: true }));
      saveCountRef.current++;

      // Create periodic snapshot
      if (saveCountRef.current >= snapshotInterval) {
        await dispatch(
          createSnapshot({
            documentId: doc.id,
            content: doc.content,
            isAutoSave: true,
          })
        );
        saveCountRef.current = 0;
      }
    }, debounceMs)
  );

  // Trigger autosave when document changes
  useEffect(() => {
    if (isDirty && currentDocument) {
      debouncedSave.current(currentDocument);
    }
  }, [currentDocument, isDirty]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.current.cancel();
    };
  }, []);

  // Manual save function
  const saveNow = useCallback(async () => {
    debouncedSave.current.cancel();
    if (currentDocument) {
      await dispatch(saveDocument({ document: currentDocument, isAutosave: false }));
    }
  }, [dispatch, currentDocument]);

  return { saveNow };
}


