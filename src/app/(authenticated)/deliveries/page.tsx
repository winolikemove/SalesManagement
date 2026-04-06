'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Eye, Truck, CheckCircle, MapPin, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, LoadingScreen } from '@/components/shared'
import { formatDateTime, formatDate, formatCurrency } from '@/lib/utils'
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, FULFILLMENT_STATUS_LABELS, FULFILLMENT_STATUS_COLORS } from '@/lib/constants'
import { NumberInput } from '@/components/ui/number-input'
import { usePageHeader } from '@/stores/app-store'
import { api } from '@/lib/api'
import type { Delivery, Transaction, Driver, Vehicle, ApiResponse, Customer, TransactionItem, DeliveryItem } from '@/types'

// ============ Delivery Form Component ============
interface DeliveryItemFormData {
  transactionItemId: string
  productId: string
  productCode: string
  productName: string
  qtyOrdered: number
  qtyFulfilled: number
  qtyRemaining: number
  qtyToDeliver: number
  unitWeight: number
  unitName: string
  kgName: string
}

interface DeliveryFormData {
  transactionId: string
  invoiceNumber: string
  customerId: string
  customerCode: string
  customerName: string
  customerAddress: string
  customerPhone: string
  googleMapsUrl: string
  driverId: string
  driverName: string
  driverPhone: string
  vehicleId: string
  vehiclePlate: string
  vehicleType: string
  deliveryDate: string
  deliveryTime: string
  receiverName: string
  deliveryStatus: 'PENDING' | 'ON_DELIVERY' | 'DELIVERED' | 'FAILED'
  totalItems: number
  totalWeight: number
  notes: string
  items: DeliveryItemFormData[]
}

