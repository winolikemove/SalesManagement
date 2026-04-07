'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Building, 
  FileText, 
  Tags, 
  Users, 
  Save,
  Plus,
  Upload,
  Loader2,
  X
} from 'lucide-react'
import { PageHeader, LoadingScreen } from '@/components/shared'
import { usePageHeader, useAppStore } from '@/stores/app-store'
import { useIsAdmin } from '@/stores/auth-store'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_UNITS } from '@/lib/constants'
import { toast } from 'sonner'
import { NumberInput } from '@/components/ui/number-input'
import { api } from '@/lib/api'

// ============ Types ============
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

// ============ Config Type (from API) ============
interface Config {
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
  PRODUCT_UNITS?: string[]
  SALES_NAMES?: string[]
  PAYMENT_METHODS?: string[]
  VEHICLE_TYPES?: string[]
  USER_ROLES?: string[]
  [key: string]: unknown
}

// ============ Default Values ============
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

// ============ Helper Functions ============
function configToCompanySettings(config: Config | undefined): CompanySettings {
  if (!config) return defaultCompanySettings
  return {
    appName: config.APP_NAME || defaultCompanySettings.appName,
    companyName: config.COMPANY_NAME || defaultCompanySettings.companyName,
    logo: config.LOGO_URL || defaultCompanySettings.logo,
    banner: config.BANNER_URL || defaultCompanySettings.banner,
    address: config.COMPANY_ADDRESS || defaultCompanySettings.address,
    phone: config.COMPANY_PHONE || defaultCompanySettings.phone,
    email: config.COMPANY_EMAIL || defaultCompanySettings.email,
    website: (config.WEBSITE as string) || defaultCompanySettings.website,
    taxRate: config.TAX_RATE ? parseFloat(String(config.TAX_RATE)) : defaultCompanySettings.taxRate,
  }
}

function configToInvoiceSettings(config: Config | undefined): InvoiceSettings {
  if (!config) return defaultInvoiceSettings
  return {
    invoicePrefix: config.INVOICE_PREFIX || defaultInvoiceSettings.invoicePrefix,
    invoiceStartingNumber: (config.INVOICE_STARTING_NUMBER as number) || defaultInvoiceSettings.invoiceStartingNumber,
    deliveryNotePrefix: config.DELIVERY_PREFIX || defaultInvoiceSettings.deliveryNotePrefix,
    deliveryNoteStartingNumber: (config.DELIVERY_STARTING_NUMBER as number) || defaultInvoiceSettings.deliveryNoteStartingNumber,
  }
}

function configToCategorySettings(config: Config | undefined): CategorySettings {
  if (!config) return defaultCategorySettings
  return {
    categories: config.PRODUCT_CATEGORIES || defaultCategorySettings.categories,
    units: config.PRODUCT_UNITS || defaultCategorySettings.units,
  }
}

function configToSalesSettings(config: Config | undefined): SalesSettings {
  if (!config) return defaultSalesSettings
  return {
    salesNames: config.SALES_NAMES || defaultSalesSettings.salesNames,
    paymentMethods: config.PAYMENT_METHODS || defaultSalesSettings.paymentMethods,
  }
}

