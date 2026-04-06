'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils'
import { NumberInput } from '@/components/ui/number-input'
import { usePageHeader } from '@/stores/app-store'
import { api } from '@/lib/api'
import type { CustomerPrice, Customer, Product } from '@/types'

// ============ Customer Price Form Component ============
interface CustomerPriceFormData {
  customerId: string
  productId: string
  specialPricePerKg: number
  specialPricePerUnit: number
  discountPercent: number
  isPPN: boolean
  effectiveDate: string
  expiryDate: string
  notes: string
}

function CustomerPriceForm({ price, customers, products, onSubmit, onCancel, loading }: {
  price?: CustomerPrice
  customers: Customer[]
  products: Product[]
  onSubmit: (data: CustomerPriceFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<CustomerPriceFormData>({
    customerId: price?.customerId || '',
    productId: price?.productId || '',
    specialPricePerKg: price?.specialPricePerKg || 0,
    specialPricePerUnit: price?.specialPricePerUnit || 0,
    discountPercent: price?.discountPercent || 0,
    isPPN: price?.isPPN ?? true,
    effectiveDate: price?.effectiveDate || new Date().toISOString().split('T')[0],
    expiryDate: price?.expiryDate || '',
    notes: price?.notes || '',
  })

  const selectedProduct = products.find(p => p.id === formData.productId)
  const selectedCustomer = customers.find(c => c.id === formData.customerId)

  // Handler untuk perhitungan otomatis yang fleksibel
  // Price per Kg × Unit Weight = Price per Unit
  // Price per Kg = Price per Unit / Unit Weight
  const handlePricePerKgChange = (value: number) => {
    if (selectedProduct) {
      // Price per Unit = Price per Kg × Unit Weight
      const pricePerUnit = value * selectedProduct.baseUnitWeight
      setFormData(prev => ({ 
        ...prev, 
        specialPricePerKg: value,
        specialPricePerUnit: pricePerUnit 
      }))
    } else {
      setFormData(prev => ({ ...prev, specialPricePerKg: value }))
    }
  }

  const handlePricePerUnitChange = (value: number) => {
    if (selectedProduct && selectedProduct.baseUnitWeight > 0) {
      // Price per Kg = Price per Unit / Unit Weight
      const pricePerKg = value / selectedProduct.baseUnitWeight
      setFormData(prev => ({ 
        ...prev, 
        specialPricePerUnit: value,
        specialPricePerKg: pricePerKg 
      }))
    } else {
      setFormData(prev => ({ ...prev, specialPricePerUnit: value }))
    }
  }

  // Auto-calculate discountPercent
  React.useEffect(() => {
    if (selectedProduct && formData.specialPricePerKg > 0 && selectedProduct.basePricePerKg > 0) {
      const discount = ((selectedProduct.basePricePerKg - formData.specialPricePerKg) / selectedProduct.basePricePerKg) * 100
      setFormData(prev => ({ ...prev, discountPercent: Math.max(0, discount) }))
    }
  }, [formData.specialPricePerKg, selectedProduct])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Customer *</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          required
        >
          <option value="">Select Customer</option>
          {customers.filter(c => c.isActive).map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.customerName} ({customer.customerCode})
            </option>
          ))}
        </select>
        {selectedCustomer && (
          <p className="text-xs text-muted-foreground">{selectedCustomer.city}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Product *</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.productId}
          onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
          required
        >
          <option value="">Select Product</option>
          {products.filter(p => p.isActive).map((product) => (
            <option key={product.id} value={product.id}>
              {product.productCode} - {product.productName} ({formatCurrency(product.basePricePerUnit)}/{product.unitName})
            </option>
          ))}
        </select>
        {selectedProduct && (
          <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded text-xs">
            <div>
              <span className="text-muted-foreground">Berat/Unit:</span>
              <span className="ml-1 font-medium">{selectedProduct.baseUnitWeight} {selectedProduct.kgName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Harga Std/Kg:</span>
              <span className="ml-1 font-medium">{formatCurrency(selectedProduct.basePricePerKg)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Harga Std/Unit:</span>
              <span className="ml-1 font-medium">{formatCurrency(selectedProduct.basePricePerUnit)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Satuan:</span>
              <span className="ml-1 font-medium">{selectedProduct.unitName}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg mb-2">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Tips:</strong> Isi salah satu harga dan yang lainnya akan dihitung otomatis.
          <br />• Price/Kg × Weight = Price/Unit
          <br />• Price/Unit ÷ Weight = Price/Kg
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Special Price/Kg (Rp)</label>
          <NumberInput
            value={formData.specialPricePerKg}
            onChange={handlePricePerKgChange}
            placeholder="Enter price per kg"
            allowDecimal
          />
          <p className="text-xs text-muted-foreground">= Price/Unit ÷ Weight</p>
          {selectedProduct && formData.specialPricePerKg > 0 && (
            <p className={formData.specialPricePerKg < selectedProduct.basePricePerKg ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
              {formData.specialPricePerKg < selectedProduct.basePricePerKg ? 'Diskon: ' : 'Markup: '}
              {formatCurrency(Math.abs(formData.specialPricePerKg - selectedProduct.basePricePerKg))}/Kg
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Special Price/Unit (Rp) *</label>
          <NumberInput
            value={formData.specialPricePerUnit}
            onChange={handlePricePerUnitChange}
            placeholder="Enter price per unit"
            allowDecimal
            required
          />
          <p className="text-xs text-muted-foreground">= Price/Kg × Weight</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Diskon (%)</label>
          <NumberInput
            value={formData.discountPercent}
            onChange={() => {}}
            className="bg-muted"
            disabled
            placeholder="Auto-calculated"
            allowDecimal
          />
          <p className="text-xs text-muted-foreground">Auto: (Std - Special) / Std × 100</p>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="isPPN"
            checked={formData.isPPN}
            onChange={(e) => setFormData({ ...formData, isPPN: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="isPPN" className="text-sm font-medium">Subject to PPN</label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Effective Date *</label>
          <input
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Expiry Date</label>
          <input
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="flex h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || !formData.customerId || !formData.productId}>
          {loading ? 'Saving...' : price ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// ============ Customer Prices Page ============
export default function CustomerPricesPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [selectedPrice, setSelectedPrice] = React.useState<CustomerPrice | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Customer Prices Management')
    setBreadcrumbs([{ title: 'Master Data' }, { title: 'Customer Prices' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch data
  const { data: pricesResponse, isLoading: pricesLoading } = useQuery({
    queryKey: ['customer-prices'],
    queryFn: () => api.getCustomerPrices({ pageSize: 100 }),
  })

  const { data: customersResponse, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers({ pageSize: 100 }),
  })

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts({ pageSize: 100 }),
  })

  const prices = pricesResponse?.success ? pricesResponse.data as CustomerPrice[] : []
  const customers = customersResponse?.success ? customersResponse.data as Customer[] : []
  const products = productsResponse?.success ? productsResponse.data as Product[] : []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CustomerPriceFormData) => api.createCustomerPrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-prices'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerPriceFormData> }) => 
      api.updateCustomerPrice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-prices'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCustomerPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-prices'] })
      setDeleteDialog(false)
    },
  })

  // Columns
  const columns: ColumnDef<CustomerPrice>[] = [
    {
      accessorKey: 'customerName',
      header: ({ column }) => <SortableHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customerName}</p>
          <p className="text-xs text-muted-foreground">{row.original.customerCode}</p>
        </div>
      ),
    },
    {
      accessorKey: 'productName',
      header: ({ column }) => <SortableHeader column={column} title="Product" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.productName}</p>
          <p className="text-xs text-muted-foreground">{row.original.productCode}</p>
        </div>
      ),
    },
    {
      accessorKey: 'specialPricePerKg',
      header: 'Price/Kg',
      cell: ({ row }) => {
        const price = row.original
        const product = products.find(p => p.id === price.productId)
        const stdPrice = product?.basePricePerKg || 0
        const isDiscount = price.specialPricePerKg < stdPrice
        return (
          <span className={isDiscount ? 'text-green-600 font-medium' : ''}>
            {formatCurrency(price.specialPricePerKg)}
          </span>
        )
      },
    },
    {
      accessorKey: 'specialPricePerUnit',
      header: 'Price/Unit',
      cell: ({ row }) => formatCurrency(row.original.specialPricePerUnit),
    },
    {
      accessorKey: 'discountPercent',
      header: 'Discount',
      cell: ({ row }) => (
        <Badge variant={row.original.discountPercent > 0 ? 'default' : 'secondary'}>
          {row.original.discountPercent.toFixed(1)}%
        </Badge>
      ),
    },
    {
      accessorKey: 'effectiveDate',
      header: 'Effective',
      cell: ({ row }) => formatDate(row.original.effectiveDate),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const price = row.original
        return (
          <RowActions
            row={price}
            actions={[
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => {
                  setSelectedPrice(price)
                  setOpenDialog(true)
                },
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                onClick: () => {
                  setSelectedPrice(price)
                  setDeleteDialog(true)
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: CustomerPriceFormData) => {
    if (selectedPrice) {
      updateMutation.mutate({ id: selectedPrice.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = pricesLoading || customersLoading || productsLoading

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Prices Management" description="Set special prices for specific customers">
        <Button onClick={() => { setSelectedPrice(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Price
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={prices || []}
        searchKey="customerName"
        searchPlaceholder="Search by customer name..."
      />

      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedPrice ? 'Edit Customer Price' : 'Add Customer Price'}
        maxWidth="lg"
      >
        <CustomerPriceForm
          price={selectedPrice || undefined}
          customers={customers || []}
          products={products || []}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </ModalForm>

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Customer Price"
        description={`Are you sure you want to delete this price setting for "${selectedPrice?.productName}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedPrice && deleteMutation.mutate(selectedPrice.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
