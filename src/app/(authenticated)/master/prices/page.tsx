'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { formatCurrency, parseNumberInput } from '@/lib/utils'
import { usePageHeader } from '@/stores/app-store'
import type { CustomerPrice, Customer, Product } from '@/types'

// ============ Mock Data ============
const mockCustomers: Customer[] = [
  { id: '1', code: 'SDB-R-289', name: 'ARUNIKA EATERY', phone: '', isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', code: 'SDB-H-232', name: 'BATIQA HOTEL CIREBON', phone: '', isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', code: 'SDA-H-068', name: 'HOTEL HILTON BANDUNG', phone: '', isActive: true, createdAt: '', updatedAt: '' },
]

const mockProducts: Product[] = [
  { id: '1', code: 'NCH7007', name: 'Halal Smoked Beef Brisket Cater (1kg/pack)', category: 'Halal Beef', unit: 'PACK', basePrice: 141200, sellingPrice: 141200, stock: 100, minStock: 10, isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', code: 'NPD1076S', name: 'H.Imported Smoked Beef Brisket Slc (1 kg/pack)', category: 'Imported Beef', unit: 'PACK', basePrice: 206500, sellingPrice: 206500, stock: 50, minStock: 5, isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', code: 'NPS0805A', name: 'Halal Star Beef Breakfast Ssg 25gr (500gr/pack)', category: 'Halal Beef', unit: 'PACK', basePrice: 66900, sellingPrice: 66900, stock: 200, minStock: 20, isActive: true, createdAt: '', updatedAt: '' },
  { id: '4', code: 'NPS0515B', name: 'Halal Star Chicken Breakfast Ssg 25gr (500gr/pack)', category: 'Halal Chicken', unit: 'PACK', basePrice: 62500, sellingPrice: 62500, stock: 150, minStock: 15, isActive: true, createdAt: '', updatedAt: '' },
  { id: '5', code: 'NPD1208S', name: 'Halal Beef Pastrami Sliced (1 kg/pack)', category: 'Halal Beef', unit: 'PACK', basePrice: 159700, sellingPrice: 159700, stock: 80, minStock: 8, isActive: true, createdAt: '', updatedAt: '' },
]

const mockCustomerPrices: CustomerPrice[] = [
  { id: '1', customerId: '1', productId: '1', specialPrice: 135000, customer: mockCustomers[0], product: mockProducts[0], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', customerId: '1', productId: '2', specialPrice: 198000, customer: mockCustomers[0], product: mockProducts[1], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '3', customerId: '2', productId: '3', specialPrice: 64000, customer: mockCustomers[1], product: mockProducts[2], createdAt: '2024-01-02', updatedAt: '2024-01-02' },
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
          onChange={(e) => setFormData({ ...formData, specialPrice: parseNumberInput(e.target.value) })}
          onBlur={(e) => setFormData({ ...formData, specialPrice: parseNumberInput(e.target.value) })}
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
