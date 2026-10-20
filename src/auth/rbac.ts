import type { Role } from '../types/auth'

type NavItem = {
  to: string
  label: string
  roles: Role[] | 'all'
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', roles: 'all' },
  { to: '/products', label: 'Products', roles: 'all' },
  { to: '/inventory', label: 'Inventory', roles: 'all' },
  { to: '/batches', label: 'Batches', roles: 'all' },
  { to: '/transfers', label: 'Transfers', roles: ['Admin', 'Manager', 'Staff'] },
  { to: '/purchase-orders', label: 'Purchase Orders', roles: ['Admin', 'Manager'] },
  { to: '/sales-orders', label: 'Sales Orders', roles: ['Admin', 'Manager', 'Staff'] },
  { to: '/reorder', label: 'Reorder Rules', roles: ['Admin', 'Manager'] },
  { to: '/forecasts', label: 'Forecasts', roles: ['Admin', 'Manager'] },
  { to: '/alerts', label: 'Alerts', roles: 'all' },
  { to: '/reports', label: 'Reports', roles: ['Admin', 'Manager', 'Auditor'] },
  { to: '/audit', label: 'Audit Log', roles: ['Admin', 'Auditor'] },
  { to: '/users', label: 'Users', roles: ['Admin'] },
  { to: '/settings', label: 'Settings', roles: 'all' },
]

export function canSeeNav(role: Role, item: NavItem) {
  if (item.roles === 'all') return true
  return item.roles.includes(role)
}
