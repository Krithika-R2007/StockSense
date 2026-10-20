import { useState, useMemo, useEffect } from 'react'
import {
  ArrowRight,
  Plus,
  Sparkles,
  Clock,
  Truck,
  CheckCircle2,
  Check,
  X,
  Building2,
  MapPin,
  Package,
  Search,
  Filter,
  CheckCheck,
  Boxes,
  AlertCircle,
  ShieldAlert,
  Send,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Drawer } from '../components/ui/Drawer'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'
import {
  fetchTransfers,
  patchTransfer,
  createTransfer,
  type TransferCard,
  type TransferBatch,
} from '../api/endpoints'

// ---------------------------------------------------------------------------
// 14 Comprehensive Realistic Mock Transfers across all 4 Kanban Statuses
// ---------------------------------------------------------------------------
const INITIAL_TRANSFERS: TransferCard[] = [
  // Column 1: Suggested (3 items)
  {
    id: 'TR-0042',
    status: 'suggested',
    source: 'Warehouse B',
    destination: 'Clinic North',
    productCount: 2,
    totalUnits: 150,
    urgency: 'critical',
    createdAt: '10 mins ago',
    items: [
      { product: 'N95 Respirator Masks', sku: 'SKU-1199', qty: 100 },
      { product: 'Surgical Gloves (L)', sku: 'SKU-1042', qty: 50 },
    ],
    batches: [
      { batchId: 'B-7701', expiry: '2026-06-15', qty: 100, daysLeft: 240 },
      { batchId: 'B-9204', expiry: '2026-10-28', qty: 50, daysLeft: 10 },
    ],
    timeline: [
      {
        status: 'AI Stock Recommendation',
        timestamp: '10 mins ago',
        user: 'Auto-Balancing Engine',
        note: 'Clinic North projected to stock out in 48 hours based on patient intake surge.',
      },
    ],
  },
  {
    id: 'TR-0045',
    status: 'suggested',
    source: 'Warehouse A',
    destination: 'Pharmacy Fridge',
    productCount: 1,
    totalUnits: 45,
    urgency: 'normal',
    createdAt: '45 mins ago',
    items: [
      { product: 'Insulin Glargine 100U/ml', sku: 'SKU-4401', qty: 45 },
    ],
    batches: [
      { batchId: 'B-9105', expiry: '2026-10-21', qty: 45, daysLeft: 3 },
    ],
    timeline: [
      {
        status: 'FEFO Surplus Alert',
        timestamp: '45 mins ago',
        user: 'FEFO Optimizer',
        note: 'Batch B-9105 expiring in 3 days; redirect to high-turnover pharmacy to prevent write-off.',
      },
    ],
  },
  {
    id: 'TR-0049',
    status: 'suggested',
    source: 'Cold Store',
    destination: 'ICU Supply Depo',
    productCount: 1,
    totalUnits: 80,
    urgency: 'critical',
    createdAt: '2 hours ago',
    items: [
      { product: 'Propofol Injectable Emulsion 1%', sku: 'SKU-7720', qty: 80 },
    ],
    batches: [
      { batchId: 'B-4421', expiry: '2026-11-30', qty: 80, daysLeft: 42 },
    ],
    timeline: [
      {
        status: 'Predictive Demand Spike',
        timestamp: '2 hours ago',
        user: 'Auto-Balancing Engine',
        note: 'ICU scheduled surgery load up 35% this week.',
      },
    ],
  },

  // Column 2: Pending Approval (4 items)
  {
    id: 'TR-2401',
    status: 'pending_approval',
    source: 'Warehouse A',
    destination: 'Clinic North',
    productCount: 3,
    totalUnits: 200,
    urgency: 'critical',
    createdAt: '1 hour ago',
    items: [
      { product: 'N95 Respirator Masks', sku: 'SKU-1199', qty: 100 },
      { product: 'Surgical Gloves (L)', sku: 'SKU-1042', qty: 60 },
      { product: 'IV Saline 500ml 0.9%', sku: 'SKU-2088', qty: 40 },
    ],
    batches: [
      { batchId: 'B-7701', expiry: '2026-06-15', qty: 100, daysLeft: 240 },
      { batchId: 'B-9204', expiry: '2026-10-28', qty: 60, daysLeft: 10 },
      { batchId: 'B-9012', expiry: '2026-10-21', qty: 40, daysLeft: 3 },
    ],
    timeline: [
      { status: 'Drafted', timestamp: '1 hour ago', user: 'Maria Chen' },
      {
        status: 'Submitted for Approval',
        timestamp: '1 hour ago',
        user: 'Maria Chen',
        note: 'Urgent restocking for surgical wing surge.',
      },
    ],
  },
  {
    id: 'TR-2405',
    status: 'pending_approval',
    source: 'Cold Store',
    destination: 'Outpatient Clinic',
    productCount: 1,
    totalUnits: 45,
    urgency: 'normal',
    createdAt: '3 hours ago',
    items: [
      { product: 'IV Saline 500ml 0.9%', sku: 'SKU-2088', qty: 45 },
    ],
    batches: [
      { batchId: 'B-9012', expiry: '2026-10-21', qty: 45, daysLeft: 3 },
    ],
    timeline: [
      {
        status: 'Submitted for Approval',
        timestamp: '3 hours ago',
        user: 'James Okon',
        note: 'Standard bi-weekly replenishment order.',
      },
    ],
  },
  {
    id: 'TR-2408',
    status: 'pending_approval',
    source: 'Warehouse B',
    destination: 'ER Bay 3',
    productCount: 2,
    totalUnits: 200,
    urgency: 'critical',
    createdAt: '4 hours ago',
    items: [
      { product: 'Sterile Gauze Roll 4"', sku: 'SKU-3310', qty: 120 },
      { product: 'Bandage Roll 4" Elastic', sku: 'SKU-3320', qty: 80 },
    ],
    batches: [
      { batchId: 'B-9251', expiry: '2026-10-31', qty: 120, daysLeft: 13 },
      { batchId: 'B-3388', expiry: '2026-12-15', qty: 80, daysLeft: 58 },
    ],
    timeline: [
      {
        status: 'Submitted for Approval',
        timestamp: '4 hours ago',
        user: 'Priya Nair',
        note: 'Emergency trauma stock depleted over weekend triage.',
      },
    ],
  },
  {
    id: 'TR-2412',
    status: 'pending_approval',
    source: 'Warehouse A',
    destination: 'Pharmacy Fridge',
    productCount: 1,
    totalUnits: 30,
    urgency: 'normal',
    createdAt: '5 hours ago',
    items: [
      { product: 'Epinephrine Auto-Injector 0.3mg', sku: 'SKU-5520', qty: 30 },
    ],
    batches: [
      { batchId: 'B-5510', expiry: '2027-02-14', qty: 30, daysLeft: 480 },
    ],
    timeline: [
      {
        status: 'Submitted for Approval',
        timestamp: '5 hours ago',
        user: 'David Kim',
        note: 'Routine seasonal buffer stock replenishment.',
      },
    ],
  },

  // Column 3: In Transit (3 items)
  {
    id: 'TR-2398',
    status: 'in_transit',
    source: 'Cold Store',
    destination: 'ER Bay 3',
    productCount: 1,
    totalUnits: 40,
    urgency: 'normal',
    dispatched: true,
    createdAt: 'Yesterday, 14:30',
    items: [
      { product: 'IV Saline 500ml 0.9%', sku: 'SKU-2088', qty: 40 },
    ],
    batches: [
      { batchId: 'B-9012', expiry: '2026-10-21', qty: 40, daysLeft: 3 },
    ],
    timeline: [
      { status: 'Requested', timestamp: 'Yesterday, 14:00', user: 'James Okon' },
      { status: 'Approved', timestamp: 'Yesterday, 14:15', user: 'Maria Chen (Manager)' },
      {
        status: 'Dispatched',
        timestamp: 'Yesterday, 14:30',
        user: 'Cold Store Logistics Staff',
        note: 'Loaded on Transit Van #4. Courier: Sarah Jenkins. ETA 20 mins.',
      },
    ],
  },
  {
    id: 'TR-2395',
    status: 'in_transit',
    source: 'Warehouse A',
    destination: 'Warehouse B',
    productCount: 2,
    totalUnits: 160,
    urgency: 'critical',
    dispatched: true,
    createdAt: '5 hours ago',
    items: [
      { product: 'Sterile Gauze Roll 4"', sku: 'SKU-3310', qty: 100 },
      { product: 'Surgical Gloves (L)', sku: 'SKU-1042', qty: 60 },
    ],
    batches: [
      { batchId: 'B-9251', expiry: '2026-10-31', qty: 100, daysLeft: 13 },
      { batchId: 'B-7701', expiry: '2026-06-15', qty: 60, daysLeft: 240 },
    ],
    timeline: [
      { status: 'Requested', timestamp: '6 hours ago', user: 'Priya Nair' },
      { status: 'Approved', timestamp: '5 hours ago', user: 'Maria Chen (Manager)' },
      {
        status: 'Dispatched',
        timestamp: '4 hours ago',
        user: 'Warehouse A Staff',
        note: 'Staged at Bay 2 and dispatched via Regional Shuttle #2.',
      },
    ],
  },
  {
    id: 'TR-2392',
    status: 'in_transit',
    source: 'Warehouse A',
    destination: 'ICU Supply Depo',
    productCount: 1,
    totalUnits: 500,
    urgency: 'normal',
    dispatched: true,
    createdAt: '7 hours ago',
    items: [
      { product: 'Disposable Syringes 5ml', sku: 'SKU-6120', qty: 500 },
    ],
    batches: [
      { batchId: 'B-6120', expiry: '2027-08-01', qty: 500, daysLeft: 650 },
    ],
    timeline: [
      { status: 'Approved', timestamp: '8 hours ago', user: 'Maria Chen' },
      {
        status: 'Dispatched',
        timestamp: '7 hours ago',
        user: 'Warehouse A Logistics',
        note: 'Pallet loaded onto Electric Hauler #1. En route to ICU.',
      },
    ],
  },

  // Column 4: Completed (4 items: 2 received, 2 rejected)
  {
    id: 'TR-2384',
    status: 'completed',
    source: 'Warehouse A',
    destination: 'Cold Store',
    productCount: 2,
    totalUnits: 250,
    urgency: 'normal',
    cancelled: false,
    createdAt: '2 days ago',
    items: [
      { product: 'Surgical Gloves (L)', sku: 'SKU-1042', qty: 200 },
      { product: 'Sterile Gauze Roll 4"', sku: 'SKU-3310', qty: 50 },
    ],
    batches: [
      { batchId: 'B-7701', expiry: '2026-06-15', qty: 200, daysLeft: 240 },
      { batchId: 'B-9251', expiry: '2026-10-31', qty: 50, daysLeft: 13 },
    ],
    timeline: [
      { status: 'Approved', timestamp: '2 days ago', user: 'Maria Chen' },
      { status: 'Dispatched', timestamp: '2 days ago', user: 'Warehouse A Staff' },
      {
        status: 'Received & Stocked',
        timestamp: '1 day ago',
        user: 'Cold Store Receiving Staff',
        note: 'All 250 units verified undamaged and added to active inventory.',
      },
    ],
  },
  {
    id: 'TR-2380',
    status: 'completed',
    source: 'Warehouse B',
    destination: 'Clinic North',
    productCount: 1,
    totalUnits: 75,
    urgency: 'normal',
    cancelled: false,
    createdAt: '3 days ago',
    items: [
      { product: 'Ciprofloxacin Eye Drops 0.3%', sku: 'SKU-8812', qty: 75 },
    ],
    batches: [
      { batchId: 'B-8812', expiry: '2026-12-01', qty: 75, daysLeft: 44 },
    ],
    timeline: [
      { status: 'Approved', timestamp: '3 days ago', user: 'Maria Chen' },
      { status: 'Dispatched', timestamp: '3 days ago', user: 'Warehouse B Staff' },
      {
        status: 'Received & Stocked',
        timestamp: '2 days ago',
        user: 'Clinic North Nurse',
        note: 'Received intact, placed in secure cabinet A-2.',
      },
    ],
  },
  {
    id: 'TR-2390',
    status: 'completed',
    source: 'Warehouse B',
    destination: 'Warehouse A',
    productCount: 1,
    totalUnits: 100,
    urgency: 'normal',
    cancelled: true,
    rejectionReason: 'Duplicate request — stock already in transit on TR-2395.',
    createdAt: '3 days ago',
    items: [
      { product: 'Sterile Gauze Roll 4"', sku: 'SKU-3310', qty: 100 },
    ],
    batches: [
      { batchId: 'B-9251', expiry: '2026-10-31', qty: 100, daysLeft: 13 },
    ],
    timeline: [
      { status: 'Requested', timestamp: '3 days ago', user: 'Priya Nair' },
      {
        status: 'Rejected',
        timestamp: '3 days ago',
        user: 'Maria Chen (Manager)',
        note: 'Duplicate request — stock already in transit on TR-2395.',
      },
    ],
  },
  {
    id: 'TR-2375',
    status: 'completed',
    source: 'Cold Store',
    destination: 'ER Bay 3',
    productCount: 1,
    totalUnits: 25,
    urgency: 'critical',
    cancelled: true,
    rejectionReason: 'Cold-chain vehicle breakdown. Re-routed to separate refrigerated transport vendor.',
    createdAt: '4 days ago',
    items: [
      { product: 'Insulin Glargine 100U/ml', sku: 'SKU-4401', qty: 25 },
    ],
    batches: [
      { batchId: 'B-9105', expiry: '2026-10-21', qty: 25, daysLeft: 3 },
    ],
    timeline: [
      { status: 'Requested', timestamp: '4 days ago', user: 'James Okon' },
      {
        status: 'Rejected',
        timestamp: '4 days ago',
        user: 'Maria Chen (Manager)',
        note: 'Cold-chain vehicle breakdown. Re-routed to separate refrigerated transport vendor.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Wizard Constants & Catalogs
// ---------------------------------------------------------------------------
const ALL_LOCATIONS = [
  'All Locations',
  'Warehouse A',
  'Warehouse B',
  'Cold Store',
  'Clinic North',
  'ER Bay 3',
  'Pharmacy Fridge',
  'Outpatient Clinic',
  'ICU Supply Depo',
]

const CATALOG_PRODUCTS = [
  { id: 'SKU-1199', name: 'N95 Respirator Masks', category: 'PPE', defaultQty: 100 },
  { id: 'SKU-1042', name: 'Surgical Gloves (L)', category: 'PPE', defaultQty: 60 },
  { id: 'SKU-2088', name: 'IV Saline 500ml 0.9%', category: 'Fluids', defaultQty: 50 },
  { id: 'SKU-4401', name: 'Insulin Glargine 100U/ml', category: 'Biologics', defaultQty: 30 },
  { id: 'SKU-3310', name: 'Sterile Gauze Roll 4"', category: 'Wound Care', defaultQty: 80 },
  { id: 'SKU-5520', name: 'Epinephrine Auto-Injector 0.3mg', category: 'Emergency', defaultQty: 25 },
  { id: 'SKU-6120', name: 'Disposable Syringes 5ml', category: 'General', defaultQty: 200 },
  { id: 'SKU-8812', name: 'Ciprofloxacin Eye Drops 0.3%', category: 'Pharma', defaultQty: 40 },
]

type KanbanColumnConfig = {
  id: TransferCard['status']
  title: string
  subtitle: string
  headerBg: string
  accentColor: string
  badgeBg: string
  icon: typeof Sparkles
}

const COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'suggested',
    title: 'Suggested',
    subtitle: 'AI Stock Rebalancing',
    headerBg: 'bg-blue-100',
    accentColor: 'border-blue-500',
    badgeBg: 'bg-blue-500 text-white',
    icon: Sparkles,
  },
  {
    id: 'pending_approval',
    title: 'Pending Approval',
    subtitle: 'Awaiting Sign-off',
    headerBg: 'bg-amber-100',
    accentColor: 'border-amber-500',
    badgeBg: 'bg-amber-500 text-white',
    icon: Clock,
  },
  {
    id: 'in_transit',
    title: 'In Transit',
    subtitle: 'Dispatched & En Route',
    headerBg: 'bg-purple-100',
    accentColor: 'border-purple-500',
    badgeBg: 'bg-purple-500 text-white',
    icon: Truck,
  },
  {
    id: 'completed',
    title: 'Completed',
    subtitle: 'Received or Resolved',
    headerBg: 'bg-green-100',
    accentColor: 'border-green-500',
    badgeBg: 'bg-green-500 text-white',
    icon: CheckCircle2,
  },
]

type SuggestedSource = {
  id: string
  location: string
  distanceKm: number
  available: number
  score: number
  badgeLabel: string
  badgeTone: 'good' | 'info' | 'warning'
  rationale: string
}

type WizardBatch = {
  batchId: string
  expiry: string
  daysLeft: number
  availableQty: number
  fefoRank: number
}

// ---------------------------------------------------------------------------
// Main TransfersPage Component
// ---------------------------------------------------------------------------
export function TransfersPage() {
  const { toast } = useToast()

  // State: Transfers list
  const [transfers, setTransfers] = useState<TransferCard[]>(INITIAL_TRANSFERS)
  const [selectedTransfer, setSelectedTransfer] = useState<TransferCard | null>(null)

  // Filters State
  const [urgencyFilter, setUrgencyFilter] = useState<'All' | 'critical' | 'normal'>('All')
  const [locationFilter, setLocationFilter] = useState<string>('All Locations')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals & Overlays State
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [rejectModalId, setRejectModalId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string>('Duplicate request — stock already in transit.')
  const [customRejectionText, setCustomRejectionText] = useState<string>('')

  // Wizard Step State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)
  const [wizardDestination, setWizardDestination] = useState<string>('Clinic North')
  const [wizardProductId, setWizardProductId] = useState<string>('SKU-1199')
  const [wizardQuantity, setWizardQuantity] = useState<number>(100)
  const [wizardUrgency, setWizardUrgency] = useState<'critical' | 'normal'>('normal')
  const [wizardReason, setWizardReason] = useState<string>('Restocking for clinical demand surge')

  // Wizard Step 2: Selected source
  const [selectedSourceId, setSelectedSourceId] = useState<string>('src-1')

  // Wizard Step 3: Batches & Allocations
  const [wizardBatches, setWizardBatches] = useState<WizardBatch[]>([])
  const [batchAllocations, setBatchAllocations] = useState<Record<string, number>>({})

  // Initialize or fetch from API on mount
  useEffect(() => {
    fetchTransfers()
      .then((data) => {
        if (data && data.length > 0) {
          // If server has data, merge or fallback to comprehensive dataset
          const existingIds = new Set(data.map((d) => d.id))
          const merged = [...data]
          for (const item of INITIAL_TRANSFERS) {
            if (!existingIds.has(item.id)) {
              merged.push(item)
            }
          }
          setTransfers(merged)
        }
      })
      .catch(() => {
        // Fallback already in initial state
      })
  }, [])

  // Derived selected product
  const selectedProduct = useMemo(() => {
    return CATALOG_PRODUCTS.find((p) => p.id === wizardProductId) || CATALOG_PRODUCTS[0]
  }, [wizardProductId])

  // System Suggests 3 Ranked Sources for Step 2
  const rankedSources: SuggestedSource[] = useMemo(() => {
    const isCold = selectedProduct.category === 'Biologics' || selectedProduct.name.includes('Insulin')
    const sources: SuggestedSource[] = [
      {
        id: 'src-1',
        location: isCold ? 'Cold Store' : 'Warehouse A',
        distanceKm: wizardDestination.includes('Clinic') ? 12 : 16,
        available: Math.max(wizardQuantity * 3, 340),
        score: 94,
        badgeLabel: '94/100 · Optimal Match',
        badgeTone: 'good',
        rationale: 'Abundant FEFO surplus near expiry; lowest transport route latency.',
      },
      {
        id: 'src-2',
        location: isCold ? 'Warehouse A' : 'Warehouse B',
        distanceKm: wizardDestination.includes('Bay') ? 14 : 28,
        available: Math.max(wizardQuantity * 2, 180),
        score: 79,
        badgeLabel: '79/100 · High Stock',
        badgeTone: 'info',
        rationale: 'Healthy inventory buffer; courier transit time approx 45 mins.',
      },
      {
        id: 'src-3',
        location: isCold ? 'Pharmacy Fridge' : 'Cold Store',
        distanceKm: 6,
        available: Math.max(wizardQuantity + 15, 65),
        score: 65,
        badgeLabel: '65/100 · Limited Buffer',
        badgeTone: 'warning',
        rationale: 'Closest physical facility, but limited remaining reserve capacity.',
      },
    ]
    return sources.filter((s) => s.location !== wizardDestination)
  }, [wizardDestination, selectedProduct, wizardQuantity])

  // Get currently selected source object
  const currentSource = useMemo(() => {
    return rankedSources.find((s) => s.id === selectedSourceId) || rankedSources[0]
  }, [rankedSources, selectedSourceId])

  // Generate FEFO batches whenever product or source changes
  useEffect(() => {
    if (!currentSource) return
    const batches: WizardBatch[] = [
      {
        batchId: 'B-9204',
        expiry: '2026-10-28',
        daysLeft: 10,
        availableQty: Math.min(wizardQuantity, 60),
        fefoRank: 1,
      },
      {
        batchId: 'B-7701',
        expiry: '2026-12-15',
        daysLeft: 58,
        availableQty: Math.max(wizardQuantity, 150),
        fefoRank: 2,
      },
      {
        batchId: 'B-8830',
        expiry: '2027-04-20',
        daysLeft: 549,
        availableQty: 250,
        fefoRank: 3,
      },
    ]
    setWizardBatches(batches)

    // Auto-allocate with FEFO on initial generation
    let remaining = wizardQuantity
    const initialAllocation: Record<string, number> = {}
    for (const b of batches) {
      if (remaining <= 0) {
        initialAllocation[b.batchId] = 0
      } else {
        const take = Math.min(remaining, b.availableQty)
        initialAllocation[b.batchId] = take
        remaining -= take
      }
    }
    setBatchAllocations(initialAllocation)
  }, [wizardQuantity, currentSource])

  // Auto-fill FEFO handler
  const handleAutoFillFEFO = () => {
    let remaining = wizardQuantity
    const newAllocation: Record<string, number> = {}
    for (const b of wizardBatches) {
      if (remaining <= 0) {
        newAllocation[b.batchId] = 0
      } else {
        const take = Math.min(remaining, b.availableQty)
        newAllocation[b.batchId] = take
        remaining -= take
      }
    }
    setBatchAllocations(newAllocation)
    toast('Batches automatically allocated according to FEFO policy', 'info')
  }

  // Sum of allocated batch units
  const totalAllocated = useMemo(() => {
    return Object.values(batchAllocations).reduce((sum, val) => sum + (val || 0), 0)
  }, [batchAllocations])

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      // Urgency filter
      if (urgencyFilter !== 'All' && t.urgency !== urgencyFilter) {
        return false
      }
      // Location filter
      if (locationFilter !== 'All Locations') {
        if (t.source !== locationFilter && t.destination !== locationFilter) {
          return false
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesId = t.id.toLowerCase().includes(q)
        const matchesSource = t.source.toLowerCase().includes(q)
        const matchesDest = t.destination.toLowerCase().includes(q)
        const matchesProduct = t.items?.some((i) => i.product.toLowerCase().includes(q))
        if (!matchesId && !matchesSource && !matchesDest && !matchesProduct) {
          return false
        }
      }
      return true
    })
  }, [transfers, urgencyFilter, locationFilter, searchQuery])

  // Quick stats
  const stats = useMemo(() => {
    const suggested = transfers.filter((t) => t.status === 'suggested').length
    const pending = transfers.filter((t) => t.status === 'pending_approval').length
    const inTransit = transfers.filter((t) => t.status === 'in_transit').length
    const completed = transfers.filter((t) => t.status === 'completed').length
    const critical = transfers.filter((t) => t.urgency === 'critical').length
    return { suggested, pending, inTransit, completed, critical, total: transfers.length }
  }, [transfers])

  // ---------------------------------------------------------------------------
  // Status Transitions Handlers
  // ---------------------------------------------------------------------------
  const handleStatusTransition = async (
    transferId: string,
    action: 'approve' | 'receive' | 'submit_approval',
  ) => {
    const now = 'Just now'

    setTransfers((prev) =>
      prev.map((item) => {
        if (item.id !== transferId) return item

        if (action === 'approve') {
          const updated: TransferCard = {
            ...item,
            status: 'in_transit',
            dispatched: true,
            timeline: [
              ...(item.timeline || []),
              {
                status: 'Approved & Dispatched',
                timestamp: now,
                user: 'Maria Chen (Manager)',
                note: 'Approved and scheduled on transit courier.',
              },
            ],
          }
          if (selectedTransfer?.id === transferId) setSelectedTransfer(updated)
          return updated
        }

        if (action === 'receive') {
          const updated: TransferCard = {
            ...item,
            status: 'completed',
            cancelled: false,
            timeline: [
              ...(item.timeline || []),
              {
                status: 'Received & Stocked',
                timestamp: now,
                user: 'Destination Facility Staff',
                note: 'Goods received intact and scanned into local facility inventory.',
              },
            ],
          }
          if (selectedTransfer?.id === transferId) setSelectedTransfer(updated)
          return updated
        }

        if (action === 'submit_approval') {
          const updated: TransferCard = {
            ...item,
            status: 'pending_approval',
            timeline: [
              ...(item.timeline || []),
              {
                status: 'Submitted for Approval',
                timestamp: now,
                user: 'Staff Member',
                note: 'AI recommendation accepted and submitted for manager approval.',
              },
            ],
          }
          if (selectedTransfer?.id === transferId) setSelectedTransfer(updated)
          return updated
        }

        return item
      }),
    )

    // Notify API
    try {
      await patchTransfer(transferId, action)
    } catch {
      // Mock fallback works in-memory
    }

    if (action === 'approve') {
      toast(`Transfer ${transferId} approved and dispatched!`, 'success')
    } else if (action === 'receive') {
      toast(`Transfer ${transferId} received and verified into inventory.`, 'success')
    } else if (action === 'submit_approval') {
      toast(`Transfer ${transferId} submitted for manager review.`, 'info')
    }
  }

  // Reject Modal Confirmation Handler
  const handleConfirmReject = async () => {
    if (!rejectModalId) return
    const id = rejectModalId
    const finalReason =
      rejectionReason === 'Other (custom reason below)'
        ? customRejectionText || 'Transfer rejected by manager'
        : rejectionReason

    const now = 'Just now'

    setTransfers((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated: TransferCard = {
          ...item,
          status: 'completed',
          cancelled: true,
          rejectionReason: finalReason,
          timeline: [
            ...(item.timeline || []),
            {
              status: 'Rejected',
              timestamp: now,
              user: 'Maria Chen (Manager)',
              note: finalReason,
            },
          ],
        }
        if (selectedTransfer?.id === id) setSelectedTransfer(updated)
        return updated
      }),
    )

    try {
      await patchTransfer(id, 'reject', { reason: finalReason })
    } catch {
      // In-memory fallback
    }

    toast(`Transfer ${id} was rejected.`, 'warning')
    setRejectModalId(null)
    setCustomRejectionText('')
  }

  // ---------------------------------------------------------------------------
  // Wizard Submit Handler
  // ---------------------------------------------------------------------------
  const handleCreateTransferSubmit = async () => {
    const newId = `TR-${Math.floor(2500 + Math.random() * 5000)}`
    const activeBatches: TransferBatch[] = Object.entries(batchAllocations)
      .filter(([_, qty]) => qty > 0)
      .map(([batchId, qty]) => {
        const b = wizardBatches.find((item) => item.batchId === batchId)
        return {
          batchId,
          expiry: b?.expiry || '2026-12-31',
          daysLeft: b?.daysLeft || 60,
          qty,
        }
      })

    const newTransfer: TransferCard = {
      id: newId,
      status: 'pending_approval',
      source: currentSource?.location || 'Warehouse A',
      destination: wizardDestination,
      productCount: 1,
      totalUnits: wizardQuantity,
      urgency: wizardUrgency,
      createdAt: 'Just now',
      items: [
        {
          product: selectedProduct.name,
          sku: selectedProduct.id,
          qty: wizardQuantity,
        },
      ],
      batches: activeBatches,
      timeline: [
        {
          status: 'Transfer Created',
          timestamp: 'Just now',
          user: 'Current User',
          note: wizardReason || 'Created via Transfer Wizard',
        },
        {
          status: 'Submitted for Approval',
          timestamp: 'Just now',
          user: 'System',
          note: 'Awaiting manager sign-off prior to staging.',
        },
      ],
    }

    // Call API and update state
    try {
      await createTransfer(newTransfer)
    } catch {
      // In-memory fallback
    }

    setTransfers((prev) => [newTransfer, ...prev])
    toast(`Transfer ${newId} created and submitted for approval!`, 'success')

    // Reset Wizard
    setIsWizardOpen(false)
    setWizardStep(1)
    setWizardQuantity(100)
    setWizardReason('Restocking for clinical demand surge')
    setWizardUrgency('normal')
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------- */}
      {/* Top Header & New Transfer Action */}
      {/* ------------------------------------------------------------------- */}
      <PageHeader
        title="Stock Transfers"
        subtitle="Kanban board for facility inventory rebalancing, approval workflows, and live dispatch tracking."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setWizardStep(1)
                setIsWizardOpen(true)
              }}
            >
              New Transfer
            </Button>
          </div>
        }
      />

      {/* ------------------------------------------------------------------- */}
      {/* Top Summary Stats Bar */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-[10px] border border-border bg-surface p-3 shadow-xs">
          <p className="text-xs font-medium text-muted">Total Active</p>
          <p className="mt-1 text-xl font-bold text-text">{stats.total}</p>
        </div>
        <div className="rounded-[10px] border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-900">Suggested</p>
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-blue-900">{stats.suggested}</p>
        </div>
        <div className="rounded-[10px] border border-amber-200 bg-amber-50/60 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-900">Pending Review</p>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-amber-900">{stats.pending}</p>
        </div>
        <div className="rounded-[10px] border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-purple-900">In Transit</p>
            <Truck className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-purple-900">{stats.inTransit}</p>
        </div>
        <div className="rounded-[10px] border border-green-200 bg-green-50/60 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-green-900">Completed</p>
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-green-900">{stats.completed}</p>
        </div>
        <div className="rounded-[10px] border border-red-200 bg-red-50/60 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-red-900">Critical Priority</p>
            <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-red-900">{stats.critical}</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Top Controls & Filter Bar */}
      {/* ------------------------------------------------------------------- */}
      <Card padding={false} className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by TR-ID, product, or facility…"
              className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right: Urgency Filter & Location Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Urgency segmented buttons */}
            <div className="flex rounded-[8px] border border-border bg-app p-0.5">
              {(['All', 'critical', 'normal'] as const).map((urg) => (
                <button
                  key={urg}
                  type="button"
                  onClick={() => setUrgencyFilter(urg)}
                  className={cn(
                    'rounded-[6px] px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                    urgencyFilter === urg
                      ? 'bg-surface font-semibold text-text shadow-xs'
                      : 'text-muted hover:text-text',
                  )}
                >
                  {urg === 'All' ? 'All Urgencies' : `${urg}`}
                </button>
              ))}
            </div>

            {/* Location dropdown */}
            <div className="min-w-[190px]">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {ALL_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters button */}
            {(urgencyFilter !== 'All' || locationFilter !== 'All Locations' || searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setUrgencyFilter('All')
                  setLocationFilter('All Locations')
                  setSearchQuery('')
                }}
                className="h-10 text-xs text-muted hover:text-text"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/* Kanban Board - 4 Columns */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colTransfers = filteredTransfers.filter((t) => t.status === col.id)
          const Icon = col.icon

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-[12px] border border-border bg-app/40 shadow-xs"
            >
              {/* Column Header */}
              <div
                className={cn(
                  'flex items-center justify-between border-b-2 px-4 py-3 rounded-t-[12px]',
                  col.headerBg,
                  col.accentColor,
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-text" />
                  <div>
                    <h3 className="text-sm font-semibold text-text leading-tight">{col.title}</h3>
                    <p className="text-[11px] text-muted leading-tight">{col.subtitle}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold shadow-xs',
                    col.badgeBg,
                  )}
                >
                  {colTransfers.length}
                </span>
              </div>

              {/* Column Cards Scrollable List */}
              <div className="flex-1 space-y-3 p-3 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[460px]">
                {colTransfers.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center rounded-[8px] border border-dashed border-border/80 bg-surface/50 p-4 text-center">
                    <Filter className="h-6 w-6 text-muted/60 mb-2" />
                    <p className="text-xs font-medium text-text">No transfers found</p>
                    <p className="mt-1 text-[11px] text-muted">
                      No cards match current filter criteria in this status.
                    </p>
                  </div>
                ) : (
                  colTransfers.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTransfer(t)}
                      className="group relative rounded-[12px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer text-left"
                    >
                      {/* Top row: Monospace ID and Urgency Chip */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-sm text-text tracking-tight group-hover:text-primary transition-colors">
                          {t.id}
                        </span>
                        <Chip
                          label={t.urgency === 'critical' ? 'Critical' : 'Normal'}
                          tone={t.urgency === 'critical' ? 'expired' : 'neutral'}
                        />
                      </div>

                      {/* Source -> Destination with ArrowRight icon */}
                      <div className="flex items-center gap-2 text-sm font-medium text-text mb-2.5">
                        <span className="truncate max-w-[105px]" title={t.source}>
                          {t.source}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                        <span className="truncate max-w-[105px]" title={t.destination}>
                          {t.destination}
                        </span>
                      </div>

                      {/* Product count + total units badge */}
                      <div className="flex items-center justify-between text-xs text-muted mb-2.5 bg-app/70 rounded-[6px] px-2.5 py-1.5 border border-border/60">
                        <span className="flex items-center gap-1 font-medium text-text">
                          <Package className="h-3.5 w-3.5 text-muted" />
                          {t.productCount} {t.productCount === 1 ? 'Product' : 'Products'}
                        </span>
                        <span className="font-semibold text-text">
                          {t.totalUnits ?? t.items?.reduce((acc, curr) => acc + curr.qty, 0) ?? 0}{' '}
                          units
                        </span>
                      </div>

                      {/* Product Item Line Preview */}
                      {t.items && t.items.length > 0 && (
                        <div className="mb-3 text-xs text-muted truncate">
                          <span className="font-medium text-text">{t.items[0].product}</span>
                          {t.items.length > 1 && (
                            <span className="text-muted ml-1 font-normal">
                              (+{t.items.length - 1} more)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer: Relative Timestamp and Action Button */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs">
                        <span className="flex items-center gap-1 text-muted text-[11px]">
                          <Clock className="h-3 w-3" />
                          {t.createdAt || 'Recent'}
                        </span>

                        {/* Interactive Status Transition Action Buttons */}
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {col.id === 'suggested' && (
                            <button
                              type="button"
                              onClick={() => handleStatusTransition(t.id, 'submit_approval')}
                              className="inline-flex items-center gap-1 rounded-[6px] bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 text-xs font-medium transition-colors"
                              title="Submit AI suggestion for manager review"
                            >
                              <Send className="h-3 w-3" />
                              Request
                            </button>
                          )}

                          {col.id === 'pending_approval' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setRejectModalId(t.id)}
                                className="inline-flex items-center gap-1 rounded-[6px] border border-error/40 text-error hover:bg-red-50 px-2 py-1 text-xs font-medium transition-colors"
                                title="Reject transfer"
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusTransition(t.id, 'approve')}
                                className="inline-flex items-center gap-1 rounded-[6px] bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 text-xs font-medium transition-colors shadow-xs"
                                title="Approve and schedule dispatch"
                              >
                                <Check className="h-3 w-3" />
                                Approve
                              </button>
                            </>
                          )}

                          {col.id === 'in_transit' && (
                            <button
                              type="button"
                              onClick={() => handleStatusTransition(t.id, 'receive')}
                              className="inline-flex items-center gap-1 rounded-[6px] bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 text-xs font-medium transition-colors shadow-xs"
                              title="Confirm delivery & receive units into inventory"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Receive
                            </button>
                          )}

                          {col.id === 'completed' && (
                            <div>
                              {t.cancelled ? (
                                <Chip label="Rejected" tone="expired" />
                              ) : (
                                <Chip label="Stocked" tone="good" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Card Details Drawer */}
      {/* ------------------------------------------------------------------- */}
      <Drawer
        open={Boolean(selectedTransfer)}
        title={selectedTransfer ? `Transfer ${selectedTransfer.id}` : ''}
        wide={true}
        onClose={() => setSelectedTransfer(null)}
        footer={
          selectedTransfer ? (
            <div className="flex items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => setSelectedTransfer(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                {selectedTransfer.status === 'suggested' && (
                  <Button
                    variant="primary"
                    icon={<Send className="h-4 w-4" />}
                    onClick={() => {
                      handleStatusTransition(selectedTransfer.id, 'submit_approval')
                    }}
                  >
                    Submit for Approval
                  </Button>
                )}
                {selectedTransfer.status === 'pending_approval' && (
                  <>
                    <Button
                      variant="destructiveOutline"
                      icon={<X className="h-4 w-4" />}
                      onClick={() => setRejectModalId(selectedTransfer.id)}
                    >
                      Reject Transfer
                    </Button>
                    <Button
                      variant="success"
                      icon={<Check className="h-4 w-4" />}
                      onClick={() => {
                        handleStatusTransition(selectedTransfer.id, 'approve')
                      }}
                    >
                      Approve & Dispatch
                    </Button>
                  </>
                )}
                {selectedTransfer.status === 'in_transit' && (
                  <Button
                    variant="success"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    onClick={() => {
                      handleStatusTransition(selectedTransfer.id, 'receive')
                    }}
                  >
                    Confirm Delivery & Receive
                  </Button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {selectedTransfer && (
          <div className="space-y-6 text-left">
            {/* Header Status & Urgency Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-text">
                  {selectedTransfer.id}
                </span>
                <Chip
                  label={
                    selectedTransfer.status === 'suggested'
                      ? 'AI Suggested'
                      : selectedTransfer.status === 'pending_approval'
                        ? 'Pending Approval'
                        : selectedTransfer.status === 'in_transit'
                          ? 'In Transit'
                          : selectedTransfer.cancelled
                            ? 'Rejected / Cancelled'
                            : 'Completed'
                  }
                  tone={
                    selectedTransfer.status === 'suggested'
                      ? 'info'
                      : selectedTransfer.status === 'pending_approval'
                        ? 'warning'
                        : selectedTransfer.status === 'in_transit'
                          ? 'info'
                          : selectedTransfer.cancelled
                            ? 'expired'
                            : 'good'
                  }
                />
                <Chip
                  label={selectedTransfer.urgency === 'critical' ? 'Critical Priority' : 'Normal Priority'}
                  tone={selectedTransfer.urgency === 'critical' ? 'expired' : 'neutral'}
                />
              </div>
              <span className="text-xs text-muted flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Created {selectedTransfer.createdAt || 'Recent'}
              </span>
            </div>

            {/* Rejection / Cancellation alert banner if applicable */}
            {selectedTransfer.cancelled && selectedTransfer.rejectionReason && (
              <div className="rounded-[8px] border border-red-300 bg-red-50 p-4 text-red-900">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Transfer Rejected / Cancelled</h4>
                    <p className="mt-1 text-sm text-red-800">{selectedTransfer.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Routing Visual: Source -> Destination */}
            <div className="rounded-[12px] border border-border bg-app/50 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-7 sm:items-center">
                {/* Source */}
                <div className="sm:col-span-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Source Facility
                    </span>
                    <h4 className="text-base font-bold text-text">{selectedTransfer.source}</h4>
                    <p className="text-xs text-muted">Active Fulfillment Node</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="sm:col-span-1 flex justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-border text-muted">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Destination */}
                <div className="sm:col-span-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Destination Facility
                    </span>
                    <h4 className="text-base font-bold text-text">
                      {selectedTransfer.destination}
                    </h4>
                    <p className="text-xs text-muted">Receiving Depot</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary KPI Badges */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[8px] border border-border bg-surface p-3">
                <span className="text-xs text-muted">Total Products</span>
                <p className="mt-1 text-lg font-bold text-text">
                  {selectedTransfer.productCount} SKU
                </p>
              </div>
              <div className="rounded-[8px] border border-border bg-surface p-3">
                <span className="text-xs text-muted">Total Units</span>
                <p className="mt-1 text-lg font-bold text-text">
                  {selectedTransfer.totalUnits ??
                    selectedTransfer.items?.reduce((a, b) => a + b.qty, 0) ??
                    0}
                </p>
              </div>
              <div className="rounded-[8px] border border-border bg-surface p-3">
                <span className="text-xs text-muted">Dispatch Status</span>
                <p className="mt-1 text-sm font-semibold text-text">
                  {selectedTransfer.dispatched ? 'En Route (Dispatched)' : 'Staged / Pending'}
                </p>
              </div>
              <div className="rounded-[8px] border border-border bg-surface p-3">
                <span className="text-xs text-muted">Allocated Batches</span>
                <p className="mt-1 text-lg font-bold text-text">
                  {selectedTransfer.batches?.length || 1}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-sm font-semibold text-text mb-2.5 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-primary" />
                Line Items
              </h4>
              <div className="overflow-hidden rounded-[8px] border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-app text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-2.5">Product Name</th>
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {selectedTransfer.items && selectedTransfer.items.length > 0 ? (
                      selectedTransfer.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-app/40">
                          <td className="px-4 py-3 font-medium text-text">{item.product}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted">
                            {item.sku || 'SKU-GEN'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-text">
                            {item.qty} units
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-center text-muted">
                          No line items detailed
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Batch Allocations Section */}
            {selectedTransfer.batches && selectedTransfer.batches.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-text mb-2.5 flex items-center gap-1.5">
                  <Boxes className="h-4 w-4 text-primary" />
                  FEFO Allocated Batches
                </h4>
                <div className="overflow-hidden rounded-[8px] border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-app text-xs uppercase text-muted">
                      <tr>
                        <th className="px-4 py-2.5">Batch ID</th>
                        <th className="px-4 py-2.5">Expiration Date</th>
                        <th className="px-4 py-2.5">Shelf Life</th>
                        <th className="px-4 py-2.5 text-right">Allocated Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface">
                      {selectedTransfer.batches.map((b, idx) => (
                        <tr key={idx} className="hover:bg-app/40">
                          <td className="px-4 py-2.5 font-mono font-medium text-text">
                            {b.batchId}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted">{b.expiry}</td>
                          <td className="px-4 py-2.5">
                            {b.daysLeft !== undefined ? (
                              <Chip
                                label={`${b.daysLeft} days left`}
                                tone={
                                  b.daysLeft <= 15
                                    ? 'expired'
                                    : b.daysLeft <= 60
                                      ? 'warning'
                                      : 'good'
                                }
                              />
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-text">
                            {b.qty} units
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-text mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                Status Timeline
              </h4>
              <div className="space-y-4 pl-2 border-l-2 border-border ml-2">
                {selectedTransfer.timeline && selectedTransfer.timeline.length > 0 ? (
                  selectedTransfer.timeline.map((evt, idx) => (
                    <div key={idx} className="relative pl-6 text-sm">
                      <div className="absolute -left-[13px] top-1 h-3 w-3 rounded-full border-2 border-surface bg-primary shadow-xs" />
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-semibold text-text">{evt.status}</span>
                        <span className="text-xs text-muted">{evt.timestamp}</span>
                      </div>
                      {evt.user && (
                        <p className="text-xs text-muted mt-0.5">By {evt.user}</p>
                      )}
                      {evt.note && (
                        <p className="mt-1 rounded-[6px] bg-app/80 p-2 text-xs text-text border border-border/50">
                          {evt.note}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted">No timeline events recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ------------------------------------------------------------------- */}
      {/* Reject Reason Confirmation Modal */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        open={Boolean(rejectModalId)}
        title={`Reject Transfer ${rejectModalId}`}
        confirmLabel="Confirm Rejection"
        confirmVariant="destructive"
        onConfirm={handleConfirmReject}
        onClose={() => setRejectModalId(null)}
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-text">
            Please select the reason for rejecting this transfer request. The requester will be notified
            and the transfer will be marked as Cancelled.
          </p>

          <Select
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            options={[
              {
                value: 'Duplicate request — stock already in transit.',
                label: 'Duplicate request — stock already in transit',
              },
              {
                value: 'Insufficient stock at source facility.',
                label: 'Insufficient stock at source facility',
              },
              {
                value: 'Cold-chain transport vehicle unavailable.',
                label: 'Cold-chain transport vehicle unavailable',
              },
              {
                value: 'Demand requirement canceled by receiving department.',
                label: 'Demand requirement canceled by receiving department',
              },
              {
                value: 'Other (custom reason below)',
                label: 'Other (custom reason below)',
              },
            ]}
          />

          {rejectionReason === 'Other (custom reason below)' && (
            <Input
              label="Custom Reason Details"
              placeholder="Enter explanation for rejection…"
              value={customRejectionText}
              onChange={(e) => setCustomRejectionText(e.target.value)}
            />
          )}
        </div>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* Multi-Step Transfer Wizard ("+ New Transfer" Overlay) */}
      {/* ------------------------------------------------------------------- */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-[12px] border border-border bg-surface p-6 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Top: Title and Close Button */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-text">New Inventory Transfer</h2>
                <p className="text-xs text-muted">
                  Multi-facility automated inventory balancing and batch allocation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="rounded-[8px] p-1.5 text-muted hover:bg-app"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Wizard Stepper Bar */}
            <div className="my-4 grid grid-cols-4 gap-2 border-b border-border pb-4">
              {[
                { step: 1, label: 'Destination & Item' },
                { step: 2, label: 'Ranked Sources' },
                { step: 3, label: 'Batch Allocation' },
                { step: 4, label: 'Review & Confirm' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={cn(
                    'flex flex-col items-center text-center p-2 rounded-[8px] transition-colors',
                    wizardStep === s.step
                      ? 'bg-primary/10 text-primary font-bold'
                      : wizardStep > s.step
                        ? 'text-green-700 bg-green-50'
                        : 'text-muted bg-app/50',
                  )}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    {wizardStep > s.step ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <span className="font-semibold">{s.step}.</span>
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Wizard Content Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-4 text-left">
              {/* STEP 1: Destination & Product */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                      label="Destination Facility *"
                      value={wizardDestination}
                      onChange={(e) => setWizardDestination(e.target.value)}
                      options={ALL_LOCATIONS.filter((l) => l !== 'All Locations').map((loc) => ({
                        value: loc,
                        label: loc,
                      }))}
                    />

                    <Select
                      label="Select Product SKU *"
                      value={wizardProductId}
                      onChange={(e) => {
                        setWizardProductId(e.target.value)
                        const p = CATALOG_PRODUCTS.find((item) => item.id === e.target.value)
                        if (p) setWizardQuantity(p.defaultQty)
                      }}
                      options={CATALOG_PRODUCTS.map((p) => ({
                        value: p.id,
                        label: `${p.name} (${p.id} · ${p.category})`,
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Transfer Quantity (Units) *"
                      type="number"
                      min={1}
                      max={10000}
                      value={wizardQuantity}
                      onChange={(e) => setWizardQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />

                    <div>
                      <label className="text-sm font-medium text-text block mb-2">
                        Urgency Level
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setWizardUrgency('normal')}
                          className={cn(
                            'flex-1 rounded-[8px] border py-2 text-xs font-semibold transition-colors',
                            wizardUrgency === 'normal'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted hover:bg-app',
                          )}
                        >
                          Normal
                        </button>
                        <button
                          type="button"
                          onClick={() => setWizardUrgency('critical')}
                          className={cn(
                            'flex-1 rounded-[8px] border py-2 text-xs font-semibold transition-colors',
                            wizardUrgency === 'critical'
                              ? 'border-error bg-red-50 text-error'
                              : 'border-border text-muted hover:bg-app',
                          )}
                        >
                          Critical Priority
                        </button>
                      </div>
                    </div>
                  </div>

                  <Input
                    label="Transfer Reason / Order Notes"
                    placeholder="E.g., Surge replenishment for emergency triage..."
                    value={wizardReason}
                    onChange={(e) => setWizardReason(e.target.value)}
                  />

                  <div className="rounded-[8px] border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <p>
                      In the next step, our AI Stock Balancing engine will analyze proximity, FEFO
                      expiration vulnerability, and current stock safety buffers to recommend optimal
                      source facilities.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: System Suggests Ranked Sources */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-text">
                        Ranked Fulfillment Facilities
                      </h3>
                      <p className="text-xs text-muted">
                        Evaluated for {selectedProduct.name} ({wizardQuantity} units needed at{' '}
                        {wizardDestination})
                      </p>
                    </div>
                    <Chip label="AI Recommendation" tone="info" />
                  </div>

                  <div className="space-y-3">
                    {rankedSources.map((source, idx) => {
                      const isSelected = selectedSourceId === source.id
                      return (
                        <div
                          key={source.id}
                          onClick={() => setSelectedSourceId(source.id)}
                          className={cn(
                            'flex flex-col sm:flex-row sm:items-center justify-between rounded-[10px] border p-4 transition-all cursor-pointer gap-3',
                            isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                              : 'border-border bg-surface hover:bg-app/50',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                idx === 0
                                  ? 'bg-primary text-white'
                                  : 'bg-muted/20 text-muted',
                              )}
                            >
                              #{idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-text">{source.location}</h4>
                                <Chip label={source.badgeLabel} tone={source.badgeTone} />
                              </div>
                              <p className="mt-1 text-xs text-muted">{source.rationale}</p>
                              <div className="mt-2 flex items-center gap-4 text-xs font-medium text-text">
                                <span className="flex items-center gap-1 text-muted">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {source.distanceKm} km away
                                </span>
                                <span className="flex items-center gap-1 text-muted">
                                  <Boxes className="h-3.5 w-3.5" />
                                  {source.available} units in stock
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSourceId(source.id)
                              }}
                              className={cn(
                                'rounded-[8px] px-3.5 py-1.5 text-xs font-semibold transition-colors',
                                isSelected
                                  ? 'bg-primary text-white shadow-xs'
                                  : 'border border-border text-text hover:bg-app',
                              )}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: FEFO Batch Selection */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-text">
                        FEFO Batch Allocation ({currentSource?.location})
                      </h3>
                      <p className="text-xs text-muted">
                        First-Expired, First-Out compliance. Target: {wizardQuantity} units.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleAutoFillFEFO}
                      className="h-8 text-xs font-medium"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary mr-1" />
                      Auto-fill FEFO
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-[8px] border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-app text-xs uppercase text-muted">
                        <tr>
                          <th className="px-4 py-2.5">Batch ID</th>
                          <th className="px-4 py-2.5">Expiry Date</th>
                          <th className="px-4 py-2.5">Shelf Life</th>
                          <th className="px-4 py-2.5">Available</th>
                          <th className="px-4 py-2.5 text-right">Pick Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-surface">
                        {wizardBatches.map((batch) => {
                          const currentQty = batchAllocations[batch.batchId] || 0
                          return (
                            <tr key={batch.batchId} className="hover:bg-app/40">
                              <td className="px-4 py-3 font-mono font-medium text-text">
                                <div className="flex items-center gap-1.5">
                                  {batch.batchId}
                                  {batch.fefoRank === 1 && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                      Earliest
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted">{batch.expiry}</td>
                              <td className="px-4 py-3">
                                <Chip
                                  label={`${batch.daysLeft}d left`}
                                  tone={
                                    batch.daysLeft <= 15
                                      ? 'expired'
                                      : batch.daysLeft <= 60
                                        ? 'warning'
                                        : 'good'
                                  }
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-text font-medium">
                                {batch.availableQty} units
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  max={batch.availableQty}
                                  value={currentQty}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      0,
                                      Math.min(
                                        batch.availableQty,
                                        parseInt(e.target.value) || 0,
                                      ),
                                    )
                                    setBatchAllocations((prev) => ({
                                      ...prev,
                                      [batch.batchId]: val,
                                    }))
                                  }}
                                  className="h-8 w-24 rounded-[6px] border border-border px-2 text-right text-sm font-semibold text-text focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Allocation Status Indicator */}
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-[8px] p-3 text-xs font-medium border',
                      totalAllocated === wizardQuantity
                        ? 'border-green-300 bg-green-50 text-green-900'
                        : 'border-amber-300 bg-amber-50 text-amber-900',
                    )}
                  >
                    <span>
                      Total Allocated: <strong>{totalAllocated}</strong> of{' '}
                      <strong>{wizardQuantity}</strong> units
                    </span>
                    {totalAllocated === wizardQuantity ? (
                      <span className="flex items-center gap-1 font-bold text-green-700">
                        <Check className="h-4 w-4" /> Perfect Match
                      </span>
                    ) : (
                      <span>
                        {totalAllocated < wizardQuantity
                          ? `${wizardQuantity - totalAllocated} units remaining to allocate`
                          : `${totalAllocated - wizardQuantity} units over-allocated`}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Confirm */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-[10px] border border-border bg-app/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Product Requested
                        </span>
                        <h4 className="text-base font-bold text-text">{selectedProduct.name}</h4>
                        <p className="font-mono text-xs text-muted">{selectedProduct.id}</p>
                      </div>
                      <div className="text-right">
                        <Chip
                          label={wizardUrgency === 'critical' ? 'Critical' : 'Normal'}
                          tone={wizardUrgency === 'critical' ? 'expired' : 'neutral'}
                        />
                        <p className="mt-1 text-sm font-bold text-text">
                          Total: {wizardQuantity} units
                        </p>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="mt-3 flex items-center justify-between text-sm py-2">
                      <div>
                        <span className="text-xs text-muted block">Source Facility</span>
                        <span className="font-semibold text-text">{currentSource?.location}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted" />
                      <div className="text-right">
                        <span className="text-xs text-muted block">Destination Facility</span>
                        <span className="font-semibold text-text">{wizardDestination}</span>
                      </div>
                    </div>

                    {/* Reason */}
                    {wizardReason && (
                      <div className="mt-3 border-t border-border/80 pt-2 text-xs">
                        <span className="text-muted">Reason:</span>{' '}
                        <span className="font-medium text-text">{wizardReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Allocated Batches Breakdown */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                      FEFO Batches Scheduled for Pick
                    </h4>
                    <div className="overflow-hidden rounded-[8px] border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-app text-muted">
                          <tr>
                            <th className="px-3 py-2">Batch ID</th>
                            <th className="px-3 py-2">Expiry</th>
                            <th className="px-3 py-2">Shelf Life</th>
                            <th className="px-3 py-2 text-right">Units</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-surface">
                          {Object.entries(batchAllocations)
                            .filter(([_, qty]) => qty > 0)
                            .map(([bId, qty]) => {
                              const b = wizardBatches.find((item) => item.batchId === bId)
                              return (
                                <tr key={bId}>
                                  <td className="px-3 py-2 font-mono font-bold text-text">
                                    {bId}
                                  </td>
                                  <td className="px-3 py-2 text-muted">{b?.expiry}</td>
                                  <td className="px-3 py-2">
                                    <Chip label={`${b?.daysLeft}d`} tone="warning" />
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-text">
                                    {qty} units
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Dispatch SLA */}
                  <div className="rounded-[8px] border border-green-200 bg-green-50/70 p-3 text-xs text-green-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-green-700" />
                      Estimated dispatch SLA: <strong>~30 minutes</strong> via Dedicated Courier
                    </span>
                    <span className="font-semibold">Route Ready</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer: Back and Next / Confirm buttons */}
            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              {wizardStep > 1 ? (
                <Button
                  variant="secondary"
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                >
                  Back
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setIsWizardOpen(false)}>
                  Cancel
                </Button>
              )}

              {wizardStep < 4 ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    if (wizardStep === 3 && totalAllocated !== wizardQuantity) {
                      toast(
                        `Allocated total (${totalAllocated}) must equal requested units (${wizardQuantity})`,
                        'error',
                      )
                      return
                    }
                    setWizardStep((prev) => (prev + 1) as any)
                  }}
                  disabled={wizardStep === 3 && totalAllocated !== wizardQuantity}
                >
                  Next Step →
                </Button>
              ) : (
                <Button variant="primary" onClick={handleCreateTransferSubmit}>
                  Submit Transfer Request
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
