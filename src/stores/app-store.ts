// =============================================
// APP STORE - Global Application State
// =============================================

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface Breadcrumb {
  title: string
  href?: string
}

interface AppState {
  // Mock Mode
  isMockMode: boolean
  toggleMockMode: () => void
  setMockMode: (value: boolean) => void
  
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Page Header
  pageTitle: string
  breadcrumbs: Breadcrumb[]
  setPageTitle: (title: string) => void
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void
  
  // Global Loading
  isGlobalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
  
  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // App Config (from backend)
  appConfig: Record<string, unknown>
  setAppConfig: (config: Record<string, unknown>) => void
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  read: boolean
  createdAt: string
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Mock Mode - Default to TRUE for testing
      isMockMode: true,
      toggleMockMode: () => set((state) => ({ isMockMode: !state.isMockMode })),
      setMockMode: (value) => set({ isMockMode: value }),
      
      // Sidebar
      sidebarOpen: true,
      sidebarCollapsed: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // Page Header
      pageTitle: 'Dashboard',
      breadcrumbs: [],
      setPageTitle: (title) => set({ pageTitle: title }),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      
      // Global Loading
      isGlobalLoading: false,
      setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: 'notif-' + Date.now(),
          read: false,
          createdAt: new Date().toISOString()
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep last 50
        }))
      },
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }))
      },
      clearNotifications: () => set({ notifications: [] }),
      
      // App Config
      appConfig: {},
      setAppConfig: (config) => set({ appConfig: config })
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => {
        // Return a dummy storage on server side
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return localStorage
      }),
      partialize: (state) => ({
        isMockMode: state.isMockMode,
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        appConfig: state.appConfig
      })
    }
  )
)

// Hook for checking mock mode
export const useMockMode = (): boolean => {
  return useAppStore((state) => state.isMockMode)
}

// Hook for sidebar
export const useSidebar = () => {
  const open = useAppStore((state) => state.sidebarOpen)
  const collapsed = useAppStore((state) => state.sidebarCollapsed)
  const setOpen = useAppStore((state) => state.setSidebarOpen)
  const setCollapsed = useAppStore((state) => state.setSidebarCollapsed)
  const toggle = useAppStore((state) => state.toggleSidebar)
  
  return { open, collapsed, setOpen, setCollapsed, toggle }
}

// Hook for theme
export const useThemeState = () => {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  
  return { theme, setTheme }
}

// Hook for page header
export const usePageHeader = () => {
  const pageTitle = useAppStore((state) => state.pageTitle)
  const breadcrumbs = useAppStore((state) => state.breadcrumbs)
  const setPageTitle = useAppStore((state) => state.setPageTitle)
  const setBreadcrumbs = useAppStore((state) => state.setBreadcrumbs)
  
  return { pageTitle, breadcrumbs, setPageTitle, setBreadcrumbs }
}
