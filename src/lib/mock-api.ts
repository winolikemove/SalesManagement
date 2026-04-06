// =============================================
// MOCK API SERVICE
// =============================================

import { 
  mockUsers, 
  mockCustomers, 
  mockProducts, 
  mockDrivers, 
  mockVehicles, 
  mockCustomerPrices,
  mockTransactions,
  mockTransactionItems,
  mockDeliveries,
  mockDeliveryItems,
  mockTargets,
  mockConfig,
  mockDashboardStats,
  mockApiDelay,
  paginateArray
} from './mock-data'
import type { ApiResponse, User, LoginCredentials, AuthTokens } from '@/types'

const MOCK_DELAY = 500 // Simulate network delay

// ============ Mock Token Generation ============
const generateMockToken = () => {
  return 'mock_token_' + Math.random().toString(36).substring(2) + '_' + Date.now()
}

// ============ Mock Auth ============
export const mockAuthApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> => {
    await mockApiDelay(MOCK_DELAY)
    
    const user = mockUsers.find(u => u.username === credentials.username)
    
    if (!user) {
      return {
        success: false,
        error: 'Username atau password salah',
        code: 'INVALID_CREDENTIALS'
      }
    }
    
    // For demo, accept any password
    // In real app, password would be validated
    
    if (!user.isActive) {
      return {
        success: false,
        error: 'Akun tidak aktif',
        code: 'ACCOUNT_INACTIVE'
      }
    }
    
    const token = generateMockToken()
    const refreshToken = generateMockToken()
    
    // Update last login
    user.lastLogin = new Date().toISOString()
    
    return {
      success: true,
      data: {
        user,
        token,
        refreshToken
      },
      token,
      refreshToken,
      expiresIn: 86400
    }
  },
  
  logout: async (): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    return { success: true }
  },
  
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    await mockApiDelay(MOCK_DELAY)
    return {
      success: true,
      data: { token: generateMockToken() },
      token: generateMockToken()
    }
  },
  
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    // For mock, we don't validate current password
    // In real app, this would validate against stored password
    
    if (!data.currentPassword) {
      return {
        success: false,
        error: 'Password saat ini wajib diisi',
        code: 'CURRENT_PASSWORD_REQUIRED'
      }
    }
    
    if (!data.newPassword || data.newPassword.length < 6) {
      return {
        success: false,
        error: 'Password baru minimal 6 karakter',
        code: 'INVALID_NEW_PASSWORD'
      }
    }
    
    // In real app, this would update the password in the database
    return {
      success: true,
      message: 'Password berhasil diubah'
    }
  }
}

