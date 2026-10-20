import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Cloud,
  CloudOff,
  Loader2,
  Menu,
  Search,
} from 'lucide-react'
import { fetchAlerts, markAllAlertsRead, type Alert } from '../../api/endpoints'
import { useAuth } from '../../auth/AuthContext'
import { useOffline } from '../../offline/OfflineContext'
import { Breadcrumbs } from './Breadcrumbs'

type Props = {
  onMenuClick: () => void
  locationId: string
  onLocationChange: (id: string) => void
}

export function TopBar({ onMenuClick, locationId, onLocationChange }: Props) {
  const { user, logout } = useAuth()
  const { online, pending, syncing, syncNow } = useOffline()
  const navigate = useNavigate()
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const unread = alerts.filter((a) => !a.read && !a.resolved).length

  useEffect(() => {
    fetchAlerts(true).then(setAlerts).catch(() => undefined)
  }, [alertsOpen])

  async function handleMarkAllRead() {
    await markAllAlertsRead()
    setAlerts((a) => a.map((x) => ({ ...x, read: true })))
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <header className="relative flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-[8px] p-2 text-muted hover:bg-app"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumbs />
        <div className="ml-auto flex items-center gap-2">
          {searchOpen ? (
            <input
              autoFocus
              placeholder="Search products, batches…"
              className="hidden h-9 w-48 rounded-[8px] border border-border px-2 text-sm md:block lg:w-64"
              onBlur={() => setSearchOpen(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="rounded-[8px] p-2 text-muted hover:bg-app"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          )}
          <select
            value={locationId}
            onChange={(e) => onLocationChange(e.target.value)}
            className="hidden h-9 max-w-[140px] rounded-[8px] border border-border px-2 text-xs sm:block"
            aria-label="Location"
          >
            <option value="all">All locations</option>
            <option value="loc-a">Warehouse A</option>
            <option value="loc-cold">Cold Store</option>
          </select>
          {pending.length > 0 ? (
            <button
              type="button"
              onClick={() => void syncNow()}
              className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-amber-800"
            >
              {pending.length} pending
            </button>
          ) : null}
          <span title={online ? 'Online' : 'Offline'}>
            {syncing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : online ? (
              <Cloud className="h-5 w-5 text-success" />
            ) : (
              <CloudOff className="h-5 w-5 text-warning" />
            )}
          </span>
          <button
            type="button"
            onClick={() => setAlertsOpen(true)}
            className="relative rounded-[8px] p-2 text-muted hover:bg-app"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] text-white">
                {unread}
              </span>
            ) : null}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
            >
              {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
            </button>
            {profileOpen ? (
              <div className="absolute right-0 top-11 z-20 w-48 rounded-[8px] border border-border bg-surface py-1 shadow-lg">
                <Link
                  to="/settings"
                  className="block px-3 py-2 text-sm hover:bg-app"
                  onClick={() => setProfileOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-3 py-2 text-sm hover:bg-app"
                  onClick={() => setProfileOpen(false)}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-app"
                >
                  Help & Docs
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="block w-full px-3 py-2 text-left text-sm text-error hover:bg-app"
                >
                  Log Out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {alertsOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setAlertsOpen(false)}
            aria-label="Close notifications"
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-semibold">Notifications</h2>
              <button
                type="button"
                className="text-sm text-primary"
                onClick={() => void handleMarkAllRead()}
              >
                Mark All Read
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto divide-y divide-border">
              {alerts.map((a) => (
                <li key={a.id} className="p-4 text-sm">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-muted">{a.message}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-4">
              <Link to="/alerts" className="text-sm font-medium text-primary">
                View All Alerts
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
