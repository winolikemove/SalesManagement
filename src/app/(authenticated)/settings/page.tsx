'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Building, 
  FileText, 
  Tags, 
  Users, 
  Save,
  Plus,
  Trash2,
  Upload
} from 'lucide-react'
import { PageHeader, LoadingScreen } from '@/components/shared'
import { usePageHeader } from '@/stores/app-store'
import { useIsAdmin } from '@/stores/auth-store'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_UNITS } from '@/lib/constants'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// ============ Mock Config Data ============
const mockConfig = {
  appName: 'TransMan',
  companyName: 'PT TransMan Indonesia',
  logo: '',
  banner: '',
  address: 'Jl. Sudirman No. 123, Jakarta Selatan 12190',
  phone: '021-1234567',
  email: 'info@transman.id',
  website: 'https://transman.id',
  taxRate: 10,
  invoicePrefix: 'INV',
  invoiceStartingNumber: 1,
  deliveryNotePrefix: 'DEL',
  deliveryNoteStartingNumber: 1,
  categories: DEFAULT_CATEGORIES,
  salesNames: ['Admin', 'Sales 1', 'Sales 2', 'Sales 3'],
  paymentMethods: DEFAULT_PAYMENT_METHODS,
}

// ============ Settings Page ============
export default function SettingsPage() {
  const queryClient = useQueryClient()
  const isAdmin = useIsAdmin()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [activeTab, setActiveTab] = React.useState('company')
  const [config, setConfig] = React.useState(mockConfig)
  const [newCategory, setNewCategory] = React.useState('')
  const [newSalesName, setNewSalesName] = React.useState('')

  React.useEffect(() => {
    setPageTitle('Settings')
    setBreadcrumbs([{ title: 'Settings' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch config
  const { data: configData, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: async () => mockConfig,
  })

  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof config) => ({ success: true }),
    onSuccess: () => {
      toast.success('Settings saved successfully')
    },
  })

  React.useEffect(() => {
    if (configData) {
      setConfig(configData)
    }
  }, [configData])

  const handleSave = () => {
    updateMutation.mutate(config)
  }

  const addCategory = () => {
    if (newCategory && !config.categories.includes(newCategory)) {
      setConfig({ ...config, categories: [...config.categories, newCategory] })
      setNewCategory('')
    }
  }

  const removeCategory = (category: string) => {
    setConfig({ ...config, categories: config.categories.filter(c => c !== category) })
  }

  const addSalesName = () => {
    if (newSalesName && !config.salesNames.includes(newSalesName)) {
      setConfig({ ...config, salesNames: [...config.salesNames, newSalesName] })
      setNewSalesName('')
    }
  }

  const removeSalesName = (name: string) => {
    setConfig({ ...config, salesNames: config.salesNames.filter(n => n !== name) })
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage application settings">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">
            <Building className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="invoice">
            <FileText className="h-4 w-4 mr-2" />
            Invoice
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tags className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Sales Names
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>App Name</Label>
                  <Input
                    value={config.appName}
                    onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={config.companyName}
                    onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={config.address}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={config.website}
                    onChange={(e) => setConfig({ ...config, website: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                      {config.logo ? (
                        <img src={config.logo} alt="Logo" className="h-14 w-14 object-contain" />
                      ) : (
                        <span className="text-2xl font-bold text-muted-foreground">T</span>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={config.taxRate}
                    onChange={(e) => setConfig({ ...config, taxRate: Number(e.target.value) })}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>Configure invoice numbering and format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input
                    value={config.invoicePrefix}
                    onChange={(e) => setConfig({ ...config, invoicePrefix: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Starting Number</Label>
                  <Input
                    type="number"
                    value={config.invoiceStartingNumber}
                    onChange={(e) => setConfig({ ...config, invoiceStartingNumber: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Preview:</p>
                <p className="text-lg font-mono">
                  {config.invoicePrefix}-{new Date().getFullYear()}-{String(config.invoiceStartingNumber).padStart(5, '0')}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Delivery Note Prefix</Label>
                  <Input
                    value={config.deliveryNotePrefix}
                    onChange={(e) => setConfig({ ...config, deliveryNotePrefix: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Starting Number</Label>
                  <Input
                    type="number"
                    value={config.deliveryNoteStartingNumber}
                    onChange={(e) => setConfig({ ...config, deliveryNoteStartingNumber: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Preview:</p>
                <p className="text-lg font-mono">
                  {config.deliveryNotePrefix}-{new Date().getFullYear()}-{String(config.deliveryNoteStartingNumber).padStart(5, '0')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Available payment methods for transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {config.paymentMethods.map((method) => (
                  <Badge key={method} variant="secondary" className="px-3 py-1">
                    {method}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Settings */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>Manage product categories for your inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                />
                <Button onClick={addCategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.categories.map((category) => (
                  <Badge key={category} variant="secondary" className="px-3 py-1 gap-1">
                    {category}
                    <button
                      onClick={() => removeCategory(category)}
                      className="ml-1 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Units of Measurement</CardTitle>
              <CardDescription>Standard units for products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_UNITS.map((unit) => (
                  <Badge key={unit} variant="outline" className="px-3 py-1">
                    {unit}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Names Settings */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Names</CardTitle>
              <CardDescription>Manage sales person names for transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New sales name"
                  value={newSalesName}
                  onChange={(e) => setNewSalesName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSalesName()}
                />
                <Button onClick={addSalesName}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.salesNames.map((name) => (
                  <Badge key={name} variant="secondary" className="px-3 py-1 gap-1">
                    {name}
                    <button
                      onClick={() => removeSalesName(name)}
                      className="ml-1 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
