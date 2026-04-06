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
};

// ============ Storage Keys ============
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry',
  USER_DATA: 'user_data',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  REMEMBER_ME: 'remember_me',
};

// ============ User Roles ============
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
  DRIVER: 'driver',
  CASHIER: 'cashier',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  sales: 'Sales',
  driver: 'Driver',
  cashier: 'Cashier',
};

// ============ Payment Status ============
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// ============ Transaction Status ============
export const TRANSACTION_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TRANSACTION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// ============ Delivery Status ============
export const DELIVERY_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const DELIVERY_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  in_transit: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

// ============ Target Types ============
export const TARGET_TYPES = {
  REVENUE: 'revenue',
  QUANTITY: 'quantity',
  CUSTOMER: 'customer',
  PRODUCT: 'product',
} as const;

export const TARGET_TYPE_LABELS: Record<string, string> = {
  revenue: 'Revenue Target',
  quantity: 'Quantity Target',
  customer: 'Customer Target',
  product: 'Product Target',
};

// ============ Target Periods ============
export const TARGET_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const TARGET_PERIOD_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

// ============ Default Categories ============
export const DEFAULT_CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Food & Beverage',
  'Office Supplies',
  'Tools & Equipment',
  'Raw Materials',
  'Packaging',
  'Other',
];

// ============ Default Payment Methods ============
export const DEFAULT_PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'E-Wallet',
  'Cheque',
  'COD',
];

// ============ Default Units ============
export const DEFAULT_UNITS = [
  'pcs',
  'box',
  'carton',
  'kg',
  'liter',
  'meter',
  'set',
  'pack',
  'dozen',
  'roll',
];

// ============ Number Formatting ============
export const CURRENCY = {
  LOCALE: 'id-ID',
  CODE: 'IDR',
  SYMBOL: 'Rp',
  DECIMALS: 0,
};

// ============ Date Formatting ============
export const DATE_FORMAT = {
  DISPLAY: 'dd MMM yyyy',
  DISPLAY_WITH_TIME: 'dd MMM yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  MONTH_YEAR: 'MMMM yyyy',
};

// ============ Pagination ============
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 1000,
};

// ============ File Upload ============
export const FILE_UPLOAD = {
  MAX_SIZE: 1024 * 1024, // 1MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf', 'application/msword'],
};

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
};

// ============ Navigation Items ============
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Transactions',
    href: '/transactions',
    icon: 'Receipt',
  },
  {
    title: 'Deliveries',
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
      { title: 'Customer Prices', href: '/master/prices', icon: 'Tag' },
    ],
  },
  {
    title: 'Targets',
    href: '/targets',
    icon: 'Target',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
];

// ============ Chart Colors ============
export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];
