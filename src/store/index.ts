import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import documentReducer from './slices/documentSlice';
import domainReducer from './slices/domainSlice';
import suggestionsReducer from './slices/suggestionsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    document: documentReducer,
    domain: domainReducer,
    suggestions: suggestionsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in Lexical editor state
        ignoredActions: ['document/setEditorState'],
        ignoredPaths: ['document.editorState'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


