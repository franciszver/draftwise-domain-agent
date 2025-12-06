import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  sessionToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isAdmin: false,
  sessionToken: null,
  loading: false,
  error: null,
};

// In local dev mode, use environment variables or defaults for passcode validation
// For production, these should come from AWS Secrets Manager via API
const LOCAL_PASSCODE = import.meta.env.VITE_LOCAL_PASSCODE || 'CHANGE_ME_IN_PRODUCTION';
const LOCAL_ADMIN_CODE = import.meta.env.VITE_LOCAL_ADMIN_CODE || 'CHANGE_ME_IN_PRODUCTION';

export const validatePasscode = createAsyncThunk(
  'auth/validatePasscode',
  async (passcode: string, { rejectWithValue }) => {
    try {
      // In local dev, validate against hardcoded values
      // In production, this would call the API
      if (passcode === LOCAL_PASSCODE) {
        const sessionToken = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('draftwise_session', sessionToken);
        return { sessionToken, isAdmin: false };
      }
      return rejectWithValue('Invalid passcode');
    } catch (error) {
      return rejectWithValue('Authentication failed');
    }
  }
);

export const validateAdminCode = createAsyncThunk(
  'auth/validateAdminCode',
  async (adminCode: string, { rejectWithValue }) => {
    try {
      if (adminCode === LOCAL_ADMIN_CODE) {
        return { isAdmin: true };
      }
      return rejectWithValue('Invalid admin code');
    } catch (error) {
      return rejectWithValue('Admin authentication failed');
    }
  }
);

export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      const sessionToken = localStorage.getItem('draftwise_session');
      if (sessionToken) {
        return { sessionToken, isAdmin: false };
      }
      return rejectWithValue('No active session');
    } catch (error) {
      return rejectWithValue('Session check failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.sessionToken = null;
      localStorage.removeItem('draftwise_session');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Validate passcode
      .addCase(validatePasscode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validatePasscode.fulfilled, (state, action: PayloadAction<{ sessionToken: string; isAdmin: boolean }>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.sessionToken = action.payload.sessionToken;
        state.isAdmin = action.payload.isAdmin;
      })
      .addCase(validatePasscode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Validate admin code
      .addCase(validateAdminCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateAdminCode.fulfilled, (state, action: PayloadAction<{ isAdmin: boolean }>) => {
        state.loading = false;
        state.isAdmin = action.payload.isAdmin;
      })
      .addCase(validateAdminCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Check session
      .addCase(checkSession.fulfilled, (state, action: PayloadAction<{ sessionToken: string; isAdmin: boolean }>) => {
        state.isAuthenticated = true;
        state.sessionToken = action.payload.sessionToken;
        state.isAdmin = action.payload.isAdmin;
      })
      .addCase(checkSession.rejected, (state) => {
        state.isAuthenticated = false;
        state.sessionToken = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;


