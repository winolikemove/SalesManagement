'use client'

import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Save,
  Loader2,
  Camera,
  Key,
  Eye,
  EyeOff
} from 'lucide-react'
import { PageHeader } from '@/components/shared'
import { usePageHeader } from '@/stores/app-store'
import { useAuthStore, useCurrentUser } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { ROLE_LABELS } from '@/lib/constants'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'

// ============ Profile Form Data ============
interface ProfileFormData {
  fullName: string
  email: string
  phone: string
  division: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ============ Profile Page ============
export default function ProfilePage() {
  const user = useCurrentUser()
  const updateUser = useAuthStore((state) => state.updateUser)
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  
  // Profile form state
  const [profileForm, setProfileForm] = React.useState<ProfileFormData>({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    division: user?.division || '',
  })
  
  // Password form state
  const [passwordForm, setPasswordForm] = React.useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [hasProfileChanges, setHasProfileChanges] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Profile')
    setBreadcrumbs([{ title: 'Settings' }, { title: 'Profile' }])
  }, [setPageTitle, setBreadcrumbs])

  // Update form when user data changes
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        division: user.division || '',
      })
    }
  }, [user])

  // Check for changes
  React.useEffect(() => {
    if (user) {
      const hasChanges = 
        profileForm.fullName !== user.fullName ||
        profileForm.email !== user.email ||
        profileForm.phone !== user.phone ||
        profileForm.division !== user.division
      setHasProfileChanges(hasChanges)
    }
  }, [profileForm, user])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user) throw new Error('User not found')
      const response = await api.updateUser(user.id, data)
      return response
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        updateUser(response.data as typeof user)
        toast.success('Profile berhasil diperbarui')
        setHasProfileChanges(false)
      } else {
        toast.error(response.error || 'Gagal memperbarui profile')
      }
    },
    onError: (error) => {
      toast.error('Gagal memperbarui profile: ' + (error as Error).message)
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await api.call('auth.changePassword', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      return response
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Password berhasil diubah')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        toast.error(response.error || 'Gagal mengubah password')
      }
    },
    onError: (error) => {
      toast.error('Gagal mengubah password: ' + (error as Error).message)
    },
  })

  // Handle profile update
  const handleUpdateProfile = () => {
    if (!profileForm.fullName.trim()) {
      toast.error('Nama lengkap wajib diisi')
      return
    }
    if (!profileForm.email.trim()) {
      toast.error('Email wajib diisi')
      return
    }
    updateProfileMutation.mutate(profileForm)
  }

  // Handle password change
  const handleChangePassword = () => {
    if (!passwordForm.currentPassword) {
      toast.error('Password saat ini wajib diisi')
      return
    }
    if (!passwordForm.newPassword) {
      toast.error('Password baru wajib diisi')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    changePasswordMutation.mutate(passwordForm)
  }

  if (!user) {
    return null
  }

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader title="Profile" description="Kelola informasi profile Anda" />

      {/* Profile Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={user.photoUrl} alt={user.fullName} />
                <AvatarFallback className="text-xl sm:text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">{user.fullName}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                {user.isActive ? (
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Profile
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Perbarui informasi profile Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs md:text-sm">Username</Label>
              <Input
                id="username"
                value={user.username}
                disabled
                className="bg-muted text-sm md:text-base"
              />
              <p className="text-xs text-muted-foreground">Username tidak dapat diubah</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs md:text-sm">Role</Label>
              <Input
                id="role"
                value={ROLE_LABELS[user.role]}
                disabled
                className="bg-muted text-sm md:text-base"
              />
              <p className="text-xs text-muted-foreground">Role diatur oleh administrator</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs md:text-sm">
                <User className="h-3 w-3 inline mr-1" />
                Nama Lengkap *
              </Label>
              <Input
                id="fullName"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                placeholder="Nama lengkap"
                className="text-sm md:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs md:text-sm">
                <Mail className="h-3 w-3 inline mr-1" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="Email"
                className="text-sm md:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs md:text-sm">
                <Phone className="h-3 w-3 inline mr-1" />
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="Nomor telepon"
                className="text-sm md:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="division" className="text-xs md:text-sm">
                <Building className="h-3 w-3 inline mr-1" />
                Divisi
              </Label>
              <Input
                id="division"
                value={profileForm.division}
                onChange={(e) => setProfileForm({ ...profileForm, division: e.target.value })}
                placeholder="Divisi"
                className="text-sm md:text-base"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button 
            onClick={handleUpdateProfile} 
            disabled={updateProfileMutation.isPending || !hasProfileChanges}
            className="w-full sm:w-auto"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Profile
          </Button>
        </CardFooter>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Key className="h-5 w-5" />
            Ubah Password
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Ubah password akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-xs md:text-sm">Password Saat Ini</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Masukkan password saat ini"
                className="text-sm md:text-base pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs md:text-sm">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Masukkan password baru"
                  className="text-sm md:text-base pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs md:text-sm">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Konfirmasi password baru"
                className="text-sm md:text-base"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button 
            onClick={handleChangePassword} 
            disabled={changePasswordMutation.isPending}
            className="w-full sm:w-auto"
          >
            {changePasswordMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            Ubah Password
          </Button>
        </CardFooter>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg">Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Dibuat</p>
              <p className="font-medium">{formatDateTime(user.createdAt)}</p>
            </div>
            {user.lastLogin && (
              <div>
                <p className="text-muted-foreground">Login Terakhir</p>
                <p className="font-medium">{formatDateTime(user.lastLogin)}</p>
              </div>
            )}
            {user.updatedAt && (
              <div>
                <p className="text-muted-foreground">Terakhir Diperbarui</p>
                <p className="font-medium">{formatDateTime(user.updatedAt)}</p>
              </div>
            )}
            {user.createdBy && (
              <div>
                <p className="text-muted-foreground">Dibuat Oleh</p>
                <p className="font-medium">{user.createdBy}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
