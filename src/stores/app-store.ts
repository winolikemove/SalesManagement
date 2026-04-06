// =============================================
// APP STORE - General Application State
// =============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppConfig } from '@/types'

interface AppState {
  // Config
  config: AppConfig | null
  isLoadingConfig: boolean

  // UI State
  sidebarCollapsed: boolean
  sidebarOpen: boolean // For mobile
  theme: 'light' | 'dark' | 'system'

  // Page State
  pageTitle: string
  breadcrumbs: { title: string; href?: string }[]

  // Actions
  setConfig: (config: AppConfig | null) => void
  setLoadingConfig: (loading: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setPageTitle: (title: string) => void
  setBreadcrumbs: (breadcrumbs: { title: string; href?: string }[]) => void

  // Modal State
  activeModal: string | null
  modalData: unknown
  openModal: (modalId: string, data?: unknown) => void
  closeModal: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Config
      config: null,
      isLoadingConfig: false,

      // UI State
      sidebarCollapsed: false,
      sidebarOpen: false,
      theme: 'system',

      // Page State
      pageTitle: 'Dashboard',
      breadcrumbs: [],

      // Actions
      setConfig: (config) => set({ config }),
      setLoadingConfig: (isLoadingConfig) => set({ isLoadingConfig }),

      toggleSidebar: () =>
        set((state) => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return { sidebarOpen: !state.sidebarOpen }
          }
          return { sidebarCollapsed: !state.sidebarCollapsed }
        }),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setTheme: (theme) => {
        set({ theme })

        if (typeof window !== 'undefined') {
          const root = document.documentElement
          root.classList.remove('light', 'dark')

          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            root.classList.add(systemTheme)
          } else {
            root.classList.add(theme)
          }
        }
      },

      setPageTitle: (pageTitle) => set({ pageTitle }),

      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

      // Modal State
      activeModal: null,
      modalData: null,

      openModal: (modalId, data) =>
        set({
          activeModal: modalId,
          modalData: data,
        }),

      closeModal: () =>
        set({
          activeModal: null,
          modalData: null,
        }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)

// Hook for sidebar state
export const useSidebar = () => {
  const collapsed = useAppStore((state) => state.sidebarCollapsed)
  const open = useAppStore((state) => state.sidebarOpen)
  const toggle = useAppStore((state) => state.toggleSidebar)
  const setCollapsed = useAppStore((state) => state.setSidebarCollapsed)
  const setOpen = useAppStore((state) => state.setSidebarOpen)

  return { collapsed, open, toggle, setCollapsed, setOpen }
}

// Hook for theme
export const useTheme = () => {
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

// Hook for modal
export const useModal = (modalId: string) => {
  const activeModal = useAppStore((state) => state.activeModal)
  const modalData = useAppStore((state) => state.modalData)
  const openModal = useAppStore((state) => state.openModal)
  const closeModal = useAppStore((state) => state.closeModal)

  return {
    isOpen: activeModal === modalId,
    data: modalData,
    open: (data?: unknown) => openModal(modalId, data),
    close: closeModal,
  }
}
