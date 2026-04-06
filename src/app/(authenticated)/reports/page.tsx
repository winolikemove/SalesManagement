'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Calendar, TrendingUp, Users, Package, DollarSign, TrendingDown } from 'lucide-react'
import { PageHeader, LoadingScreen } from '@/components/shared'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { usePageHeader } from '@/stores/app-store'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, PieChart, Cell, Legend } from 'recharts'
import { api } from '@/lib/api'
import type { DashboardStats } from '@/types'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--chart-1))',
  },
  invoices: {
    label: 'Invoices',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

// ============ Reports Page ============
export default function ReportsPage() {
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [period, setPeriod] = React.useState('daily')

  React.useEffect(() => {
    setPageTitle('Reports')
    setBreadcrumbs([{ title: 'Reports' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch dashboard stats from API
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.getDashboardStats()
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch dashboard stats')
      }
      return response.data as DashboardStats
    },
  })

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Reports</CardTitle>
            <CardDescription>
              Unable to load report data. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare chart data from monthlyTrend
  const monthlyChartData = dashboardData.monthlyTrend?.map(item => ({
    month: item.monthName,
    sales: item.totalAmount,
    invoices: item.totalInvoices,
  })) || []

  // Prepare pie chart data for top products
  const topProductsChartData = dashboardData.topProducts?.slice(0, 5).map((product, index) => ({
    name: product.productName,
    value: product.totalAmount,
    fill: COLORS[index % COLORS.length],
  })) || []

  // Calculate weekly average from monthly data (approximation)
  const weeklyAverage = dashboardData.monthSales ? dashboardData.monthSales / 4 : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Sales and performance reports">
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="daily" value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.todaySales)}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.todayTransactions} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.dailySummary?.totalInvoices || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.dailySummary?.totalCustomers || 0} customers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.pendingPayments}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.pendingDeliveries}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting delivery
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products Today</CardTitle>
                <CardDescription>Best selling products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.topProducts && dashboardData.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.topProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-sm text-muted-foreground">{product.totalQty} sold</p>
                          </div>
                        </div>
                        <div className="font-medium">{formatCurrency(product.totalAmount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No product data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Customers with highest purchases</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.topCustomers && dashboardData.topCustomers.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.topCustomers.slice(0, 5).map((customer, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{customer.customerName}</p>
                            <p className="text-sm text-muted-foreground">{customer.invoiceCount} invoices</p>
                          </div>
                        </div>
                        <div className="font-medium">{formatCurrency(customer.totalAmount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No customer data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.monthSales)}</div>
                {dashboardData.monthlyComparison && (
                  <div className={`flex items-center text-xs ${dashboardData.monthlyComparison.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData.monthlyComparison.percentChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(dashboardData.monthlyComparison.percentChange).toFixed(1)}% vs last month
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.monthlySummary?.totalInvoices || 0}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboardData.monthlySummary?.paidAmount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Collected</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(dashboardData.monthlySummary?.pendingAmount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </CardContent>
            </Card>
          </div>

          {dashboardData.targetAchievement && (
            <Card>
              <CardHeader>
                <CardTitle>Target Achievement</CardTitle>
                <CardDescription>Monthly sales target progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{dashboardData.targetAchievement.achievementPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(dashboardData.targetAchievement.achievementPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Achieved: {formatCurrency(dashboardData.targetAchievement.achievedAmount)}</span>
                    <span>Target: {formatCurrency(dashboardData.targetAchievement.targetAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products This Month</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.topProducts && dashboardData.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">{product.totalQty} units sold</p>
                        </div>
                        <div className="font-medium">{formatCurrency(product.totalAmount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No product data available</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Customers This Month</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.topCustomers && dashboardData.topCustomers.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.topCustomers.map((customer, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{customer.customerName}</p>
                            <p className="text-sm text-muted-foreground">{customer.invoiceCount} invoices</p>
                          </div>
                        </div>
                        <div className="font-medium">{formatCurrency(customer.totalAmount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No customer data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Yearly Report */}
        <TabsContent value="yearly" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Yearly Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.yearSales)}</div>
                <p className="text-xs text-muted-foreground">Total this year</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.activeCustomers}</div>
                <p className="text-xs text-muted-foreground">Active accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{dashboardData.lowStockProducts}</div>
                <p className="text-xs text-muted-foreground">Need restocking</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.yearSales / 12)}
                </div>
                <p className="text-xs text-muted-foreground">Average per month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales Trend</CardTitle>
              <CardDescription>Sales performance throughout the year</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
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
              ) : (
                <p className="text-muted-foreground text-center py-8">No trend data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Product</CardTitle>
                <CardDescription>Distribution of sales across products</CardDescription>
              </CardHeader>
              <CardContent>
                {topProductsChartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={topProductsChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topProductsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No product data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Volume by Month</CardTitle>
                <CardDescription>Number of invoices per month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyChartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="invoices" fill="var(--color-invoices)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No invoice data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest sales activity</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {dashboardData.recentTransactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">{transaction.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(transaction.grandTotal)}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            transaction.paymentStatus === 'PAID' ? 'default' :
                            transaction.paymentStatus === 'PARTIAL' ? 'secondary' : 'destructive'
                          }>
                            {transaction.paymentStatus}
                          </Badge>
                          <Badge variant={
                            transaction.deliveryStatus === 'DELIVERED' ? 'default' :
                            transaction.deliveryStatus === 'PARTIAL' ? 'secondary' : 'outline'
                          }>
                            {transaction.deliveryStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent transactions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
