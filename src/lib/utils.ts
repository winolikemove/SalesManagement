import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from "date-fns"
import { id } from "date-fns/locale"
import { CURRENCY, DATE_FORMAT, FILE_UPLOAD } from "./constants"

// ============ Class Name Utility ============
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============ Currency Formatting ============
export function formatCurrency(
  amount: number,
  options?: {
    showSymbol?: boolean
    decimals?: number
  }
): string {
  const { showSymbol = true, decimals = CURRENCY.DECIMALS } = options || {}

  const formatted = new Intl.NumberFormat(CURRENCY.LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)

  return showSymbol ? `${CURRENCY.SYMBOL} ${formatted}` : formatted
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

// ============ Date Formatting ============
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = DATE_FORMAT.DISPLAY
): string {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return '-'

  return format(dateObj, formatStr, { locale: id })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, DATE_FORMAT.DISPLAY_WITH_TIME)
}

export function formatMonthYear(date: string | Date | null | undefined): string {
  return formatDate(date, DATE_FORMAT.MONTH_YEAR)
}

export function getISODate(date: Date): string {
  return format(date, DATE_FORMAT.INPUT)
}

export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function getStartOfMonth(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getEndOfMonth(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}

// ============ Number Formatting ============
export function formatNumber(
  value: number,
  options?: {
    decimals?: number
    locale?: string
  }
): string {
  const { decimals = 0, locale = CURRENCY.LOCALE } = options || {}

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercentage(
  value: number,
  options?: {
    decimals?: number
  }
): string {
  const { decimals = 1 } = options || {}

  return `${value.toFixed(decimals)}%`
}

// ============ String Utilities ============
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateInvoiceNumber(prefix: string, number: number): string {
  const paddedNumber = number.toString().padStart(5, '0')
  return `${prefix}${paddedNumber}`
}

// ============ Phone Formatting ============
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('62')) {
    return `+62 ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`
  }

  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`
  }

  return phone
}

// ============ File Utilities ============
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > FILE_UPLOAD.MAX_SIZE) {
      reject(new Error('File size exceeds 1MB limit'))
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = (error) => reject(error)
  })
}

export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new File([u8arr], filename, { type: mime })
}

export function getImagePreviewUrl(base64: string): string {
  if (base64.startsWith('data:')) return base64
  return `data:image/png;base64,${base64}`
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

export function isImageFile(file: File): boolean {
  return FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type)
}

// ============ Validation Utilities ============
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+()]{8,20}$/
  return phoneRegex.test(phone)
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// ============ Array Utilities ============
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1
    if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1

    const comparison = aVal < bVal ? -1 : 1
    return direction === 'asc' ? comparison : -comparison
  })
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter((item) => {
    const keyValue = item[key]
    if (seen.has(keyValue)) return false
    seen.add(keyValue)
    return true
  })
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ============ Object Utilities ============
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// ============ Debounce & Throttle ============
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ============ URL Utilities ============
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)))
      } else {
        searchParams.set(key, String(value))
      }
    }
  })

  return searchParams.toString()
}

export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(queryString)

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  return params
}

// ============ Color Utilities ============
export function getContrastColor(hexColor: string): 'black' | 'white' {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? 'black' : 'white'
}

// ============ Status Badge Color ============
export function getStatusColor(status: string, type: 'payment' | 'transaction' | 'delivery'): string {
  const colorMaps = {
    payment: {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    transaction: {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    delivery: {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      in_transit: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    },
  }

  return colorMaps[type][status as keyof typeof colorMaps[typeof type]] || 'bg-gray-100 text-gray-800'
}
