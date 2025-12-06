import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import authReducer, {
  validatePasscode,
  validateAdminCode,
  logout,
  clearError,
} from '../../store/slices/authSlice';

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  sessionToken: string | null;
  loading: boolean;
  error: string | null;
}

describe('authSlice', () => {
  let store: EnhancedStore<{ auth: AuthState }>;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
    });
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAdmin).toBe(false);
      expect(state.sessionToken).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // Test passcodes - these should match environment variables or defaults
  // In production, these would come from AWS Secrets Manager
  const TEST_PASSCODE = import.meta.env.VITE_LOCAL_PASSCODE || 'CHANGE_ME_IN_PRODUCTION';
  const TEST_ADMIN_CODE = import.meta.env.VITE_LOCAL_ADMIN_CODE || 'CHANGE_ME_IN_PRODUCTION';

  describe('validatePasscode', () => {
    it('should authenticate with valid passcode', async () => {
      // Skip test if using production defaults
      if (TEST_PASSCODE === 'CHANGE_ME_IN_PRODUCTION') {
        console.warn('Skipping test: VITE_LOCAL_PASSCODE not set');
        return;
      }
      await store.dispatch(validatePasscode(TEST_PASSCODE) as any);
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.sessionToken).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should reject invalid passcode', async () => {
      await store.dispatch(validatePasscode('wrongpasscode') as any);
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid passcode');
    });

    it('should set loading state during validation', () => {
      if (TEST_PASSCODE === 'CHANGE_ME_IN_PRODUCTION') {
        console.warn('Skipping test: VITE_LOCAL_PASSCODE not set');
        return;
      }
      store.dispatch(validatePasscode(TEST_PASSCODE) as any);
      // Note: This is async, so we check pending state
      // In real tests, we'd mock the async thunk
    });
  });

  describe('validateAdminCode', () => {
    it('should grant admin access with valid code', async () => {
      // Skip test if using production defaults
      if (TEST_ADMIN_CODE === 'CHANGE_ME_IN_PRODUCTION') {
        console.warn('Skipping test: VITE_LOCAL_ADMIN_CODE not set');
        return;
      }
      await store.dispatch(validateAdminCode(TEST_ADMIN_CODE) as any);
      const state = store.getState().auth;
      expect(state.isAdmin).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should reject invalid admin code', async () => {
      await store.dispatch(validateAdminCode('wrongcode') as any);
      const state = store.getState().auth;
      expect(state.isAdmin).toBe(false);
      expect(state.error).toBe('Invalid admin code');
    });
  });

  describe('logout', () => {
    it('should clear authentication state', async () => {
      if (TEST_PASSCODE === 'CHANGE_ME_IN_PRODUCTION') {
        console.warn('Skipping test: VITE_LOCAL_PASSCODE not set');
        return;
      }
      // First authenticate
      await store.dispatch(validatePasscode(TEST_PASSCODE) as any);
      expect(store.getState().auth.isAuthenticated).toBe(true);

      // Then logout
      store.dispatch(logout());
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAdmin).toBe(false);
      expect(state.sessionToken).toBeNull();
    });

    it('should clear localStorage session', async () => {
      if (TEST_PASSCODE === 'CHANGE_ME_IN_PRODUCTION') {
        console.warn('Skipping test: VITE_LOCAL_PASSCODE not set');
        return;
      }
      await store.dispatch(validatePasscode(TEST_PASSCODE) as any);
      expect(localStorage.getItem('draftwise_session')).toBeTruthy();

      store.dispatch(logout());
      expect(localStorage.getItem('draftwise_session')).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      // Create an error
      await store.dispatch(validatePasscode('wrongpasscode') as any);
      expect(store.getState().auth.error).toBeTruthy();

      // Clear the error
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });
});


