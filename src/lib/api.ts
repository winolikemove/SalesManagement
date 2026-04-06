// =============================================
// API SERVICE LAYER FOR GOOGLE APPS SCRIPT BACKEND
// =============================================

import { API_CONFIG, STORAGE_KEYS } from './constants'
import type { ApiResponse, AuthTokens } from '@/types'

// ============ Types ============
interface ApiRequestOptions {
  action: string
  data?: Record<string, unknown>
  auth?: { token: string }
  skipAuth?: boolean
}

interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number
  retryDelay?: number
}

// ============ Token Management ============
export const TokenManager = {
  getTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null

    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)

      if (!token || !refreshToken || !expiresAt) return null

      return {
        token,
        refreshToken,
        expiresAt: parseInt(expiresAt, 10),
      }
    } catch {
      return null
    }
  },

  setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.token)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokens.expiresAt.toString())
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
  },

  isTokenExpired(): boolean {
    const tokens = this.getTokens()
    if (!tokens) return true
    return Date.now() >= tokens.expiresAt
  },

  shouldRefreshToken(): boolean {
    const tokens = this.getTokens()
    if (!tokens) return false
    return Date.now() >= tokens.expiresAt - API_CONFIG.TOKEN_REFRESH_THRESHOLD
  },

  getValidToken(): string | null {
    if (this.isTokenExpired()) return null
    return this.getTokens()?.token || null
  },
}

// ============ Error Handling ============
export class ApiError extends Error {
  public status?: number
  public code?: string
  public isHtmlError: boolean

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.isHtmlError = message.includes('<!DOCTYPE') || message.includes('<html')
  }
}

function parseErrorResponse(response: Response, text: string): ApiError {
  // Check if response is HTML (GAS error page)
  if (text.includes('<!DOCTYPE') || text.includes('<html')) {
    // Extract error message from HTML if possible
    const titleMatch = text.match(/<title>([^<]*)<\/title>/i)
    const errorMessage = titleMatch ? titleMatch[1] : 'Server error occurred'

    return new ApiError(`Server Error: ${errorMessage}`, response.status, 'SERVER_ERROR')
  }

  // Try to parse JSON error
  try {
    const jsonError = JSON.parse(text)
    return new ApiError(
      jsonError.error || jsonError.message || 'An error occurred',
      response.status,
      jsonError.code
    )
  } catch {
    return new ApiError(text || 'An error occurred', response.status, 'UNKNOWN_ERROR')
  }
}

// ============ Fetch with Retry ============
async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { maxRetries = API_CONFIG.MAX_RETRIES, retryDelay = API_CONFIG.RETRY_DELAY, ...fetchOptions } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions)

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // Retry on server errors (5xx) or network issues
      if (response.ok || attempt === maxRetries) {
        return response
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        throw new ApiError(
          `Network error after ${maxRetries} retries: ${lastError.message}`,
          0,
          'NETWORK_ERROR'
        )
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
    }
  }

  throw lastError || new ApiError('Unknown error occurred', 0, 'UNKNOWN_ERROR')
}

