'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Eye, Truck, CheckCircle, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { formatDateTime, formatDate, formatCurrency, cn } from '@/lib/utils'
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import type { Delivery, Transaction, Driver, Vehicle, Customer } from '@/types'

// ============ Mock Data ============
const mockCustomers: Customer[] = [
  { id: '1', code: 'CUST001', name: 'PT ABC Corporation', phone: '0211234567', address: 'Jl. Sudirman No. 1, Jakarta', isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', code: 'CUST002', name: 'CV XYZ Trading', phone: '0217654321', address: 'Jl. Gatot Subroto No. 10, Jakarta', isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', code: 'CUST003', name: 'UD DEF Store', phone: '0215551234', address: 'Jl. Hayam Wuruk No. 5, Jakarta', isActive: true, createdAt: '', updatedAt: '' },
]

const mockDrivers: Driver[] = [
  { id: '1', name: 'Budi Santoso', phone: '081234567890', isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Ahmad Wijaya', phone: '081234567891', isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', name: 'Dedi Kurniawan', phone: '081234567892', isActive: true, createdAt: '', updatedAt: '' },
]

const mockVehicles: Vehicle[] = [
  { id: '1', plateNumber: 'B 1234 ABC', type: 'Pickup', isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', plateNumber: 'B 5678 DEF', type: 'Box Truck', isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', plateNumber: 'B 9012 GHI', type: 'Van', isActive: true, createdAt: '', updatedAt: '' },
]

const mockDeliveries: Delivery[] = [
  { id: '1', deliveryNumber: 'DEL-2024-0001', transactionId: '1', customerId: '1', customer: mockCustomers[0], driverId: '1', driver: mockDrivers[0], vehicleId: '1', vehicle: mockVehicles[0], deliveryAddress: 'Jl. Sudirman No. 1, Jakarta', deliveryDate: '2024-01-08', status: 'in_transit', createdAt: '2024-01-07T10:00:00', updatedAt: '' },
  { id: '2', deliveryNumber: 'DEL-2024-0002', transactionId: '2', customerId: '2', customer: mockCustomers[1], driverId: '2', driver: mockDrivers[1], vehicleId: '2', vehicle: mockVehicles[1], deliveryAddress: 'Jl. Gatot Subroto No. 10, Jakarta', status: 'pending', createdAt: '2024-01-07T11:00:00', updatedAt: '' },
  { id: '3', deliveryNumber: 'DEL-2024-0003', transactionId: '3', customerId: '3', customer: mockCustomers[2], status: 'pending', createdAt: '2024-01-07T12:00:00', updatedAt: '' },
  { id: '4', deliveryNumber: 'DEL-2024-0004', transactionId: '4', customerId: '1', customer: mockCustomers[0], driverId: '1', driver: mockDrivers[0], vehicleId: '1', vehicle: mockVehicles[0], deliveryAddress: 'Jl. Sudirman No. 1, Jakarta', status: 'delivered', completedAt: '2024-01-06T15:30:00', createdAt: '2024-01-06T09:00:00', updatedAt: '' },
]

// ============ Delivery Form Component ============
interface DeliveryFormData {
  transactionId: string
  driverId: string
  vehicleId: string
  deliveryAddress: string
  deliveryDate: string
  notes: string
}

