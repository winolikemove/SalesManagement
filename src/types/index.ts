// =============================================
// TYPES FOR TRANSACTION & SALES MANAGEMENT SYSTEM
// =============================================

// ============ API Response Types ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  refreshToken?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// ============ Auth Types ============
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  photo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'manager' | 'sales' | 'driver' | 'cashier';

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============ Config Types ============
export interface AppConfig {
  id: string;
  appName: string;
  companyName: string;
  logo?: string;
  banner?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxRate: number;
  invoicePrefix: string;
  invoiceStartingNumber: number;
  deliveryNotePrefix: string;
  deliveryNoteStartingNumber: number;
  categories: string[];
  salesNames: string[];
  paymentMethods: string[];
  deliveryStatuses: string[];
  createdAt: string;
  updatedAt: string;
}

// ============ Customer Types ============
export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalTransactions?: number;
  totalSpent?: number;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  isActive: boolean;
}

// ============ Product Types ============
export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  basePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  code: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  basePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  image?: string;
  isActive: boolean;
}

// ============ Customer Price Types ============
export interface CustomerPrice {
  id: string;
  customerId: string;
  customer?: Customer;
  productId: string;
  product?: Product;
  specialPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPriceFormData {
  customerId: string;
  productId: string;
  specialPrice: number;
}

// ============ Driver Types ============
export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  address?: string;
  photo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalDeliveries?: number;
}

export interface DriverFormData {
  name: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  address?: string;
  photo?: string;
  isActive: boolean;
}

// ============ Vehicle Types ============
export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  stnkExpiry?: string;
  insuranceExpiry?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFormData {
  plateNumber: string;
  type: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  stnkExpiry?: string;
  insuranceExpiry?: string;
  notes?: string;
  isActive: boolean;
}

// ============ Transaction Types ============
export interface Transaction {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  salesName?: string;
  items: TransactionItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  status: TransactionStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type TransactionStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  notes?: string;
}

export interface TransactionFormData {
  customerId: string;
  salesName?: string;
  items: TransactionItemFormData[];
  discount?: number;
  paymentMethod?: string;
  paidAmount?: number;
  notes?: string;
  status: TransactionStatus;
}

export interface TransactionItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  notes?: string;
}

// ============ Delivery Types ============
export interface Delivery {
  id: string;
  deliveryNumber: string;
  transactionId: string;
  transaction?: Transaction;
  customerId: string;
  customer?: Customer;
  driverId?: string;
  driver?: Driver;
  vehicleId?: string;
  vehicle?: Vehicle;
  deliveryAddress?: string;
  deliveryDate?: string;
  status: DeliveryStatus;
  notes?: string;
  proofPhoto?: string;
  proofSignature?: string;
  recipientName?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

export interface DeliveryFormData {
  transactionId: string;
  driverId?: string;
  vehicleId?: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  notes?: string;
}

// ============ Target Types ============
export interface Target {
  id: string;
  name: string;
  type: TargetType;
  period: TargetPeriod;
  year: number;
  month?: number;
  week?: number;
  targetAmount: number;
  achievedAmount: number;
  achievementPercent: number;
  salesName?: string;
  productId?: string;
  product?: Product;
  customerId?: string;
  customer?: Customer;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TargetType = 'revenue' | 'quantity' | 'customer' | 'product';
export type TargetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TargetFormData {
  name: string;
  type: TargetType;
  period: TargetPeriod;
  year: number;
  month?: number;
  week?: number;
  targetAmount: number;
  salesName?: string;
  productId?: string;
  customerId?: string;
  isActive: boolean;
}

// ============ Report Types ============
export interface DashboardStats {
  todaySales: number;
  monthSales: number;
  yearSales: number;
  todayTransactions: number;
  pendingPayments: number;
  pendingDeliveries: number;
  lowStockProducts: number;
  activeCustomers: number;
}

export interface SalesTrend {
  date: string;
  sales: number;
  transactions: number;
}

export interface TopProduct {
  product: Product;
  quantity: number;
  total: number;
}

export interface TopCustomer {
  customer: Customer;
  transactions: number;
  total: number;
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  customerId?: string;
  productId?: string;
  salesName?: string;
  category?: string;
}

// ============ File Upload Types ============
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// ============ Table Types ============
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TableSort {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableFilter {
  key: string;
  value: string | string[];
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in';
}

// ============ Navigation Types ============
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  permissions?: UserRole[];
}

// ============ Form Types ============
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select' | 'date' | 'checkbox' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}