// ============ Mock Users ============
export const mockUsersApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    let users = [...mockUsers]
    
    if (params?.search) {
      const search = String(params.search).toLowerCase()
      users = users.filter(u => 
        u.username.toLowerCase().includes(search) ||
        u.fullName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      )
    }
    
    if (params?.role) {
      users = users.filter(u => u.role === params.role)
    }
    
    if (params?.isActive !== undefined) {
      users = users.filter(u => u.isActive === params.isActive)
    }
    
    // Remove password from response
    users = users.map(({ ...u }) => u)
    
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 10
    
    const result = paginateArray(users, page, pageSize)
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    }
  },
  
  get: async (id: string): Promise<ApiResponse<User>> => {
    await mockApiDelay(MOCK_DELAY)
    
    const user = mockUsers.find(u => u.id === id)
    
    if (!user) {
      return {
        success: false,
        error: 'User tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    return {
      success: true,
      data: user
    }
  },
  
  create: async (data: Record<string, unknown>): Promise<ApiResponse<User>> => {
    await mockApiDelay(MOCK_DELAY)
    
    const newUser: User = {
      id: 'user-' + Date.now(),
      username: String(data.username),
      fullName: String(data.fullName),
      email: String(data.email || ''),
      phone: String(data.phone || ''),
      role: data.role as User['role'],
      division: String(data.division || ''),
      photoUrl: '',
      permissions: (data.permissions as string[]) || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockUsers.push(newUser)
    
    return {
      success: true,
      data: newUser
    }
  },
  
  update: async (id: string, data: Record<string, unknown>): Promise<ApiResponse<User>> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockUsers.findIndex(u => u.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'User tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockUsers[index] = {
      ...mockUsers[index],
      ...data,
      updatedAt: new Date().toISOString()
    } as User
    
    return {
      success: true,
      data: mockUsers[index]
    }
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockUsers.findIndex(u => u.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'User tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockUsers[index].isActive = false
    
    return { success: true }
  }
}

// ============ Mock Customers ============
export const mockCustomersApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    let customers = [...mockCustomers]
    
    if (params?.search) {
      const search = String(params.search).toLowerCase()
      customers = customers.filter(c => 
        c.customerCode.toLowerCase().includes(search) ||
        c.customerName.toLowerCase().includes(search)
      )
    }
    
    if (params?.city) {
      customers = customers.filter(c => c.city === params.city)
    }
    
    if (params?.activeOnly !== false) {
      customers = customers.filter(c => c.isActive)
    }
    
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 10
    
    const result = paginateArray(customers, page, pageSize)
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    }
  },
  
  get: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const customer = mockCustomers.find(c => c.id === id)
    
    if (!customer) {
      return {
        success: false,
        error: 'Customer tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    return {
      success: true,
      data: customer
    }
  },
  
  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const newCustomer = {
      id: 'cust-' + Date.now(),
      customerCode: String(data.customerCode),
      customerName: String(data.customerName),
      address: String(data.address),
      city: String(data.city || ''),
      province: String(data.province || ''),
      postalCode: String(data.postalCode || ''),
      googleMapsUrl: String(data.googleMapsUrl || ''),
      picName: String(data.picName || ''),
      picPosition: String(data.picPosition || ''),
      picPhone: String(data.picPhone),
      picEmail: String(data.picEmail || ''),
      creditLimit: Number(data.creditLimit) || 0,
      currentCredit: 0,
      paymentTerms: Number(data.paymentTerms) || 30,
      isActive: true,
      notes: String(data.notes || ''),
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockCustomers.push(newCustomer)
    
    return {
      success: true,
      data: newCustomer
    }
  },
  
  update: async (id: string, data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockCustomers.findIndex(c => c.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Customer tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockCustomers[index] = {
      ...mockCustomers[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    return {
      success: true,
      data: mockCustomers[index]
    }
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockCustomers.findIndex(c => c.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Customer tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockCustomers[index].isActive = false
    
    return { success: true }
  }
}

// ============ Mock Products ============
export const mockProductsApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    let products = [...mockProducts]
    
    if (params?.search) {
      const search = String(params.search).toLowerCase()
      products = products.filter(p => 
        p.productCode.toLowerCase().includes(search) ||
        p.productName.toLowerCase().includes(search)
      )
    }
    
    if (params?.category) {
      products = products.filter(p => p.category === params.category)
    }
    
    if (params?.activeOnly !== false) {
      products = products.filter(p => p.isActive)
    }
    
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 10
    
    const result = paginateArray(products, page, pageSize)
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    }
  },
  
  get: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const product = mockProducts.find(p => p.id === id)
    
    if (!product) {
      return {
        success: false,
        error: 'Produk tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    return {
      success: true,
      data: product
    }
  },
  
  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const newProduct = {
      id: 'prod-' + Date.now(),
      productCode: String(data.productCode),
      productName: String(data.productName),
      category: String(data.category || ''),
      baseUnitWeight: Number(data.baseUnitWeight) || 0,
      basePricePerKg: Number(data.basePricePerKg) || 0,
      basePricePerUnit: Number(data.basePricePerUnit) || 0,
      isPPN: data.isPPN !== false,
      unitName: String(data.unitName),
      kgName: String(data.kgName),
      stockQtyUnit: Number(data.stockQtyUnit) || 0,
      stockQtyKg: Number(data.stockQtyKg) || 0,
      minStock: Number(data.minStock) || 0,
      isActive: true,
      description: String(data.description || ''),
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockProducts.push(newProduct)
    
    return {
      success: true,
      data: newProduct
    }
  },
  
  update: async (id: string, data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockProducts.findIndex(p => p.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Produk tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockProducts[index] = {
      ...mockProducts[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    return {
      success: true,
      data: mockProducts[index]
    }
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockProducts.findIndex(p => p.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Produk tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockProducts[index].isActive = false
    
    return { success: true }
  },
  
  getCustomerPrice: async (productId: string, customerId: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const customerPrice = mockCustomerPrices.find(
      cp => cp.productId === productId && cp.customerId === customerId && cp.isActive
    )
    
    const product = mockProducts.find(p => p.id === productId)
    
    if (!product) {
      return {
        success: false,
        error: 'Produk tidak ditemukan'
      }
    }
    
    if (customerPrice) {
      return {
        success: true,
        data: {
          pricePerKg: customerPrice.specialPricePerKg,
          pricePerUnit: customerPrice.specialPricePerUnit,
          isPPN: customerPrice.isPPN,
          discountPercent: customerPrice.discountPercent,
          isSpecialPrice: true
        }
      }
    }
    
    return {
      success: true,
      data: {
        pricePerKg: product.basePricePerKg,
        pricePerUnit: product.basePricePerUnit,
        isPPN: product.isPPN,
        discountPercent: 0,
        isSpecialPrice: false
      }
    }
  }
}

// ============ Mock Drivers ============
export const mockDriversApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    let drivers = [...mockDrivers]
    
    if (params?.search) {
      const search = String(params.search).toLowerCase()
      drivers = drivers.filter(d => 
        d.driverCode.toLowerCase().includes(search) ||
        d.driverName.toLowerCase().includes(search)
      )
    }
    
    if (params?.activeOnly !== false) {
      drivers = drivers.filter(d => d.isActive)
    }
    
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 10
    
    const result = paginateArray(drivers, page, pageSize)
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    }
  },
  
  get: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const driver = mockDrivers.find(d => d.id === id)
    
    if (!driver) {
      return {
        success: false,
        error: 'Driver tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    return {
      success: true,
      data: driver
    }
  },
  
  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const newDriver = {
      id: 'drv-' + Date.now(),
      driverCode: String(data.driverCode),
      driverName: String(data.driverName),
      phone: String(data.phone),
      licenseNumber: String(data.licenseNumber),
      licenseExpiry: String(data.licenseExpiry),
      address: String(data.address || ''),
      isActive: true,
      notes: String(data.notes || ''),
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockDrivers.push(newDriver)
    
    return {
      success: true,
      data: newDriver
    }
  },
  
  update: async (id: string, data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockDrivers.findIndex(d => d.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Driver tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockDrivers[index] = {
      ...mockDrivers[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    return {
      success: true,
      data: mockDrivers[index]
    }
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockDrivers.findIndex(d => d.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Driver tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockDrivers[index].isActive = false
    
    return { success: true }
  }
}

// ============ Mock Vehicles ============
export const mockVehiclesApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    let vehicles = [...mockVehicles]
    
    if (params?.search) {
      const search = String(params.search).toLowerCase()
      vehicles = vehicles.filter(v => 
        v.vehiclePlate.toLowerCase().includes(search) ||
        v.vehicleBrand?.toLowerCase().includes(search)
      )
    }
    
    if (params?.vehicleType) {
      vehicles = vehicles.filter(v => v.vehicleType === params.vehicleType)
    }
    
    if (params?.activeOnly !== false) {
      vehicles = vehicles.filter(v => v.isActive)
    }
    
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 10
    
    const result = paginateArray(vehicles, page, pageSize)
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    }
  },
  
  get: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const vehicle = mockVehicles.find(v => v.id === id)
    
    if (!vehicle) {
      return {
        success: false,
        error: 'Kendaraan tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    return {
      success: true,
      data: vehicle
    }
  },
  
  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const newVehicle = {
      id: 'veh-' + Date.now(),
      vehiclePlate: String(data.vehiclePlate),
      vehicleType: String(data.vehicleType),
      vehicleBrand: String(data.vehicleBrand || ''),
      vehicleModel: String(data.vehicleModel || ''),
      maxCapacityKg: Number(data.maxCapacityKg) || 0,
      stnkExpiry: String(data.stnkExpiry),
      kirExpiry: String(data.kirExpiry || ''),
      isActive: true,
      notes: String(data.notes || ''),
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockVehicles.push(newVehicle)
    
    return {
      success: true,
      data: newVehicle
    }
  },
  
  update: async (id: string, data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockVehicles.findIndex(v => v.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Kendaraan tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockVehicles[index] = {
      ...mockVehicles[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    return {
      success: true,
      data: mockVehicles[index]
    }
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockVehicles.findIndex(v => v.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Kendaraan tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockVehicles[index].isActive = false
    
    return { success: true }
  }
}

// ============ Mock Transactions ============
export const mockTransactionsApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    let transactions = [...mockTransactions]
    
    if (params?.startDate && params?.endDate) {
      const start = new Date(params.startDate as string)
      const end = new Date(params.endDate as string)
      end.setHours(23, 59, 59, 999)
      
      transactions = transactions.filter(t => {
        const date = new Date(t.invoiceDate)
        return date >= start && date <= end
      })
    }
    
    if (params?.customerId) {
      transactions = transactions.filter(t => t.customerId === params.customerId)
    }
    
    if (params?.paymentStatus) {
      transactions = transactions.filter(t => t.paymentStatus === params.paymentStatus)
    }
    
    if (params?.deliveryStatus) {
      transactions = transactions.filter(t => t.deliveryStatus === params.deliveryStatus)
    }
    
    if (params?.search) {
      const search = String(params.search).toLowerCase()
      transactions = transactions.filter(t =>
        t.invoiceNumber.toLowerCase().includes(search) ||
        t.customerName.toLowerCase().includes(search)
      )
    }
    
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
    
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 10
    
    const result = paginateArray(transactions, page, pageSize)
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    }
  },
  
  get: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const transaction = mockTransactions.find(t => t.id === id)
    
    if (!transaction) {
      return {
        success: false,
        error: 'Transaksi tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    const items = mockTransactionItems.filter(ti => ti.transactionId === id)
    
    return {
      success: true,
      data: {
        ...transaction,
        items
      }
    }
  },
  
  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(mockTransactions.length + 1).padStart(4, '0')}`
    
    const newTransaction = {
      id: 'trx-' + Date.now(),
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      customerId: String(data.customerId),
      customerCode: mockCustomers.find(c => c.id === data.customerId)?.customerCode || '',
      customerName: mockCustomers.find(c => c.id === data.customerId)?.customerName || '',
      customerAddress: mockCustomers.find(c => c.id === data.customerId)?.address || '',
      customerPhone: mockCustomers.find(c => c.id === data.customerId)?.picPhone || '',
      salesId: String(data.salesId || 'user-002'),
      salesName: mockUsers.find(u => u.id === data.salesId)?.fullName || 'Budi Santoso',
      subtotal: Number(data.subtotal) || 0,
      taxAmount: Number(data.taxAmount) || 0,
      discountAmount: Number(data.discountAmount) || 0,
      grandTotal: Number(data.grandTotal) || 0,
      paidAmount: 0,
      remainingAmount: Number(data.grandTotal) || 0,
      paymentStatus: 'UNPAID' as const,
      deliveryStatus: 'PENDING' as const,
      notes: String(data.notes || ''),
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockTransactions.push(newTransaction)
    
    return {
      success: true,
      data: newTransaction
    }
  },
  
  updatePayment: async (id: string, data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockTransactions.findIndex(t => t.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Transaksi tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    const amount = Number(data.amount)
    const newPaidAmount = mockTransactions[index].paidAmount + amount
    const newRemainingAmount = mockTransactions[index].grandTotal - newPaidAmount
    
    let newPaymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID'
    if (newRemainingAmount <= 0) {
      newPaymentStatus = 'PAID'
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'PARTIAL'
    } else {
      newPaymentStatus = 'UNPAID'
    }
    
    mockTransactions[index].paidAmount = newPaidAmount
    mockTransactions[index].remainingAmount = Math.max(0, newRemainingAmount)
    mockTransactions[index].paymentStatus = newPaymentStatus
    
    return {
      success: true,
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, newRemainingAmount),
        paymentStatus: newPaymentStatus
      }
    }
  }
}

// ============ Mock Deliveries ============
export const mockDeliveriesApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    let deliveries = [...mockDeliveries]
    
    if (params?.startDate && params?.endDate) {
      const start = new Date(params.startDate as string)
      const end = new Date(params.endDate as string)
      end.setHours(23, 59, 59, 999)
      
      deliveries = deliveries.filter(d => {
        const date = new Date(d.deliveryDate)
        return date >= start && date <= end
      })
    }
    
    if (params?.status) {
      deliveries = deliveries.filter(d => d.deliveryStatus === params.status)
    }
    
    if (params?.driverId) {
      deliveries = deliveries.filter(d => d.driverId === params.driverId)
    }
    
    if (params?.search) {
      const search = String(params.search).toLowerCase()
      deliveries = deliveries.filter(d =>
        d.deliveryNumber.toLowerCase().includes(search) ||
        d.customerName.toLowerCase().includes(search)
      )
    }
    
    deliveries.sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
    
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 10
    
    const result = paginateArray(deliveries, page, pageSize)
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    }
  },
  
  get: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const delivery = mockDeliveries.find(d => d.id === id)
    
    if (!delivery) {
      return {
        success: false,
        error: 'Pengiriman tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    const items = mockDeliveryItems.filter(di => di.deliveryId === id)
    
    return {
      success: true,
      data: {
        ...delivery,
        items
      }
    }
  },
  
  updateStatus: async (id: string, status: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockDeliveries.findIndex(d => d.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Pengiriman tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockDeliveries[index].deliveryStatus = status as typeof mockDeliveries[0]['deliveryStatus']
    
    if (status === 'DELIVERED') {
      mockDeliveries[index].deliveryTime = new Date().toISOString()
    }
    
    return {
      success: true,
      data: mockDeliveries[index]
    }
  }
}

// ============ Mock Targets ============
export const mockTargetsApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    let targets = [...mockTargets]
    
    if (params?.year) {
      targets = targets.filter(t => t.year === Number(params.year))
    }
    
    if (params?.month) {
      targets = targets.filter(t => t.month === Number(params.month))
    }
    
    if (params?.targetType) {
      targets = targets.filter(t => t.targetType === params.targetType)
    }
    
    targets.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
    
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 10
    
    const result = paginateArray(targets, page, pageSize)
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    }
  },
  
  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const newTarget = {
      id: 'tgt-' + Date.now(),
      year: Number(data.year),
      month: Number(data.month),
      targetType: String(data.targetType),
      targetEntityId: String(data.targetEntityId || ''),
      targetEntityName: String(data.targetEntityName || ''),
      targetAmount: Number(data.targetAmount) || 0,
      targetQtyUnit: Number(data.targetQtyUnit) || 0,
      targetQtyKg: Number(data.targetQtyKg) || 0,
      targetCustomerCount: Number(data.targetCustomerCount) || 0,
      achievedAmount: 0,
      achievedQtyUnit: 0,
      achievedQtyKg: 0,
      achievedCustomerCount: 0,
      achievementPercent: 0,
      notes: String(data.notes || ''),
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockTargets.push(newTarget)
    
    return {
      success: true,
      data: newTarget
    }
  }
}

// ============ Mock Config ============
export const mockConfigApi = {
  getPublic: async (): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    return {
      success: true,
      data: {
        APP_NAME: mockConfig.APP_NAME,
        APP_VERSION: mockConfig.APP_VERSION,
        COMPANY_NAME: mockConfig.COMPANY_NAME,
        LOGO_URL: mockConfig.LOGO_URL,
        BANNER_URL: mockConfig.BANNER_URL
      }
    }
  },
  
  getAll: async (): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    return {
      success: true,
      data: mockConfig
    }
  },
  
  update: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    Object.assign(mockConfig, data)
    
    return { success: true }
  }
}

// ============ Mock Dashboard ============
export const mockDashboardApi = {
  getStats: async (): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    return {
      success: true,
      data: mockDashboardStats
    }
  }
}

// ============ Mock Customer Prices ============
export const mockCustomerPricesApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    let prices = [...mockCustomerPrices]
    
    if (params?.customerId) {
      prices = prices.filter(p => p.customerId === params.customerId)
    }
    
    if (params?.productId) {
      prices = prices.filter(p => p.productId === params.productId)
    }
    
    if (params?.activeOnly !== false) {
      prices = prices.filter(p => p.isActive)
    }
    
    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 10
    
    const result = paginateArray(prices, page, pageSize)
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    }
  },
  
  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const customer = mockCustomers.find(c => c.id === data.customerId)
    const product = mockProducts.find(p => p.id === data.productId)
    
    const newPrice = {
      id: 'cp-' + Date.now(),
      customerId: String(data.customerId),
      customerCode: customer?.customerCode || '',
      customerName: customer?.customerName || '',
      productId: String(data.productId),
      productCode: product?.productCode || '',
      productName: product?.productName || '',
      specialPricePerKg: Number(data.specialPricePerKg) || 0,
      specialPricePerUnit: Number(data.specialPricePerUnit) || 0,
      discountPercent: Number(data.discountPercent) || 0,
      isPPN: data.isPPN !== false,
      effectiveDate: String(data.effectiveDate),
      expiryDate: String(data.expiryDate || ''),
      isActive: true,
      notes: String(data.notes || ''),
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockCustomerPrices.push(newPrice)
    
    return {
      success: true,
      data: newPrice
    }
  },
  
  update: async (id: string, data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockCustomerPrices.findIndex(p => p.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Data tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockCustomerPrices[index] = {
      ...mockCustomerPrices[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    return {
      success: true,
      data: mockCustomerPrices[index]
    }
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    const index = mockCustomerPrices.findIndex(p => p.id === id)
    
    if (index === -1) {
      return {
        success: false,
        error: 'Data tidak ditemukan',
        code: 'NOT_FOUND'
      }
    }
    
    mockCustomerPrices.splice(index, 1)
    
    return { success: true }
  }
}

export default {
  auth: mockAuthApi,
  users: mockUsersApi,
  customers: mockCustomersApi,
  products: mockProductsApi,
  drivers: mockDriversApi,
  vehicles: mockVehiclesApi,
  transactions: mockTransactionsApi,
  deliveries: mockDeliveriesApi,
  targets: mockTargetsApi,
  config: mockConfigApi,
  dashboard: mockDashboardApi,
  customerPrices: mockCustomerPricesApi
}
