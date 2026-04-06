// =============================================
// CONSTANTS FOR TRANSACTION & SALES MANAGEMENT SYSTEM
// =============================================

// ============ API Configuration ============
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_GAS_API_URL || '',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
}

// ============ Storage Keys ============
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry',
  USER_DATA: 'user_data',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  REMEMBER_ME: 'remember_me',
  MOCK_MODE: 'mock_mode',
}

// ============ User Roles ============
export const USER_ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  MANAGER: 'Manager',
  SALES: 'Sales',
  DRIVER: 'Driver',
  CASHIER: 'Cashier',
} as const

export const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Admin',
  Manager: 'Manager',
  Sales: 'Sales',
  Driver: 'Driver',
  Cashier: 'Kasir',
}

// ============ Payment Status ============
export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Belum Bayar',
  PARTIAL: 'Sebagian',
  PAID: 'Lunas',
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

// ============ Delivery Status ============
export const DELIVERY_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  ON_DELIVERY: 'ON_DELIVERY',
  DELIVERED: 'DELIVERED',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
} as const

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  PROCESSING: 'Diproses',
  ON_DELIVERY: 'Dalam Pengiriman',
  DELIVERED: 'Terkirim',
  PARTIAL: 'Sebagian Terkirim',
  FAILED: 'Gagal',
}

export const DELIVERY_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ON_DELIVERY: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

// ============ Fulfillment Status ============
export const FULFILLMENT_STATUS = {
  UNFULFILLED: 'UNFULFILLED',
  PARTIAL: 'PARTIAL',
  FULFILLED: 'FULFILLED',
} as const

export const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  UNFULFILLED: 'Belum Terpenuhi',
  PARTIAL: 'Sebagian',
  FULFILLED: 'Terpenuhi',
}

// ============ Target Types ============
export const TARGET_TYPES = {
  COMPANY: 'COMPANY',
  SALES: 'SALES',
  PRODUCT: 'PRODUCT',
  CUSTOMER: 'CUSTOMER',
} as const

export const TARGET_TYPE_LABELS: Record<string, string> = {
  COMPANY: 'Target Perusahaan',
  SALES: 'Target Sales',
  PRODUCT: 'Target Produk',
  CUSTOMER: 'Target Customer',
}

// ============ Target Periods ============
export const TARGET_PERIODS = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
} as const

export const TARGET_PERIOD_LABELS: Record<string, string> = {
  DAILY: 'Harian',
  WEEKLY: 'Mingguan',
  MONTHLY: 'Bulanan',
  QUARTERLY: 'Triwulan',
  YEARLY: 'Tahunan',
}

// ============ Transaction Status ============
export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  PROCESSING: 'Diproses',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

export const TRANSACTION_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

// ============ Default Categories ============
export const DEFAULT_CATEGORIES = [
  'Semen',
  'Bata',
  'Besi',
  'Pasir',
  'Keramik',
  'Cat',
  'Atap',
  'Pipa',
  'Lainnya',
]

// ============ Default Payment Methods ============
export const DEFAULT_PAYMENT_METHODS = [
  'Cash',
  'Transfer Bank',
  'Giro',
  'E-Wallet',
]

// ============ Default Vehicle Types ============
export const DEFAULT_VEHICLE_TYPES = [
  'Truk Box',
  'Truk CDE',
  'Pickup',
  'Tronton',
]

// ============ Default Units ============
export const DEFAULT_UNITS = [
  'sak',
  'buah',
  'batang',
  'kubik',
  'dus',
  'pail',
  'lembar',
  'kg',
]

// ============ Number Formatting ============
export const CURRENCY = {
  LOCALE: 'id-ID',
  CODE: 'IDR',
  SYMBOL: 'Rp',
  DECIMALS: 0,
}

// ============ Date Formatting ============
export const DATE_FORMAT = {
  DISPLAY: 'dd MMM yyyy',
  DISPLAY_WITH_TIME: 'dd MMM yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  MONTH_YEAR: 'MMMM yyyy',
}

// ============ Pagination ============
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 1000,
}

// ============ File Upload ============
export const FILE_UPLOAD = {
  MAX_SIZE: 1024 * 1024, // 1MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf', 'application/msword'],
}

// ============ Validation Rules ============
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  NAME_MAX_LENGTH: 100,
  PHONE_MAX_LENGTH: 20,
  EMAIL_MAX_LENGTH: 255,
  NOTES_MAX_LENGTH: 1000,
}

// ============ Navigation Items ============
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Transaksi',
    href: '/transactions',
    icon: 'Receipt',
  },
  {
    title: 'Pengiriman',
    href: '/deliveries',
    icon: 'Truck',
  },
  {
    title: 'Master Data',
    href: '/master',
    icon: 'Database',
    children: [
      { title: 'Users', href: '/master/users', icon: 'Users' },
      { title: 'Customers', href: '/master/customers', icon: 'UserCircle' },
      { title: 'Products', href: '/master/products', icon: 'Package' },
      { title: 'Drivers', href: '/master/drivers', icon: 'User' },
      { title: 'Vehicles', href: '/master/vehicles', icon: 'Car' },
      { title: 'Harga Customer', href: '/master/prices', icon: 'Tag' },
    ],
  },
  {
    title: 'Target',
    href: '/targets',
    icon: 'Target',
  },
  {
    title: 'Laporan',
    href: '/reports',
    icon: 'BarChart3',
  },
  {
    title: 'Pengaturan',
    href: '/settings',
    icon: 'Settings',
  },
]

// ============ Chart Colors ============
export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]
