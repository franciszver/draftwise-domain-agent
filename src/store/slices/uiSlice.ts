import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: 'domain' | 'suggestions' | 'history';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  showRedactionTooltips: boolean;
  notifications: Notification[];
  collapsedSuggestions: string[]; // IDs of collapsed suggestion cards
  allSuggestionsCollapsed: boolean;
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
  collapsedSuggestions: [],
  allSuggestionsCollapsed: false,
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
    toggleSuggestionCollapse: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.collapsedSuggestions.includes(id)) {
        state.collapsedSuggestions = state.collapsedSuggestions.filter((s) => s !== id);
      } else {
        state.collapsedSuggestions.push(id);
      }
    },
    collapseAllSuggestions: (state, action: PayloadAction<string[]>) => {
      state.collapsedSuggestions = action.payload;
      state.allSuggestionsCollapsed = true;
    },
    expandAllSuggestions: (state) => {
      state.collapsedSuggestions = [];
      state.allSuggestionsCollapsed = false;
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
  toggleSuggestionCollapse,
  collapseAllSuggestions,
  expandAllSuggestions,
} = uiSlice.actions;

export default uiSlice.reducer;


