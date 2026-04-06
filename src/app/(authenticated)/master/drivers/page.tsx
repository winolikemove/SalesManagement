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
import { api } from '@/lib/api'
import { formatDateTime, formatDate } from '@/lib/utils'
import { usePageHeader } from '@/stores/app-store'
import type { Driver } from '@/types'

// ============ Driver Form Component ============
interface DriverFormData {
  driverCode: string
  driverName: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  address: string
  isActive: boolean
  notes: string
}

function DriverForm({ driver, onSubmit, onCancel, loading }: {
  driver?: Driver
  onSubmit: (data: DriverFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<DriverFormData>({
    driverCode: driver?.driverCode || '',
    driverName: driver?.driverName || '',
    phone: driver?.phone || '',
    licenseNumber: driver?.licenseNumber || '',
    licenseExpiry: driver?.licenseExpiry || '',
    address: driver?.address || '',
    isActive: driver?.isActive ?? true,
    notes: driver?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Driver Code *</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.driverCode}
            onChange={(e) => setFormData({ ...formData, driverCode: e.target.value.toUpperCase() })}
            required
            placeholder="e.g., DRV001"
            disabled={!!driver}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Driver Name *</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.driverName}
            onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
            required
            placeholder="Enter driver name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone *</label>
          <input
            type="tel"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            placeholder="Enter phone number"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">License Number</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            placeholder="SIM number"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          placeholder="Enter address"
        />
      </div>

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
  const { data: response, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.getDrivers(),
  })

  const drivers = response?.data || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: DriverFormData) => api.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DriverFormData> }) => api.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDriver(id),
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
      accessorKey: 'driverCode',
      header: ({ column }) => <SortableHeader column={column} title="Code" />,
    },
    {
      accessorKey: 'driverName',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const driver = row.original
        const initials = driver.driverName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'D'
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={driver.photo} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{driver.driverName}</p>
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
        const expiring = isLicenseExpiringSoon(expiry)
        return (
          <span className={expired ? 'text-red-600 font-medium' : expiring ? 'text-yellow-600 font-medium' : ''}>
            {formatDate(expiry) || '-'}
          </span>
        )
      },
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => {
        const address = row.getValue('address') as string
        return (
          <span className="text-sm truncate max-w-[200px] block">
            {address || '-'}
          </span>
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
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
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
        searchKey="driverName"
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
        description={`Are you sure you want to delete "${selectedDriver?.driverName}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedDriver && deleteMutation.mutate(selectedDriver.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