function DeliveryForm({ delivery, drivers, vehicles, transactions, customers, onSubmit, onCancel, loading }: {
  delivery?: Delivery
  drivers: Driver[]
  vehicles: Vehicle[]
  transactions: Transaction[]
  customers?: Customer[]
  onSubmit: (data: DeliveryFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  // Initialize form data
  const getInitialFormData = (): DeliveryFormData => {
    if (delivery) {
      return {
        transactionId: delivery.transactionId || '',
        invoiceNumber: delivery.invoiceNumber || '',
        customerId: delivery.customerId || '',
        customerCode: delivery.customerCode || '',
        customerName: delivery.customerName || '',
        customerAddress: delivery.customerAddress || '',
        customerPhone: delivery.customerPhone || '',
        googleMapsUrl: delivery.googleMapsUrl || '',
        driverId: delivery.driverId || '',
        driverName: delivery.driverName || '',
        driverPhone: delivery.driverPhone || '',
        vehicleId: delivery.vehicleId || '',
        vehiclePlate: delivery.vehiclePlate || '',
        vehicleType: delivery.vehicleType || '',
        deliveryDate: delivery.deliveryDate || new Date().toISOString().split('T')[0],
        deliveryTime: delivery.deliveryTime || '',
        receiverName: delivery.receiverName || '',
        deliveryStatus: delivery.deliveryStatus || 'PENDING',
        totalItems: delivery.totalItems || 0,
        totalWeight: delivery.totalWeight || 0,
        notes: delivery.notes || '',
        items: delivery.items?.map(item => ({
          transactionItemId: item.transactionItemId || '',
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          qtyOrdered: item.qtyDeliveredUnit,
          qtyFulfilled: item.qtyDeliveredUnit,
          qtyRemaining: 0,
          qtyToDeliver: item.qtyDeliveredUnit,
          unitWeight: item.qtyDeliveredKg / (item.qtyDeliveredUnit || 1),
          unitName: item.unitName,
          kgName: item.kgName,
        })) || [],
      }
    }
    return {
      transactionId: '',
      invoiceNumber: '',
      customerId: '',
      customerCode: '',
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      googleMapsUrl: '',
      driverId: '',
      driverName: '',
      driverPhone: '',
      vehicleId: '',
      vehiclePlate: '',
      vehicleType: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryTime: '',
      receiverName: '',
      deliveryStatus: 'PENDING',
      totalItems: 0,
      totalWeight: 0,
      notes: '',
      items: [],
    }
  }

  const [formData, setFormData] = React.useState<DeliveryFormData>(getInitialFormData)

  // Get selected transaction
  const selectedTransaction = transactions.find(t => t.id === formData.transactionId)

  // Get customer data for Google Maps URL
  const selectedCustomer = customers?.find(c => c.id === formData.customerId)

  // Update form data when transaction changes
  React.useEffect(() => {
    if (selectedTransaction && !delivery) {
      const customer = customers?.find(c => c.id === selectedTransaction.customerId)
      
      // Get items from transaction that have remaining quantity to deliver
      const items: DeliveryItemFormData[] = selectedTransaction.items?.map(item => ({
        transactionItemId: item.id,
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        qtyOrdered: item.qtyOrderUnit,
        qtyFulfilled: item.qtyFulfilledUnit || 0,
        qtyRemaining: item.qtyOrderUnit - (item.qtyFulfilledUnit || 0),
        qtyToDeliver: item.qtyOrderUnit - (item.qtyFulfilledUnit || 0), // Default to all remaining
        unitWeight: item.unitWeight,
        unitName: item.unitName,
        kgName: item.kgName,
      })).filter(item => item.qtyRemaining > 0) || []

      setFormData(prev => ({
        ...prev,
        invoiceNumber: selectedTransaction.invoiceNumber || '',
        customerId: selectedTransaction.customerId || '',
        customerCode: selectedTransaction.customerCode || '',
        customerName: selectedTransaction.customerName || '',
        customerAddress: selectedTransaction.customerAddress || '',
        customerPhone: selectedTransaction.customerPhone || '',
        googleMapsUrl: customer?.googleMapsUrl || '',
        items,
      }))
    }
  }, [selectedTransaction, delivery, customers])

  // Update driver info when driver selection changes
  const selectedDriver = drivers.find(d => d.id === formData.driverId)
  React.useEffect(() => {
    if (selectedDriver) {
      setFormData(prev => ({
        ...prev,
        driverName: selectedDriver.driverName,
        driverPhone: selectedDriver.phone,
      }))
    }
  }, [selectedDriver])

  // Update vehicle info when vehicle selection changes
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId)
  React.useEffect(() => {
    if (selectedVehicle) {
      setFormData(prev => ({
        ...prev,
        vehiclePlate: selectedVehicle.vehiclePlate,
        vehicleType: selectedVehicle.vehicleType,
      }))
    }
  }, [selectedVehicle])

  // Calculate totals when items change
  React.useEffect(() => {
    const totalItems = formData.items.reduce((sum, item) => sum + (item.qtyToDeliver > 0 ? 1 : 0), 0)
    const totalWeight = formData.items.reduce((sum, item) => sum + (item.qtyToDeliver * item.unitWeight), 0)
    setFormData(prev => ({ ...prev, totalItems, totalWeight }))
  }, [formData.items.map(i => i.qtyToDeliver).join(',')])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  // Update item qty to deliver
  const updateItemQty = (index: number, qty: number) => {
    const newItems = [...formData.items]
    newItems[index] = {
      ...newItems[index],
      qtyToDeliver: Math.min(qty, newItems[index].qtyRemaining),
    }
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  // Filter transactions that are pending or processing for delivery
  const availableTransactions = transactions.filter(t => 
    t.deliveryStatus === 'PENDING' || t.deliveryStatus === 'PROCESSING' || t.deliveryStatus === 'PARTIAL'
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Transaksi *</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.transactionId}
          onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
          required
          disabled={!!delivery}
        >
          <option value="">Pilih Transaksi</option>
          {availableTransactions.map((tx) => (
            <option key={tx.id} value={tx.id}>
              {tx.invoiceNumber} - {tx.customerName} ({formatCurrency(tx.grandTotal)})
            </option>
          ))}
        </select>
      </div>

      {/* Customer Info (Auto-filled) */}
      {formData.customerId && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <span className="ml-2 font-medium">{formData.customerName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Kode:</span>
              <span className="ml-2">{formData.customerCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Telepon:</span>
              <span className="ml-2">{formData.customerPhone || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Alamat:</span>
              <span className="ml-2">{formData.customerAddress || '-'}</span>
            </div>
          </div>
          {formData.googleMapsUrl && (
            <a
              href={formData.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <MapPin className="h-3 w-3" />
              Lihat di Google Maps
            </a>
          )}
        </div>
      )}

      {/* Driver & Vehicle */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Driver</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.driverId}
            onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
          >
            <option value="">Pilih Driver</option>
            {drivers.filter(d => d.isActive).map((driver) => (
              <option key={driver.id} value={driver.id}>{driver.driverName}</option>
            ))}
          </select>
          {formData.driverPhone && (
            <p className="text-xs text-muted-foreground">Telp: {formData.driverPhone}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Kendaraan</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
          >
            <option value="">Pilih Kendaraan</option>
            {vehicles.filter(v => v.isActive).map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>{vehicle.vehiclePlate} - {vehicle.vehicleType}</option>
            ))}
          </select>
          {formData.vehicleType && (
            <p className="text-xs text-muted-foreground">Tipe: {formData.vehicleType}</p>
          )}
        </div>
      </div>

      {/* Delivery Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tanggal Kirim</label>
          <input
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.deliveryDate}
            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Waktu Kirim</label>
          <input
            type="time"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.deliveryTime}
            onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
          />
        </div>
      </div>

      {/* Delivery Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Alamat Pengiriman</label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.customerAddress}
          onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
          placeholder="Alamat pengiriman"
        />
      </div>

      {/* Items to Deliver */}
      {formData.items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Item yang Dikirim</label>
            <span className="text-xs text-muted-foreground">* Kolom 'Terkirim' & 'Sisa' akan update otomatis</span>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Produk</th>
                  <th className="px-3 py-2 text-right">Order</th>
                  <th className="px-3 py-2 text-right">Sudah</th>
                  <th className="px-3 py-2 text-right bg-green-50 dark:bg-green-950/30">Terkirim*</th>
                  <th className="px-3 py-2 text-right bg-orange-50 dark:bg-orange-950/30">Sisa*</th>
                  <th className="px-3 py-2 text-right">Kirim</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={item.transactionItemId} className="border-t">
                    <td className="px-3 py-2">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.productCode}</p>
                    </td>
                    <td className="px-3 py-2 text-right">{item.qtyOrdered} {item.unitName}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{item.qtyFulfilled} {item.unitName}</td>
                    <td className="px-3 py-2 text-right bg-green-50 dark:bg-green-950/30 font-medium text-green-700 dark:text-green-300">{item.qtyFulfilled + item.qtyToDeliver} {item.unitName}</td>
                    <td className="px-3 py-2 text-right bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300">{item.qtyRemaining - item.qtyToDeliver} {item.unitName}</td>
                    <td className="px-3 py-2 text-right">
                      <NumberInput
                        className="w-16 h-8 text-right text-sm"
                        value={item.qtyToDeliver}
                        onChange={(value) => updateItemQty(index, value)}
                        min={0}
                        max={item.qtyRemaining}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-muted/50 rounded-lg p-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Item</p>
          <p className="font-medium">{formData.totalItems} item</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Berat</p>
          <p className="font-medium">{formData.totalWeight.toFixed(2)} Kg</p>
        </div>
      </div>

      {/* Status & Receiver (for edit mode) */}
      {delivery && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.deliveryStatus}
              onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value as DeliveryFormData['deliveryStatus'] })}
            >
              <option value="PENDING">Pending</option>
              <option value="ON_DELIVERY">Dalam Pengiriman</option>
              <option value="DELIVERED">Terkirim</option>
              <option value="FAILED">Gagal</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Penerima</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.receiverName}
              onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
              placeholder="Nama penerima barang"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Catatan</label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Catatan pengiriman..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={loading || !formData.transactionId}>
          {loading ? 'Menyimpan...' : delivery ? 'Update' : 'Buat Pengiriman'}
        </Button>
      </div>
    </form>
  )
}

