import { useState, useMemo } from 'react'
import {
  Info,
  RefreshCw,
  Settings,
  AlertTriangle,
  Check,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  X,
  TrendingDown,
  Layers,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Drawer } from '../components/ui/Drawer'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'

export type ReorderRule = {
  id: string
  productId: string
  product: string
  locationId: string
  location: string
  safetyStock: number
  reorderPoint: number
  eoq: number
  serviceLevel: number
  leadTimeMean: number
  leadTimeStd: number
  currentStock: number
  lastRecalculated: string
  autoApprove: boolean
  dailyDemandMean?: number
  dailyDemandStd?: number
  unitCost?: number
}

const INITIAL_RULES: ReorderRule[] = [
  {
    id: 'rr-1',
    productId: 'p2',
    product: 'IV Saline 500ml',
    locationId: 'loc-cold',
    location: 'Cold Store',
    safetyStock: 45,
    reorderPoint: 110,
    eoq: 250,
    serviceLevel: 98,
    leadTimeMean: 4.5,
    leadTimeStd: 1.2,
    currentStock: 48,
    lastRecalculated: '2026-10-18 08:30',
    autoApprove: true,
    dailyDemandMean: 14,
    dailyDemandStd: 3.5,
    unitCost: 8,
  },
  {
    id: 'rr-2',
    productId: 'p1',
    product: 'Surgical Gloves (L)',
    locationId: 'loc-a',
    location: 'Warehouse A',
    safetyStock: 80,
    reorderPoint: 220,
    eoq: 600,
    serviceLevel: 95,
    leadTimeMean: 7.0,
    leadTimeStd: 2.0,
    currentStock: 420,
    lastRecalculated: '2026-10-18 09:15',
    autoApprove: true,
    dailyDemandMean: 20,
    dailyDemandStd: 4.8,
    unitCost: 12.5,
  },
  {
    id: 'rr-3',
    productId: 'p3',
    product: 'Amoxicillin 500mg',
    locationId: 'loc-b',
    location: 'Warehouse B',
    safetyStock: 60,
    reorderPoint: 180,
    eoq: 400,
    serviceLevel: 99,
    leadTimeMean: 6.2,
    leadTimeStd: 1.5,
    currentStock: 145,
    lastRecalculated: '2026-10-17 16:40',
    autoApprove: false,
    dailyDemandMean: 19,
    dailyDemandStd: 4.0,
    unitCost: 15,
  },
  {
    id: 'rr-4',
    productId: 'p4',
    product: 'N95 Respirator Mask',
    locationId: 'loc-a',
    location: 'Warehouse A',
    safetyStock: 120,
    reorderPoint: 350,
    eoq: 1000,
    serviceLevel: 95,
    leadTimeMean: 8.5,
    leadTimeStd: 2.4,
    currentStock: 890,
    lastRecalculated: '2026-10-18 10:00',
    autoApprove: true,
    dailyDemandMean: 27,
    dailyDemandStd: 6.2,
    unitCost: 2.2,
  },
  {
    id: 'rr-5',
    productId: 'p5',
    product: 'Insulin Glargine 100U',
    locationId: 'loc-pharm',
    location: 'Pharmacy Fridge',
    safetyStock: 30,
    reorderPoint: 75,
    eoq: 120,
    serviceLevel: 99,
    leadTimeMean: 3.1,
    leadTimeStd: 0.8,
    currentStock: 25,
    lastRecalculated: '2026-10-18 11:20',
    autoApprove: true,
    dailyDemandMean: 14,
    dailyDemandStd: 2.5,
    unitCost: 45,
  },
  {
    id: 'rr-6',
    productId: 'p6',
    product: 'Propofol 20ml',
    locationId: 'loc-cold',
    location: 'Cold Store',
    safetyStock: 25,
    reorderPoint: 60,
    eoq: 150,
    serviceLevel: 97,
    leadTimeMean: 5.0,
    leadTimeStd: 1.1,
    currentStock: 72,
    lastRecalculated: '2026-10-16 14:10',
    autoApprove: false,
    dailyDemandMean: 7,
    dailyDemandStd: 1.8,
    unitCost: 32,
  },
  {
    id: 'rr-7',
    productId: 'p7',
    product: 'Epinephrine 1mg/ml',
    locationId: 'loc-er',
    location: 'ER Bay',
    safetyStock: 20,
    reorderPoint: 45,
    eoq: 80,
    serviceLevel: 99,
    leadTimeMean: 2.5,
    leadTimeStd: 0.6,
    currentStock: 18,
    lastRecalculated: '2026-10-18 07:45',
    autoApprove: true,
    dailyDemandMean: 10,
    dailyDemandStd: 2.0,
    unitCost: 18,
  },
  {
    id: 'rr-8',
    productId: 'p8',
    product: 'Bandage Roll 4"',
    locationId: 'loc-b',
    location: 'Warehouse B',
    safetyStock: 35,
    reorderPoint: 90,
    eoq: 300,
    serviceLevel: 90,
    leadTimeMean: 5.5,
    leadTimeStd: 1.9,
    currentStock: 0,
    lastRecalculated: '2026-10-15 12:00',
    autoApprove: false,
    dailyDemandMean: 10,
    dailyDemandStd: 3.1,
    unitCost: 3.5,
  },
  {
    id: 'rr-9',
    productId: 'p9',
    product: 'Syringe 10ml Luer Lock',
    locationId: 'loc-a',
    location: 'Warehouse A',
    safetyStock: 150,
    reorderPoint: 400,
    eoq: 1200,
    serviceLevel: 92,
    leadTimeMean: 6.0,
    leadTimeStd: 1.4,
    currentStock: 1150,
    lastRecalculated: '2026-10-18 09:30',
    autoApprove: true,
    dailyDemandMean: 41,
    dailyDemandStd: 8.5,
    unitCost: 0.65,
  },
  {
    id: 'rr-10',
    productId: 'p10',
    product: 'Ceftriaxone 1g',
    locationId: 'loc-pharm',
    location: 'Pharmacy Fridge',
    safetyStock: 40,
    reorderPoint: 105,
    eoq: 200,
    serviceLevel: 96,
    leadTimeMean: 4.8,
    leadTimeStd: 1.3,
    currentStock: 110,
    lastRecalculated: '2026-10-17 18:25',
    autoApprove: true,
    dailyDemandMean: 13,
    dailyDemandStd: 2.8,
    unitCost: 22,
  },
]

