'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Truck,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard, LoadingScreen } from '@/components/shared'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { usePageHeader } from '@/stores/app-store'
import type { DashboardStats, SalesTrend, TopProduct, TopCustomer, Transaction } from '@/types'

// ============ Mock Data for Demo ============
const mockStats: DashboardStats = {
  todaySales: 15750000,
  monthSales: 423500000,
  yearSales: 4850000000,
  todayTransactions: 24,
  pendingPayments: 12500000,
  pendingDeliveries: 8,
  lowStockProducts: 5,
  activeCustomers: 156,
}

const mockSalesTrend: SalesTrend[] = [
  { date: '2024-01-01', sales: 45000000, transactions: 15 },
  { date: '2024-01-02', sales: 52000000, transactions: 18 },
  { date: '2024-01-03', sales: 38000000, transactions: 12 },
  { date: '2024-01-04', sales: 61000000, transactions: 22 },
  { date: '2024-01-05', sales: 48000000, transactions: 16 },
  { date: '2024-01-06', sales: 72000000, transactions: 25 },
  { date: '2024-01-07', sales: 55000000, transactions: 19 },
]

const mockTopProducts: TopProduct[] = [
  { product: { id: '1', code: 'PRD001', name: 'Product A', category: 'Electronics', unit: 'pcs', basePrice: 100000, sellingPrice: 150000, stock: 50, minStock: 10, isActive: true, createdAt: '', updatedAt: '' }, quantity: 245, total: 36750000 },
  { product: { id: '2', code: 'PRD002', name: 'Product B', category: 'Furniture', unit: 'set', basePrice: 500000, sellingPrice: 750000, stock: 20, minStock: 5, isActive: true, createdAt: '', updatedAt: '' }, quantity: 89, total: 66750000 },
  { product: { id: '3', code: 'PRD003', name: 'Product C', category: 'Clothing', unit: 'pcs', basePrice: 50000, sellingPrice: 85000, stock: 100, minStock: 20, isActive: true, createdAt: '', updatedAt: '' }, quantity: 156, total: 13260000 },
]

const mockTopCustomers: TopCustomer[] = [
  { customer: { id: '1', code: 'CUST001', name: 'PT ABC', phone: '0211234567', isActive: true, createdAt: '', updatedAt: '' }, transactions: 45, total: 125000000 },
  { customer: { id: '2', code: 'CUST002', name: 'CV XYZ', phone: '0217654321', isActive: true, createdAt: '', updatedAt: '' }, transactions: 32, total: 87500000 },
  { customer: { id: '3', code: 'CUST003', name: 'UD DEF', phone: '0215551234', isActive: true, createdAt: '', updatedAt: '' }, transactions: 28, total: 62500000 },
]

const mockRecentTransactions: Transaction[] = [
  { id: '1', invoiceNumber: 'INV-2024-0001', customerId: '1', items: [], subtotal: 15000000, taxAmount: 1500000, discount: 0, total: 16500000, paidAmount: 16500000, remainingAmount: 0, paymentStatus: 'paid', status: 'completed', createdAt: '2024-01-07T10:30:00', updatedAt: '' },
  { id: '2', invoiceNumber: 'INV-2024-0002', customerId: '2', items: [], subtotal: 22500000, taxAmount: 2250000, discount: 500000, total: 24250000, paidAmount: 10000000, remainingAmount: 14250000, paymentStatus: 'partial', status: 'confirmed', createdAt: '2024-01-07T09:15:00', updatedAt: '' },
  { id: '3', invoiceNumber: 'INV-2024-0003', customerId: '3', items: [], subtotal: 8500000, taxAmount: 850000, discount: 0, total: 9350000, paidAmount: 0, remainingAmount: 9350000, paymentStatus: 'pending', status: 'confirmed', createdAt: '2024-01-07T08:45:00', updatedAt: '' },
]

// ============ Chart Config ============
const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--chart-1))',
  },
  transactions: {
    label: 'Transactions',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

// ============ Dashboard Page ============
export default function DashboardPage() {
  const { setPageTitle, setBreadcrumbs } = usePageHeader()

  React.useEffect(() => {
    setPageTitle('Dashboard')
    setBreadcrumbs([])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch dashboard data (using mock for demo)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // In production, use: const response = await api.getDashboardStats()
      // return response.data
      return mockStats
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: salesTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['sales-trend'],
    queryFn: async () => {
      return mockSalesTrend
    },
  })

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      return mockTopProducts
    },
  })

  const { data: topCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ['top-customers'],
    queryFn: async () => {
      return mockTopCustomers
    },
  })

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      return mockRecentTransactions
    },
  })

  if (statsLoading) {
    return <LoadingScreen message="Loading dashboard..." />
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Sales"
          value={formatCurrency(stats?.todaySales || 0)}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{ value: 12.5, label: 'vs yesterday' }}
        />
        <StatsCard
          title="Monthly Sales"
          value={formatCurrency(stats?.monthSales || 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: 8.2, label: 'vs last month' }}
        />
        <StatsCard
          title="Today's Transactions"
          value={stats?.todayTransactions || 0}
          icon={<ShoppingCart className="h-4 w-4" />}
          description="Completed orders"
        />
        <StatsCard
          title="Active Customers"
          value={stats?.activeCustomers || 0}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 5.3, label: 'new this month' }}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats?.pendingPayments || 0)}</div>
            <p className="text-xs text-muted-foreground">From 12 transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats?.pendingDeliveries || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting dispatch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Products</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats?.lowStockProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Sales Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Daily sales for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value, 'dd MMM')}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `${value / 1000000}M`}
                    className="text-xs"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-sales)"
                    fill="var(--color-sales)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {topProducts?.map((item, index) => (
                    <div key={item.product.id} className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                        index === 0 && 'bg-yellow-100 text-yellow-700',
                        index === 1 && 'bg-gray-100 text-gray-700',
                        index === 2 && 'bg-orange-100 text-orange-700',
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} sold
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Top Customers */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest sales activity</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-4">
                  {recentTransactions?.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{tx.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(tx.createdAt, 'dd MMM yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(tx.total)}</p>
                        <Badge variant={
                          tx.paymentStatus === 'paid' ? 'default' :
                          tx.paymentStatus === 'partial' ? 'secondary' : 'outline'
                        }>
                          {tx.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Highest spending customers</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-4">
                  {topCustomers?.map((item, index) => (
                    <div key={item.customer.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold',
                        index === 0 && 'bg-yellow-100 text-yellow-700',
                        index === 1 && 'bg-gray-100 text-gray-700',
                        index === 2 && 'bg-orange-100 text-orange-700',
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.transactions} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
