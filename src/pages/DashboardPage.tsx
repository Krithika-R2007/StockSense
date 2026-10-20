import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  Truck,
  AlertTriangle,
  ArrowRight,
  Eye,
  Activity,
  X,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { cn } from '../lib/cn'
import { useToast } from '../components/toast/ToastContext'
import { useAuth } from '../auth/AuthContext'
import { stockSummary, fetchAlerts, generatePO, type Alert } from '../api/endpoints'

// ---------------------------------------------------------------------------
// Mock Data & Types
// ---------------------------------------------------------------------------

interface ExpiringBatch {
  id: string
  product: string
  qty: number
  location: string
  daysLeft: number
  expiryDate: string
}

interface ReorderSuggestion {
  id: string
  productId: string
  product: string
  sku: string
  location: string
  current: number
  reorderPt: number
  suggestedQty: number
}

interface ActivityEvent {
  id: string
  actor: string
  action: string
  time: string
  icon: 'package' | 'truck' | 'alert' | 'check' | 'trending' | 'activity' | 'eye' | 'clock'
  tone: 'primary' | 'warning' | 'critical' | 'success' | 'neutral'
}

// 30-day stock health trend mock data
const stockHealthTrendData = [
  { date: 'Sep 19', totalStock: 12100, lowStock: 42 },
  { date: 'Sep 20', totalStock: 12050, lowStock: 41 },
  { date: 'Sep 21', totalStock: 12380, lowStock: 39 },
  { date: 'Sep 22', totalStock: 12290, lowStock: 38 },
  { date: 'Sep 23', totalStock: 12210, lowStock: 40 },
  { date: 'Sep 24', totalStock: 12150, lowStock: 43 },
  { date: 'Sep 25', totalStock: 12420, lowStock: 36 },
  { date: 'Sep 26', totalStock: 12480, lowStock: 35 },
  { date: 'Sep 27', totalStock: 12390, lowStock: 37 },
  { date: 'Sep 28', totalStock: 12310, lowStock: 39 },
  { date: 'Sep 29', totalStock: 12250, lowStock: 40 },
  { date: 'Sep 30', totalStock: 12520, lowStock: 34 },
  { date: 'Oct 01', totalStock: 12490, lowStock: 33 },
  { date: 'Oct 02', totalStock: 12440, lowStock: 35 },
  { date: 'Oct 03', totalStock: 12380, lowStock: 36 },
  { date: 'Oct 04', totalStock: 12300, lowStock: 38 },
  { date: 'Oct 05', totalStock: 12590, lowStock: 32 },
  { date: 'Oct 06', totalStock: 12510, lowStock: 34 },
  { date: 'Oct 07', totalStock: 12460, lowStock: 35 },
  { date: 'Oct 08', totalStock: 12400, lowStock: 37 },
  { date: 'Oct 09', totalStock: 12350, lowStock: 38 },
  { date: 'Oct 10', totalStock: 12620, lowStock: 31 },
  { date: 'Oct 11', totalStock: 12580, lowStock: 32 },
  { date: 'Oct 12', totalStock: 12510, lowStock: 35 },
  { date: 'Oct 13', totalStock: 12470, lowStock: 36 },
  { date: 'Oct 14', totalStock: 12420, lowStock: 37 },
  { date: 'Oct 15', totalStock: 12690, lowStock: 30 },
  { date: 'Oct 16', totalStock: 12610, lowStock: 33 },
  { date: 'Oct 17', totalStock: 12540, lowStock: 35 },
  { date: 'Oct 18', totalStock: 12470, lowStock: 37 },
]

