import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import documentReducer, {
  createDocument,
  updateContent,
  updateTitle,
  markClean,
  clearDocument,
  Document,
  Snapshot,
} from '../../store/slices/documentSlice';

interface DocumentState {
  currentDocument: Document | null;
  snapshots: Snapshot[];
  editorState: unknown | null;
  isDirty: boolean;
  isAutosaving: boolean;
  loading: boolean;
  error: string | null;
}

describe('documentSlice', () => {
  let store: EnhancedStore<{ document: DocumentState }>;

  beforeEach(() => {
    store = configureStore({
      reducer: { document: documentReducer },
    });
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().document;
      expect(state.currentDocument).toBeNull();
      expect(state.snapshots).toEqual([]);
      expect(state.isDirty).toBe(false);
      expect(state.isAutosaving).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('createDocument', () => {
    it('should create a new document', async () => {
      await store.dispatch(createDocument('Test Document') as any);
      const state = store.getState().document;

      expect(state.currentDocument).toBeTruthy();
      expect(state.currentDocument?.title).toBe('Test Document');
      expect(state.currentDocument?.content).toBe('');
      expect(state.currentDocument?.status).toBe('draft');
    });

    it('should generate unique IDs', async () => {
      await store.dispatch(createDocument('Doc 1') as any);
      const id1 = store.getState().document.currentDocument?.id;

      await store.dispatch(createDocument('Doc 2') as any);
      const id2 = store.getState().document.currentDocument?.id;

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });
  });

  describe('updateContent', () => {
    it('should update document content and mark as dirty', async () => {
      await store.dispatch(createDocument('Test') as any);
      store.dispatch(updateContent('New content'));

      const state = store.getState().document;
      expect(state.currentDocument?.content).toBe('New content');
      expect(state.isDirty).toBe(true);
    });

    it('should not update if no document is loaded', () => {
      store.dispatch(updateContent('Content'));
      const state = store.getState().document;
      expect(state.currentDocument).toBeNull();
    });
  });

  describe('updateTitle', () => {
    it('should update document title', async () => {
      await store.dispatch(createDocument('Original') as any);
      store.dispatch(updateTitle('Updated Title'));

      const state = store.getState().document;
      expect(state.currentDocument?.title).toBe('Updated Title');
      expect(state.isDirty).toBe(true);
    });
  });

  describe('markClean', () => {
    it('should mark document as clean', async () => {
      await store.dispatch(createDocument('Test') as any);
      store.dispatch(updateContent('Changed'));
      expect(store.getState().document.isDirty).toBe(true);

      store.dispatch(markClean());
      expect(store.getState().document.isDirty).toBe(false);
    });
  });

  describe('clearDocument', () => {
    it('should clear all document state', async () => {
      await store.dispatch(createDocument('Test') as any);
      store.dispatch(updateContent('Content'));

      store.dispatch(clearDocument());
      const state = store.getState().document;

      expect(state.currentDocument).toBeNull();
      expect(state.snapshots).toEqual([]);
      expect(state.isDirty).toBe(false);
    });
  });
});


