import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingDown,
  Clock,
  AlertOctagon,
  Truck,
  RefreshCw,
  Check,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Filter,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  Search,
  Inbox,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'
import {
  markAllAlertsRead as apiMarkAllRead,
  resolveAlert as apiResolveAlert,
} from '../api/endpoints'

// ---------------------------------------------------------------------------
// Types & Definitions
// ---------------------------------------------------------------------------

export type AlertType =
  | 'low_stock'
  | 'expiry_warning'
  | 'expired_batch'
  | 'transfer_suggested'
  | 'sync_conflict'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export type AlertStatus = 'all' | 'unread' | 'read' | 'resolved'

export interface AlertItem {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  type: AlertType
  read: boolean
  resolved: boolean
  createdAt: string
  resolvedAt?: string
  entityType: 'inventory' | 'batches' | 'transfers' | 'audit'
  entityId: string
  entityName?: string
}

// ---------------------------------------------------------------------------
// 20 Mock Alerts Data (spanning today, yesterday, earlier)
// ---------------------------------------------------------------------------

const now = Date.now()
const minsAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString()
const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString()

const initialMockAlerts: AlertItem[] = [
  // --- TODAY ---
  {
    id: 'alt-1',
    title: 'Critical Low Stock: IV Saline 500ml',
    message: 'Only 48 units remain at Cold Store. Minimum safety threshold is 100 units. Emergency reorder recommended.',
    severity: 'critical',
    type: 'low_stock',
    read: false,
    resolved: false,
    createdAt: minsAgo(8),
    entityType: 'inventory',
    entityId: 'SKU-2088',
    entityName: 'Inventory',
  },
  {
    id: 'alt-2',
    title: 'Sync Conflict: Offline Stock Adjustment',
    message: 'Concurrent edits detected on Batch B-9012 between Warehouse A handheld terminal and central database.',
    severity: 'warning',
    type: 'sync_conflict',
    read: false,
    resolved: false,
    createdAt: minsAgo(22),
    entityType: 'audit',
    entityId: 'SYNC-102',
    entityName: 'Audit Log',
  },
  {
    id: 'alt-3',
    title: 'Expiry Warning: Amoxicillin 500mg (Batch B-8102)',
    message: 'Batch B-8102 (320 packs) at Pharmacy Main will expire in 14 days. Prioritize for immediate FEFO dispensing.',
    severity: 'warning',
    type: 'expiry_warning',
    read: false,
    resolved: false,
    createdAt: hoursAgo(1),
    entityType: 'batches',
    entityId: 'B-8102',
    entityName: 'Batches',
  },
  {
    id: 'alt-4',
    title: 'Transfer Suggested: Surgical Gloves (L)',
    message: 'Warehouse A has 450 excess units. Rebalance transfer of 150 units to Clinic North is suggested by stock optimizer.',
    severity: 'info',
    type: 'transfer_suggested',
    read: true,
    resolved: false,
    createdAt: hoursAgo(2),
    entityType: 'transfers',
    entityId: 'TR-2401',
    entityName: 'Transfers',
  },
  {
    id: 'alt-5',
    title: 'Expired Batch Detected: Insulin Glargine',
    message: 'Batch B-7620 (12 vials) at Pharmacy Fridge reached its expiration date today. Immediate quarantine protocol required.',
    severity: 'critical',
    type: 'expired_batch',
    read: false,
    resolved: false,
    createdAt: hoursAgo(3),
    entityType: 'batches',
    entityId: 'B-7620',
    entityName: 'Batches',
  },
  {
    id: 'alt-6',
    title: 'Low Stock: Surgical Gloves (M)',
    message: 'Warehouse A stock is currently at 85 units, approaching the automated replenishment trigger of 100 units.',
    severity: 'warning',
    type: 'low_stock',
    read: true,
    resolved: false,
    createdAt: hoursAgo(5),
    entityType: 'inventory',
    entityId: 'SKU-1042',
    entityName: 'Inventory',
  },
  {
    id: 'alt-7',
    title: 'Transfer Suggested: N95 Respirators',
    message: 'Clinic North inventory depleted due to emergency intake. Route emergency rebalance from Warehouse A.',
    severity: 'info',
    type: 'transfer_suggested',
    read: false,
    resolved: false,
    createdAt: hoursAgo(7),
    entityType: 'transfers',
    entityId: 'TR-2402',
    entityName: 'Transfers',
  },
  {
    id: 'alt-8',
    title: 'Expiry Warning: Epinephrine 1mg/ml Ampoules',
    message: 'Batch B-3109 (50 ampoules) at Crash Cart A enters 25-day expiry window. Rotation scheduled.',
    severity: 'warning',
    type: 'expiry_warning',
    read: false,
    resolved: false,
    createdAt: hoursAgo(10),
    entityType: 'batches',
    entityId: 'B-3109',
    entityName: 'Batches',
  },

  // --- YESTERDAY ---
  {
    id: 'alt-9',
    title: 'Expiry Warning: Heparin Sodium 5000U',
    message: 'Batch B-9044 (85 vials) at Central Hub expires within 21 days. Automated alert flagged for dispensary rotation.',
    severity: 'warning',
    type: 'expiry_warning',
    read: false,
    resolved: false,
    createdAt: hoursAgo(25),
    entityType: 'batches',
    entityId: 'B-9044',
    entityName: 'Batches',
  },
  {
    id: 'alt-10',
    title: 'Critical Low Stock: Bandage Roll 4"',
    message: 'Warehouse B is completely out of stock (0 units on hand). Open PO-991 remains pending vendor dispatch.',
    severity: 'critical',
    type: 'low_stock',
    read: false,
    resolved: false,
    createdAt: hoursAgo(28),
    entityType: 'inventory',
    entityId: 'SKU-3310',
    entityName: 'Inventory',
  },
  {
    id: 'alt-11',
    title: 'Sync Conflict: Supplier Catalog Divergence',
    message: 'Automated supplier price catalog update detected divergence on SKU-1042. Local price protected.',
    severity: 'info',
    type: 'sync_conflict',
    read: true,
    resolved: false,
    createdAt: hoursAgo(31),
    entityType: 'audit',
    entityId: 'SYNC-103',
    entityName: 'Audit Log',
  },
  {
    id: 'alt-12',
    title: 'Expired Batch: Povidone Iodine 10%',
    message: 'Batch B-6511 (40 bottles) has passed shelf-life limit. Successfully isolated in bio-hazard disposal bin.',
    severity: 'critical',
    type: 'expired_batch',
    read: true,
    resolved: true,
    resolvedAt: 'Yesterday at 4:15 PM',
    createdAt: hoursAgo(36),
    entityType: 'batches',
    entityId: 'B-6511',
    entityName: 'Batches',
  },
  {
    id: 'alt-13',
    title: 'Transfer Suggested: Paracetamol Tablets 500mg',
    message: 'Clinic South has 1,200 surplus units. Transfer of 400 units to ER Bay completed and acknowledged.',
    severity: 'info',
    type: 'transfer_suggested',
    read: true,
    resolved: true,
    resolvedAt: 'Yesterday at 2:00 PM',
    createdAt: hoursAgo(40),
    entityType: 'transfers',
    entityId: 'TR-2398',
    entityName: 'Transfers',
  },

  // --- EARLIER ---
  {
    id: 'alt-14',
    title: 'Critical Low Stock: Paracetamol Infusion 100ml',
    message: 'Stock level reached emergency low (15 bags). Daily ICU usage required emergency expedited shipment.',
    severity: 'critical',
    type: 'low_stock',
    read: true,
    resolved: true,
    resolvedAt: '3 days ago',
    createdAt: daysAgo(3),
    entityType: 'inventory',
    entityId: 'SKU-2090',
    entityName: 'Inventory',
  },
  {
    id: 'alt-15',
    title: 'Expiry Warning: Sterile Gauze Pads 4x4',
    message: 'Batch B-5421 (150 boxes) reached 30-day expiration threshold. FEFO pick list prioritized.',
    severity: 'warning',
    type: 'expiry_warning',
    read: true,
    resolved: false,
    createdAt: daysAgo(4),
    entityType: 'batches',
    entityId: 'B-5421',
    entityName: 'Batches',
  },
  {
    id: 'alt-16',
    title: 'Sync Conflict: Location Transfer Sequence Mismatch',
    message: 'Offline queue replayed out-of-order sequence #15847. Merged automatically using audit log chain.',
    severity: 'warning',
    type: 'sync_conflict',
    read: true,
    resolved: false,
    createdAt: daysAgo(5),
    entityType: 'audit',
    entityId: 'SYNC-104',
    entityName: 'Audit Log',
  },
  {
    id: 'alt-17',
    title: 'Expired Batch: Sodium Chloride Flush Syringes',
    message: 'Batch B-4211 expired. Marked as quarantined and removed from pickable inventory.',
    severity: 'critical',
    type: 'expired_batch',
    read: true,
    resolved: true,
    resolvedAt: '6 days ago',
    createdAt: daysAgo(6),
    entityType: 'batches',
    entityId: 'B-4211',
    entityName: 'Batches',
  },
  {
    id: 'alt-18',
    title: 'Transfer Suggested: Disposable Syringes 5ml',
    message: 'Stock optimization algorithm detected uneven distribution across Warehouse A and Clinic South.',
    severity: 'info',
    type: 'transfer_suggested',
    read: true,
    resolved: true,
    resolvedAt: '7 days ago',
    createdAt: daysAgo(7),
    entityType: 'transfers',
    entityId: 'TR-2390',
    entityName: 'Transfers',
  },
  {
    id: 'alt-19',
    title: 'Low Stock: Ciprofloxacin Eye Drops',
    message: 'Available inventory down to 22 units against reorder point of 50 units. Supplier lead time is 4 days.',
    severity: 'warning',
    type: 'low_stock',
    read: true,
    resolved: false,
    createdAt: daysAgo(9),
    entityType: 'inventory',
    entityId: 'SKU-4412',
    entityName: 'Inventory',
  },
  {
    id: 'alt-20',
    title: 'Critical Low Stock: Ceftriaxone 1g Injection',
    message: 'Zero vials left in Main Pharmacy. Reorder PO-871 initiated with guaranteed next-day delivery.',
    severity: 'critical',
    type: 'low_stock',
    read: true,
    resolved: true,
    resolvedAt: '11 days ago',
    createdAt: daysAgo(12),
    entityType: 'inventory',
    entityId: 'SKU-5520',
    entityName: 'Inventory',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  low_stock: 'Low Stock',
  expiry_warning: 'Expiry Warning',
  expired_batch: 'Expired Batch',
  transfer_suggested: 'Transfer Suggested',
  sync_conflict: 'Sync Conflict',
}

const ALL_ALERT_TYPES: AlertType[] = [
  'low_stock',
  'expiry_warning',
  'expired_batch',
  'transfer_suggested',
  'sync_conflict',
]

function getGroupKey(dateStr: string): 'Today' | 'Yesterday' | 'Earlier' {
  const date = new Date(dateStr)
  const nowDate = new Date()

  const startOfToday = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
  ).getTime()
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000
  const itemTime = date.getTime()

  if (itemTime >= startOfToday) {
    return 'Today'
  }
  if (itemTime >= startOfYesterday) {
    return 'Yesterday'
  }
  return 'Earlier'
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const nowDate = new Date()
  const diffMs = nowDate.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (60 * 1000))
  const diffHours = Math.floor(diffMs / (3600 * 1000))
  const diffDays = Math.floor(diffMs / (86400 * 1000))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays === 1) {
    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return `Yesterday at ${timeStr}`
  }
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function getTypeIcon(type: AlertType) {
  switch (type) {
    case 'low_stock':
      return <TrendingDown className="h-5 w-5 text-amber-600" />
    case 'expiry_warning':
      return <Clock className="h-5 w-5 text-amber-600" />
    case 'expired_batch':
      return <AlertOctagon className="h-5 w-5 text-red-600" />
    case 'transfer_suggested':
      return <Truck className="h-5 w-5 text-blue-600" />
    case 'sync_conflict':
      return <RefreshCw className="h-5 w-5 text-purple-600" />
  }
}

