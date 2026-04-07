'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Car, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { api } from '@/lib/api'
import { formatDateTime, formatDate } from '@/lib/utils'
import { NumberInput } from '@/components/ui/number-input'
import { usePageHeader } from '@/stores/app-store'
import type { Vehicle } from '@/types'

// Vehicle types
const VEHICLE_TYPES = ['Pickup', 'Van', 'Box Truck', 'Truck', 'Motorcycle']

// ============ Vehicle Form Component ============
interface VehicleFormData {
  vehiclePlate: string
  vehicleType: string
  vehicleBrand: string
  vehicleModel: string
  maxCapacityKg: number
  stnkExpiry: string
  kirExpiry: string
  isActive: boolean
  notes: string
}

function VehicleForm({ vehicle, onSubmit, onCancel, loading }: {
  vehicle?: Vehicle
  onSubmit: (data: VehicleFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<VehicleFormData>({
    vehiclePlate: vehicle?.vehiclePlate || '',
    vehicleType: vehicle?.vehicleType || VEHICLE_TYPES[0],
    vehicleBrand: vehicle?.vehicleBrand || '',
    vehicleModel: vehicle?.vehicleModel || '',
    maxCapacityKg: vehicle?.maxCapacityKg || 0,
    stnkExpiry: vehicle?.stnkExpiry || '',
    kirExpiry: vehicle?.kirExpiry || '',
    isActive: vehicle?.isActive ?? true,
    notes: vehicle?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Vehicle Info */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Vehicle Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Plate Number *</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.vehiclePlate}
              onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
              required
              placeholder="e.g., B 1234 ABC"
              disabled={!!vehicle}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Vehicle Type *</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Brand & Model */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Brand & Model</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Brand</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.vehicleBrand}
              onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
              placeholder="e.g., Toyota, Isuzu"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.vehicleModel}
              onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
              placeholder="e.g., Hilux, Elf"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Capacity (Kg) *</label>
            <NumberInput
              value={formData.maxCapacityKg}
              onChange={(value) => setFormData({ ...formData, maxCapacityKg: value })}
              placeholder="Maximum capacity in Kg"
              required
            />
          </div>
        </div>
      </div>

      {/* Document Expiry */}
      <div className="border-b pb-4 mb-4">
        <h4 className="font-medium mb-3">Document Expiry Dates</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">STNK Expiry</label>
            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.stnkExpiry}
              onChange={(e) => setFormData({ ...formData, stnkExpiry: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">KIR Expiry</label>
            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.kirExpiry}
              onChange={(e) => setFormData({ ...formData, kirExpiry: e.target.value })}
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
          {loading ? 'Saving...' : vehicle ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// ============ Vehicles Page ============
export default function VehiclesPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Vehicles Management')
    setBreadcrumbs([{ title: 'Master Data' }, { title: 'Vehicles' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch vehicles
  const { data: response, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.getVehicles(),
  })

  const vehicles = response?.data || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: VehicleFormData) => api.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleFormData> }) => api.updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setDeleteDialog(false)
    },
  })

  // Check document expiry
  const isDocumentExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const isDocumentExpired = (expiryDate: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  // Columns
  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'vehiclePlate',
      header: ({ column }) => <SortableHeader column={column} title="Plate Number" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
            <Car className="h-4 w-4" />
          </div>
          <span className="font-medium">{row.getValue('vehiclePlate')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'vehicleType',
      header: 'Type',
    },
    {
      accessorKey: 'vehicleBrand',
      header: 'Brand/Model',
      cell: ({ row }) => {
        const brand = row.original.vehicleBrand
        const model = row.original.vehicleModel
        return <span>{brand} {model}</span>
      },
    },
    {
      accessorKey: 'maxCapacityKg',
      header: 'Capacity',
      cell: ({ row }) => `${row.getValue('maxCapacityKg')} Kg`,
    },
    {
      accessorKey: 'stnkExpiry',
      header: 'STNK',
      cell: ({ row }) => {
        const expiry = row.getValue('stnkExpiry') as string
        const expired = isDocumentExpired(expiry)
        const expiring = isDocumentExpiringSoon(expiry)
        return (
          <div className="flex items-center gap-1">
            <span className={expired ? 'text-red-600 font-medium' : expiring ? 'text-yellow-600 font-medium' : ''}>
              {formatDate(expiry) || '-'}
            </span>
            {(expired || expiring) && <AlertCircle className={`h-4 w-4 ${expired ? 'text-red-600' : 'text-yellow-600'}`} />}
          </div>
        )
      },
    },
    {
      accessorKey: 'kirExpiry',
      header: 'KIR',
      cell: ({ row }) => {
        const expiry = row.getValue('kirExpiry') as string
        const expired = isDocumentExpired(expiry)
        const expiring = isDocumentExpiringSoon(expiry)
        return (
          <div className="flex items-center gap-1">
            <span className={expired ? 'text-red-600 font-medium' : expiring ? 'text-yellow-600 font-medium' : ''}>
              {formatDate(expiry) || '-'}
            </span>
            {(expired || expiring) && <AlertCircle className={`h-4 w-4 ${expired ? 'text-red-600' : 'text-yellow-600'}`} />}
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
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const vehicle = row.original
        return (
          <RowActions
            row={vehicle}
            actions={[
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => {
                  setSelectedVehicle(vehicle)
                  setOpenDialog(true)
                },
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                onClick: () => {
                  setSelectedVehicle(vehicle)
                  setDeleteDialog(true)
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: VehicleFormData) => {
    if (selectedVehicle) {
      updateMutation.mutate({ id: selectedVehicle.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicles Management" description="Manage delivery vehicles">
        <Button onClick={() => { setSelectedVehicle(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={vehicles || []}
        searchKey="vehiclePlate"
        searchPlaceholder="Search vehicles..."
      />

      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        maxWidth="lg"
      >
        <VehicleForm
          vehicle={selectedVehicle || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </ModalForm>

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Vehicle"
        description={`Are you sure you want to delete "${selectedVehicle?.vehiclePlate}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedVehicle && deleteMutation.mutate(selectedVehicle.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
