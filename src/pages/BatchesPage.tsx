import { useState, useMemo } from 'react'
import {
  Download,
  Calendar as CalendarIcon,
  Table as TableIcon,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  RotateCcw,
  History,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
  ArrowRight,
  User,
  X,
  AlertOctagon,
  FileSpreadsheet,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Drawer } from '../components/ui/Drawer'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Pagination } from '../components/ui/Pagination'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'

export type BatchStatus = 'Active' | 'Expiring' | 'Expired' | 'Quarantined'

export interface BatchItem {
  id: string
  product: string
  sku: string
  category: string
  location: string
  mfg: string // YYYY-MM-DD
  expiry: string // YYYY-MM-DD
  quantity: number
  unit: string
  status: BatchStatus
  acknowledged?: boolean
}

interface TraceEvent {
  step: 'Received' | 'Transferred' | 'Picked' | 'Sold' | 'Expired'
  title: string
  user: string
  role: string
  location: string
  quantity: string
  timestamp: string
  status: 'completed' | 'in-progress' | 'pending' | 'expired'
  notes: string
}

// System reference date representing current operational time (Oct 18, 2026)
const REFERENCE_DATE = new Date('2026-10-18T00:00:00')

function calculateDaysLeft(expiryStr: string): number {
  const expiry = new Date(expiryStr + 'T00:00:00')
  const diffTime = expiry.getTime() - REFERENCE_DATE.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function resolveStatus(batch: BatchItem): BatchStatus {
  if (batch.status === 'Quarantined') return 'Quarantined'
  const days = calculateDaysLeft(batch.expiry)
  if (days <= 0) return 'Expired'
  if (days <= 30) return 'Expiring'
  return 'Active'
}

function getStatusTone(status: BatchStatus): 'good' | 'warning' | 'expired' | 'neutral' {
  switch (status) {
    case 'Active':
      return 'good'
    case 'Expiring':
      return 'warning'
    case 'Expired':
      return 'expired'
    case 'Quarantined':
      return 'neutral'
  }
}

// 35+ rich mock batches covering all requirements and calendar distributions
const INITIAL_BATCHES: BatchItem[] = [
  // Expired batches (< 0 days)
  {
    id: 'B-7011',
    product: 'Amoxicillin 500mg',
    sku: 'MED-1041',
    category: 'Antibiotics',
    location: 'Warehouse A',
    mfg: '2025-03-10',
    expiry: '2026-09-15',
    quantity: 45,
    unit: 'boxes',
    status: 'Expired',
  },
  {
    id: 'B-7012',
    product: 'Normal Saline 0.9% 1000ml',
    sku: 'MED-2088',
    category: 'Fluids',
    location: 'Cold Store A',
    mfg: '2025-03-25',
    expiry: '2026-09-28',
    quantity: 120,
    unit: 'bags',
    status: 'Expired',
  },
  {
    id: 'B-7013',
    product: 'Bandage Roll 4"',
    sku: 'MED-3310',
    category: 'Wound Care',
    location: 'Warehouse B',
    mfg: '2025-04-01',
    expiry: '2026-10-05',
    quantity: 85,
    unit: 'packs',
    status: 'Expired',
  },
  {
    id: 'B-7014',
    product: 'Midazolam 5mg/ml',
    sku: 'MED-4012',
    category: 'Sedatives',
    location: 'Clean Room 1',
    mfg: '2025-04-12',
    expiry: '2026-10-12',
    quantity: 30,
    unit: 'vials',
    status: 'Expired',
  },

  // Quarantined batches (Explicitly quarantined)
  {
    id: 'B-7098',
    product: 'Ceftriaxone 1g Vial',
    sku: 'MED-1092',
    category: 'Antibiotics',
    location: 'Pharmacy Fridge 1',
    mfg: '2025-05-10',
    expiry: '2026-12-01',
    quantity: 150,
    unit: 'vials',
    status: 'Quarantined',
  },
  {
    id: 'B-7099',
    product: 'Insulin Glargine 100U/ml',
    sku: 'MED-5501',
    category: 'Biologics',
    location: 'Cold Store B',
    mfg: '2025-06-01',
    expiry: '2026-11-15',
    quantity: 65,
    unit: 'pens',
    status: 'Quarantined',
  },

  // Expiring in < 7 days
  {
    id: 'B-8021',
    product: 'Propofol 10mg/ml',
    sku: 'MED-6019',
    category: 'Anesthetics',
    location: 'Cold Store A',
    mfg: '2025-10-20',
    expiry: '2026-10-20', // 2d left
    quantity: 40,
    unit: 'ampoules',
    status: 'Expiring',
  },
  {
    id: 'B-8022',
    product: 'Epinephrine 1mg Auto-Injector',
    sku: 'MED-7110',
    category: 'Emergency',
    location: 'Central Depot',
    mfg: '2025-10-22',
    expiry: '2026-10-22', // 4d left
    quantity: 90,
    unit: 'units',
    status: 'Expiring',
  },
  {
    id: 'B-8023',
    product: 'Heparin Sodium 5000U',
    sku: 'MED-7120',
    category: 'Anticoagulants',
    location: 'Pharmacy Fridge 2',
    mfg: '2025-10-22',
    expiry: '2026-10-22', // 4d left
    quantity: 110,
    unit: 'vials',
    status: 'Expiring',
  },

  // 6 batches expiring on 2026-10-24 (triggers red badge 6+ on calendar)
  {
    id: 'B-8024',
    product: 'IV Saline 500ml',
    sku: 'MED-2090',
    category: 'Fluids',
    location: 'Warehouse A',
    mfg: '2025-10-24',
    expiry: '2026-10-24', // 6d left
    quantity: 250,
    unit: 'bottles',
    status: 'Expiring',
  },
  {
    id: 'B-8025',
    product: 'Paracetamol 1000mg IV',
    sku: 'MED-3120',
    category: 'Analgesics',
    location: 'Warehouse A',
    mfg: '2025-10-24',
    expiry: '2026-10-24', // 6d left
    quantity: 180,
    unit: 'vials',
    status: 'Expiring',
  },
  {
    id: 'B-8026',
    product: 'Dextrose 5% 500ml',
    sku: 'MED-2095',
    category: 'Fluids',
    location: 'Cold Store A',
    mfg: '2025-10-24',
    expiry: '2026-10-24', // 6d left
    quantity: 300,
    unit: 'bags',
    status: 'Expiring',
  },
  {
    id: 'B-8027',
    product: 'Morphine Sulfate 10mg',
    sku: 'MED-4050',
    category: 'Controlled',
    location: 'Safe Room',
    mfg: '2025-10-24',
    expiry: '2026-10-24', // 6d left
    quantity: 55,
    unit: 'ampoules',
    status: 'Expiring',
  },
  {
    id: 'B-8029',
    product: 'Ketamine HCl 50mg/ml',
    sku: 'MED-6025',
    category: 'Anesthetics',
    location: 'Cold Store B',
    mfg: '2025-10-24',
    expiry: '2026-10-24', // 6d left
    quantity: 75,
    unit: 'vials',
    status: 'Expiring',
  },
  {
    id: 'B-8030',
    product: 'Ondansetron 4mg/2ml',
    sku: 'MED-8012',
    category: 'Antiemetics',
    location: 'Clean Room 1',
    mfg: '2025-10-24',
    expiry: '2026-10-24', // 6d left
    quantity: 130,
    unit: 'ampoules',
    status: 'Expiring',
  },

  // 1 batch expiring on 2026-10-25
  {
    id: 'B-8028',
    product: 'Atorvastatin 20mg Tablets',
    sku: 'MED-9014',
    category: 'Cardiology',
    location: 'Warehouse B',
    mfg: '2025-10-25',
    expiry: '2026-10-25', // 7d left
    quantity: 400,
    unit: 'blisters',
    status: 'Expiring',
  },

  // 3 batches on 2026-10-28 (triggers dark orange badge 3-5)
  {
    id: 'B-8101',
    product: 'Azithromycin 250mg',
    sku: 'MED-1055',
    category: 'Antibiotics',
    location: 'Warehouse A',
    mfg: '2025-10-28',
    expiry: '2026-10-28', // 10d left
    quantity: 220,
    unit: 'capsules',
    status: 'Expiring',
  },
  {
    id: 'B-8102',
    product: 'Lidocaine 2% Injection',
    sku: 'MED-6030',
    category: 'Anesthetics',
    location: 'Pharmacy Fridge 1',
    mfg: '2025-10-28',
    expiry: '2026-10-28', // 10d left
    quantity: 95,
    unit: 'vials',
    status: 'Expiring',
  },
  {
    id: 'B-8103',
    product: 'Potassium Chloride 20mEq',
    sku: 'MED-2110',
    category: 'Electrolytes',
    location: 'Cold Store A',
    mfg: '2025-10-28',
    expiry: '2026-10-28', // 10d left
    quantity: 160,
    unit: 'ampoules',
    status: 'Expiring',
  },

  // 4 batches on 2026-10-30 (triggers dark orange badge 3-5)
  {
    id: 'B-8104',
    product: 'Hydrocortisone 100mg Vial',
    sku: 'MED-8020',
    category: 'Steroids',
    location: 'Clean Room 1',
    mfg: '2025-10-30',
    expiry: '2026-10-30', // 12d left
    quantity: 85,
    unit: 'vials',
    status: 'Expiring',
  },
  {
    id: 'B-8105',
    product: 'Enoxaparin 40mg Syringe',
    sku: 'MED-7130',
    category: 'Antithrombotic',
    location: 'Pharmacy Fridge 2',
    mfg: '2025-10-30',
    expiry: '2026-10-30', // 12d left
    quantity: 140,
    unit: 'syringes',
    status: 'Expiring',
  },
  {
    id: 'B-8106',
    product: 'Furosemide 20mg/2ml',
    sku: 'MED-8035',
    category: 'Diuretics',
    location: 'Central Depot',
    mfg: '2025-10-30',
    expiry: '2026-10-30', // 12d left
    quantity: 210,
    unit: 'ampoules',
    status: 'Expiring',
  },
  {
    id: 'B-8107',
    product: 'Metformin 500mg Tablets',
    sku: 'MED-9022',
    category: 'Endocrine',
    location: 'Warehouse B',
    mfg: '2025-10-30',
    expiry: '2026-10-30', // 12d left
    quantity: 520,
    unit: 'tablets',
    status: 'Expiring',
  },

  // Batches expiring in November 2026 (7-30d range)
  {
    id: 'B-8108',
    product: 'Albumin Human 20% 50ml',
    sku: 'MED-5520',
    category: 'Blood Product',
    location: 'Cold Store B',
    mfg: '2025-11-02',
    expiry: '2026-11-02', // 15d left
    quantity: 50,
    unit: 'vials',
    status: 'Expiring',
  },
  {
    id: 'B-8109',
    product: 'Vancomycin 1g Injection',
    sku: 'MED-1070',
    category: 'Antibiotics',
    location: 'Warehouse A',
    mfg: '2025-11-02',
    expiry: '2026-11-02', // 15d left
    quantity: 115,
    unit: 'vials',
    status: 'Expiring',
  },
  {
    id: 'B-8110',
    product: 'Fentanyl Citrate 50mcg/ml',
    sku: 'MED-4060',
    category: 'Controlled',
    location: 'Safe Room',
    mfg: '2025-11-12',
    expiry: '2026-11-12', // 25d left
    quantity: 40,
    unit: 'ampoules',
    status: 'Expiring',
  },

  // Batches expiring in 30-90 days (yellow bar)
  {
    id: 'B-8201',
    product: 'Pantoprazole 40mg IV',
    sku: 'MED-8040',
    category: 'GI Agents',
    location: 'Warehouse B',
    mfg: '2025-11-25',
    expiry: '2026-11-25', // 38d left
    quantity: 310,
    unit: 'vials',
    status: 'Active',
  },
  {
    id: 'B-8202',
    product: 'Ceftriaxone 500mg',
    sku: 'MED-1094',
    category: 'Antibiotics',
    location: 'Pharmacy Fridge 1',
    mfg: '2025-12-04',
    expiry: '2026-12-04', // 47d left
    quantity: 190,
    unit: 'vials',
    status: 'Active',
  },
  {
    id: 'B-8203',
    product: 'Meropenem 1g IV',
    sku: 'MED-1085',
    category: 'Antibiotics',
    location: 'Clean Room 1',
    mfg: '2025-12-04',
    expiry: '2026-12-04', // 47d left
    quantity: 80,
    unit: 'vials',
    status: 'Active',
  },
  {
    id: 'B-8204',
    product: 'Dexmedetomidine 100mcg',
    sku: 'MED-6045',
    category: 'Sedatives',
    location: 'Cold Store A',
    mfg: '2025-12-18',
    expiry: '2026-12-18', // 61d left
    quantity: 65,
    unit: 'vials',
    status: 'Active',
  },
  {
    id: 'B-8205',
    product: 'Diazepam 5mg/ml',
    sku: 'MED-4030',
    category: 'Sedatives',
    location: 'Central Depot',
    mfg: '2026-01-08',
    expiry: '2027-01-08', // 82d left
    quantity: 145,
    unit: 'ampoules',
    status: 'Active',
  },

  // Batches expiring in > 90 days (green bar)
  {
    id: 'B-8301',
    product: 'Levofloxacin 500mg IV',
    sku: 'MED-1065',
    category: 'Antibiotics',
    location: 'Warehouse A',
    mfg: '2026-02-15',
    expiry: '2027-02-15', // 120d left
    quantity: 350,
    unit: 'infusions',
    status: 'Active',
  },
  {
    id: 'B-8302',
    product: "Lactated Ringer's 1000ml",
    sku: 'MED-2100',
    category: 'Fluids',
    location: 'Warehouse B',
    mfg: '2026-03-30',
    expiry: '2027-03-30', // 163d left
    quantity: 600,
    unit: 'bags',
    status: 'Active',
  },
  {
    id: 'B-8303',
    product: 'Ciprofloxacin 400mg IV',
    sku: 'MED-1060',
    category: 'Antibiotics',
    location: 'Cold Store B',
    mfg: '2026-05-10',
    expiry: '2027-05-10', // 204d left
    quantity: 280,
    unit: 'bags',
    status: 'Active',
  },
  {
    id: 'B-8304',
    product: 'Norepinephrine 4mg/4ml',
    sku: 'MED-7115',
    category: 'Emergency',
    location: 'Safe Room',
    mfg: '2026-08-20',
    expiry: '2027-08-20', // 306d left
    quantity: 175,
    unit: 'ampoules',
    status: 'Active',
  },
]

// Progress bar matching spec:
// green > 90d, yellow 30-90d, orange 7-30d, red < 7d, with numeric label
function DaysLeftIndicator({ daysLeft }: { daysLeft: number }) {
  if (daysLeft <= 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 rounded-full bg-slate-200">
          <div className="h-full w-full rounded-full bg-red-600" />
        </div>
        <span className="text-xs font-semibold text-red-600">0d (Expired)</span>
      </div>
    )
  }

  let barBg = 'bg-emerald-500'
  let labelColor = 'text-emerald-700'

  if (daysLeft < 7) {
    barBg = 'bg-red-500'
    labelColor = 'text-red-700 font-bold'
  } else if (daysLeft <= 30) {
    barBg = 'bg-orange-500'
    labelColor = 'text-orange-700'
  } else if (daysLeft <= 90) {
    barBg = 'bg-amber-400'
    labelColor = 'text-amber-700'
  }

  // Visual relative width scaled to standard 180 days max
  const widthPercent = Math.min(100, Math.max(12, Math.round((daysLeft / 180) * 100)))

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barBg)}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <span className={cn('text-xs tabular-nums font-medium', labelColor)}>
        {daysLeft}d
      </span>
    </div>
  )
}

