'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef, ColumnFiltersState, SortingState, getFilteredRowModel } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Eye, Printer, CreditCard, Package, Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { formatDateTime, formatCurrency, cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, DEFAULT_PAYMENT_METHODS, FULFILLMENT_STATUS_LABELS, FULFILLMENT_STATUS_COLORS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import { useSalesNames, usePaymentMethods, useTaxRate, useProductCategories } from '@/hooks/use-settings'
import { api } from '@/lib/api'
import type { Transaction, TransactionItem, Customer, Product, CustomerPrice } from '@/types'

// ============ Extended Transaction Item for Table Display ============
interface TransactionItemDisplay extends TransactionItem {
  invoiceDate: string
  customerCode: string
  customerName: string
  salesName: string
  paymentStatus: string
  deliveryStatus: string
  transactionId: string
}

// ============ Auto-Complete Input Component ============
interface AutoCompleteInputProps<T> {
  items: T[]
  value: string
  onChange: (value: string, selectedItem?: T) => void
  displayKey: keyof T
  valueKey: keyof T
  placeholder?: string
  renderItem?: (item: T) => React.ReactNode
  onClear?: () => void
}

function AutoCompleteInput<T extends { id: string }>({
  items,
  value,
  onChange,
  displayKey,
  valueKey,
  placeholder = 'Type to search...',
  renderItem,
  onClear,
}: AutoCompleteInputProps<T>) {
  const [inputValue, setInputValue] = React.useState('')
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [filteredItems, setFilteredItems] = React.useState<T[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)
  const suggestionsRef = React.useRef<HTMLDivElement>(null)

  // Filter items based on input
  React.useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredItems(items.slice(0, 10)) // Show first 10 items when empty
    } else {
      const filtered = items.filter(item => {
        const displayValue = String(item[displayKey]).toLowerCase()
        const codeValue = String(item[valueKey]).toLowerCase()
        const search = inputValue.toLowerCase()
        return displayValue.includes(search) || codeValue.includes(search)
      })
      setFilteredItems(filtered.slice(0, 20)) // Limit to 20 results
    }
  }, [inputValue, items, displayKey, valueKey])

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setShowSuggestions(true)
  }

  const handleSelectItem = (item: T) => {
    const displayValue = String(item[displayKey])
    setInputValue(displayValue)
    setShowSuggestions(false)
    onChange(String(item[valueKey]), item)
  }

  const handleClear = () => {
    setInputValue('')
    setShowSuggestions(false)
    onClear?.()
    onChange('')
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setShowSuggestions(true)
            setInputValue('') // Clear to show suggestions
          }}
          placeholder={placeholder}
          className="pr-8"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && filteredItems.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto"
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
              onClick={() => handleSelectItem(item)}
            >
              {renderItem ? renderItem(item) : String(item[displayKey])}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ Transaction Form Component ============
interface TransactionItemFormData {
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitWeight: number
  qtyKg: number
  unitPrice: number
  pricePerKg: number
  unitName: string
  kgName: string
  discount: number
  discountPercent: number
  hasSpecialPrice: boolean
  originalPrice: number
}

interface TransactionFormData {
  customerId: string
  customerCode: string
  customerName: string
  customerAddress: string
  customerPhone: string
  salesName: string
  items: TransactionItemFormData[]
  discountPercent: number
  paymentMethod: string
  paidAmount: number
  notes: string
}