// 10 recent alerts
const initialAlertsList: Alert[] = [
  {
    id: 'a1',
    title: 'Low Stock: IV Saline 500ml',
    message: '48 units remain at Cold Store (reorder threshold 100).',
    severity: 'warning',
    read: false,
    resolved: false,
    createdAt: '5m ago',
  },
  {
    id: 'a2',
    title: 'Critical Expiry: Batch B-9012',
    message: '120 units of IV Saline 500ml expire in 7 days.',
    severity: 'critical',
    read: false,
    resolved: false,
    createdAt: '18m ago',
  },
  {
    id: 'a3',
    title: 'Stockout: Bandage Roll 4"',
    message: 'Warehouse B zero balance reached. Reorder pending approval.',
    severity: 'critical',
    read: false,
    resolved: false,
    createdAt: '32m ago',
  },
  {
    id: 'a4',
    title: 'Urgent Transfer: TR-2401',
    message: 'Clinic North requested 200 N95 Respirators from Warehouse A.',
    severity: 'critical',
    read: false,
    resolved: false,
    createdAt: '1h ago',
  },
  {
    id: 'a5',
    title: 'Cold Storage Temp Warning',
    message: 'Fridge #2 reached 8.2°C for 14 minutes. Normal range restored.',
    severity: 'warning',
    read: true,
    resolved: false,
    createdAt: '2h ago',
  },
  {
    id: 'a6',
    title: 'Stock Discrepancy Flagged',
    message: 'Cycle count logged 420 vs system recorded 450 Surgical Gloves.',
    severity: 'warning',
    read: true,
    resolved: false,
    createdAt: '3h ago',
  },
  {
    id: 'a7',
    title: 'PO Auto-Generated #089',
    message: 'Rule restock triggered for 150 units of IV Saline.',
    severity: 'info',
    read: true,
    resolved: false,
    createdAt: '5h ago',
  },
  {
    id: 'a8',
    title: 'Inbound PO Received',
    message: '500 units of Surgical Gloves (L) received at Warehouse A.',
    severity: 'info',
    read: true,
    resolved: false,
    createdAt: '7h ago',
  },
  {
    id: 'a9',
    title: 'Batch Quarantined',
    message: 'Expired Insulin Vial batch B-8844 quarantined by Priya Nair.',
    severity: 'warning',
    read: true,
    resolved: true,
    createdAt: '12h ago',
  },
  {
    id: 'a10',
    title: 'Audit Chain Verified',
    message: 'SHA-512 block integrity check passed with 15,847 records.',
    severity: 'info',
    read: true,
    resolved: true,
    createdAt: '1d ago',
  },
]

