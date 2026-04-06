'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Car, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { formatDateTime, formatDate } from '@/lib/utils'
import { usePageHeader } from '@/stores/app-store'
import type { Vehicle } from '@/types'

// ============ Mock Data ============
const mockVehicles: Vehicle[] = [
  { id: '1', plateNumber: 'B 1234 ABC', type: 'Pickup', brand: 'Toyota', model: 'Hilux', year: 2022, capacity: 1000, stnkExpiry: '2025-03-15', insuranceExpiry: '2025-01-20', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', plateNumber: 'B 5678 DEF', type: 'Box Truck', brand: 'Isuzu', model: 'Elf', year: 2021, capacity: 4000, stnkExpiry: '2024-02-28', insuranceExpiry: '2024-02-15', isActive: true, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  { id: '3', plateNumber: 'B 9012 GHI', type: 'Van', brand: 'Mitsubishi', model: 'Colt Diesel', year: 2023, capacity: 2000, stnkExpiry: '2026-05-10', insuranceExpiry: '2025-05-10', isActive: true, createdAt: '2024-01-03', updatedAt: '2024-01-03' },
  { id: '4', plateNumber: 'B 3456 JKL', type: 'Pickup', brand: 'Daihatsu', model: 'Gran Max', year: 2020, capacity: 800, stnkExpiry: '2024-01-10', insuranceExpiry: '2024-01-05', isActive: false, createdAt: '2024-01-04', updatedAt: '2024-01-04' },
]

// Vehicle types
const VEHICLE_TYPES = ['Pickup', 'Van', 'Box Truck', 'Truck', 'Motorcycle']

// ============ Vehicle Form Component ============
interface VehicleFormData {
  plateNumber: string
  type: string
  brand: string
  model: string
  year: number
  capacity: number
  stnkExpiry: string
  insuranceExpiry: string
  notes: string
  isActive: boolean
}

function VehicleForm({ vehicle, onSubmit, onCancel, loading }: {
  vehicle?: Vehicle
  onSubmit: (data: VehicleFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<VehicleFormData>({
    plateNumber: vehicle?.plateNumber || '',
    type: vehicle?.type || VEHICLE_TYPES[0],
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    capacity: vehicle?.capacity || 0,
    stnkExpiry: vehicle?.stnkExpiry || '',
    insuranceExpiry: vehicle?.insuranceExpiry || '',
    notes: vehicle?.notes || '',
    isActive: vehicle?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Plate Number *</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.plateNumber}
            onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Type *</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Brand</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Year</label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
            min={1990}
            max={new Date().getFullYear() + 1}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Capacity (kg)</label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
            min={0}
          />
        </div>
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
          <label className="text-sm font-medium">Insurance Expiry</label>
          <input
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.insuranceExpiry}
            onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
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
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => mockVehicles,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VehicleFormData> }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => ({ success: true }),
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
      accessorKey: 'plateNumber',
      header: ({ column }) => <SortableHeader column={column} title="Plate Number" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
            <Car className="h-4 w-4" />
          </div>
          <span className="font-medium">{row.getValue('plateNumber')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'brand',
      header: 'Brand/Model',
      cell: ({ row }) => {
        const brand = row.original.brand
        const model = row.original.model
        return <span>{brand} {model}</span>
      },
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => `${row.getValue('capacity')} kg`,
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
            <span className={expired ? 'text-red-600' : expiring ? 'text-yellow-600' : ''}>
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
        searchKey="plateNumber"
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
        description={`Are you sure you want to delete "${selectedVehicle?.plateNumber}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedVehicle && deleteMutation.mutate(selectedVehicle.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
