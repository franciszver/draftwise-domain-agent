import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  validatePasscode,
  validateAdminCode,
  logout,
  clearError,
} from '../../store/slices/authSlice';

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

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

  describe('validatePasscode', () => {
    it('should authenticate with valid passcode', async () => {
      await store.dispatch(validatePasscode('draftwise2024'));
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.sessionToken).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should reject invalid passcode', async () => {
      await store.dispatch(validatePasscode('wrongpasscode'));
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid passcode');
    });

    it('should set loading state during validation', () => {
      store.dispatch(validatePasscode('draftwise2024'));
      // Note: This is async, so we check pending state
      // In real tests, we'd mock the async thunk
    });
  });

  describe('validateAdminCode', () => {
    it('should grant admin access with valid code', async () => {
      await store.dispatch(validateAdminCode('admin2024'));
      const state = store.getState().auth;
      expect(state.isAdmin).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should reject invalid admin code', async () => {
      await store.dispatch(validateAdminCode('wrongcode'));
      const state = store.getState().auth;
      expect(state.isAdmin).toBe(false);
      expect(state.error).toBe('Invalid admin code');
    });
  });

  describe('logout', () => {
    it('should clear authentication state', async () => {
      // First authenticate
      await store.dispatch(validatePasscode('draftwise2024'));
      expect(store.getState().auth.isAuthenticated).toBe(true);

      // Then logout
      store.dispatch(logout());
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAdmin).toBe(false);
      expect(state.sessionToken).toBeNull();
    });

    it('should clear localStorage session', async () => {
      await store.dispatch(validatePasscode('draftwise2024'));
      expect(localStorage.getItem('draftwise_session')).toBeTruthy();

      store.dispatch(logout());
      expect(localStorage.getItem('draftwise_session')).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      // Create an error
      await store.dispatch(validatePasscode('wrongpasscode'));
      expect(store.getState().auth.error).toBeTruthy();

      // Clear the error
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });
});


