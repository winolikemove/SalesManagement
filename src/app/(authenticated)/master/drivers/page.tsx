'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { formatDateTime, formatDate } from '@/lib/utils'
import { usePageHeader } from '@/stores/app-store'
import type { Driver } from '@/types'

// ============ Mock Data ============
const mockDrivers: Driver[] = [
  { id: '1', name: 'Budi Santoso', phone: '081234567890', email: 'budi@transman.com', licenseNumber: 'SIM-123456', licenseExpiry: '2025-06-15', address: 'Jl. Margonda No. 10, Depok', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', totalDeliveries: 156 },
  { id: '2', name: 'Ahmad Wijaya', phone: '081234567891', email: 'ahmad@transman.com', licenseNumber: 'SIM-234567', licenseExpiry: '2024-03-20', address: 'Jl. Sudirman No. 25, Jakarta', isActive: true, createdAt: '2024-01-02', updatedAt: '2024-01-02', totalDeliveries: 89 },
  { id: '3', name: 'Dedi Kurniawan', phone: '081234567892', email: 'dedi@transman.com', licenseNumber: 'SIM-345678', licenseExpiry: '2024-12-01', address: 'Jl. Gatot Subroto No. 5, Jakarta', isActive: true, createdAt: '2024-01-03', updatedAt: '2024-01-03', totalDeliveries: 67 },
  { id: '4', name: 'Rudi Hartono', phone: '081234567893', licenseNumber: 'SIM-456789', licenseExpiry: '2024-01-15', address: 'Jl. Thamrin No. 8, Jakarta', isActive: false, createdAt: '2024-01-04', updatedAt: '2024-01-04', totalDeliveries: 45 },
]

// ============ Driver Form Component ============
interface DriverFormData {
  name: string
  phone: string
  email: string
  licenseNumber: string
  licenseExpiry: string
  address: string
  isActive: boolean
}

function DriverForm({ driver, onSubmit, onCancel, loading }: {
  driver?: Driver
  onSubmit: (data: DriverFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<DriverFormData>({
    name: driver?.name || '',
    phone: driver?.phone || '',
    email: driver?.email || '',
    licenseNumber: driver?.licenseNumber || '',
    licenseExpiry: driver?.licenseExpiry || '',
    address: driver?.address || '',
    isActive: driver?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">License Number</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">License Expiry</label>
          <input
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.licenseExpiry}
            onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Address</label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
          {loading ? 'Saving...' : driver ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// ============ Drivers Page ============
export default function DriversPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [selectedDriver, setSelectedDriver] = React.useState<Driver | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Drivers Management')
    setBreadcrumbs([{ title: 'Master Data' }, { title: 'Drivers' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch drivers
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => mockDrivers,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: DriverFormData) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DriverFormData> }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      setDeleteDialog(false)
    },
  })

  // Check if license is expiring soon (within 30 days)
  const isLicenseExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const isLicenseExpired = (expiryDate: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  // Columns
  const columns: ColumnDef<Driver>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const driver = row.original
        const initials = driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={driver.photo} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{driver.name}</p>
              <p className="text-xs text-muted-foreground">{driver.phone}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'licenseNumber',
      header: 'License',
      cell: ({ row }) => {
        const driver = row.original
        const expiring = isLicenseExpiringSoon(driver.licenseExpiry || '')
        const expired = isLicenseExpired(driver.licenseExpiry || '')
        return (
          <div className="flex items-center gap-2">
            <span>{driver.licenseNumber || '-'}</span>
            {(expiring || expired) && (
              <AlertCircle className={`h-4 w-4 ${expired ? 'text-red-600' : 'text-yellow-600'}`} />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'licenseExpiry',
      header: 'License Expiry',
      cell: ({ row }) => {
        const expiry = row.getValue('licenseExpiry') as string
        const expired = isLicenseExpired(expiry)
        return (
          <span className={expired ? 'text-red-600' : ''}>
            {formatDate(expiry) || '-'}
          </span>
        )
      },
    },
    {
      accessorKey: 'totalDeliveries',
      header: 'Deliveries',
      cell: ({ row }) => <span>{row.getValue('totalDeliveries') || 0}</span>,
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
        const driver = row.original
        return (
          <RowActions
            row={driver}
            actions={[
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => {
                  setSelectedDriver(driver)
                  setOpenDialog(true)
                },
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                onClick: () => {
                  setSelectedDriver(driver)
                  setDeleteDialog(true)
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: DriverFormData) => {
    if (selectedDriver) {
      updateMutation.mutate({ id: selectedDriver.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Drivers Management" description="Manage delivery drivers">
        <Button onClick={() => { setSelectedDriver(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={drivers || []}
        searchKey="name"
        searchPlaceholder="Search drivers..."
      />

      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedDriver ? 'Edit Driver' : 'Add Driver'}
        maxWidth="lg"
      >
        <DriverForm
          driver={selectedDriver || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </ModalForm>

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Driver"
        description={`Are you sure you want to delete "${selectedDriver?.name}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedDriver && deleteMutation.mutate(selectedDriver.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
