'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Truck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { usePageHeader } from '@/stores/app-store'
import type { DashboardStats } from '@/types'

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
  const router = useRouter()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()

  React.useEffect(() => {
    setPageTitle('Dashboard')
    setBreadcrumbs([])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch dashboard data from API
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.getDashboardStats()
      return response.data as DashboardStats
    },
    refetchInterval: 30000,
  })

  if (isLoading) {
    return <LoadingScreen message="Loading dashboard..." />
  }

  // Extract data from API response
  const dailySummary = dashboardData?.dailySummary || { totalInvoices: 0, totalCustomers: 0, totalAmount: 0 }
  const monthlySummary = dashboardData?.monthlySummary || { totalInvoices: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 }
  const monthlyComparison = dashboardData?.monthlyComparison || { currentMonth: 0, previousMonth: 0, percentChange: 0 }
  const targetAchievement = dashboardData?.targetAchievement || { targetAmount: 0, achievedAmount: 0, achievementPercent: 0 }
  const monthlyTrend = dashboardData?.monthlyTrend || []
  const recentTransactions = dashboardData?.recentTransactions || []
  const topProducts = dashboardData?.topProducts || []
  const topCustomers = dashboardData?.topCustomers || []

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Sales"
          value={formatCurrency(dailySummary.totalAmount)}
          icon={<DollarSign className="h-4 w-4" />}
          description={`${dailySummary.totalInvoices} transactions`}
        />
        <StatsCard
          title="Monthly Sales"
          value={formatCurrency(monthlySummary.totalAmount)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ 
            value: monthlyComparison.percentChange, 
            label: monthlyComparison.percentChange >= 0 ? 'vs last month' : 'vs last month'
          }}
        />
        <StatsCard
          title="Target Achievement"
          value={`${targetAchievement.achievementPercent.toFixed(1)}%`}
          icon={<ShoppingCart className="h-4 w-4" />}
          description={`of ${formatCurrency(targetAchievement.targetAmount)}`}
        />
        <StatsCard
          title="Active Customers"
          value={dailySummary.totalCustomers}
          icon={<Users className="h-4 w-4" />}
          description="Today"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(monthlySummary.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Outstanding this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(monthlySummary.paidAmount)}</div>
            <p className="text-xs text-muted-foreground">Collected this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{monthlySummary.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Monthly sales performance</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {monthlyTrend.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="monthName"
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    className="text-xs"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="var(--color-sales)"
                    fill="var(--color-sales)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling products this month</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/reports')}
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-[250px]">
              {topProducts.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {topProducts.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        index === 0 && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                        index === 1 && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                        index === 2 && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                        index > 2 && 'bg-muted text-muted-foreground',
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.totalQty} units sold
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium">{formatCurrency(item.totalAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Top Customers */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest sales activity</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/transactions')}
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-[300px]">
              {recentTransactions.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {recentTransactions.slice(0, 5).map((tx: any) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/transactions?id=${tx.id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{tx.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {tx.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.invoiceDate, 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-medium">{formatCurrency(tx.grandTotal)}</p>
                        <Badge variant={
                          tx.paymentStatus === 'PAID' ? 'default' :
                          tx.paymentStatus === 'PARTIAL' ? 'secondary' : 'outline'
                        } className="mt-1">
                          {tx.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                  No transactions yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Highest spending customers</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/reports')}
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-[300px]">
              {topCustomers.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {topCustomers.slice(0, 10).map((item: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push('/master/customers')}
                    >
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        index === 0 && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                        index === 1 && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                        index === 2 && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                        index > 2 && 'bg-muted text-muted-foreground',
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.invoiceCount} transactions
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium">{formatCurrency(item.totalAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                  No customer data yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
