import { useState, useMemo, useCallback } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
  Layers,
  Cpu,
  BarChart3,
  Sliders,
  ArrowRight,
  Filter,
  Package,
  MapPin,
  Clock,
  Activity,
  Zap,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Select } from '../components/ui/Select'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'

// ---------------------------------------------------------------------------
// Product & Location Master Data
// ---------------------------------------------------------------------------

interface ProductMeta {
  id: string
  name: string
  sku: string
  category: string
  baseDemand: number
  currentSafetyStock: number
  currentReorderPoint: number
  mae: number
  rmse: number
  mape: number
  r2: number
  unit: string
}

const PRODUCTS: ProductMeta[] = [
  {
    id: 'p2',
    name: 'IV Saline 500ml',
    sku: 'SKU-2088',
    category: 'Fluids & Solutions',
    baseDemand: 46,
    currentSafetyStock: 45,
    currentReorderPoint: 110,
    mae: 12.3,
    rmse: 18.7,
    mape: 8.2,
    r2: 0.941,
    unit: 'bags',
  },
  {
    id: 'p1',
    name: 'Surgical Gloves (L)',
    sku: 'SKU-1042',
    category: 'Consumables & PPE',
    baseDemand: 85,
    currentSafetyStock: 80,
    currentReorderPoint: 220,
    mae: 16.8,
    rmse: 22.4,
    mape: 7.6,
    r2: 0.952,
    unit: 'boxes',
  },
  {
    id: 'p3',
    name: 'Amoxicillin 500mg',
    sku: 'SKU-3091',
    category: 'Antibiotics',
    baseDemand: 34,
    currentSafetyStock: 60,
    currentReorderPoint: 180,
    mae: 8.5,
    rmse: 12.1,
    mape: 9.1,
    r2: 0.928,
    unit: 'strips',
  },
  {
    id: 'p4',
    name: 'Paracetamol 500mg',
    sku: 'SKU-4402',
    category: 'Analgesics',
    baseDemand: 62,
    currentSafetyStock: 70,
    currentReorderPoint: 160,
    mae: 11.2,
    rmse: 15.8,
    mape: 8.4,
    r2: 0.939,
    unit: 'packs',
  },
  {
    id: 'p5',
    name: 'N95 Respirator Mask',
    sku: 'SKU-1199',
    category: 'Respiratory Protection',
    baseDemand: 28,
    currentSafetyStock: 35,
    currentReorderPoint: 90,
    mae: 7.1,
    rmse: 10.4,
    mape: 8.9,
    r2: 0.934,
    unit: 'boxes',
  },
  {
    id: 'p6',
    name: 'Sterile Gauze Roll 4"',
    sku: 'SKU-3310',
    category: 'Wound Care',
    baseDemand: 42,
    currentSafetyStock: 50,
    currentReorderPoint: 125,
    mae: 9.8,
    rmse: 14.2,
    mape: 8.7,
    r2: 0.945,
    unit: 'rolls',
  },
]

interface LocationMeta {
  id: string
  name: string
  multiplier: number
}

const LOCATIONS: LocationMeta[] = [
  { id: 'all', name: 'All Locations (Consolidated)', multiplier: 2.2 },
  { id: 'loc-cold', name: 'Cold Store (Main Hub)', multiplier: 1.0 },
  { id: 'loc-a', name: 'Warehouse A (North Wing)', multiplier: 1.25 },
  { id: 'loc-b', name: 'Warehouse B (South Depot)', multiplier: 0.85 },
  { id: 'loc-clinic', name: 'Clinic North (Dispensary)', multiplier: 0.45 },
  { id: 'loc-pharmacy', name: 'Pharmacy Store (Central)', multiplier: 0.65 },
]

// Promotional & Clinical Events
interface PromoEvent {
  id: string
  date: string // YYYY-MM-DD
  labelDate: string // MMM dd (e.g., 'Oct 28')
  name: string
  shortLabel: string
  boost: number
  description: string
}