// Generate vertical timeline trace events for any batch
function generateTraceTimeline(batch: BatchItem): TraceEvent[] {
  const days = calculateDaysLeft(batch.expiry)
  const isPastExpiry = days <= 0

  return [
    {
      step: 'Received',
      title: 'Inbound Verification & Inspection',
      user: 'Elena Rostova',
      role: 'Inbound QA Specialist',
      location: `Inbound Receiving Dock 2 → ${batch.location}`,
      quantity: `${batch.quantity + 200} ${batch.unit} received`,
      timestamp: `${batch.mfg} 08:45 AM`,
      status: 'completed',
      notes: 'Certificate of Analysis verified. Barcode scan matched PO #PO-9912. Thermal seal intact.',
    },
    {
      step: 'Transferred',
      title: 'Zone Putaway & Cold/Dry Slotting',
      user: 'Marcus Vance',
      role: 'Warehouse Lead',
      location: `${batch.location} (Rack B4-Row 02)`,
      quantity: `${batch.quantity + 200} ${batch.unit} putaway`,
      timestamp: `${batch.mfg} 14:15 PM`,
      status: 'completed',
      notes: 'Placed in climate-monitored bin. FEFO rotation index updated automatically.',
    },
    {
      step: 'Picked',
      title: 'Dispatched for Clinical Department',
      user: 'Priya Nair',
      role: 'Inventory Dispatcher',
      location: `${batch.location} → Staging Bay 3`,
      quantity: `120 ${batch.unit} picked`,
      timestamp: '2026-07-15 10:30 AM',
      status: 'completed',
      notes: 'Dispense pick list #PL-4412 for Inpatient ICU Requisition.',
    },
    {
      step: 'Sold',
      title: 'Administered / Consumed in Department',
      user: 'Dr. Sarah Kim',
      role: 'Head Pharmacist',
      location: 'Central Pharmacy / Dispensary',
      quantity: `80 ${batch.unit} dispensed`,
      timestamp: '2026-08-01 16:20 PM',
      status: 'completed',
      notes: 'Fulfilled ward dispensing order. Patient tracking logged under medical records.',
    },
    {
      step: 'Expired',
      title: isPastExpiry ? 'Batch Expiration Reached' : 'Projected Expiry Milestones',
      user: 'Automated FEFO Monitor',
      role: 'System Compliance Daemon',
      location: batch.location,
      quantity: `Remaining ${batch.quantity} ${batch.unit}`,
      timestamp: `${batch.expiry} 23:59 PM`,
      status: isPastExpiry ? 'expired' : 'pending',
      notes: isPastExpiry
        ? 'Batch has surpassed expiration date. Withdrawn from active FEFO picking queue.'
        : `Batch in standard monitoring. Days remaining: ${days} days. Alert notification scheduled at 30d/7d.`,
    },
  ]
}

