'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Calendar, TrendingUp, Users, Package, DollarSign } from 'lucide-react'
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

// ============ Mock Data ============
const mockDailyReport = {
  date: '2024-01-07',
  totalSales: 64300000,
  totalTransactions: 24,
  totalItems: 87,
  newCustomers: 3,
  completedDeliveries: 8,
  topProducts: [
    { name: 'Laptop Dell XPS 15', quantity: 5, total: 92500000 },
    { name: 'Office Chair Premium', quantity: 12, total: 42000000 },
    { name: 'Printer Paper A4', quantity: 100, total: 6500000 },
  ],
}

const mockWeeklyReport = {
  week: 1,
  year: 2024,
  totalSales: 371000000,
  totalTransactions: 156,
  dailyAverage: 53000000,
  topProducts: [
    { name: 'Laptop Dell XPS 15', quantity: 25, total: 462500000 },
    { name: 'Office Chair Premium', quantity: 45, total: 157500000 },
    { name: 'Monitor Samsung 27"', quantity: 18, total: 57600000 },
  ],
  salesByDay: [
    { day: 'Mon', sales: 45000000 },
    { day: 'Tue', sales: 52000000 },
    { day: 'Wed', sales: 38000000 },
    { day: 'Thu', sales: 61000000 },
    { day: 'Fri', sales: 72000000 },
    { day: 'Sat', sales: 55000000 },
    { day: 'Sun', sales: 48000000 },
  ],
}

const mockMonthlyReport = {
  month: 'January',
  year: 2024,
  totalSales: 423500000,
  totalTransactions: 624,
  newCustomers: 15,
  topProducts: [
    { name: 'Laptop Dell XPS 15', quantity: 89, total: 1646500000 },
    { name: 'Office Chair Premium', quantity: 156, total: 546000000 },
    { name: 'Monitor Samsung 27"', quantity: 67, total: 214400000 },
  ],
  topCustomers: [
    { name: 'PT ABC Corporation', total: 125000000 },
    { name: 'CV XYZ Trading', total: 87500000 },
    { name: 'UD DEF Store', total: 62500000 },
  ],
}

const mockYearlyReport = {
  year: 2024,
  totalSales: 4850000000,
  totalTransactions: 7488,
  monthlyData: [
    { month: 'Jan', sales: 423500000 },
    { month: 'Feb', sales: 387000000 },
    { month: 'Mar', sales: 456000000 },
    { month: 'Apr', sales: 412000000 },
    { month: 'May', sales: 498000000 },
    { month: 'Jun', sales: 445000000 },
    { month: 'Jul', sales: 521000000 },
    { month: 'Aug', sales: 489000000 },
    { month: 'Sep', sales: 467000000 },
    { month: 'Oct', sales: 512000000 },
    { month: 'Nov', sales: 578000000 },
    { month: 'Dec', sales: 162000000 },
  ],
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

// ============ Reports Page ============
export default function ReportsPage() {
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [period, setPeriod] = React.useState('daily')
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])

  React.useEffect(() => {
    setPageTitle('Reports')
    setBreadcrumbs([{ title: 'Reports' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch reports
  const { data: dailyReport, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-report', selectedDate],
    queryFn: async () => mockDailyReport,
  })

  const { data: weeklyReport, isLoading: weeklyLoading } = useQuery({
    queryKey: ['weekly-report'],
    queryFn: async () => mockWeeklyReport,
  })

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-report'],
    queryFn: async () => mockMonthlyReport,
  })

  const { data: yearlyReport, isLoading: yearlyLoading } = useQuery({
    queryKey: ['yearly-report'],
    queryFn: async () => mockYearlyReport,
  })

  const isLoading = dailyLoading || weeklyLoading || monthlyLoading || yearlyLoading

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Sales and performance reports">
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="daily" value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dailyReport?.totalSales || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyReport?.totalTransactions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyReport?.totalItems || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyReport?.completedDeliveries || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Products Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyReport?.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                      </div>
                    </div>
                    <div className="font-medium">{formatCurrency(product.total)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Report */}
        <TabsContent value="weekly" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(weeklyReport?.totalSales || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyReport?.totalTransactions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(weeklyReport?.dailyAverage || 0)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales by Day</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={weeklyReport?.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyReport?.totalSales || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyReport?.totalTransactions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyReport?.newCustomers || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyReport?.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                      </div>
                      <div className="font-medium">{formatCurrency(product.total)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyReport?.topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <p className="font-medium">{customer.name}</p>
                      </div>
                      <div className="font-medium">{formatCurrency(customer.total)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Yearly Report */}
        <TabsContent value="yearly" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(yearlyReport?.totalSales || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{yearlyReport?.totalTransactions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency((yearlyReport?.totalSales || 0) / 12)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={yearlyReport?.monthlyData}>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