function TransactionForm({ transaction, customers, products, customerPrices, salesNames, paymentMethods, taxRateSetting, onSubmit, onCancel, loading }: {
  transaction?: Transaction
  customers: Customer[]
  products: Product[]
  customerPrices: CustomerPrice[]
  salesNames: string[]
  paymentMethods: string[]
  taxRateSetting: number
  onSubmit: (data: TransactionFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<TransactionFormData>(() => {
    if (transaction) {
      return {
        customerId: transaction.customerId,
        customerCode: transaction.customerCode,
        customerName: transaction.customerName,
        customerAddress: transaction.customerAddress,
        customerPhone: transaction.customerPhone,
        salesName: transaction.salesName,
        items: transaction.items?.map(i => ({
          productId: i.productId,
          productCode: i.productCode,
          productName: i.productName,
          quantity: i.qtyOrderUnit,
          unitWeight: i.unitWeight,
          qtyKg: i.qtyOrderKg,
          unitPrice: i.pricePerUnit,
          pricePerKg: i.pricePerKg,
          unitName: i.unitName,
          kgName: i.kgName,
          discount: 0,
        })) || [],
        discountPercent: 0,
        paymentMethod: paymentMethods[0] || DEFAULT_PAYMENT_METHODS[0],
        paidAmount: transaction.paidAmount,
        notes: transaction.notes,
      }
    }
    return {
      customerId: '',
      customerCode: '',
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      salesName: salesNames[0] || '',
      items: [],
      discountPercent: 0,
      paymentMethod: paymentMethods[0] || DEFAULT_PAYMENT_METHODS[0],
      paidAmount: 0,
      notes: '',
    }
  })

  const taxRate = taxRateSetting / 100
  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0)
  const taxAmount = subtotal * taxRate
  const beforeDiscount = subtotal + taxAmount
  const discountAmount = beforeDiscount * formData.discountPercent / 100
  const total = beforeDiscount - discountAmount
  const remainingAmount = total - formData.paidAmount

  // Handle customer selection with auto-fill
  const handleCustomerSelect = (value: string, customer?: Customer) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        customerAddress: customer.address,
        customerPhone: customer.picPhone,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerCode: '',
        customerName: '',
        customerAddress: '',
        customerPhone: '',
      }))
    }
  }

  // Find customer special price for a product
  const findCustomerPrice = (productId: string): CustomerPrice | undefined => {
    if (!formData.customerId) return undefined
    return customerPrices.find(cp => 
      cp.customerId === formData.customerId && 
      cp.productId === productId && 
      cp.isActive
    )
  }

  // Handle product selection with auto-fill and customer price check
  const handleProductSelect = (index: number, value: string, product?: Product) => {
    if (product) {
      const newItems = [...formData.items]
      const currentQty = newItems[index]?.quantity || 1
      
      // Check if there's a special price for this customer + product
      const customerPrice = findCustomerPrice(product.id)
      
      if (customerPrice) {
        // Use special price from Customer Prices
        // Calculate discount amount from discount percent
        const discountAmountPerUnit = customerPrice.specialPricePerUnit * customerPrice.discountPercent / 100
        const totalDiscount = currentQty * discountAmountPerUnit
        
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productCode: product.productCode,
          productName: product.productName,
          unitWeight: product.baseUnitWeight,
          qtyKg: currentQty * product.baseUnitWeight,
          unitPrice: customerPrice.specialPricePerUnit,
          pricePerKg: customerPrice.specialPricePerKg,
          unitName: product.unitName,
          kgName: product.kgName,
          discountPercent: customerPrice.discountPercent,
          discount: totalDiscount,
          hasSpecialPrice: true,
          originalPrice: product.basePricePerUnit,
        }
      } else {
        // Use normal product price
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productCode: product.productCode,
          productName: product.productName,
          unitWeight: product.baseUnitWeight,
          qtyKg: currentQty * product.baseUnitWeight,
          unitPrice: product.basePricePerUnit,
          pricePerKg: product.basePricePerKg,
          unitName: product.unitName,
          kgName: product.kgName,
          discountPercent: 0,
          discount: 0,
          hasSpecialPrice: false,
          originalPrice: product.basePricePerUnit,
        }
      }
      setFormData(prev => ({ ...prev, items: newItems }))
    }
  }

  // Recalculate prices when customer changes
  React.useEffect(() => {
    if (formData.customerId && formData.items.length > 0) {
      const newItems = formData.items.map(item => {
        if (!item.productId) return item
        
        const product = products.find(p => p.id === item.productId)
        if (!product) return item
        
        const customerPrice = findCustomerPrice(item.productId)
        
        if (customerPrice) {
          // Calculate discount amount from discount percent
          const discountAmountPerUnit = customerPrice.specialPricePerUnit * customerPrice.discountPercent / 100
          const totalDiscount = item.quantity * discountAmountPerUnit
          
          return {
            ...item,
            unitPrice: customerPrice.specialPricePerUnit,
            pricePerKg: customerPrice.specialPricePerKg,
            discountPercent: customerPrice.discountPercent,
            discount: totalDiscount,
            hasSpecialPrice: true,
            originalPrice: product.basePricePerUnit,
          }
        } else {
          return {
            ...item,
            unitPrice: product.basePricePerUnit,
            pricePerKg: product.basePricePerKg,
            discountPercent: 0,
            discount: 0,
            hasSpecialPrice: false,
            originalPrice: product.basePricePerUnit,
          }
        }
      })
      setFormData(prev => ({ ...prev, items: newItems }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.customerId])

  // Auto-calculate qtyKg when quantity or unitWeight changes
  // Also recalculate discount for special price items
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const newQtyKg = item.quantity * item.unitWeight
        
        // Recalculate discount if has special price
        if (item.hasSpecialPrice && item.discountPercent > 0) {
          const discountAmountPerUnit = item.unitPrice * item.discountPercent / 100
          const totalDiscount = item.quantity * discountAmountPerUnit
          return {
            ...item,
            qtyKg: newQtyKg,
            discount: totalDiscount
          }
        }
        
        return {
          ...item,
          qtyKg: newQtyKg
        }
      })
    }))
  }, [formData.items.map(i => i.quantity).join(','), formData.items.map(i => i.unitWeight).join(',')])

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: '',
        productCode: '',
        productName: '',
        quantity: 1,
        unitWeight: 0,
        qtyKg: 0,
        unitPrice: 0,
        pricePerKg: 0,
        unitName: '',
        kgName: '',
        discount: 0,
        discountPercent: 0,
        hasSpecialPrice: false,
        originalPrice: 0,
      }]
    }))
  }

  // Remove item
  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  // Update item field
  const updateItem = (index: number, field: keyof TransactionItemFormData, value: number | string) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Selection with Auto-complete */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Customer *</label>
          <AutoCompleteInput<Customer>
            items={customers.filter(c => c.isActive)}
            value={formData.customerId}
            onChange={handleCustomerSelect}
            displayKey="customerName"
            valueKey="id"
            placeholder="Ketik nama customer..."
            renderItem={(customer) => (
              <div>
                <span className="font-medium">{customer.customerName}</span>
                <span className="text-muted-foreground ml-2">({customer.customerCode})</span>
                <span className="text-muted-foreground ml-2 text-xs">{customer.city}</span>
              </div>
            )}
          />
        </div>

        {/* Auto-filled Customer Details */}
        {formData.customerId && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg text-sm">
            <div>
              <span className="text-muted-foreground">Kode:</span>
              <span className="ml-2 font-medium">{formData.customerCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Telepon:</span>
              <span className="ml-2">{formData.customerPhone}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Alamat:</span>
              <span className="ml-2">{formData.customerAddress}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sales Name */}
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

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Items</label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Barang
          </Button>
        </div>

        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">Item {index + 1}</span>
                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="h-6 px-2 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Product Selection */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nama Barang *</label>
                <AutoCompleteInput<Product>
                  items={products.filter(p => p.isActive && p.stockQtyUnit > 0)}
                  value={item.productId}
                  onChange={(value, product) => handleProductSelect(index, value, product)}
                  displayKey="productName"
                  valueKey="id"
                  placeholder="Ketik nama barang..."
                  renderItem={(product) => (
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{product.productName}</span>
                        <span className="text-muted-foreground ml-2">({product.productCode})</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Stok: {product.stockQtyUnit} {product.unitName}
                      </span>
                    </div>
                  )}
                />
              </div>

              {/* Auto-filled Product Details */}
              {item.productId && (
                <div className="space-y-2">
                  {/* Special Price Badge */}
                  {item.hasSpecialPrice && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">
                        🏷️ Harga Khusus Customer
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        (Diskon {item.discountPercent.toFixed(1)}%)
                      </span>
                      <span className="text-xs text-muted-foreground line-through ml-auto">
                        {formatCurrency(item.originalPrice)}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div className="bg-muted/30 p-2 rounded">
                      <span className="text-muted-foreground block">Kode</span>
                      <span className="font-medium">{item.productCode}</span>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <span className="text-muted-foreground block">Berat/Unit</span>
                      <span className="font-medium">{item.unitWeight} {item.kgName}</span>
                    </div>
                    <div className={cn("bg-muted/30 p-2 rounded", item.hasSpecialPrice && "bg-green-50 dark:bg-green-950/30")}>
                      <span className="text-muted-foreground block">Harga/Unit</span>
                      <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
                    </div>
                    <div className={cn("bg-muted/30 p-2 rounded", item.hasSpecialPrice && "bg-green-50 dark:bg-green-950/30")}>
                      <span className="text-muted-foreground block">Harga/Kg</span>
                      <span className="font-medium">{formatCurrency(item.pricePerKg)}</span>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <span className="text-muted-foreground block">Total Berat</span>
                      <span className="font-medium">{item.qtyKg.toFixed(2)} {item.kgName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity and Discount */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Qty *</label>
                  <NumberInput
                    value={item.quantity}
                    onChange={(value) => updateItem(index, 'quantity', value)}
                    min={1}
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Diskon % {item.hasSpecialPrice && <span className="text-green-600">(Auto)</span>}
                  </label>
                  <NumberInput
                    value={item.discountPercent}
                    allowDecimal
                    onChange={(newDiscountPercent) => {
                      const newItems = [...formData.items]
                      const discountAmount = newItems[index].unitPrice * newDiscountPercent / 100
                      newItems[index] = { 
                        ...newItems[index], 
                        discountPercent: newDiscountPercent,
                        discount: newItems[index].quantity * discountAmount
                      }
                      setFormData(prev => ({ ...prev, items: newItems }))
                    }}
                    min={0}
                    max={100}
                    disabled={item.hasSpecialPrice}
                    className={item.hasSpecialPrice ? "bg-green-50 dark:bg-green-950/30" : ""}
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Diskon (Rp)</label>
                  <NumberInput
                    value={item.discount}
                    onChange={(newDiscount) => {
                      const newItems = [...formData.items]
                      const newDiscountPercent = newItems[index].unitPrice > 0 
                        ? (newDiscount / (newItems[index].quantity * newItems[index].unitPrice)) * 100 
                        : 0
                      newItems[index] = { 
                        ...newItems[index], 
                        discount: newDiscount,
                        discountPercent: newDiscountPercent
                      }
                      setFormData(prev => ({ ...prev, items: newItems }))
                    }}
                    min={0}
                    disabled={item.hasSpecialPrice}
                    className={item.hasSpecialPrice ? "bg-green-50 dark:bg-green-950/30" : ""}
                  />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Subtotal</label>
                  <div className="h-10 flex items-center font-medium bg-muted/30 rounded-md px-3">
                    {formatCurrency(item.quantity * item.unitPrice - item.discount)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {formData.items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Belum ada barang. Klik "Tambah Barang" untuk menambahkan.
            </div>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax ({taxRateSetting}%)</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <div className="flex items-center gap-2">
            <span>Diskon</span>
            <NumberInput
              className="w-16 h-8 text-right"
              value={formData.discountPercent}
              allowDecimal
              onChange={(value) => setFormData({ ...formData, discountPercent: Math.min(value, 100) })}
              min={0}
              max={100}
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <span className="text-red-600">-{formatCurrency(discountAmount)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Metode Pembayaran</label>
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
          <label className="text-sm font-medium">Jumlah Bayar</label>
          <NumberInput
            value={formData.paidAmount}
            onChange={(value) => setFormData({ ...formData, paidAmount: value })}
            min={0}
            max={total}
          />
        </div>
      </div>

      <div className="flex justify-between text-sm p-2 rounded bg-muted/30">
        <span>Sisa Pembayaran</span>
        <span className={remainingAmount > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
          {formatCurrency(remainingAmount)}
        </span>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Catatan</label>
        <textarea
          className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Catatan transaksi..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={loading || formData.items.length === 0 || !formData.customerId}>
          {loading ? 'Menyimpan...' : transaction ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}

// ============ Payment Update Form ============
interface PaymentUpdateFormData {
  amount: number
  paymentMethod: string
  notes: string
}

function PaymentUpdateForm({ transaction, paymentMethods, onSubmit, onCancel, loading }: {
  transaction: Transaction
  paymentMethods: string[]
  onSubmit: (data: PaymentUpdateFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<PaymentUpdateFormData>({
    amount: 0,
    paymentMethod: paymentMethods[0] || DEFAULT_PAYMENT_METHODS[0],
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex justify-between">
          <span>Total Amount</span>
          <span className="font-bold">{formatCurrency(transaction.grandTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid Amount</span>
          <span className="text-green-600">{formatCurrency(transaction.paidAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Remaining</span>
          <span className="text-red-600 font-bold">{formatCurrency(transaction.remainingAmount)}</span>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Additional Payment</label>
        <NumberInput
          placeholder="Enter amount"
          value={formData.amount}
          onChange={(value) => setFormData({ ...formData, amount: value })}
          min={0}
          max={transaction.remainingAmount}
          required
        />
      </div>
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
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="flex h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Enter notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Update Payment'}
        </Button>
      </div>
    </form>
  )
}

// ============ Transaction Items Table in View Dialog ============
interface TransactionItemsTableProps {
  items: TransactionItem[]
  products: Product[]
}

function TransactionItemsTable({ items, products }: TransactionItemsTableProps) {
  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-9 px-3 text-left font-medium">Kode Barang</th>
            <th className="h-9 px-3 text-left font-medium">Nama Barang</th>
            <th className="h-9 px-3 text-right font-medium">Qty Order</th>
            <th className="h-9 px-3 text-right font-medium">Qty Terkirim</th>
            <th className="h-9 px-3 text-right font-medium">Harga/Unit</th>
            <th className="h-9 px-3 text-right font-medium">Subtotal</th>
            <th className="h-9 px-3 text-center font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id || index} className="border-b hover:bg-muted/50">
              <td className="p-3 font-medium">{item.productCode}</td>
              <td className="p-3">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">{item.unitName}</p>
                </div>
              </td>
              <td className="p-3 text-right">
                <span className="font-medium">{item.qtyOrderUnit}</span>
                <span className="text-muted-foreground ml-1">{item.unitName}</span>
              </td>
              <td className="p-3 text-right">
                <span className="font-medium text-green-600">{item.qtyFulfilledUnit}</span>
                <span className="text-muted-foreground ml-1">{item.unitName}</span>
              </td>
              <td className="p-3 text-right">{formatCurrency(item.pricePerUnit)}</td>
              <td className="p-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
              <td className="p-3 text-center">
                <Badge className={FULFILLMENT_STATUS_COLORS[item.fulfillmentStatus] || 'bg-gray-100'}>
                  {FULFILLMENT_STATUS_LABELS[item.fulfillmentStatus] || item.fulfillmentStatus}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============ Transactions Page ============
export default function TransactionsPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const salesNames = useSalesNames()
  const paymentMethods = usePaymentMethods()
  const taxRateSetting = useTaxRate()
  const categories = useProductCategories()

  const [openDialog, setOpenDialog] = React.useState(false)
  const [viewDialog, setViewDialog] = React.useState(false)
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)
  const [paymentDialog, setPaymentDialog] = React.useState(false)

  // Global search state
  const [globalSearch, setGlobalSearch] = React.useState('')

  React.useEffect(() => {
    setPageTitle('Transactions')
    setBreadcrumbs([{ title: 'Transactions' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch transactions with items
  const { data: transactionsResponse, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.getTransactions({ pageSize: 100 })
      return response
    },
  })

  // Fetch customers
  const { data: customersResponse, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.getCustomers({ pageSize: 100 })
      return response
    },
  })

  // Fetch products
  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.getProducts({ pageSize: 100 })
      return response
    },
  })

  // Fetch customer prices
  const { data: customerPricesResponse, isLoading: customerPricesLoading } = useQuery({
    queryKey: ['customer-prices'],
    queryFn: async () => {
      const response = await api.getCustomerPrices({ pageSize: 500 })
      return response
    },
  })

  // Extract data from responses
  const transactions = transactionsResponse?.success ? transactionsResponse.data as Transaction[] : []
  const customers = customersResponse?.success ? customersResponse.data as Customer[] : []
  const products = productsResponse?.success ? productsResponse.data as Product[] : []
  const customerPrices = customerPricesResponse?.success ? customerPricesResponse.data as CustomerPrice[] : []

  // Flatten transactions to items for display
  const transactionItems: TransactionItemDisplay[] = React.useMemo(() => {
    const items: TransactionItemDisplay[] = []
    transactions.forEach(tx => {
      if (tx.items && tx.items.length > 0) {
        tx.items.forEach(item => {
          items.push({
            ...item,
            invoiceDate: tx.invoiceDate,
            customerCode: tx.customerCode,
            customerName: tx.customerName,
            salesName: tx.salesName,
            paymentStatus: tx.paymentStatus,
            deliveryStatus: tx.deliveryStatus,
            transactionId: tx.id,
          })
        })
      }
    })
    return items
  }, [transactions])

  // Filter items based on global search
  const filteredItems = React.useMemo(() => {
    if (!globalSearch.trim()) return transactionItems

    const search = globalSearch.toLowerCase()
    return transactionItems.filter(item => {
      return (
        item.invoiceNumber.toLowerCase().includes(search) ||
        item.productCode.toLowerCase().includes(search) ||
        item.productName.toLowerCase().includes(search) ||
        item.customerName.toLowerCase().includes(search) ||
        item.customerCode.toLowerCase().includes(search) ||
        item.salesName.toLowerCase().includes(search) ||
        item.unitName.toLowerCase().includes(search)
      )
    })
  }, [transactionItems, globalSearch])

  // Fetch single transaction with items for view dialog
  const { data: transactionDetails } = useQuery({
    queryKey: ['transaction', selectedTransaction?.id],
    queryFn: async () => {
      if (!selectedTransaction?.id) return null
      const response = await api.getTransaction(selectedTransaction.id)
      return response
    },
    enabled: !!selectedTransaction?.id && viewDialog,
  })

  const detailedTransaction = transactionDetails?.success ? transactionDetails.data as Transaction : selectedTransaction

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0)
      const taxAmount = subtotal * (taxRateSetting / 100)
      const beforeDiscount = subtotal + taxAmount
      const discountAmount = beforeDiscount * data.discountPercent / 100
      const grandTotal = beforeDiscount - discountAmount

      const response = await api.createTransaction({
        customerId: data.customerId,
        salesId: '',
        salesName: data.salesName,
        subtotal,
        taxAmount,
        discountAmount,
        grandTotal,
        notes: data.notes,
        items: data.items.map(item => ({
          productId: item.productId,
          qtyOrderUnit: item.quantity,
          pricePerUnit: item.unitPrice,
          discount: item.discount,
        })),
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setOpenDialog(false)
      setSelectedTransaction(null)
    },
  })

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PaymentUpdateFormData }) => {
      const response = await api.updateTransactionPayment(id, {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setPaymentDialog(false)
      setSelectedTransaction(null)
    },
  })

  // Columns for transaction items table
  const columns: ColumnDef<TransactionItemDisplay>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => <SortableHeader column={column} title="Invoice" />,
      cell: ({ row }) => (
        <span className="font-medium text-xs">{row.getValue('invoiceNumber')}</span>
      ),
    },
    {
      accessorKey: 'invoiceDate',
      header: ({ column }) => <SortableHeader column={column} title="Tanggal" />,
      cell: ({ row }) => (
        <span className="text-xs">{formatDateTime(row.getValue('invoiceDate'))}</span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: ({ column }) => <SortableHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-xs">{row.getValue('customerName')}</p>
          <p className="text-[10px] text-muted-foreground">{row.original.customerCode}</p>
        </div>
      ),
    },
    {
      accessorKey: 'productCode',
      header: ({ column }) => <SortableHeader column={column} title="Kode Barang" />,
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">{row.getValue('productCode')}</Badge>
      ),
    },
    {
      accessorKey: 'productName',
      header: ({ column }) => <SortableHeader column={column} title="Nama Barang" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-xs">{row.getValue('productName')}</p>
          <p className="text-[10px] text-muted-foreground">{row.original.unitName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'qtyOrderUnit',
      header: ({ column }) => <SortableHeader column={column} title="Qty" />,
      cell: ({ row }) => (
        <div className="text-xs text-right">
          <span className="font-medium">{row.getValue('qtyOrderUnit')}</span>
          <span className="text-muted-foreground ml-1">{row.original.unitName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'pricePerUnit',
      header: ({ column }) => <SortableHeader column={column} title="Harga" />,
      cell: ({ row }) => (
        <span className="text-xs">{formatCurrency(row.getValue('pricePerUnit'))}</span>
      ),
    },
    {
      accessorKey: 'subtotal',
      header: ({ column }) => <SortableHeader column={column} title="Subtotal" />,
      cell: ({ row }) => (
        <span className="text-xs font-medium">{formatCurrency(row.getValue('subtotal'))}</span>
      ),
    },
    {
      accessorKey: 'fulfillmentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('fulfillmentStatus') as string
        return (
          <Badge className={FULFILLMENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'} >
            {FULFILLMENT_STATUS_LABELS[status] || status}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const tx = transactions.find(t => t.id === item.transactionId)
              if (tx) {
                setSelectedTransaction(tx)
                setViewDialog(true)
              }
            }}
            className="h-7 px-2"
          >
            <Eye className="h-3 w-3 mr-1" /> Lihat
          </Button>
        )
      },
    },
  ]

  const handleSubmit = (data: TransactionFormData) => {
    createMutation.mutate(data)
  }

  const handlePaymentUpdate = (data: PaymentUpdateFormData) => {
    if (selectedTransaction) {
      updatePaymentMutation.mutate({ id: selectedTransaction.id, data })
    }
  }

  const isLoading = transactionsLoading || customersLoading || productsLoading || customerPricesLoading

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Kelola transaksi penjualan">
        <Button onClick={() => { setSelectedTransaction(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Transaksi Baru
        </Button>
      </PageHeader>

      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan invoice, customer, kode barang, nama barang, sales..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        {globalSearch && (
          <button
            onClick={() => setGlobalSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Info */}
      {globalSearch && (
        <div className="text-sm text-muted-foreground">
          Menampilkan {filteredItems.length} dari {transactionItems.length} item untuk "{globalSearch}"
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        searchKey={undefined}
        enableColumnVisibility={true}
        enablePagination={true}
        emptyMessage={globalSearch ? "Tidak ada data yang cocok dengan pencarian" : "Belum ada transaksi"}
      />

      {/* Transaction Form Dialog */}
      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedTransaction ? 'Edit Transaksi' : 'Transaksi Baru'}
        maxWidth="2xl"
      >
        <TransactionForm
          transaction={selectedTransaction || undefined}
          customers={customers || []}
          products={products || []}
          customerPrices={customerPrices || []}
          salesNames={salesNames}
          paymentMethods={paymentMethods}
          taxRateSetting={taxRateSetting}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending}
        />
      </ModalForm>

      {/* View Transaction Dialog */}
      <ModalForm
        open={viewDialog}
        onOpenChange={setViewDialog}
        title="Detail Transaksi"
        maxWidth="lg"
      >
        {detailedTransaction && (
          <div className="space-y-4">
            {/* Transaction Header */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Invoice</p>
                <p className="font-medium">{detailedTransaction.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tanggal</p>
                <p className="font-medium">{formatDateTime(detailedTransaction.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium">{detailedTransaction.customerName}</p>
                <p className="text-xs text-muted-foreground">{detailedTransaction.customerCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sales</p>
                <p className="font-medium">{detailedTransaction.salesName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status Pembayaran</p>
                <Badge className={PAYMENT_STATUS_COLORS[detailedTransaction.paymentStatus]}>
                  {PAYMENT_STATUS_LABELS[detailedTransaction.paymentStatus]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status Pengiriman</p>
                <Badge className={DELIVERY_STATUS_COLORS[detailedTransaction.deliveryStatus] || 'bg-gray-100'}>
                  {DELIVERY_STATUS_LABELS[detailedTransaction.deliveryStatus] || detailedTransaction.deliveryStatus}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Items Table */}
            <div>
              <h4 className="font-medium mb-3">Item Transaksi</h4>
              <TransactionItemsTable
                items={detailedTransaction.items || []}
                products={products}
              />
            </div>

            <Separator />

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(detailedTransaction.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>PPN</span>
                <span>{formatCurrency(detailedTransaction.taxAmount)}</span>
              </div>
              {detailedTransaction.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon</span>
                  <span>-{formatCurrency(detailedTransaction.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(detailedTransaction.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Dibayar</span>
                <span className="text-green-600">{formatCurrency(detailedTransaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sisa</span>
                <span className={detailedTransaction.remainingAmount > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  {formatCurrency(detailedTransaction.remainingAmount)}
                </span>
              </div>
            </div>

            {detailedTransaction.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Catatan</p>
                <p className="text-sm">{detailedTransaction.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setViewDialog(false)}>Tutup</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setViewDialog(false)
                  setPaymentDialog(true)
                }}
              >
                <CreditCard className="h-4 w-4 mr-1" /> Update Pembayaran
              </Button>
              <Button onClick={() => {
                setViewDialog(false)
                setOpenDialog(true)
              }}>
                Edit Transaksi
              </Button>
            </div>
          </div>
        )}
      </ModalForm>

      {/* Payment Update Dialog */}
      <ModalForm
        open={paymentDialog}
        onOpenChange={setPaymentDialog}
        title="Update Pembayaran"
        maxWidth="sm"
      >
        {selectedTransaction && (
          <PaymentUpdateForm
            transaction={selectedTransaction}
            paymentMethods={paymentMethods}
            onSubmit={handlePaymentUpdate}
            onCancel={() => setPaymentDialog(false)}
            loading={updatePaymentMutation.isPending}
          />
        )}
      </ModalForm>
    </div>
  )
}
