// =============================================
// SETTINGS HOOK - Access App Settings Globally
// =============================================

import { useAppStore } from '@/stores/app-store'
import { 
  DEFAULT_CATEGORIES, 
  DEFAULT_PAYMENT_METHODS, 
  DEFAULT_UNITS 
} from '@/lib/constants'

// Types
interface CompanySettings {
  appName: string
  companyName: string
  logo: string
  banner: string
  address: string
  phone: string
  email: string
  website: string
  taxRate: number
}

interface InvoiceSettings {
  invoicePrefix: string
  invoiceStartingNumber: number
  deliveryNotePrefix: string
  deliveryNoteStartingNumber: number
}

interface CategorySettings {
  categories: string[]
  units: string[]
}

interface SalesSettings {
  salesNames: string[]
  paymentMethods: string[]
}

// Default values
const defaultCompanySettings: CompanySettings = {
  appName: 'TransMan',
  companyName: 'PT TransMan Indonesia',
  logo: '',
  banner: '',
  address: 'Jl. Sudirman No. 123, Jakarta Selatan 12190',
  phone: '021-1234567',
  email: 'info@transman.id',
  website: 'https://transman.id',
  taxRate: 11,
}

const defaultInvoiceSettings: InvoiceSettings = {
  invoicePrefix: 'INV',
  invoiceStartingNumber: 1,
  deliveryNotePrefix: 'DEL',
  deliveryNoteStartingNumber: 1,
}

const defaultCategorySettings: CategorySettings = {
  categories: DEFAULT_CATEGORIES,
  units: DEFAULT_UNITS,
}

const defaultSalesSettings: SalesSettings = {
  salesNames: ['Admin', 'Sales 1', 'Sales 2', 'Sales 3'],
  paymentMethods: DEFAULT_PAYMENT_METHODS,
}

// Hook to get company settings
export const useCompanySettings = (): CompanySettings => {
  const appConfig = useAppStore((state) => state.appConfig)
  return (appConfig.companySettings as CompanySettings) || defaultCompanySettings
}

// Hook to get invoice settings
export const useInvoiceSettings = (): InvoiceSettings => {
  const appConfig = useAppStore((state) => state.appConfig)
  return (appConfig.invoiceSettings as InvoiceSettings) || defaultInvoiceSettings
}

// Hook to get category settings
export const useCategorySettings = (): CategorySettings => {
  const appConfig = useAppStore((state) => state.appConfig)
  return (appConfig.categorySettings as CategorySettings) || defaultCategorySettings
}

// Hook to get sales settings
export const useSalesSettings = (): SalesSettings => {
  const appConfig = useAppStore((state) => state.appConfig)
  return (appConfig.salesSettings as SalesSettings) || defaultSalesSettings
}

// Hook to get all settings
export const useAllSettings = () => {
  const companySettings = useCompanySettings()
  const invoiceSettings = useInvoiceSettings()
  const categorySettings = useCategorySettings()
  const salesSettings = useSalesSettings()

  return {
    company: companySettings,
    invoice: invoiceSettings,
    categories: categorySettings,
    sales: salesSettings,
  }
}

// Hook to get categories for product dropdowns
export const useProductCategories = (): string[] => {
  const categorySettings = useCategorySettings()
  return categorySettings.categories
}

// Hook to get units for product dropdowns
export const useProductUnits = (): string[] => {
  const categorySettings = useCategorySettings()
  return categorySettings.units
}

// Hook to get sales names for transaction dropdowns
export const useSalesNames = (): string[] => {
  const salesSettings = useSalesSettings()
  return salesSettings.salesNames
}

// Hook to get payment methods for transaction dropdowns
export const usePaymentMethods = (): string[] => {
  const salesSettings = useSalesSettings()
  return salesSettings.paymentMethods
}

// Hook to get tax rate
export const useTaxRate = (): number => {
  const companySettings = useCompanySettings()
  return companySettings.taxRate
}

// Hook to get company info for invoices/reports
export const useCompanyInfo = () => {
  const companySettings = useCompanySettings()
  return {
    name: companySettings.companyName,
    appName: companySettings.appName,
    address: companySettings.address,
    phone: companySettings.phone,
    email: companySettings.email,
    website: companySettings.website,
    logo: companySettings.logo,
    taxRate: companySettings.taxRate,
  }
}

// Hook to generate invoice number
export const useInvoiceNumber = () => {
  const invoiceSettings = useInvoiceSettings()
  
  const generateInvoiceNumber = (currentNumber?: number) => {
    const num = currentNumber ?? invoiceSettings.invoiceStartingNumber
    return `${invoiceSettings.invoicePrefix}-${new Date().getFullYear()}-${String(num).padStart(5, '0')}`
  }
  
  return {
    prefix: invoiceSettings.invoicePrefix,
    startingNumber: invoiceSettings.invoiceStartingNumber,
    generate: generateInvoiceNumber,
  }
}

// Hook to generate delivery note number
export const useDeliveryNoteNumber = () => {
  const invoiceSettings = useInvoiceSettings()
  
  const generateDeliveryNoteNumber = (currentNumber?: number) => {
    const num = currentNumber ?? invoiceSettings.deliveryNoteStartingNumber
    return `${invoiceSettings.deliveryNotePrefix}-${new Date().getFullYear()}-${String(num).padStart(5, '0')}`
  }
  
  return {
    prefix: invoiceSettings.deliveryNotePrefix,
    startingNumber: invoiceSettings.deliveryNoteStartingNumber,
    generate: generateDeliveryNoteNumber,
  }
}