const PROMOTIONAL_EVENTS: PromoEvent[] = [
  {
    id: 'pr-1',
    date: '2026-08-14',
    labelDate: 'Aug 14',
    name: 'Annual Monsoon Preparedness Drive',
    shortLabel: 'Monsoon Prep',
    boost: 1.32,
    description: 'Bulk emergency stock reservation across primary care facilities.',
  },
  {
    id: 'pr-2',
    date: '2026-09-12',
    labelDate: 'Sep 12',
    name: 'State Immunization Week',
    shortLabel: 'Immunization Wk',
    boost: 1.38,
    description: 'Surge in sterile supplies, cold chain consumables, and syringes.',
  },
  {
    id: 'pr-3',
    date: '2026-10-02',
    labelDate: 'Oct 02',
    name: 'Regional Hospital Health Drive',
    shortLabel: 'Health Drive',
    boost: 1.28,
    description: 'Outpatient volume peak and preventive medicine dispensing.',
  },
  {
    id: 'pr-4',
    date: '2026-10-28',
    labelDate: 'Oct 28',
    name: 'Flu Season Spike Campaign',
    shortLabel: 'Flu Surge Spike',
    boost: 1.34,
    description: 'Predicted 34% demand acceleration due to seasonal respiratory infections.',
  },
  {
    id: 'pr-5',
    date: '2026-11-10',
    labelDate: 'Nov 10',
    name: 'Winter Surge Prep',
    shortLabel: 'Winter Prep',
    boost: 1.26,
    description: 'Annual cold weather surgical and trauma clinic restocking cycle.',
  },
]

// ---------------------------------------------------------------------------
// Chart & Forecast Data Interfaces
// ---------------------------------------------------------------------------

interface ChartPoint {
  date: string // e.g. "Oct 18"
  fullDate: string // "2026-10-18"
  timestamp: number
  actual?: number | null
  forecast?: number | null
  ciLower?: number | null
  ciUpper?: number | null
  ciRange?: [number, number] | null
  isForecast: boolean
  promo?: string
}

interface WeeklyForecastRow {
  weekNum: number
  weekLabel: string
  dateRange: string
  forecastedDemand: number
  ciLower: number
  ciUpper: number
  suggestedSafetyStock: number
  currentSafetyStock: number
  suggestedReorderPoint: number
  currentReorderPoint: number
  trendPct: number
  confidenceLevel: number
  highlight?: string
}

