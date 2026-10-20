import { Link, useLocation } from 'react-router-dom'

const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  inventory: 'Inventory',
  batches: 'Batches',
  transfers: 'Transfers',
  'purchase-orders': 'Purchase Orders',
  'sales-orders': 'Sales Orders',
  reorder: 'Reorder Rules',
  forecasts: 'Forecasts',
  alerts: 'Alerts',
  reports: 'Reports',
  audit: 'Audit Log',
  users: 'Users',
  settings: 'Settings',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return null

  return (
    <nav className="hidden text-sm text-muted md:flex md:items-center md:gap-1">
      <Link to="/dashboard" className="hover:text-primary">
        Home
      </Link>
      {parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/')
        const label = labels[part] ?? part
        const last = i === parts.length - 1
        return (
          <span key={path} className="flex items-center gap-1">
            <span>/</span>
            {last ? (
              <span className="font-medium text-text">{label}</span>
            ) : (
              <Link to={path} className="hover:text-primary">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
