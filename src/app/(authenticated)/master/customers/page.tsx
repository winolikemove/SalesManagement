'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, MapPin, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { api } from '@/lib/api'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { usePageHeader } from '@/stores/app-store'
import type { Customer } from '@/types'

// ============ Customer Form Component ============
interface CustomerFormData {
  customerCode: string
  customerName: string
  address: string
  city: string
  province: string
  postalCode: string
  googleMapsUrl: string
  picName: string
  picPosition: string
  picPhone: string
  picEmail: string
  creditLimit: number
  paymentTerms: number
  isActive: boolean
  notes: string
}

function CustomerForm({ customer, onSubmit, onCancel, loading }: {
  customer?: Customer
  onSubmit: (data: CustomerFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<CustomerFormData>({
    customerCode: customer?.customerCode || '',
    customerName: customer?.customerName || '',
    address: customer?.address || '',
    city: customer?.city || '',
    province: customer?.province || '',
    postalCode: customer?.postalCode || '',
    googleMapsUrl: customer?.googleMapsUrl || '',
    picName: customer?.picName || '',
    picPosition: customer?.picPosition || '',
    picPhone: customer?.picPhone || '',
    picEmail: customer?.picEmail || '',
    creditLimit: customer?.creditLimit || 0,
    paymentTerms: customer?.paymentTerms || 30,
    isActive: customer?.isActive ?? true,
    notes: customer?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Info */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Customer Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Code *</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.customerCode}
              onChange={(e) => setFormData({ ...formData, customerCode: e.target.value.toUpperCase() })}
              required
              placeholder="e.g., CUST001"
              disabled={!!customer}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Name *</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
              placeholder="Enter customer name"
            />
          </div>
        </div>
      </div>

      {/* Address Info */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Address Information</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Address *</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="Enter full address"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Province</label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Province"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Postal Code</label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="Postal code"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Google Maps URL</label>
            <input
              type="url"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.googleMapsUrl}
              onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
              placeholder="https://maps.google.com/..."
            />
          </div>
        </div>
      </div>

      {/* PIC Info */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Person In Charge (PIC)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">PIC Name</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.picName}
              onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
              placeholder="Contact person name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">PIC Position</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.picPosition}
              onChange={(e) => setFormData({ ...formData, picPosition: e.target.value })}
              placeholder="Position"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">PIC Phone *</label>
            <input
              type="tel"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.picPhone}
              onChange={(e) => setFormData({ ...formData, picPhone: e.target.value })}
              required
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">PIC Email</label>
            <input
              type="email"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.picEmail}
              onChange={(e) => setFormData({ ...formData, picEmail: e.target.value })}
              placeholder="Email address"
            />
          </div>
        </div>
      </div>

      {/* Credit Info */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Credit & Payment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Credit Limit</label>
            <input
              type="number"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
              min={0}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Terms (days)</label>
            <input
              type="number"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: Number(e.target.value) })}
              min={0}
              placeholder="30"
            />
          </div>
        </div>
      </div>

      {/* Notes & Status */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
          />
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
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// ============ Customers Page ============
export default function CustomersPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Customers Management')
    setBreadcrumbs([{ title: 'Master Data' }, { title: 'Customers' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch customers
  const { data: response, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  })

  const customers = response?.data || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => api.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setOpenDialog(false)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => api.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setOpenDialog(false)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setDeleteDialog(false)
    },
  })

  // Columns
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'customerCode',
      header: ({ column }) => <SortableHeader column={column} title="Code" />,
    },
    {
      accessorKey: 'customerName',
      header: ({ column }) => <SortableHeader column={column} title="Customer Name" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.getValue('customerName')}</p>
          <p className="text-xs text-muted-foreground">{row.original.city}</p>
        </div>
      ),
    },
    {
      accessorKey: 'picName',
      header: 'PIC',
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div>
            <p>{customer.picName || '-'}</p>
            <p className="text-xs text-muted-foreground">{customer.picPhone}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'creditLimit',
      header: 'Credit Limit',
      cell: ({ row }) => formatCurrency(row.getValue('creditLimit') || 0),
    },
    {
      accessorKey: 'currentCredit',
      header: 'Current Credit',
      cell: ({ row }) => formatCurrency(row.getValue('currentCredit') || 0),
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
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const customer = row.original
        return (
          <RowActions
            row={customer}
            actions={[
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => {
                  setSelectedCustomer(customer)
                  setOpenDialog(true)
                },
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                onClick: () => {
                  setSelectedCustomer(customer)
                  setDeleteDialog(true)
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: CustomerFormData) => {
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customers Management" description="Manage your customer database">
        <Button onClick={() => { setSelectedCustomer(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={customers || []}
        searchKey="customerName"
        searchPlaceholder="Search customers..."
      />

      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}
        maxWidth="lg"
      >
        <CustomerForm
          customer={selectedCustomer || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </ModalForm>

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Customer"
        description={`Are you sure you want to delete "${selectedCustomer?.customerName}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedCustomer && deleteMutation.mutate(selectedCustomer.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