// ---------------------------------------------------------------------------
// Deterministic Synthetic Data Generator
// ---------------------------------------------------------------------------

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateForecastDataset(
  product: ProductMeta,
  location: LocationMeta,
  historicalDays: number,
): {
  chartPoints: ChartPoint[]
  weeklyRows: WeeklyForecastRow[]
  activePromos: PromoEvent[]
  peakForecast: number
  totalForecast30D: number
} {
  // Anchor date: Sunday, Oct 18, 2026
  const anchorYear = 2026
  const anchorMonth = 9 // 0-indexed: October is 9
  const anchorDay = 18
  const anchorDate = new Date(anchorYear, anchorMonth, anchorDay)

  const chartPoints: ChartPoint[] = []
  const promoMap = new Map<string, PromoEvent>()
  PROMOTIONAL_EVENTS.forEach((p) => {
    promoMap.set(p.date, p)
  })

  // Day-of-week seasonality factors (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const dayOfWeekSeasonality = [0.72, 1.28, 1.18, 1.12, 1.06, 0.96, 0.76]

  const baseVal = product.baseDemand * location.multiplier
  const seedBase = product.name.length * 100 + location.name.length * 10

  // 1. Generate Historical Days: from -historicalDays up to 0 (Today)
  for (let offset = -historicalDays; offset <= 0; offset++) {
    const curDate = new Date(anchorYear, anchorMonth, anchorDay + offset)
    const yyyy = curDate.getFullYear()
    const mm = String(curDate.getMonth() + 1).padStart(2, '0')
    const dd = String(curDate.getDate()).padStart(2, '0')
    const isoDate = `${yyyy}-${mm}-${dd}`
    const labelDate = curDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    const dow = curDate.getDay()
    const seasonality = dayOfWeekSeasonality[dow]
    const slightTrend = (offset / 180) * 0.12
    const sineWave = Math.sin((offset / 28) * Math.PI * 2) * 0.08
    const noise = (pseudoRandom(seedBase + offset * 19) - 0.48) * 0.16

    let demand = Math.round(baseVal * (seasonality + slightTrend + sineWave + noise))
    if (demand < 5) demand = 5

    // Check promotional event
    const promo = promoMap.get(isoDate)
    if (promo) {
      demand = Math.round(demand * promo.boost)
    }

    if (offset === 0) {
      // Transition Day: Anchor (Today, Oct 18)
      // Both actual and forecast meet here so there is seamless visual continuity
      chartPoints.push({
        date: labelDate,
        fullDate: isoDate,
        timestamp: curDate.getTime(),
        actual: demand,
        forecast: demand,
        ciLower: demand,
        ciUpper: demand,
        ciRange: [demand, demand],
        isForecast: false,
        promo: promo?.shortLabel,
      })
    } else {
      chartPoints.push({
        date: labelDate,
        fullDate: isoDate,
        timestamp: curDate.getTime(),
        actual: demand,
        forecast: null,
        ciLower: null,
        ciUpper: null,
        ciRange: undefined,
        isForecast: false,
        promo: promo?.shortLabel,
      })
    }
  }

  // 2. Generate 30-Day Forecast: from day +1 to +30
  let totalForecast30D = 0
  let peakForecast = 0

  for (let offset = 1; offset <= 30; offset++) {
    const curDate = new Date(anchorYear, anchorMonth, anchorDay + offset)
    const yyyy = curDate.getFullYear()
    const mm = String(curDate.getMonth() + 1).padStart(2, '0')
    const dd = String(curDate.getDate()).padStart(2, '0')
    const isoDate = `${yyyy}-${mm}-${dd}`
    const labelDate = curDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    const dow = curDate.getDay()
    const seasonality = dayOfWeekSeasonality[dow]
    const forwardTrend = (offset / 30) * 0.06
    const sineWave = Math.sin((offset / 28) * Math.PI * 2) * 0.06

    let forecastVal = Math.round(baseVal * (seasonality + forwardTrend + sineWave))
    const promo = promoMap.get(isoDate)
    if (promo) {
      forecastVal = Math.round(forecastVal * promo.boost)
    }

    // Confidence interval expands as forecast horizon increases into the future
    // Day 1: ~ ±8% -> Day 30: ~ ±21%
    const errorSpread = 0.08 + (offset / 30) * 0.13
    const ciLower = Math.max(1, Math.round(forecastVal * (1 - errorSpread)))
    const ciUpper = Math.round(forecastVal * (1 + errorSpread))

    totalForecast30D += forecastVal
    if (forecastVal > peakForecast) {
      peakForecast = forecastVal
    }

    chartPoints.push({
      date: labelDate,
      fullDate: isoDate,
      timestamp: curDate.getTime(),
      actual: null,
      forecast: forecastVal,
      ciLower,
      ciUpper,
      ciRange: [ciLower, ciUpper],
      isForecast: true,
      promo: promo?.shortLabel,
    })
  }

  // Filter active promotions that fall within the displayed date window
  const minTimestamp = chartPoints[0]?.timestamp ?? 0
  const maxTimestamp = chartPoints[chartPoints.length - 1]?.timestamp ?? Infinity
  const activePromos = PROMOTIONAL_EVENTS.filter((pr) => {
    const t = new Date(pr.date).getTime()
    return t >= minTimestamp && t <= maxTimestamp
  })

  // 3. Generate Weekly Forecast Rows for Bottom Table (Upcoming 5 Weeks)
  // Week 43: Oct 19 - Oct 25
  // Week 44: Oct 26 - Nov 01
  // Week 45: Nov 02 - Nov 08
  // Week 46: Nov 09 - Nov 15
  // Week 47: Nov 16 - Nov 22
  const weekDefinitions = [
    {
      num: 43,
      range: 'Oct 19 – Oct 25',
      trend: 4.2,
      conf: 94,
      highlight: 'Immediate Cycle',
      mult: 1.02,
    },
    {
      num: 44,
      range: 'Oct 26 – Nov 01',
      trend: 10.8,
      conf: 91,
      highlight: 'Flu Surge Peak',
      mult: 1.15,
    },
    {
      num: 45,
      range: 'Nov 02 – Nov 08',
      trend: -5.4,
      conf: 88,
      highlight: 'Post-Spike Normal',
      mult: 0.98,
    },
    {
      num: 46,
      range: 'Nov 09 – Nov 15',
      trend: 3.6,
      conf: 85,
      highlight: 'Winter Inbound',
      mult: 1.05,
    },
    {
      num: 47,
      range: 'Nov 16 – Nov 22',
      trend: -2.1,
      conf: 82,
      highlight: 'Baseline Stabilized',
      mult: 0.96,
    },
  ]

  const weeklyRows: WeeklyForecastRow[] = weekDefinitions.map((w, idx) => {
    // 7 days demand
    const weeklyForecast = Math.round(baseVal * 7 * w.mult)
    const spreadPct = 0.08 + idx * 0.025
    const ciLower = Math.round(weeklyForecast * (1 - spreadPct))
    const ciUpper = Math.round(weeklyForecast * (1 + spreadPct))

    // Suggested Safety Stock based on demand volatility & service level
    // Safety Stock ~ 1.65 * daily_std * sqrt(lead_time ~ 6 days)
    const suggestedSS = Math.round(
      product.currentSafetyStock * location.multiplier * (0.92 + w.mult * 0.14),
    )

    // Suggested Reorder Point = (Daily Demand * Lead Time ~ 5.5 days) + Safety Stock
    const suggestedRP = Math.round((weeklyForecast / 7) * 5.5 + suggestedSS)

    return {
      weekNum: w.num,
      weekLabel: `Week ${w.num}`,
      dateRange: w.range,
      forecastedDemand: weeklyForecast,
      ciLower,
      ciUpper,
      suggestedSafetyStock: suggestedSS,
      currentSafetyStock: Math.round(product.currentSafetyStock * location.multiplier),
      suggestedReorderPoint: suggestedRP,
      currentReorderPoint: Math.round(product.currentReorderPoint * location.multiplier),
      trendPct: w.trend,
      confidenceLevel: w.conf,
      highlight: w.highlight,
    }
  })

  return {
    chartPoints,
    weeklyRows,
    activePromos,
    peakForecast,
    totalForecast30D,
  }
}

