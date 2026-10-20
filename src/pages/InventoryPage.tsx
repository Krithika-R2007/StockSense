import { useMemo, useState, useEffect } from 'react'
import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  AlertTriangle,
  ArrowRightLeft,
  Trash2,
  Package,
  Layers,
  Calendar,
  Check,
  X,
  TrendingDown,
  Clock,
  DollarSign,
  Pill,
  Droplets,
  ShieldCheck,
  HeartPulse,
  Activity,
  Stethoscope,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'
import { receiveStock, adjustStock } from '../api/endpoints'

export type InventoryBatch = {
  batch: string
  expiry: string
  qty: number
  daysLeft: number
  mfgDate?: string
}

export type InventoryItem = {
  id: string
  product: string
  sku: string
  category: 'Pharma' | 'PPE' | 'Fluids' | 'Wound Care' | 'Diagnostics' | 'Medical Devices'
  location: 'Main Warehouse' | 'Branch A' | 'Branch B' | 'Cold Storage'
  batch: string
  onHand: number
  reserved: number
  available: number
  reorderPt: number
  expiryDays: number
  unitCost: number
  batches: InventoryBatch[]
}

const ALL_LOCATIONS: Array<InventoryItem['location']> = [
  'Main Warehouse',
  'Branch A',
  'Branch B',
  'Cold Storage',
]

const CATEGORY_COLORS: Record<string, string> = {
  Pharma: '#8B5CF6',
  PPE: '#2563EB',
  Fluids: '#06B6D4',
  'Wound Care': '#F59E0B',
  Diagnostics: '#10B981',
  'Medical Devices': '#6366F1',
}

