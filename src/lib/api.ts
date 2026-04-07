// =============================================
// API SERVICE LAYER - Unified API with Mock Support
// =============================================

import { API_CONFIG, STORAGE_KEYS } from './constants'
import type { ApiResponse, AuthTokens, User, LoginCredentials } from '@/types'

// ============ Mock API Import ============
import mockApi from './mock-api'

// ============ Types ============
interface ApiRequestOptions {
  action: string
  data?: Record<string, unknown>
  skipAuth?: boolean
}

interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number
  retryDelay?: number
}

// ============ Mock Mode Check ============
export const isMockModeEnabled = (): boolean => {
  if (typeof window === 'undefined') return true // Default to mock on SSR
  const stored = localStorage.getItem(STORAGE_KEYS.MOCK_MODE)
  return stored !== 'false' // Default to true if not set
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
    const titleMatch = text.match(/<title>([^<]*)<\/title>/i)
    const errorMessage = titleMatch ? titleMatch[1] : 'Server error occurred'

    return new ApiError(`Server Error: ${errorMessage}`, response.status, 'SERVER_ERROR')
  }

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

      if (response.status >= 400 && response.status < 500) {
        return response
      }

      if (response.ok || attempt === maxRetries) {
        return response
      }

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
        expiresAt: Date.now() + 3600000,
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

// ============ Real API Call (GAS Backend) ============
async function realApiCall<T = unknown>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
  const { action, data = {}, skipAuth = false } = options

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
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()

    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      const error = parseErrorResponse(response, text)
      return {
        success: false,
        error: error.message,
      }
    }

    const result: ApiResponse<T> = JSON.parse(text)

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || result.message || 'Request failed',
      }
    }

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

// ============ Unified API Call ============
async function apiCall<T = unknown>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
  // Check if mock mode is enabled
  if (isMockModeEnabled()) {
    return mockApiCall<T>(options)
  }
  
  return realApiCall<T>(options)
}