function DeliveryForm({ delivery, drivers, vehicles, transactions, onSubmit, onCancel, loading }: {
  delivery?: Delivery
  drivers: Driver[]
  vehicles: Vehicle[]
  transactions: Transaction[]
  onSubmit: (data: DeliveryFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<DeliveryFormData>({
    transactionId: delivery?.transactionId || '',
    driverId: delivery?.driverId || '',
    vehicleId: delivery?.vehicleId || '',
    deliveryAddress: delivery?.deliveryAddress || '',
    deliveryDate: delivery?.deliveryDate || '',
    notes: delivery?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Transaction *</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.transactionId}
          onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
          required
          disabled={!!delivery}
        >
          <option value="">Select Transaction</option>
          {transactions.map((tx) => (
            <option key={tx.id} value={tx.id}>{tx.invoiceNumber}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Driver</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.driverId}
            onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
          >
            <option value="">Select Driver</option>
            {drivers.filter(d => d.isActive).map((driver) => (
              <option key={driver.id} value={driver.id}>{driver.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Vehicle</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
          >
            <option value="">Select Vehicle</option>
            {vehicles.filter(v => v.isActive).map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber} - {vehicle.type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Delivery Date</label>
          <input
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.deliveryDate}
            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Delivery Address</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.deliveryAddress}
            onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
            placeholder="Delivery address"
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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : delivery ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// ============ Deliveries Page ============
export default function DeliveriesPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [viewDialog, setViewDialog] = React.useState(false)
  const [selectedDelivery, setSelectedDelivery] = React.useState<Delivery | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  React.useEffect(() => {
    setPageTitle('Deliveries')
    setBreadcrumbs([{ title: 'Deliveries' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch data
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => mockDeliveries,
  })

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => mockDrivers,
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => mockVehicles,
  })

  // Filtered deliveries
  const filteredDeliveries = React.useMemo(() => {
    if (statusFilter === 'all') return deliveries
    return deliveries?.filter((d) => d.status === statusFilter)
  }, [deliveries, statusFilter])

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: DeliveryFormData) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeliveryFormData> }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      setDeleteDialog(false)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    },
  })

  // Columns
  const columns: ColumnDef<Delivery>[] = [
    {
      accessorKey: 'deliveryNumber',
      header: ({ column }) => <SortableHeader column={column} title="Delivery #" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('deliveryNumber')}</span>
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
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {row.original.deliveryAddress || customer?.address || '-'}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'driver',
      header: 'Driver',
      cell: ({ row }) => {
        const driver = row.original.driver
        return driver ? (
          <div>
            <p className="font-medium">{driver.name}</p>
            <p className="text-xs text-muted-foreground">{driver.phone}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">Not assigned</span>
        )
      },
    },
    {
      accessorKey: 'vehicle',
      header: 'Vehicle',
      cell: ({ row }) => {
        const vehicle = row.original.vehicle
        return vehicle ? (
          <span>{vehicle.plateNumber}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge className={DELIVERY_STATUS_COLORS[status]}>
            {DELIVERY_STATUS_LABELS[status]}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'deliveryDate',
      header: 'Delivery Date',
      cell: ({ row }) => formatDate(row.getValue('deliveryDate')) || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const delivery = row.original
        return (
          <RowActions
            row={delivery}
            actions={[
              {
                label: 'View',
                icon: <Eye className="h-4 w-4" />,
                onClick: () => {
                  setSelectedDelivery(delivery)
                  setViewDialog(true)
                },
              },
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => {
                  setSelectedDelivery(delivery)
                  setOpenDialog(true)
                },
              },
              ...(delivery.status === 'pending' ? [{
                label: 'Assign',
                icon: <Truck className="h-4 w-4" />,
                onClick: () => {
                  updateStatusMutation.mutate({ id: delivery.id, status: 'assigned' })
                },
              }] : []),
              ...(delivery.status === 'assigned' ? [{
                label: 'Start Delivery',
                icon: <Truck className="h-4 w-4" />,
                onClick: () => {
                  updateStatusMutation.mutate({ id: delivery.id, status: 'in_transit' })
                },
              }] : []),
              ...(delivery.status === 'in_transit' ? [{
                label: 'Complete',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: () => {
                  updateStatusMutation.mutate({ id: delivery.id, status: 'delivered' })
                },
              }] : []),
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                onClick: () => {
                  setSelectedDelivery(delivery)
                  setDeleteDialog(true)
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: DeliveryFormData) => {
    if (selectedDelivery) {
      updateMutation.mutate({ id: selectedDelivery.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Deliveries" description="Manage delivery orders">
        <Button onClick={() => { setSelectedDelivery(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Delivery
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filteredDeliveries || []}
        searchKey="deliveryNumber"
        searchPlaceholder="Search deliveries..."
        toolbar={
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
        }
      />

      {/* Delivery Form Dialog */}
      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedDelivery ? 'Edit Delivery' : 'New Delivery'}
        maxWidth="lg"
      >
        <DeliveryForm
          delivery={selectedDelivery || undefined}
          drivers={drivers || []}
          vehicles={vehicles || []}
          transactions={[]}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </ModalForm>

      {/* View Delivery Dialog */}
      <ModalForm
        open={viewDialog}
        onOpenChange={setViewDialog}
        title="Delivery Details"
        maxWidth="lg"
      >
        {selectedDelivery && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Number</p>
                <p className="font-medium">{selectedDelivery.deliveryNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={DELIVERY_STATUS_COLORS[selectedDelivery.status]}>
                  {DELIVERY_STATUS_LABELS[selectedDelivery.status]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedDelivery.customer?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Date</p>
                <p className="font-medium">{formatDate(selectedDelivery.deliveryDate) || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Driver</p>
                <p className="font-medium">{selectedDelivery.driver?.name || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">{selectedDelivery.vehicle?.plateNumber || '-'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="font-medium">{selectedDelivery.deliveryAddress || selectedDelivery.customer?.address || '-'}</p>
            </div>

            {selectedDelivery.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p>{selectedDelivery.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
              <Button onClick={() => { setViewDialog(false); setOpenDialog(true); }}>
                Edit Delivery
              </Button>
            </div>
          </div>
        )}
      </ModalForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Delivery"
        description={`Are you sure you want to delete "${selectedDelivery?.deliveryNumber}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedDelivery && deleteMutation.mutate(selectedDelivery.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
