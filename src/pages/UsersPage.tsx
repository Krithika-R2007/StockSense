import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Edit3,
  UserX,
  UserCheck,
  KeyRound,
  Trash2,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Drawer } from '../components/ui/Drawer'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Pagination } from '../components/ui/Pagination'
import { useToast } from '../components/toast/ToastContext'
import { useAuth } from '../auth/AuthContext'
import { cn } from '../lib/cn'

// ---------------------------------------------------------------------------
// Types & Definitions
// ---------------------------------------------------------------------------

export type SystemRole = 'Admin' | 'Manager' | 'Staff' | 'Viewer' | 'Custom'
export type UserStatus = 'Active' | 'Inactive'

export interface UserPermissions {
  can_view_reports: boolean
  can_manage_transfers: boolean
  can_approve_po: boolean
  can_adjust_stock: boolean
  can_manage_users: boolean
  can_export_data: boolean
}

export interface UserAccount {
  id: string
  name: string
  email: string
  phone: string
  role: SystemRole
  locations: string[]
  status: UserStatus
  lastActive: string
  hasLoggedIn: boolean
  avatarColor: string
  permissions: UserPermissions
}

const ALL_LOCATIONS = [
  'Warehouse A',
  'Cold Store',
  'Central Pharmacy',
  'Clinic North',
  'Distribution Center East',
]

const PERMISSION_CONFIG: {
  key: keyof UserPermissions
  label: string
  description: string
}[] = [
  {
    key: 'can_view_reports',
    label: 'View Reports & Analytics',
    description: 'Access inventory turnover, stock valuation, and audit trends',
  },
  {
    key: 'can_manage_transfers',
    label: 'Manage Transfers & Shipments',
    description: 'Initiate, accept, and dispatch inter-facility transfers',
  },
  {
    key: 'can_approve_po',
    label: 'Approve Purchase Orders',
    description: 'Authorize vendor orders and restocking requisitions',
  },
  {
    key: 'can_adjust_stock',
    label: 'Perform Stock Adjustments',
    description: 'Record write-offs, cycle counts, and manual balance edits',
  },
  {
    key: 'can_manage_users',
    label: 'Manage Users & Permissions',
    description: 'Invite team members, assign locations, and edit RBAC policies',
  },
  {
    key: 'can_export_data',
    label: 'Export Sensitive Data',
    description: 'Download CSV reports, system logs, and supplier contracts',
  },
]

const ROLE_PERMISSIONS_PRESETS: Record<Exclude<SystemRole, 'Custom'>, UserPermissions> = {
  Admin: {
    can_view_reports: true,
    can_manage_transfers: true,
    can_approve_po: true,
    can_adjust_stock: true,
    can_manage_users: true,
    can_export_data: true,
  },
  Manager: {
    can_view_reports: true,
    can_manage_transfers: true,
    can_approve_po: true,
    can_adjust_stock: true,
    can_manage_users: false,
    can_export_data: true,
  },
  Staff: {
    can_view_reports: false,
    can_manage_transfers: true,
    can_approve_po: false,
    can_adjust_stock: true,
    can_manage_users: false,
    can_export_data: false,
  },
  Viewer: {
    can_view_reports: true,
    can_manage_transfers: false,
    can_approve_po: false,
    can_adjust_stock: false,
    can_manage_users: false,
    can_export_data: false,
  },
}

