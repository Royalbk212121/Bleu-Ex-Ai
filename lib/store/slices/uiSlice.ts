import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UIState {
  sidebarCollapsed: boolean
  theme: "light" | "dark" | "system"
  activeView: "dashboard" | "chat" | "editor" | "research" | "analysis"
  notifications: Notification[]
  modals: {
    isSettingsOpen: boolean
    isUpgradeOpen: boolean
    isHelpOpen: boolean
  }
  loading: {
    global: boolean
    components: Record<string, boolean>
  }
}

interface Notification {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  timestamp: string
  read: boolean
}

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: "system",
  activeView: "dashboard",
  notifications: [],
  modals: {
    isSettingsOpen: false,
    isUpgradeOpen: false,
    isHelpOpen: false,
  },
  loading: {
    global: false,
    components: {},
  },
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.theme = action.payload
    },
    setActiveView: (state, action: PayloadAction<UIState["activeView"]>) => {
      state.activeView = action.payload
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, "id" | "timestamp" | "read">>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      }
      state.notifications.unshift(notification)
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload)
      if (notification) {
        notification.read = true
      }
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    openModal: (state, action: PayloadAction<keyof UIState["modals"]>) => {
      state.modals[action.payload] = true
    },
    closeModal: (state, action: PayloadAction<keyof UIState["modals"]>) => {
      state.modals[action.payload] = false
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },
    setComponentLoading: (state, action: PayloadAction<{ component: string; loading: boolean }>) => {
      state.loading.components[action.payload.component] = action.payload.loading
    },
  },
})

export const {
  toggleSidebar,
  setTheme,
  setActiveView,
  addNotification,
  markNotificationRead,
  clearNotifications,
  openModal,
  closeModal,
  setGlobalLoading,
  setComponentLoading,
} = uiSlice.actions

export default uiSlice.reducer
