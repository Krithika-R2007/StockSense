import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Truck,
  Trash2,
  Download,
  FileText,
  ArrowLeft,
  Calendar,
  Filter,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ReportId = 'stock' | 'movement' | 'expiry' | 'valuation' | 'transfer' | 'waste'

interface ReportCard {
  id: ReportId
  title: string
  description: string
  icon: React.ReactNode
  color: string
  lastGenerated: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const LOCATIONS = ['Main Warehouse', 'Branch A', 'Branch B', 'Cold Storage']
const CATEGORIES = ['Electronics', 'Food & Beverage', 'Office Supplies', 'Chemicals', 'Raw Materials']
const PIE_COLORS = ['#2563eb', '#f59e0b', '#ea580c', '#dc2626', '#64748b']

const stockByLocation = LOCATIONS.map((loc, i) => ({
  location: loc,
  onHand: [3200, 1800, 2100, 950][i],
  reserved: [420, 230, 180, 90][i],
  available: [2780, 1570, 1920, 860][i],
}))

const movementData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - 29 + i)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    inbound: Math.floor(80 + Math.random() * 120 + Math.sin(i / 5) * 40),
    outbound: Math.floor(60 + Math.random() * 100 + Math.cos(i / 4) * 30),
  }
})

const expiryBreakdown = [
  { name: '>90 days', value: 142, tone: 'good' as const },
  { name: '30-90 days', value: 58, tone: 'warning' as const },
  { name: '7-30 days', value: 23, tone: 'critical' as const },
  { name: '<7 days', value: 9, tone: 'expired' as const },
  { name: 'Expired', value: 4, tone: 'neutral' as const },
]

const valuationData = CATEGORIES.flatMap((cat) =>
  LOCATIONS.map((loc) => ({
    category: cat,
    location: loc,
    items: Math.floor(50 + Math.random() * 200),
    value: Math.floor(5000 + Math.random() * 50000),
  })),
)

const transferByStatus = LOCATIONS.map((loc) => ({
  location: loc,
  suggested: Math.floor(Math.random() * 8),
  pending: Math.floor(Math.random() * 5),
  inTransit: Math.floor(Math.random() * 4),
  completed: Math.floor(5 + Math.random() * 15),
}))

const wasteReasons = [
  { reason: 'Expired', count: 34, value: 12400 },
  { reason: 'Damaged in Transit', count: 12, value: 8200 },
  { reason: 'Quality Failure', count: 8, value: 6100 },
  { reason: 'Spillage', count: 5, value: 2300 },
  { reason: 'Theft/Shrinkage', count: 3, value: 4700 },
  { reason: 'Other', count: 2, value: 900 },
]

const reports: ReportCard[] = [
  {
    id: 'stock',
    title: 'Stock Summary',
    description: 'Current stock levels across all locations and categories',
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'bg-blue-100 text-blue-600',
    lastGenerated: '2 hours ago',
  },
  {
    id: 'movement',
    title: 'Movement Report',
    description: 'Stock inbound and outbound trends over time',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'bg-green-100 text-green-600',
    lastGenerated: 'Yesterday',
  },
  {
    id: 'expiry',
    title: 'Expiry Report',
    description: 'Batch expiry status breakdown and upcoming expirations',
    icon: <Clock className="h-6 w-6" />,
    color: 'bg-amber-100 text-amber-600',
    lastGenerated: '3 hours ago',
  },
  {
    id: 'valuation',
    title: 'Valuation Report',
    description: 'Total inventory value by location and product category',
    icon: <DollarSign className="h-6 w-6" />,
    color: 'bg-purple-100 text-purple-600',
    lastGenerated: 'Today',
  },
  {
    id: 'transfer',
    title: 'Transfer Report',
    description: 'Transfer volume and status breakdown by location',
    icon: <Truck className="h-6 w-6" />,
    color: 'bg-indigo-100 text-indigo-600',
    lastGenerated: '5 hours ago',
  },
  {
    id: 'waste',
    title: 'Waste & Writeoff',
    description: 'Writeoff reasons, volume, and financial impact',
    icon: <Trash2 className="h-6 w-6" />,
    color: 'bg-red-100 text-red-600',
    lastGenerated: 'Yesterday',
  },
]

