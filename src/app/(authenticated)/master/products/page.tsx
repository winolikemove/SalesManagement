'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { api } from '@/lib/api'
import { formatDateTime, formatCurrency, cn } from '@/lib/utils'
import { DEFAULT_CATEGORIES, DEFAULT_UNITS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import type { Product } from '@/types'

// ============ Mock Data ============
const mockProducts: Product[] = [
  { id: '1', code: 'PRD001', name: 'Laptop Dell XPS 15', category: 'Electronics', description: 'High performance laptop', unit: 'pcs', basePrice: 15000000, sellingPrice: 18500000, stock: 25, minStock: 5, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', code: 'PRD002', name: 'Office Chair Premium', category: 'Furniture', description: 'Ergonomic office chair', unit: 'pcs', basePrice: 2500000, sellingPrice: 3500000, stock: 15, minStock: 3, isActive: true, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  { id: '3', code: 'PRD003', name: 'Printer Paper A4', category: 'Office Supplies', description: '500 sheets per pack', unit: 'pack', basePrice: 45000, sellingPrice: 65000, stock: 3, minStock: 20, isActive: true, createdAt: '2024-01-03', updatedAt: '2024-01-03' },
  { id: '4', code: 'PRD004', name: 'Monitor Samsung 27"', category: 'Electronics', description: '27 inch Full HD monitor', unit: 'pcs', basePrice: 2500000, sellingPrice: 3200000, stock: 8, minStock: 5, isActive: true, createdAt: '2024-01-04', updatedAt: '2024-01-04' },
  { id: '5', code: 'PRD005', name: 'Standing Desk', category: 'Furniture', description: 'Height adjustable desk', unit: 'pcs', basePrice: 4500000, sellingPrice: 5800000, stock: 0, minStock: 2, isActive: false, createdAt: '2024-01-05', updatedAt: '2024-01-05' },
]

// ============ Product Form Component ============
interface ProductFormData {
  code: string
  name: string
  category: string
  description: string
  unit: string
  basePrice: number
  sellingPrice: number
  stock: number
  minStock: number
  isActive: boolean
}

function ProductForm({ product, onSubmit, onCancel, loading }: {
  product?: Product
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<ProductFormData>({
    code: product?.code || '',
    name: product?.name || '',
    category: product?.category || DEFAULT_CATEGORIES[0],
    description: product?.description || '',
    unit: product?.unit || DEFAULT_UNITS[0],
    basePrice: product?.basePrice || 0,
    sellingPrice: product?.sellingPrice || 0,
    stock: product?.stock || 0,
    minStock: product?.minStock || 0,
    isActive: product?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Code *</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Name *</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category *</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Unit *</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            {DEFAULT_UNITS.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Base Price (Rp) *</label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
            min={0}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Selling Price (Rp) *</label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
            min={0}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock *</label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
            min={0}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Min Stock *</label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
            min={0}
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4"
        />
        <label htmlFor="isActive" className="text-sm font-medium">Active</label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : product ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// ============ Products Page ============
export default function ProductsPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')

  React.useEffect(() => {
    setPageTitle('Products Management')
    setBreadcrumbs([{ title: 'Master Data' }, { title: 'Products' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => mockProducts,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeleteDialog(false)
    },
  })

  // Filtered products
  const filteredProducts = React.useMemo(() => {
    if (categoryFilter === 'all') return products
    return products?.filter((p) => p.category === categoryFilter)
  }, [products, categoryFilter])

  // Columns
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <SortableHeader column={column} title="Code" />,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{row.getValue('name')}</p>
            <p className="text-xs text-muted-foreground">{row.original.category}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
    },
    {
      accessorKey: 'sellingPrice',
      header: 'Price',
      cell: ({ row }) => formatCurrency(row.getValue('sellingPrice')),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.getValue('stock') as number
        const minStock = row.original.minStock
        const isLow = stock <= minStock
        return (
          <div className="flex items-center gap-2">
            <span className={cn(isLow && 'text-red-600 font-medium')}>{stock}</span>
            {isLow && <AlertTriangle className="h-4 w-4 text-red-600" />}
          </div>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original
        return (
          <RowActions
            row={product}
            actions={[
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => {
                  setSelectedProduct(product)
                  setOpenDialog(true)
                },
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                onClick: () => {
                  setSelectedProduct(product)
                  setDeleteDialog(true)
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: ProductFormData) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Products Management" description="Manage your product catalog">
        <Button onClick={() => { setSelectedProduct(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filteredProducts || []}
        searchKey="name"
        searchPlaceholder="Search products..."
        toolbar={
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        }
      />

      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedProduct ? 'Edit Product' : 'Add Product'}
        maxWidth="lg"
      >
        <ProductForm
          product={selectedProduct || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </ModalForm>

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedProduct && deleteMutation.mutate(selectedProduct.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
