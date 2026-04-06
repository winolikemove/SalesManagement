'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen, StatsCard } from '@/components/shared'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { NumberInput } from '@/components/ui/number-input'
import { TARGET_TYPE_LABELS, TARGET_PERIOD_LABELS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import type { Target } from '@/types'

// ============ Mock Data ============
const mockTargets: Target[] = [
  { id: '1', name: 'Monthly Revenue Q1', type: 'revenue', period: 'monthly', year: 2024, month: 1, targetAmount: 500000000, achievedAmount: 423500000, achievementPercent: 84.7, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', name: 'Weekly Sales Week 1', type: 'quantity', period: 'weekly', year: 2024, month: 1, week: 1, targetAmount: 100, achievedAmount: 87, achievementPercent: 87, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '3', name: 'New Customers January', type: 'customer', period: 'monthly', year: 2024, month: 1, targetAmount: 20, achievedAmount: 15, achievementPercent: 75, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '4', name: 'Yearly Revenue 2024', type: 'revenue', period: 'yearly', year: 2024, targetAmount: 6000000000, achievedAmount: 485000000, achievementPercent: 8.1, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
]

// ============ Target Form Component ============
interface TargetFormData {
  name: string
  type: string
  period: string
  year: number
  month?: number
  week?: number
  targetAmount: number
  salesName?: string
  productId?: string
  customerId?: string
  isActive: boolean
}

function TargetForm({ target, onSubmit, onCancel, loading }: {
  target?: Target
  onSubmit: (data: TargetFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<TargetFormData>({
    name: target?.name || '',
    type: target?.type || 'revenue',
    period: target?.period || 'monthly',
    year: target?.year || new Date().getFullYear(),
    month: target?.month,
    week: target?.week,
    targetAmount: target?.targetAmount || 0,
    isActive: target?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Type *</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Period *</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
          >
            {Object.entries(TARGET_PERIOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Year *</label>
          <NumberInput
            value={formData.year}
            onChange={(value) => setFormData({ ...formData, year: value })}
            placeholder="2024"
            required
          />
        </div>
        {(formData.period === 'monthly' || formData.period === 'weekly') && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Month</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.month || ''}
              onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) || undefined })}
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
        )}
        {formData.period === 'weekly' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Week</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.week || ''}
              onChange={(e) => setFormData({ ...formData, week: Number(e.target.value) || undefined })}
            >
              <option value="">Select Week</option>
              {Array.from({ length: 52 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Target Amount {formData.type === 'revenue' ? '(Rp)' : '(Units)'} *
        </label>
        <NumberInput
          value={formData.targetAmount}
          onChange={(value) => setFormData({ ...formData, targetAmount: value })}
          placeholder="Enter target amount"
          required
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
          {loading ? 'Saving...' : target ? 'Update' : 'Create'}
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
  const [selectedTarget, setSelectedTarget] = React.useState<Target | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Targets')
    setBreadcrumbs([{ title: 'Targets' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch targets
  const { data: targets, isLoading } = useQuery({
    queryKey: ['targets'],
    queryFn: async () => mockTargets,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: TargetFormData) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] })
      setOpenDialog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TargetFormData> }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] })
      setOpenDialog(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] })
      setDeleteDialog(false)
    },
  })

  // Summary stats
  const totalTarget = targets?.reduce((sum, t) => sum + t.targetAmount, 0) || 0
  const totalAchieved = targets?.reduce((sum, t) => sum + t.achievedAmount, 0) || 0
  const overallPercent = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0

  // Columns
  const columns: ColumnDef<Target>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.getValue('name')}</p>
          <p className="text-xs text-muted-foreground">
            {TARGET_TYPE_LABELS[row.original.type]}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'period',
      header: 'Period',
      cell: ({ row }) => {
        const period = row.getValue('period') as string
        const target = row.original
        let periodText = TARGET_PERIOD_LABELS[period]
        if (target.month) {
          periodText += ` ${new Date(2024, target.month - 1).toLocaleString('default', { month: 'short' })}`
        }
        if (target.week) {
          periodText += ` W${target.week}`
        }
        periodText += ` ${target.year}`
        return <span>{periodText}</span>
      },
    },
    {
      accessorKey: 'targetAmount',
      header: 'Target',
      cell: ({ row }) => {
        const amount = row.getValue('targetAmount') as number
        const type = row.original.type
        return type === 'revenue' ? formatCurrency(amount) : amount.toLocaleString()
      },
    },
    {
      accessorKey: 'achievedAmount',
      header: 'Achieved',
      cell: ({ row }) => {
        const amount = row.getValue('achievedAmount') as number
        const type = row.original.type
        return type === 'revenue' ? formatCurrency(amount) : amount.toLocaleString()
      },
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
              {percent.toFixed(0)}%
            </span>
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
        const target = row.original
        return (
          <RowActions
            row={target}
            actions={[
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => {
                  setSelectedTarget(target)
                  setOpenDialog(true)
                },
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                onClick: () => {
                  setSelectedTarget(target)
                  setDeleteDialog(true)
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: TargetFormData) => {
    if (selectedTarget) {
      updateMutation.mutate({ id: selectedTarget.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Targets" description="Set and track sales targets">
        <Button onClick={() => { setSelectedTarget(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Target
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTarget)}</div>
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
        data={targets || []}
        searchKey="name"
        searchPlaceholder="Search targets..."
      />

      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedTarget ? 'Edit Target' : 'Add Target'}
        maxWidth="lg"
      >
        <TargetForm
          target={selectedTarget || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </ModalForm>

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Target"
        description={`Are you sure you want to delete "${selectedTarget?.name}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedTarget && deleteMutation.mutate(selectedTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