// ---------------------------------------------------------------------------
// 8 Varied Mock Users
// ---------------------------------------------------------------------------

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Maria Chen',
    email: 'maria.chen@example.com',
    phone: '+1 (555) 234-5678',
    role: 'Admin',
    locations: ['Warehouse A', 'Cold Store', 'Central Pharmacy'],
    status: 'Active',
    lastActive: '5 mins ago',
    hasLoggedIn: true,
    avatarColor: 'bg-blue-600 text-white',
    permissions: ROLE_PERMISSIONS_PRESETS.Admin,
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    phone: '+1 (555) 345-6789',
    role: 'Manager',
    locations: ['Warehouse A', 'Distribution Center East'],
    status: 'Active',
    lastActive: '2 hours ago',
    hasLoggedIn: true,
    avatarColor: 'bg-emerald-600 text-white',
    permissions: ROLE_PERMISSIONS_PRESETS.Manager,
  },
  {
    id: 'usr-3',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    phone: '+1 (555) 456-7890',
    role: 'Staff',
    locations: ['Cold Store'],
    status: 'Active',
    lastActive: 'Yesterday at 4:15 PM',
    hasLoggedIn: true,
    avatarColor: 'bg-violet-600 text-white',
    permissions: ROLE_PERMISSIONS_PRESETS.Staff,
  },
  {
    id: 'usr-4',
    name: 'David Kim',
    email: 'david.kim@example.com',
    phone: '+1 (555) 567-8901',
    role: 'Staff',
    locations: ['Central Pharmacy', 'Clinic North'],
    status: 'Inactive',
    lastActive: '3 days ago',
    hasLoggedIn: true,
    avatarColor: 'bg-amber-600 text-white',
    permissions: ROLE_PERMISSIONS_PRESETS.Staff,
  },
  {
    id: 'usr-5',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 678-9012',
    role: 'Viewer',
    locations: ['Warehouse A', 'Cold Store', 'Clinic North', 'Distribution Center East'],
    status: 'Active',
    lastActive: '1 week ago',
    hasLoggedIn: true,
    avatarColor: 'bg-sky-600 text-white',
    permissions: ROLE_PERMISSIONS_PRESETS.Viewer,
  },
  {
    id: 'usr-6',
    name: 'Jordan Taylor',
    email: 'jordan.taylor@example.com',
    phone: '+1 (555) 789-0123',
    role: 'Manager',
    locations: ['Clinic North'],
    status: 'Inactive',
    lastActive: 'Never logged in',
    hasLoggedIn: false, // Eligible for delete
    avatarColor: 'bg-teal-600 text-white',
    permissions: ROLE_PERMISSIONS_PRESETS.Manager,
  },
  {
    id: 'usr-7',
    name: 'Alex Mercer',
    email: 'alex.mercer@example.com',
    phone: '+1 (555) 890-1234',
    role: 'Custom',
    locations: ['Central Pharmacy'],
    status: 'Active',
    lastActive: 'Never logged in',
    hasLoggedIn: false, // Eligible for delete
    avatarColor: 'bg-rose-600 text-white',
    permissions: {
      can_view_reports: true,
      can_manage_transfers: false,
      can_approve_po: true,
      can_adjust_stock: false,
      can_manage_users: false,
      can_export_data: true,
    },
  },
  {
    id: 'usr-8',
    name: 'Dr. Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+1 (555) 901-2345',
    role: 'Viewer',
    locations: ['Warehouse A'],
    status: 'Inactive',
    lastActive: '3 weeks ago',
    hasLoggedIn: true,
    avatarColor: 'bg-indigo-600 text-white',
    permissions: ROLE_PERMISSIONS_PRESETS.Viewer,
  },
]

// Avatar initials generator
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// UsersPage Component
// ---------------------------------------------------------------------------

