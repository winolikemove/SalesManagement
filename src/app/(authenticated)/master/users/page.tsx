'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, MoreHorizontal, Eye, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTable, SortableHeader, RowActions } from '@/components/shared/data-table'
import { PageHeader, ModalForm, ConfirmDialog, LoadingScreen } from '@/components/shared'
import { api } from '@/lib/api'
import { formatDateTime, cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { usePageHeader } from '@/stores/app-store'
import { useIsAdmin } from '@/stores/auth-store'
import type { User } from '@/types'

// ============ Mock Data ============
const mockUsers: User[] = [
  { id: '1', username: 'admin', name: 'Admin User', email: 'admin@transman.com', role: 'admin', phone: '081234567890', isActive: true, createdAt: '2024-01-01T10:00:00', updatedAt: '2024-01-01T10:00:00' },
  { id: '2', username: 'manager', name: 'Manager User', email: 'manager@transman.com', role: 'manager', phone: '081234567891', isActive: true, createdAt: '2024-01-02T10:00:00', updatedAt: '2024-01-02T10:00:00' },
  { id: '3', username: 'sales1', name: 'Sales One', email: 'sales1@transman.com', role: 'sales', phone: '081234567892', isActive: true, createdAt: '2024-01-03T10:00:00', updatedAt: '2024-01-03T10:00:00' },
  { id: '4', username: 'driver1', name: 'Driver One', email: 'driver1@transman.com', role: 'driver', phone: '081234567893', isActive: true, createdAt: '2024-01-04T10:00:00', updatedAt: '2024-01-04T10:00:00' },
  { id: '5', username: 'cashier1', name: 'Cashier One', email: 'cashier1@transman.com', role: 'cashier', phone: '081234567894', isActive: false, createdAt: '2024-01-05T10:00:00', updatedAt: '2024-01-05T10:00:00' },
]

// ============ User Form Component ============
interface UserFormData {
  username: string
  name: string
  email: string
  role: string
  phone: string
  password?: string
  isActive: boolean
}

function UserForm({ user, onSubmit, onCancel, loading }: {
  user?: User
  onSubmit: (data: UserFormData) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [formData, setFormData] = React.useState<UserFormData>({
    username: user?.username || '',
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'sales',
    phone: user?.phone || '',
    password: '',
    isActive: user?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Username *</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            disabled={!!user}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Name *</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email *</label>
          <input
            type="email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <input
            type="tel"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Role *</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="admin">Administrator</option>
            <option value="manager">Manager</option>
            <option value="sales">Sales</option>
            <option value="driver">Driver</option>
            <option value="cashier">Cashier</option>
          </select>
        </div>
        {!user && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Password *</label>
            <input
              type="password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4"
        />
        <label htmlFor="isActive" className="text-sm font-medium">Active</label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : user ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// ============ Users Page ============
export default function UsersPage() {
  const queryClient = useQueryClient()
  const isAdmin = useIsAdmin()
  const { setPageTitle, setBreadcrumbs } = usePageHeader()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState(false)

  React.useEffect(() => {
    setPageTitle('Users Management')
    setBreadcrumbs([{ title: 'Master Data' }, { title: 'Users' }])
  }, [setPageTitle, setBreadcrumbs])

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // const response = await api.getUsers()
      // return response.data?.data || []
      return mockUsers
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // return api.createUser(data)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setOpenDialog(false)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      // return api.updateUser(id, data)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setOpenDialog(false)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // return api.deleteUser(id)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteDialog(false)
    },
  })

  // Columns
  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const user = row.original
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photo} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <SortableHeader column={column} title="Email" />,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <SortableHeader column={column} title="Role" />,
      cell: ({ row }) => (
        <Badge variant="outline">{ROLE_LABELS[row.getValue('role')]}</Badge>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDateTime(row.getValue('createdAt')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original
        return (
          <RowActions
            row={user}
            actions={[
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => {
                  setSelectedUser(user)
                  setOpenDialog(true)
                },
              },
              {
                label: 'Reset Password',
                icon: <Key className="h-4 w-4" />,
                onClick: () => {
                  // TODO: Implement reset password
                },
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                onClick: () => {
                  setSelectedUser(user)
                  setDeleteDialog(true)
                },
              },
            ]}
          />
        )
      },
    },
  ]

  const handleSubmit = (data: UserFormData) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users Management" description="Manage system users and their permissions">
        <Button onClick={() => { setSelectedUser(null); setOpenDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={users || []}
        searchKey="name"
        searchPlaceholder="Search users..."
      />

      {/* User Form Dialog */}
      <ModalForm
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={selectedUser ? 'Edit User' : 'Add User'}
        maxWidth="lg"
      >
        <UserForm
          user={selectedUser || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setOpenDialog(false)}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </ModalForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete User"
        description={`Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete"
        onConfirm={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