// ============ Mock API Call Router ============
async function mockApiCall<T = unknown>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
  const { action, data = {} } = options
  
  // Route to appropriate mock API handler
  switch (action) {
    // Auth
    case 'auth.login':
      return mockApi.auth.login(data as LoginCredentials) as Promise<ApiResponse<T>>
    case 'auth.logout':
      return mockApi.auth.logout() as Promise<ApiResponse<T>>
    case 'auth.refreshToken':
      return mockApi.auth.refreshToken() as Promise<ApiResponse<T>>
    case 'auth.changePassword':
      return mockApi.auth.changePassword(data as { currentPassword: string; newPassword: string }) as Promise<ApiResponse<T>>
    
    // Users
    case 'users.list':
      return mockApi.users.list(data) as Promise<ApiResponse<T>>
    case 'users.get':
      return mockApi.users.get(data.id as string) as Promise<ApiResponse<T>>
    case 'users.create':
      return mockApi.users.create(data) as Promise<ApiResponse<T>>
    case 'users.update':
      return mockApi.users.update(data.id as string, data) as Promise<ApiResponse<T>>
    case 'users.delete':
      return mockApi.users.delete(data.id as string) as Promise<ApiResponse<T>>
    
    // Customers
    case 'customers.list':
      return mockApi.customers.list(data) as Promise<ApiResponse<T>>
    case 'customers.get':
      return mockApi.customers.get(data.id as string) as Promise<ApiResponse<T>>
    case 'customers.create':
      return mockApi.customers.create(data) as Promise<ApiResponse<T>>
    case 'customers.update':
      return mockApi.customers.update(data.id as string, data) as Promise<ApiResponse<T>>
    case 'customers.delete':
      return mockApi.customers.delete(data.id as string) as Promise<ApiResponse<T>>
    
    // Products
    case 'products.list':
      return mockApi.products.list(data) as Promise<ApiResponse<T>>
    case 'products.get':
      return mockApi.products.get(data.id as string) as Promise<ApiResponse<T>>
    case 'products.create':
      return mockApi.products.create(data) as Promise<ApiResponse<T>>
    case 'products.update':
      return mockApi.products.update(data.id as string, data) as Promise<ApiResponse<T>>
    case 'products.delete':
      return mockApi.products.delete(data.id as string) as Promise<ApiResponse<T>>
    case 'products.getCustomerPrice':
      return mockApi.products.getCustomerPrice(data.productId as string, data.customerId as string) as Promise<ApiResponse<T>>
    
    // Drivers
    case 'drivers.list':
      return mockApi.drivers.list(data) as Promise<ApiResponse<T>>
    case 'drivers.get':
      return mockApi.drivers.get(data.id as string) as Promise<ApiResponse<T>>
    case 'drivers.create':
      return mockApi.drivers.create(data) as Promise<ApiResponse<T>>
    case 'drivers.update':
      return mockApi.drivers.update(data.id as string, data) as Promise<ApiResponse<T>>
    case 'drivers.delete':
      return mockApi.drivers.delete(data.id as string) as Promise<ApiResponse<T>>
    
    // Vehicles
    case 'vehicles.list':
      return mockApi.vehicles.list(data) as Promise<ApiResponse<T>>
    case 'vehicles.get':
      return mockApi.vehicles.get(data.id as string) as Promise<ApiResponse<T>>
    case 'vehicles.create':
      return mockApi.vehicles.create(data) as Promise<ApiResponse<T>>
    case 'vehicles.update':
      return mockApi.vehicles.update(data.id as string, data) as Promise<ApiResponse<T>>
    case 'vehicles.delete':
      return mockApi.vehicles.delete(data.id as string) as Promise<ApiResponse<T>>
    
    // Transactions
    case 'transactions.list':
      return mockApi.transactions.list(data) as Promise<ApiResponse<T>>
    case 'transactions.get':
      return mockApi.transactions.get(data.id as string) as Promise<ApiResponse<T>>
    case 'transactions.create':
      return mockApi.transactions.create(data) as Promise<ApiResponse<T>>
    case 'transactions.updatePayment':
      return mockApi.transactions.updatePayment(data.id as string, data) as Promise<ApiResponse<T>>
    
    // Deliveries
    case 'deliveries.list':
      return mockApi.deliveries.list(data) as Promise<ApiResponse<T>>
    case 'deliveries.get':
      return mockApi.deliveries.get(data.id as string) as Promise<ApiResponse<T>>
    case 'deliveries.create':
      return mockApi.deliveries.create(data) as Promise<ApiResponse<T>>
    case 'deliveries.updateStatus':
      return mockApi.deliveries.updateStatus(data.id as string, data.status as string, data.receiverName as string) as Promise<ApiResponse<T>>
    
    // Targets
    case 'targets.list':
      return mockApi.targets.list(data) as Promise<ApiResponse<T>>
    case 'targets.create':
      return mockApi.targets.create(data) as Promise<ApiResponse<T>>
    
    // Customer Prices
    case 'customerPrices.list':
      return mockApi.customerPrices.list(data) as Promise<ApiResponse<T>>
    case 'customerPrices.create':
      return mockApi.customerPrices.create(data) as Promise<ApiResponse<T>>
    case 'customerPrices.update':
      return mockApi.customerPrices.update(data.id as string, data) as Promise<ApiResponse<T>>
    case 'customerPrices.delete':
      return mockApi.customerPrices.delete(data.id as string) as Promise<ApiResponse<T>>
    
    // Config
    case 'config.getPublic':
      return mockApi.config.getPublic() as Promise<ApiResponse<T>>
    case 'config.getAll':
      return mockApi.config.getAll() as Promise<ApiResponse<T>>
    case 'config.update':
      return mockApi.config.update(data) as Promise<ApiResponse<T>>
    
    // Dashboard/Reports
    case 'reports.dashboard':
      return mockApi.dashboard.getStats() as Promise<ApiResponse<T>>
    
    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
      }
  }
}