// ============ Token Refresh ============
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshToken(): Promise<string | null> {
  // If already refreshing, wait for the result
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const tokens = TokenManager.getTokens()
      if (!tokens) return null

      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'auth.refreshToken',
          data: { refreshToken: tokens.refreshToken },
        }),
      })

      const text = await response.text()

      if (!response.ok) {
        TokenManager.clearTokens()
        return null
      }

      const result: ApiResponse = JSON.parse(text)

      if (!result.success || !result.token) {
        TokenManager.clearTokens()
        return null
      }

      const newTokens: AuthTokens = {
        token: result.token,
        refreshToken: result.refreshToken || tokens.refreshToken,
        expiresAt: Date.now() + 3600000, // 1 hour default
      }

      TokenManager.setTokens(newTokens)
      return newTokens.token
    } catch {
      TokenManager.clearTokens()
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ============ Main API Call Function ============
export async function apiCall<T = unknown>(
  options: ApiRequestOptions
): Promise<ApiResponse<T>> {
  const { action, data = {}, skipAuth = false } = options

  // Get or refresh token
  let token: string | null = null
  if (!skipAuth) {
    if (TokenManager.shouldRefreshToken()) {
      token = await refreshToken()
    } else {
      token = TokenManager.getValidToken()
    }

    if (!token && !skipAuth) {
      return {
        success: false,
        error: 'Authentication required. Please login again.',
      }
    }
  }

  // Prepare request body
  const body: Record<string, unknown> = {
    action,
    data,
  }

  if (token) {
    body.auth = { token }
  }

  try {
    const response = await fetchWithRetry(API_CONFIG.BASE_URL, {
      method: 'POST',
      redirect: 'follow', // Required for GAS
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Required for GAS
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()

    // Handle HTML error responses from GAS
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      const error = parseErrorResponse(response, text)
      return {
        success: false,
        error: error.message,
      }
    }

    // Parse JSON response
    const result: ApiResponse<T> = JSON.parse(text)

    // Handle API-level errors
    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || result.message || 'Request failed',
      }
    }

    // Update tokens if provided in response
    if (result.token) {
      const tokens: AuthTokens = {
        token: result.token,
        refreshToken: result.refreshToken || TokenManager.getTokens()?.refreshToken || '',
        expiresAt: Date.now() + 3600000,
      }
      TokenManager.setTokens(tokens)
    }

    return result
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}

// ============ Convenience Methods ============
export const api = {
  // Auth
  login: (username: string, password: string) =>
    apiCall<{ user: unknown; token: string; refreshToken: string }>({
      action: 'auth.login',
      data: { username, password },
      skipAuth: true,
    }),

  logout: () => apiCall({ action: 'auth.logout' }),

  refreshToken: () =>
    apiCall<{ token: string; refreshToken: string }>({
      action: 'auth.refreshToken',
      skipAuth: true,
      data: { refreshToken: TokenManager.getTokens()?.refreshToken },
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiCall({ action: 'auth.changePassword', data: { oldPassword, newPassword } }),

  // Config
  getPublicConfig: () =>
    apiCall({ action: 'config.getPublic', skipAuth: true }),

  getAllConfig: () => apiCall({ action: 'config.getAll' }),

  updateConfig: (data: Record<string, unknown>) =>
    apiCall({ action: 'config.update', data }),

  // Setup
  initializeSetup: (data: Record<string, unknown>) =>
    apiCall({ action: 'setup.initialize', data, skipAuth: true }),

  validateSetup: () => apiCall({ action: 'setup.validate', skipAuth: true }),

  getSetupStatus: () => apiCall({ action: 'setup.status', skipAuth: true }),

  // Users
  getUsers: (params?: Record<string, unknown>) =>
    apiCall({ action: 'users.list', data: params }),

  getUser: (id: string) =>
    apiCall({ action: 'users.get', data: { id } }),

  createUser: (data: Record<string, unknown>) =>
    apiCall({ action: 'users.create', data }),

  updateUser: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'users.update', data: { id, ...data } }),

  deleteUser: (id: string) =>
    apiCall({ action: 'users.delete', data: { id } }),

  uploadUserPhoto: (id: string, photo: string) =>
    apiCall({ action: 'users.uploadPhoto', data: { id, photo } }),

  // Customers
  getCustomers: (params?: Record<string, unknown>) =>
    apiCall({ action: 'customers.list', data: params }),

  getCustomer: (id: string) =>
    apiCall({ action: 'customers.get', data: { id } }),

  createCustomer: (data: Record<string, unknown>) =>
    apiCall({ action: 'customers.create', data }),

  updateCustomer: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'customers.update', data: { id, ...data } }),

  deleteCustomer: (id: string) =>
    apiCall({ action: 'customers.delete', data: { id } }),

  searchCustomers: (query: string) =>
    apiCall({ action: 'customers.search', data: { query } }),

  // Products
  getProducts: (params?: Record<string, unknown>) =>
    apiCall({ action: 'products.list', data: params }),

  getProduct: (id: string) =>
    apiCall({ action: 'products.get', data: { id } }),

  createProduct: (data: Record<string, unknown>) =>
    apiCall({ action: 'products.create', data }),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'products.update', data: { id, ...data } }),

  deleteProduct: (id: string) =>
    apiCall({ action: 'products.delete', data: { id } }),

  searchProducts: (query: string) =>
    apiCall({ action: 'products.search', data: { query } }),

  getProductCustomerPrice: (productId: string, customerId: string) =>
    apiCall({ action: 'products.getCustomerPrice', data: { productId, customerId } }),

  // Customer Prices
  getCustomerPrices: (params?: Record<string, unknown>) =>
    apiCall({ action: 'customerPrices.list', data: params }),

  createCustomerPrice: (data: Record<string, unknown>) =>
    apiCall({ action: 'customerPrices.create', data }),

  updateCustomerPrice: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'customerPrices.update', data: { id, ...data } }),

  deleteCustomerPrice: (id: string) =>
    apiCall({ action: 'customerPrices.delete', data: { id } }),

  // Transactions
  getTransactions: (params?: Record<string, unknown>) =>
    apiCall({ action: 'transactions.list', data: params }),

  getTransaction: (id: string) =>
    apiCall({ action: 'transactions.get', data: { id } }),

  createTransaction: (data: Record<string, unknown>) =>
    apiCall({ action: 'transactions.create', data }),

  updateTransaction: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'transactions.update', data: { id, ...data } }),

  deleteTransaction: (id: string) =>
    apiCall({ action: 'transactions.delete', data: { id } }),

  updateTransactionPayment: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'transactions.updatePayment', data: { id, ...data } }),

  // Deliveries
  getDeliveries: (params?: Record<string, unknown>) =>
    apiCall({ action: 'deliveries.list', data: params }),

  getDelivery: (id: string) =>
    apiCall({ action: 'deliveries.get', data: { id } }),

  createDelivery: (data: Record<string, unknown>) =>
    apiCall({ action: 'deliveries.create', data }),

  updateDelivery: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'deliveries.update', data: { id, ...data } }),

  updateDeliveryStatus: (id: string, status: string) =>
    apiCall({ action: 'deliveries.updateStatus', data: { id, status } }),

  completeDelivery: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'deliveries.complete', data: { id, ...data } }),

  uploadDeliveryProof: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'deliveries.uploadProof', data: { id, ...data } }),

  // Drivers
  getDrivers: (params?: Record<string, unknown>) =>
    apiCall({ action: 'drivers.list', data: params }),

  getDriver: (id: string) =>
    apiCall({ action: 'drivers.get', data: { id } }),

  createDriver: (data: Record<string, unknown>) =>
    apiCall({ action: 'drivers.create', data }),

  updateDriver: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'drivers.update', data: { id, ...data } }),

  deleteDriver: (id: string) =>
    apiCall({ action: 'drivers.delete', data: { id } }),

  // Vehicles
  getVehicles: (params?: Record<string, unknown>) =>
    apiCall({ action: 'vehicles.list', data: params }),

  getVehicle: (id: string) =>
    apiCall({ action: 'vehicles.get', data: { id } }),

  createVehicle: (data: Record<string, unknown>) =>
    apiCall({ action: 'vehicles.create', data }),

  updateVehicle: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'vehicles.update', data: { id, ...data } }),

  deleteVehicle: (id: string) =>
    apiCall({ action: 'vehicles.delete', data: { id } }),

  // Targets
  getTargets: (params?: Record<string, unknown>) =>
    apiCall({ action: 'targets.list', data: params }),

  getTarget: (id: string) =>
    apiCall({ action: 'targets.get', data: { id } }),

  createTarget: (data: Record<string, unknown>) =>
    apiCall({ action: 'targets.create', data }),

  updateTarget: (id: string, data: Record<string, unknown>) =>
    apiCall({ action: 'targets.update', data: { id, ...data } }),

  deleteTarget: (id: string) =>
    apiCall({ action: 'targets.delete', data: { id } }),

  getTargetAchievement: (id: string) =>
    apiCall({ action: 'targets.getAchievement', data: { id } }),

  // Reports
  getDashboardStats: (params?: Record<string, unknown>) =>
    apiCall({ action: 'reports.dashboard', data: params }),

  getSalesReport: (params: Record<string, unknown>) =>
    apiCall({ action: 'reports.sales', data: params }),

  getDailyReport: (params?: Record<string, unknown>) =>
    apiCall({ action: 'reports.daily', data: params }),

  getWeeklyReport: (params?: Record<string, unknown>) =>
    apiCall({ action: 'reports.weekly', data: params }),

  getMonthlyReport: (params?: Record<string, unknown>) =>
    apiCall({ action: 'reports.monthly', data: params }),

  getYearlyReport: (params?: Record<string, unknown>) =>
    apiCall({ action: 'reports.yearly', data: params }),

  getTopProducts: (params?: Record<string, unknown>) =>
    apiCall({ action: 'reports.topProducts', data: params }),

  getTopCustomers: (params?: Record<string, unknown>) =>
    apiCall({ action: 'reports.topCustomers', data: params }),

  getTargetAchievementReport: (params?: Record<string, unknown>) =>
    apiCall({ action: 'reports.targetAchievement', data: params }),

  // Export
  exportTransactions: (params: Record<string, unknown>) =>
    apiCall({ action: 'export.transactions', data: params }),

  exportDeliveries: (params: Record<string, unknown>) =>
    apiCall({ action: 'export.deliveries', data: params }),

  exportReport: (params: Record<string, unknown>) =>
    apiCall({ action: 'export.report', data: params }),

  // Files
  uploadFile: (file: string, filename: string) =>
    apiCall({ action: 'files.upload', data: { file, filename } }),

  deleteFile: (url: string) =>
    apiCall({ action: 'files.delete', data: { url } }),
}

export default api
