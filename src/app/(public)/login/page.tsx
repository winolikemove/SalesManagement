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
import { useCompanySettings } from '@/hooks/use-settings'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading, error, setError, isAuthenticated, isInitialized } = useAuthStore()
  const { isMockMode, toggleMockMode } = useAppStore()
  const companySettings = useCompanySettings()

  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [rememberMe, setRememberMe] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  // Get app name from settings or fallback to APP_DEFAULTS
  const appName = companySettings.appName || APP_DEFAULTS.APP_NAME
  const appInitial = appName.charAt(0).toUpperCase()

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

  // Show loading while checking auth state
  if (!isInitialized) {
    return (
      <div className="w-full max-w-md space-y-8">
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
    <div className="w-full max-w-md space-y-8">
      {/* Logo & Title */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4">
          {appInitial}
        </div>
        <h1 className="text-3xl font-bold">{appName}</h1>
        <p className="text-muted-foreground mt-2">Sistem Manajemen Transaksi & Penjualan</p>
      </div>

      {/* Mock Mode Indicator */}
      {isMockMode && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <TestTube className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Mode Demo Aktif</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Anda sedang menggunakan data dummy untuk testing. Kredensial demo sudah terisi otomatis.
            <Button
              variant="link"
              className="p-0 h-auto ml-1 text-blue-600 dark:text-blue-400"
              onClick={fillDemoCredentials}
            >
              Reset kredensial
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Login Card */}
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Masuk</CardTitle>
              <CardDescription>
                Masukkan kredensial untuk mengakses akun Anda
              </CardDescription>
            </div>
            <Badge variant={isMockMode ? "default" : "secondary"}>
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
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Demo Credentials</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 text-sm">
                    <p><strong>Username:</strong> admin</p>
                    <p><strong>Password:</strong> admin123</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
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
              <Label htmlFor="password">Password</Label>
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
            <div className="flex items-center justify-between">
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
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
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
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Akun Demo Tersedia</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="space-y-1">
              <p><strong>SuperAdmin:</strong> admin / admin123</p>
              <p><strong>Sales:</strong> sales1 / admin123</p>
              <p><strong>Manager:</strong> manager / admin123</p>
              <p><strong>Driver:</strong> driver1 / admin123</p>
            </div>
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
    <div className="w-full max-w-md space-y-8">
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

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