// ============ Convenience API Methods ============
export const api = {
  // Auth
  login: (username: string, password: string, rememberMe?: boolean) =>
    apiCall<{ user: User; token: string; refreshToken: string }>({
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

  // Config
  getPublicConfig: () => apiCall({ action: 'config.getPublic', skipAuth: true }),
  getAllConfig: () => apiCall({ action: 'config.getAll' }),
  updateConfig: (data: Record<string, unknown>) => apiCall({ action: 'config.update', data }),

  // Users
  getUsers: (params?: Record<string, unknown>) => apiCall({ action: 'users.list', data: params }),
  getUser: (id: string) => apiCall({ action: 'users.get', data: { id } }),
  createUser: (data: Record<string, unknown>) => apiCall({ action: 'users.create', data }),
  updateUser: (id: string, data: Record<string, unknown>) => apiCall({ action: 'users.update', data: { id, ...data } }),
  deleteUser: (id: string) => apiCall({ action: 'users.delete', data: { id } }),

  // Customers
  getCustomers: (params?: Record<string, unknown>) => apiCall({ action: 'customers.list', data: params }),
  getCustomer: (id: string) => apiCall({ action: 'customers.get', data: { id } }),
  createCustomer: (data: Record<string, unknown>) => apiCall({ action: 'customers.create', data }),
  updateCustomer: (id: string, data: Record<string, unknown>) => apiCall({ action: 'customers.update', data: { id, ...data } }),
  deleteCustomer: (id: string) => apiCall({ action: 'customers.delete', data: { id } }),

  // Products
  getProducts: (params?: Record<string, unknown>) => apiCall({ action: 'products.list', data: params }),
  getProduct: (id: string) => apiCall({ action: 'products.get', data: { id } }),
  createProduct: (data: Record<string, unknown>) => apiCall({ action: 'products.create', data }),
  updateProduct: (id: string, data: Record<string, unknown>) => apiCall({ action: 'products.update', data: { id, ...data } }),
  deleteProduct: (id: string) => apiCall({ action: 'products.delete', data: { id } }),
  getProductCustomerPrice: (productId: string, customerId: string) =>
    apiCall({ action: 'products.getCustomerPrice', data: { productId, customerId } }),

  // Customer Prices
  getCustomerPrices: (params?: Record<string, unknown>) => apiCall({ action: 'customerPrices.list', data: params }),
  createCustomerPrice: (data: Record<string, unknown>) => apiCall({ action: 'customerPrices.create', data }),
  updateCustomerPrice: (id: string, data: Record<string, unknown>) => apiCall({ action: 'customerPrices.update', data: { id, ...data } }),
  deleteCustomerPrice: (id: string) => apiCall({ action: 'customerPrices.delete', data: { id } }),

  // Drivers
  getDrivers: (params?: Record<string, unknown>) => apiCall({ action: 'drivers.list', data: params }),
  getDriver: (id: string) => apiCall({ action: 'drivers.get', data: { id } }),
  createDriver: (data: Record<string, unknown>) => apiCall({ action: 'drivers.create', data }),
  updateDriver: (id: string, data: Record<string, unknown>) => apiCall({ action: 'drivers.update', data: { id, ...data } }),
  deleteDriver: (id: string) => apiCall({ action: 'drivers.delete', data: { id } }),

  // Vehicles
  getVehicles: (params?: Record<string, unknown>) => apiCall({ action: 'vehicles.list', data: params }),
  getVehicle: (id: string) => apiCall({ action: 'vehicles.get', data: { id } }),
  createVehicle: (data: Record<string, unknown>) => apiCall({ action: 'vehicles.create', data }),
  updateVehicle: (id: string, data: Record<string, unknown>) => apiCall({ action: 'vehicles.update', data: { id, ...data } }),
  deleteVehicle: (id: string) => apiCall({ action: 'vehicles.delete', data: { id } }),

  // Transactions
  getTransactions: (params?: Record<string, unknown>) => apiCall({ action: 'transactions.list', data: params }),
  getTransaction: (id: string) => apiCall({ action: 'transactions.get', data: { id } }),
  createTransaction: (data: Record<string, unknown>) => apiCall({ action: 'transactions.create', data }),
  updateTransactionPayment: (id: string, data: Record<string, unknown>) => apiCall({ action: 'transactions.updatePayment', data: { id, ...data } }),

  // Deliveries
  getDeliveries: (params?: Record<string, unknown>) => apiCall({ action: 'deliveries.list', data: params }),
  getDelivery: (id: string) => apiCall({ action: 'deliveries.get', data: { id } }),
  createDelivery: (data: Record<string, unknown>) => apiCall({ action: 'deliveries.create', data }),
  updateDeliveryStatus: (id: string, status: string, receiverName?: string) =>
    apiCall({ action: 'deliveries.updateStatus', data: { id, status, receiverName } }),

  // Targets
  getTargets: (params?: Record<string, unknown>) => apiCall({ action: 'targets.list', data: params }),
  createTarget: (data: Record<string, unknown>) => apiCall({ action: 'targets.create', data }),

  // Dashboard
  getDashboardStats: () => apiCall({ action: 'reports.dashboard' }),

  // Raw API call for custom actions
  call: <T = unknown>(action: string, data?: Record<string, unknown>) => apiCall<T>({ action, data }),
}

export default api