export function UsersPage() {
  const { user: currentAuthUser } = useAuth()
  const { toast } = useToast()

  // State: User accounts list
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS)

  // Simulation mode for role testing (Admin vs Non-Admin)
  const [simulatedRole, setSimulatedRole] = useState<'Admin' | 'Viewer'>(
    (currentAuthUser?.role as 'Admin') || 'Admin',
  )
  const isAdmin = simulatedRole === 'Admin'

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Drawer state (Invite / Edit)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'invite' | 'edit'>('invite')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // Drawer Form State
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formRole, setFormRole] = useState<SystemRole>('Staff')
  const [formLocations, setFormLocations] = useState<string[]>([])
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(
    ROLE_PERMISSIONS_PRESETS.Staff,
  )
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Modals state
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)

  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Click outside to close dropdown menu
  const menuRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuUserId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'All' && u.role !== roleFilter) return false

      // Status filter
      if (statusFilter !== 'All' && u.status !== statusFilter) return false

      // Search filter (name, email, locations)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = u.name.toLowerCase().includes(q)
        const matchesEmail = u.email.toLowerCase().includes(q)
        const matchesLocation = u.locations.some((loc) =>
          loc.toLowerCase().includes(q),
        )
        const matchesRole = u.role.toLowerCase().includes(q)
        if (!matchesName && !matchesEmail && !matchesLocation && !matchesRole) {
          return false
        }
      }

      return true
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(start, start + itemsPerPage)
  }, [filteredUsers, currentPage, itemsPerPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter, statusFilter])

  // Stats calculation
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === 'Active').length
    const pendingInvites = users.filter((u) => !u.hasLoggedIn).length
    const admins = users.filter((u) => u.role === 'Admin').length
    return { total, active, pendingInvites, admins }
  }, [users])

  // -------------------------------------------------------------------------
  // Drawer Handlers
  // -------------------------------------------------------------------------

  function openInviteDrawer() {
    if (!isAdmin) {
      toast('Admin permissions required to invite new users.', 'warning')
      return
    }
    setDrawerMode('invite')
    setEditingUserId(null)
    setFormName('')
    setFormEmail('')
    setFormPhone('')
    setFormRole('Staff')
    setFormLocations(['Warehouse A'])
    setFormPermissions(ROLE_PERMISSIONS_PRESETS.Staff)
    setFormErrors({})
    setDrawerOpen(true)
  }

  function openEditDrawer(user: UserAccount) {
    if (!isAdmin) {
      toast('Admin permissions required to edit user configurations.', 'warning')
      return
    }
    setDrawerMode('edit')
    setEditingUserId(user.id)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormPhone(user.phone)
    setFormRole(user.role)
    setFormLocations([...user.locations])
    setFormPermissions({ ...user.permissions })
    setFormErrors({})
    setActiveMenuUserId(null)
    setDrawerOpen(true)
  }

  function handleRoleChange(newRole: SystemRole) {
    setFormRole(newRole)
    if (newRole !== 'Custom') {
      setFormPermissions(ROLE_PERMISSIONS_PRESETS[newRole])
    }
  }

  function toggleLocation(location: string) {
    setFormLocations((prev) =>
      prev.includes(location)
        ? prev.filter((loc) => loc !== location)
        : [...prev, location],
    )
  }

  function togglePermission(key: keyof UserPermissions) {
    setFormPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  function validateDrawerForm(): boolean {
    const errs: Record<string, string> = {}
    if (!formName.trim()) {
      errs.name = 'Full name is required'
    }
    if (!formEmail.trim()) {
      errs.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      errs.email = 'Please provide a valid email format'
    }
    if (formLocations.length === 0) {
      errs.locations = 'Assign at least one facility location'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSaveUser() {
    if (!validateDrawerForm()) return

    if (drawerMode === 'invite') {
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || 'N/A',
        role: formRole,
        locations: formLocations,
        status: 'Active',
        lastActive: 'Never logged in',
        hasLoggedIn: false,
        avatarColor: 'bg-emerald-600 text-white',
        permissions: formPermissions,
      }
      setUsers((prev) => [newUser, ...prev])
      toast(`Invitation sent to ${newUser.email}`, 'success')
    } else if (drawerMode === 'edit' && editingUserId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                name: formName.trim(),
                email: formEmail.trim(),
                phone: formPhone.trim() || 'N/A',
                role: formRole,
                locations: formLocations,
                permissions: formPermissions,
              }
            : u,
        ),
      )
      toast(`User ${formName} updated successfully`, 'success')
    }

    setDrawerOpen(false)
  }

  // -------------------------------------------------------------------------
  // Action Handlers (Modals)
  // -------------------------------------------------------------------------

  function handleTriggerDeactivateToggle(user: UserAccount) {
    if (!isAdmin) {
      toast('Admin permissions required to modify user status.', 'warning')
      return
    }
    setSelectedUser(user)
    setActiveMenuUserId(null)
    setDeactivateModalOpen(true)
  }

  function handleConfirmDeactivateToggle() {
    if (!selectedUser) return
    const newStatus: UserStatus =
      selectedUser.status === 'Active' ? 'Inactive' : 'Active'

    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, status: newStatus } : u)),
    )
    toast(
      `User ${selectedUser.name} has been ${newStatus.toLowerCase()}d.`,
      newStatus === 'Active' ? 'success' : 'warning',
    )
    setDeactivateModalOpen(false)
    setSelectedUser(null)
  }

  function handleTriggerResetPassword(user: UserAccount) {
    if (!isAdmin) {
      toast('Admin permissions required to reset user passwords.', 'warning')
      return
    }
    setSelectedUser(user)
    setActiveMenuUserId(null)
    setResetModalOpen(true)
  }

  function handleConfirmResetPassword() {
    if (!selectedUser) return
    toast(`Reset link sent to ${selectedUser.email}`, 'success')
    setResetModalOpen(false)
    setSelectedUser(null)
  }

  function handleTriggerDelete(user: UserAccount) {
    if (!isAdmin) {
      toast('Admin permissions required to delete user invitations.', 'warning')
      return
    }
    if (user.hasLoggedIn) {
      toast('Cannot delete a user who has logged in. Deactivate instead.', 'error')
      return
    }
    setSelectedUser(user)
    setActiveMenuUserId(null)
    setDeleteModalOpen(true)
  }

  function handleConfirmDelete() {
    if (!selectedUser) return
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
    toast(`User invitation for ${selectedUser.name} removed.`, 'success')
    setDeleteModalOpen(false)
    setSelectedUser(null)
  }

  // Chip tone mapping for role
  function getRoleTone(
    role: SystemRole,
  ): 'info' | 'warning' | 'neutral' | 'critical' {
    switch (role) {
      case 'Admin':
        return 'info'
      case 'Manager':
        return 'warning'
      case 'Staff':
        return 'neutral'
      case 'Viewer':
        return 'neutral'
      case 'Custom':
        return 'critical'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Page Header with RBAC Simulator Toggle */}
      {/* ----------------------------------------------------------------- */}
      <PageHeader
        title="User & Access Management"
        subtitle="Manage user permissions, facility locations, and role-based access policies."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* RBAC Simulator Pill for testing */}
            <div className="flex items-center rounded-[8px] border border-border bg-surface px-2.5 py-1 text-xs">
              <span className="mr-2 font-medium text-muted">Simulate Role:</span>
              <button
                type="button"
                onClick={() => setSimulatedRole('Admin')}
                className={cn(
                  'rounded px-2 py-0.5 font-medium transition-colors',
                  simulatedRole === 'Admin'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-app',
                )}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setSimulatedRole('Viewer')}
                className={cn(
                  'ml-1 rounded px-2 py-0.5 font-medium transition-colors',
                  simulatedRole === 'Viewer'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-app',
                )}
              >
                Viewer (Non-admin)
              </button>
            </div>

            {/* "+ Invite User" Button */}
            <Button
              variant="primary"
              icon={<UserPlus className="h-4 w-4" />}
              onClick={openInviteDrawer}
              disabled={!isAdmin}
              title={!isAdmin ? 'Admin permission required' : 'Invite a new team member'}
            >
              + Invite User
            </Button>
          </div>
        }
      />

      {/* ----------------------------------------------------------------- */}
      {/* Non-Admin Role-based Access Banner */}
      {/* ----------------------------------------------------------------- */}
      {!isAdmin && (
        <div className="flex items-center gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">View-only access.</span> Contact an admin to make changes to user accounts, roles, or facility access permissions.
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Stats Summary Cards */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding={true} className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-blue-50 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{stats.total}</div>
            <div className="text-xs text-muted">Total Accounts</div>
          </div>
        </Card>

        <Card padding={true} className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{stats.active}</div>
            <div className="text-xs text-muted">Active Users</div>
          </div>
        </Card>

        <Card padding={true} className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{stats.pendingInvites}</div>
            <div className="text-xs text-muted">Pending Invitations</div>
          </div>
        </Card>

        <Card padding={true} className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-indigo-50 text-indigo-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text">{stats.admins}</div>
            <div className="text-xs text-muted">System Administrators</div>
          </div>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Filter & Search Bar */}
      {/* ----------------------------------------------------------------- */}
      <Card padding={true} className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, role, or facility..."
              className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-4 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-text"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters: Role & Status */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-40">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All Roles' },
                  { value: 'Admin', label: 'Admin' },
                  { value: 'Manager', label: 'Manager' },
                  { value: 'Staff', label: 'Staff' },
                  { value: 'Viewer', label: 'Viewer' },
                  { value: 'Custom', label: 'Custom' },
                ]}
              />
            </div>

            <div className="w-36">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>

            {(searchQuery || roleFilter !== 'All' || statusFilter !== 'All') && (
              <Button
                variant="ghost"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('All')
                  setStatusFilter('All')
                }}
                className="text-xs text-muted hover:text-text"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Users Table */}
        {/* ----------------------------------------------------------------- */}
        <div className="overflow-x-auto rounded-[8px] border border-border">
          <table className="w-full text-left text-sm text-text">
            <thead className="bg-app text-xs uppercase text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  User
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Role
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                  Assigned Locations
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">
                  Last Active
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted">
                      <Users className="mb-2 h-10 w-10 stroke-[1.5] text-slate-300" />
                      <p className="text-base font-medium text-text">No users found</p>
                      <p className="text-xs text-muted">
                        No team members match your current filter or search criteria.
                      </p>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSearchQuery('')
                          setRoleFilter('All')
                          setStatusFilter('All')
                        }}
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const initials = getInitials(user.name)
                  const isMenuOpen = activeMenuUserId === user.id

                  return (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-slate-50/70"
                    >
                      {/* Avatar & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm',
                              user.avatarColor,
                            )}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-semibold text-text">
                              <span className="truncate">{user.name}</span>
                              {user.role === 'Admin' && (
                                <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                              )}
                            </div>
                            <div className="text-xs text-muted sm:hidden">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="hidden px-4 py-3.5 text-text sm:table-cell">
                        <span className="font-mono text-xs text-muted">
                          {user.email}
                        </span>
                      </td>

                      {/* Role Chip */}
                      <td className="px-4 py-3.5">
                        <Chip
                          label={user.role}
                          tone={getRoleTone(user.role)}
                        />
                      </td>

                      {/* Locations */}
                      <td className="hidden px-4 py-3.5 md:table-cell">
                        <div className="flex flex-wrap items-center gap-1">
                          {user.locations.slice(0, 2).map((loc) => (
                            <span
                              key={loc}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              <Building2 className="h-3 w-3 text-muted" />
                              <span className="max-w-[120px] truncate">{loc}</span>
                            </span>
                          ))}
                          {user.locations.length > 2 && (
                            <span
                              className="cursor-help rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-800"
                              title={user.locations.slice(2).join(', ')}
                            >
                              +{user.locations.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="hidden px-4 py-3.5 lg:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span
                            className={cn(
                              !user.hasLoggedIn &&
                                'rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800',
                            )}
                          >
                            {user.lastActive}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              user.status === 'Active'
                                ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                                : 'bg-slate-400',
                            )}
                          />
                          <span
                            className={cn(
                              'text-xs font-medium',
                              user.status === 'Active'
                                ? 'text-emerald-700'
                                : 'text-slate-500',
                            )}
                          >
                            {user.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions Menu */}
                      <td className="relative px-4 py-3.5 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuUserId(isMenuOpen ? null : user.id)
                            }}
                            className={cn(
                              'rounded-[8px] p-1.5 text-muted hover:bg-app hover:text-text focus:outline-none',
                              isMenuOpen && 'bg-app text-text',
                            )}
                            aria-label="Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Action Popover Menu */}
                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 z-30 mt-1 w-48 origin-top-right rounded-[10px] border border-border bg-surface p-1 shadow-lg ring-1 ring-black/5"
                            >
                              {/* Edit User */}
                              <button
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => openEditDrawer(user)}
                                className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-xs font-medium text-text hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-muted" />
                                Edit User
                              </button>

                              {/* Deactivate / Reactivate */}
                              <button
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => handleTriggerDeactivateToggle(user)}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-xs font-medium hover:bg-app disabled:cursor-not-allowed disabled:opacity-50',
                                  user.status === 'Active'
                                    ? 'text-amber-700'
                                    : 'text-emerald-700',
                                )}
                              >
                                {user.status === 'Active' ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5 text-amber-600" />
                                    Deactivate Account
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    Activate Account
                                  </>
                                )}
                              </button>

                              {/* Reset Password */}
                              <button
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => handleTriggerResetPassword(user)}
                                className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-xs font-medium text-text hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <KeyRound className="h-3.5 w-3.5 text-muted" />
                                Reset Password
                              </button>

                              <div className="my-1 border-t border-border" />

                              {/* Delete (only enabled if never logged in) */}
                              <button
                                type="button"
                                disabled={!isAdmin || user.hasLoggedIn}
                                onClick={() => handleTriggerDelete(user)}
                                title={
                                  user.hasLoggedIn
                                    ? 'Cannot delete users who have already logged in. Deactivate instead.'
                                    : 'Remove pending user invitation'
                                }
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-xs font-medium',
                                  !isAdmin || user.hasLoggedIn
                                    ? 'cursor-not-allowed text-slate-400'
                                    : 'text-error hover:bg-red-50',
                                )}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Invitation</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Pagination & Count */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
          <div className="text-xs text-muted">
            Showing{' '}
            <span className="font-semibold text-text">
              {filteredUsers.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-text">
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
            </span>{' '}
            of <span className="font-semibold text-text">{filteredUsers.length}</span>{' '}
            users
          </div>

          {totalPages > 1 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Invite / Edit User Drawer */}
      {/* ----------------------------------------------------------------- */}
      <Drawer
        open={drawerOpen}
        title={drawerMode === 'invite' ? 'Invite New User' : 'Edit User Profile'}
        onClose={() => setDrawerOpen(false)}
        wide={true}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveUser}>
              {drawerMode === 'invite' ? 'Send Invitation' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 text-left">
          {/* Header Description */}
          <p className="text-xs text-muted">
            {drawerMode === 'invite'
              ? 'Send an invitation link to onboard a new employee or vendor contractor. Define their role and facility boundaries.'
              : 'Update user contact details, role-based capabilities, and assigned facility access permissions.'}
          </p>

          {/* User Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Account Information
            </h4>

            <div>
              <Input
                label="Full Name"
                placeholder="e.g. Jane Doe"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-error">{formErrors.name}</p>
              )}
            </div>

            <div>
              <Input
                label="Work Email Address"
                type="email"
                placeholder="name@company.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-error">{formErrors.email}</p>
              )}
            </div>

            <div>
              <Input
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
          </div>

          <hr className="border-border" />

          {/* Role Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Role & Access Level
              </h4>
              <span className="text-xs text-muted">Defines baseline privileges</span>
            </div>

            <Select
              label="Assigned System Role"
              value={formRole}
              onChange={(e) => handleRoleChange(e.target.value as SystemRole)}
              options={[
                { value: 'Admin', label: 'Admin — Full control over all system modules' },
                { value: 'Manager', label: 'Manager — Approvals, inventory, and reports' },
                { value: 'Staff', label: 'Staff — Daily transfers and stock operations' },
                { value: 'Viewer', label: 'Viewer — Read-only visibility into reports' },
                { value: 'Custom', label: 'Custom — Tailored capability matrix' },
              ]}
            />
          </div>

          <hr className="border-border" />

          {/* Assigned Facilities Multi-select */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Facility & Warehouse Locations
              </h4>
              <div className="space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormLocations([...ALL_LOCATIONS])}
                  className="text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-muted">|</span>
                <button
                  type="button"
                  onClick={() => setFormLocations([])}
                  className="text-muted hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <p className="text-xs text-muted">
              Users can only view, transfer, and audit inventory within their assigned facility locations.
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ALL_LOCATIONS.map((loc) => {
                const isSelected = formLocations.includes(loc)
                return (
                  <label
                    key={loc}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-[8px] border p-3 text-sm transition-colors',
                      isSelected
                        ? 'border-primary/40 bg-blue-50/50 text-text'
                        : 'border-border bg-surface text-muted hover:bg-app',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleLocation(loc)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <Building2 className="h-4 w-4 text-muted" />
                    <span className="font-medium text-text">{loc}</span>
                  </label>
                )
              })}
            </div>
            {formErrors.locations && (
              <p className="text-xs text-error">{formErrors.locations}</p>
            )}
          </div>

          <hr className="border-border" />

          {/* Permissions Matrix (Custom RBAC) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                  RBAC Permission Matrix
                </h4>
                <p className="text-xs text-muted">
                  {formRole === 'Custom'
                    ? 'Custom role enabled: Select individual permissions below.'
                    : `Preset for ${formRole} role. Switch role to Custom to modify individual permissions.`}
                </p>
              </div>
              {formRole !== 'Custom' && (
                <Button
                  variant="ghost"
                  className="text-xs text-primary"
                  onClick={() => handleRoleChange('Custom')}
                >
                  Customize Permissions
                </Button>
              )}
            </div>

            <div className="space-y-2 rounded-[10px] border border-border bg-slate-50/50 p-3">
              {PERMISSION_CONFIG.map((perm) => {
                const isChecked = formPermissions[perm.key]
                const isInteractive = formRole === 'Custom'

                return (
                  <label
                    key={perm.key}
                    className={cn(
                      'flex items-start gap-3 rounded-[6px] p-2 transition-colors',
                      isInteractive ? 'cursor-pointer hover:bg-white' : 'cursor-default',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!isInteractive}
                      onChange={() => togglePermission(perm.key)}
                      className={cn(
                        'mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary',
                        !isInteractive && 'opacity-60',
                      )}
                    />
                    <div className="text-left">
                      <div className="text-xs font-semibold text-text">
                        {perm.label}
                      </div>
                      <div className="text-xs text-muted">{perm.description}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </Drawer>

      {/* ----------------------------------------------------------------- */}
      {/* Deactivate / Reactivate Confirmation Modal */}
      {/* ----------------------------------------------------------------- */}
      <Modal
        open={deactivateModalOpen}
        title={
          selectedUser?.status === 'Active'
            ? 'Deactivate User Account'
            : 'Reactivate User Account'
        }
        confirmLabel={
          selectedUser?.status === 'Active' ? 'Deactivate Account' : 'Activate Account'
        }
        confirmVariant={
          selectedUser?.status === 'Active' ? 'destructive' : 'success'
        }
        onClose={() => {
          setDeactivateModalOpen(false)
          setSelectedUser(null)
        }}
        onConfirm={handleConfirmDeactivateToggle}
      >
        <div className="space-y-3 text-left">
          <p>
            {selectedUser?.status === 'Active' ? (
              <>
                Are you sure you want to deactivate{' '}
                <span className="font-semibold text-text">{selectedUser?.name}</span>?
                They will immediately lose access to all facilities and inventory operations.
              </>
            ) : (
              <>
                Are you sure you want to reactivate{' '}
                <span className="font-semibold text-text">{selectedUser?.name}</span>?
                They will regain login access and operational rights according to their assigned role.
              </>
            )}
          </p>
          <div className="rounded-[8px] bg-slate-100 p-3 text-xs text-slate-700">
            <strong>Target Account:</strong> {selectedUser?.email}
          </div>
        </div>
      </Modal>

      {/* ----------------------------------------------------------------- */}
      {/* Reset Password Modal */}
      {/* ----------------------------------------------------------------- */}
      <Modal
        open={resetModalOpen}
        title="Send Password Reset Link"
        confirmLabel="Send Reset Link"
        confirmVariant="primary"
        onClose={() => {
          setResetModalOpen(false)
          setSelectedUser(null)
        }}
        onConfirm={handleConfirmResetPassword}
      >
        <div className="space-y-3 text-left">
          <p>
            A secure, one-time password reset link will be generated and dispatched to{' '}
            <span className="font-semibold text-text">{selectedUser?.name}</span>.
          </p>
          <div className="rounded-[8px] border border-border bg-slate-50 p-3 text-xs text-muted">
            <div className="flex items-center gap-2 font-mono text-text">
              <Mail className="h-4 w-4 text-primary" />
              {selectedUser?.email}
            </div>
            <p className="mt-1">
              The reset token will expire automatically in 24 hours.
            </p>
          </div>
        </div>
      </Modal>

      {/* ----------------------------------------------------------------- */}
      {/* Delete User Invitation Modal */}
      {/* ----------------------------------------------------------------- */}
      <Modal
        open={deleteModalOpen}
        title="Delete User Invitation"
        confirmLabel="Delete Invitation"
        confirmVariant="destructive"
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedUser(null)
        }}
        onConfirm={handleConfirmDelete}
      >
        <div className="space-y-3 text-left">
          <p>
            Are you sure you want to delete the pending invitation for{' '}
            <span className="font-semibold text-text">{selectedUser?.name}</span>?
          </p>
          <p className="text-xs text-error">
            This action cannot be undone. Because this user has never logged in, their record can safely be removed from the system.
          </p>
          <div className="rounded-[8px] bg-red-50 p-3 text-xs text-red-900">
            <strong>Email:</strong> {selectedUser?.email}
          </div>
        </div>
      </Modal>
    </div>
  )
}
