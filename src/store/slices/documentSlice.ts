import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface Snapshot {
  id: string;
  documentId: string;
  content: string;
  title: string;
  createdAt: string;
  isAutoSave: boolean;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'final';
  domainId: string | null;
  createdAt: string;
  updatedAt: string;
  lastAutosaveAt: string | null;
}

interface DocumentState {
  currentDocument: Document | null;
  allDocuments: Document[];
  snapshots: Snapshot[];
  editorState: unknown | null;
  isDirty: boolean;
  isAutosaving: boolean;
  loading: boolean;
  loadingAll: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  currentDocument: null,
  allDocuments: [],
  snapshots: [],
  editorState: null,
  isDirty: false,
  isAutosaving: false,
  loading: false,
  loadingAll: false,
  error: null,
};

// Maximum snapshots per document
const MAX_SNAPSHOTS = 20;

export const createDocument = createAsyncThunk(
  'document/create',
  async (title: string, { rejectWithValue }) => {
    try {
      const now = new Date().toISOString();
      const document: Document = {
        id: uuidv4(),
        title,
        content: '',
        status: 'draft',
        domainId: null,
        createdAt: now,
        updatedAt: now,
        lastAutosaveAt: null,
      };

      // In production, this would save to DynamoDB via API
      localStorage.setItem(`doc_${document.id}`, JSON.stringify(document));
      return document;
    } catch (error) {
      return rejectWithValue('Failed to create document');
    }
  }
);

export const loadDocument = createAsyncThunk(
  'document/load',
  async (documentId: string, { rejectWithValue }) => {
    try {
      // In production, this would load from DynamoDB via API
      const stored = localStorage.getItem(`doc_${documentId}`);
      if (stored) {
        return JSON.parse(stored) as Document;
      }
      return rejectWithValue('Document not found');
    } catch (error) {
      return rejectWithValue('Failed to load document');
    }
  }
);

export const saveDocument = createAsyncThunk(
  'document/save',
  async (
    { document, isAutosave }: { document: Document; isAutosave: boolean },
    { rejectWithValue }
  ) => {
    try {
      const now = new Date().toISOString();
      const updatedDocument = {
        ...document,
        updatedAt: now,
        lastAutosaveAt: isAutosave ? now : document.lastAutosaveAt,
      };

      // In production, this would save to DynamoDB via API
      localStorage.setItem(`doc_${document.id}`, JSON.stringify(updatedDocument));
      return { document: updatedDocument, isAutosave };
    } catch (error) {
      return rejectWithValue('Failed to save document');
    }
  }
);