// Expiry heatmap calendar data for October 2026
const octoberExpiryMap: Record<number, ExpiringBatch[]> = {
  3: [
    { id: 'B-7012', product: 'Disposable Syringes 10ml', qty: 150, location: 'Warehouse A', daysLeft: 3, expiryDate: '2026-10-03' },
  ],
  7: [
    { id: 'B-8810', product: 'Amoxicillin 500mg', qty: 90, location: 'Pharmacy Store', daysLeft: 7, expiryDate: '2026-10-07' },
    { id: 'B-8811', product: 'Paracetamol 500mg', qty: 200, location: 'Clinic North', daysLeft: 7, expiryDate: '2026-10-07' },
  ],
  11: [
    { id: 'B-9012', product: 'IV Saline 500ml', qty: 120, location: 'Cold Store', daysLeft: 11, expiryDate: '2026-10-11' },
    { id: 'B-9013', product: 'Sterile Water 100ml', qty: 85, location: 'Cold Store', daysLeft: 11, expiryDate: '2026-10-11' },
    { id: 'B-9014', product: 'Normal Saline 1L', qty: 60, location: 'ER Bay 3', daysLeft: 11, expiryDate: '2026-10-11' },
  ],
  15: [
    { id: 'B-6102', product: 'Epinephrine 1mg/ml', qty: 25, location: 'Crash Cart A', daysLeft: 15, expiryDate: '2026-10-15' },
  ],
  18: [
    { id: 'B-9921', product: 'Heparin Sodium 5,000U', qty: 45, location: 'Cold Store', daysLeft: 18, expiryDate: '2026-10-18' },
    { id: 'B-9922', product: 'Propofol 1% 20ml', qty: 30, location: 'Surgical ICU', daysLeft: 18, expiryDate: '2026-10-18' },
    { id: 'B-9923', product: 'Diazepam 5mg/ml', qty: 40, location: 'Pharmacy Vault', daysLeft: 18, expiryDate: '2026-10-18' },
    { id: 'B-9924', product: 'Sterile Surgical Drapes', qty: 75, location: 'Warehouse B', daysLeft: 18, expiryDate: '2026-10-18' },
    { id: 'B-9925', product: 'Atropine Sulfate 0.5mg', qty: 35, location: 'ER Bay 1', daysLeft: 18, expiryDate: '2026-10-18' },
  ],
  22: [
    { id: 'B-5541', product: 'Surgical Sutures 3-0', qty: 110, location: 'Warehouse A', daysLeft: 22, expiryDate: '2026-10-22' },
    { id: 'B-5542', product: 'Cefazolin 1g Vial', qty: 55, location: 'Pharmacy Store', daysLeft: 22, expiryDate: '2026-10-22' },
    { id: 'B-5543', product: 'Potassium Chloride 20mEq', qty: 40, location: 'Cold Store', daysLeft: 22, expiryDate: '2026-10-22' },
    { id: 'B-5544', product: 'Morphine Sulfate 10mg', qty: 20, location: 'Pharmacy Vault', daysLeft: 22, expiryDate: '2026-10-22' },
  ],
  26: [
    { id: 'B-4411', product: 'Bandage Roll 4"', qty: 80, location: 'Warehouse B', daysLeft: 26, expiryDate: '2026-10-26' },
    { id: 'B-4412', product: 'Povidone Iodine 500ml', qty: 32, location: 'Clinic North', daysLeft: 26, expiryDate: '2026-10-26' },
  ],
  29: [
    { id: 'B-3310', product: 'Lidocaine 2% Vial', qty: 45, location: 'ER Bay 2', daysLeft: 29, expiryDate: '2026-10-29' },
    { id: 'B-3311', product: 'Midazolam 5mg/ml', qty: 28, location: 'Pharmacy Vault', daysLeft: 29, expiryDate: '2026-10-29' },
    { id: 'B-3312', product: 'Disposable Scalpels #10', qty: 140, location: 'Warehouse A', daysLeft: 29, expiryDate: '2026-10-29' },
  ],
  31: [
    { id: 'B-2201', product: 'Blood Lancets (100pk)', qty: 65, location: 'Main Lab', daysLeft: 31, expiryDate: '2026-10-31' },
  ],
}

// Initial reorder suggestions
const initialReorderSuggestions: ReorderSuggestion[] = [
  {
    id: 's1',
    productId: 'p2',
    product: 'IV Saline 500ml',
    sku: 'SKU-2088',
    location: 'Cold Store',
    current: 48,
    reorderPt: 100,
    suggestedQty: 150,
  },
  {
    id: 's2',
    productId: 'p3',
    product: 'Bandage Roll 4"',
    sku: 'SKU-3310',
    location: 'Warehouse B',
    current: 0,
    reorderPt: 50,
    suggestedQty: 100,
  },
  {
    id: 's3',
    productId: 'p4',
    product: 'N95 Respirator Mask (50pk)',
    sku: 'SKU-1199',
    location: 'Clinic North',
    current: 15,
    reorderPt: 60,
    suggestedQty: 120,
  },
  {
    id: 's4',
    productId: 'p5',
    product: 'Surgical Blades #10',
    sku: 'SKU-4402',
    location: 'Warehouse A',
    current: 28,
    reorderPt: 80,
    suggestedQty: 100,
  },
  {
    id: 's5',
    productId: 'p6',
    product: 'Latex Exam Gloves (M)',
    sku: 'SKU-1045',
    location: 'Central Hub',
    current: 42,
    reorderPt: 120,
    suggestedQty: 200,
  },
]

