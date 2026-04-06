// =============================================
// AUTH STORE - Zustand State Management
// =============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, TokenManager } from '@/lib/api'
import { STORAGE_KEYS } from '@/lib/constants'
import type { User, LoginCredentials, AuthTokens } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  initialize: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })

        try {
          const response = await api.login(credentials.username, credentials.password, credentials.rememberMe)

          if (!response.success || !response.data) {
            const errorMessage = response.error || 'Login failed. Please try again.'
            set({ isLoading: false, error: errorMessage })
            return { success: false, error: errorMessage }
          }

          const { user, token, refreshToken } = response.data as unknown as {
            user: User
            token: string
            refreshToken: string
          }

          // Save tokens to localStorage
          const tokens: AuthTokens = {
            token,
            refreshToken,
            expiresAt: Date.now() + 3600000, // 1 hour
          }
          TokenManager.setTokens(tokens)

          // Save user data
          if (credentials.rememberMe) {
            localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return { success: true }
        } catch (error) {
          const errorMessage = (error as Error).message || 'An unexpected error occurred'
          set({ isLoading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        set({ isLoading: true })

        try {
          await api.logout()
        } catch {
          // Ignore logout errors
        } finally {
          TokenManager.clearTokens()
          localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME)

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },

      refreshUser: async () => {
        try {
          const response = await api.getUser('me')

          if (response.success && response.data) {
            set({ user: response.data as User })
          }
        } catch {
          // Ignore refresh errors
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      initialize: async () => {
        if (get().isInitialized) return

        set({ isLoading: true })

        try {
          // Check if we have stored user from persist
          const storedState = get()
          if (storedState.user && storedState.isAuthenticated) {
            set({
              isLoading: false,
              isInitialized: true,
            })
            return
          }

          const tokens = TokenManager.getTokens()

          if (!tokens || TokenManager.isTokenExpired()) {
            TokenManager.clearTokens()
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            })
            return
          }

          // For mock mode, we can skip token validation
          set({
            isLoading: false,
            isInitialized: true,
          })
        } catch {
          TokenManager.clearTokens()
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          })
        }
      },

      checkAuth: async () => {
        const tokens = TokenManager.getTokens()

        if (!tokens) {
          return false
        }

        if (TokenManager.isTokenExpired()) {
          TokenManager.clearTokens()
          set({ user: null, isAuthenticated: false })
          return false
        }

        return get().isAuthenticated
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Hook for checking if user has specific role
export const useHasRole = (roles: string | string[]): boolean => {
  const user = useAuthStore((state) => state.user)

  if (!user) return false

  const roleArray = Array.isArray(roles) ? roles : [roles]
  return roleArray.includes(user.role)
}

// Hook for checking if user is admin
export const useIsAdmin = (): boolean => {
  return useHasRole(['SuperAdmin', 'Manager'])
}

// Hook for getting current user
export const useCurrentUser = (): User | null => {
  return useAuthStore((state) => state.user)
}
