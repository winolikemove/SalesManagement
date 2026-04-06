'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Eye, Printer, CreditCard, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { formatDateTime, formatCurrency, cn } from '@/lib/utils'
import { NumberInput } from '@/components/ui/number-input'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, DEFAULT_PAYMENT_METHODS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import { useSalesNames, usePaymentMethods, useTaxRate } from '@/hooks/use-settings'

// ============ Mock Data ============
// Note: These mock data structures match the simplified UI needs
// In production, these would come from the API with proper types

interface MockCustomer {
  id: string
  code: string
  name: string
  phone: string
  address: string
  isActive: boolean
}

interface MockProduct {
  id: string
  code: string
  name: string
  category: string
  unit: string
  basePrice: number
  sellingPrice: number
  stock: number
  minStock: number
  isActive: boolean
}

interface MockTransactionItem {
  id: string
  transactionId: string
  productId: string
  product: MockProduct
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface MockTransaction {
  id: string
  invoiceNumber: string
  customerId: string
  customer: MockCustomer
  salesName: string
  items: MockTransactionItem[]
  subtotal: number
  taxAmount: number
  discount: number
  total: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID'
  paymentMethod: string
  deliveryStatus: 'PENDING' | 'PROCESSING' | 'DELIVERED'
  createdAt: string
}

const mockCustomers: MockCustomer[] = [
  { id: '1', code: 'SDB-R-289', name: 'ARUNIKA EATERY', phone: '', address: 'Jl. Cigugur-Palutungan, Cisantana, Kec. Cigugur, Kabupaten Kuningan, Jawa Barat 45552', isActive: true },
  { id: '2', code: 'SDB-H-232', name: 'BATIQA HOTEL CIREBON', phone: '', address: 'Jl. Dr. Cipto Mangunkusumo No.99, Kedawung, Kec. Kedawung, Kabupaten Cirebon, Jawa Barat 45153', isActive: true },
  { id: '3', code: 'SDA-H-068', name: 'HOTEL HILTON BANDUNG', phone: '', address: 'Jl. HOS Tjokroaminoto No. 41-43, Pasir Kaliki, Kec. Cicendo, Kota Bandung, Jawa Barat 40171', isActive: true },
]

const mockProducts: MockProduct[] = [
  { id: '1', code: 'NCH7007', name: 'Halal Smoked Beef Brisket Cater (1kg/pack)', category: 'Halal Beef', unit: 'PACK', basePrice: 141200, sellingPrice: 141200, stock: 100, minStock: 10, isActive: true },
  { id: '2', code: 'NPD1076S', name: 'H.Imported Smoked Beef Brisket Slc (1 kg/pack)', category: 'Imported Beef', unit: 'PACK', basePrice: 206500, sellingPrice: 206500, stock: 50, minStock: 5, isActive: true },
  { id: '3', code: 'NPS0805A', name: 'Halal Star Beef Breakfast Ssg 25gr (500gr/pack)', category: 'Halal Beef', unit: 'PACK', basePrice: 66900, sellingPrice: 66900, stock: 200, minStock: 20, isActive: true },
  { id: '4', code: 'NPS0515B', name: 'Halal Star Chicken Breakfast Ssg 25gr (500gr/pack)', category: 'Halal Chicken', unit: 'PACK', basePrice: 62500, sellingPrice: 62500, stock: 150, minStock: 15, isActive: true },
  { id: '5', code: 'NPD1208S', name: 'Halal Beef Pastrami Sliced (1 kg/pack)', category: 'Halal Beef', unit: 'PACK', basePrice: 159700, sellingPrice: 159700, stock: 80, minStock: 8, isActive: true },
]

const mockTransactions: MockTransaction[] = [
  { id: '1', invoiceNumber: 'INV-2024-0001', customerId: '1', customer: mockCustomers[0], salesName: 'Admin', items: [{ id: '1', transactionId: '1', productId: '1', product: mockProducts[0], quantity: 2, unitPrice: 141200, discount: 0, total: 282400 }], subtotal: 282400, taxAmount: 28240, discount: 0, total: 310640, paidAmount: 310640, remainingAmount: 0, paymentStatus: 'PAID', paymentMethod: 'Transfer Bank', deliveryStatus: 'DELIVERED', createdAt: '2024-01-07T10:30:00' },
  { id: '2', invoiceNumber: 'INV-2024-0002', customerId: '2', customer: mockCustomers[1], salesName: 'Admin', items: [{ id: '2', transactionId: '2', productId: '3', product: mockProducts[2], quantity: 5, unitPrice: 66900, discount: 0, total: 334500 }], subtotal: 334500, taxAmount: 33450, discount: 50000, total: 317950, paidAmount: 200000, remainingAmount: 117950, paymentStatus: 'PARTIAL', paymentMethod: 'Cash', deliveryStatus: 'PROCESSING', createdAt: '2024-01-07T09:15:00' },
  { id: '3', invoiceNumber: 'INV-2024-0003', customerId: '3', customer: mockCustomers[2], salesName: 'Sales 1', items: [{ id: '3', transactionId: '3', productId: '4', product: mockProducts[3], quantity: 10, unitPrice: 62500, discount: 0, total: 625000 }], subtotal: 625000, taxAmount: 62500, discount: 0, total: 687500, paidAmount: 0, remainingAmount: 687500, paymentStatus: 'UNPAID', deliveryStatus: 'PENDING', createdAt: '2024-01-07T08:45:00' },
]

// ============ Transaction Item Row ============
interface TransactionItemRowProps {
  item: TransactionItemFormData
  products: MockProduct[]
  onChange: (item: TransactionItemFormData) => void
  onRemove: () => void
}

function TransactionItemRow({ item, products, onChange, onRemove }: TransactionItemRowProps) {
  const selectedProduct = products.find(p => p.id === item.productId)

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
              unitPrice: product?.sellingPrice || 0,
            })
          }}
        >
          <option value="">Select</option>
          {products.filter(p => p.isActive && p.stock > 0).map((product) => (
            <option key={product.id} value={product.id}>
              {product.code} - {product.name} (Stock: {product.stock})
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
          max={selectedProduct?.stock || 999}
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
  status: string
}

function TransactionForm({ transaction, customers, products, salesNames, paymentMethods, taxRateSetting, onSubmit, onCancel, loading }: {
  transaction?: MockTransaction
  customers: MockCustomer[]
  products: MockProduct[]
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
    items: transaction?.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })) || [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }],
    discount: transaction?.discount || 0,
    paymentMethod: transaction?.paymentMethod || paymentMethods[0] || DEFAULT_PAYMENT_METHODS[0],
    paidAmount: transaction?.paidAmount || 0,
    notes: '',
    status: transaction?.deliveryStatus || 'PENDING',
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
              <option key={customer.id} value={customer.id}>{customer.name}</option>
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
          <span>Tax (10%)</span>
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
        <label className="text-sm font-medium">Status</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
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

