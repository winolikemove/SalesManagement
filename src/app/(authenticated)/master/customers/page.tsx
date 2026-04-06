'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Eye, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { api } from '@/lib/api'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { usePageHeader } from '@/stores/app-store'
import type { Customer } from '@/types'

// ============ Mock Data ============
const mockCustomers: Customer[] = [
  { id: '1', code: 'CUST001', name: 'PT ABC Corporation', email: 'info@abc.com', phone: '0211234567', address: 'Jl. Sudirman No. 1', city: 'Jakarta', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', totalTransactions: 45, totalSpent: 125000000 },
  { id: '2', code: 'CUST002', name: 'CV XYZ Trading', email: 'sales@xyz.com', phone: '0217654321', address: 'Jl. Gatot Subroto No. 10', city: 'Jakarta', isActive: true, createdAt: '2024-01-02', updatedAt: '2024-01-02', totalTransactions: 32, totalSpent: 87500000 },
  { id: '3', code: 'CUST003', name: 'UD DEF Store', email: 'contact@def.com', phone: '0215551234', address: 'Jl. Hayam Wuruk No. 5', city: 'Jakarta', isActive: true, createdAt: '2024-01-03', updatedAt: '2024-01-03', totalTransactions: 28, totalSpent: 62500000 },
  { id: '4', code: 'CUST004', name: 'PT GHI Indonesia', email: 'info@ghi.com', phone: '0219998877', address: 'Jl. Thamrin No. 20', city: 'Jakarta', isActive: false, createdAt: '2024-01-04', updatedAt: '2024-01-04', totalTransactions: 12, totalSpent: 35000000 },
]

// ============ Customer Form Component ============
interface CustomerFormData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  notes: string
  isActive: boolean
}

function CustomerForm({ customer, onSubmit, onCancel, loading }: {
  customer?: Customer
  onSubmit: (data: CustomerFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<CustomerFormData>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    postalCode: customer?.postalCode || '',
    notes: customer?.notes || '',
    isActive: customer?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-1 sm:col-span-2 space-y-2">
          <label className="text-sm font-medium">Name *</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone *</label>
          <input
            type="tel"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Address</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">City</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Postal Code</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => mockCustomers,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setOpenDialog(false)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setOpenDialog(false)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setDeleteDialog(false)
    },
  })

  // Columns
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <SortableHeader column={column} title="Code" />,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.getValue('name')}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'city',
      header: 'City',
    },
    {
      accessorKey: 'totalTransactions',
      header: 'Transactions',
      cell: ({ row }) => {
        const count = row.getValue('totalTransactions') as number
        return <span>{count || 0}</span>
      },
    },
    {
      accessorKey: 'totalSpent',
      header: 'Total Spent',
      cell: ({ row }) => formatCurrency(row.getValue('totalSpent') || 0),
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
        searchKey="name"
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
        description={`Are you sure you want to delete "${selectedCustomer?.name}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedCustomer && deleteMutation.mutate(selectedCustomer.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
