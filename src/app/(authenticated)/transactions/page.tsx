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
import { api } from '@/lib/api'
import { formatDateTime, formatCurrency, cn } from '@/lib/utils'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, TRANSACTION_STATUS_LABELS, TRANSACTION_STATUS_COLORS, DEFAULT_PAYMENT_METHODS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import type { Transaction, TransactionItem, Customer, Product } from '@/types'

// ============ Mock Data ============
const mockCustomers: Customer[] = [
  { id: '1', code: 'CUST001', name: 'PT ABC Corporation', phone: '0211234567', address: 'Jl. Sudirman No. 1, Jakarta', isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', code: 'CUST002', name: 'CV XYZ Trading', phone: '0217654321', address: 'Jl. Gatot Subroto No. 10, Jakarta', isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', code: 'CUST003', name: 'UD DEF Store', phone: '0215551234', address: 'Jl. Hayam Wuruk No. 5, Jakarta', isActive: true, createdAt: '', updatedAt: '' },
]

const mockProducts: Product[] = [
  { id: '1', code: 'PRD001', name: 'Laptop Dell XPS 15', category: 'Electronics', unit: 'pcs', basePrice: 15000000, sellingPrice: 18500000, stock: 25, minStock: 5, isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', code: 'PRD002', name: 'Office Chair Premium', category: 'Furniture', unit: 'pcs', basePrice: 2500000, sellingPrice: 3500000, stock: 15, minStock: 3, isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', code: 'PRD003', name: 'Printer Paper A4', category: 'Office Supplies', unit: 'pack', basePrice: 45000, sellingPrice: 65000, stock: 3, minStock: 20, isActive: true, createdAt: '', updatedAt: '' },
]

const mockTransactions: Transaction[] = [
  { id: '1', invoiceNumber: 'INV-2024-0001', customerId: '1', customer: mockCustomers[0], salesName: 'Admin', items: [{ id: '1', transactionId: '1', productId: '1', product: mockProducts[0], quantity: 2, unitPrice: 18500000, discount: 0, total: 37000000 }], subtotal: 37000000, taxAmount: 3700000, discount: 0, total: 40700000, paidAmount: 40700000, remainingAmount: 0, paymentStatus: 'paid', paymentMethod: 'Bank Transfer', status: 'completed', createdAt: '2024-01-07T10:30:00', updatedAt: '' },
  { id: '2', invoiceNumber: 'INV-2024-0002', customerId: '2', customer: mockCustomers[1], salesName: 'Admin', items: [{ id: '2', transactionId: '2', productId: '2', product: mockProducts[1], quantity: 5, unitPrice: 3500000, discount: 0, total: 17500000 }], subtotal: 17500000, taxAmount: 1750000, discount: 500000, total: 18750000, paidAmount: 10000000, remainingAmount: 8750000, paymentStatus: 'partial', paymentMethod: 'Cash', status: 'confirmed', createdAt: '2024-01-07T09:15:00', updatedAt: '' },
  { id: '3', invoiceNumber: 'INV-2024-0003', customerId: '3', customer: mockCustomers[2], salesName: 'Sales 1', items: [{ id: '3', transactionId: '3', productId: '3', product: mockProducts[2], quantity: 100, unitPrice: 65000, discount: 0, total: 6500000 }], subtotal: 6500000, taxAmount: 650000, discount: 0, total: 7150000, paidAmount: 0, remainingAmount: 7150000, paymentStatus: 'pending', status: 'draft', createdAt: '2024-01-07T08:45:00', updatedAt: '' },
]

// ============ Transaction Item Row ============
interface TransactionItemRowProps {
  item: TransactionItemFormData
  products: Product[]
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
          onChange={(e) => onChange({ ...item, unitPrice: Number(e.target.value) })}
          min={0}
        />
      </div>
      <div className="col-span-2">
        <label className="text-xs text-muted-foreground">Qty</label>
        <input
          type="number"
          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: Number(e.target.value) })}
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
          onChange={(e) => onChange({ ...item, discount: Number(e.target.value) })}
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

function TransactionForm({ transaction, customers, products, onSubmit, onCancel, loading }: {
  transaction?: Transaction
  customers: Customer[]
  products: Product[]
  onSubmit: (data: TransactionFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<TransactionFormData>({
    customerId: transaction?.customerId || '',
    salesName: transaction?.salesName || '',
    items: transaction?.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })) || [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }],
    discount: transaction?.discount || 0,
    paymentMethod: transaction?.paymentMethod || DEFAULT_PAYMENT_METHODS[0],
    paidAmount: transaction?.paidAmount || 0,
    notes: '',
    status: transaction?.status || 'draft',
  })

  const taxRate = 0.1 // 10%

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
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.salesName}
            onChange={(e) => setFormData({ ...formData, salesName: e.target.value })}
          />
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
            onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
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
            {DEFAULT_PAYMENT_METHODS.map((method) => (
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
            onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
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
  const [openDialog, setOpenDialog] = React.useState(false)
  const [viewDialog, setViewDialog] = React.useState(false)
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null)
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
  const columns: ColumnDef<Transaction>[] = [
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge className={TRANSACTION_STATUS_COLORS[status]}>
            {TRANSACTION_STATUS_LABELS[status]}
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
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={TRANSACTION_STATUS_COLORS[selectedTransaction.status]}>
                  {TRANSACTION_STATUS_LABELS[selectedTransaction.status]}
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
                {DEFAULT_PAYMENT_METHODS.map((method) => (
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