export function BatchesPage() {
  const { toast } = useToast()

  // Primary state
  const [batches, setBatches] = useState<BatchItem[]>(INITIAL_BATCHES)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [expiryFilter, setExpiryFilter] = useState<'all' | '<7d' | '<30d' | '<90d' | 'expired'>('all')
  const [locationFilter, setLocationFilter] = useState('all')

  // Table row multi-selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Pagination
  const [page, setPage] = useState(1)
  const perPage = 10

  // Calendar View state (Defaulting to October 2026 to align with project mock timeline)
  const [calendarYear, setCalendarYear] = useState(2026)
  const [calendarMonth, setCalendarMonth] = useState(9) // 0-indexed: 9 = October
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null)

  // Drawer & Modal action targets
  const [traceBatch, setTraceBatch] = useState<BatchItem | null>(null)
  const [quarantineModalBatch, setQuarantineModalBatch] = useState<BatchItem | null>(null)
  const [releaseModalBatch, setReleaseModalBatch] = useState<BatchItem | null>(null)
  const [writeoffModalOpen, setWriteoffModalOpen] = useState(false)

  // Unique locations list for dropdown
  const locationOptions = useMemo(() => {
    const locs = Array.from(new Set(batches.map((b) => b.location))).sort()
    return [{ value: 'all', label: 'All Locations' }, ...locs.map((l) => ({ value: l, label: l }))]
  }, [batches])

  // Filter batches
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const days = calculateDaysLeft(batch.expiry)
      const currentStatus = resolveStatus(batch)

      // Expiry Filter
      if (expiryFilter === '<7d' && (days <= 0 || days > 7)) return false
      if (expiryFilter === '<30d' && (days <= 0 || days > 30)) return false
      if (expiryFilter === '<90d' && (days <= 0 || days > 90)) return false
      if (expiryFilter === 'expired' && !(days <= 0 || currentStatus === 'Expired')) return false

      // Location Filter
      if (locationFilter !== 'all' && batch.location !== locationFilter) return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          batch.id.toLowerCase().includes(q) ||
          batch.product.toLowerCase().includes(q) ||
          batch.sku.toLowerCase().includes(q) ||
          batch.category.toLowerCase().includes(q) ||
          batch.location.toLowerCase().includes(q)
        if (!match) return false
      }

      return true
    })
  }, [batches, expiryFilter, locationFilter, searchQuery])

  // Pagination slice
  const totalPages = Math.ceil(filteredBatches.length / perPage) || 1
  const paginatedBatches = useMemo(() => {
    const start = (page - 1) * perPage
    return filteredBatches.slice(start, start + perPage)
  }, [filteredBatches, page, perPage])

  // Summary statistics
  const summary = useMemo(() => {
    let expiring30 = 0
    let expired = 0
    let quarantined = 0

    batches.forEach((b) => {
      const days = calculateDaysLeft(b.expiry)
      if (b.status === 'Quarantined') {
        quarantined++
      } else if (days <= 0) {
        expired++
      } else if (days <= 30) {
        expiring30++
      }
    })

    return {
      total: batches.length,
      expiring30,
      expired,
      quarantined,
    }
  }, [batches])

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay() // 0 = Sun
    const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
    const totalDaysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate()

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = []

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = totalDaysInPrevMonth - i
      const prevM = calendarMonth === 0 ? 11 : calendarMonth - 1
      const prevY = calendarMonth === 0 ? calendarYear - 1 : calendarYear
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ dateStr, dayNum: d, isCurrentMonth: false })
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ dateStr, dayNum: d, isCurrentMonth: true })
    }

    // Next month padding to fill a complete 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      const nextM = calendarMonth === 11 ? 0 : calendarMonth + 1
      const nextY = calendarMonth === 11 ? calendarYear + 1 : calendarYear
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ dateStr, dayNum: d, isCurrentMonth: false })
    }

    return days
  }, [calendarYear, calendarMonth])

  // Batches expiring on the calendarSelectedDate
  const calendarDateBatches = useMemo(() => {
    if (!calendarSelectedDate) return []
    return batches.filter((b) => b.expiry === calendarSelectedDate)
  }, [batches, calendarSelectedDate])

  // Select all handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedBatches.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedBatches.map((b) => b.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Quarantine confirm handler
  const handleConfirmQuarantine = () => {
    if (!quarantineModalBatch) return
    const id = quarantineModalBatch.id
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'Quarantined' as BatchStatus } : b))
    )
    toast(`Batch ${id} has been moved to Quarantine.`, 'warning')
    setQuarantineModalBatch(null)
  }

  // Release confirm handler
  const handleConfirmRelease = () => {
    if (!releaseModalBatch) return
    const id = releaseModalBatch.id
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const days = calculateDaysLeft(b.expiry)
          const newStatus: BatchStatus = days <= 0 ? 'Expired' : days <= 30 ? 'Expiring' : 'Active'
          return { ...b, status: newStatus }
        }
        return b
      })
    )
    toast(`Batch ${id} released from quarantine to active inventory.`, 'success')
    setReleaseModalBatch(null)
  }

  // Quick Quarantine in Calendar drawer
  const handleQuickQuarantine = (batch: BatchItem) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batch.id ? { ...b, status: 'Quarantined' as BatchStatus } : b))
    )
    toast(`Batch ${batch.id} placed in Quarantine.`, 'warning')
  }

  // Quick Release in Calendar drawer
  const handleQuickRelease = (batch: BatchItem) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batch.id) {
          const days = calculateDaysLeft(b.expiry)
          const newStatus: BatchStatus = days <= 0 ? 'Expired' : days <= 30 ? 'Expiring' : 'Active'
          return { ...b, status: newStatus }
        }
        return b
      })
    )
    toast(`Batch ${batch.id} returned to active stock.`, 'success')
  }

  // Bulk Acknowledge action
  const handleBulkAcknowledge = () => {
    if (selectedIds.length === 0) return
    setBatches((prev) =>
      prev.map((b) => (selectedIds.includes(b.id) ? { ...b, acknowledged: true } : b))
    )
    toast(`Acknowledged ${selectedIds.length} batch(es) for monitoring.`, 'success')
    setSelectedIds([])
  }

  // Bulk Writeoff Expired action
  const handleBulkWriteoff = () => {
    const expiredSelected = batches.filter(
      (b) => selectedIds.includes(b.id) && (calculateDaysLeft(b.expiry) <= 0 || b.status === 'Expired')
    )

    if (expiredSelected.length === 0) {
      toast('No expired batches found among the selected items.', 'warning')
      return
    }

    setWriteoffModalOpen(true)
  }

  const handleConfirmWriteoff = () => {
    const expiredIds = batches
      .filter((b) => selectedIds.includes(b.id) && (calculateDaysLeft(b.expiry) <= 0 || b.status === 'Expired'))
      .map((b) => b.id)

    setBatches((prev) => prev.filter((b) => !expiredIds.includes(b.id)))
    toast(`Successfully written off ${expiredIds.length} expired batch(es).`, 'success')
    setSelectedIds([])
    setWriteoffModalOpen(false)
  }

  // Bulk Quarantine action
  const handleBulkQuarantine = () => {
    if (selectedIds.length === 0) return
    setBatches((prev) =>
      prev.map((b) => (selectedIds.includes(b.id) ? { ...b, status: 'Quarantined' } : b))
    )
    toast(`Moved ${selectedIds.length} batch(es) to quarantine.`, 'warning')
    setSelectedIds([])
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Batch ID', 'Product', 'SKU', 'Category', 'Location', 'Mfg Date', 'Expiry Date', 'Days Left', 'Quantity', 'Status']
    const rows = filteredBatches.map((b) => {
      const days = calculateDaysLeft(b.expiry)
      const st = resolveStatus(b)
      return [
        b.id,
        `"${b.product}"`,
        b.sku,
        b.category,
        `"${b.location}"`,
        b.mfg,
        b.expiry,
        days,
        `${b.quantity} ${b.unit}`,
        st,
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `batches_inventory_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast(`Exported ${filteredBatches.length} batch record(s) to CSV.`, 'success')
  }

  // Month navigation helpers
  const monthName = new Date(calendarYear, calendarMonth, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear((y) => y - 1)
    } else {
      setCalendarMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear((y) => y + 1)
    } else {
      setCalendarMonth((m) => m + 1)
    }
  }

  const handleResetToToday = () => {
    setCalendarYear(2026)
    setCalendarMonth(9) // October
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Page Controls */}
      <PageHeader
        title="Batch & Expiry Management"
        subtitle="Track lot lifecycles, monitor shelf-life thresholds, quarantine defectives, and enforce FEFO dispatch."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportCSV}
            >
              Export
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Total Batches</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-text">{summary.total}</span>
            <span className="ml-2 text-xs text-muted">Active tracked lots</span>
          </div>
        </Card>

        <Card className="hover:border-warning/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Expiring in 30 Days</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-warning/10 text-warning">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-warning">{summary.expiring30}</span>
            <span className="ml-2 text-xs text-muted">Priority FEFO queue</span>
          </div>
        </Card>

        <Card className="hover:border-error/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Expired Batches</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-error/10 text-error">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-error">{summary.expired}</span>
            <span className="ml-2 text-xs text-muted">Pending writeoff</span>
          </div>
        </Card>

        <Card className="hover:border-slate-400/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Quarantined</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-slate-200 text-slate-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-text">{summary.quarantined}</span>
            <span className="ml-2 text-xs text-muted">Locked from release</span>
          </div>
        </Card>
      </div>

      {/* Top Bar: Controls, Filters & Segmented Toggle */}
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {/* Search */}
            <div className="flex flex-col gap-2">
              <label htmlFor="batch-search" className="text-sm font-medium text-text">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  id="batch-search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search batch #, product or SKU…"
                  className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Expiry filter dropdown: All / <7d / <30d / <90d / Expired */}
            <div>
              <Select
                label="Expiry Threshold"
                value={expiryFilter}
                onChange={(e) => {
                  setExpiryFilter(e.target.value as any)
                  setPage(1)
                }}
                options={[
                  { value: 'all', label: 'All Expiry States' },
                  { value: '<7d', label: 'Expiring in < 7 Days (Critical)' },
                  { value: '<30d', label: 'Expiring in < 30 Days (High)' },
                  { value: '<90d', label: 'Expiring in < 90 Days (Warning)' },
                  { value: 'expired', label: 'Expired' },
                ]}
              />
            </div>

            {/* Location filter dropdown */}
            <div>
              <Select
                label="Location Filter"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value)
                  setPage(1)
                }}
                options={locationOptions}
              />
            </div>
          </div>

          {/* Segmented View Toggle: "Table View" | "Calendar View" */}
          <div className="flex shrink-0 items-center justify-end">
            <div className="inline-flex rounded-[8px] border border-border bg-app p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-2 rounded-[6px] px-3.5 py-1.5 text-sm font-medium transition-all',
                  viewMode === 'table'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted hover:text-text'
                )}
              >
                <TableIcon className="h-4 w-4" />
                Table View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'flex items-center gap-2 rounded-[6px] px-3.5 py-1.5 text-sm font-medium transition-all',
                  viewMode === 'calendar'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted hover:text-text'
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                Calendar View
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Area: Table View OR Calendar View */}
      {viewMode === 'table' ? (
        <Card padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-border bg-app/80 text-xs font-semibold text-muted">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center text-muted hover:text-text"
                      title="Select all on this page"
                    >
                      {selectedIds.length > 0 && selectedIds.length === paginatedBatches.length ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">Batch #</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Manufactured</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold">Days Left</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBatches.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertOctagon className="h-8 w-8 text-muted/60" />
                        <p className="text-base font-medium text-text">No batches match the selected criteria</p>
                        <p className="text-xs text-muted">Try adjusting your search keywords, threshold or location filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBatches.map((item) => {
                    const daysLeft = calculateDaysLeft(item.expiry)
                    const status = resolveStatus(item)
                    const isExpired = status === 'Expired' || (daysLeft <= 0 && status !== 'Quarantined')
                    const isSelected = selectedIds.includes(item.id)

                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          'border-b border-border/70 transition-colors',
                          isExpired ? 'bg-slate-50/90 text-muted' : 'hover:bg-app/50 text-text',
                          isSelected ? 'bg-primary/5' : ''
                        )}
                      >
                        {/* Multi-select Checkbox */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleSelect(item.id)}
                            className="text-muted hover:text-text"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        {/* Batch # (bold monospace, strikethrough if expired) */}
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'font-mono font-bold tracking-tight',
                              isExpired ? 'line-through text-slate-400' : 'text-text'
                            )}
                          >
                            {item.id}
                          </span>
                        </td>

                        {/* Product */}
                        <td className="px-4 py-3">
                          <div>
                            <div className={cn('font-medium', isExpired ? 'text-slate-500' : 'text-text')}>
                              {item.product}
                            </div>
                            <div className="text-xs text-muted">
                              {item.sku} • {item.category}
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <MapPin className="h-3.5 w-3.5 text-muted/70 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        </td>

                        {/* Manufactured (date) */}
                        <td className="px-4 py-3 tabular-nums text-xs">
                          {item.mfg}
                        </td>

                        {/* Expires (date) */}
                        <td className="px-4 py-3 tabular-nums text-xs font-medium">
                          {item.expiry}
                        </td>

                        {/* Days Left (horizontal progress bar + numeric label) */}
                        <td className="px-4 py-3">
                          <DaysLeftIndicator daysLeft={daysLeft} />
                        </td>

                        {/* Quantity */}
                        <td className="px-4 py-3 tabular-nums text-xs font-semibold">
                          {item.quantity.toLocaleString()} <span className="font-normal text-muted">{item.unit}</span>
                        </td>

                        {/* Status (Chip: Active/Expiring/Expired/Quarantined) */}
                        <td className="px-4 py-3">
                          <Chip label={status} tone={getStatusTone(status)} />
                        </td>

                        {/* Actions menu */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              className="h-8 px-2.5 text-xs"
                              icon={<History className="h-3.5 w-3.5" />}
                              onClick={() => setTraceBatch(item)}
                              title="Trace full batch movement history"
                            >
                              Trace
                            </Button>

                            {status === 'Quarantined' ? (
                              <Button
                                variant="secondary"
                                className="h-8 px-2.5 text-xs text-success border-success/30 hover:bg-green-50"
                                icon={<RotateCcw className="h-3.5 w-3.5" />}
                                onClick={() => setReleaseModalBatch(item)}
                              >
                                Release
                              </Button>
                            ) : (
                              <Button
                                variant="destructiveOutline"
                                className="h-8 px-2.5 text-xs"
                                icon={<ShieldAlert className="h-3.5 w-3.5" />}
                                onClick={() => setQuarantineModalBatch(item)}
                              >
                                Quarantine
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <span className="text-xs text-muted">
                Showing {paginatedBatches.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
                {Math.min(page * perPage, filteredBatches.length)} of {filteredBatches.length} batches
              </span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        </Card>
      ) : (
        /* Calendar View */
        <Card className="space-y-4">
          {/* Calendar Header Navigation */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-text">{monthName}</h2>
              <button
                type="button"
                onClick={handleResetToToday}
                className="rounded-[6px] border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-app hover:text-text transition-colors"
              >
                Today (Oct 2026)
              </button>
            </div>

            {/* Badge legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              <span className="font-medium text-text">Expiring Lots:</span>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-5 items-center justify-center rounded border border-slate-200 bg-slate-100 text-[10px] text-slate-500 font-bold">
                  0
                </span>
                <span>None</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-5 items-center justify-center rounded border border-amber-300 bg-amber-100 text-[10px] text-amber-900 font-bold">
                  1-2
                </span>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-5 items-center justify-center rounded border border-orange-400 bg-orange-200 text-[10px] text-orange-950 font-bold">
                  3-5
                </span>
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-5 items-center justify-center rounded border border-red-600 bg-red-500 text-[10px] text-white font-bold">
                  6+
                </span>
                <span>Critical</span>
              </div>

              {/* Month navigation buttons */}
              <div className="ml-2 flex items-center gap-1">
                <Button
                  variant="secondary"
                  className="h-8 w-8 p-0"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  className="h-8 w-8 p-0"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 7-column Calendar Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
            <div className="py-2">Sun</div>
            <div className="py-2">Mon</div>
            <div className="py-2">Tue</div>
            <div className="py-2">Wed</div>
            <div className="py-2">Thu</div>
            <div className="py-2">Fri</div>
            <div className="py-2">Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell) => {
              const dayBatches = batches.filter((b) => b.expiry === cell.dateStr)
              const count = dayBatches.length
              const isToday = cell.dateStr === '2026-10-18'
              const isSelected = calendarSelectedDate === cell.dateStr

              // Color badge styling according to spec:
              // white(0), light orange (1-2), dark orange (3-5), red (6+)
              let badgeClass = 'bg-slate-100 text-slate-400 border border-slate-200'
              if (count >= 1 && count <= 2) {
                badgeClass = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
              } else if (count >= 3 && count <= 5) {
                badgeClass = 'bg-orange-200 text-orange-950 border border-orange-400 font-bold'
              } else if (count >= 6) {
                badgeClass = 'bg-red-500 text-white border border-red-600 font-bold shadow-sm'
              }

              return (
                <button
                  type="button"
                  key={cell.dateStr}
                  onClick={() => setCalendarSelectedDate(cell.dateStr)}
                  className={cn(
                    'group relative flex min-h-[96px] flex-col justify-between rounded-[8px] border p-2 text-left transition-all',
                    cell.isCurrentMonth
                      ? 'bg-surface border-border hover:border-primary/60 hover:bg-app/40'
                      : 'bg-app/50 border-border/40 opacity-45',
                    isToday ? 'ring-2 ring-primary ring-offset-1 font-semibold' : '',
                    isSelected ? 'border-primary ring-2 ring-primary/40 bg-primary/5' : ''
                  )}
                >
                  {/* Top row: Day Number + Expiry Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-xs font-semibold tabular-nums',
                        isToday ? 'text-primary font-bold' : cell.isCurrentMonth ? 'text-text' : 'text-muted'
                      )}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Badge */}
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                        badgeClass
                      )}
                      title={`${count} lot(s) expiring on this date`}
                    >
                      {count}
                    </span>
                  </div>

                  {/* Day Content Preview */}
                  <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                    {count > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {dayBatches.slice(0, 2).map((b) => (
                          <div
                            key={b.id}
                            className="truncate text-[10px] font-medium text-slate-700 dark:text-slate-200"
                          >
                            <span className="font-mono text-[9px] font-bold text-muted">{b.id}:</span>{' '}
                            {b.product}
                          </div>
                        ))}
                        {count > 2 ? (
                          <span className="text-[9px] font-semibold text-muted">
                            +{count - 2} more lots
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted/40 italic">No expiries</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform">
          <div className="flex items-center gap-3 rounded-[12px] border border-border bg-surface px-5 py-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 border-r border-border pr-3 text-sm font-semibold text-text">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>{selectedIds.length} batch(es) selected</span>
            </div>

            {/* Bulk Acknowledge */}
            <Button
              variant="secondary"
              className="h-9 text-xs"
              icon={<CheckCircle2 className="h-4 w-4 text-success" />}
              onClick={handleBulkAcknowledge}
            >
              Bulk Acknowledge
            </Button>

            {/* Writeoff Expired */}
            <Button
              variant="destructive"
              className="h-9 text-xs"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={handleBulkWriteoff}
            >
              Writeoff Expired
            </Button>

            {/* Bulk Quarantine */}
            <Button
              variant="secondary"
              className="h-9 text-xs text-error border-error/30 hover:bg-red-50"
              icon={<ShieldAlert className="h-4 w-4" />}
              onClick={handleBulkQuarantine}
            >
              Quarantine
            </Button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-[6px] p-1.5 text-muted hover:bg-app hover:text-text"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Calendar Date Expiring Batches Right Drawer */}
      <Drawer
        open={Boolean(calendarSelectedDate)}
        title={`Expiring on ${calendarSelectedDate ?? ''}`}
        onClose={() => setCalendarSelectedDate(null)}
        wide
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              {calendarDateBatches.length} lot(s) scheduled for expiration on this date
            </span>
            <Button variant="secondary" onClick={() => setCalendarSelectedDate(null)}>
              Close Panel
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {calendarDateBatches.length === 0 ? (
            <div className="py-12 text-center text-muted">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success/60 mb-2" />
              <p className="text-base font-semibold text-text">No lots expiring on this date</p>
              <p className="text-xs text-muted mt-1">All batches for this timeframe remain in valid shelf-life.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-[8px] border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                <span className="font-semibold">Attention:</span> The following batches expire on{' '}
                <strong>{calendarSelectedDate}</strong>. Use the quick action below to quarantine affected stock or trace lot custody.
              </div>

              {calendarDateBatches.map((b) => {
                const days = calculateDaysLeft(b.expiry)
                const isQuarantined = b.status === 'Quarantined'

                return (
                  <div
                    key={b.id}
                    className="flex flex-col gap-3 rounded-[10px] border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-text">{b.id}</span>
                        <Chip label={b.status} tone={getStatusTone(b.status)} />
                        {days <= 0 && <span className="text-xs font-bold text-red-600">(Expired)</span>}
                      </div>
                      <div className="text-sm font-semibold text-text">{b.product}</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span>SKU: {b.sku}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {b.location}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-text">
                          Qty: {b.quantity} {b.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                      <Button
                        variant="ghost"
                        className="h-8 text-xs px-2.5"
                        icon={<History className="h-3.5 w-3.5" />}
                        onClick={() => {
                          setCalendarSelectedDate(null)
                          setTraceBatch(b)
                        }}
                      >
                        Trace
                      </Button>

                      {isQuarantined ? (
                        <Button
                          variant="secondary"
                          className="h-8 text-xs text-success border-success/30 hover:bg-green-50"
                          icon={<RotateCcw className="h-3.5 w-3.5" />}
                          onClick={() => handleQuickRelease(b)}
                        >
                          Release
                        </Button>
                      ) : (
                        <Button
                          variant="destructiveOutline"
                          className="h-8 text-xs"
                          icon={<ShieldAlert className="h-3.5 w-3.5" />}
                          onClick={() => handleQuickQuarantine(b)}
                        >
                          Quarantine
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Drawer>

      {/* Trace Lifecycle Drawer with Vertical Timeline */}
      <Drawer
        open={Boolean(traceBatch)}
        title={traceBatch ? `Trace Batch ${traceBatch.id}` : 'Trace Batch'}
        onClose={() => setTraceBatch(null)}
        wide
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Verified chain of custody & FEFO audit logs</span>
            <Button variant="secondary" onClick={() => setTraceBatch(null)}>
              Done
            </Button>
          </div>
        }
      >
        {traceBatch && (
          <div className="space-y-6">
            {/* Header Batch Overview Card */}
            <div className="rounded-[10px] border border-border bg-app/50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-text">{traceBatch.id}</span>
                    <Chip label={traceBatch.status} tone={getStatusTone(traceBatch.status)} />
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-text">{traceBatch.product}</h3>
                  <p className="text-xs text-muted">
                    {traceBatch.category} • SKU: {traceBatch.sku}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-muted">Current Quantity</div>
                  <div className="text-xl font-bold text-text">
                    {traceBatch.quantity} <span className="text-xs font-normal text-muted">{traceBatch.unit}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted sm:justify-end">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{traceBatch.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/80 pt-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-muted">Manufactured:</span>
                  <div className="font-semibold text-text tabular-nums">{traceBatch.mfg}</div>
                </div>
                <div>
                  <span className="text-muted">Expiry Date:</span>
                  <div className="font-semibold text-text tabular-nums">{traceBatch.expiry}</div>
                </div>
                <div>
                  <span className="text-muted">Shelf Life Left:</span>
                  <div className="font-semibold text-text">{calculateDaysLeft(traceBatch.expiry)} days</div>
                </div>
                <div>
                  <span className="text-muted">Quality Flag:</span>
                  <div className="font-semibold text-text">
                    {traceBatch.status === 'Quarantined' ? 'Restricted' : 'FEFO Eligible'}
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Timeline: Received -> Transferred -> Picked -> Sold -> Expired */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-text flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Custody & Distribution Timeline
              </h4>

              <div className="relative border-l-2 border-border ml-4 space-y-6 pb-2">
                {generateTraceTimeline(traceBatch).map((step, idx) => {
                  const isExpiredStep = step.step === 'Expired'
                  const isCompleted = step.status === 'completed'

                  return (
                    <div key={idx} className="relative pl-6">
                      {/* Step node indicator icon */}
                      <div
                        className={cn(
                          'absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-surface shadow-sm',
                          isExpiredStep
                            ? step.status === 'expired'
                              ? 'border-error text-error bg-red-50'
                              : 'border-border text-muted bg-app'
                            : isCompleted
                            ? 'border-success text-success bg-green-50'
                            : 'border-primary text-primary'
                        )}
                      >
                        {isExpiredStep ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>

                      {/* Step Details */}
                      <div className="rounded-[8px] border border-border bg-surface p-3.5 shadow-sm">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded-[4px] bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary uppercase">
                              {step.step}
                            </span>
                            <span className="text-sm font-bold text-text">{step.title}</span>
                          </div>
                          <span className="text-xs text-muted tabular-nums">{step.timestamp}</span>
                        </div>

                        {/* Metadata row */}
                        <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-muted sm:grid-cols-3">
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted/80" />
                            <span className="text-text font-medium">{step.user}</span> ({step.role})
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted/80" />
                            <span>{step.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5 text-muted/80" />
                            <span className="font-semibold text-text">{step.quantity}</span>
                          </div>
                        </div>

                        {/* Inspector Notes */}
                        <div className="mt-2 rounded-[6px] bg-app/80 p-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">Log Note:</span> {step.notes}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Quarantine Confirmation Modal */}
      <Modal
        open={Boolean(quarantineModalBatch)}
        title={quarantineModalBatch ? `Quarantine Batch ${quarantineModalBatch.id}?` : 'Quarantine Batch'}
        confirmLabel="Quarantine Batch"
        confirmVariant="destructive"
        onConfirm={handleConfirmQuarantine}
        onClose={() => setQuarantineModalBatch(null)}
      >
        {quarantineModalBatch && (
          <div className="space-y-3">
            <p className="text-sm text-text">
              Are you sure you want to quarantine batch{' '}
              <strong className="font-mono text-text">{quarantineModalBatch.id}</strong> (
              {quarantineModalBatch.product})?
            </p>
            <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <span className="font-bold">Caution:</span> Quarantined items will be excluded from automated
              FEFO picking, allocation, and order dispatches until released by a QA supervisor.
            </div>
            <div className="text-xs text-muted">
              Location: <strong>{quarantineModalBatch.location}</strong> • Quantity: <strong>{quarantineModalBatch.quantity} {quarantineModalBatch.unit}</strong>
            </div>
          </div>
        )}
      </Modal>

      {/* Release from Quarantine Modal */}
      <Modal
        open={Boolean(releaseModalBatch)}
        title={releaseModalBatch ? `Release Batch ${releaseModalBatch.id}?` : 'Release Batch'}
        confirmLabel="Release to Active Stock"
        confirmVariant="success"
        onConfirm={handleConfirmRelease}
        onClose={() => setReleaseModalBatch(null)}
      >
        {releaseModalBatch && (
          <div className="space-y-3">
            <p className="text-sm text-text">
              Are you sure you want to release batch{' '}
              <strong className="font-mono text-text">{releaseModalBatch.id}</strong> back to active inventory?
            </p>
            <p className="text-xs text-muted">
              The batch will re-enter the active FEFO rotation based on its original expiry date (
              <strong>{releaseModalBatch.expiry}</strong>).
            </p>
          </div>
        )}
      </Modal>

      {/* Writeoff Expired Confirmation Modal */}
      <Modal
        open={writeoffModalOpen}
        title="Writeoff Expired Batches?"
        confirmLabel="Confirm Disposal & Writeoff"
        confirmVariant="destructive"
        onConfirm={handleConfirmWriteoff}
        onClose={() => setWriteoffModalOpen(false)}
      >
        <div className="space-y-3">
          <p className="text-sm text-text">
            You are about to write off and decommission the selected expired batches.
          </p>
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-xs text-red-900">
            <span className="font-bold">Warning:</span> Written-off lots will be removed from active inventory and archived into disposal compliance records.
          </div>
        </div>
      </Modal>
    </div>
  )
}