const CATEGORY_BG_COLORS: Record<string, { bg: string; text: string }> = {
  Pharma: { bg: 'bg-purple-100', text: 'text-purple-700' },
  PPE: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Fluids: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'Wound Care': { bg: 'bg-amber-100', text: 'text-amber-700' },
  Diagnostics: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Medical Devices': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'Pharma':
      return <Pill className="h-4 w-4" />
    case 'PPE':
      return <ShieldCheck className="h-4 w-4" />
    case 'Fluids':
      return <Droplets className="h-4 w-4" />
    case 'Wound Care':
      return <HeartPulse className="h-4 w-4" />
    case 'Diagnostics':
      return <Activity className="h-4 w-4" />
    case 'Medical Devices':
      return <Stethoscope className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

function getExpiryBadge(daysLeft: number): {
  label: string
  tone: 'good' | 'warning' | 'critical' | 'expired' | 'neutral'
} {
  if (daysLeft < 0) {
    return { label: 'Expired', tone: 'neutral' }
  }
  if (daysLeft < 7) {
    return { label: '<7d', tone: 'expired' }
  }
  if (daysLeft <= 30) {
    return { label: '7-30d', tone: 'critical' }
  }
  if (daysLeft <= 90) {
    return { label: '30-90d', tone: 'warning' }
  }
  return { label: '>90d', tone: 'good' }
}

const INITIAL_INVENTORY_DATA: InventoryItem[] = [
  {
    id: 'inv-1',
    product: 'IV Saline 0.9% 500ml',
    sku: 'SKU-2088',
    category: 'Fluids',
    location: 'Cold Storage',
    batch: 'B-9012',
    onHand: 120,
    reserved: 20,
    available: 100,
    reorderPt: 100,
    expiryDays: 45,
    unitCost: 8.5,
    batches: [
      { batch: 'B-9012', expiry: '2026-12-02', daysLeft: 45, qty: 80, mfgDate: '2025-10-10' },
      { batch: 'B-9080', expiry: '2027-04-10', daysLeft: 174, qty: 40, mfgDate: '2026-02-15' },
    ],
  },
  {
    id: 'inv-2',
    product: 'Surgical Gloves Nitrile (L)',
    sku: 'SKU-1042',
    category: 'PPE',
    location: 'Main Warehouse',
    batch: 'B-7701',
    onHand: 550,
    reserved: 50,
    available: 500,
    reorderPt: 200,
    expiryDays: 580,
    unitCost: 14.0,
    batches: [
      { batch: 'B-7701', expiry: '2028-05-20', daysLeft: 580, qty: 350, mfgDate: '2025-05-20' },
      { batch: 'B-7702', expiry: '2028-11-15', daysLeft: 759, qty: 200, mfgDate: '2025-11-15' },
    ],
  },
  {
    id: 'inv-3',
    product: 'Insulin Glargine 100U/ml',
    sku: 'SKU-4401',
    category: 'Pharma',
    location: 'Cold Storage',
    batch: 'B-8844',
    onHand: 24,
    reserved: 8,
    available: 16,
    reorderPt: 30,
    expiryDays: 4,
    unitCost: 48.0,
    batches: [
      { batch: 'B-8844', expiry: '2026-10-22', daysLeft: 4, qty: 10, mfgDate: '2024-10-22' },
      { batch: 'B-8850', expiry: '2026-11-12', daysLeft: 25, qty: 14, mfgDate: '2024-11-12' },
    ],
  },
  {
    id: 'inv-4',
    product: 'Bandage Roll Elastic 4"',
    sku: 'SKU-3310',
    category: 'Wound Care',
    location: 'Branch B',
    batch: 'B-5520',
    onHand: 45,
    reserved: 15,
    available: 30,
    reorderPt: 50,
    expiryDays: 22,
    unitCost: 3.5,
    batches: [
      { batch: 'B-5520', expiry: '2026-11-09', daysLeft: 22, qty: 30, mfgDate: '2025-01-10' },
      { batch: 'B-5522', expiry: '2027-03-15', daysLeft: 148, qty: 15, mfgDate: '2025-05-15' },
    ],
  },
  {
    id: 'inv-5',
    product: 'N95 Particulate Respirator',
    sku: 'SKU-1199',
    category: 'PPE',
    location: 'Main Warehouse',
    batch: 'B-3312',
    onHand: 890,
    reserved: 90,
    available: 800,
    reorderPt: 300,
    expiryDays: 420,
    unitCost: 22.5,
    batches: [
      { batch: 'B-3312', expiry: '2027-12-12', daysLeft: 420, qty: 500, mfgDate: '2025-12-12' },
      { batch: 'B-3319', expiry: '2028-04-18', daysLeft: 547, qty: 390, mfgDate: '2026-01-18' },
    ],
  },
  {
    id: 'inv-6',
    product: 'Propofol 10mg/ml Injectable',
    sku: 'SKU-9902',
    category: 'Pharma',
    location: 'Cold Storage',
    batch: 'B-1002',
    onHand: 15,
    reserved: 5,
    available: 10,
    reorderPt: 25,
    expiryDays: -3,
    unitCost: 34.0,
    batches: [
      { batch: 'B-1002', expiry: '2026-10-15', daysLeft: -3, qty: 6, mfgDate: '2024-10-15' },
      { batch: 'B-1008', expiry: '2026-12-10', daysLeft: 53, qty: 9, mfgDate: '2024-12-10' },
    ],
  },
  {
    id: 'inv-7',
    product: 'Blood Glucose Test Strips',
    sku: 'SKU-6120',
    category: 'Diagnostics',
    location: 'Branch A',
    batch: 'B-6041',
    onHand: 320,
    reserved: 40,
    available: 280,
    reorderPt: 120,
    expiryDays: 75,
    unitCost: 16.5,
    batches: [
      { batch: 'B-6041', expiry: '2027-01-01', daysLeft: 75, qty: 170, mfgDate: '2025-07-01' },
      { batch: 'B-6045', expiry: '2027-06-14', daysLeft: 239, qty: 150, mfgDate: '2025-12-14' },
    ],
  },
  {
    id: 'inv-8',
    product: 'Microdrip Infusion Set',
    sku: 'SKU-7754',
    category: 'Medical Devices',
    location: 'Main Warehouse',
    batch: 'B-4190',
    onHand: 210,
    reserved: 30,
    available: 180,
    reorderPt: 80,
    expiryDays: 145,
    unitCost: 15.0,
    batches: [
      { batch: 'B-4190', expiry: '2027-03-12', daysLeft: 145, qty: 120, mfgDate: '2025-09-12' },
      { batch: 'B-4198', expiry: '2027-08-20', daysLeft: 306, qty: 90, mfgDate: '2026-02-20' },
    ],
  },
  {
    id: 'inv-9',
    product: 'Amoxicillin 500mg Capsules',
    sku: 'SKU-5201',
    category: 'Pharma',
    location: 'Branch A',
    batch: 'B-7301',
    onHand: 65,
    reserved: 15,
    available: 50,
    reorderPt: 60,
    expiryDays: 18,
    unitCost: 9.2,
    batches: [
      { batch: 'B-7301', expiry: '2026-11-05', daysLeft: 18, qty: 35, mfgDate: '2024-11-05' },
      { batch: 'B-7309', expiry: '2027-02-18', daysLeft: 123, qty: 30, mfgDate: '2025-02-18' },
    ],
  },
  {
    id: 'inv-10',
    product: 'Sterile Gauze Pads 4x4',
    sku: 'SKU-3820',
    category: 'Wound Care',
    location: 'Branch B',
    batch: 'B-8110',
    onHand: 18,
    reserved: 6,
    available: 12,
    reorderPt: 30,
    expiryDays: 5,
    unitCost: 6.0,
    batches: [
      { batch: 'B-8110', expiry: '2026-10-23', daysLeft: 5, qty: 8, mfgDate: '2024-10-23' },
      { batch: 'B-8115', expiry: '2026-12-05', daysLeft: 48, qty: 10, mfgDate: '2024-12-05' },
    ],
  },
  {
    id: 'inv-11',
    product: 'Epinephrine Auto-Injector 0.3mg',
    sku: 'SKU-8402',
    category: 'Pharma',
    location: 'Cold Storage',
    batch: 'B-2910',
    onHand: 42,
    reserved: 12,
    available: 30,
    reorderPt: 25,
    expiryDays: 82,
    unitCost: 110.0,
    batches: [
      { batch: 'B-2910', expiry: '2027-01-08', daysLeft: 82, qty: 22, mfgDate: '2025-07-08' },
      { batch: 'B-2915', expiry: '2027-05-14', daysLeft: 208, qty: 20, mfgDate: '2025-11-14' },
    ],
  },
  {
    id: 'inv-12',
    product: 'Digital Thermometer Covers',
    sku: 'SKU-9214',
    category: 'Medical Devices',
    location: 'Main Warehouse',
    batch: 'B-3015',
    onHand: 640,
    reserved: 40,
    available: 600,
    reorderPt: 150,
    expiryDays: 720,
    unitCost: 4.5,
    batches: [
      { batch: 'B-3015', expiry: '2028-10-10', daysLeft: 720, qty: 400, mfgDate: '2025-10-10' },
      { batch: 'B-3020', expiry: '2029-01-15', daysLeft: 817, qty: 240, mfgDate: '2026-01-15' },
    ],
  },
  {
    id: 'inv-13',
    product: 'Rapid Strep A Test Kit',
    sku: 'SKU-6490',
    category: 'Diagnostics',
    location: 'Branch A',
    batch: 'B-5012',
    onHand: 38,
    reserved: 10,
    available: 28,
    reorderPt: 40,
    expiryDays: 14,
    unitCost: 42.0,
    batches: [
      { batch: 'B-5012', expiry: '2026-11-01', daysLeft: 14, qty: 18, mfgDate: '2025-05-01' },
      { batch: 'B-5018', expiry: '2027-03-22', daysLeft: 155, qty: 20, mfgDate: '2025-09-22' },
    ],
  },
  {
    id: 'inv-14',
    product: 'Ceftriaxone 1g Injection',
    sku: 'SKU-4882',
    category: 'Pharma',
    location: 'Main Warehouse',
    batch: 'B-7789',
    onHand: 110,
    reserved: 25,
    available: 85,
    reorderPt: 80,
    expiryDays: 210,
    unitCost: 18.5,
    batches: [
      { batch: 'B-7789', expiry: '2027-05-16', daysLeft: 210, qty: 65, mfgDate: '2025-11-16' },
      { batch: 'B-7792', expiry: '2027-09-20', daysLeft: 337, qty: 45, mfgDate: '2026-03-20' },
    ],
  },
  {
    id: 'inv-15',
    product: 'Surgical Face Masks 3-Ply',
    sku: 'SKU-1105',
    category: 'PPE',
    location: 'Branch B',
    batch: 'B-6621',
    onHand: 450,
    reserved: 50,
    available: 400,
    reorderPt: 100,
    expiryDays: 365,
    unitCost: 7.5,
    batches: [
      { batch: 'B-6621', expiry: '2027-10-18', daysLeft: 365, qty: 250, mfgDate: '2025-10-18' },
      { batch: 'B-6629', expiry: '2028-02-10', daysLeft: 480, qty: 200, mfgDate: '2026-02-10' },
    ],
  },
  {
    id: 'inv-16',
    product: 'Heparin Sodium 5000U/ml',
    sku: 'SKU-8321',
    category: 'Pharma',
    location: 'Cold Storage',
    batch: 'B-9114',
    onHand: 28,
    reserved: 10,
    available: 18,
    reorderPt: 25,
    expiryDays: 2,
    unitCost: 26.0,
    batches: [
      { batch: 'B-9114', expiry: '2026-10-20', daysLeft: 2, qty: 12, mfgDate: '2024-10-20' },
      { batch: 'B-9120', expiry: '2026-12-15', daysLeft: 58, qty: 16, mfgDate: '2024-12-15' },
    ],
  },
  {
    id: 'inv-17',
    product: 'Povidone Iodine Prep 16oz',
    sku: 'SKU-3904',
    category: 'Wound Care',
    location: 'Main Warehouse',
    batch: 'B-4422',
    onHand: 95,
    reserved: 15,
    available: 80,
    reorderPt: 50,
    expiryDays: 65,
    unitCost: 8.9,
    batches: [
      { batch: 'B-4422', expiry: '2026-12-22', daysLeft: 65, qty: 55, mfgDate: '2025-06-22' },
      { batch: 'B-4428', expiry: '2027-04-30', daysLeft: 194, qty: 40, mfgDate: '2025-10-30' },
    ],
  },
  {
    id: 'inv-18',
    product: 'Urine Reagent Test Strips',
    sku: 'SKU-6780',
    category: 'Diagnostics',
    location: 'Branch B',
    batch: 'B-2201',
    onHand: 12,
    reserved: 2,
    available: 10,
    reorderPt: 20,
    expiryDays: -8,
    unitCost: 19.0,
    batches: [
      { batch: 'B-2201', expiry: '2026-10-10', daysLeft: -8, qty: 8, mfgDate: '2024-10-10' },
      { batch: 'B-2209', expiry: '2026-11-28', daysLeft: 41, qty: 4, mfgDate: '2024-11-28' },
    ],
  },
]

export function InventoryPage() {
  const { toast } = useToast()

  // State
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(
    new Set(ALL_LOCATIONS),
  )
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [onlyExpiring, setOnlyExpiring] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Modals state
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [receiveStep, setReceiveStep] = useState<1 | 2 | 3>(1)
  const [receiveForm, setReceiveForm] = useState({
    productId: '',
    productName: '',
    category: 'Pharma' as InventoryItem['category'],
    sku: '',
    location: 'Main Warehouse' as InventoryItem['location'],
    batch: '',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    quantity: 100,
    unitCost: 15.0,
  })

  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustForm, setAdjustForm] = useState({
    itemId: '',
    product: '',
    location: '',
    batch: '',
    currentQty: 0,
    newQty: 0,
    reason: '',
    notes: '',
  })

  // Action dialogs for batch sub-rows
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<{
    itemId: string
    product: string
    fromLocation: string
    batch: string
    maxQty: number
    targetLocation: InventoryItem['location']
    qty: number
  } | null>(null)

  const [writeoffModalOpen, setWriteoffModalOpen] = useState(false)
  const [writeoffTarget, setWriteoffTarget] = useState<{
    itemId: string
    product: string
    batch: string
    maxQty: number
    qty: number
    reason: string
  } | null>(null)

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  // Toggle Row Expansion
  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Location filter handler
  function toggleLocation(loc: string) {
    setSelectedLocations((prev) => {
      const next = new Set(prev)
      if (next.has(loc)) {
        if (next.size > 1) {
          next.delete(loc)
        } else {
          toast('At least one location must remain selected', 'warning')
        }
      } else {
        next.add(loc)
      }
      return next
    })
  }

  function selectAllLocations() {
    setSelectedLocations(new Set(ALL_LOCATIONS))
  }

  // Filtered rows
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedLocations.size > 0 && !selectedLocations.has(item.location)) {
        return false
      }
      if (onlyLowStock && item.available > item.reorderPt) {
        return false
      }
      if (onlyExpiring && item.expiryDays > 90) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesProduct = item.product.toLowerCase().includes(query)
        const matchesSku = item.sku.toLowerCase().includes(query)
        const matchesBatch = item.batch.toLowerCase().includes(query)
        const matchesCategory = item.category.toLowerCase().includes(query)
        if (!matchesProduct && !matchesSku && !matchesBatch && !matchesCategory) {
          return false
        }
      }
      return true
    })
  }, [items, selectedLocations, onlyLowStock, onlyExpiring, searchQuery])

  // Donut chart category data
  const categoryChartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {}
    filteredItems.forEach((item) => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.onHand
    })
    const totalQty = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0)

    return Object.entries(categoryTotals).map(([cat, qty]) => ({
      name: cat,
      value: qty,
      percentage: totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0,
      color: CATEGORY_COLORS[cat] || '#64748B',
    }))
  }, [filteredItems])

  // Summary stats
  const summaryStats = useMemo(() => {
    let totalUnits = 0
    let totalVal = 0
    let belowReorderCount = 0
    let expiring30DaysCount = 0
    let reservedUnits = 0

    filteredItems.forEach((item) => {
      totalUnits += item.onHand
      totalVal += item.onHand * item.unitCost
      if (item.available <= item.reorderPt) {
        belowReorderCount += 1
      }
      if (item.expiryDays <= 30) {
        expiring30DaysCount += 1
      }
      reservedUnits += item.reserved
    })

    return {
      totalItems: totalUnits,
      skuCount: filteredItems.length,
      totalValue: totalVal,
      itemsBelowReorder: belowReorderCount,
      expiringSoon: expiring30DaysCount,
      totalReserved: reservedUnits,
    }
  }, [filteredItems])

  // Helper to open Adjust Stock modal with prefilled data
  function openAdjustStock(item?: InventoryItem, preselectedBatch?: string) {
    const targetItem = item || filteredItems[0] || items[0]
    if (!targetItem) {
      toast('No inventory items to adjust', 'warning')
      return
    }
    const batchObj =
      targetItem.batches.find((b) => b.batch === preselectedBatch) ||
      targetItem.batches[0]

    setAdjustForm({
      itemId: targetItem.id,
      product: targetItem.product,
      location: targetItem.location,
      batch: batchObj?.batch || targetItem.batch,
      currentQty: batchObj?.qty ?? targetItem.onHand,
      newQty: batchObj?.qty ?? targetItem.onHand,
      reason: '',
      notes: '',
    })
    setAdjustModalOpen(true)
  }

  // Adjust Stock Submit
  async function handleAdjustStockSubmit() {
    if (!adjustForm.reason) return

    try {
      await adjustStock({
        itemId: adjustForm.itemId,
        product: adjustForm.product,
        batch: adjustForm.batch,
        location: adjustForm.location,
        oldQty: adjustForm.currentQty,
        newQty: adjustForm.newQty,
        reason: adjustForm.reason,
        notes: adjustForm.notes,
      })

      const diff = adjustForm.newQty - adjustForm.currentQty

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== adjustForm.itemId) return item
          const updatedBatches = item.batches.map((b) => {
            if (b.batch === adjustForm.batch) {
              return { ...b, qty: adjustForm.newQty }
            }
            return b
          })
          const newOnHand = Math.max(0, item.onHand + diff)
          const newAvailable = Math.max(0, newOnHand - item.reserved)
          return {
            ...item,
            onHand: newOnHand,
            available: newAvailable,
            batches: updatedBatches,
          }
        }),
      )

      toast(
        `Stock adjusted for ${adjustForm.product} (${adjustForm.batch}): ${adjustForm.currentQty} → ${adjustForm.newQty} [${adjustForm.reason}]`,
        'success',
      )
      setAdjustModalOpen(false)
    } catch {
      toast('Failed to record stock adjustment', 'error')
    }
  }

  // Open Receive Stock Wizard
  function openReceiveStock(prefillProduct?: InventoryItem) {
    const baseItem = prefillProduct || filteredItems[0] || items[0]
    const randomBatchNum = Math.floor(1000 + Math.random() * 9000)
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 2)

    setReceiveForm({
      productId: baseItem?.id || 'new-product',
      productName: baseItem?.product || 'Medical Grade Normal Saline 500ml',
      category: baseItem?.category || 'Fluids',
      sku: baseItem?.sku || 'SKU-7721',
      location: baseItem?.location || 'Main Warehouse',
      batch: `BAT-2026-${randomBatchNum}`,
      mfgDate: new Date().toISOString().split('T')[0],
      expiryDate: nextYear.toISOString().split('T')[0],
      quantity: 150,
      unitCost: baseItem?.unitCost || 12.5,
    })
    setReceiveStep(1)
    setReceiveModalOpen(true)
  }

  // Confirm Receive Stock Wizard
  async function handleConfirmReceive() {
    try {
      const expDate = new Date(receiveForm.expiryDate)
      const now = new Date()
      const diffDays = Math.ceil(
        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )

      await receiveStock({
        product: receiveForm.productName,
        sku: receiveForm.sku,
        category: receiveForm.category,
        location: receiveForm.location,
        batch: receiveForm.batch,
        mfgDate: receiveForm.mfgDate,
        expiryDate: receiveForm.expiryDate,
        quantity: receiveForm.quantity,
        unitCost: receiveForm.unitCost,
      })

      // Update state
      setItems((prev) => {
        const existingIdx = prev.findIndex(
          (p) =>
            p.product.toLowerCase() === receiveForm.productName.toLowerCase() &&
            p.location === receiveForm.location,
        )

        const newBatchObj: InventoryBatch = {
          batch: receiveForm.batch,
          expiry: receiveForm.expiryDate,
          qty: receiveForm.quantity,
          daysLeft: diffDays,
          mfgDate: receiveForm.mfgDate,
        }

        if (existingIdx >= 0) {
          const target = prev[existingIdx]
          const updatedBatches = [newBatchObj, ...target.batches]
          const updatedOnHand = target.onHand + receiveForm.quantity
          const updatedAvailable = updatedOnHand - target.reserved
          const minExpiry = Math.min(target.expiryDays, diffDays)

          const copy = [...prev]
          copy[existingIdx] = {
            ...target,
            onHand: updatedOnHand,
            available: updatedAvailable,
            expiryDays: minExpiry,
            batches: updatedBatches,
          }
          return copy
        } else {
          const newItem: InventoryItem = {
            id: `inv-${Date.now()}`,
            product: receiveForm.productName,
            sku: receiveForm.sku,
            category: receiveForm.category,
            location: receiveForm.location,
            batch: receiveForm.batch,
            onHand: receiveForm.quantity,
            reserved: 0,
            available: receiveForm.quantity,
            reorderPt: Math.round(receiveForm.quantity * 0.3),
            expiryDays: diffDays,
            unitCost: receiveForm.unitCost,
            batches: [newBatchObj],
          }
          return [newItem, ...prev]
        }
      })

      toast(
        `Successfully received ${receiveForm.quantity} units of ${receiveForm.productName} into ${receiveForm.location}`,
        'success',
      )
      setReceiveModalOpen(false)
    } catch {
      toast('Failed to record received stock', 'error')
    }
  }

  // Handle Transfer Batch
  function openTransferModal(item: InventoryItem, batch: InventoryBatch) {
    const otherLoc =
      ALL_LOCATIONS.find((l) => l !== item.location) || 'Branch A'
    setTransferTarget({
      itemId: item.id,
      product: item.product,
      fromLocation: item.location,
      batch: batch.batch,
      maxQty: batch.qty,
      targetLocation: otherLoc,
      qty: Math.min(batch.qty, 20),
    })
    setTransferModalOpen(true)
  }

  function handleConfirmTransfer() {
    if (!transferTarget) return
    const { itemId, batch, qty, targetLocation, product, fromLocation } =
      transferTarget

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const updatedBatches = item.batches
          .map((b) => {
            if (b.batch === batch) {
              return { ...b, qty: Math.max(0, b.qty - qty) }
            }
            return b
          })
          .filter((b) => b.qty > 0)

        const newOnHand = Math.max(0, item.onHand - qty)
        const newAvailable = Math.max(0, newOnHand - item.reserved)

        return {
          ...item,
          onHand: newOnHand,
          available: newAvailable,
          batches: updatedBatches,
        }
      }),
    )

    toast(
      `Transferred ${qty} units of batch ${batch} (${product}) to ${targetLocation}`,
      'success',
    )
    setTransferModalOpen(false)
    setTransferTarget(null)
  }

  // Handle Writeoff Batch
  function openWriteoffModal(item: InventoryItem, batch: InventoryBatch) {
    setWriteoffTarget({
      itemId: item.id,
      product: item.product,
      batch: batch.batch,
      maxQty: batch.qty,
      qty: batch.qty,
      reason: batch.daysLeft < 0 ? 'Expired' : 'Damaged Goods',
    })
    setWriteoffModalOpen(true)
  }

  function handleConfirmWriteoff() {
    if (!writeoffTarget) return
    const { itemId, batch, qty, reason, product } = writeoffTarget

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const updatedBatches = item.batches
          .map((b) => {
            if (b.batch === batch) {
              return { ...b, qty: Math.max(0, b.qty - qty) }
            }
            return b
          })
          .filter((b) => b.qty > 0)

        const newOnHand = Math.max(0, item.onHand - qty)
        const newAvailable = Math.max(0, newOnHand - item.reserved)

        return {
          ...item,
          onHand: newOnHand,
          available: newAvailable,
          batches: updatedBatches,
        }
      }),
    )

    toast(
      `Written off ${qty} units of batch ${batch} (${product}) [Reason: ${reason}]`,
      'warning',
    )
    setWriteoffModalOpen(false)
    setWriteoffTarget(null)
  }

  // Reset all filters
  function resetFilters() {
    setSearchQuery('')
    setSelectedLocations(new Set(ALL_LOCATIONS))
    setOnlyLowStock(false)
    setOnlyExpiring(false)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Inventory Management"
        subtitle="Real-time multi-location stock tracking with automated FEFO batch expiration control"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => openAdjustStock()}
              icon={<SlidersHorizontal className="h-4 w-4" />}
            >
              Adjust Stock
            </Button>
            <Button
              variant="success"
              onClick={() => openReceiveStock()}
              icon={<Plus className="h-4 w-4" />}
            >
              + Receive Stock
            </Button>
          </div>
        }
      />

      {/* Main Split-Pane Layout: Left 60% / Right 40% on lg */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ========================================================= */}
        {/* LEFT PANE (60%)                                          */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[60%] space-y-4">
          {/* Top Control Bar Card */}
          <Card padding className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Product Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search product, SKU, batch, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-8 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Location Multi-Select Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen((prev) => !prev)}
                  className="inline-flex h-10 min-w-[190px] items-center justify-between gap-2 rounded-[8px] border border-border bg-surface px-3 text-sm font-medium text-text hover:bg-app focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="text-muted">Loc:</span>
                    {selectedLocations.size === ALL_LOCATIONS.length
                      ? 'All Locations'
                      : `${selectedLocations.size} selected`}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted transition-transform',
                      locationDropdownOpen && 'rotate-180',
                    )}
                  />
                </button>

                {/* Location Multi-Select Popover */}
                {locationDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setLocationDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-11 z-30 w-64 rounded-[12px] border border-border bg-surface p-3 shadow-lg">
                      <div className="mb-2 flex items-center justify-between border-b border-border pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        <span>Filter by Location</span>
                        <button
                          type="button"
                          onClick={selectAllLocations}
                          className="text-primary hover:underline"
                        >
                          Select All
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {ALL_LOCATIONS.map((loc) => {
                          const checked = selectedLocations.has(loc)
                          const locCount = items.filter(
                            (i) => i.location === loc,
                          ).length
                          return (
                            <label
                              key={loc}
                              className="flex cursor-pointer items-center justify-between rounded-[6px] px-2 py-1.5 text-sm hover:bg-app"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleLocation(loc)}
                                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className={cn('text-sm', checked ? 'font-medium text-text' : 'text-muted')}>
                                  {loc}
                                </span>
                              </div>
                              <span className="rounded-full bg-app px-2 py-0.5 text-xs text-muted">
                                {locCount}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Toggles and Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-2">
                {/* Only Low Stock Toggle */}
                <button
                  type="button"
                  onClick={() => setOnlyLowStock((prev) => !prev)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-xs font-medium transition-colors',
                    onlyLowStock
                      ? 'border-warning bg-amber-50 text-amber-900 shadow-sm'
                      : 'border-border bg-surface text-muted hover:bg-app hover:text-text',
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      'h-3.5 w-3.5',
                      onlyLowStock ? 'text-warning' : 'text-muted',
                    )}
                  />
                  <span>Only Low Stock</span>
                  {summaryStats.itemsBelowReorder > 0 && (
                    <span
                      className={cn(
                        'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                        onlyLowStock
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-app text-muted',
                      )}
                    >
                      {summaryStats.itemsBelowReorder}
                    </span>
                  )}
                </button>

                {/* Only Expiring Toggle */}
                <button
                  type="button"
                  onClick={() => setOnlyExpiring((prev) => !prev)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-xs font-medium transition-colors',
                    onlyExpiring
                      ? 'border-error bg-red-50 text-red-900 shadow-sm'
                      : 'border-border bg-surface text-muted hover:bg-app hover:text-text',
                  )}
                >
                  <Clock
                    className={cn(
                      'h-3.5 w-3.5',
                      onlyExpiring ? 'text-error' : 'text-muted',
                    )}
                  />
                  <span>Only Expiring (&le;90d)</span>
                  {summaryStats.expiringSoon > 0 && (
                    <span
                      className={cn(
                        'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                        onlyExpiring
                          ? 'bg-red-200 text-red-900'
                          : 'bg-app text-muted',
                      )}
                    >
                      {summaryStats.expiringSoon}
                    </span>
                  )}
                </button>

                {(searchQuery ||
                  selectedLocations.size < ALL_LOCATIONS.length ||
                  onlyLowStock ||
                  onlyExpiring) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline px-2 py-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="text-xs text-muted">
                Showing <strong className="text-text">{filteredItems.length}</strong> of{' '}
                {items.length} items
              </div>
            </div>
          </Card>

          {/* Loading Skeleton */}
          {isLoading ? (
            <Card padding={false} className="overflow-hidden">
              <div className="p-4 space-y-4 animate-pulse">
                <div className="h-8 bg-slate-200 rounded-[8px] w-full" />
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-border/50">
                    <div className="h-9 w-9 bg-slate-200 rounded-[8px] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/4" />
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-16" />
                    <div className="h-4 bg-slate-200 rounded w-12" />
                    <div className="h-6 bg-slate-200 rounded-full w-20" />
                  </div>
                ))}
              </div>
            </Card>
          ) : filteredItems.length === 0 ? (
            /* Empty State */
            <Card padding className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app text-muted">
                <Package className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-text">
                No inventory items found
              </h3>
              <p className="mt-1 text-sm text-muted max-w-md mx-auto">
                No items match your active search and filter parameters. Try clearing your
                search keyword or toggling off location filters.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Button variant="secondary" onClick={resetFilters}>
                  Clear All Filters
                </Button>
                <Button
                  variant="success"
                  onClick={() => openReceiveStock()}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Receive New Stock
                </Button>
              </div>
            </Card>
          ) : (
            /* Inventory Table with Row Expansion */
            <Card padding={false} className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="border-b border-border bg-app/80 text-xs font-semibold text-muted uppercase tracking-wider">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center">#</th>
                      <th className="px-3 py-3">Product</th>
                      <th className="px-3 py-3">Location</th>
                      <th className="px-3 py-3">Batch #</th>
                      <th className="px-3 py-3 text-right">On Hand</th>
                      <th className="px-3 py-3 text-right">Reserved</th>
                      <th className="px-3 py-3 text-right">Available</th>
                      <th className="px-3 py-3 text-right">Reorder Pt</th>
                      <th className="px-3 py-3 text-center">Expiry Status</th>
                      <th className="px-3 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredItems.map((item) => {
                      const isExpanded = expandedRows.has(item.id)
                      const isLowStock = item.available <= item.reorderPt
                      const expBadge = getExpiryBadge(item.expiryDays)
                      const catStyle =
                        CATEGORY_BG_COLORS[item.category] || {
                          bg: 'bg-slate-100',
                          text: 'text-slate-700',
                        }

                      // Batches sorted FEFO (First Expiring, First Out: lowest daysLeft first)
                      const sortedBatches = [...item.batches].sort(
                        (a, b) => a.daysLeft - b.daysLeft,
                      )

                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            'group transition-colors',
                            isExpanded ? 'bg-blue-50/20' : 'hover:bg-app/50',
                          )}
                        >
                          <td colSpan={10} className="p-0">
                            {/* Main Row Content */}
                            <div
                              onClick={() => toggleRow(item.id)}
                              className="flex items-center cursor-pointer px-3 py-3 hover:bg-slate-50/80 transition-colors"
                            >
                              {/* Expand Chevron */}
                              <div className="w-10 shrink-0 text-center text-muted">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 mx-auto text-primary" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 mx-auto group-hover:text-text" />
                                )}
                              </div>

                              {/* Product with colored icon */}
                              <div className="min-w-[220px] flex-1 pr-3">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={cn(
                                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] shadow-xs',
                                      catStyle.bg,
                                      catStyle.text,
                                    )}
                                  >
                                    {getCategoryIcon(item.category)}
                                  </div>
                                  <div className="truncate">
                                    <div className="font-semibold text-text truncate group-hover:text-primary">
                                      {item.product}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted">
                                      <span className="font-mono">{item.sku}</span>
                                      <span>•</span>
                                      <span>{item.category}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Location */}
                              <div className="w-32 px-3 text-xs font-medium text-text">
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                                  {item.location}
                                </span>
                              </div>

                              {/* Batch # */}
                              <div className="w-28 px-3 font-mono text-xs text-muted">
                                {item.batch}
                              </div>

                              {/* On Hand */}
                              <div className="w-20 px-3 text-right text-sm text-text font-medium">
                                {item.onHand.toLocaleString()}
                              </div>

                              {/* Reserved */}
                              <div className="w-20 px-3 text-right text-xs text-muted">
                                {item.reserved > 0 ? (
                                  <span className="text-amber-700 font-medium">
                                    {item.reserved}
                                  </span>
                                ) : (
                                  '0'
                                )}
                              </div>

                              {/* Available (BOLD as per spec) */}
                              <div className="w-24 px-3 text-right">
                                <span
                                  className={cn(
                                    'text-sm font-bold',
                                    isLowStock ? 'text-error' : 'text-text',
                                  )}
                                >
                                  {item.available.toLocaleString()}
                                </span>
                                {isLowStock && (
                                  <div className="text-[10px] font-semibold uppercase text-error">
                                    Low Stock
                                  </div>
                                )}
                              </div>

                              {/* Reorder Point */}
                              <div className="w-20 px-3 text-right text-xs text-muted">
                                {item.reorderPt}
                              </div>

                              {/* Expiry Status Chip */}
                              <div className="w-28 px-3 text-center">
                                <Chip
                                  label={expBadge.label}
                                  tone={expBadge.tone}
                                />
                              </div>

                              {/* Action Menu / Buttons */}
                              <div
                                className="w-24 px-3 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    title="Adjust Stock"
                                    onClick={() => openAdjustStock(item)}
                                    className="rounded-[6px] p-1.5 text-muted hover:bg-slate-200 hover:text-text transition-colors"
                                  >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Receive Additional Stock"
                                    onClick={() => openReceiveStock(item)}
                                    className="rounded-[6px] p-1.5 text-success hover:bg-green-100 transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Inline FEFO Sub-Rows */}
                            {isExpanded && (
                              <div className="border-t border-border/80 bg-slate-50/80 px-6 py-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-semibold text-text">
                                      FEFO Active Batches (Nearest Expiry First)
                                    </span>
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                      {sortedBatches.length} {sortedBatches.length === 1 ? 'batch' : 'batches'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted">
                                    Unit valuation: ${(item.unitCost).toFixed(2)}
                                  </span>
                                </div>

                                <div className="overflow-hidden rounded-[8px] border border-border bg-surface">
                                  <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border bg-app text-muted font-medium">
                                      <tr>
                                        <th className="px-3 py-2">Batch #</th>
                                        <th className="px-3 py-2">Expiry Date & Lifespan</th>
                                        <th className="px-3 py-2 text-right">Batch Qty</th>
                                        <th className="px-3 py-2 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                      {sortedBatches.map((batch) => {
                                        const batchExpBadge = getExpiryBadge(batch.daysLeft)
                                        return (
                                          <tr
                                            key={batch.batch}
                                            className="hover:bg-app/40 transition-colors"
                                          >
                                            <td className="px-3 py-2 font-mono font-medium text-text">
                                              {batch.batch}
                                              {batch.mfgDate && (
                                                <span className="ml-2 font-sans text-[11px] text-muted">
                                                  (Mfg: {batch.mfgDate})
                                                </span>
                                              )}
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium text-text">
                                                  {batch.expiry}
                                                </span>
                                                <Chip
                                                  label={
                                                    batch.daysLeft < 0
                                                      ? `Expired ${Math.abs(batch.daysLeft)}d ago`
                                                      : `${batch.daysLeft}d left`
                                                  }
                                                  tone={batchExpBadge.tone}
                                                />
                                              </div>
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-text">
                                              {batch.qty.toLocaleString()} units
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                              <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => openTransferModal(item, batch)}
                                                  className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-surface px-2 py-1 text-xs font-medium text-text hover:bg-app hover:text-primary transition-colors"
                                                >
                                                  <ArrowRightLeft className="h-3 w-3" />
                                                  Transfer
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => openWriteoffModal(item, batch)}
                                                  className="inline-flex items-center gap-1 rounded-[6px] border border-red-200 bg-red-50/50 px-2 py-1 text-xs font-medium text-error hover:bg-red-100 transition-colors"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                  Writeoff
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer info */}
              <div className="flex items-center justify-between border-t border-border bg-app/50 px-4 py-2.5 text-xs text-muted">
                <span>
                  Showing {filteredItems.length} products across {selectedLocations.size} locations
                </span>
                <span className="font-medium">
                  FEFO Batch Algorithm Active
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE (40%)                                         */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[40%] space-y-4">
          {/* Card 1: Stock Distribution Donut Chart */}
          <Card
            title="Stock Distribution by Category"
            action={
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {summaryStats.totalItems.toLocaleString()} Total Units
              </span>
            }
          >
            {categoryChartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted">
                No stock data available
              </div>
            ) : (
              <div>
                <div className="relative h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        formatter={(val: any) => [
                          `${Number(val ?? 0).toLocaleString()} units`,
                          'Stock',
                        ]}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Pie
                        data={categoryChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categoryChartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center donut label */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-text">
                      {categoryChartData.length}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                      Categories
                    </span>
                  </div>
                </div>

                {/* Donut Legend Breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  {categoryChartData.map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between rounded-[8px] bg-app/60 px-2.5 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate font-medium text-text">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-semibold text-text">
                        <span>{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Card 2: Summary Stats Card */}
          <Card
            title="Inventory Summary & Health"
            action={
              <Sparkles className="h-4 w-4 text-primary" />
            }
          >
            <div className="space-y-4">
              {/* Primary Stat Tiles */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Units & SKUs */}
                <div className="rounded-[10px] border border-border bg-app/50 p-3">
                  <div className="flex items-center justify-between text-xs text-muted mb-1">
                    <span>Total Inventory</span>
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-xl font-bold text-text">
                    {summaryStats.totalItems.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    Across <span className="font-semibold text-text">{summaryStats.skuCount}</span> SKUs
                  </div>
                </div>

                {/* Total Valuation */}
                <div className="rounded-[10px] border border-border bg-app/50 p-3">
                  <div className="flex items-center justify-between text-xs text-muted mb-1">
                    <span>Total Valuation</span>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-text">
                    ${summaryStats.totalValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    Est. asset replacement cost
                  </div>
                </div>
              </div>

              {/* Critical Alert Metrics */}
              <div className="space-y-2">
                {/* Items Below Reorder */}
                <div
                  className={cn(
                    'flex items-center justify-between rounded-[8px] border p-2.5 text-xs transition-colors',
                    summaryStats.itemsBelowReorder > 0
                      ? 'border-warning/60 bg-amber-50/70 text-amber-900'
                      : 'border-border bg-surface text-muted',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown
                      className={cn(
                        'h-4 w-4',
                        summaryStats.itemsBelowReorder > 0
                          ? 'text-warning'
                          : 'text-muted',
                      )}
                    />
                    <div>
                      <div className="font-semibold">Items Below Reorder Point</div>
                      <div className="text-[11px] opacity-80">
                        Require procurement or transfer
                      </div>
                    </div>
                  </div>
                  <Chip
                    label={`${summaryStats.itemsBelowReorder} SKUs`}
                    tone={summaryStats.itemsBelowReorder > 0 ? 'warning' : 'good'}
                  />
                </div>

                {/* Expiring Within 30 Days */}
                <div
                  className={cn(
                    'flex items-center justify-between rounded-[8px] border p-2.5 text-xs transition-colors',
                    summaryStats.expiringSoon > 0
                      ? 'border-error/60 bg-red-50/70 text-red-900'
                      : 'border-border bg-surface text-muted',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Clock
                      className={cn(
                        'h-4 w-4',
                        summaryStats.expiringSoon > 0 ? 'text-error' : 'text-muted',
                      )}
                    />
                    <div>
                      <div className="font-semibold">Expiring Within 30 Days</div>
                      <div className="text-[11px] opacity-80">
                        FEFO prioritization advised
                      </div>
                    </div>
                  </div>
                  <Chip
                    label={`${summaryStats.expiringSoon} Products`}
                    tone={summaryStats.expiringSoon > 0 ? 'critical' : 'good'}
                  />
                </div>

                {/* Reserved Units */}
                <div className="flex items-center justify-between rounded-[8px] border border-border bg-surface p-2.5 text-xs">
                  <div className="flex items-center gap-2 text-text">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <div>
                      <div className="font-semibold">Reserved Stock Allocated</div>
                      <div className="text-[11px] text-muted">
                        Pending transfer orders or surgical trays
                      </div>
                    </div>
                  </div>
                  <span className="font-semibold text-text">
                    {summaryStats.totalReserved.toLocaleString()} units
                  </span>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-2 border-t border-border flex gap-2">
                <Button
                  variant="secondary"
                  className="w-full text-xs h-9"
                  onClick={() => openReceiveStock()}
                >
                  Receive Stock
                </Button>
                <Button
                  variant="primary"
                  className="w-full text-xs h-9"
                  onClick={() => openAdjustStock()}
                >
                  Adjust Stock
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: RECEIVE STOCK MULTI-STEP WIZARD                  */}
      {/* ========================================================= */}
      {receiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setReceiveModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg rounded-[12px] border border-border bg-surface p-6 shadow-xl"
          >
            {/* Modal Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">Receive Inventory Stock</h2>
                <p className="text-xs text-muted">
                  Multi-step stock receiving workflow with automated batch creation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiveModalOpen(false)}
                className="rounded-[8px] p-1.5 text-muted hover:bg-app hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step Wizard Progress Indicator */}
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              {[
                { step: 1, title: 'Product & Location' },
                { step: 2, title: 'Batch Details' },
                { step: 3, title: 'Review & Confirm' },
              ].map((s) => {
                const isActive = receiveStep === s.step
                const isPassed = receiveStep > s.step
                return (
                  <div key={s.step} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : isPassed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-app text-muted',
                      )}
                    >
                      {isPassed ? <Check className="h-4 w-4" /> : s.step}
                    </div>
                    <span
                      className={cn(
                        'text-xs hidden sm:inline',
                        isActive ? 'font-semibold text-text' : 'text-muted',
                      )}
                    >
                      {s.title}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Step 1: Select Product + Location */}
            {receiveStep === 1 && (
              <div className="space-y-4">
                <label className="flex flex-col gap-1.5 text-left">
                  <span className="text-sm font-medium text-text">Select Product *</span>
                  <select
                    value={receiveForm.productName}
                    onChange={(e) => {
                      const selectedProd = items.find(
                        (i) => i.product === e.target.value,
                      )
                      if (selectedProd) {
                        setReceiveForm((prev) => ({
                          ...prev,
                          productId: selectedProd.id,
                          productName: selectedProd.product,
                          category: selectedProd.category,
                          sku: selectedProd.sku,
                          unitCost: selectedProd.unitCost,
                        }))
                      } else {
                        setReceiveForm((prev) => ({
                          ...prev,
                          productName: e.target.value,
                        }))
                      }
                    }}
                    className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.product}>
                        {i.product} ({i.sku} - {i.category})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-left">
                    <span className="text-sm font-medium text-text">SKU Code</span>
                    <input
                      type="text"
                      value={receiveForm.sku}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({ ...prev, sku: e.target.value }))
                      }
                      className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-left">
                    <span className="text-sm font-medium text-text">Category</span>
                    <select
                      value={receiveForm.category}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({
                          ...prev,
                          category: e.target.value as InventoryItem['category'],
                        }))
                      }
                      className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                    >
                      <option value="Pharma">Pharma</option>
                      <option value="PPE">PPE</option>
                      <option value="Fluids">Fluids</option>
                      <option value="Wound Care">Wound Care</option>
                      <option value="Diagnostics">Diagnostics</option>
                      <option value="Medical Devices">Medical Devices</option>
                    </select>
                  </label>
                </div>

                <label className="flex flex-col gap-1.5 text-left">
                  <span className="text-sm font-medium text-text">Destination Location *</span>
                  <select
                    value={receiveForm.location}
                    onChange={(e) =>
                      setReceiveForm((prev) => ({
                        ...prev,
                        location: e.target.value as InventoryItem['location'],
                      }))
                    }
                    className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {ALL_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* Step 2: Batch Details */}
            {receiveStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <label className="flex flex-1 flex-col gap-1.5 text-left">
                    <span className="text-sm font-medium text-text">Batch / Lot Number *</span>
                    <input
                      type="text"
                      value={receiveForm.batch}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({ ...prev, batch: e.target.value }))
                      }
                      placeholder="e.g. BAT-2026-9041"
                      className="h-10 rounded-[8px] border border-border bg-surface px-3 font-mono text-sm text-text outline-none focus:border-primary"
                    />
                  </label>
                  <Button
                    variant="secondary"
                    className="h-10 text-xs shrink-0"
                    onClick={() =>
                      setReceiveForm((prev) => ({
                        ...prev,
                        batch: `BAT-${new Date().getFullYear()}-${Math.floor(
                          1000 + Math.random() * 9000,
                        )}`,
                      }))
                    }
                  >
                    Auto-Generate
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-left">
                    <span className="text-sm font-medium text-text">Manufacture Date</span>
                    <input
                      type="date"
                      value={receiveForm.mfgDate}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({ ...prev, mfgDate: e.target.value }))
                      }
                      className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-left">
                    <span className="text-sm font-medium text-text">Expiry Date *</span>
                    <input
                      type="date"
                      value={receiveForm.expiryDate}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                      }
                      className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-left">
                    <span className="text-sm font-medium text-text">Quantity Received *</span>
                    <input
                      type="number"
                      min="1"
                      value={receiveForm.quantity}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({
                          ...prev,
                          quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                        }))
                      }
                      className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-left">
                    <span className="text-sm font-medium text-text">Unit Cost ($) *</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={receiveForm.unitCost}
                      onChange={(e) =>
                        setReceiveForm((prev) => ({
                          ...prev,
                          unitCost: Math.max(0.01, parseFloat(e.target.value) || 0.01),
                        }))
                      }
                      className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Review Summary */}
            {receiveStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-[10px] border border-border bg-app/50 p-4 space-y-3">
                  <div className="flex items-start justify-between border-b border-border/80 pb-2">
                    <div>
                      <h4 className="font-semibold text-text">{receiveForm.productName}</h4>
                      <p className="text-xs text-muted">
                        SKU: {receiveForm.sku} • Category: {receiveForm.category}
                      </p>
                    </div>
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                      {receiveForm.location}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted block">Batch Number</span>
                      <span className="font-mono font-medium text-text">
                        {receiveForm.batch}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Expiry Date</span>
                      <span className="font-semibold text-text">
                        {receiveForm.expiryDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Units Received</span>
                      <span className="font-bold text-text text-sm">
                        {receiveForm.quantity.toLocaleString()} units
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">Unit Cost</span>
                      <span className="font-semibold text-text">
                        ${receiveForm.unitCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border/80 pt-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-muted">Total Batch Value</span>
                    <span className="text-base font-bold text-emerald-600">
                      ${(receiveForm.quantity * receiveForm.unitCost).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="rounded-[8px] border border-green-200 bg-green-50 p-3 text-xs text-green-900 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-success" />
                  <span>
                    Confirming will automatically register this batch under the FEFO scheduling queue.
                  </span>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  if (receiveStep > 1) {
                    setReceiveStep((prev) => (prev - 1) as 1 | 2)
                  } else {
                    setReceiveModalOpen(false)
                  }
                }}
              >
                {receiveStep === 1 ? 'Cancel' : 'Back'}
              </Button>

              <div className="flex gap-2">
                {receiveStep < 3 ? (
                  <Button
                    variant="primary"
                    disabled={
                      (receiveStep === 1 && !receiveForm.productName) ||
                      (receiveStep === 2 &&
                        (!receiveForm.batch ||
                          !receiveForm.expiryDate ||
                          receiveForm.quantity <= 0))
                    }
                    onClick={() => setReceiveStep((prev) => (prev + 1) as 2 | 3)}
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button variant="success" onClick={handleConfirmReceive}>
                    Confirm &amp; Receive Stock
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADJUST STOCK MODAL                               */}
      {/* ========================================================= */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setAdjustModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-[12px] border border-border bg-surface p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">Adjust Stock Quantity</h2>
                <p className="text-xs text-muted">
                  Log inventory corrections, writeoffs, or verified discrepancies
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="rounded-[8px] p-1.5 text-muted hover:bg-app hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product */}
              <label className="flex flex-col gap-1.5 text-left">
                <span className="text-xs font-medium text-text">Product</span>
                <select
                  value={adjustForm.product}
                  onChange={(e) => {
                    const sel = items.find((i) => i.product === e.target.value)
                    if (sel) {
                      const firstBatch = sel.batches[0]
                      setAdjustForm((prev) => ({
                        ...prev,
                        itemId: sel.id,
                        product: sel.product,
                        location: sel.location,
                        batch: firstBatch?.batch || sel.batch,
                        currentQty: firstBatch?.qty ?? sel.onHand,
                        newQty: firstBatch?.qty ?? sel.onHand,
                      }))
                    }
                  }}
                  className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.product}>
                      {i.product}
                    </option>
                  ))}
                </select>
              </label>

              {/* Location & Batch */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-left">
                  <span className="text-xs font-medium text-text">Location</span>
                  <input
                    type="text"
                    readOnly
                    value={adjustForm.location}
                    className="h-10 rounded-[8px] border border-border bg-app px-3 text-sm text-muted outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-left">
                  <span className="text-xs font-medium text-text">Batch #</span>
                  <select
                    value={adjustForm.batch}
                    onChange={(e) => {
                      const selItem = items.find((i) => i.id === adjustForm.itemId)
                      const b = selItem?.batches.find((b) => b.batch === e.target.value)
                      setAdjustForm((prev) => ({
                        ...prev,
                        batch: e.target.value,
                        currentQty: b?.qty ?? prev.currentQty,
                        newQty: b?.qty ?? prev.newQty,
                      }))
                    }}
                    className="h-10 rounded-[8px] border border-border bg-surface px-3 font-mono text-sm text-text outline-none focus:border-primary"
                  >
                    {items
                      .find((i) => i.id === adjustForm.itemId)
                      ?.batches.map((b) => (
                        <option key={b.batch} value={b.batch}>
                          {b.batch} ({b.qty} units)
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              {/* Current Qty (Read-Only) & New Qty */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-left">
                  <span className="text-xs font-medium text-text">Current Qty (Read-only)</span>
                  <input
                    type="number"
                    readOnly
                    value={adjustForm.currentQty}
                    className="h-10 rounded-[8px] border border-border bg-app px-3 text-sm font-semibold text-muted outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-left">
                  <span className="text-xs font-medium text-text">New Qty *</span>
                  <input
                    type="number"
                    min="0"
                    value={adjustForm.newQty}
                    onChange={(e) =>
                      setAdjustForm((prev) => ({
                        ...prev,
                        newQty: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm font-bold text-text outline-none focus:border-primary"
                  />
                </label>
              </div>

              {/* Adjustment Diff Badge */}
              <div className="flex items-center justify-between rounded-[8px] bg-app/60 px-3 py-2 text-xs">
                <span className="text-muted">Adjustment Delta:</span>
                <span
                  className={cn(
                    'font-bold',
                    adjustForm.newQty - adjustForm.currentQty > 0
                      ? 'text-success'
                      : adjustForm.newQty - adjustForm.currentQty < 0
                        ? 'text-error'
                        : 'text-muted',
                  )}
                >
                  {adjustForm.newQty - adjustForm.currentQty > 0 ? '+' : ''}
                  {adjustForm.newQty - adjustForm.currentQty} units
                </span>
              </div>

              {/* Reason Dropdown (Required) */}
              <label className="flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text">Reason *</span>
                  <span className="text-[11px] text-muted font-normal">
                    (Required to enable submit)
                  </span>
                </div>
                <select
                  value={adjustForm.reason}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                >
                  <option value="">-- Select a reason --</option>
                  <option value="Damage">Damage</option>
                  <option value="Theft">Theft</option>
                  <option value="Found">Found</option>
                  <option value="Correction">Correction</option>
                  <option value="Expired">Expired</option>
                </select>
              </label>

              {/* Notes */}
              <label className="flex flex-col gap-1.5 text-left">
                <span className="text-xs font-medium text-text">Notes / Justification</span>
                <textarea
                  rows={2}
                  value={adjustForm.notes}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional context or incident reference..."
                  className="rounded-[8px] border border-border bg-surface p-2.5 text-sm text-text outline-none focus:border-primary placeholder:text-muted"
                />
              </label>
            </div>

            {/* Footer: Submit disabled until reason chosen */}
            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="secondary" onClick={() => setAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!adjustForm.reason}
                onClick={handleAdjustStockSubmit}
              >
                Save Adjustment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: TRANSFER STOCK MODAL                             */}
      {/* ========================================================= */}
      {transferModalOpen && transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setTransferModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-[12px] border border-border bg-surface p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">Transfer Stock Batch</h2>
                <p className="text-xs text-muted">
                  Relocate batch stock between hospital warehousing nodes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="rounded-[8px] p-1.5 text-muted hover:bg-app"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-[8px] border border-border bg-app/50 p-3 space-y-1">
                <div className="font-semibold text-text">{transferTarget.product}</div>
                <div className="text-xs text-muted">
                  Batch: <span className="font-mono">{transferTarget.batch}</span> • Current: {transferTarget.fromLocation}
                </div>
              </div>

              <label className="flex flex-col gap-1.5 text-left">
                <span className="text-xs font-medium text-text">Destination Facility *</span>
                <select
                  value={transferTarget.targetLocation}
                  onChange={(e) =>
                    setTransferTarget((prev) =>
                      prev
                        ? {
                            ...prev,
                            targetLocation: e.target.value as InventoryItem['location'],
                          }
                        : null,
                    )
                  }
                  className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                >
                  {ALL_LOCATIONS.filter((l) => l !== transferTarget.fromLocation).map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text">Transfer Quantity *</span>
                  <span className="text-xs text-muted">
                    Max: {transferTarget.maxQty} units
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={transferTarget.maxQty}
                  value={transferTarget.qty}
                  onChange={(e) =>
                    setTransferTarget((prev) =>
                      prev
                        ? {
                            ...prev,
                            qty: Math.min(
                              prev.maxQty,
                              Math.max(1, parseInt(e.target.value, 10) || 1),
                            ),
                          }
                        : null,
                    )
                  }
                  className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm font-semibold text-text outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setTransferModalOpen(false)
                  setTransferTarget(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmTransfer}>
                Confirm Transfer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: WRITEOFF STOCK MODAL                             */}
      {/* ========================================================= */}
      {writeoffModalOpen && writeoffTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setWriteoffModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-[12px] border border-border bg-surface p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-error">Writeoff Inventory Batch</h2>
                <p className="text-xs text-muted">
                  Decommission expired, contaminated, or damaged batches
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWriteoffModalOpen(false)}
                className="rounded-[8px] p-1.5 text-muted hover:bg-app"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-[8px] border border-red-200 bg-red-50/50 p-3 space-y-1">
                <div className="font-semibold text-red-950">{writeoffTarget.product}</div>
                <div className="text-xs text-red-800">
                  Batch: <span className="font-mono">{writeoffTarget.batch}</span> • Available: {writeoffTarget.maxQty} units
                </div>
              </div>

              <label className="flex flex-col gap-1.5 text-left">
                <span className="text-xs font-medium text-text">Writeoff Reason</span>
                <select
                  value={writeoffTarget.reason}
                  onChange={(e) =>
                    setWriteoffTarget((prev) =>
                      prev ? { ...prev, reason: e.target.value } : null,
                    )
                  }
                  className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                >
                  <option value="Expired">Expired Batch</option>
                  <option value="Damaged Goods">Damaged Goods / Broken Vial</option>
                  <option value="Cold Chain Failure">Cold Chain Temperature Deviation</option>
                  <option value="Recall">Manufacturer Regulatory Recall</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text">Units to Writeoff</span>
                  <span className="text-xs text-muted">
                    Max: {writeoffTarget.maxQty} units
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={writeoffTarget.maxQty}
                  value={writeoffTarget.qty}
                  onChange={(e) =>
                    setWriteoffTarget((prev) =>
                      prev
                        ? {
                            ...prev,
                            qty: Math.min(
                              prev.maxQty,
                              Math.max(1, parseInt(e.target.value, 10) || 1),
                            ),
                          }
                        : null,
                    )
                  }
                  className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm font-bold text-error outline-none focus:border-error"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setWriteoffModalOpen(false)
                  setWriteoffTarget(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmWriteoff}>
                Confirm Writeoff
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
