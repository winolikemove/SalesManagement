'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { useAppStore } from '@/stores/app-store'
import { Sidebar, Navbar } from '@/components/layout/sidebar'
import { api } from '@/lib/api'

// ============ Auth Loading Screen ============
function AuthLoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// ============ Authenticated Layout ============
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isInitialized, initialize } = useAuthStore()
  const { appConfig, setAppConfig } = useAppStore()
  const [mounted, setMounted] = React.useState(false)
  const [configLoaded, setConfigLoaded] = React.useState(false)

  // Handle mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize auth state
  React.useEffect(() => {
    if (mounted && !isInitialized) {
      initialize()
    }
  }, [mounted, isInitialized, initialize])

  // Load config on mount and store in appConfig
  React.useEffect(() => {
    if (mounted && isAuthenticated && !configLoaded) {
      api.getAllConfig().then((response) => {
        if (response.success) {
          setAppConfig(response.data as Record<string, unknown>)
        }
        setConfigLoaded(true)
      }).catch(() => {
        setConfigLoaded(true)
      })
    }
  }, [mounted, isAuthenticated, configLoaded, setAppConfig])

  // Handle redirect
  React.useEffect(() => {
    if (mounted && isInitialized && !isAuthenticated) {
      const currentPath = pathname !== '/login' ? `?redirect=${encodeURIComponent(pathname)}` : ''
      router.push(`/login${currentPath}`)
    }
  }, [mounted, isInitialized, isAuthenticated, router, pathname])

  // Show loading screen while mounting, initializing, or loading config
  if (!mounted || !isInitialized || (isAuthenticated && !configLoaded)) {
    return <AuthLoadingScreen />
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated || !user) {
    return <AuthLoadingScreen />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
