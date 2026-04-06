'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { Sidebar, Navbar } from '@/components/layout/sidebar'

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
  const { user, isAuthenticated, isInitialized, isLoading, initialize, checkAuth } = useAuthStore()

  React.useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      // Redirect to login if not authenticated
      const currentPath = pathname !== '/login' ? `?redirect=${encodeURIComponent(pathname)}` : ''
      router.push(`/login${currentPath}`)
    }
  }, [isInitialized, isAuthenticated, router, pathname])

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
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
