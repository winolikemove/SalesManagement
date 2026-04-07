'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Target as TargetIcon, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, SortableHeader } from '@/components/shared/data-table'
import { PageHeader, ModalForm, LoadingScreen } from '@/components/shared'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { NumberInput } from '@/components/ui/number-input'
import { TARGET_TYPE_LABELS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import { api } from '@/lib/api'
import type { Target } from '@/types'

// ============ Target Form Component ============
interface TargetFormData {
  year: number
  month: number
  targetType: 'COMPANY' | 'SALES'
  targetEntityId: string
  targetEntityName: string
  targetAmount: number
  targetQtyUnit: number
  targetQtyKg: number
  targetCustomerCount: number
  notes: string
}

function TargetForm({ onSubmit, onCancel, loading, salesUsers }: {
  onSubmit: (data: TargetFormData) => void
  onCancel: () => void
  loading?: boolean
  salesUsers: Array<{ id: string; fullName: string }>
}) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [formData, setFormData] = React.useState<TargetFormData>({
    year: currentYear,
    month: currentMonth,
    targetType: 'COMPANY',
    targetEntityId: '',
    targetEntityName: '',
    targetAmount: 0,
    targetQtyUnit: 0,
    targetQtyKg: 0,
    targetCustomerCount: 0,
    notes: '',
  })

  const handleTargetTypeChange = (value: 'COMPANY' | 'SALES') => {
    if (value === 'COMPANY') {
      setFormData({
        ...formData,
        targetType: value,
        targetEntityId: '',
        targetEntityName: '',
      })
    } else {
      setFormData({
        ...formData,
        targetType: value,
      })
    }
  }

  const handleSalesChange = (salesId: string) => {
    const sales = salesUsers.find(s => s.id === salesId)
    setFormData({
      ...formData,
      targetEntityId: salesId,
      targetEntityName: sales?.fullName || '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.targetType === 'SALES' && !formData.targetEntityId) {
      alert('Please select a sales person')
      return
    }
    
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Year *</label>
          <NumberInput
            value={formData.year}
            onChange={(value) => setFormData({ ...formData, year: value })}
            placeholder="2024"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Month *</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
            required
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Target Type *</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.targetType}
          onChange={(e) => handleTargetTypeChange(e.target.value as 'COMPANY' | 'SALES')}
        >
          <option value="COMPANY">{TARGET_TYPE_LABELS.COMPANY}</option>
          <option value="SALES">{TARGET_TYPE_LABELS.SALES}</option>
        </select>
      </div>

      {formData.targetType === 'SALES' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Sales Person *</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.targetEntityId}
            onChange={(e) => handleSalesChange(e.target.value)}
            required
          >
            <option value="">Select Sales Person</option>
            {salesUsers.map((sales) => (
              <option key={sales.id} value={sales.id}>
                {sales.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Target Amount (Rp) *</label>
        <NumberInput
          value={formData.targetAmount}
          onChange={(value) => setFormData({ ...formData, targetAmount: value })}
          placeholder="Enter target amount"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Qty (Units)</label>
          <NumberInput
            value={formData.targetQtyUnit}
            onChange={(value) => setFormData({ ...formData, targetQtyUnit: value })}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Qty (Kg)</label>
          <NumberInput
            value={formData.targetQtyKg}
            onChange={(value) => setFormData({ ...formData, targetQtyKg: value })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Target Customer Count</label>
        <NumberInput
          value={formData.targetCustomerCount}
          onChange={(value) => setFormData({ ...formData, targetCustomerCount: value })}
          placeholder="0"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Target'}
        </Button>
      </div>
    </form>
  )
}

// ============ Targets Page ============
export default function TargetsPage() {
  const queryClient = useQueryClient()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [openDialog, setOpenDialog] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Targets')
    setBreadcrumbs([{ title: 'Targets' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch targets from API
  const { data: targetsResponse, isLoading: isLoadingTargets } = useQuery({
    queryKey: ['targets'],
    queryFn: () => api.getTargets(),
  })

  // Fetch sales users for the dropdown
  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'sales'],
    queryFn: () => api.getUsers({ role: 'Sales', isActive: true, pageSize: 100 }),
  })

  const targets = (targetsResponse?.data as Target[] | undefined) || []
  const salesUsers = ((usersResponse?.data as Array<{ id: string; fullName: string }> | undefined) || []).map((u) => ({
    id: u.id,
    fullName: u.fullName,
  }))

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TargetFormData) => api.createTarget(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] })
      setOpenDialog(false)
    },
  })

  // Summary stats - calculate from actual targets
  const totalTarget = targets.reduce((sum: number, t: Target) => sum + t.targetAmount, 0)
  const totalAchieved = targets.reduce((sum: number, t: Target) => sum + t.achievedAmount, 0)
  const overallPercent = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0

  // Columns
  const columns: ColumnDef<Target>[] = [
    {
      accessorKey: 'targetType',
      header: ({ column }) => <SortableHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue('targetType') as string
        return (
          <div>
            <p className="font-medium">{TARGET_TYPE_LABELS[type] || type}</p>
            {row.original.targetType === 'SALES' && (
              <p className="text-xs text-muted-foreground">{row.original.targetEntityName}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'year',
      header: 'Period',
      cell: ({ row }) => {
        const target = row.original
        const monthName = new Date(target.year, target.month - 1).toLocaleString('default', { month: 'long' })
        return <span>{monthName} {target.year}</span>
      },
    },
    {
      accessorKey: 'targetAmount',
      header: 'Target Amount',
      cell: ({ row }) => formatCurrency(row.getValue('targetAmount')),
    },
    {
      accessorKey: 'achievedAmount',
      header: 'Achieved',
      cell: ({ row }) => formatCurrency(row.getValue('achievedAmount')),
    },
    {
      accessorKey: 'achievementPercent',
      header: 'Progress',
      cell: ({ row }) => {
        const percent = row.getValue('achievementPercent') as number
        const isAchieved = percent >= 100
        return (
          <div className="flex items-center gap-2 w-32">
            <Progress value={Math.min(percent, 100)} className="h-2 flex-1" />
            <span className={`text-xs font-medium ${isAchieved ? 'text-green-600' : percent >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
              {percent.toFixed(1)}%
            </span>
          </div>
        )
      },
    },
    {
      id: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const target = row.original
        const hasDetails = target.targetQtyUnit > 0 || target.targetQtyKg > 0 || target.targetCustomerCount > 0
        
        if (!hasDetails) return <span className="text-muted-foreground">-</span>
        
        return (
          <div className="text-xs text-muted-foreground space-y-0.5">
            {target.targetQtyUnit > 0 && (
              <div>Units: {target.achievedQtyUnit} / {target.targetQtyUnit}</div>
            )}
            {target.targetQtyKg > 0 && (
              <div>Kg: {target.achievedQtyKg} / {target.targetQtyKg}</div>
            )}
            {target.targetCustomerCount > 0 && (
              <div>Customers: {target.achievedCustomerCount} / {target.targetCustomerCount}</div>
            )}
          </div>
        )
      },
    },
  ]

  const handleSubmit = (data: TargetFormData) => {
    createMutation.mutate(data)
  }

  if (isLoadingTargets) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Targets" description="Set and track sales targets">
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Target
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TargetIcon className="h-4 w-4" />
              Total Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTarget)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {targets.length} target{targets.length !== 1 ? 's' : ''} set
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Achieved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAchieved)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(overallPercent)} of target
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(overallPercent)}</div>
            <Progress value={Math.min(overallPercent, 100)} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={targets}
        searchKey="targetEntityName"
        searchPlaceholder="Search targets..."
      />

      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title="Add Target"
        maxWidth="lg"
      >
        <TargetForm
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending}
          salesUsers={salesUsers}
        />
      </ModalForm>
    </div>
  )
}
