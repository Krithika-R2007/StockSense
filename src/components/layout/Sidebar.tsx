import { NavLink } from 'react-router-dom'
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { canSeeNav, navItems } from '../../auth/rbac'
import { cn } from '../../lib/cn'

const icons: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  Products: Package,
  Inventory: Warehouse,
  Batches: Boxes,
  Transfers: ArrowLeftRight,
  'Purchase Orders': ShoppingCart,
  'Sales Orders': ClipboardList,
  'Reorder Rules': TrendingUp,
  Forecasts: BarChart3,
  Alerts: Bell,
  Reports: BarChart3,
  'Audit Log': Shield,
  Users: Users,
  Settings: Settings,
}

type Props = { collapsed: boolean; onCollapse: () => void }

export function Sidebar({ collapsed, onCollapse }: Props) {
  const { user } = useAuth()
  const role = user?.role ?? 'Staff'
  const visible = navItems.filter((item) => canSeeNav(role, item))

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-surface transition-[width]',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-primary text-sm font-bold text-white">
          SI
        </div>
        {!collapsed ? (
          <span className="truncate text-sm font-semibold">Smart Inventory</span>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {visible.map(({ to, label }) => {
          const Icon = icons[label] ?? Package
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium',
                  isActive
                    ? 'border-l-[3px] border-primary bg-primary/10 text-primary'
                    : 'border-l-[3px] border-transparent text-muted hover:bg-app',
                  collapsed && 'justify-center px-2',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span>{label}</span> : null}
            </NavLink>
          )
        })}
      </nav>
      <button
        type="button"
        onClick={onCollapse}
        className="border-t border-border p-3 text-center text-xs text-muted hover:bg-app"
      >
        {collapsed ? '»' : '« Collapse'}
      </button>
    </aside>
  )
}
