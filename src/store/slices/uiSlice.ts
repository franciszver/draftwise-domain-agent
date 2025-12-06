import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: 'domain' | 'suggestions' | 'history';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  showRedactionTooltips: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  read: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  rightPanelOpen: true,
  rightPanelTab: 'domain',
  fontSize: 'medium',
  highContrast: false,
  showRedactionTooltips: true,
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleRightPanel: (state) => {
      state.rightPanelOpen = !state.rightPanelOpen;
    },
    setRightPanelTab: (state, action: PayloadAction<UIState['rightPanelTab']>) => {
      state.rightPanelTab = action.payload;
      if (!state.rightPanelOpen) {
        state.rightPanelOpen = true;
      }
    },
    setFontSize: (state, action: PayloadAction<UIState['fontSize']>) => {
      state.fontSize = action.payload;
    },
    toggleHighContrast: (state) => {
      state.highContrast = !state.highContrast;
    },
    toggleRedactionTooltips: (state) => {
      state.showRedactionTooltips = !state.showRedactionTooltips;
    },
    addNotification: (
      state,
      action: PayloadAction<{ type: Notification['type']; message: string }>
    ) => {
      state.notifications.unshift({
        id: Date.now().toString(),
        type: action.payload.type,
        message: action.payload.message,
        timestamp: new Date().toISOString(),
        read: false,
      });
      // Keep only last 50 notifications
      state.notifications = state.notifications.slice(0, 50);
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  toggleRightPanel,
  setRightPanelTab,
  setFontSize,
  toggleHighContrast,
  toggleRedactionTooltips,
  addNotification,
  markNotificationRead,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;


