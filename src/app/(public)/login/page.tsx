'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Eye, EyeOff, Loader2, Info, TestTube } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useAppStore } from '@/stores/app-store'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { APP_DEFAULTS } from '@/lib/constants'
import { api } from '@/lib/api'

type PublicConfig = {
  APP_NAME?: string
  COMPANY_NAME?: string
  LOGO_URL?: string
  BANNER_URL?: string
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading, error, setError, isAuthenticated, isInitialized } = useAuthStore()
  const { isMockMode, toggleMockMode } = useAppStore()

  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [rememberMe, setRememberMe] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [publicConfig, setPublicConfig] = React.useState<PublicConfig | null>(null)
  const [configLoaded, setConfigLoaded] = React.useState(false)

  // Get app name and logo from public config or fallback to APP_DEFAULTS
  const appName = publicConfig?.APP_NAME || APP_DEFAULTS.APP_NAME
  const appInitial = appName.charAt(0).toUpperCase()
  const logoUrl = publicConfig?.LOGO_URL
  const bannerUrl = publicConfig?.BANNER_URL

  // Load public config on mount
  React.useEffect(() => {
    if (!configLoaded) {
      api.getPublicConfig().then((response) => {
        if (response.success) {
          setPublicConfig(response.data as PublicConfig)
        }
        setConfigLoaded(true)
      }).catch(() => {
        setConfigLoaded(true)
      })
    }
  }, [configLoaded])

  // Redirect if already authenticated (only after initialization is complete)
  React.useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [isInitialized, isAuthenticated, router, searchParams])

  // Clear error on input change
  React.useEffect(() => {
    if (error) {
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, password])

  // Auto-fill demo credentials in mock mode
  React.useEffect(() => {
    if (isMockMode && !username) {
      setUsername('admin')
      setPassword('admin123')
    }
  }, [isMockMode])

  // Show loading while checking auth state or loading config
  if (!isInitialized || !configLoaded) {
    return (
      <div className="w-full max-w-md space-y-6 p-6">
        {/* Mobile Banner - Loading State */}
        <div className="lg:hidden">
          <MobileBanner bannerUrl={bannerUrl} logoUrl={logoUrl} appName={appName} />
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-12 w-12 object-contain" />
            ) : (
              appInitial
            )}
          </div>
          <h1 className="text-3xl font-bold">{appName}</h1>
          <p className="text-muted-foreground mt-2">Sistem Manajemen Transaksi & Penjualan</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Masuk</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setError('Mohon masukkan username dan password')
      return
    }

    const result = await login({ username, password, rememberMe })

    if (result.success) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }

  const fillDemoCredentials = () => {
    setUsername('admin')
    setPassword('admin123')
  }

  return (
    <div className="w-full max-w-md space-y-4 p-4 sm:p-6">
      {/* Mobile Banner - Only shows on small screens */}
      <div className="lg:hidden">
        <MobileBanner bannerUrl={bannerUrl} logoUrl={logoUrl} appName={appName} />
      </div>

      {/* Mock Mode Indicator */}
      {isMockMode && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <TestTube className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Mode Demo Aktif</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
            Kredensial demo sudah terisi otomatis.
            <Button
              variant="link"
              className="p-0 h-auto ml-1 text-blue-600 dark:text-blue-400"
              onClick={fillDemoCredentials}
            >
              Reset
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Login Card */}
      <Card className="shadow-xl">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Masuk</CardTitle>
              <CardDescription className="text-sm">
                Masukkan kredensial untuk mengakses akun Anda
              </CardDescription>
            </div>
            <Badge variant={isMockMode ? "default" : "secondary"} className="text-xs">
              {isMockMode ? 'Demo' : 'Live'}
            </Badge>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Demo Credentials Info (Mock Mode Only) */}
            {isMockMode && (
              <Alert className="py-3">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sm">Demo Credentials</AlertTitle>
                <AlertDescription>
                  <div className="mt-1 text-xs">
                    <p><strong>Username:</strong> admin</p>
                    <p><strong>Password:</strong> admin123</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                Ingat saya
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>

            {/* Toggle Mock Mode */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Mode: {isMockMode ? 'Demo' : 'Production'}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleMockMode}
                className="h-auto py-1 px-2 text-xs"
              >
                Ganti ke {isMockMode ? 'Production' : 'Demo'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Available Users (Mock Mode) */}
      {isMockMode && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm">Akun Demo Tersedia</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-1">
              <p><strong>SuperAdmin:</strong> admin</p>
              <p><strong>Sales:</strong> sales1</p>
              <p><strong>Manager:</strong> manager</p>
              <p><strong>Driver:</strong> driver1</p>
            </div>
            <p className="mt-2 text-xs">Password: admin123</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function LoginLoading() {
  const appName = APP_DEFAULTS.APP_NAME
  const appInitial = appName.charAt(0).toUpperCase()
  
  return (
    <div className="w-full max-w-md space-y-8 p-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4">
          {appInitial}
        </div>
        <h1 className="text-3xl font-bold">{appName}</h1>
        <p className="text-muted-foreground mt-2">Sistem Manajemen Transaksi & Penjualan</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Masuk</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  )
}

// Mobile Banner Component - Compact version for mobile
function MobileBanner({ bannerUrl, logoUrl, appName }: { bannerUrl?: string; logoUrl?: string; appName: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary">
      {/* Banner Image as Background */}
      {bannerUrl ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/50 to-primary/30" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
      )}
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center p-6 text-primary-foreground">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-10 w-10 object-contain" />
            ) : (
              <span className="text-2xl font-bold">{appName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold drop-shadow">{appName}</h1>
            <p className="text-xs text-white/80">Sales Management</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Desktop Banner Component - Full split-screen
function DesktopBanner({ bannerUrl, logoUrl, appName }: { bannerUrl?: string; logoUrl?: string; appName: string }) {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary">
      {/* Banner Image as Background */}
      {bannerUrl ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-primary/40" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
      )}
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center items-center p-12 text-primary-foreground w-full">
        {/* Logo */}
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm shadow-2xl mb-8 overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-20 w-20 object-contain" />
          ) : (
            <span className="text-4xl font-bold">{appName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        
        {/* App Name */}
        <h1 className="text-4xl font-bold text-center mb-4 drop-shadow-lg">{appName}</h1>
        
        {/* Tagline */}
        <p className="text-xl text-white/90 text-center mb-8 drop-shadow">
          Sistem Manajemen Transaksi & Penjualan
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">Dashboard</div>
            <div className="text-sm text-white/80">Real-time Analytics</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">Invoice</div>
            <div className="text-sm text-white/80">Manajemen Transaksi</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">Delivery</div>
            <div className="text-sm text-white/80">Tracking Pengiriman</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">Reports</div>
            <div className="text-sm text-white/80">Laporan Lengkap</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [publicConfig, setPublicConfig] = React.useState<PublicConfig | null>(null)
  
  // Load public config for banner
  React.useEffect(() => {
    api.getPublicConfig().then((response) => {
      if (response.success) {
        setPublicConfig(response.data as PublicConfig)
      }
    }).catch(() => {})
  }, [])
  
  const appName = publicConfig?.APP_NAME || APP_DEFAULTS.APP_NAME
  const logoUrl = publicConfig?.LOGO_URL
  const bannerUrl = publicConfig?.BANNER_URL
  
  return (
    <div className="min-h-screen flex">
      {/* Desktop Banner Section - Left side */}
      <DesktopBanner bannerUrl={bannerUrl} logoUrl={logoUrl} appName={appName} />
      
      {/* Login Form Section - Right side (desktop) / Full width (mobile) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-background to-muted overflow-y-auto min-h-screen">
        <Suspense fallback={<LoginLoading />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
