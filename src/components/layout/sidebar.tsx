'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  Truck,
  Database,
  Users,
  UserCircle,
  Package,
  User,
  Car,
  Tag,
  Target,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore, useIsAdmin } from '@/stores/auth-store'
import { useAppStore, useSidebar, usePageHeader } from '@/stores/app-store'
import { useTheme } from 'next-themes'
import { ROLE_LABELS, APP_DEFAULTS } from '@/lib/constants'
import { useCompanySettings } from '@/hooks/use-settings'
import type { User } from '@/types'

// ============ Navigation Items ============
const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Transactions',
    href: '/transactions',
    icon: Receipt,
  },
  {
    title: 'Deliveries',
    href: '/deliveries',
    icon: Truck,
  },
  {
    title: 'Master Data',
    icon: Database,
    children: [
      { title: 'Users', href: '/master/users', icon: Users },
      { title: 'Customers', href: '/master/customers', icon: UserCircle },
      { title: 'Products', href: '/master/products', icon: Package },
      { title: 'Drivers', href: '/master/drivers', icon: User },
      { title: 'Vehicles', href: '/master/vehicles', icon: Car },
      { title: 'Customer Prices', href: '/master/prices', icon: Tag },
    ],
  },
  {
    title: 'Targets',
    href: '/targets',
    icon: Target,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

// ============ Nav Item Component ============
interface NavItemProps {
  title: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  children?: { title: string; href: string; icon?: React.ComponentType<{ className?: string }> }[]
  collapsed?: boolean
  onClose?: () => void
}

function NavItem({ title, href, icon: Icon, children, collapsed, onClose }: NavItemProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  const isActive = href ? pathname === href : false
  const hasActiveChild = children?.some((child) => pathname === child.href)

  if (children && children.length > 0) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            (isOpen || hasActiveChild) && 'bg-accent text-accent-foreground'
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5" />}
            {!collapsed && <span>{title}</span>}
          </div>
          {!collapsed && (
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
            />
          )}
        </button>

        {!collapsed && isOpen && (
          <div className="ml-4 space-y-1 border-l border-border pl-4">
            {children.map((child) => {
              const childIsActive = pathname === child.href
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    childIsActive && 'bg-accent text-accent-foreground font-medium'
                  )}
                >
                  {child.icon && <child.icon className="h-4 w-4" />}
                  {child.title}
                </Link>
              )
            })}
          </div>
        )}

        {collapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  hasActiveChild && 'bg-accent text-accent-foreground'
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-48">
              <DropdownMenuLabel>{title}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {children.map((child) => {
                const childIsActive = pathname === child.href
                return (
                  <DropdownMenuItem key={child.href} asChild>
                    <Link
                      href={child.href}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer',
                        childIsActive && 'font-medium'
                      )}
                    >
                      {child.icon && <child.icon className="h-4 w-4" />}
                      {child.title}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  if (collapsed) {
    return (
      <Link
        href={href || '#'}
        onClick={onClose}
        className={cn(
          'flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-accent text-accent-foreground'
        )}
        title={title}
      >
        {Icon && <Icon className="h-5 w-5" />}
      </Link>
    )
  }

  return (
    <Link
      href={href || '#'}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground'
      )}
    >
      {Icon && <Icon className="h-5 w-5" />}
      <span>{title}</span>
    </Link>
  )
}

// ============ User Menu Component ============
interface UserMenuProps {
  user: User | null
  onLogout: () => void
}

function UserMenu({ user, onLogout }: UserMenuProps) {
  const { theme, setTheme } = useTheme()

  if (!user) return null

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-full justify-start gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoUrl} alt={user.fullName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">{user.fullName}</span>
            <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.fullName}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className={cn('mr-2 h-4 w-4', theme === 'light' && 'text-primary')} />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className={cn('mr-2 h-4 w-4', theme === 'dark' && 'text-primary')} />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className={cn('mr-2 h-4 w-4', theme === 'system' && 'text-primary')} />
          System
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============ Sidebar Content ============
interface SidebarContentProps {
  collapsed?: boolean
  onClose?: () => void
}

function SidebarContent({ collapsed, onClose }: SidebarContentProps) {
  const isAdmin = useIsAdmin()
  const companySettings = useCompanySettings()
  const appName = companySettings.appName || APP_DEFAULTS.APP_NAME
  const appInitial = appName.charAt(0).toUpperCase()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b px-4">
        {collapsed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            {appInitial}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              {appInitial}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">{appName}</span>
              <span className="text-xs text-muted-foreground">Sales Management</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            // Filter admin-only items
            if (item.title === 'Settings' && !isAdmin) return null

            return (
              <NavItem
                key={item.title}
                {...item}
                collapsed={collapsed}
                onClose={onClose}
              />
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Menu */}
      <div className="border-t p-3">
        <SidebarUserMenu collapsed={collapsed} />
      </div>
    </div>
  )
}

// ============ Sidebar User Menu ============
interface SidebarUserMenuProps {
  collapsed?: boolean
}

function SidebarUserMenu({ collapsed }: SidebarUserMenuProps) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  if (collapsed && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoUrl} alt={user.fullName} />
              <AvatarFallback className="text-xs">
                {user.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <UserMenu user={user} onLogout={logout} />
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return <UserMenu user={user} onLogout={logout} />
}

// ============ Desktop Sidebar ============
export function Sidebar() {
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        'relative hidden md:flex flex-col border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <button
        onClick={toggle}
        className="absolute right-[-12px] top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent hidden md:flex"
      >
        <ChevronRight
          className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
        />
      </button>
    </aside>
  )
}

// ============ Mobile Navigation ============
export function MobileNav() {
  const { open, setOpen } = useSidebar()
  const logout = useAuthStore((state) => state.logout)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <VisuallyHidden>
          <SheetTitle>Navigation Menu</SheetTitle>
        </VisuallyHidden>
        <SidebarContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

// ============ Navbar Component ============
export function Navbar() {
  const { pageTitle, breadcrumbs } = usePageHeader()
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MobileNav />

      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span>/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground">
                      {crumb.title}
                    </Link>
                  ) : (
                    <span>{crumb.title}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Avatar (Desktop) */}
          <div className="hidden md:block">
            <UserMenu user={user} onLogout={useAuthStore.getState().logout} />
          </div>
        </div>
      </div>
    </header>
  )
}

// ============ Theme Toggle ============
function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default Sidebar