// ---------------------------------------------------------------------------
// Custom Recharts Tooltip Component
// ---------------------------------------------------------------------------

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number | [number, number]
    name: string
    color: string
    dataKey: string
    payload: ChartPoint
  }>
  label?: string
}

function CustomForecastTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  const isHistorical = data.actual !== null && data.actual !== undefined
  const isForecast = data.forecast !== null && data.forecast !== undefined

  return (
    <div className="min-w-[220px] rounded-[10px] border border-border bg-surface p-3.5 shadow-xl transition-all">
      {/* Date Header */}
      <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{data.fullDate}</span>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
            data.isForecast
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-700',
          )}
        >
          {data.isForecast ? 'Forecast' : 'Historical'}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {/* Actual Demand */}
        {isHistorical && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
              Actual Demand:
            </span>
            <span className="font-bold text-text">
              {data.actual?.toLocaleString()} units
            </span>
          </div>
        )}

        {/* Forecasted Demand */}
        {isForecast && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-dashed border-blue-600 bg-blue-100" />
              Projected Demand:
            </span>
            <span className="font-bold text-primary">
              {data.forecast?.toLocaleString()} units
            </span>
          </div>
        )}

        {/* 95% Confidence Interval */}
        {data.ciLower !== null &&
          data.ciUpper !== null &&
          data.ciLower !== undefined &&
          data.ciUpper !== undefined && (
            <div className="rounded-[6px] bg-blue-50/70 p-2 text-[11px] text-blue-900 border border-blue-100">
              <div className="flex items-center justify-between font-medium">
                <span className="text-muted">95% Confidence Bounds:</span>
                <span className="font-semibold text-blue-700">
                  {data.ciLower} – {data.ciUpper}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                <span>Spread Uncertainty:</span>
                <span>
                  ±
                  {data.forecast
                    ? Math.round(
                        ((data.ciUpper - data.forecast) / data.forecast) * 100,
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          )}

        {/* Promotion Event Badge */}
        {data.promo && (
          <div className="mt-1.5 flex items-center gap-1.5 rounded-[6px] bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 border border-amber-200">
            <Zap className="h-3 w-3 text-amber-600 shrink-0" />
            <span>Event: {data.promo}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom Chart Legend
// ---------------------------------------------------------------------------

function CustomChartLegend() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-3 text-xs text-muted">
      <div className="flex items-center gap-2">
        <span className="h-1 w-5 rounded-full bg-blue-600" />
        <span className="font-medium text-text">Historical Demand</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-0.5 w-5 border-t-2 border-dashed border-blue-600" />
        <span className="font-medium text-text">30-Day Forecast (LSTM)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-4 rounded-xs border border-blue-300 bg-blue-100" />
        <span className="font-medium text-text">95% Confidence Interval</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-0.5 w-5 border-t-2 border-dashed border-amber-500" />
        <span className="font-medium text-amber-700">Promotional Marker</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ForecastsPage Component
// ---------------------------------------------------------------------------

export function ForecastsPage() {
  const { toast } = useToast()

  // State: Selectors & Filters
  const [selectedProductId, setSelectedProductId] = useState<string>('p2')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [historicalDays, setHistoricalDays] = useState<number>(90)

  // State: Model Training & Refreshing
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [lastTrainedTimestamp, setLastTrainedTimestamp] = useState<string>(
    'Oct 17, 2026, 03:00 UTC (18h ago)',
  )
  const [modelMetrics, setModelMetrics] = useState({
    mae: 12.3,
    rmse: 18.7,
    mape: 8.2,
    r2: 0.941,
  })

  // State: Applied weekly rules tracker
  const [appliedWeeks, setAppliedWeeks] = useState<Set<number>>(new Set())

  // Lookups
  const currentProduct = useMemo(
    () => PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0],
    [selectedProductId],
  )

  const currentLocation = useMemo(
    () => LOCATIONS.find((l) => l.id === selectedLocationId) || LOCATIONS[0],
    [selectedLocationId],
  )

  // Generate Computed Dataset
  const {
    chartPoints,
    weeklyRows,
    activePromos,
    peakForecast,
    totalForecast30D,
  } = useMemo(() => {
    return generateForecastDataset(
      currentProduct,
      currentLocation,
      historicalDays,
    )
  }, [currentProduct, currentLocation, historicalDays])

  // Handle Refresh Forecast
  const handleRefreshForecast = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
      setLastTrainedTimestamp(`Just now (Oct 18, 2026, ${timeStr} UTC)`)

      // Slight calibration micro-optimization
      setModelMetrics((prev) => ({
        mae: Number((prev.mae * 0.98).toFixed(1)),
        rmse: Number((prev.rmse * 0.98).toFixed(1)),
        mape: Number((prev.mape * 0.97).toFixed(1)),
        r2: Number(Math.min(0.965, prev.r2 + 0.003).toFixed(3)),
      }))

      toast(
        `Forecast refreshed using latest demand signals (${currentProduct.name})`,
        'success',
      )
    }, 1300)
  }, [currentProduct.name, toast])

  // Handle Apply Rule for Single Week
  const handleApplyWeekRule = useCallback(
    (row: WeeklyForecastRow) => {
      setAppliedWeeks((prev) => {
        const next = new Set(prev)
        next.add(row.weekNum)
        return next
      })

      toast(
        `Applied rule for ${currentProduct.name} (${row.weekLabel}): Safety Stock set to ${row.suggestedSafetyStock}, Reorder Point set to ${row.suggestedReorderPoint}`,
        'success',
      )
    },
    [currentProduct.name, toast],
  )

  // Handle Apply All Weekly Rules
  const handleApplyAllRules = useCallback(() => {
    const allNums = weeklyRows.map((r) => r.weekNum)
    setAppliedWeeks(new Set(allNums))
    toast(
      `Applied all 5-week suggested safety stock & reorder rules for ${currentProduct.name}`,
      'success',
    )
  }, [weeklyRows, currentProduct.name, toast])

  // Handle Export Forecast CSV
  const handleExportCSV = useCallback(() => {
    toast(`Preparing forecast CSV export for ${currentProduct.name}...`, 'info')

    const headers = [
      'Date',
      'Type',
      'Actual_Demand',
      'Forecast_Demand',
      'CI_Lower',
      'CI_Upper',
      'Promotion_Event',
    ]

    const rows = chartPoints.map((pt) => [
      pt.fullDate,
      pt.isForecast ? 'FORECAST' : 'HISTORICAL',
      pt.actual ?? '',
      pt.forecast ?? '',
      pt.ciLower ?? '',
      pt.ciUpper ?? '',
      pt.promo ?? '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `forecast_${currentProduct.sku}_${historicalDays}D.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => {
      toast('Forecast data exported successfully', 'success')
    }, 600)
  }, [chartPoints, currentProduct.name, currentProduct.sku, historicalDays, toast])

  // Compute X-Axis tick interval to avoid overcrowding
  const xAxisInterval = useMemo(() => {
    if (historicalDays <= 30) return 4
    if (historicalDays <= 60) return 7
    if (historicalDays <= 90) return 11
    return 18
  }, [historicalDays])

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------- */}
      {/* 1. Page Header                                                      */}
      {/* ------------------------------------------------------------------- */}
      <PageHeader
        title="Demand Forecasting"
        subtitle="AI-driven demand projections, confidence envelopes, and autonomous inventory parameter calibration."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon={
                <RefreshCw
                  className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                />
              }
              onClick={handleRefreshForecast}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Recalculating...' : 'Refresh Forecast'}
            </Button>
          </div>
        }
      />

      {/* ------------------------------------------------------------------- */}
      {/* 2. Top Filter Controls: Product & Location Selectors                 */}
      {/* ------------------------------------------------------------------- */}
      <Card padding={false} className="overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            {/* Product Selector */}
            <div className="lg:col-span-5">
              <Select
                label="Target Product"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value)
                  setAppliedWeeks(new Set())
                  const prod = PRODUCTS.find((p) => p.id === e.target.value)
                  if (prod) {
                    setModelMetrics({
                      mae: prod.mae,
                      rmse: prod.rmse,
                      mape: prod.mape,
                      r2: prod.r2,
                    })
                    toast(`Loaded model profile for ${prod.name}`, 'info')
                  }
                }}
                options={PRODUCTS.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.sku}) – ${p.category}`,
                }))}
              />
            </div>

            {/* Location Selector */}
            <div className="lg:col-span-4">
              <Select
                label="Fulfillment Location"
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value)
                  const loc = LOCATIONS.find((l) => l.id === e.target.value)
                  if (loc) {
                    toast(`Filtering demand for ${loc.name}`, 'info')
                  }
                }}
                options={LOCATIONS.map((l) => ({
                  value: l.id,
                  label: l.name,
                }))}
              />
            </div>

            {/* Quick Context Chips */}
            <div className="flex items-center gap-2 lg:col-span-3 lg:justify-end">
              <div className="flex flex-col text-right">
                <span className="text-xs text-muted">Active Pipeline</span>
                <div className="flex items-center gap-1.5 font-semibold text-text text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>LSTM-Attention v1.2</span>
                </div>
              </div>
              <Chip label="High Accuracy" tone="good" />
            </div>
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/* 3. KPI Metric Summary Ribbon                                        */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Metric 1 */}
        <div className="group rounded-[12px] border border-border border-l-4 border-l-primary bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              30-Day Projected Demand
            </span>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text">
              {totalForecast30D.toLocaleString()}
            </span>
            <span className="text-xs text-muted">{currentProduct.unit}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-success font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+6.4% vs previous 30 days</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="group rounded-[12px] border border-border border-l-4 border-l-amber-500 bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Peak Daily Surge
            </span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">
              {peakForecast.toLocaleString()}
            </span>
            <span className="text-xs text-muted">{currentProduct.unit}/day</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Expected around Oct 28 (Flu Surge)</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="group rounded-[12px] border border-border border-l-4 border-l-emerald-500 bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Recommended Safety Stock
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text">
              {weeklyRows[0]?.suggestedSafetyStock ?? 45}
            </span>
            <span className="text-xs text-muted">
              (Current: {weeklyRows[0]?.currentSafetyStock ?? 45})
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted">
            <span>98.5% target service protection level</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="group rounded-[12px] border border-border border-l-4 border-l-indigo-500 bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Model MAPE Reliability
            </span>
            <Cpu className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text">
              {modelMetrics.mape}%
            </span>
            <span className="text-xs text-muted">error rate</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600 font-medium">
            <span>R² Score: {modelMetrics.r2} (High Confidence)</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. Chart Panel & Model Metadata Card (Side-by-side or Stacked)      */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chart Panel (Desktop: 8-9 cols, Mobile: full width) */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Card
            title={`${currentProduct.name} – Demand Telemetry & 30-Day Projection`}
            action={
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted sm:inline-block">
                  Historical Window:
                </span>
                <div className="flex items-center gap-1 rounded-[8px] border border-border bg-app p-0.5">
                  {([30, 60, 90, 180] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setHistoricalDays(days)}
                      className={cn(
                        'rounded-[6px] px-2.5 py-1 text-xs font-semibold transition-all',
                        historicalDays === days
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-muted hover:bg-surface hover:text-text',
                      )}
                    >
                      {days}D
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            {/* Chart Canvas */}
            <div className="h-[390px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartPoints}
                  margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="confidenceIntervalGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={xAxisInterval}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                    domain={['auto', 'auto']}
                  />

                  <Tooltip content={<CustomForecastTooltip />} />

                  {/* Confidence Interval Band */}
                  <Area
                    type="monotone"
                    dataKey="ciRange"
                    stroke="none"
                    fill="url(#confidenceIntervalGrad)"
                    name="95% Confidence Interval"
                    isAnimationActive={false}
                    connectNulls={false}
                  />

                  {/* Historical Demand Line (Solid Blue) */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: '#2563eb',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    name="Historical Demand"
                    connectNulls={false}
                  />

                  {/* 30-Day Forecast Line (Dashed Blue) */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: '#2563eb',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    name="30-Day Forecast"
                    connectNulls={false}
                  />

                  {/* Today / Forecast Boundary Divider */}
                  <ReferenceLine
                    x="Oct 18"
                    stroke="#64748b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Today (Forecast Start)',
                      position: 'insideTopLeft',
                      fill: '#64748b',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />

                  {/* Promotional Period Markers */}
                  {activePromos.map((pr) => (
                    <ReferenceLine
                      key={pr.id}
                      x={pr.labelDate}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{
                        value: pr.shortLabel,
                        position: 'top',
                        fill: '#b45309',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <CustomChartLegend />
          </Card>
        </div>

        {/* Model Metadata Card (Desktop: 4-3 cols to the right, Mobile: below) */}
        <div className="space-y-6 lg:col-span-4 xl:col-span-3">
          {/* Main Model Metadata Card */}
          <Card
            title="Model Diagnostics"
            action={<Chip label="Active & Online" tone="good" />}
          >
            <div className="space-y-4">
              {/* Model Header */}
              <div className="rounded-[8px] bg-app p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-primary">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text">
                      LSTM-Attention v1.2
                    </h4>
                    <p className="text-[11px] text-muted">
                      Dual-stream recurrent neural network
                    </p>
                  </div>
                </div>
              </div>

              {/* Accuracy Metrics Grid */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Validation Accuracy
                </p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-[8px] border border-border bg-surface p-2.5">
                    <span className="block text-[11px] text-muted">MAE</span>
                    <span className="mt-0.5 block text-base font-bold text-text">
                      {modelMetrics.mae}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      Optimal
                    </span>
                  </div>

                  <div className="rounded-[8px] border border-border bg-surface p-2.5">
                    <span className="block text-[11px] text-muted">RMSE</span>
                    <span className="mt-0.5 block text-base font-bold text-text">
                      {modelMetrics.rmse}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      Target Met
                    </span>
                  </div>

                  <div className="rounded-[8px] border border-border bg-surface p-2.5">
                    <span className="block text-[11px] text-muted">MAPE</span>
                    <span className="mt-0.5 block text-base font-bold text-text">
                      {modelMetrics.mape}%
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      &lt; 10% Industry
                    </span>
                  </div>

                  <div className="rounded-[8px] border border-border bg-surface p-2.5">
                    <span className="block text-[11px] text-muted">R² Score</span>
                    <span className="mt-0.5 block text-base font-bold text-text">
                      {modelMetrics.r2}
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium">
                      High Fit
                    </span>
                  </div>
                </div>
              </div>

              {/* Training Metadata Details */}
              <div className="space-y-2 border-t border-border pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Last Trained:</span>
                  <span className="font-medium text-text text-right">
                    {lastTrainedTimestamp}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Lag Horizon:</span>
                  <span className="font-medium text-text">90 Time-steps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Covariates:</span>
                  <span className="font-medium text-text">
                    Seasonality, Lead Time, Promos
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Next Scheduled:</span>
                  <span className="font-medium text-text">Oct 24, 03:00 UTC</span>
                </div>
              </div>

              {/* Refresh Action Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  icon={
                    <RefreshCw
                      className={cn(
                        'h-4 w-4',
                        isRefreshing && 'animate-spin',
                      )}
                    />
                  }
                  onClick={handleRefreshForecast}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Retraining Weights...' : 'Refresh Forecast'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Insights Sub-card */}
          <Card padding={false} className="border-l-4 border-l-amber-500">
            <div className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <h4 className="text-xs font-semibold text-text uppercase tracking-wider">
                  Automated Advisory
                </h4>
              </div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Projected demand spike of{' '}
                <strong className="text-text">+10.8%</strong> expected in Week 44.
                Current safety stock ({weeklyRows[0]?.currentSafetyStock}) may face
                stockout risk if not raised to{' '}
                <strong className="text-text">
                  {weeklyRows[1]?.suggestedSafetyStock} units
                </strong>
                .
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 5. Forecast Table: Weekly Projections & Parameter Tuning            */}
      {/* ------------------------------------------------------------------- */}
      <Card
        title="Weekly Forecast Breakdown & Recommended Inventory Parameters"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
              onClick={handleApplyAllRules}
            >
              Apply All Recommendations
            </Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="py-3 px-3">Upcoming Week</th>
                <th className="py-3 px-3">Forecasted Demand</th>
                <th className="py-3 px-3">95% Confidence Range</th>
                <th className="py-3 px-3">Suggested Safety Stock</th>
                <th className="py-3 px-3">Suggested Reorder Point</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3 text-right">Parameter Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {weeklyRows.map((row) => {
                const isApplied = appliedWeeks.has(row.weekNum)
                const ssDiff = row.suggestedSafetyStock - row.currentSafetyStock
                const rpDiff = row.suggestedReorderPoint - row.currentReorderPoint

                return (
                  <tr
                    key={row.weekNum}
                    className="transition-colors hover:bg-app/50"
                  >
                    {/* Week Column */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text">
                          {row.weekLabel}
                        </span>
                        <span className="text-xs text-muted">
                          {row.dateRange}
                        </span>
                        {row.highlight && (
                          <span className="mt-1 inline-flex w-fit rounded-xs bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                            {row.highlight}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Forecasted Demand */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-text">
                          {row.forecastedDemand.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted">
                          {currentProduct.unit}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px]">
                        {row.trendPct >= 0 ? (
                          <span className="inline-flex items-center text-success font-medium">
                            <TrendingUp className="h-3 w-3 mr-0.5" />+
                            {row.trendPct}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-muted font-medium">
                            <TrendingDown className="h-3 w-3 mr-0.5" />
                            {row.trendPct}%
                          </span>
                        )}
                        <span className="text-muted">vs prior week</span>
                      </div>
                    </td>

                    {/* Confidence Range */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-text">
                          {row.ciLower} – {row.ciUpper} {currentProduct.unit}
                        </span>
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{
                              width: `${Math.min(
                                100,
                                ((row.forecastedDemand - row.ciLower) /
                                  (row.ciUpper - row.ciLower || 1)) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Suggested Safety Stock */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-text">
                          {row.suggestedSafetyStock}
                        </span>
                        <span className="text-xs text-muted">
                          (Current: {row.currentSafetyStock})
                        </span>
                      </div>
                      {ssDiff !== 0 && (
                        <span
                          className={cn(
                            'text-[11px] font-medium',
                            ssDiff > 0 ? 'text-amber-600' : 'text-muted',
                          )}
                        >
                          {ssDiff > 0 ? `+${ssDiff} buffer deficit` : `${ssDiff} surplus`}
                        </span>
                      )}
                    </td>

                    {/* Suggested Reorder Point */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-text">
                          {row.suggestedReorderPoint}
                        </span>
                        <span className="text-xs text-muted">
                          (Current: {row.currentReorderPoint})
                        </span>
                      </div>
                      {rpDiff !== 0 && (
                        <span
                          className={cn(
                            'text-[11px] font-medium',
                            rpDiff > 0 ? 'text-primary' : 'text-muted',
                          )}
                        >
                          {rpDiff > 0 ? `+${rpDiff} point shift` : `${rpDiff} shift`}
                        </span>
                      )}
                    </td>

                    {/* Confidence Level */}
                    <td className="py-3.5 px-3">
                      <Chip
                        label={`${row.confidenceLevel}% ${
                          row.confidenceLevel >= 90 ? 'High' : 'Moderate'
                        }`}
                        tone={row.confidenceLevel >= 90 ? 'good' : 'info'}
                      />
                    </td>

                    {/* Apply Button */}
                    <td className="py-3.5 px-3 text-right">
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200">
                          <Check className="h-3.5 w-3.5" />
                          Applied
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleApplyWeekRule(row)}
                        >
                          Apply Rule
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