// ============ Transactions Page ============
export default function TransactionsPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const salesNames = useSalesNames()
  const paymentMethods = usePaymentMethods()
  const taxRateSetting = useTaxRate()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [viewDialog, setViewDialog] = React.useState(false)
  const [selectedTransaction, setSelectedTransaction] = React.useState<MockTransaction | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)
  const [paymentDialog, setPaymentDialog] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Transactions')
    setBreadcrumbs([{ title: 'Transactions' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch data
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => mockTransactions,
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
    mutationFn: async (data: TransactionFormData) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionFormData> }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setDeleteDialog(false)
    },
  })

  // Columns
  const columns: ColumnDef<MockTransaction>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => <SortableHeader column={column} title="Invoice" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('invoiceNumber')}</span>
      ),
    },
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
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.getValue('total')),
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
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
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
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => {
                  setSelectedTransaction(tx)
                  setOpenDialog(true)
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
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                onClick: () => {
                  setSelectedTransaction(tx)
                  setDeleteDialog(true)
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: TransactionFormData) => {
    if (selectedTransaction) {
      updateMutation.mutate({ id: selectedTransaction.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

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
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </ModalForm>

      {/* View Transaction Dialog */}
      <ModalForm
        open={viewDialog}
        onOpenChange={setViewDialog}
        title="Transaction Details"
        maxWidth="lg"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{selectedTransaction.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedTransaction.customer?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDateTime(selectedTransaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Status</p>
                <Badge className={DELIVERY_STATUS_COLORS[selectedTransaction.deliveryStatus] || 'bg-gray-100 text-gray-800'}>
                  {DELIVERY_STATUS_LABELS[selectedTransaction.deliveryStatus] || selectedTransaction.deliveryStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge className={PAYMENT_STATUS_COLORS[selectedTransaction.paymentStatus]}>
                  {PAYMENT_STATUS_LABELS[selectedTransaction.paymentStatus]}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <p className="font-medium mb-2">Items</p>
              <div className="border rounded-lg divide-y">
                {selectedTransaction.items.map((item, index) => (
                  <div key={index} className="flex justify-between p-3">
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedTransaction.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(selectedTransaction.taxAmount)}</span>
              </div>
              {selectedTransaction.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(selectedTransaction.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(selectedTransaction.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <span className="text-green-600">{formatCurrency(selectedTransaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining</span>
                <span className={selectedTransaction.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(selectedTransaction.remainingAmount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
              <Button onClick={() => { setViewDialog(false); setSelectedTransaction(selectedTransaction); setOpenDialog(true); }}>
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
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between">
                <span>Total Amount</span>
                <span className="font-bold">{formatCurrency(selectedTransaction.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Amount</span>
                <span className="text-green-600">{formatCurrency(selectedTransaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining</span>
                <span className="text-red-600 font-bold">{formatCurrency(selectedTransaction.remainingAmount)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Payment</label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaymentDialog(false)}>Cancel</Button>
              <Button onClick={() => setPaymentDialog(false)}>Update Payment</Button>
            </div>
          </div>
        )}
      </ModalForm>
    </div>
  )
}
