import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useOffline } from '../../offline/OfflineContext'
import { LocationProvider } from '../../context/LocationContext'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

function ShellInner() {
  const [collapsed, setCollapsed] = useState(false)
  const { online, cachedSession, readOnly } = useOffline()
  const [locationId, setLocationId] = useState('all')

  return (
    <LocationProvider locationId={locationId}>
      <div className="flex h-full min-h-screen flex-col bg-app">
        {!online ? (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
            ⚠ You&apos;re offline.
            {cachedSession
              ? ' Last cached session restored — read-only where noted.'
              : ' Changes will sync when reconnected.'}
          </div>
        ) : null}
        {readOnly && online ? null : null}
        <div className="flex min-h-0 flex-1">
          <Sidebar
            collapsed={collapsed}
            onCollapse={() => setCollapsed((c) => !c)}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              onMenuClick={() => setCollapsed((c) => !c)}
              locationId={locationId}
              onLocationChange={setLocationId}
            />
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </LocationProvider>
  )
}

export function AppShell() {
  return <ShellInner />
}
