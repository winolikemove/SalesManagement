// =============================================
// TYPES FOR TRANSACTION & SALES MANAGEMENT SYSTEM
// Matches Google Apps Script Backend Schema
// =============================================

import type { ReactNode } from 'react'

// ============ API Response Types ============
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  token?: string
  refreshToken?: string
  expiresIn?: number
  code?: string
  pagination?: Pagination
}

export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ============ Auth Types ============
export interface User {
  id: string
  username: string
  fullName: string
  email: string
  phone: string
  role: UserRole
  division: string
  photoUrl: string
  permissions: string[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export type UserRole = 'SuperAdmin' | 'Manager' | 'Sales' | 'Driver' | 'Cashier'

export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

export interface AuthTokens {
  token: string
  refreshToken: string
  expiresAt: number
}

// ============ Config Types ============
export interface Config {
  APP_NAME?: string
  APP_VERSION?: string
  COMPANY_NAME?: string
  COMPANY_ADDRESS?: string
  COMPANY_PHONE?: string
  COMPANY_EMAIL?: string
  LOGO_URL?: string
  BANNER_URL?: string
  TAX_RATE?: string
  INVOICE_PREFIX?: string
  DELIVERY_PREFIX?: string
  PRODUCT_CATEGORIES?: string[]
  SALES_NAMES?: string[]
  PAYMENT_METHODS?: string[]
  VEHICLE_TYPES?: string[]
  USER_ROLES?: string[]
  [key: string]: unknown
}

// ============ Customer Types ============
export interface Customer {
  id: string
  customerCode: string
  customerName: string
  address: string
  city: string
  province: string
  postalCode: string
  googleMapsUrl: string
  picName: string
  picPosition: string
  picPhone: string
  picEmail: string
  creditLimit: number
  currentCredit: number
  paymentTerms: number
  isActive: boolean
  notes: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

// ============ Product Types ============
export interface Product {
  id: string
  productCode: string
  productName: string
  category: string
  baseUnitWeight: number
  basePricePerKg: number
  basePricePerUnit: number
  isPPN: boolean
  unitName: string
  kgName: string
  stockQtyUnit: number
  stockQtyKg: number
  minStock: number
  isActive: boolean
  description: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

// ============ Customer Price Types ============
export interface CustomerPrice {
  id: string
  customerId: string
  customerCode: string
  customerName: string
  productId: string
  productCode: string
  productName: string
  specialPricePerKg: number
  specialPricePerUnit: number
  discountPercent: number
  isPPN: boolean
  effectiveDate: string
  expiryDate: string
  isActive: boolean
  notes: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

// ============ Driver Types ============
export interface Driver {
  id: string
  driverCode: string
  driverName: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  address: string
  isActive: boolean
  notes: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

// ============ Vehicle Types ============
export interface Vehicle {
  id: string
  vehiclePlate: string
  vehicleType: string
  vehicleBrand: string
  vehicleModel: string
  maxCapacityKg: number
  stnkExpiry: string
  kirExpiry: string
  isActive: boolean
  notes: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

// ============ Transaction Types ============
export interface Transaction {
  id: string
  invoiceNumber: string
  invoiceDate: string
  customerId: string
  customerCode: string
  customerName: string
  customerAddress: string
  customerPhone: string
  salesId: string
  salesName: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  grandTotal: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: PaymentStatus
  deliveryStatus: DeliveryStatus
  notes: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  items?: TransactionItem[]
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'
export type DeliveryStatus = 'PENDING' | 'PROCESSING' | 'PARTIAL' | 'DELIVERED'

export interface TransactionItem {
  id: string
  transactionId: string
  invoiceNumber: string
  productId: string
  productCode: string
  productName: string
  unitWeight: number
  pricePerKg: number
  pricePerUnit: number
  qtyOrderUnit: number
  qtyOrderKg: number
  qtyFulfilledUnit: number
  qtyFulfilledKg: number
  qtyUnfulfilledUnit: number
  qtyUnfulfilledKg: number
  unitName: string
  kgName: string
  isPPN: boolean
  subtotal: number
  taxAmount: number
  totalAmount: number
  fulfillmentStatus: 'UNFULFILLED' | 'PARTIAL' | 'FULFILLED'
  notes: string
  createdAt: string
}

// ============ Delivery Types ============
export interface Delivery {
  id: string
  deliveryNumber: string
  deliveryDate: string
  transactionId: string
  invoiceNumber: string
  customerId: string
  customerCode: string
  customerName: string
  customerAddress: string
  customerPhone: string
  googleMapsUrl: string
  driverId: string
  driverName: string
  driverPhone: string
  vehicleId: string
  vehiclePlate: string
  vehicleType: string
  totalItems: number
  totalWeight: number
  deliveryStatus: DeliveryState
  deliveryTime?: string
  receiverName?: string
  receiverSignature?: string
  deliveryPhoto?: string
  notes: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  items?: DeliveryItem[]
}

export type DeliveryState = 'PENDING' | 'ON_DELIVERY' | 'DELIVERED' | 'FAILED'

export interface DeliveryItem {
  id: string
  deliveryId: string
  deliveryNumber: string
  transactionItemId: string
  productId: string
  productCode: string
  productName: string
  qtyDeliveredUnit: number
  qtyDeliveredKg: number
  unitName: string
  kgName: string
  notes: string
  createdAt: string
}

// ============ Target Types ============
export interface Target {
  id: string
  year: number
  month: number
  targetType: 'COMPANY' | 'SALES'
  targetEntityId: string
  targetEntityName: string
  targetAmount: number
  targetQtyUnit: number
  targetQtyKg: number
  targetCustomerCount: number
  achievedAmount: number
  achievedQtyUnit: number
  achievedQtyKg: number
  achievedCustomerCount: number
  achievementPercent: number
  notes: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

// ============ Dashboard Types ============
export interface DashboardStats {
  dailySummary: {
    totalInvoices: number
    totalCustomers: number
    totalAmount: number
  }
  monthlySummary: {
    totalInvoices: number
    totalAmount: number
    paidAmount: number
    pendingAmount: number
  }
  monthlyComparison: {
    currentMonth: number
    previousMonth: number
    percentChange: number
  }
  monthlyTrend: Array<{
    month: number
    monthName: string
    totalAmount: number
    totalInvoices: number
  }>
  targetAchievement?: {
    targetAmount: number
    achievedAmount: number
    achievementPercent: number
  }
  recentTransactions: Transaction[]
  topProducts: Array<{
    productName: string
    totalQty: number
    totalAmount: number
  }>
  topCustomers: Array<{
    customerName: string
    totalAmount: number
    invoiceCount: number
  }>
}

// ============ Navigation Types ============
export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavItem[]
  permissions?: string[]
}

// ============ Form Types ============
export interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select' | 'date' | 'checkbox' | 'file'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: { label: string; value: string }[]
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

// ============ Table Types ============
export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => ReactNode
  className?: string
}

export interface TablePagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface TableSort {
  key: string
  direction: 'asc' | 'desc'
}

export interface TableFilter {
  key: string
  value: string | string[]
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in'
}

// ============ File Upload Types ============
export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}
