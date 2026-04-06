'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef, ColumnFiltersState, SortingState } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Eye, Printer, CreditCard, Package, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { formatDateTime, formatCurrency, cn, parseNumberInput } from '@/lib/utils'
import { NumberInput } from '@/components/ui/number-input'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, DEFAULT_PAYMENT_METHODS, FULFILLMENT_STATUS_LABELS, FULFILLMENT_STATUS_COLORS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import { useSalesNames, usePaymentMethods, useTaxRate, useProductCategories } from '@/hooks/use-settings'
import { api } from '@/lib/api'
import type { Transaction, TransactionItem, Customer, Product } from '@/types'

// ============ Transaction Item Row ============
interface TransactionItemRowProps {
  item: TransactionItemFormData
  products: Product[]
  customerId: string | null
  onChange: (item: TransactionItemFormData) => void
  onRemove: () => void
}

function TransactionItemRow({ item, products, customerId, onChange, onRemove }: TransactionItemRowProps) {
  const selectedProduct = products.find(p => p.id === item.productId)

  // Fetch customer-specific price when product or customer changes
  const { data: customerPrice } = useQuery({
    queryKey: ['productCustomerPrice', item.productId, customerId],
    queryFn: async () => {
      if (!item.productId || !customerId) return null
      const response = await api.getProductCustomerPrice(item.productId, customerId)
      if (response.success && response.data) {
        return response.data as {
          pricePerKg: number
          pricePerUnit: number
          isPPN: boolean
          discountPercent: number
          isSpecialPrice: boolean
        }
      }
      return null
    },
    enabled: !!item.productId && !!customerId,
  })

  // Update price when customer price data changes
  React.useEffect(() => {
    if (customerPrice && item.productId && customerId) {
      onChange({
        ...item,
        unitPrice: customerPrice.pricePerUnit,
      })
    }
  }, [customerPrice, item.productId, customerId])

  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      <div className="col-span-4">
        <label className="text-xs text-muted-foreground">Product</label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={item.productId}
          onChange={(e) => {
            const product = products.find(p => p.id === e.target.value)
            onChange({
              ...item,
              productId: e.target.value,
              unitPrice: product?.basePricePerUnit || 0,
            })
          }}
        >
          <option value="">Select</option>
          {products.filter(p => p.isActive && p.stockQtyUnit > 0).map((product) => (
            <option key={product.id} value={product.id}>
              {product.productCode} - {product.productName} (Stock: {product.stockQtyUnit} {product.unitName})
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className="text-xs text-muted-foreground">Price</label>
        <input
          type="number"
          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={item.unitPrice}
          onChange={(e) => onChange({ ...item, unitPrice: parseNumberInput(e.target.value) })}
          onBlur={(e) => onChange({ ...item, unitPrice: parseNumberInput(e.target.value) })}
          min={0}
        />
      </div>
      <div className="col-span-2">
        <label className="text-xs text-muted-foreground">Qty</label>
        <input
          type="number"
          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: parseNumberInput(e.target.value) })}
          onBlur={(e) => onChange({ ...item, quantity: parseNumberInput(e.target.value) })}
          min={1}
          max={selectedProduct?.stockQtyUnit || 999}
        />
      </div>
      <div className="col-span-2">
        <label className="text-xs text-muted-foreground">Discount</label>
        <input
          type="number"
          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={item.discount}
          onChange={(e) => onChange({ ...item, discount: parseNumberInput(e.target.value) })}
          onBlur={(e) => onChange({ ...item, discount: parseNumberInput(e.target.value) })}
          min={0}
        />
      </div>
      <div className="col-span-1">
        <label className="text-xs text-muted-foreground">Total</label>
        <div className="flex h-9 items-center text-sm font-medium">
          {formatCurrency(item.quantity * item.unitPrice - item.discount)}
        </div>
      </div>
      <div className="col-span-1">
        <Button variant="ghost" size="sm" onClick={onRemove} type="button">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

// ============ Transaction Form Component ============
interface TransactionItemFormData {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
}

interface TransactionFormData {
  customerId: string
  salesName: string
  items: TransactionItemFormData[]
  discount: number
  paymentMethod: string
  paidAmount: number
  notes: string
  deliveryStatus: string
}

function TransactionForm({ transaction, customers, products, salesNames, paymentMethods, taxRateSetting, onSubmit, onCancel, loading }: {
  transaction?: Transaction
  customers: Customer[]
  products: Product[]
  salesNames: string[]
  paymentMethods: string[]
  taxRateSetting: number
  onSubmit: (data: TransactionFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<TransactionFormData>({
    customerId: transaction?.customerId || '',
    salesName: transaction?.salesName || salesNames[0] || '',
    items: transaction?.items?.map(i => ({ productId: i.productId, quantity: i.qtyOrderUnit, unitPrice: i.pricePerUnit, discount: 0 })) || [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }],
    discount: transaction?.discountAmount || 0,
    paymentMethod: paymentMethods[0] || DEFAULT_PAYMENT_METHODS[0],
    paidAmount: transaction?.paidAmount || 0,
    notes: transaction?.notes || '',
    deliveryStatus: transaction?.deliveryStatus || 'PENDING',
  })

  const taxRate = taxRateSetting / 100 // Convert percentage to decimal

  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0)
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount - formData.discount
  const remainingAmount = total - formData.paidAmount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0, discount: 0 }] })
  }

  const updateItem = (index: number, item: TransactionItemFormData) => {
    const newItems = [...formData.items]
    newItems[index] = item
    setFormData({ ...formData, items: newItems })
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
              <option key={customer.id} value={customer.id}>{customer.customerName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Sales Name</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.salesName}
            onChange={(e) => setFormData({ ...formData, salesName: e.target.value })}
          >
            {salesNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Items</label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
        <div className="space-y-2">
          {formData.items.map((item, index) => (
            <TransactionItemRow
              key={index}
              item={item}
              products={products}
              customerId={formData.customerId || null}
              onChange={(updated) => updateItem(index, updated)}
              onRemove={() => removeItem(index)}
            />
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax ({taxRateSetting}%)</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span>Discount</span>
          <input
            type="number"
            className="flex h-8 w-32 rounded-md border border-input bg-background px-2 py-1 text-sm text-right"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: parseNumberInput(e.target.value) })}
            onBlur={(e) => setFormData({ ...formData, discount: parseNumberInput(e.target.value) })}
            min={0}
          />
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Method</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Paid Amount</label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.paidAmount}
            onChange={(e) => setFormData({ ...formData, paidAmount: parseNumberInput(e.target.value) })}
            onBlur={(e) => setFormData({ ...formData, paidAmount: parseNumberInput(e.target.value) })}
            min={0}
            max={total}
          />
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <span>Remaining Amount</span>
        <span className={remainingAmount > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
          {formatCurrency(remainingAmount)}
        </span>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Enter notes..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : transaction ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// ============ Payment Update Form ============
interface PaymentUpdateFormData {
  amount: number
  paymentMethod: string
  notes: string
}

function PaymentUpdateForm({ transaction, paymentMethods, onSubmit, onCancel, loading }: {
  transaction: Transaction
  paymentMethods: string[]
  onSubmit: (data: PaymentUpdateFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<PaymentUpdateFormData>({
    amount: 0,
    paymentMethod: paymentMethods[0] || DEFAULT_PAYMENT_METHODS[0],
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex justify-between">
          <span>Total Amount</span>
          <span className="font-bold">{formatCurrency(transaction.grandTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid Amount</span>
          <span className="text-green-600">{formatCurrency(transaction.paidAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Remaining</span>
          <span className="text-red-600 font-bold">{formatCurrency(transaction.remainingAmount)}</span>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Additional Payment</label>
        <input
          type="number"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Enter amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseNumberInput(e.target.value) })}
          min={0}
          max={transaction.remainingAmount}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Payment Method</label>
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
        >
          {paymentMethods.map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="flex h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Enter notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Update Payment'}
        </Button>
      </div>
    </form>
  )
}

// ============ Transaction Items Table Component ============
interface TransactionItemWithCategory extends TransactionItem {
  category?: string
}

interface TransactionItemsTableProps {
  items: TransactionItemWithCategory[]
  products: Product[]
  categories: string[]
}

function TransactionItemsTable({ items, products, categories }: TransactionItemsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

  // Enrich items with category from products
  const enrichedItems = React.useMemo(() => {
    return items.map(item => {
      const product = products.find(p => p.id === item.productId)
      return {
        ...item,
        category: product?.category || 'Unknown'
      }
    })
  }, [items, products])

  // Filter items by category
  const filteredItems = React.useMemo(() => {
    if (selectedCategory === 'all') return enrichedItems
    return enrichedItems.filter(item => item.category === selectedCategory)
  }, [enrichedItems, selectedCategory])

  // Columns for transaction items
  const columns: ColumnDef<TransactionItemWithCategory>[] = [
    {
      accessorKey: 'productCode',
      header: ({ column }) => <SortableHeader column={column} title="Kode Produk" />,
      cell: ({ row }) => (
        <span className="font-medium text-xs">{row.getValue('productCode')}</span>
      ),
    },
    {
      accessorKey: 'productName',
      header: ({ column }) => <SortableHeader column={column} title="Nama Produk" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-xs">{row.getValue('productName')}</p>
          <p className="text-[10px] text-muted-foreground">{row.original.category}</p>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">{row.getValue('category')}</Badge>
      ),
    },
    {
      accessorKey: 'qtyOrderUnit',
      header: ({ column }) => <SortableHeader column={column} title="Qty Order" />,
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-medium">{row.getValue('qtyOrderUnit')}</span>
          <span className="text-muted-foreground ml-1">{row.original.unitName}</span>
          <br/>
          <span className="text-muted-foreground">{row.original.qtyOrderKg} {row.original.kgName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'qtyFulfilledUnit',
      header: ({ column }) => <SortableHeader column={column} title="Qty Terkirim" />,
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-medium text-green-600">{row.getValue('qtyFulfilledUnit')}</span>
          <span className="text-muted-foreground ml-1">{row.original.unitName}</span>
          <br/>
          <span className="text-muted-foreground">{row.original.qtyFulfilledKg} {row.original.kgName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'qtyUnfulfilledUnit',
      header: ({ column }) => <SortableHeader column={column} title="Qty Belum Terkirim" />,
      cell: ({ row }) => {
        const unfulfilled = row.getValue('qtyUnfulfilledUnit') as number
        return (
          <div className="text-xs">
            <span className={unfulfilled > 0 ? 'font-medium text-red-600' : 'text-muted-foreground'}>{unfulfilled}</span>
            <span className="text-muted-foreground ml-1">{row.original.unitName}</span>
            {unfulfilled > 0 && (
              <>
                <br/>
                <span className="text-muted-foreground">{row.original.qtyUnfulfilledKg} {row.original.kgName}</span>
              </>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'pricePerUnit',
      header: ({ column }) => <SortableHeader column={column} title="Harga/Unit" />,
      cell: ({ row }) => formatCurrency(row.getValue('pricePerUnit')),
    },
    {
      accessorKey: 'pricePerKg',
      header: ({ column }) => <SortableHeader column={column} title="Harga/Kg" />,
      cell: ({ row }) => formatCurrency(row.getValue('pricePerKg')),
    },
    {
      accessorKey: 'subtotal',
      header: ({ column }) => <SortableHeader column={column} title="Subtotal" />,
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.getValue('subtotal'))}</span>,
    },
    {
      accessorKey: 'taxAmount',
      header: ({ column }) => <SortableHeader column={column} title="PPN" />,
      cell: ({ row }) => {
        const tax = row.getValue('taxAmount') as number
        return tax > 0 ? formatCurrency(tax) : '-'
      },
    },
    {
      accessorKey: 'totalAmount',
      header: ({ column }) => <SortableHeader column={column} title="Total" />,
      cell: ({ row }) => <span className="font-bold">{formatCurrency(row.getValue('totalAmount'))}</span>,
    },
    {
      accessorKey: 'fulfillmentStatus',
      header: 'Status Fulfillment',
      cell: ({ row }) => {
        const status = row.getValue('fulfillmentStatus') as string
        return (
          <Badge className={FULFILLMENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}>
            {FULFILLMENT_STATUS_LABELS[status] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'isPPN',
      header: 'PPN',
      cell: ({ row }) => (
        <Badge variant={row.getValue('isPPN') ? 'default' : 'outline'}>
          {row.getValue('isPPN') ? 'Ya' : 'Tidak'}
        </Badge>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Catatan',
      cell: ({ row }) => {
        const notes = row.getValue('notes') as string
        return notes ? <span className="text-xs text-muted-foreground max-w-[100px] truncate block">{notes}</span> : '-'
      },
    },
  ]

  return (
    <div className="space-y-3">
      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filter Kategori:</span>
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="h-7 text-xs"
          >
            Semua
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="h-7 text-xs"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Info */}
      {selectedCategory !== 'all' && (
        <div className="text-xs text-muted-foreground">
          Menampilkan {filteredItems.length} dari {enrichedItems.length} item
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-2 text-left font-medium">Kode Produk</th>
              <th className="h-10 px-2 text-left font-medium">Nama Produk</th>
              <th className="h-10 px-2 text-left font-medium">Kategori</th>
              <th className="h-10 px-2 text-left font-medium">Qty Order</th>
              <th className="h-10 px-2 text-left font-medium">Qty Terkirim</th>
              <th className="h-10 px-2 text-left font-medium">Qty Belum</th>
              <th className="h-10 px-2 text-right font-medium">Harga/Unit</th>
              <th className="h-10 px-2 text-right font-medium">Harga/Kg</th>
              <th className="h-10 px-2 text-right font-medium">Subtotal</th>
              <th className="h-10 px-2 text-right font-medium">PPN</th>
              <th className="h-10 px-2 text-right font-medium">Total</th>
              <th className="h-10 px-2 text-center font-medium">Status</th>
              <th className="h-10 px-2 text-center font-medium">PPN</th>
              <th className="h-10 px-2 text-left font-medium">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <tr key={item.id || index} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{item.productCode}</td>
                  <td className="p-2">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-[10px] text-muted-foreground">{item.category}</p>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                  </td>
                  <td className="p-2">
                    <div>
                      <span className="font-medium">{item.qtyOrderUnit}</span>
                      <span className="text-muted-foreground ml-1">{item.unitName}</span>
                      <br/>
                      <span className="text-muted-foreground">{item.qtyOrderKg} {item.kgName}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div>
                      <span className="font-medium text-green-600">{item.qtyFulfilledUnit}</span>
                      <span className="text-muted-foreground ml-1">{item.unitName}</span>
                      <br/>
                      <span className="text-muted-foreground">{item.qtyFulfilledKg} {item.kgName}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div>
                      <span className={item.qtyUnfulfilledUnit > 0 ? 'font-medium text-red-600' : 'text-muted-foreground'}>
                        {item.qtyUnfulfilledUnit}
                      </span>
                      <span className="text-muted-foreground ml-1">{item.unitName}</span>
                      {item.qtyUnfulfilledUnit > 0 && (
                        <>
                          <br/>
                          <span className="text-muted-foreground">{item.qtyUnfulfilledKg} {item.kgName}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-right">{formatCurrency(item.pricePerUnit)}</td>
                  <td className="p-2 text-right">{formatCurrency(item.pricePerKg)}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                  <td className="p-2 text-right">{item.taxAmount > 0 ? formatCurrency(item.taxAmount) : '-'}</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(item.totalAmount)}</td>
                  <td className="p-2 text-center">
                    <Badge className={FULFILLMENT_STATUS_COLORS[item.fulfillmentStatus] || 'bg-gray-100 text-gray-800'}>
                      {FULFILLMENT_STATUS_LABELS[item.fulfillmentStatus] || item.fulfillmentStatus}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">
                    <Badge variant={item.isPPN ? 'default' : 'outline'}>
                      {item.isPPN ? 'Ya' : 'Tidak'}
                    </Badge>
                  </td>
                  <td className="p-2 max-w-[100px]">
                    {item.notes ? (
                      <span className="text-muted-foreground truncate block">{item.notes}</span>
                    ) : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={14} className="h-24 text-center text-muted-foreground">
                  Tidak ada data untuk kategori ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-3 text-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <span className="text-muted-foreground">Total Item:</span>
            <span className="ml-2 font-medium">{filteredItems.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Subtotal:</span>
            <span className="ml-2 font-medium">{formatCurrency(filteredItems.reduce((sum, item) => sum + item.subtotal, 0))}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total PPN:</span>
            <span className="ml-2 font-medium">{formatCurrency(filteredItems.reduce((sum, item) => sum + item.taxAmount, 0))}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Grand Total:</span>
            <span className="ml-2 font-bold">{formatCurrency(filteredItems.reduce((sum, item) => sum + item.totalAmount, 0))}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ Transactions Page ============
export default function TransactionsPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const salesNames = useSalesNames()
  const paymentMethods = usePaymentMethods()
  const taxRateSetting = useTaxRate()
  const categories = useProductCategories()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [viewDialog, setViewDialog] = React.useState(false)
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)
  const [paymentDialog, setPaymentDialog] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Transactions')
    setBreadcrumbs([{ title: 'Transactions' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch transactions
  const { data: transactionsResponse, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.getTransactions({ pageSize: 100 })
      return response
    },
  })

  // Fetch customers
  const { data: customersResponse, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.getCustomers({ pageSize: 100 })
      return response
    },
  })

  // Fetch products
  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.getProducts({ pageSize: 100 })
      return response
    },
  })

  // Extract data from responses
  const transactions = transactionsResponse?.success ? transactionsResponse.data as Transaction[] : []
  const customers = customersResponse?.success ? customersResponse.data as Customer[] : []
  const products = productsResponse?.success ? productsResponse.data as Product[] : []

  // Fetch single transaction with items
  const { data: transactionDetails } = useQuery({
    queryKey: ['transaction', selectedTransaction?.id],
    queryFn: async () => {
      if (!selectedTransaction?.id) return null
      const response = await api.getTransaction(selectedTransaction.id)
      return response
    },
    enabled: !!selectedTransaction?.id && viewDialog,
  })

  const detailedTransaction = transactionDetails?.success ? transactionDetails.data as Transaction : selectedTransaction

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0)
      const taxAmount = subtotal * (taxRateSetting / 100)
      const grandTotal = subtotal + taxAmount - data.discount

      const response = await api.createTransaction({
        customerId: data.customerId,
        salesId: '', // Will be filled by backend based on salesName
        salesName: data.salesName,
        subtotal,
        taxAmount,
        discountAmount: data.discount,
        grandTotal,
        notes: data.notes,
        items: data.items.map(item => ({
          productId: item.productId,
          qtyOrderUnit: item.quantity,
          pricePerUnit: item.unitPrice,
          discount: item.discount,
        })),
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setOpenDialog(false)
      setSelectedTransaction(null)
    },
  })

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PaymentUpdateFormData }) => {
      const response = await api.updateTransactionPayment(id, {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setPaymentDialog(false)
      setSelectedTransaction(null)
    },
  })

  // Delete mutation (not implemented in API, kept for UI consistency)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Note: Transaction deletion is typically not supported
      // This would need a specific API endpoint
      return { success: false, error: 'Transaction deletion is not supported' }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setDeleteDialog(false)
      setSelectedTransaction(null)
    },
  })

  // Columns
  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => <SortableHeader column={column} title="Invoice" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('invoiceNumber')}</span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: ({ column }) => <SortableHeader column={column} title="Customer" />,
      cell: ({ row }) => {
        const customerCode = row.original.customerCode
        const customerName = row.original.customerName
        return (
          <div>
            <p className="font-medium">{customerName}</p>
            <p className="text-xs text-muted-foreground">{customerCode}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'grandTotal',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.getValue('grandTotal')),
    },
    {
      accessorKey: 'paidAmount',
      header: 'Paid',
      cell: ({ row }) => formatCurrency(row.getValue('paidAmount')),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => {
        const status = row.getValue('paymentStatus') as string
        return (
          <Badge className={PAYMENT_STATUS_COLORS[status]}>
            {PAYMENT_STATUS_LABELS[status]}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'deliveryStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('deliveryStatus') as string
        return (
          <Badge className={DELIVERY_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}>
            {DELIVERY_STATUS_LABELS[status] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'invoiceDate',
      header: 'Date',
      cell: ({ row }) => formatDateTime(row.getValue('invoiceDate')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const tx = row.original
        return (
          <RowActions
            row={tx}
            actions={[
              {
                label: 'View',
                icon: <Eye className="h-4 w-4" />,
                onClick: () => {
                  setSelectedTransaction(tx)
                  setViewDialog(true)
                },
              },
              {
                label: 'Update Payment',
                icon: <CreditCard className="h-4 w-4" />,
                onClick: () => {
                  setSelectedTransaction(tx)
                  setPaymentDialog(true)
                },
              },
              {
                label: 'Print',
                icon: <Printer className="h-4 w-4" />,
                onClick: () => {
                  // TODO: Print invoice
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: TransactionFormData) => {
    createMutation.mutate(data)
  }

  const handlePaymentUpdate = (data: PaymentUpdateFormData) => {
    if (selectedTransaction) {
      updatePaymentMutation.mutate({ id: selectedTransaction.id, data })
    }
  }

  const isLoading = transactionsLoading || customersLoading || productsLoading

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Manage sales transactions">
        <Button onClick={() => { setSelectedTransaction(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={transactions || []}
        searchKey="invoiceNumber"
        searchPlaceholder="Search transactions..."
      />

      {/* Transaction Form Dialog */}
      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedTransaction ? 'Edit Transaction' : 'New Transaction'}
        maxWidth="2xl"
      >
        <TransactionForm
          transaction={selectedTransaction || undefined}
          customers={customers || []}
          products={products || []}
          salesNames={salesNames}
          paymentMethods={paymentMethods}
          taxRateSetting={taxRateSetting}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending}
        />
      </ModalForm>

      {/* View Transaction Dialog */}
      <ModalForm
        open={viewDialog}
        onOpenChange={setViewDialog}
        title="Detail Transaksi"
        maxWidth="2xl"
      >
        {detailedTransaction && (
          <div className="space-y-4">
            {/* Transaction Header */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{detailedTransaction.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium">{detailedTransaction.customerName}</p>
                <p className="text-xs text-muted-foreground">{detailedTransaction.customerCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatDateTime(detailedTransaction.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sales</p>
                <p className="font-medium">{detailedTransaction.salesName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivery Status</p>
                <Badge className={DELIVERY_STATUS_COLORS[detailedTransaction.deliveryStatus] || 'bg-gray-100 text-gray-800'}>
                  {DELIVERY_STATUS_LABELS[detailedTransaction.deliveryStatus] || detailedTransaction.deliveryStatus}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Status</p>
                <Badge className={PAYMENT_STATUS_COLORS[detailedTransaction.paymentStatus]}>
                  {PAYMENT_STATUS_LABELS[detailedTransaction.paymentStatus]}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Transaction Items Table */}
            <div>
              <h4 className="font-medium mb-3">Item Transaksi</h4>
              <TransactionItemsTable
                items={detailedTransaction.items || []}
                products={products}
                categories={categories}
              />
            </div>

            <Separator />

            {/* Transaction Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(detailedTransaction.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(detailedTransaction.taxAmount)}</span>
              </div>
              {detailedTransaction.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(detailedTransaction.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(detailedTransaction.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <span className="text-green-600">{formatCurrency(detailedTransaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining</span>
                <span className={detailedTransaction.remainingAmount > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  {formatCurrency(detailedTransaction.remainingAmount)}
                </span>
              </div>
            </div>

            {detailedTransaction.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{detailedTransaction.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
              <Button onClick={() => { 
                setViewDialog(false); 
                setOpenDialog(true); 
              }}>
                Edit Transaction
              </Button>
            </div>
          </div>
        )}
      </ModalForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Transaction"
        description={`Are you sure you want to delete "${selectedTransaction?.invoiceNumber}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedTransaction && deleteMutation.mutate(selectedTransaction.id)}
        loading={deleteMutation.isPending}
      />

      {/* Payment Update Dialog */}
      <ModalForm
        open={paymentDialog}
        onOpenChange={setPaymentDialog}
        title="Update Payment"
        maxWidth="sm"
      >
        {selectedTransaction && (
          <PaymentUpdateForm
            transaction={selectedTransaction}
            paymentMethods={paymentMethods}
            onSubmit={handlePaymentUpdate}
            onCancel={() => setPaymentDialog(false)}
            loading={updatePaymentMutation.isPending}
          />
        )}
      </ModalForm>
    </div>
  )
}
