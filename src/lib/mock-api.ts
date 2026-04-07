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
    
    // Build transactions with items from mockTransactionItems (to get latest fulfillment status)
    let transactions = mockTransactions.map(tx => ({
      ...tx,
      items: mockTransactionItems.filter(item => item.transactionId === tx.id)
    }))
    
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
    
    console.log('[TRANSACTIONS LIST] Returning', result.data.length, 'transactions with items')
    result.data.forEach(tx => {
      console.log('[TRANSACTIONS LIST] Transaction', tx.invoiceNumber, 'items:', tx.items?.map(i => ({
        product: i.productName,
        fulfillmentStatus: i.fulfillmentStatus,
        qtyFulfilled: i.qtyFulfilledUnit,
        qtyOrder: i.qtyOrderUnit
      })))
    })
    
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
    const transactionId = 'trx-' + Date.now()
    
    // Calculate totals from items
    const items = (data.items as Array<Record<string, unknown>>) || []
    let subtotal = 0
    
    // Create transaction items
    const transactionItems = items.map((item, index) => {
      const product = mockProducts.find(p => p.id === item.productId)
      const qtyOrderUnit = Number(item.qtyOrderUnit) || 1
      const qtyOrderKg = Number(item.qtyOrderKg) || (qtyOrderUnit * (product?.baseUnitWeight || 1))
      const pricePerUnit = Number(item.pricePerUnit) || product?.basePricePerUnit || 0
      const pricePerKg = Number(item.pricePerKg) || product?.basePricePerKg || 0
      const discount = Number(item.discount) || 0
      const itemSubtotal = (qtyOrderUnit * pricePerUnit) - discount
      
      subtotal += itemSubtotal
      
      return {
        id: `item-${transactionId}-${index}`,
        transactionId,
        invoiceNumber,
        productId: String(item.productId || ''),
        productCode: String(item.productCode || product?.productCode || ''),
        productName: String(item.productName || product?.productName || ''),
        unitWeight: Number(item.unitWeight || product?.baseUnitWeight || 1),
        pricePerKg,
        pricePerUnit,
        qtyOrderUnit,
        qtyOrderKg,
        qtyFulfilledUnit: 0,
        qtyFulfilledKg: 0,
        qtyUnfulfilledUnit: qtyOrderUnit,
        qtyUnfulfilledKg: qtyOrderKg,
        unitName: String(item.unitName || product?.unitName || 'Pcs'),
        kgName: String(item.kgName || product?.kgName || 'Kg'),
        isPPN: Boolean(item.isPPN ?? true),
        subtotal: itemSubtotal,
        taxAmount: 0,
        totalAmount: itemSubtotal,
        fulfillmentStatus: 'UNFULFILLED' as const,
        notes: '',
        createdAt: new Date().toISOString(),
      }
    })
    
    const taxAmount = Number(data.taxAmount) || 0
    const discountAmount = Number(data.discountAmount) || 0
    const grandTotal = Number(data.grandTotal) || (subtotal + taxAmount - discountAmount)
    const paidAmount = Number(data.paidAmount) || 0
    
    // Determine payment status
    let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID'
    if (paidAmount >= grandTotal) {
      paymentStatus = 'PAID'
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL'
    }
    
    const newTransaction = {
      id: transactionId,
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      customerId: String(data.customerId),
      customerCode: mockCustomers.find(c => c.id === data.customerId)?.customerCode || '',
      customerName: mockCustomers.find(c => c.id === data.customerId)?.customerName || '',
      customerAddress: mockCustomers.find(c => c.id === data.customerId)?.address || '',
      customerPhone: mockCustomers.find(c => c.id === data.customerId)?.picPhone || '',
      salesId: String(data.salesId || 'user-002'),
      salesName: String(data.salesName || mockUsers.find(u => u.id === data.salesId)?.fullName || 'Budi Santoso'),
      subtotal,
      taxAmount,
      discountAmount,
      grandTotal,
      paidAmount,
      remainingAmount: grandTotal - paidAmount,
      paymentStatus,
      deliveryStatus: (data.deliveryStatus as 'PENDING' | 'PROCESSING' | 'PARTIAL' | 'DELIVERED') || 'PENDING',
      notes: String(data.notes || ''),
      items: transactionItems,
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockTransactions.push(newTransaction)
    // Also add items to mockTransactionItems for backward compatibility
    transactionItems.forEach(item => mockTransactionItems.push(item))
    
    // ========== FULFILLMENT LOGIC ==========
    // If this is a fulfillment invoice, update the original transaction items
    // Check if any item has source tracking info
    const hasSourceTracking = items.some(item => 
      item.sourceTransactionId && String(item.sourceTransactionId).trim() !== ''
    )
    
    console.log('[FULFILLMENT] Processing transaction:', {
      isFulfillmentInvoice: data.isFulfillmentInvoice,
      hasSourceTracking,
      itemsWithSource: items.filter(i => i.sourceTransactionId).map(i => ({
        productId: i.productId,
        sourceTransactionId: i.sourceTransactionId,
        sourceItemId: i.sourceItemId,
        fulfilledQty: i.fulfilledQty,
        qtyOrderUnit: i.qtyOrderUnit
      }))
    })
    
    if (data.isFulfillmentInvoice || hasSourceTracking) {
      items.forEach(item => {
        const sourceTransactionId = String(item.sourceTransactionId || '').trim()
        const sourceItemId = String(item.sourceItemId || '').trim()
        const fulfilledQty = Number(item.fulfilledQty || item.qtyOrderUnit) || 0
        
        console.log('[FULFILLMENT] Processing item:', {
          sourceTransactionId,
          sourceItemId,
          fulfilledQty
        })
        
        if (sourceTransactionId && sourceItemId && fulfilledQty > 0) {
          // Find and update the original transaction item
          const sourceTransactionIndex = mockTransactions.findIndex(t => t.id === sourceTransactionId)
          
          console.log('[FULFILLMENT] Source transaction index:', sourceTransactionIndex)
          
          if (sourceTransactionIndex !== -1) {
            const sourceTransaction = mockTransactions[sourceTransactionIndex]
            
            // Update the source item in the transaction
            if (sourceTransaction.items) {
              const sourceItemIndex = sourceTransaction.items.findIndex(i => i.id === sourceItemId)
              
              console.log('[FULFILLMENT] Source item index:', sourceItemIndex, 'items count:', sourceTransaction.items.length)
              
              if (sourceItemIndex !== -1) {
                const sourceItem = sourceTransaction.items[sourceItemIndex]
                
                // Update fulfilled quantities
                const newQtyFulfilledUnit = (sourceItem.qtyFulfilledUnit || 0) + fulfilledQty
                const newQtyFulfilledKg = newQtyFulfilledUnit * sourceItem.unitWeight
                const qtyRemaining = sourceItem.qtyOrderUnit - newQtyFulfilledUnit
                
                // Determine new fulfillment status
                let newFulfillmentStatus: 'UNFULFILLED' | 'PARTIAL' | 'FULFILLED'
                if (qtyRemaining <= 0) {
                  newFulfillmentStatus = 'FULFILLED'
                } else if (newQtyFulfilledUnit > 0) {
                  newFulfillmentStatus = 'PARTIAL'
                } else {
                  newFulfillmentStatus = 'UNFULFILLED'
                }
                
                console.log('[FULFILLMENT] Updating source item:', {
                  sourceItemId,
                  oldFulfillmentStatus: sourceItem.fulfillmentStatus,
                  newFulfillmentStatus,
                  oldQtyFulfilled: sourceItem.qtyFulfilledUnit,
                  newQtyFulfilledUnit,
                  qtyRemaining
                })
                
                // Update the source item
                const updatedItem = {
                  ...sourceItem,
                  qtyFulfilledUnit: newQtyFulfilledUnit,
                  qtyFulfilledKg: newQtyFulfilledKg,
                  qtyUnfulfilledUnit: Math.max(0, qtyRemaining),
                  qtyUnfulfilledKg: Math.max(0, qtyRemaining * sourceItem.unitWeight),
                  fulfillmentStatus: newFulfillmentStatus
                }
                
                sourceTransaction.items[sourceItemIndex] = updatedItem
                
                // Also update in mockTransactionItems array
                const mockItemIndex = mockTransactionItems.findIndex(i => i.id === sourceItemId)
                if (mockItemIndex !== -1) {
                  mockTransactionItems[mockItemIndex] = updatedItem
                }
                
                // Update the transaction in the array (for reactivity)
                mockTransactions[sourceTransactionIndex] = {
                  ...sourceTransaction,
                  items: [...sourceTransaction.items]
                }
                
                console.log('[FULFILLMENT] Update complete. Transaction updated:', mockTransactions[sourceTransactionIndex].id)
              } else {
                console.log('[FULFILLMENT] Source item not found. Available item IDs:', sourceTransaction.items.map(i => i.id))
              }
            }
          } else {
            console.log('[FULFILLMENT] Source transaction not found. Available IDs:', mockTransactions.map(t => t.id))
          }
        } else {
          console.log('[FULFILLMENT] Skipping item - missing source info or zero qty')
        }
      })
    } else {
      console.log('[FULFILLMENT] Not a fulfillment invoice, skipping update')
    }
    // ========== END FULFILLMENT LOGIC ==========
    
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
  
  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    await mockApiDelay(MOCK_DELAY)
    
    // Generate delivery number
    const deliveryCount = mockDeliveries.length + 1
    const deliveryNumber = `SJ-${new Date().getFullYear()}-${String(deliveryCount).padStart(4, '0')}`
    
    // Create delivery record
    const newDelivery = {
      id: 'del-' + Date.now(),
      deliveryNumber,
      deliveryDate: String(data.deliveryDate || new Date().toISOString().split('T')[0]),
      transactionId: String(data.transactionId),
      invoiceNumber: String(data.invoiceNumber),
      customerId: String(data.customerId),
      customerCode: String(data.customerCode),
      customerName: String(data.customerName),
      customerAddress: String(data.customerAddress || ''),
      customerPhone: String(data.customerPhone || ''),
      googleMapsUrl: String(data.googleMapsUrl || ''),
      driverId: String(data.driverId || ''),
      driverName: String(data.driverName || ''),
      driverPhone: String(data.driverPhone || ''),
      vehicleId: String(data.vehicleId || ''),
      vehiclePlate: String(data.vehiclePlate || ''),
      vehicleType: String(data.vehicleType || ''),
      totalItems: Number(data.totalItems) || 0,
      totalWeight: Number(data.totalWeight) || 0,
      deliveryStatus: 'PENDING' as const,
      notes: String(data.notes || ''),
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user'
    }
    
    mockDeliveries.push(newDelivery)
    
    // Create delivery items and update transaction items
    const items = data.items as Array<{
      transactionItemId: string
      productId: string
      productCode: string
      productName: string
      qtyToDeliver: number
      unitWeight: number
      unitName: string
      kgName: string
    }> || []
    
    const transactionIndex = mockTransactions.findIndex(t => t.id === data.transactionId)
    
    for (const item of items) {
      if (item.qtyToDeliver > 0) {
        // Create delivery item
        const deliveryItem = {
          id: 'del-item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          deliveryId: newDelivery.id,
          deliveryNumber,
          transactionItemId: item.transactionItemId,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          qtyDeliveredUnit: item.qtyToDeliver,
          qtyDeliveredKg: item.qtyToDeliver * item.unitWeight,
          unitName: item.unitName,
          kgName: item.kgName,
          notes: '',
          createdAt: new Date().toISOString()
        }
        mockDeliveryItems.push(deliveryItem)
        
        // Update transaction item - increment fulfilled quantity immediately when delivery is created
        if (transactionIndex !== -1) {
          const transaction = mockTransactions[transactionIndex]
          const txItemIndex = transaction.items?.findIndex(i => i.id === item.transactionItemId)
          
          if (txItemIndex !== undefined && txItemIndex !== -1 && transaction.items) {
            const txItem = transaction.items[txItemIndex]
            const newQtyFulfilledUnit = (txItem.qtyFulfilledUnit || 0) + item.qtyToDeliver
            const newQtyFulfilledKg = newQtyFulfilledUnit * txItem.unitWeight
            const qtyRemaining = txItem.qtyOrderUnit - newQtyFulfilledUnit
            
            let newFulfillmentStatus: 'UNFULFILLED' | 'PARTIAL' | 'FULFILLED' = 'UNFULFILLED'
            if (qtyRemaining <= 0) {
              newFulfillmentStatus = 'FULFILLED'
            } else if (newQtyFulfilledUnit > 0) {
              newFulfillmentStatus = 'PARTIAL'
            }
            
            transaction.items[txItemIndex] = {
              ...txItem,
              qtyFulfilledUnit: newQtyFulfilledUnit,
              qtyFulfilledKg: newQtyFulfilledKg,
              qtyUnfulfilledUnit: Math.max(0, qtyRemaining),
              qtyUnfulfilledKg: Math.max(0, qtyRemaining * txItem.unitWeight),
              fulfillmentStatus: newFulfillmentStatus
            }
            
            // Update in mockTransactionItems array as well
            const mockItemIndex = mockTransactionItems.findIndex(i => i.id === item.transactionItemId)
            if (mockItemIndex !== -1) {
              mockTransactionItems[mockItemIndex] = transaction.items[txItemIndex]
            }
          }
        }
      }
    }
    
    // Update transaction delivery status
    if (transactionIndex !== -1) {
      const transaction = mockTransactions[transactionIndex]
      const allFulfilled = transaction.items?.every(i => i.fulfillmentStatus === 'FULFILLED')
      const someFulfilled = transaction.items?.some(i => i.fulfillmentStatus === 'FULFILLED' || i.fulfillmentStatus === 'PARTIAL')
      
      if (allFulfilled) {
        mockTransactions[transactionIndex].deliveryStatus = 'DELIVERED'
      } else if (someFulfilled) {
        mockTransactions[transactionIndex].deliveryStatus = 'PARTIAL'
      } else {
        mockTransactions[transactionIndex].deliveryStatus = 'PROCESSING'
      }
    }
    
    return {
      success: true,
      data: newDelivery
    }
  },
  
  updateStatus: async (id: string, status: string, receiverName?: string): Promise<ApiResponse> => {
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
      if (receiverName) {
        mockDeliveries[index].receiverName = receiverName
      }
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