function getTypeIconBg(type: AlertType) {
  switch (type) {
    case 'low_stock':
      return 'bg-amber-100 text-amber-700'
    case 'expiry_warning':
      return 'bg-amber-100 text-amber-700'
    case 'expired_batch':
      return 'bg-red-100 text-red-700'
    case 'transfer_suggested':
      return 'bg-blue-100 text-blue-700'
    case 'sync_conflict':
      return 'bg-purple-100 text-purple-700'
  }
}

function getEntityNav(alert: AlertItem): { path: string; label: string } {
  switch (alert.type) {
    case 'low_stock':
      return { path: '/inventory', label: 'Go to Inventory' }
    case 'expiry_warning':
    case 'expired_batch':
      return { path: '/batches', label: 'Go to Batches' }
    case 'transfer_suggested':
      return { path: '/transfers', label: 'Go to Transfers' }
    case 'sync_conflict':
      return { path: '/audit', label: 'Go to Audit Log' }
  }
}

function getSeverityBarColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500'
    case 'warning':
      return 'bg-amber-400'
    case 'info':
      return 'bg-blue-400'
  }
}

function getSeverityChipTone(severity: AlertSeverity): 'expired' | 'warning' | 'info' {
  switch (severity) {
    case 'critical':
      return 'expired'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AlertsPage() {
  const { toast } = useToast()

  // State
  const [alerts, setAlerts] = useState<AlertItem[]>(initialMockAlerts)
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Filter States
  const [selectedTypes, setSelectedTypes] = useState<Set<AlertType>>(
    new Set(ALL_ALERT_TYPES),
  )
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all')
  const [statusFilter, setStatusFilter] = useState<AlertStatus>('all')

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [])

  // Counts for filter panel
  const filterStats = useMemo(() => {
    const counts = {
      total: alerts.length,
      unread: alerts.filter((a) => !a.read).length,
      read: alerts.filter((a) => a.read && !a.resolved).length,
      resolved: alerts.filter((a) => a.resolved).length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
      byType: {} as Record<AlertType, number>,
    }

    ALL_ALERT_TYPES.forEach((type) => {
      counts.byType[type] = alerts.filter((a) => a.type === type).length
    })

    return counts
  }, [alerts])

  // Filter & Search Logic
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Type filter
      if (!selectedTypes.has(alert.type)) {
        return false
      }

      // Severity filter
      if (severityFilter !== 'all' && alert.severity !== severityFilter) {
        return false
      }

      // Status filter
      if (statusFilter === 'unread' && alert.read) {
        return false
      }
      if (statusFilter === 'read' && (!alert.read || alert.resolved)) {
        return false
      }
      if (statusFilter === 'resolved' && !alert.resolved) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesTitle = alert.title.toLowerCase().includes(query)
        const matchesMessage = alert.message.toLowerCase().includes(query)
        const matchesEntity = alert.entityId.toLowerCase().includes(query)
        const matchesType = ALERT_TYPE_LABELS[alert.type].toLowerCase().includes(query)
        if (!matchesTitle && !matchesMessage && !matchesEntity && !matchesType) {
          return false
        }
      }

      return true
    })
  }, [alerts, selectedTypes, severityFilter, statusFilter, searchQuery])

  // Group filtered alerts by date ("Today", "Yesterday", "Earlier")
  const groupedAlerts = useMemo(() => {
    const groups: {
      Today: AlertItem[]
      Yesterday: AlertItem[]
      Earlier: AlertItem[]
    } = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    }

    filteredAlerts.forEach((alert) => {
      const groupKey = getGroupKey(alert.createdAt)
      groups[groupKey].push(alert)
    })

    return groups
  }, [filteredAlerts])

  // Handlers
  const handleToggleType = useCallback((type: AlertType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        // Prevent unchecking all if user clicks last one
        if (next.size > 1) {
          next.delete(type)
        } else {
          toast('At least one alert type must remain selected', 'warning')
          return prev
        }
      } else {
        next.add(type)
      }
      return next
    })
  }, [toast])

  const handleSelectAllTypes = useCallback(() => {
    setSelectedTypes(new Set(ALL_ALERT_TYPES))
  }, [])

  const handleResetFilters = useCallback(() => {
    setSelectedTypes(new Set(ALL_ALERT_TYPES))
    setSeverityFilter('all')
    setStatusFilter('all')
    setSearchQuery('')
    toast('Filters have been reset', 'info')
  }, [toast])

  const handleMarkRead = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
    )
    toast('Alert marked as read', 'success')
  }, [toast])

  const handleResolve = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              resolved: true,
              read: true,
              resolvedAt: 'Just now',
            }
          : a,
      ),
    )
    // Synchronize with API mock backend
    apiResolveAlert(id).catch(() => {})
    toast('Alert marked as resolved', 'success')
  }, [toast])

  const handleMarkAllRead = useCallback(() => {
    const unreadCount = alerts.filter((a) => !a.read).length
    if (unreadCount === 0) {
      toast('All alerts are already marked as read', 'info')
      return
    }

    setAlerts((prev) =>
      prev.map((a) => ({
        ...a,
        read: true,
      })),
    )
    // Synchronize with API mock backend
    apiMarkAllRead().catch(() => {})
    toast(`All ${unreadCount} alerts marked as read`, 'success')
  }, [alerts, toast])

  const isFiltersModified =
    selectedTypes.size !== ALL_ALERT_TYPES.length ||
    severityFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim().length > 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Alerts & Notifications"
        subtitle="Real-time alerts, critical thresholds, and automated stock optimization suggestions"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<CheckCheck className="h-4 w-4 text-primary" />}
              onClick={handleMarkAllRead}
              disabled={filterStats.unread === 0}
            >
              Mark All Read
              {filterStats.unread > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {filterStats.unread}
                </span>
              )}
            </Button>
          </div>
        }
      />

      {/* Main Two-Column Layout */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* =================================================================== */}
        {/* Left Sidebar (35%, Sticky)                                           */}
        {/* =================================================================== */}
        <aside className="w-full shrink-0 lg:w-[35%] lg:sticky lg:top-6 self-start space-y-4">
          <Card padding className="space-y-6">
            {/* Header with Clear Button */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-text" />
                <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
                  Filters
                </h2>
                {isFiltersModified && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Active
                  </span>
                )}
              </div>
              {isFiltersModified && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors font-medium"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset all
                </button>
              )}
            </div>

            {/* Quick Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Filter by keyword, SKU, batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-[8px] border border-border bg-app pl-9 pr-3 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-xs text-muted hover:text-text"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Section 1: Alert Type Checkboxes */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Alert Type
                </span>
                {selectedTypes.size < ALL_ALERT_TYPES.length ? (
                  <button
                    type="button"
                    onClick={handleSelectAllTypes}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Select All
                  </button>
                ) : null}
              </div>

              <div className="space-y-1.5">
                {ALL_ALERT_TYPES.map((type) => {
                  const isChecked = selectedTypes.has(type)
                  const count = filterStats.byType[type] || 0
                  return (
                    <label
                      key={type}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-[8px] border px-3 py-2 text-sm transition-all select-none',
                        isChecked
                          ? 'border-primary/40 bg-primary/5 text-text font-medium'
                          : 'border-transparent text-muted hover:bg-app',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleType(type)}
                          className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                        />
                        <span className="truncate">{ALERT_TYPE_LABELS[type]}</span>
                      </div>
                      <span
                        className={cn(
                          'ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                          isChecked
                            ? 'bg-primary/15 text-primary'
                            : 'bg-border/60 text-muted',
                        )}
                      >
                        {count}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Section 2: Severity Toggles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Severity
                </span>
                <span className="text-[11px] text-muted">
                  {severityFilter === 'all' ? 'All' : severityFilter}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 rounded-[8px] border border-border bg-app p-1 text-xs">
                {(['all', 'info', 'warning', 'critical'] as const).map((sev) => {
                  const isActive = severityFilter === sev
                  const label = sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverityFilter(sev)}
                      className={cn(
                        'flex items-center justify-center gap-1 rounded-[6px] py-1.5 font-medium transition-all capitalize',
                        isActive
                          ? 'bg-surface text-text shadow-sm border border-border'
                          : 'text-muted hover:text-text hover:bg-surface/50',
                      )}
                    >
                      {sev === 'critical' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      )}
                      {sev === 'warning' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      )}
                      {sev === 'info' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      )}
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section 3: Status Toggles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Status
                </span>
                <span className="text-[11px] text-muted capitalize">{statusFilter}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 rounded-[8px] border border-border bg-app p-1 text-xs">
                {(['all', 'unread', 'read', 'resolved'] as const).map((status) => {
                  const isActive = statusFilter === status
                  const label =
                    status === 'all'
                      ? 'All'
                      : status.charAt(0).toUpperCase() + status.slice(1)
                  const count =
                    status === 'all'
                      ? filterStats.total
                      : status === 'unread'
                        ? filterStats.unread
                        : status === 'read'
                          ? filterStats.read
                          : filterStats.resolved

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-[6px] py-1.5 font-medium transition-all',
                        isActive
                          ? 'bg-surface text-text shadow-sm border border-border'
                          : 'text-muted hover:text-text hover:bg-surface/50',
                      )}
                    >
                      <span>{label}</span>
                      <span className="text-[10px] opacity-75 font-normal">({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sidebar Summary Card */}
            <div className="rounded-[8px] border border-border bg-app/60 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-muted">
                <span>Total visible alerts</span>
                <span className="font-semibold text-text">{filteredAlerts.length}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Requires attention</span>
                <span className="font-semibold text-error">
                  {alerts.filter((a) => !a.resolved && a.severity === 'critical').length} critical
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Unread notifications</span>
                <span className="font-semibold text-primary">{filterStats.unread}</span>
              </div>
            </div>
          </Card>
        </aside>

        {/* =================================================================== */}
        {/* Right Area (65%): Scrollable Alert Cards                              */}
        {/* =================================================================== */}
        <main className="w-full min-w-0 flex-1 lg:w-[65%] space-y-6">
          {/* Active filters / count summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
            <div className="text-muted text-xs sm:text-sm">
              Showing <span className="font-semibold text-text">{filteredAlerts.length}</span> of{' '}
              <span className="font-semibold text-text">{alerts.length}</span> alerts
            </div>
            {isFiltersModified && (
              <Button
                variant="ghost"
                className="h-7 text-xs px-2 text-muted hover:text-primary"
                icon={<RotateCcw className="h-3 w-3" />}
                onClick={handleResetFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Loading Shimmer Skeletons */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-[12px] border border-border bg-surface p-5 shadow-[var(--shadow-card)] animate-pulse"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-300" />
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-48 rounded bg-slate-200" />
                        <div className="h-4 w-20 rounded bg-slate-200" />
                      </div>
                      <div className="h-3.5 w-full rounded bg-slate-200" />
                      <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                      <div className="flex items-center justify-between pt-2">
                        <div className="h-3 w-28 rounded bg-slate-200" />
                        <div className="flex gap-2">
                          <div className="h-8 w-20 rounded bg-slate-200" />
                          <div className="h-8 w-24 rounded bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            /* Empty State */
            <Card padding className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app border border-border text-muted">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-text">No alerts found</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                No alerts match your current filter selections. Try modifying your filters or clearing
                the search.
              </p>
              {isFiltersModified && (
                <div className="mt-5">
                  <Button
                    variant="secondary"
                    icon={<RotateCcw className="h-4 w-4" />}
                    onClick={handleResetFilters}
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            /* Grouped Alert Cards ("Today", "Yesterday", "Earlier") */
            <div className="space-y-8">
              {(['Today', 'Yesterday', 'Earlier'] as const).map((groupTitle) => {
                const groupItems = groupedAlerts[groupTitle]
                if (groupItems.length === 0) return null

                const groupUnreadCount = groupItems.filter((a) => !a.read).length

                return (
                  <section key={groupTitle} className="space-y-3">
                    {/* Date Group Header */}
                    <div className="flex items-center justify-between border-b border-border/80 pb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                          {groupTitle}
                        </h3>
                        <span className="rounded-full bg-border/80 px-2 py-0.5 text-xs font-medium text-muted">
                          {groupItems.length}
                        </span>
                      </div>
                      {groupUnreadCount > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          {groupUnreadCount} unread
                        </span>
                      )}
                    </div>

                    {/* Cards in this Date Group */}
                    <div className="space-y-3">
                      {groupItems.map((alert) => {
                        const isUnread = !alert.read
                        const isResolved = alert.resolved
                        const entityNav = getEntityNav(alert)
                        const severityBarColor = getSeverityBarColor(alert.severity)
                        const severityChipTone = getSeverityChipTone(alert.severity)

                        return (
                          <div
                            key={alert.id}
                            className={cn(
                              'relative overflow-hidden rounded-[12px] border transition-all duration-200 shadow-[var(--shadow-card)]',
                              // Unread styling: faint blue bg + border, Read: bg-surface
                              isUnread
                                ? 'border-blue-200 bg-blue-50/60 ring-1 ring-blue-100'
                                : 'border-border bg-surface',
                              isResolved && 'opacity-90',
                            )}
                          >
                            {/* Left Colored Severity Bar */}
                            <div
                              className={cn(
                                'absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[12px]',
                                severityBarColor,
                              )}
                              title={`Severity: ${alert.severity}`}
                            />

                            <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                              <div className="flex items-start gap-3.5">
                                {/* Type Icon */}
                                <div
                                  className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] shadow-xs',
                                    getTypeIconBg(alert.type),
                                  )}
                                >
                                  {getTypeIcon(alert.type)}
                                </div>

                                {/* Content Details */}
                                <div className="min-w-0 flex-1">
                                  {/* Top meta tags */}
                                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <Chip
                                      label={ALERT_TYPE_LABELS[alert.type]}
                                      tone={
                                        alert.type === 'expired_batch'
                                          ? 'expired'
                                          : alert.type === 'transfer_suggested'
                                            ? 'info'
                                            : alert.type === 'sync_conflict'
                                              ? 'neutral'
                                              : 'warning'
                                      }
                                    />
                                    <Chip
                                      label={alert.severity.toUpperCase()}
                                      tone={severityChipTone}
                                    />
                                    {isResolved && (
                                      <Chip label="Resolved" tone="good" />
                                    )}
                                    <span className="text-xs text-muted font-mono ml-auto">
                                      {alert.entityId}
                                    </span>
                                  </div>

                                  {/* Bold Title + Blue Dot */}
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm sm:text-base font-semibold text-text flex items-center gap-2">
                                      {alert.title}
                                      {isUnread && (
                                        <span
                                          className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 shrink-0"
                                          title="Unread alert"
                                        />
                                      )}
                                    </h4>
                                  </div>

                                  {/* Message Body */}
                                  <p className="mt-1 text-xs sm:text-sm text-muted leading-relaxed">
                                    {alert.message}
                                  </p>

                                  {/* Card Footer: Timestamp & Action Buttons */}
                                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/60 pt-3">
                                    <div className="flex items-center gap-2 text-xs text-muted">
                                      <span className="flex items-center gap-1 font-medium">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatRelativeTime(alert.createdAt)}
                                      </span>
                                      {alert.resolvedAt && (
                                        <>
                                          <span>•</span>
                                          <span className="text-green-700 font-medium">
                                            Resolved {alert.resolvedAt}
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* Contextual Nav Link */}
                                      <Link to={entityNav.path}>
                                        <Button
                                          variant="secondary"
                                          className="h-8 text-xs px-2.5 py-1"
                                          icon={<ExternalLink className="h-3.5 w-3.5" />}
                                        >
                                          {entityNav.label}
                                        </Button>
                                      </Link>

                                      {/* Mark Read Button (only if unread) */}
                                      {isUnread && (
                                        <Button
                                          variant="ghost"
                                          className="h-8 text-xs px-2.5 py-1 text-muted hover:text-text hover:bg-app"
                                          icon={<Eye className="h-3.5 w-3.5" />}
                                          onClick={() => handleMarkRead(alert.id)}
                                        >
                                          Mark Read
                                        </Button>
                                      )}

                                      {/* Resolve Button (only if not resolved) */}
                                      {!isResolved && (
                                        <Button
                                          variant="secondary"
                                          className="h-8 text-xs px-2.5 py-1 hover:border-green-300 hover:bg-green-50 hover:text-green-800"
                                          icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                                          onClick={() => handleResolve(alert.id)}
                                        >
                                          Resolve
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