/* ------------------------------------------------------------------ */
/*  Sub-report renderers                                               */
/* ------------------------------------------------------------------ */

function StockReport({ range }: { range: string }) {
  const data = range === 'all' ? stockByLocation : stockByLocation.filter((_, i) => i < 2)
  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="location" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="onHand" fill="#2563eb" name="On Hand" radius={[4, 4, 0, 0]} />
            <Bar dataKey="reserved" fill="#f59e0b" name="Reserved" radius={[4, 4, 0, 0]} />
            <Bar dataKey="available" fill="#16a34a" name="Available" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="pb-2 font-medium">Location</th>
              <th className="pb-2 font-medium text-right">On Hand</th>
              <th className="pb-2 font-medium text-right">Reserved</th>
              <th className="pb-2 font-medium text-right">Available</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.location} className="border-b border-border/50">
                <td className="py-2 font-medium text-text">{r.location}</td>
                <td className="py-2 text-right">{r.onHand.toLocaleString()}</td>
                <td className="py-2 text-right text-warning">{r.reserved.toLocaleString()}</td>
                <td className="py-2 text-right font-semibold text-success">{r.available.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MovementReport() {
  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={movementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="inbound" stroke="#16a34a" strokeWidth={2} name="Inbound" dot={false} />
            <Line type="monotone" dataKey="outbound" stroke="#2563eb" strokeWidth={2} name="Outbound" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Inbound', value: movementData.reduce((s, d) => s + d.inbound, 0), color: 'text-success' },
          { label: 'Total Outbound', value: movementData.reduce((s, d) => s + d.outbound, 0), color: 'text-primary' },
          { label: 'Net Change', value: movementData.reduce((s, d) => s + d.inbound - d.outbound, 0), color: 'text-text' },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-xs text-muted">{s.label}</p>
            <p className={cn('mt-1 text-2xl font-bold', s.color)}>{s.value.toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ExpiryReport() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6 md:flex-row">
        <div className="h-72 w-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expiryBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                label={((props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`) as any}
                labelLine={false}
              >
                {expiryBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Batches</th>
                <th className="pb-2 font-medium text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {expiryBreakdown.map((r) => {
                const total = expiryBreakdown.reduce((s, e) => s + e.value, 0)
                return (
                  <tr key={r.name} className="border-b border-border/50">
                    <td className="py-2 font-medium">{r.name}</td>
                    <td className="py-2 text-right">{r.value}</td>
                    <td className="py-2 text-right text-muted">{((r.value / total) * 100).toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ValuationReport() {
  const grouped = useMemo(() => {
    const map = new Map<string, { items: number; value: number }>()
    for (const r of valuationData) {
      const key = r.category
      const prev = map.get(key) ?? { items: 0, value: 0 }
      map.set(key, { items: prev.items + r.items, value: prev.value + r.value })
    }
    return Array.from(map.entries()).map(([category, data]) => ({ category, ...data }))
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs text-muted">Total SKUs</p>
          <p className="mt-1 text-2xl font-bold text-text">{grouped.reduce((s, c) => s + c.items, 0).toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Total Value</p>
          <p className="mt-1 text-2xl font-bold text-success">${grouped.reduce((s, c) => s + c.value, 0).toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Locations</p>
          <p className="mt-1 text-2xl font-bold text-primary">{LOCATIONS.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Categories</p>
          <p className="mt-1 text-2xl font-bold text-text">{CATEGORIES.length}</p>
        </Card>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Location</th>
              <th className="pb-2 font-medium text-right">Items</th>
              <th className="pb-2 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {valuationData.map((r, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-app/50">
                <td className="py-2 font-medium">{r.category}</td>
                <td className="py-2 text-muted">{r.location}</td>
                <td className="py-2 text-right">{r.items}</td>
                <td className="py-2 text-right font-medium">${r.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransferReport() {
  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={transferByStatus} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="location" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="suggested" fill="#93c5fd" name="Suggested" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inTransit" fill="#a78bfa" name="In Transit" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#16a34a" name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="pb-2 font-medium">Location</th>
              <th className="pb-2 font-medium text-right">Suggested</th>
              <th className="pb-2 font-medium text-right">Pending</th>
              <th className="pb-2 font-medium text-right">In Transit</th>
              <th className="pb-2 font-medium text-right">Completed</th>
            </tr>
          </thead>
          <tbody>
            {transferByStatus.map((r) => (
              <tr key={r.location} className="border-b border-border/50">
                <td className="py-2 font-medium">{r.location}</td>
                <td className="py-2 text-right">{r.suggested}</td>
                <td className="py-2 text-right">{r.pending}</td>
                <td className="py-2 text-right">{r.inTransit}</td>
                <td className="py-2 text-right text-success">{r.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WasteReport() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6 md:flex-row">
        <div className="h-72 w-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={wasteReasons}
                dataKey="count"
                nameKey="reason"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                label={((props: any) => `${props.name ?? props.reason ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`) as any}
                labelLine={false}
              >
                {wasteReasons.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 font-medium">Reason</th>
                <th className="pb-2 font-medium text-right">Count</th>
                <th className="pb-2 font-medium text-right">Value Lost</th>
              </tr>
            </thead>
            <tbody>
              {wasteReasons.map((r) => (
                <tr key={r.reason} className="border-b border-border/50">
                  <td className="py-2 font-medium">{r.reason}</td>
                  <td className="py-2 text-right">{r.count}</td>
                  <td className="py-2 text-right text-error">${r.value.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="pt-2">Total</td>
                <td className="pt-2 text-right">{wasteReasons.reduce((s, r) => s + r.count, 0)}</td>
                <td className="pt-2 text-right text-error">${wasteReasons.reduce((s, r) => s + r.value, 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function ReportsPage() {
  const { toast } = useToast()
  const [active, setActive] = useState<ReportId | null>(null)
  const [dateRange, setDateRange] = useState('30')
  const [locationFilter, setLocationFilter] = useState('all')

  const activeReport = reports.find((r) => r.id === active)

  function handleExport(format: 'csv' | 'pdf') {
    toast(`Report exported as ${format.toUpperCase()}`, 'success')
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and export inventory reports"
      />

      {/* Drill-down view */}
      {active && activeReport ? (
        <div className="space-y-4">
          {/* Back + controls bar */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setActive(null)}>
              All Reports
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {['30', '60', '90', '180'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDateRange(d)}
                  className={cn(
                    'rounded-[8px] px-3 py-1.5 text-xs font-medium transition-colors',
                    dateRange === d ? 'bg-primary text-white' : 'bg-app text-muted hover:bg-border',
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
            <Select
              options={[{ value: 'all', label: 'All Locations' }, ...LOCATIONS.map((l) => ({ value: l, label: l }))]}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="!h-8 !w-40 !text-xs"
            />
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => handleExport('csv')}>
              CSV
            </Button>
            <Button variant="secondary" icon={<FileText className="h-4 w-4" />} onClick={() => handleExport('pdf')}>
              PDF
            </Button>
          </div>

          {/* Report title */}
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-[10px]', activeReport.color)}>
                {activeReport.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">{activeReport.title}</h3>
                <p className="text-xs text-muted">{activeReport.description}</p>
              </div>
            </div>

            {active === 'stock' && <StockReport range={locationFilter} />}
            {active === 'movement' && <MovementReport />}
            {active === 'expiry' && <ExpiryReport />}
            {active === 'valuation' && <ValuationReport />}
            {active === 'transfer' && <TransferReport />}
            {active === 'waste' && <WasteReport />}
          </Card>
        </div>
      ) : (
        /* Report card grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <Card key={r.id} className="group cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-[12px]', r.color)}>
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text">{r.title}</h3>
                    <p className="mt-0.5 text-xs text-muted leading-relaxed">{r.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Calendar className="h-3 w-3" />
                    {r.lastGenerated}
                  </span>
                  <Button
                    variant="primary"
                    className="!h-8 !px-3 !text-xs"
                    onClick={() => setActive(r.id)}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