type FormulaInfoKey = 'safetyStock' | 'reorderPoint' | 'eoq' | 'serviceLevel' | 'leadTime'

const FORMULA_EXPLANATIONS: Record<
  FormulaInfoKey,
  {
    title: string
    formula: string
    subFormula?: string
    variables: { symbol: string; desc: string }[]
    notes: string
  }
> = {
  safetyStock: {
    title: 'Safety Stock (SS)',
    formula: 'SS = Z × σ_LTD',
    subFormula: 'σ_LTD = √(L · σ_d² + d² · σ_L²)',
    variables: [
      { symbol: 'Z', desc: 'Normal distribution score corresponding to target service level' },
      { symbol: 'σ_LTD', desc: 'Standard deviation of demand during lead time' },
      { symbol: 'L', desc: 'Average supplier lead time in days' },
      { symbol: 'σ_L', desc: 'Standard deviation of supplier lead time' },
      { symbol: 'd', desc: 'Average daily demand rate (units/day)' },
      { symbol: 'σ_d', desc: 'Standard deviation of daily demand' },
    ],
    notes:
      'Protects against stockouts caused by combined variance in customer demand and supplier delivery delays.',
  },
  reorderPoint: {
    title: 'Reorder Point (ROP)',
    formula: 'ROP = d × L + SS',
    variables: [
      { symbol: 'd', desc: 'Average daily demand rate (units/day)' },
      { symbol: 'L', desc: 'Supplier average lead time in days' },
      { symbol: 'SS', desc: 'Statistical Safety Stock buffer' },
    ],
    notes:
      'Inventory threshold that triggers a replenishment order. Covers mean demand during lead time plus buffer.',
  },
  eoq: {
    title: 'Economic Order Quantity (EOQ)',
    formula: 'Q = √(2DS / H)',
    variables: [
      { symbol: 'D', desc: 'Annual demand volume (units/year = d × 365)' },
      { symbol: 'S', desc: 'Fixed ordering/setup cost ($50.00 standard per PO)' },
      { symbol: 'H', desc: 'Annual holding/carrying cost per unit (unit cost × 20%/yr)' },
    ],
    notes:
      'Calculates the optimal order batch size that minimizes combined purchase setup and inventory holding costs.',
  },
  serviceLevel: {
    title: 'Cycle Service Level (CSL)',
    formula: 'P(Stockout during LT) ≤ 1 - CSL',
    variables: [
      { symbol: '90%', desc: 'Z = 1.282 (Moderate criticality products)' },
      { symbol: '95%', desc: 'Z = 1.645 (Standard operational benchmark)' },
      { symbol: '98%', desc: 'Z = 2.054 (High priority medical consumables)' },
      { symbol: '99%', desc: 'Z = 2.326 (Critical life-saving drugs & trauma supplies)' },
    ],
    notes:
      'Target probability of replenishing order before stock is exhausted. Higher levels require proportionally larger safety stocks.',
  },
  leadTime: {
    title: 'Supplier Lead Time (L ± σ_L)',
    formula: 'Lead Time = L ± σ_L days',
    variables: [
      { symbol: 'L (Mean)', desc: 'Historical average days from PO issuance to dock receiving' },
      { symbol: 'σ_L (Std)', desc: 'Standard deviation of vendor transit reliability' },
    ],
    notes:
      'Calculated dynamically from recent electronic purchase orders and warehouse dock receipts.',
  },
}