// ============ Delivery Detail View Component ============
function DeliveryDetailView({ delivery, onEdit }: { delivery: Delivery; onEdit: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Delivery Number</p>
          <p className="font-medium">{delivery.deliveryNumber}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge className={DELIVERY_STATUS_COLORS[delivery.deliveryStatus]}>
            {DELIVERY_STATUS_LABELS[delivery.deliveryStatus]}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Invoice Number</p>
          <p className="font-medium">{delivery.invoiceNumber}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Delivery Date</p>
          <p className="font-medium">{formatDate(delivery.deliveryDate) || '-'}</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Customer</p>
          <p className="font-medium">{delivery.customerName}</p>
          <p className="text-xs text-muted-foreground">{delivery.customerCode}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Customer Phone</p>
          <p className="font-medium">{delivery.customerPhone || '-'}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Delivery Address</p>
        <p className="font-medium">{delivery.customerAddress || '-'}</p>
        {delivery.googleMapsUrl && (
          <a 
            href={delivery.googleMapsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
          >
            <MapPin className="h-3 w-3" />
            View on Google Maps
          </a>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Driver</p>
          <p className="font-medium">{delivery.driverName || 'Not assigned'}</p>
          {delivery.driverPhone && (
            <p className="text-xs text-muted-foreground">{delivery.driverPhone}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Vehicle</p>
          <p className="font-medium">{delivery.vehiclePlate || '-'}</p>
          {delivery.vehicleType && (
            <p className="text-xs text-muted-foreground">{delivery.vehicleType}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="font-medium">{delivery.totalItems}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Weight</p>
          <p className="font-medium">{delivery.totalWeight} kg</p>
        </div>
      </div>

      {delivery.deliveryTime && (
        <div>
          <p className="text-sm text-muted-foreground">Delivery Time</p>
          <p className="font-medium">{formatDateTime(delivery.deliveryTime)}</p>
        </div>
      )}

      {delivery.receiverName && (
        <div>
          <p className="text-sm text-muted-foreground">Receiver Name</p>
          <p className="font-medium">{delivery.receiverName}</p>
        </div>
      )}

      {delivery.notes && (
        <div>
          <p className="text-sm text-muted-foreground">Notes</p>
          <p>{delivery.notes}</p>
        </div>
      )}

      {/* Delivery Items */}
      {delivery.items && delivery.items.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-2">Delivery Items</p>
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Qty (Unit)</th>
                    <th className="px-3 py-2 text-right">Qty (Kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {delivery.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.productCode}</p>
                      </td>
                      <td className="px-3 py-2 text-right">{item.qtyDeliveredUnit} {item.unitName}</td>
                      <td className="px-3 py-2 text-right">{item.qtyDeliveredKg} {item.kgName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onEdit()}>Close</Button>
        {delivery.deliveryStatus === 'PENDING' && (
          <Button onClick={onEdit}>Edit Delivery</Button>
        )}
      </div>
    </div>
  )
}

// ============ Status Update Dialog ============
function StatusUpdateDialog({ 
  delivery, 
  open, 
  onOpenChange, 
  onConfirm, 
  loading 
}: { 
  delivery: Delivery | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (status: string, receiverName?: string, notes?: string) => void
  loading?: boolean
}) {
  const [receiverName, setReceiverName] = React.useState('')
  const [notes, setNotes] = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setReceiverName('')
      setNotes('')
    }
  }, [open])

  if (!delivery) return null

  const getStatusAction = () => {
    switch (delivery.deliveryStatus) {
      case 'PENDING':
        return { label: 'Start Delivery', newStatus: 'ON_DELIVERY' }
      case 'ON_DELIVERY':
        return { label: 'Mark as Delivered', newStatus: 'DELIVERED' }
      default:
        return null
    }
  }

  const action = getStatusAction()
  if (!action) return null

  const handleConfirm = () => {
    onConfirm(action.newStatus, receiverName, notes)
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={action.label}
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to {action.label.toLowerCase()} for <strong>{delivery.deliveryNumber}</strong>?
        </p>

        {action.newStatus === 'ON_DELIVERY' && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm"><strong>Driver:</strong> {delivery.driverName || 'Not assigned'}</p>
            <p className="text-sm"><strong>Vehicle:</strong> {delivery.vehiclePlate || 'Not assigned'}</p>
          </div>
        )}

        {action.newStatus === 'DELIVERED' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Receiver Name *</label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Name of person receiving the delivery"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || (action.newStatus === 'DELIVERED' && !receiverName.trim())}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </ModalForm>
  )
}

// ============ Deliveries Page ============
export default function DeliveriesPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [viewDialog, setViewDialog] = React.useState(false)
  const [selectedDelivery, setSelectedDelivery] = React.useState<Delivery | null>(null)
  const [statusDialog, setStatusDialog] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  React.useEffect(() => {
    setPageTitle('Deliveries')
    setBreadcrumbs([{ title: 'Deliveries' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch deliveries
  const { data: deliveriesResponse, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['deliveries', statusFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { pageSize: 100 }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      return api.getDeliveries(params) as Promise<ApiResponse<Delivery[]>>
    },
  })

  // Fetch drivers
  const { data: driversResponse } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => api.getDrivers({ activeOnly: true, pageSize: 100 }) as Promise<ApiResponse<Driver[]>>,
  })

  // Fetch vehicles
  const { data: vehiclesResponse } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => api.getVehicles({ activeOnly: true, pageSize: 100 }) as Promise<ApiResponse<Vehicle[]>>,
  })

  // Fetch transactions for creating deliveries
  const { data: transactionsResponse } = useQuery({
    queryKey: ['transactions-for-delivery'],
    queryFn: async () => api.getTransactions({ pageSize: 100 }) as Promise<ApiResponse<Transaction[]>>,
  })

  // Fetch customers for Google Maps URL
  const { data: customersResponse } = useQuery({
    queryKey: ['customers-for-delivery'],
    queryFn: async () => api.getCustomers({ pageSize: 100 }) as Promise<ApiResponse<Customer[]>>,
  })

  // Extract data from responses
  const deliveries = deliveriesResponse?.data || []
  const drivers = driversResponse?.data || []
  const vehicles = vehiclesResponse?.data || []
  const transactions = transactionsResponse?.data || []
  const customers = customersResponse?.data || []

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.updateDeliveryStatus(id, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      setStatusDialog(false)
    },
  })

  // Handle status update with additional data
  const handleStatusUpdate = (status: string, receiverName?: string, notes?: string) => {
    if (!selectedDelivery) return
    updateStatusMutation.mutate({ id: selectedDelivery.id, status })
  }

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
      accessorKey: 'invoiceNumber',
      header: 'Invoice',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue('invoiceNumber')}</span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: ({ column }) => <SortableHeader column={column} title="Customer" />,
      cell: ({ row }) => {
        const delivery = row.original
        return (
          <div>
            <p className="font-medium">{delivery.customerName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {delivery.customerAddress?.substring(0, 40)}{delivery.customerAddress && delivery.customerAddress.length > 40 ? '...' : ''}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'driverName',
      header: 'Driver',
      cell: ({ row }) => {
        const driverName = row.getValue('driverName') as string
        const driverPhone = row.original.driverPhone
        return driverName ? (
          <div>
            <p className="font-medium">{driverName}</p>
            {driverPhone && <p className="text-xs text-muted-foreground">{driverPhone}</p>}
          </div>
        ) : (
          <span className="text-muted-foreground">Not assigned</span>
        )
      },
    },
    {
      accessorKey: 'vehiclePlate',
      header: 'Vehicle',
      cell: ({ row }) => {
        const vehiclePlate = row.getValue('vehiclePlate') as string
        const vehicleType = row.original.vehicleType
        return vehiclePlate ? (
          <div>
            <p className="font-medium">{vehiclePlate}</p>
            {vehicleType && <p className="text-xs text-muted-foreground">{vehicleType}</p>}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: 'deliveryStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('deliveryStatus') as string
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
      accessorKey: 'totalItems',
      header: 'Items',
      cell: ({ row }) => {
        const totalItems = row.getValue('totalItems') as number
        const totalWeight = row.original.totalWeight
        return (
          <div className="text-right">
            <p className="font-medium">{totalItems}</p>
            <p className="text-xs text-muted-foreground">{totalWeight} kg</p>
          </div>
        )
      },
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
              ...(delivery.deliveryStatus === 'PENDING' ? [
                {
                  label: 'Edit',
                  icon: <Pencil className="h-4 w-4" />,
                  onClick: () => {
                    setSelectedDelivery(delivery)
                    setOpenDialog(true)
                  },
                },
                {
                  label: 'Start Delivery',
                  icon: <Truck className="h-4 w-4" />,
                  onClick: () => {
                    setSelectedDelivery(delivery)
                    setStatusDialog(true)
                  },
                }
              ] : []),
              ...(delivery.deliveryStatus === 'ON_DELIVERY' ? [{
                label: 'Mark Delivered',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: () => {
                  setSelectedDelivery(delivery)
                  setStatusDialog(true)
                },
              }] : []),
              ...(delivery.deliveryStatus !== 'DELIVERED' && delivery.deliveryStatus !== 'FAILED' ? [{
                label: 'Mark Failed',
                icon: <XCircle className="h-4 w-4" />,
                onClick: () => {
                  setSelectedDelivery(delivery)
                  updateStatusMutation.mutate({ id: delivery.id, status: 'FAILED' })
                },
              }] : []),
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: DeliveryFormData) => {
    // Delivery creation/update
    if (selectedDelivery) {
      // For updates
      console.log('Update delivery:', data)
    } else {
      // For new delivery
      console.log('Create delivery:', data)
    }
    setOpenDialog(false)
    queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  }

  if (isLoadingDeliveries) {
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
        data={deliveries}
        searchKey="deliveryNumber"
        searchPlaceholder="Search deliveries..."
        toolbar={
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ON_DELIVERY">On Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
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
          drivers={drivers}
          vehicles={vehicles}
          transactions={transactions}
          customers={customers}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={false}
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
          <DeliveryDetailView 
            delivery={selectedDelivery} 
            onEdit={() => setViewDialog(false)} 
          />
        )}
      </ModalForm>

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        delivery={selectedDelivery}
        open={statusDialog}
        onOpenChange={setStatusDialog}
        onConfirm={handleStatusUpdate}
        loading={updateStatusMutation.isPending}
      />
    </div>
  )
}