// ============ Settings Page ============
export default function SettingsPage() {
  const queryClient = useQueryClient()
  const isAdmin = useIsAdmin()
  const { setPageTitle, setBreadcrumbs, appConfig, setAppConfig } = useAppStore()
  const [activeTab, setActiveTab] = React.useState('company')
  
  // Track unsaved changes per section
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState({
    company: false,
    invoice: false,
    categories: false,
    sales: false,
  })
  
  // Fetch config from backend
  const { data: configResponse, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.getAllConfig(),
  })

  const configData = configResponse?.success ? (configResponse.data as Config) : undefined

  // Local state for each section - initialized from API config or defaults
  const [companySettings, setCompanySettings] = React.useState<CompanySettings>(() => 
    configToCompanySettings(configData)
  )
  const [invoiceSettings, setInvoiceSettings] = React.useState<InvoiceSettings>(() => 
    configToInvoiceSettings(configData)
  )
  const [categorySettings, setCategorySettings] = React.useState<CategorySettings>(() => 
    configToCategorySettings(configData)
  )
  const [salesSettings, setSalesSettings] = React.useState<SalesSettings>(() => 
    configToSalesSettings(configData)
  )
  
  // Input states
  const [newCategory, setNewCategory] = React.useState('')
  const [newUnit, setNewUnit] = React.useState('')
  const [newSalesName, setNewSalesName] = React.useState('')
  const [newPaymentMethod, setNewPaymentMethod] = React.useState('')

  // Update local state when config data loads
  React.useEffect(() => {
    if (configData) {
      setCompanySettings(configToCompanySettings(configData))
      setInvoiceSettings(configToInvoiceSettings(configData))
      setCategorySettings(configToCategorySettings(configData))
      setSalesSettings(configToSalesSettings(configData))
    }
  }, [configData])

  React.useEffect(() => {
    setPageTitle('Pengaturan')
    setBreadcrumbs([{ title: 'Pengaturan' }])
  }, [setPageTitle, setBreadcrumbs])

  // Save mutations for each section - now calls backend API
  const saveCompanyMutation = useMutation({
    mutationFn: async (data: CompanySettings) => {
      // First update local store for immediate UI feedback
      setAppConfig({ ...appConfig, companySettings: data })
      // Then save to backend
      return api.updateConfig({
        APP_NAME: data.appName,
        COMPANY_NAME: data.companyName,
        COMPANY_ADDRESS: data.address,
        COMPANY_PHONE: data.phone,
        COMPANY_EMAIL: data.email,
        LOGO_URL: data.logo,
        BANNER_URL: data.banner,
        TAX_RATE: String(data.taxRate),
        WEBSITE: data.website,
      })
    },
    onSuccess: () => {
      toast.success('Pengaturan perusahaan berhasil disimpan')
      setHasUnsavedChanges(prev => ({ ...prev, company: false }))
      queryClient.invalidateQueries({ queryKey: ['config'] })
    },
    onError: (error) => {
      toast.error('Gagal menyimpan pengaturan perusahaan')
      console.error('Save company settings error:', error)
    },
  })

  const saveInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceSettings) => {
      // First update local store for immediate UI feedback
      setAppConfig({ ...appConfig, invoiceSettings: data })
      // Then save to backend
      return api.updateConfig({
        INVOICE_PREFIX: data.invoicePrefix,
        DELIVERY_PREFIX: data.deliveryNotePrefix,
        INVOICE_STARTING_NUMBER: data.invoiceStartingNumber,
        DELIVERY_STARTING_NUMBER: data.deliveryNoteStartingNumber,
      })
    },
    onSuccess: () => {
      toast.success('Pengaturan invoice berhasil disimpan')
      setHasUnsavedChanges(prev => ({ ...prev, invoice: false }))
      queryClient.invalidateQueries({ queryKey: ['config'] })
    },
    onError: (error) => {
      toast.error('Gagal menyimpan pengaturan invoice')
      console.error('Save invoice settings error:', error)
    },
  })

  const saveCategoryMutation = useMutation({
    mutationFn: async (data: CategorySettings) => {
      // First update local store for immediate UI feedback
      setAppConfig({ ...appConfig, categorySettings: data })
      // Then save to backend
      return api.updateConfig({
        PRODUCT_CATEGORIES: data.categories,
        PRODUCT_UNITS: data.units,
      })
    },
    onSuccess: () => {
      toast.success('Pengaturan kategori berhasil disimpan')
      setHasUnsavedChanges(prev => ({ ...prev, categories: false }))
      queryClient.invalidateQueries({ queryKey: ['config'] })
    },
    onError: (error) => {
      toast.error('Gagal menyimpan pengaturan kategori')
      console.error('Save category settings error:', error)
    },
  })

  const saveSalesMutation = useMutation({
    mutationFn: async (data: SalesSettings) => {
      // First update local store for immediate UI feedback
      setAppConfig({ ...appConfig, salesSettings: data })
      // Then save to backend
      return api.updateConfig({
        SALES_NAMES: data.salesNames,
        PAYMENT_METHODS: data.paymentMethods,
      })
    },
    onSuccess: () => {
      toast.success('Pengaturan sales berhasil disimpan')
      setHasUnsavedChanges(prev => ({ ...prev, sales: false }))
      queryClient.invalidateQueries({ queryKey: ['config'] })
    },
    onError: (error) => {
      toast.error('Gagal menyimpan pengaturan sales')
      console.error('Save sales settings error:', error)
    },
  })

  // Handlers for Company Settings
  const updateCompanyField = <K extends keyof CompanySettings>(field: K, value: CompanySettings[K]) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(prev => ({ ...prev, company: true }))
  }

  const handleSaveCompany = () => {
    saveCompanyMutation.mutate(companySettings)
  }

  // Handlers for Invoice Settings
  const updateInvoiceField = <K extends keyof InvoiceSettings>(field: K, value: InvoiceSettings[K]) => {
    setInvoiceSettings(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(prev => ({ ...prev, invoice: true }))
  }

  const handleSaveInvoice = () => {
    saveInvoiceMutation.mutate(invoiceSettings)
  }

  // Handlers for Category Settings
  const updateCategories = (categories: string[]) => {
    setCategorySettings(prev => ({ ...prev, categories }))
    setHasUnsavedChanges(prev => ({ ...prev, categories: true }))
  }

  const updateUnits = (units: string[]) => {
    setCategorySettings(prev => ({ ...prev, units }))
    setHasUnsavedChanges(prev => ({ ...prev, categories: true }))
  }

  const addCategory = () => {
    if (newCategory.trim() && !categorySettings.categories.includes(newCategory.trim())) {
      updateCategories([...categorySettings.categories, newCategory.trim()])
      setNewCategory('')
    }
  }

  const removeCategory = (category: string) => {
    updateCategories(categorySettings.categories.filter(c => c !== category))
  }

  const addUnit = () => {
    if (newUnit.trim() && !categorySettings.units.includes(newUnit.trim().toUpperCase())) {
      updateUnits([...categorySettings.units, newUnit.trim().toUpperCase()])
      setNewUnit('')
    }
  }

  const removeUnit = (unit: string) => {
    updateUnits(categorySettings.units.filter(u => u !== unit))
  }

  const handleSaveCategories = () => {
    saveCategoryMutation.mutate(categorySettings)
  }

  // Handlers for Sales Settings
  const updateSalesNames = (salesNames: string[]) => {
    setSalesSettings(prev => ({ ...prev, salesNames }))
    setHasUnsavedChanges(prev => ({ ...prev, sales: true }))
  }

  const updatePaymentMethods = (paymentMethods: string[]) => {
    setSalesSettings(prev => ({ ...prev, paymentMethods }))
    setHasUnsavedChanges(prev => ({ ...prev, sales: true }))
  }

  const addSalesName = () => {
    if (newSalesName.trim() && !salesSettings.salesNames.includes(newSalesName.trim())) {
      updateSalesNames([...salesSettings.salesNames, newSalesName.trim()])
      setNewSalesName('')
    }
  }

  const removeSalesName = (name: string) => {
    updateSalesNames(salesSettings.salesNames.filter(n => n !== name))
  }

  const addPaymentMethod = () => {
    if (newPaymentMethod.trim() && !salesSettings.paymentMethods.includes(newPaymentMethod.trim())) {
      updatePaymentMethods([...salesSettings.paymentMethods, newPaymentMethod.trim()])
      setNewPaymentMethod('')
    }
  }

  const removePaymentMethod = (method: string) => {
    updatePaymentMethods(salesSettings.paymentMethods.filter(m => m !== method))
  }

  const handleSaveSales = () => {
    saveSalesMutation.mutate(salesSettings)
  }

  // Show loading state
  if (isLoadingConfig) {
    return <LoadingScreen message="Memuat pengaturan..." />
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader title="Pengaturan" description="Kelola pengaturan aplikasi" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="grid w-full grid-cols-4 min-w-[400px]">
            <TabsTrigger value="company" className="text-xs md:text-sm">
              <Building className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Perusahaan</span>
              <span className="sm:hidden">Perusahaan</span>
            </TabsTrigger>
            <TabsTrigger value="invoice" className="text-xs md:text-sm">
              <FileText className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs md:text-sm">
              <Tags className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Kategori</span>
              <span className="sm:hidden">Kategori</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Sales</span>
              <span className="sm:hidden">Sales</span>
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg">Informasi Perusahaan</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Perbarui detail perusahaan Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName" className="text-xs md:text-sm">Nama Aplikasi</Label>
                  <Input
                    id="appName"
                    value={companySettings.appName}
                    onChange={(e) => updateCompanyField('appName', e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-xs md:text-sm">Nama Perusahaan</Label>
                  <Input
                    id="companyName"
                    value={companySettings.companyName}
                    onChange={(e) => updateCompanyField('companyName', e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs md:text-sm">Alamat</Label>
                <Textarea
                  id="address"
                  value={companySettings.address}
                  onChange={(e) => updateCompanyField('address', e.target.value)}
                  className="text-sm md:text-base min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs md:text-sm">Telepon</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => updateCompanyField('phone', e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs md:text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => updateCompanyField('email', e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="website" className="text-xs md:text-sm">Website</Label>
                  <Input
                    id="website"
                    value={companySettings.website}
                    onChange={(e) => updateCompanyField('website', e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Logo</Label>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {companySettings.logo ? (
                        <img src={companySettings.logo} alt="Logo" className="h-10 w-10 md:h-14 md:w-14 object-contain" />
                      ) : (
                        <span className="text-lg md:text-2xl font-bold text-muted-foreground">T</span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="text-xs md:text-sm">
                      <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="text-xs md:text-sm">Tarif Pajak (%)</Label>
                  <NumberInput
                    id="taxRate"
                    value={companySettings.taxRate}
                    onChange={(value) => updateCompanyField('taxRate', value)}
                    placeholder="11"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button 
                onClick={handleSaveCompany} 
                disabled={saveCompanyMutation.isPending || !hasUnsavedChanges.company}
                className="w-full sm:w-auto"
              >
                {saveCompanyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Perusahaan
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoice" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg">Pengaturan Invoice</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Konfigurasi penomoran dan format invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix" className="text-xs md:text-sm">Prefix Invoice</Label>
                  <Input
                    id="invoicePrefix"
                    value={invoiceSettings.invoicePrefix}
                    onChange={(e) => updateInvoiceField('invoicePrefix', e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceStartNum" className="text-xs md:text-sm">Nomor Awal</Label>
                  <NumberInput
                    id="invoiceStartNum"
                    value={invoiceSettings.invoiceStartingNumber}
                    onChange={(value) => updateInvoiceField('invoiceStartingNumber', value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">Preview:</p>
                <p className="text-sm md:text-lg font-mono mt-1">
                  {invoiceSettings.invoicePrefix}-{new Date().getFullYear()}-{String(invoiceSettings.invoiceStartingNumber).padStart(5, '0')}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryPrefix" className="text-xs md:text-sm">Prefix Surat Jalan</Label>
                  <Input
                    id="deliveryPrefix"
                    value={invoiceSettings.deliveryNotePrefix}
                    onChange={(e) => updateInvoiceField('deliveryNotePrefix', e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryStartNum" className="text-xs md:text-sm">Nomor Awal</Label>
                  <NumberInput
                    id="deliveryStartNum"
                    value={invoiceSettings.deliveryNoteStartingNumber}
                    onChange={(value) => updateInvoiceField('deliveryNoteStartingNumber', value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">Preview:</p>
                <p className="text-sm md:text-lg font-mono mt-1">
                  {invoiceSettings.deliveryNotePrefix}-{new Date().getFullYear()}-{String(invoiceSettings.deliveryNoteStartingNumber).padStart(5, '0')}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button 
                onClick={handleSaveInvoice} 
                disabled={saveInvoiceMutation.isPending || !hasUnsavedChanges.invoice}
                className="w-full sm:w-auto"
              >
                {saveInvoiceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Invoice
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Categories Settings */}
        <TabsContent value="categories" className="space-y-4">
          {/* Product Categories */}
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg">Kategori Produk</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Kelola kategori produk untuk inventaris Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nama kategori baru"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  className="text-sm md:text-base"
                />
                <Button onClick={addCategory} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {categorySettings.categories.map((category) => (
                  <Badge 
                    key={category} 
                    variant="secondary" 
                    className="px-2 py-1 md:px-3 text-xs md:text-sm gap-1"
                  >
                    {category}
                    <button
                      onClick={() => removeCategory(category)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>

            <Separator />

            {/* Units of Measurement */}
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg">Satuan Ukuran</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Satuan standar untuk produk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nama satuan baru"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && addUnit()}
                  className="text-sm md:text-base"
                />
                <Button onClick={addUnit} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {categorySettings.units.map((unit) => (
                  <Badge 
                    key={unit} 
                    variant="outline" 
                    className="px-2 py-1 md:px-3 text-xs md:text-sm gap-1"
                  >
                    {unit}
                    <button
                      onClick={() => removeUnit(unit)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button 
                onClick={handleSaveCategories} 
                disabled={saveCategoryMutation.isPending || !hasUnsavedChanges.categories}
                className="w-full sm:w-auto"
              >
                {saveCategoryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Kategori
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Sales Settings */}
        <TabsContent value="sales" className="space-y-4">
          {/* Sales Names */}
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg">Nama Sales</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Kelola nama sales person untuk transaksi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nama sales baru"
                  value={newSalesName}
                  onChange={(e) => setNewSalesName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSalesName()}
                  className="text-sm md:text-base"
                />
                <Button onClick={addSalesName} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {salesSettings.salesNames.map((name) => (
                  <Badge 
                    key={name} 
                    variant="secondary" 
                    className="px-2 py-1 md:px-3 text-xs md:text-sm gap-1"
                  >
                    {name}
                    <button
                      onClick={() => removeSalesName(name)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>

            <Separator />

            {/* Payment Methods */}
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg">Metode Pembayaran</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Metode pembayaran yang tersedia untuk transaksi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Metode pembayaran baru"
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPaymentMethod()}
                  className="text-sm md:text-base"
                />
                <Button onClick={addPaymentMethod} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {salesSettings.paymentMethods.map((method) => (
                  <Badge 
                    key={method} 
                    variant="outline" 
                    className="px-2 py-1 md:px-3 text-xs md:text-sm gap-1"
                  >
                    {method}
                    <button
                      onClick={() => removePaymentMethod(method)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button 
                onClick={handleSaveSales} 
                disabled={saveSalesMutation.isPending || !hasUnsavedChanges.sales}
                className="w-full sm:w-auto"
              >
                {saveSalesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Sales
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