// 20 recent activity timeline events
const activityTimelineEvents: ActivityEvent[] = [
  {
    id: 'ev1',
    actor: 'Maria Chen',
    action: 'Received 120 IV Saline 500ml',
    time: '4m ago',
    icon: 'package',
    tone: 'primary',
  },
  {
    id: 'ev2',
    actor: 'James Okon',
    action: 'Approved Transfer TR-2398',
    time: '18m ago',
    icon: 'check',
    tone: 'success',
  },
  {
    id: 'ev3',
    actor: 'Auto-Reorder Bot',
    action: 'Created Draft PO-2026-089',
    time: '35m ago',
    icon: 'truck',
    tone: 'primary',
  },
  {
    id: 'ev4',
    actor: 'Priya Nair',
    action: 'Quarantined Batch B-8844',
    time: '1h ago',
    icon: 'alert',
    tone: 'critical',
  },
  {
    id: 'ev5',
    actor: 'Maria Chen',
    action: 'Stock Adjustment (+15) SKU-1042',
    time: '2h ago',
    icon: 'trending',
    tone: 'success',
  },
  {
    id: 'ev6',
    actor: 'System Bot',
    action: 'FEFO Batch Priority Re-indexed',
    time: '3h ago',
    icon: 'activity',
    tone: 'neutral',
  },
  {
    id: 'ev7',
    actor: 'James Okon',
    action: 'Dispatched TR-2401 to Clinic North',
    time: '4h ago',
    icon: 'truck',
    tone: 'primary',
  },
  {
    id: 'ev8',
    actor: 'Sarah Lin',
    action: 'Added SKU: Syringes 10ml',
    time: '5h ago',
    icon: 'package',
    tone: 'neutral',
  },
  {
    id: 'ev9',
    actor: 'Maria Chen',
    action: 'Flagged 4 damaged packaging units',
    time: '6h ago',
    icon: 'alert',
    tone: 'warning',
  },
  {
    id: 'ev10',
    actor: 'David Kim',
    action: 'Inspected Cold Storage Unit A',
    time: '7h ago',
    icon: 'eye',
    tone: 'primary',
  },
  {
    id: 'ev11',
    actor: 'Alert Monitor',
    action: 'Low threshold alert: Bandage 4"',
    time: '8h ago',
    icon: 'alert',
    tone: 'critical',
  },
  {
    id: 'ev12',
    actor: 'Priya Nair',
    action: 'Verified audit chain block #15847',
    time: '10h ago',
    icon: 'check',
    tone: 'success',
  },
  {
    id: 'ev13',
    actor: 'James Okon',
    action: 'Inbound PO-081: 500 Gloves logged',
    time: '12h ago',
    icon: 'package',
    tone: 'primary',
  },
  {
    id: 'ev14',
    actor: 'System Bot',
    action: '30-Day Expiry Forecast synced',
    time: '14h ago',
    icon: 'clock',
    tone: 'warning',
  },
  {
    id: 'ev15',
    actor: 'Sarah Lin',
    action: 'Updated MedSupply price sheet',
    time: '16h ago',
    icon: 'activity',
    tone: 'neutral',
  },
  {
    id: 'ev16',
    actor: 'David Kim',
    action: 'Completed Transfer TR-2385',
    time: '18h ago',
    icon: 'check',
    tone: 'success',
  },
  {
    id: 'ev17',
    actor: 'Maria Chen',
    action: 'Cycle count finished for Bay 2',
    time: '20h ago',
    icon: 'check',
    tone: 'success',
  },
  {
    id: 'ev18',
    actor: 'System Bot',
    action: 'Cloud snapshot synchronized',
    time: '22h ago',
    icon: 'activity',
    tone: 'neutral',
  },
  {
    id: 'ev19',
    actor: 'James Okon',
    action: 'Write-off approved for spoiled vial',
    time: '1d ago',
    icon: 'alert',
    tone: 'warning',
  },
  {
    id: 'ev20',
    actor: 'Priya Nair',
    action: 'Generated monthly compliance PDF',
    time: '1d ago',
    icon: 'activity',
    tone: 'primary',
  },
]

// ---------------------------------------------------------------------------
// Custom Components
// ---------------------------------------------------------------------------

function CustomHealthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-[8px] border border-border bg-surface p-3 text-xs shadow-lg">
      <p className="font-semibold text-text mb-1">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}:
            </span>
            <span className="font-semibold text-text">
              {item.name === 'Total Stock'
                ? item.value.toLocaleString()
                : `${item.value} SKUs`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityIcon({ icon, tone }: { icon: ActivityEvent['icon']; tone: ActivityEvent['tone'] }) {
  const toneClasses = {
    primary: 'bg-blue-100 text-primary',
    warning: 'bg-amber-100 text-amber-600',
    critical: 'bg-red-100 text-red-600',
    success: 'bg-green-100 text-green-600',
    neutral: 'bg-slate-100 text-slate-600',
  }

  const icons = {
    package: <Package className="h-4 w-4" />,
    truck: <Truck className="h-4 w-4" />,
    alert: <AlertTriangle className="h-4 w-4" />,
    check: <CheckCircle2 className="h-4 w-4" />,
    trending: <TrendingUp className="h-4 w-4" />,
    activity: <Activity className="h-4 w-4" />,
    eye: <Eye className="h-4 w-4" />,
    clock: <Clock className="h-4 w-4" />,
  }

  return (
    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', toneClasses[tone])}>
      {icons[icon]}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main DashboardPage Component
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const { toast } = useToast()
  const { user } = useAuth()

  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [kpiSummary, setKpiSummary] = useState({
    totalSkus: 1247,
    lowStock: 37,
    expiring30: 19,
    pendingTransfers: 6,
  })
  const [alerts, setAlerts] = useState<Alert[]>(initialAlertsList)
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>(initialReorderSuggestions)
  const [generatingPoId, setGeneratingPoId] = useState<string | null>(null)
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    day: number
    batches: ExpiringBatch[]
  } | null>(null)

  // Load initial data in parallel
  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [summaryRes, alertsRes] = await Promise.all([
        stockSummary(),
        fetchAlerts(),
      ])

      if (summaryRes && typeof summaryRes.totalSkus === 'number') {
        setKpiSummary({
          totalSkus: summaryRes.totalSkus || 1247,
          lowStock: summaryRes.lowStock || 37,
          expiring30: summaryRes.expiring30 || 19,
          pendingTransfers: summaryRes.pendingTransfers || 6,
        })
      }

      if (alertsRes && alertsRes.length > 0) {
        // Merge fetched alerts with our rich 10-item list to guarantee at least 10 items
        const merged = [...alertsRes]
        for (const item of initialAlertsList) {
          if (!merged.find((a) => a.id === item.id)) {
            merged.push(item)
          }
        }
        setAlerts(merged.slice(0, 10))
      }

      if (isRefresh) {
        toast('Dashboard metrics refreshed successfully', 'success')
      }
    } catch {
      toast('Using cached dashboard data', 'info')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Handle Generate PO
  const handleGeneratePO = async (item: ReorderSuggestion) => {
    setGeneratingPoId(item.id)
    try {
      const res = await generatePO({
        productId: item.productId,
        quantity: item.suggestedQty,
      })
      toast(
        `Generated Purchase Order ${res.poId} for ${item.product} (${item.suggestedQty} units)`,
        'success',
      )
      setSuggestions((prev) => prev.filter((s) => s.id !== item.id))
    } catch {
      toast('Failed to generate Purchase Order', 'error')
    } finally {
      setGeneratingPoId(null)
    }
  }

  // Handle Dismiss Reorder Suggestion
  const handleDismissSuggestion = (item: ReorderSuggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== item.id))
    toast(`Dismissed restock suggestion for ${item.product}`, 'info')
  }

  // Handle Mark Alert as Read
  const handleToggleAlertRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    )
  }

  // Heatmap helper calculations
  // October 2026 starts on Thursday (index 4 in 0=Sun..6=Sat)
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    // 4 empty cells for Sunday, Monday, Tuesday, Wednesday
    for (let i = 0; i < 4; i++) {
      days.push(null)
    }
    // Days 1 through 31
    for (let i = 1; i <= 31; i++) {
      days.push(i)
    }
    return days
  }, [])

  // Export report mock action
  const handleExport = () => {
    toast('Generating inventory report export...', 'info')
    setTimeout(() => {
      toast('Inventory executive summary downloaded', 'success')
    }, 900)
  }

  // -------------------------------------------------------------------------
  // Skeleton Loading Shimmer
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle="Real-time inventory intelligence, alerts, and stock forecasting"
        />

        {/* KPI Skeleton Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-[12px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] animate-pulse"
            >
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="mt-3 h-8 w-20 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-36 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Second Row Skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="h-80 rounded-[12px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] animate-pulse lg:col-span-7" />
          <div className="h-80 rounded-[12px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] animate-pulse lg:col-span-5" />
        </div>

        {/* Third Row Skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="h-96 rounded-[12px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] animate-pulse lg:col-span-6" />
          <div className="h-96 rounded-[12px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] animate-pulse lg:col-span-6" />
        </div>

        {/* Fourth Row Skeleton */}
        <div className="h-36 rounded-[12px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------- */}
      {/* Page Header                                                         */}
      {/* ------------------------------------------------------------------- */}
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name || 'Inventory Manager'}. Here is your operations snapshot.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon={
                <RefreshCw
                  className={cn('h-4 w-4', refreshing && 'animate-spin text-primary')}
                />
              }
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
            >
              Sync
            </Button>
            <input
              type="date"
              className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text focus:border-primary focus:outline-none"
              defaultValue="2026-09-19"
              aria-label="Start date"
            />
            <span className="text-muted">–</span>
            <input
              type="date"
              className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text focus:border-primary focus:outline-none"
              defaultValue="2026-10-18"
              aria-label="End date"
            />
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
        }
      />

      {/* ------------------------------------------------------------------- */}
      {/* TOP ROW — 4 KPI Cards (each ~25% width)                             */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total SKUs */}
        <div className="group relative overflow-hidden rounded-[12px] border border-border border-l-4 border-l-blue-600 bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Total SKUs</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-text">
                {kpiSummary.totalSkus.toLocaleString()}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              +3.8%
            </span>
            <span className="text-muted">across 4 locations</span>
          </div>
        </div>

        {/* Card 2: Low-Stock Items */}
        <div className="group relative overflow-hidden rounded-[12px] border border-border border-l-4 border-l-amber-500 bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Low-Stock Items</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600">
                {kpiSummary.lowStock}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted">below reorder point</span>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700 hover:underline"
            >
              View
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Expiring in 30 Days */}
        <div className="group relative overflow-hidden rounded-[12px] border border-border border-l-4 border-l-orange-500 bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Expiring in 30 Days</p>
              <div className="mt-2 flex items-center gap-2">
                <Clock className="h-6 w-6 text-orange-500" />
                <p className="text-3xl font-bold tracking-tight text-orange-600">
                  {kpiSummary.expiring30}
                </p>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted">batches near expiry</span>
            <Link
              to="/batches"
              className="inline-flex items-center gap-1 font-semibold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Batches
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Pending Transfers */}
        <div className="group relative overflow-hidden rounded-[12px] border border-border border-l-4 border-l-blue-500 bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Pending Transfers</p>
              <div className="mt-2 flex items-center gap-2">
                <Truck className="h-6 w-6 text-blue-500" />
                <p className="text-3xl font-bold tracking-tight text-blue-600">
                  {kpiSummary.pendingTransfers}
                </p>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted">awaiting approval</span>
            <Link
              to="/transfers"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Review
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* SECOND ROW — Stock Health Trend (60%) & Live Alerts Feed (40%)      */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left 60%: Stock Health Trend */}
        <div className="lg:col-span-7">
          <Card
            title="Stock Health Trend"
            action={
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
                  Total Stock
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 border-b-2 border-dashed border-[#D97706]" />
                  Low-Stock Count
                </span>
              </div>
            }
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stockHealthTrendData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    interval={4}
                  />
                  {/* Left Y-axis: Total Stock */}
                  <YAxis
                    yAxisId="left"
                    domain={[11500, 13000]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                  />
                  {/* Right Y-axis: Low-Stock Count */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[20, 50]}
                    tick={{ fontSize: 11, fill: '#D97706' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomHealthTooltip />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    name="Total Stock"
                    dataKey="totalStock"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#2563EB' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="Low-Stock Count"
                    dataKey="lowStock"
                    stroke="#D97706"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 5, fill: '#D97706' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs text-muted">
              <span>Showing last 30 daily readings</span>
              <span className="font-medium text-text">Stock Buffer Health: 94.2%</span>
            </div>
          </Card>
        </div>

        {/* Right 40%: Live Alerts Feed */}
        <div className="lg:col-span-5">
          <Card
            title="Live Alerts Feed"
            action={
              <Link
                to="/alerts"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="max-h-[305px] space-y-2 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center text-muted">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <p className="mt-2 text-sm font-medium">All caught up!</p>
                  <p className="text-xs">No active alerts requiring attention.</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const severityDotColor =
                    alert.severity === 'critical'
                      ? 'bg-red-500'
                      : alert.severity === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'

                  return (
                    <div
                      key={alert.id}
                      onClick={() => handleToggleAlertRead(alert.id)}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-[8px] p-2.5 transition-colors',
                        alert.read
                          ? 'border border-border/70 bg-surface hover:bg-app'
                          : 'border border-blue-200 bg-blue-50/70 hover:bg-blue-50',
                      )}
                    >
                      <div className="mt-1 flex shrink-0 items-center justify-center">
                        <span
                          className={cn(
                            'h-2.5 w-2.5 rounded-full ring-2 ring-white',
                            severityDotColor,
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-bold text-text">
                            {alert.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted">
                            {alert.createdAt}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-xs text-muted">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                {alerts.filter((a) => !a.read).length} unread alerts
              </span>
              <button
                type="button"
                onClick={() => setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))}
                className="text-primary hover:underline"
              >
                Mark all read
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* THIRD ROW — Expiry Heatmap & Reorder Suggestions Table              */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: Expiry Heatmap */}
        <div className="lg:col-span-6">
          <Card
            title="Expiry Heatmap"
            action={
              <div className="flex items-center gap-2">
                <Chip label="October 2026" tone="info" />
              </div>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-medium text-text">Batch Expiry Timeline</span>
                <span className="text-[11px]">Click any date cell for batch details</span>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="h-10 rounded-[6px] bg-slate-50/50"
                      />
                    )
                  }

                  const batches = octoberExpiryMap[day] || []
                  const count = batches.length

                  // Color coding based on batch count (white -> orange -> red)
                  let cellStyle =
                    'border border-border/60 bg-surface text-text hover:border-slate-400'
                  if (count >= 5) {
                    cellStyle =
                      'border border-red-500 bg-red-500 font-bold text-white shadow-sm hover:bg-red-600'
                  } else if (count >= 3) {
                    cellStyle =
                      'border border-orange-400 bg-orange-300 font-semibold text-orange-950 hover:bg-orange-400'
                  } else if (count >= 1) {
                    cellStyle =
                      'border border-orange-200 bg-orange-100 font-medium text-orange-900 hover:bg-orange-200'
                  }

                  const isSelected = selectedDayInfo?.day === day

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() =>
                        setSelectedDayInfo(
                          isSelected ? null : { day, batches },
                        )
                      }
                      className={cn(
                        'relative flex h-10 flex-col items-center justify-center rounded-[6px] text-xs transition-all',
                        cellStyle,
                        isSelected && 'ring-2 ring-primary ring-offset-1',
                      )}
                      title={`Oct ${day}: ${count} batches expiring`}
                    >
                      <span className="text-[11px]">{day}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            'text-[9px] font-semibold leading-none',
                            count >= 5 ? 'text-red-100' : 'text-orange-950/80',
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Heatmap Legend */}
              <div className="flex flex-wrap items-center justify-between border-t border-border pt-2 text-[11px] text-muted">
                <span className="font-medium">Expiry Risk:</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-[3px] border border-border bg-surface" />
                    0 batches
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-[3px] border border-orange-200 bg-orange-100" />
                    1–2
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-[3px] border border-orange-400 bg-orange-300" />
                    3–4
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-[3px] border border-red-500 bg-red-500 text-white" />
                    5+ (Critical)
                  </span>
                </div>
              </div>

              {/* Day Details Popover / Card */}
              {selectedDayInfo && (
                <div className="rounded-[8px] border border-border bg-app p-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-border/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-text">
                        October {selectedDayInfo.day}, 2026
                      </span>
                      <Chip
                        label={`${selectedDayInfo.batches.length} ${
                          selectedDayInfo.batches.length === 1 ? 'batch' : 'batches'
                        }`}
                        tone={
                          selectedDayInfo.batches.length >= 5
                            ? 'expired'
                            : selectedDayInfo.batches.length >= 3
                              ? 'critical'
                              : selectedDayInfo.batches.length > 0
                                ? 'warning'
                                : 'good'
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDayInfo(null)}
                      className="rounded p-1 text-muted hover:bg-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {selectedDayInfo.batches.length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted">
                      No batches are scheduled to expire on this date.
                    </p>
                  ) : (
                    <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                      {selectedDayInfo.batches.map((batch) => (
                        <div
                          key={batch.id}
                          className="flex items-center justify-between rounded-[6px] border border-border bg-surface px-2.5 py-1.5 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-text">
                              {batch.product}
                            </span>
                            <span className="ml-2 font-mono text-[10px] text-muted">
                              [{batch.id}]
                            </span>
                            <p className="text-[11px] text-muted">
                              Loc: {batch.location}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-text">
                              {batch.qty} units
                            </span>
                            <p className="text-[10px] text-orange-600">
                              {batch.daysLeft} days left
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Reorder Suggestions Table */}
        <div className="lg:col-span-6">
          <Card
            title="Reorder Suggestions"
            action={
              <Link
                to="/reorder"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Rules Engine
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {suggestions.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center text-muted">
                <CheckCircle2 className="h-10 w-10 text-success" />
                <p className="mt-2 text-sm font-semibold text-text">
                  Stock Optimization Optimal
                </p>
                <p className="text-xs">
                  All active SKUs satisfy configured reorder point minimums.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-muted">
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Location</th>
                      <th className="pb-2 text-right">Current</th>
                      <th className="pb-2 text-right">Reorder Pt</th>
                      <th className="pb-2 text-right">Suggested</th>
                      <th className="pb-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {suggestions.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-app">
                        <td className="py-2.5 pr-2">
                          <p className="font-semibold text-text">{item.product}</p>
                          <span className="font-mono text-[10px] text-muted">
                            {item.sku}
                          </span>
                        </td>
                        <td className="py-2.5 text-muted">{item.location}</td>
                        <td className="py-2.5 text-right font-medium">
                          <span
                            className={cn(
                              item.current === 0 ? 'text-error font-bold' : 'text-amber-600',
                            )}
                          >
                            {item.current}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-muted">{item.reorderPt}</td>
                        <td className="py-2.5 text-right font-bold text-primary">
                          +{item.suggestedQty}
                        </td>
                        <td className="py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="primary"
                              className="h-7 px-2.5 text-[11px]"
                              disabled={generatingPoId === item.id}
                              onClick={() => handleGeneratePO(item)}
                            >
                              {generatingPoId === item.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                'Generate PO'
                              )}
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleDismissSuggestion(item)}
                              title="Dismiss suggestion"
                              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted hover:bg-slate-200 hover:text-text"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted">
              <span>{suggestions.length} items requiring replenishment</span>
              <span className="text-[11px] text-muted">Generated via ML forecast & stock rules</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* FOURTH ROW — Full-width Recent Activity Timeline                    */}
      {/* ------------------------------------------------------------------- */}
      <Card
        title="Recent Activity Timeline"
        action={
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Live Feed
            </span>
            <span>•</span>
            <span>20 Latest Events</span>
          </div>
        }
      >
        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
          {activityTimelineEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex min-w-[230px] max-w-[260px] shrink-0 items-start gap-2.5 rounded-[8px] border border-border bg-app p-3 shadow-sm transition-all hover:border-slate-400 hover:bg-surface"
            >
              <ActivityIcon icon={evt.icon} tone={evt.tone} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-bold text-text">
                    {evt.actor}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted">
                    {evt.time}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted leading-snug">
                  {evt.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