function getZForServiceLevel(sl: number): number {
  if (sl >= 99) return 2.326
  if (sl >= 98) return 2.054
  if (sl >= 97) return 1.881
  if (sl >= 95) return 1.645
  if (sl >= 92) return 1.405
  return 1.282
}

export function ReorderRulesPage() {
  const { toast } = useToast()

  const [rules, setRules] = useState<ReorderRule[]>(INITIAL_RULES)
  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [globalAutoApprove, setGlobalAutoApprove] = useState<boolean>(true)

  // Recalculate all state
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false)
  const [recalcProgress, setRecalcProgress] = useState<{ current: number; total: number } | null>(
    null,
  )
  const [recentlyAnimated, setRecentlyAnimated] = useState<boolean>(false)

  // Tooltip Popover modal state
  const [activeTooltip, setActiveTooltip] = useState<FormulaInfoKey | null>(null)

  // Drawer Edit state
  const [editingRule, setEditingRule] = useState<ReorderRule | null>(null)
  const [formSafetyStock, setFormSafetyStock] = useState<number>(0)
  const [formReorderPoint, setFormReorderPoint] = useState<number>(0)
  const [formServiceLevel, setFormServiceLevel] = useState<number>(95)
  const [formLeadTimeMean, setFormLeadTimeMean] = useState<number>(5)
  const [formLeadTimeStd, setFormLeadTimeStd] = useState<number>(1.5)
  const [formEoq, setFormEoq] = useState<number>(200)
  const [formAutoApprove, setFormAutoApprove] = useState<boolean>(true)
  const [justAutoCalculated, setJustAutoCalculated] = useState<boolean>(false)

  // Locations list
  const locations = useMemo(() => {
    const set = new Set<string>()
    INITIAL_RULES.forEach((r) => set.add(r.location))
    return ['All', ...Array.from(set)]
  }, [])

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchLocation = selectedLocation === 'All' || rule.location === selectedLocation
      const q = searchQuery.trim().toLowerCase()
      const matchSearch =
        !q ||
        rule.product.toLowerCase().includes(q) ||
        rule.location.toLowerCase().includes(q) ||
        rule.productId.toLowerCase().includes(q)
      return matchLocation && matchSearch
    })
  }, [rules, selectedLocation, searchQuery])

  // Summary counts
  const belowRopCount = useMemo(() => {
    return rules.filter((r) => r.currentStock < r.reorderPoint).length
  }, [rules])

  const autoApproveActiveCount = useMemo(() => {
    return rules.filter((r) => globalAutoApprove && r.autoApprove).length
  }, [rules, globalAutoApprove])

  // Recalculate All handler
  const handleRecalculateAll = () => {
    if (isRecalculating) return

    setIsRecalculating(true)
    const totalSimulated = 120
    const steps = [15, 45, 88, 120]
    let stepIndex = 0

    setRecalcProgress({ current: steps[0], total: totalSimulated })

    const interval = setInterval(() => {
      stepIndex++
      if (stepIndex < steps.length) {
        setRecalcProgress({ current: steps[stepIndex], total: totalSimulated })
      } else {
        clearInterval(interval)
        setIsRecalculating(false)
        setRecalcProgress(null)
        setRecentlyAnimated(true)
        setTimeout(() => setRecentlyAnimated(false), 2500)

        // Update timestamps & adjust slight variances to simulate fresh statistical recalculation
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setRules((prev) =>
          prev.map((r) => {
            const z = getZForServiceLevel(r.serviceLevel)
            const d = r.dailyDemandMean ?? Math.max(5, Math.round((r.reorderPoint - r.safetyStock) / r.leadTimeMean))
            const sigmaD = r.dailyDemandStd ?? Math.max(1, +(d * 0.22).toFixed(1))
            const sigmaLTD = Math.sqrt(r.leadTimeMean * Math.pow(sigmaD, 2) + Math.pow(d, 2) * Math.pow(r.leadTimeStd, 2))
            const newSS = Math.round(z * sigmaLTD)
            const newRop = Math.round(d * r.leadTimeMean + newSS)
            const cost = r.unitCost ?? 10
            const annualDemand = d * 365
            const newEoq = Math.round(Math.sqrt((2 * annualDemand * 50) / (cost * 0.2)))

            return {
              ...r,
              safetyStock: newSS,
              reorderPoint: newRop,
              eoq: newEoq,
              lastRecalculated: `Today, ${now}`,
            }
          }),
        )

        toast(
          `Recalculation complete: 120 inventory rules refreshed with latest lead-time and demand variance models.`,
          'success',
        )
      }
    }, 400)
  }

  // Global toggle handler
  const handleToggleGlobalAutoApprove = () => {
    const nextVal = !globalAutoApprove
    setGlobalAutoApprove(nextVal)
    if (nextVal) {
      toast(
        `Auto-Approve POs enabled: Draft purchase orders will be automatically generated when stock drops below reorder point.`,
        'success',
      )
    } else {
      toast(
        `Auto-Approve POs disabled: Restock orders require manual authorization.`,
        'warning',
      )
    }
  }

  // Open Edit Drawer
  const handleOpenEdit = (rule: ReorderRule) => {
    setEditingRule(rule)
    setFormSafetyStock(rule.safetyStock)
    setFormReorderPoint(rule.reorderPoint)
    setFormServiceLevel(rule.serviceLevel)
    setFormLeadTimeMean(rule.leadTimeMean)
    setFormLeadTimeStd(rule.leadTimeStd)
    setFormEoq(rule.eoq)
    setFormAutoApprove(rule.autoApprove)
    setJustAutoCalculated(false)
  }

  // Auto-Calculate inside Drawer
  const handleAutoCalculateForm = () => {
    if (!editingRule) return

    const z = getZForServiceLevel(formServiceLevel)
    const d =
      editingRule.dailyDemandMean ??
      Math.max(5, Math.round((formReorderPoint - formSafetyStock) / (formLeadTimeMean || 1)))
    const sigmaD = editingRule.dailyDemandStd ?? Math.max(1, +(d * 0.22).toFixed(1))

    // σ_LTD = √(L · σ_d² + d² · σ_L²)
    const varianceLTD = formLeadTimeMean * Math.pow(sigmaD, 2) + Math.pow(d, 2) * Math.pow(formLeadTimeStd, 2)
    const sigmaLTD = Math.sqrt(varianceLTD)
    const newSS = Math.max(5, Math.round(z * sigmaLTD))
    const newRop = Math.max(newSS + 5, Math.round(d * formLeadTimeMean + newSS))

    // EOQ = √(2DS / H)
    const cost = editingRule.unitCost ?? 12
    const annualDemand = d * 365
    const holdingCost = Math.max(0.5, cost * 0.2)
    const orderCost = 50
    const newEoq = Math.round(Math.sqrt((2 * annualDemand * orderCost) / holdingCost))

    setFormSafetyStock(newSS)
    setFormReorderPoint(newRop)
    setFormEoq(newEoq)
    setJustAutoCalculated(true)

    toast(
      `Parameters auto-calculated: SS=${newSS}, ROP=${newRop}, EOQ=${newEoq} (Z=${z.toFixed(2)})`,
      'info',
    )
  }

  // Save changes from Drawer
  const handleSaveDrawer = () => {
    if (!editingRule) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setRules((prev) =>
      prev.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              safetyStock: Number(formSafetyStock),
              reorderPoint: Number(formReorderPoint),
              serviceLevel: Number(formServiceLevel),
              leadTimeMean: Number(formLeadTimeMean),
              leadTimeStd: Number(formLeadTimeStd),
              eoq: Number(formEoq),
              autoApprove: formAutoApprove,
              lastRecalculated: `Today, ${now}`,
            }
          : r,
      ),
    )

    toast(`Reorder rule for "${editingRule.product}" saved successfully.`, 'success')
    setEditingRule(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Reorder Rules & Optimization"
        subtitle="Manage statistical inventory formulas (Safety Stock, ROP, EOQ) with automated variance recalibration."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-Approve Global Toggle */}
            <button
              type="button"
              onClick={handleToggleGlobalAutoApprove}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-[8px] border px-3.5 text-xs font-semibold transition-all',
                globalAutoApprove
                  ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                  : 'border-border bg-surface text-muted hover:bg-app',
              )}
              title="When ON, auto-generates draft POs when stock dips below reorder point"
            >
              {globalAutoApprove ? (
                <ToggleRight className="h-5 w-5 text-primary" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted" />
              )}
              <span>Auto-Approve POs</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] uppercase font-bold',
                  globalAutoApprove ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700',
                )}
              >
                {globalAutoApprove ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Recalculate All Primary Button */}
            <Button
              variant="primary"
              onClick={handleRecalculateAll}
              disabled={isRecalculating}
              icon={<RefreshCw className={cn('h-4 w-4', isRecalculating && 'animate-spin')} />}
            >
              {isRecalculating ? 'Recalculating...' : 'Recalculate All'}
            </Button>
          </div>
        }
      />

      {/* Progress Bar Banner when Recalculating */}
      {isRecalculating && recalcProgress && (
        <Card className="border-primary/30 bg-primary/5 py-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-2 text-primary font-semibold">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Recalculating… {recalcProgress.current}/{recalcProgress.total} rules
              </span>
              <span className="text-muted">
                {Math.round((recalcProgress.current / recalcProgress.total) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{
                  width: `${(recalcProgress.current / recalcProgress.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-muted">
              Running stochastic Monte-Carlo lead-time and demand variance models for all SKUs...
            </p>
          </div>
        </Card>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Total Active Rules</p>
            <div className="rounded-[8px] bg-blue-50 p-2 text-primary">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">{rules.length}</p>
          <p className="mt-1 text-xs text-muted">Covering all monitored stocking points</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Below Reorder Point</p>
            <div className="rounded-[8px] bg-red-50 p-2 text-error">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-error">{belowRopCount}</p>
          <p className="mt-1 text-xs text-muted">
            {belowRopCount > 0 ? 'Urgent purchase replenishment triggered' : 'All stocks healthy'}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Auto-Approve POs</p>
            <div className="rounded-[8px] bg-green-50 p-2 text-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">
            {globalAutoApprove ? `${autoApproveActiveCount} Active` : 'Disabled'}
          </p>
          <p className="mt-1 text-xs text-muted">
            {globalAutoApprove
              ? 'Draft POs auto-issued upon threshold breach'
              : 'Manual review required globally'}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Avg Service Level</p>
            <div className="rounded-[8px] bg-purple-50 p-2 text-purple-700">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">
            {(
              rules.reduce((acc, r) => acc + r.serviceLevel, 0) / (rules.length || 1)
            ).toFixed(1)}
            %
          </p>
          <p className="mt-1 text-xs text-muted">Mean stockout prevention target</p>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rule by product or location..."
                className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === 'All' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>Tinted rows indicate Current Stock &lt; Reorder Point</span>
          </div>
        </div>
      </Card>

      {/* Rules Table Card */}
      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-border bg-app/80 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">
                  <div className="inline-flex items-center gap-1">
                    <span>Safety Stock</span>
                    <button
                      type="button"
                      onClick={() => setActiveTooltip('safetyStock')}
                      className="rounded p-0.5 text-muted hover:bg-slate-200 hover:text-text transition-colors"
                      title="Explain Safety Stock math"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="inline-flex items-center gap-1">
                    <span>Reorder Point</span>
                    <button
                      type="button"
                      onClick={() => setActiveTooltip('reorderPoint')}
                      className="rounded p-0.5 text-muted hover:bg-slate-200 hover:text-text transition-colors"
                      title="Explain Reorder Point math"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="inline-flex items-center gap-1">
                    <span>EOQ</span>
                    <button
                      type="button"
                      onClick={() => setActiveTooltip('eoq')}
                      className="rounded p-0.5 text-muted hover:bg-slate-200 hover:text-text transition-colors"
                      title="Explain EOQ math"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="inline-flex items-center gap-1">
                    <span>Service Level</span>
                    <button
                      type="button"
                      onClick={() => setActiveTooltip('serviceLevel')}
                      className="rounded p-0.5 text-muted hover:bg-slate-200 hover:text-text transition-colors"
                      title="Explain Service Level (CSL)"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="inline-flex items-center gap-1">
                    <span>Lead Time</span>
                    <button
                      type="button"
                      onClick={() => setActiveTooltip('leadTime')}
                      className="rounded p-0.5 text-muted hover:bg-slate-200 hover:text-text transition-colors"
                      title="Explain Lead Time parameters"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">Last Recalculated</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="h-8 w-8 text-muted/60" />
                      <p className="font-medium text-text">No reorder rules found</p>
                      <p className="text-xs text-muted">
                        Try modifying your location filter or search terms.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const isStockLow = rule.currentStock < rule.reorderPoint
                  const isAutoPoTriggered = isStockLow && globalAutoApprove && rule.autoApprove

                  return (
                    <tr
                      key={rule.id}
                      className={cn(
                        'border-b border-border/70 transition-colors',
                        isStockLow
                          ? 'bg-red-50/60 hover:bg-red-50'
                          : 'hover:bg-app/50',
                        recentlyAnimated && 'animate-pulse bg-blue-50/40',
                      )}
                    >
                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2">
                          {isStockLow ? (
                            <span
                              className="mt-0.5 rounded-full bg-red-100 p-1 text-red-600"
                              title={`Current stock (${rule.currentStock}) is below Reorder Point (${rule.reorderPoint})`}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="mt-0.5 rounded-full bg-slate-100 p-1 text-slate-400">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text">{rule.product}</span>
                              {isAutoPoTriggered && (
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                  Draft PO Generated
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                              <span>SKU: {rule.productId.toUpperCase()}</span>
                              <span>·</span>
                              <span
                                className={cn(
                                  'font-medium',
                                  isStockLow ? 'text-red-600 font-semibold' : 'text-slate-600',
                                )}
                              >
                                Stock: {rule.currentStock} units
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <span className="rounded-[6px] bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {rule.location}
                        </span>
                      </td>

                      {/* Safety Stock */}
                      <td className="px-4 py-3.5 font-medium text-text">
                        <span className="font-mono text-sm">{rule.safetyStock}</span>
                        <span className="ml-1 text-xs text-muted">units</span>
                      </td>

                      {/* Reorder Point */}
                      <td className="px-4 py-3.5 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'font-mono text-sm font-semibold',
                              isStockLow ? 'text-red-700' : 'text-text',
                            )}
                          >
                            {rule.reorderPoint}
                          </span>
                          <span className="text-xs text-muted">units</span>
                        </div>
                      </td>

                      {/* EOQ */}
                      <td className="px-4 py-3.5 font-medium text-text">
                        <span className="font-mono text-sm">{rule.eoq}</span>
                        <span className="ml-1 text-xs text-muted">units</span>
                      </td>

                      {/* Service Level */}
                      <td className="px-4 py-3.5">
                        <Chip
                          label={`${rule.serviceLevel}%`}
                          tone={
                            rule.serviceLevel >= 98
                              ? 'info'
                              : rule.serviceLevel >= 95
                              ? 'good'
                              : 'neutral'
                          }
                        />
                      </td>

                      {/* Lead Time */}
                      <td className="px-4 py-3.5 text-xs text-text font-medium">
                        <span className="font-mono">
                          {rule.leadTimeMean.toFixed(1)} ± {rule.leadTimeStd.toFixed(1)}
                        </span>
                        <span className="ml-1 text-muted">days</span>
                      </td>

                      {/* Last Recalculated */}
                      <td className="px-4 py-3.5 text-xs text-muted">
                        <div className="flex items-center gap-1">
                          <span>{rule.lastRecalculated}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="secondary"
                          className="h-8 px-2.5 text-xs"
                          icon={<Settings className="h-3.5 w-3.5" />}
                          onClick={() => handleOpenEdit(rule)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="flex flex-col gap-2 border-t border-border bg-app/40 px-4 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing <strong>{filteredRules.length}</strong> of <strong>{rules.length}</strong> rules
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Auto-Approve Policy Active
            </span>
            <span>Lead times synced hourly via ERP log adapter</span>
          </div>
        </div>
      </Card>

      {/* Formula Explanation Dialog / Popover Modal */}
      {activeTooltip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-[12px] border border-border bg-surface p-5 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-[8px] bg-primary/10 p-1.5 text-primary">
                  <Info className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-text">
                  {FORMULA_EXPLANATIONS[activeTooltip].title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTooltip(null)}
                className="rounded-[6px] p-1 text-muted hover:bg-app hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-left">
              {/* Formula display box */}
              <div className="rounded-[8px] border border-primary/20 bg-primary/5 p-3 font-mono text-sm text-primary font-semibold">
                <div>{FORMULA_EXPLANATIONS[activeTooltip].formula}</div>
                {FORMULA_EXPLANATIONS[activeTooltip].subFormula && (
                  <div className="mt-1 text-xs text-primary/80">
                    {FORMULA_EXPLANATIONS[activeTooltip].subFormula}
                  </div>
                )}
              </div>

              {/* Variables breakdown */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Variable Definitions
                </p>
                <div className="mt-2 space-y-2">
                  {FORMULA_EXPLANATIONS[activeTooltip].variables.map((v) => (
                    <div key={v.symbol} className="flex items-start gap-2 text-xs">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-800">
                        {v.symbol}
                      </span>
                      <span className="text-text">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical Notes */}
              <div className="rounded-[8px] bg-slate-50 p-3 text-xs text-muted">
                <p className="font-semibold text-text mb-0.5">Statistical Rationale</p>
                <p>{FORMULA_EXPLANATIONS[activeTooltip].notes}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button variant="secondary" onClick={() => setActiveTooltip(null)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Drawer for Manual Overrides */}
      <Drawer
        open={!!editingRule}
        title={editingRule ? `Edit Reorder Rule — ${editingRule.product}` : 'Edit Rule'}
        onClose={() => setEditingRule(null)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setEditingRule(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveDrawer}>
              Save Changes
            </Button>
          </div>
        }
      >
        {editingRule && (
          <div className="space-y-6 text-left">
            {/* Rule metadata summary banner */}
            <div className="rounded-[8px] border border-border bg-app/50 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Location:</span>
                <span className="font-medium text-text">{editingRule.location}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-muted">Current Stock:</span>
                <span
                  className={cn(
                    'font-medium',
                    editingRule.currentStock < editingRule.reorderPoint
                      ? 'text-red-600 font-semibold'
                      : 'text-text',
                  )}
                >
                  {editingRule.currentStock} units{' '}
                  {editingRule.currentStock < editingRule.reorderPoint ? '(Below ROP)' : '(Healthy)'}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-muted">Historical Daily Demand:</span>
                <span className="font-medium text-text">
                  ~{editingRule.dailyDemandMean ?? 15} units/day (σ={editingRule.dailyDemandStd ?? 3.5})
                </span>
              </div>
            </div>

            {/* Auto-Calculate Action Card */}
            <div className="rounded-[8px] border border-primary/20 bg-primary/5 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-text flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Automated Calculation
                  </h4>
                  <p className="mt-0.5 text-xs text-muted">
                    Re-evaluate Safety Stock, ROP, and EOQ based on target service level & lead time parameters.
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="h-8 px-2.5 text-xs shrink-0"
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                  onClick={handleAutoCalculateForm}
                >
                  Auto-Calculate
                </Button>
              </div>

              {justAutoCalculated && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded p-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Calculated via SS = Z·σ_LTD and ROP = d·L + SS formulas.
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Parameter Controls & Overrides
              </h4>

              {/* Service Level */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-text">
                  Service Level (Cycle Probability)
                </label>
                <select
                  value={formServiceLevel}
                  onChange={(e) => setFormServiceLevel(Number(e.target.value))}
                  className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value={90}>90% (Z = 1.28 - Low criticality)</option>
                  <option value={92}>92% (Z = 1.41 - Standard)</option>
                  <option value={95}>95% (Z = 1.65 - High availability)</option>
                  <option value={97}>97% (Z = 1.88 - Sensitive care)</option>
                  <option value={98}>98% (Z = 2.05 - Critical supplies)</option>
                  <option value={99}>99% (Z = 2.33 - Life-support / Trauma)</option>
                </select>
              </div>

              {/* Safety Stock */}
              <div className="space-y-1">
                <Input
                  label="Safety Stock Buffer (Units)"
                  type="number"
                  min={0}
                  value={formSafetyStock}
                  onChange={(e) => setFormSafetyStock(Number(e.target.value))}
                />
                <span className="text-[11px] text-muted">
                  Minimum buffer held to absorb unforeseen demand surges.
                </span>
              </div>

              {/* Reorder Point */}
              <div className="space-y-1">
                <Input
                  label="Reorder Point (ROP Units)"
                  type="number"
                  min={0}
                  value={formReorderPoint}
                  onChange={(e) => setFormReorderPoint(Number(e.target.value))}
                />
                <span className="text-[11px] text-muted">
                  Inventory trigger point: orders placed when stock drops to this level.
                </span>
              </div>

              {/* EOQ */}
              <div className="space-y-1">
                <Input
                  label="Economic Order Quantity (EOQ)"
                  type="number"
                  min={1}
                  value={formEoq}
                  onChange={(e) => setFormEoq(Number(e.target.value))}
                />
                <span className="text-[11px] text-muted">
                  Optimal PO order volume balancing holding vs batch shipping fees.
                </span>
              </div>

              {/* Lead Time Mean and Std Dev */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    label="Lead Time Mean (Days)"
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={formLeadTimeMean}
                    onChange={(e) => setFormLeadTimeMean(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    label="Lead Time Std (Days)"
                    type="number"
                    step="0.1"
                    min={0}
                    value={formLeadTimeStd}
                    onChange={(e) => setFormLeadTimeStd(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Rule Auto-Approve Switch */}
              <div className="rounded-[8px] border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">Auto-Approve for this SKU</p>
                  <p className="text-xs text-muted">
                    Auto-generate PO when stock dips below {formReorderPoint} units.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAutoApprove((prev) => !prev)}
                  className="p-1 text-primary hover:opacity-80"
                >
                  {formAutoApprove ? (
                    <ToggleRight className="h-6 w-6 text-primary" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-muted" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
