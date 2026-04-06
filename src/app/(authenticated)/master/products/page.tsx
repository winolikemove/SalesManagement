'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NumberInput } from '@/components/ui/number-input'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { api } from '@/lib/api'
import { formatDateTime, formatCurrency, cn } from '@/lib/utils'
import { DEFAULT_CATEGORIES, DEFAULT_UNITS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import { useProductCategories, useProductUnits } from '@/hooks/use-settings'
import type { Product } from '@/types'

// ============ Product Form Component ============
interface ProductFormData {
  productCode: string
  productName: string
  category: string
  baseUnitWeight: number
  basePricePerKg: number
  basePricePerUnit: number
  isPPN: boolean
  unitName: string
  kgName: string
  stockQtyUnit: number
  stockQtyKg: number
  minStock: number
  isActive: boolean
  description: string
}

function ProductForm({ product, onSubmit, onCancel, loading, categories, units }: {
  product?: Product
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
  loading?: boolean
  categories: string[]
  units: string[]
}) {
  const [formData, setFormData] = React.useState<ProductFormData>({
    productCode: product?.productCode || '',
    productName: product?.productName || '',
    category: product?.category || categories[0] || DEFAULT_CATEGORIES[0],
    baseUnitWeight: product?.baseUnitWeight || 0,
    basePricePerKg: product?.basePricePerKg || 0,
    basePricePerUnit: product?.basePricePerUnit || 0,
    isPPN: product?.isPPN ?? true,
    unitName: product?.unitName || units[0] || DEFAULT_UNITS[0],
    kgName: product?.kgName || 'Kg',
    stockQtyUnit: product?.stockQtyUnit || 0,
    stockQtyKg: product?.stockQtyKg || 0,
    minStock: product?.minStock || 0,
    isActive: product?.isActive ?? true,
    description: product?.description || '',
  })

  // Auto-calculate basePricePerUnit from baseUnitWeight × basePricePerKg
  React.useEffect(() => {
    const pricePerUnit = formData.baseUnitWeight * formData.basePricePerKg
    if (pricePerUnit !== formData.basePricePerUnit) {
      setFormData(prev => ({ ...prev, basePricePerUnit: pricePerUnit }))
    }
  }, [formData.baseUnitWeight, formData.basePricePerKg])

  // Auto-calculate kg stock from unit weight and unit qty
  React.useEffect(() => {
    const kgStock = formData.stockQtyUnit * formData.baseUnitWeight
    if (kgStock !== formData.stockQtyKg) {
      setFormData(prev => ({ ...prev, stockQtyKg: kgStock }))
    }
  }, [formData.stockQtyUnit, formData.baseUnitWeight])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Product Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Code *</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.productCode}
              onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
              required
              placeholder="e.g., PRD001"
              disabled={!!product}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Name *</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              required
              placeholder="Enter product name"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category *</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description"
            />
          </div>
        </div>
      </div>

      {/* Unit Info */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Unit Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Unit Name *</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.unitName}
              onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kg Name *</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.kgName}
              onChange={(e) => setFormData({ ...formData, kgName: e.target.value })}
              placeholder="e.g., Kg, Kilogram"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Unit Weight (Kg) *</label>
            <NumberInput
              value={formData.baseUnitWeight}
              onChange={(value) => setFormData({ ...formData, baseUnitWeight: value })}
              placeholder="Weight per unit in Kg"
              allowDecimal
              required
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Pricing</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Base Price per Kg (Rp) *</label>
            <NumberInput
              value={formData.basePricePerKg}
              onChange={(value) => setFormData({ ...formData, basePricePerKg: value })}
              placeholder="Price per Kg"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Base Price per Unit (Rp)</label>
            <NumberInput
              value={formData.basePricePerUnit}
              onChange={() => {}}
              className="bg-muted"
              disabled
              placeholder="Auto-calculated"
            />
            <p className="text-xs text-muted-foreground">Auto-calculated: Unit Weight × Price/Kg</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <input
            type="checkbox"
            id="isPPN"
            checked={formData.isPPN}
            onChange={(e) => setFormData({ ...formData, isPPN: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="isPPN" className="text-sm font-medium">Subject to PPN (VAT 11%)</label>
        </div>
      </div>

      {/* Stock */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Stock Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Stock (Unit) *</label>
            <NumberInput
              value={formData.stockQtyUnit}
              onChange={(value) => setFormData({ ...formData, stockQtyUnit: value })}
              placeholder="Quantity in units"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Stock (Kg)</label>
            <NumberInput
              value={formData.stockQtyKg}
              onChange={() => {}}
              className="bg-muted"
              disabled
              placeholder="Auto-calculated"
            />
            <p className="text-xs text-muted-foreground">Auto-calculated from unit × weight</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Min Stock *</label>
            <NumberInput
              value={formData.minStock}
              onChange={(value) => setFormData({ ...formData, minStock: value })}
              placeholder="Minimum stock alert"
              required
            />
          </div>
        </div>
      </div>

      {/* Status */}
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
  const categories = useProductCategories()
  const units = useProductUnits()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')

  React.useEffect(() => {
    setPageTitle('Products Management')
    setBreadcrumbs([{ title: 'Master Data' }, { title: 'Products' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch products
  const { data: response, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  })

  const products = response?.data || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => api.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) => api.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
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
      accessorKey: 'productCode',
      header: ({ column }) => <SortableHeader column={column} title="Code" />,
    },
    {
      accessorKey: 'productName',
      header: ({ column }) => <SortableHeader column={column} title="Product Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{row.getValue('productName')}</p>
            <p className="text-xs text-muted-foreground">{row.original.category}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'unitName',
      header: 'Unit',
    },
    {
      accessorKey: 'basePricePerUnit',
      header: 'Price/Unit',
      cell: ({ row }) => formatCurrency(row.getValue('basePricePerUnit')),
    },
    {
      accessorKey: 'basePricePerKg',
      header: 'Price/Kg',
      cell: ({ row }) => formatCurrency(row.getValue('basePricePerKg')),
    },
    {
      accessorKey: 'stockQtyUnit',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.getValue('stockQtyUnit') as number
        const minStock = row.original.minStock
        const isLow = stock <= minStock
        return (
          <div className="flex items-center gap-2">
            <span className={cn(isLow && 'text-red-600 font-medium')}>
              {stock} {row.original.unitName}
            </span>
            {isLow && <AlertTriangle className="h-4 w-4 text-red-600" />}
          </div>
        )
      },
    },
    {
      accessorKey: 'isPPN',
      header: 'PPN',
      cell: ({ row }) => (
        <Badge variant={row.getValue('isPPN') ? 'default' : 'secondary'}>
          {row.getValue('isPPN') ? 'Yes' : 'No'}
        </Badge>
      ),
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
        searchKey="productName"
        searchPlaceholder="Search products..."
        toolbar={
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
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
          categories={categories}
          units={units}
        />
      </ModalForm>

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.productName}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedProduct && deleteMutation.mutate(selectedProduct.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