export const createSnapshot = createAsyncThunk(
  'document/createSnapshot',
  async (
    { documentId, content, title, isAutoSave }: { documentId: string; content: string; title?: string; isAutoSave: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const snapshot: Snapshot = {
        id: uuidv4(),
        documentId,
        content,
        title: title || `Snapshot ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        isAutoSave,
      };

      // Get existing snapshots and enforce rolling cap
      const state = getState() as { document: DocumentState };
      let snapshots = [...state.document.snapshots, snapshot];

      // Remove oldest snapshots if over limit
      if (snapshots.length > MAX_SNAPSHOTS) {
        snapshots = snapshots
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, MAX_SNAPSHOTS);
      }

      // In production, this would save to DynamoDB via API
      localStorage.setItem(`snapshots_${documentId}`, JSON.stringify(snapshots));
      return snapshot;
    } catch (error) {
      return rejectWithValue('Failed to create snapshot');
    }
  }
);

export const loadSnapshots = createAsyncThunk(
  'document/loadSnapshots',
  async (documentId: string, { rejectWithValue }) => {
    try {
      // In production, this would load from DynamoDB via API
      const stored = localStorage.getItem(`snapshots_${documentId}`);
      if (stored) {
        return JSON.parse(stored) as Snapshot[];
      }
      return [];
    } catch (error) {
      return rejectWithValue('Failed to load snapshots');
    }
  }
);

export const loadAllDocuments = createAsyncThunk(
  'document/loadAll',
  async (_, { rejectWithValue }) => {
    try {
      const documents: Document[] = [];
      // Iterate through localStorage to find all documents
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('doc_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const doc = JSON.parse(stored) as Document;
              documents.push(doc);
            } catch {
              // Skip invalid entries
            }
          }
        }
      }
      // Sort by updatedAt descending (newest first)
      documents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return documents;
    } catch (error) {
      return rejectWithValue('Failed to load documents');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'document/delete',
  async (documentId: string, { rejectWithValue }) => {
    try {
      // Remove document and its snapshots
      localStorage.removeItem(`doc_${documentId}`);
      localStorage.removeItem(`snapshots_${documentId}`);
      return documentId;
    } catch (error) {
      return rejectWithValue('Failed to delete document');
    }
  }
);

export const duplicateDocument = createAsyncThunk(
  'document/duplicate',
  async (documentId: string, { rejectWithValue }) => {
    try {
      const stored = localStorage.getItem(`doc_${documentId}`);
      if (!stored) {
        return rejectWithValue('Document not found');
      }

      const original = JSON.parse(stored) as Document;
      const now = new Date().toISOString();
      const duplicate: Document = {
        ...original,
        id: uuidv4(),
        title: `${original.title} (Copy)`,
        createdAt: now,
        updatedAt: now,
        lastAutosaveAt: null,
      };

      localStorage.setItem(`doc_${duplicate.id}`, JSON.stringify(duplicate));
      return duplicate;
    } catch (error) {
      return rejectWithValue('Failed to duplicate document');
    }
  }
);

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setEditorState: (state, action: PayloadAction<unknown>) => {
      state.editorState = action.payload;
      state.isDirty = true;
    },
    updateContent: (state, action: PayloadAction<string>) => {
      if (state.currentDocument) {
        state.currentDocument.content = action.payload;
        state.isDirty = true;
      }
    },
    updateTitle: (state, action: PayloadAction<string>) => {
      if (state.currentDocument) {
        state.currentDocument.title = action.payload;
        state.isDirty = true;
      }
    },
    setDomainId: (state, action: PayloadAction<string>) => {
      if (state.currentDocument) {
        state.currentDocument.domainId = action.payload;
        state.isDirty = true;
      }
    },
    markClean: (state) => {
      state.isDirty = false;
    },
    clearDocument: (state) => {
      state.currentDocument = null;
      state.snapshots = [];
      state.editorState = null;
      state.isDirty = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create document
      .addCase(createDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.loading = false;
        state.currentDocument = action.payload;
        state.snapshots = [];
        state.isDirty = false;
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Load document
      .addCase(loadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.loading = false;
        state.currentDocument = action.payload;
        state.isDirty = false;
      })
      .addCase(loadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Save document
      .addCase(saveDocument.pending, (state, action) => {
        if (action.meta.arg.isAutosave) {
          state.isAutosaving = true;
        }
      })
      .addCase(saveDocument.fulfilled, (state, action) => {
        state.currentDocument = action.payload.document;
        state.isDirty = false;
        state.isAutosaving = false;
      })
      .addCase(saveDocument.rejected, (state, action) => {
        state.isAutosaving = false;
        state.error = action.payload as string;
      })
      // Load snapshots
      .addCase(loadSnapshots.fulfilled, (state, action: PayloadAction<Snapshot[]>) => {
        state.snapshots = action.payload;
      })
      // Create snapshot
      .addCase(createSnapshot.fulfilled, (state, action: PayloadAction<Snapshot>) => {
        state.snapshots = [action.payload, ...state.snapshots].slice(0, MAX_SNAPSHOTS);
      })
      // Load all documents
      .addCase(loadAllDocuments.pending, (state) => {
        state.loadingAll = true;
        state.error = null;
      })
      .addCase(loadAllDocuments.fulfilled, (state, action: PayloadAction<Document[]>) => {
        state.loadingAll = false;
        state.allDocuments = action.payload;
      })
      .addCase(loadAllDocuments.rejected, (state, action) => {
        state.loadingAll = false;
        state.error = action.payload as string;
      })
      // Delete document
      .addCase(deleteDocument.fulfilled, (state, action: PayloadAction<string>) => {
        state.allDocuments = state.allDocuments.filter((doc) => doc.id !== action.payload);
        if (state.currentDocument?.id === action.payload) {
          state.currentDocument = null;
          state.snapshots = [];
          state.editorState = null;
          state.isDirty = false;
        }
      })
      // Duplicate document
      .addCase(duplicateDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.allDocuments = [action.payload, ...state.allDocuments];
      });
  },
});

export const {
  setEditorState,
  updateContent,
  updateTitle,
  setDomainId,
  markClean,
  clearDocument,
} = documentSlice.actions;

export default documentSlice.reducer;


