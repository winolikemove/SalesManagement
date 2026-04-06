'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { formatCurrency } from '@/lib/utils'
import { usePageHeader } from '@/stores/app-store'
import type { CustomerPrice, Customer, Product } from '@/types'

// ============ Mock Data ============
const mockCustomers: Customer[] = [
  { id: '1', code: 'CUST001', name: 'PT ABC Corporation', phone: '0211234567', isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', code: 'CUST002', name: 'CV XYZ Trading', phone: '0217654321', isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', code: 'CUST003', name: 'UD DEF Store', phone: '0215551234', isActive: true, createdAt: '', updatedAt: '' },
]

const mockProducts: Product[] = [
  { id: '1', code: 'PRD001', name: 'Laptop Dell XPS 15', category: 'Electronics', unit: 'pcs', basePrice: 15000000, sellingPrice: 18500000, stock: 25, minStock: 5, isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', code: 'PRD002', name: 'Office Chair Premium', category: 'Furniture', unit: 'pcs', basePrice: 2500000, sellingPrice: 3500000, stock: 15, minStock: 3, isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', code: 'PRD003', name: 'Printer Paper A4', category: 'Office Supplies', unit: 'pack', basePrice: 45000, sellingPrice: 65000, stock: 3, minStock: 20, isActive: true, createdAt: '', updatedAt: '' },
]

const mockCustomerPrices: CustomerPrice[] = [
  { id: '1', customerId: '1', productId: '1', specialPrice: 17000000, customer: mockCustomers[0], product: mockProducts[0], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', customerId: '1', productId: '2', specialPrice: 3200000, customer: mockCustomers[0], product: mockProducts[1], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '3', customerId: '2', productId: '1', specialPrice: 17500000, customer: mockCustomers[1], product: mockProducts[0], createdAt: '2024-01-02', updatedAt: '2024-01-02' },
]

// ============ Customer Price Form Component ============
interface CustomerPriceFormData {
  customerId: string
  productId: string
  specialPrice: number
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
    specialPrice: price?.specialPrice || 0,
  })

  const selectedProduct = products.find(p => p.id === formData.productId)

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
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
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
              {product.code} - {product.name} ({formatCurrency(product.sellingPrice)})
            </option>
          ))}
        </select>
        {selectedProduct && (
          <p className="text-xs text-muted-foreground">
            Standard price: {formatCurrency(selectedProduct.sellingPrice)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Special Price (Rp) *</label>
        <input
          type="number"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.specialPrice}
          onChange={(e) => setFormData({ ...formData, specialPrice: Number(e.target.value) })}
          min={0}
          required
        />
        {selectedProduct && formData.specialPrice > 0 && (
          <p className={formData.specialPrice < selectedProduct.sellingPrice ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
            {formData.specialPrice < selectedProduct.sellingPrice ? 'Discount: ' : 'Markup: '}
            {formatCurrency(Math.abs(formData.specialPrice - selectedProduct.sellingPrice))}
            {' '}({((formData.specialPrice - selectedProduct.sellingPrice) / selectedProduct.sellingPrice * 100).toFixed(1)}%)
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
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
  const { data: prices, isLoading } = useQuery({
    queryKey: ['customer-prices'],
    queryFn: async () => mockCustomerPrices,
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => mockCustomers,
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => mockProducts,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CustomerPriceFormData) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-prices'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerPriceFormData> }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-prices'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-prices'] })
      setDeleteDialog(false)
    },
  })

  // Columns
  const columns: ColumnDef<CustomerPrice>[] = [
    {
      accessorKey: 'customer',
      header: ({ column }) => <SortableHeader column={column} title="Customer" />,
      cell: ({ row }) => {
        const customer = row.original.customer
        return (
          <div>
            <p className="font-medium">{customer?.name}</p>
            <p className="text-xs text-muted-foreground">{customer?.code}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'product',
      header: ({ column }) => <SortableHeader column={column} title="Product" />,
      cell: ({ row }) => {
        const product = row.original.product
        return (
          <div>
            <p className="font-medium">{product?.name}</p>
            <p className="text-xs text-muted-foreground">{product?.code}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'product.sellingPrice',
      header: 'Standard Price',
      cell: ({ row }) => formatCurrency(row.original.product?.sellingPrice || 0),
    },
    {
      accessorKey: 'specialPrice',
      header: 'Special Price',
      cell: ({ row }) => {
        const specialPrice = row.getValue('specialPrice') as number
        const standardPrice = row.original.product?.sellingPrice || 0
        const isDiscount = specialPrice < standardPrice
        return (
          <span className={isDiscount ? 'text-green-600 font-medium' : ''}>
            {formatCurrency(specialPrice)}
          </span>
        )
      },
    },
    {
      id: 'difference',
      header: 'Difference',
      cell: ({ row }) => {
        const specialPrice = row.original.specialPrice
        const standardPrice = row.original.product?.sellingPrice || 0
        const diff = specialPrice - standardPrice
        const percent = standardPrice > 0 ? ((diff / standardPrice) * 100).toFixed(1) : '0'
        const isDiscount = diff < 0
        return (
          <Badge variant={isDiscount ? 'default' : 'secondary'}>
            {isDiscount ? '' : '+'}{formatCurrency(diff)} ({isDiscount ? '' : '+'}{percent}%)
          </Badge>
        )
      },
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
        searchKey="customer"
        searchPlaceholder="Search prices..."
      />

      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedPrice ? 'Edit Customer Price' : 'Add Customer Price'}
        maxWidth="md"
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
        description="Are you sure you want to delete this price setting? This action cannot be undone."
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedPrice && deleteMutation.mutate(selectedPrice.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
