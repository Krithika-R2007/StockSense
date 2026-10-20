import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  PackageCheck,
  ClipboardList,
  CheckSquare,
  Square,
  AlertCircle,
  Trash2,
  Eye,
  ArrowRight,
  Download,
  Building2,
  User,
  ShoppingBag,
  Info,
  Calendar,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Layers,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Drawer } from '../components/ui/Drawer'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Pagination } from '../components/ui/Pagination'
import { PageHeader } from '../components/layout/PageHeader'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'

// --- TYPES ---
export type SalesOrderStatus = 'Pending' | 'Picking' | 'Shipped' | 'Delivered'
export type SalesOrderChannel = 'retail' | 'online'

export type OrderBatchAllocation = {
  batchId: string
  expiry: string
  daysLeft: number
  quantity: number
  binLocation: string
  picked: boolean
}

export type SalesOrderItem = {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  subtotal: number
  unit: string
  batches: OrderBatchAllocation[]
}

export type SalesOrder = {
  id: string
  channel: SalesOrderChannel
  customer: {
    name: string
    email: string
    phone: string
    address?: string
  }
  location: string
  items: SalesOrderItem[]
  totalAmount: number
  status: SalesOrderStatus
  createdAt: string
  notes?: string
}

// Product catalog available for new orders
export type CatalogBatch = {
  batchId: string
  expiry: string
  daysLeft: number
  available: number
  binLocation: string
  location: string
}

export type CatalogProduct = {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  price: number
  batches: CatalogBatch[]
}

// --- MOCK CATALOG DATA WITH FEFO BATCHES ---
const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 'p1',
    sku: 'SKU-1042',
    name: 'Surgical Gloves (L)',
    category: 'PPE',
    unit: 'boxes',
    price: 18.0,
    batches: [
      {
        batchId: 'B-9204',
        expiry: '2026-10-28',
        daysLeft: 10,
        available: 120,
        binLocation: 'Aisle 1 • Shelf A-12',
        location: 'Warehouse A',
      },
      {
        batchId: 'B-7701',
        expiry: '2027-06-01',
        daysLeft: 226,
        available: 300,
        binLocation: 'Aisle 1 • Shelf A-14',
        location: 'Warehouse A',
      },
      {
        batchId: 'B-7702',
        expiry: '2027-11-20',
        daysLeft: 398,
        available: 200,
        binLocation: 'Aisle 2 • Shelf B-01',
        location: 'Warehouse A',
      },
    ],
  },
  {
    id: 'p2',
    sku: 'SKU-2088',
    name: 'IV Saline 500ml',
    category: 'Fluids',
    unit: 'cases',
    price: 14.0,
    batches: [
      {
        batchId: 'B-9012',
        expiry: '2026-10-21',
        daysLeft: 3,
        available: 50,
        binLocation: 'Cold Rack C-02',
        location: 'Cold Store',
      },
      {
        batchId: 'B-7700',
        expiry: '2027-02-15',
        daysLeft: 120,
        available: 80,
        binLocation: 'Cold Rack C-05',
        location: 'Cold Store',
      },
    ],
  },
  {
    id: 'p3',
    sku: 'SKU-1199',
    name: 'N95 Respirator Mask',
    category: 'PPE',
    unit: 'boxes',
    price: 35.0,
    batches: [
      {
        batchId: 'B-3312',
        expiry: '2027-10-30',
        daysLeft: 377,
        available: 150,
        binLocation: 'Aisle 4 • Shelf D-03',
        location: 'Warehouse A',
      },
      {
        batchId: 'B-3318',
        expiry: '2028-02-14',
        daysLeft: 484,
        available: 390,
        binLocation: 'Aisle 4 • Shelf D-06',
        location: 'Warehouse A',
      },
    ],
  },
  {
    id: 'p4',
    sku: 'SKU-3310',
    name: 'Bandage Roll 4"',
    category: 'Wound Care',
    unit: 'packs',
    price: 6.5,
    batches: [
      {
        batchId: 'B-9251',
        expiry: '2026-10-31',
        daysLeft: 13,
        available: 60,
        binLocation: 'Aisle 3 • Bin 11',
        location: 'Warehouse B',
      },
      {
        batchId: 'B-5520',
        expiry: '2026-11-09',
        daysLeft: 22,
        available: 75,
        binLocation: 'Aisle 3 • Bin 14',
        location: 'Warehouse B',
      },
    ],
  },
  {
    id: 'p5',
    sku: 'SKU-4401',
    name: 'Insulin Glargine 100U/ml',
    category: 'Pharma',
    unit: 'vials',
    price: 72.0,
    batches: [
      {
        batchId: 'B-9105',
        expiry: '2026-10-21',
        daysLeft: 3,
        available: 25,
        binLocation: 'Fridge Slot F-01',
        location: 'Pharmacy Fridge',
      },
      {
        batchId: 'B-8890',
        expiry: '2026-11-15',
        daysLeft: 28,
        available: 35,
        binLocation: 'Fridge Slot F-04',
        location: 'Pharmacy Fridge',
      },
    ],
  },
  {
    id: 'p6',
    sku: 'SKU-6120',
    name: 'Blood Glucose Test Strips',
    category: 'Diagnostics',
    unit: 'packs',
    price: 28.0,
    batches: [
      {
        batchId: 'B-6041',
        expiry: '2027-01-01',
        daysLeft: 75,
        available: 120,
        binLocation: 'Aisle 2 • Shelf C-09',
        location: 'Warehouse B',
      },
      {
        batchId: 'B-6049',
        expiry: '2027-03-10',
        daysLeft: 143,
        available: 100,
        binLocation: 'Aisle 2 • Shelf C-12',
        location: 'Warehouse B',
      },
    ],
  },
  {
    id: 'p7',
    sku: 'SKU-5201',
    name: 'Amoxicillin 500mg',
    category: 'Pharma',
    unit: 'bottles',
    price: 19.0,
    batches: [
      {
        batchId: 'B-9106',
        expiry: '2026-10-21',
        daysLeft: 3,
        available: 40,
        binLocation: 'Pharma Shelf P-02',
        location: 'Warehouse A',
      },
      {
        batchId: 'B-7301',
        expiry: '2026-11-05',
        daysLeft: 18,
        available: 55,
        binLocation: 'Pharma Shelf P-05',
        location: 'Warehouse A',
      },
    ],
  },
]

// --- 8 INITIAL ORDERS ACROSS ALL STATUSES ---
const INITIAL_ORDERS: SalesOrder[] = [
  {
    id: 'SO-2026-001',
    channel: 'online',
    customer: {
      name: 'St. Jude General Hospital',
      email: 'logistics@stjude-health.org',
      phone: '+1 (555) 234-5678',
      address: '742 Evergreen Terrace, Sector 4',
    },
    location: 'Warehouse A',
    status: 'Pending',
    createdAt: '2026-10-18 08:30',
    notes: 'Urgent restocking for surgical wing before weekend shift.',
    totalAmount: 1600.0,
    items: [
      {
        productId: 'p1',
        productName: 'Surgical Gloves (L)',
        sku: 'SKU-1042',
        quantity: 50,
        unitPrice: 18.0,
        subtotal: 900.0,
        unit: 'boxes',
        batches: [
          {
            batchId: 'B-9204',
            expiry: '2026-10-28',
            daysLeft: 10,
            quantity: 50,
            binLocation: 'Aisle 1 • Shelf A-12',
            picked: false,
          },
        ],
      },
      {
        productId: 'p3',
        productName: 'N95 Respirator Mask',
        sku: 'SKU-1199',
        quantity: 20,
        unitPrice: 35.0,
        subtotal: 700.0,
        unit: 'boxes',
        batches: [
          {
            batchId: 'B-3312',
            expiry: '2027-10-30',
            daysLeft: 377,
            quantity: 20,
            binLocation: 'Aisle 4 • Shelf D-03',
            picked: false,
          },
        ],
      },
    ],
  },
  {
    id: 'SO-2026-002',
    channel: 'retail',
    customer: {
      name: 'Metro Urgent Care Clinic',
      email: 'dr.roberts@metrourgent.com',
      phone: '+1 (555) 876-5432',
      address: '108 Downtown Med Plaza, Suite 2B',
    },
    location: 'Cold Store',
    status: 'Pending',
    createdAt: '2026-10-18 09:15',
    notes: 'Direct courier delivery requested for cold chain compliance.',
    totalAmount: 840.0,
    items: [
      {
        productId: 'p2',
        productName: 'IV Saline 500ml',
        sku: 'SKU-2088',
        quantity: 60,
        unitPrice: 14.0,
        subtotal: 840.0,
        unit: 'cases',
        batches: [
          {
            batchId: 'B-9012',
            expiry: '2026-10-21',
            daysLeft: 3,
            quantity: 40,
            binLocation: 'Cold Rack C-02',
            picked: false,
          },
          {
            batchId: 'B-7700',
            expiry: '2027-02-15',
            daysLeft: 120,
            quantity: 20,
            binLocation: 'Cold Rack C-05',
            picked: false,
          },
        ],
      },
    ],
  },
  {
    id: 'SO-2026-003',
    channel: 'online',
    customer: {
      name: 'Eastside Community Health',
      email: 'purchasing@eastsidehealth.org',
      phone: '+1 (555) 441-9872',
      address: '52 East Boulevard, Wing C',
    },
    location: 'Warehouse A',
    status: 'Picking',
    createdAt: '2026-10-17 14:10',
    notes: 'Pick list allocated according to FEFO expiry batches.',
    totalAmount: 1110.0,
    items: [
      {
        productId: 'p1',
        productName: 'Surgical Gloves (L)',
        sku: 'SKU-1042',
        quantity: 40,
        unitPrice: 18.0,
        subtotal: 720.0,
        unit: 'boxes',
        batches: [
          {
            batchId: 'B-9204',
            expiry: '2026-10-28',
            daysLeft: 10,
            quantity: 40,
            binLocation: 'Aisle 1 • Shelf A-12',
            picked: true,
          },
        ],
      },
      {
        productId: 'p4',
        productName: 'Bandage Roll 4"',
        sku: 'SKU-3310',
        quantity: 60,
        unitPrice: 6.5,
        subtotal: 390.0,
        unit: 'packs',
        batches: [
          {
            batchId: 'B-9251',
            expiry: '2026-10-31',
            daysLeft: 13,
            quantity: 40,
            binLocation: 'Aisle 3 • Bin 11',
            picked: false,
          },
          {
            batchId: 'B-5520',
            expiry: '2026-11-09',
            daysLeft: 22,
            quantity: 20,
            binLocation: 'Aisle 3 • Bin 14',
            picked: false,
          },
        ],
      },
    ],
  },
  {
    id: 'SO-2026-004',
    channel: 'retail',
    customer: {
      name: 'Summit Surgical Pavilion',
      email: 'supplies@summitsurg.com',
      phone: '+1 (555) 902-1144',
      address: '900 Ridgeview Heights, Floor 3',
    },
    location: 'Pharmacy Fridge',
    status: 'Picking',
    createdAt: '2026-10-17 16:45',
    notes: 'Temperature controlled insulated box required.',
    totalAmount: 1460.0,
    items: [
      {
        productId: 'p5',
        productName: 'Insulin Glargine 100U/ml',
        sku: 'SKU-4401',
        quantity: 15,
        unitPrice: 72.0,
        subtotal: 1080.0,
        unit: 'vials',
        batches: [
          {
            batchId: 'B-9105',
            expiry: '2026-10-21',
            daysLeft: 3,
            quantity: 15,
            binLocation: 'Fridge Slot F-01',
            picked: true,
          },
        ],
      },
      {
        productId: 'p7',
        productName: 'Amoxicillin 500mg',
        sku: 'SKU-5201',
        quantity: 20,
        unitPrice: 19.0,
        subtotal: 380.0,
        unit: 'bottles',
        batches: [
          {
            batchId: 'B-9106',
            expiry: '2026-10-21',
            daysLeft: 3,
            quantity: 20,
            binLocation: 'Pharma Shelf P-02',
            picked: true,
          },
        ],
      },
    ],
  },
  {
    id: 'SO-2026-005',
    channel: 'online',
    customer: {
      name: 'Northwest Trauma Center',
      email: 'orders@nwtrauma.org',
      phone: '+1 (555) 322-7711',
      address: '1440 River Road, Receiving Bay 1',
    },
    location: 'Warehouse B',
    status: 'Shipped',
    createdAt: '2026-10-16 11:20',
    notes: 'Dispatched via MedExpress Logistics Tracking #MX-8921.',
    totalAmount: 1595.0,
    items: [
      {
        productId: 'p6',
        productName: 'Blood Glucose Test Strips',
        sku: 'SKU-6120',
        quantity: 50,
        unitPrice: 28.0,
        subtotal: 1400.0,
        unit: 'packs',
        batches: [
          {
            batchId: 'B-6041',
            expiry: '2027-01-01',
            daysLeft: 75,
            quantity: 50,
            binLocation: 'Aisle 2 • Shelf C-09',
            picked: true,
          },
        ],
      },
      {
        productId: 'p4',
        productName: 'Bandage Roll 4"',
        sku: 'SKU-3310',
        quantity: 30,
        unitPrice: 6.5,
        subtotal: 195.0,
        unit: 'packs',
        batches: [
          {
            batchId: 'B-9251',
            expiry: '2026-10-31',
            daysLeft: 13,
            quantity: 30,
            binLocation: 'Aisle 3 • Bin 11',
            picked: true,
          },
        ],
      },
    ],
  },
  {
    id: 'SO-2026-006',
    channel: 'retail',
    customer: {
      name: 'Central Valley Pediatrics',
      email: 'clinic@centralvalleypeds.com',
      phone: '+1 (555) 603-9988',
      address: '320 Magnolia Blvd, Suite 101',
    },
    location: 'Warehouse A',
    status: 'Shipped',
    createdAt: '2026-10-16 13:50',
    notes: 'Delivering to local retail dispensary branch.',
    totalAmount: 1410.0,
    items: [
      {
        productId: 'p3',
        productName: 'N95 Respirator Mask',
        sku: 'SKU-1199',
        quantity: 30,
        unitPrice: 35.0,
        subtotal: 1050.0,
        unit: 'boxes',
        batches: [
          {
            batchId: 'B-3312',
            expiry: '2027-10-30',
            daysLeft: 377,
            quantity: 30,
            binLocation: 'Aisle 4 • Shelf D-03',
            picked: true,
          },
        ],
      },
      {
        productId: 'p1',
        productName: 'Surgical Gloves (L)',
        sku: 'SKU-1042',
        quantity: 20,
        unitPrice: 18.0,
        subtotal: 360.0,
        unit: 'boxes',
        batches: [
          {
            batchId: 'B-7701',
            expiry: '2027-06-01',
            daysLeft: 226,
            quantity: 20,
            binLocation: 'Aisle 1 • Shelf A-14',
            picked: true,
          },
        ],
      },
    ],
  },
  {
    id: 'SO-2026-007',
    channel: 'online',
    customer: {
      name: 'Lakeside Senior Living',
      email: 'admin@lakesidesenior.com',
      phone: '+1 (555) 714-2233',
      address: '88 Lakeview Point',
    },
    location: 'Cold Store',
    status: 'Delivered',
    createdAt: '2026-10-15 10:00',
    notes: 'Received and inspected by Nurse Manager Carol Evans.',
    totalAmount: 700.0,
    items: [
      {
        productId: 'p2',
        productName: 'IV Saline 500ml',
        sku: 'SKU-2088',
        quantity: 50,
        unitPrice: 14.0,
        subtotal: 700.0,
        unit: 'cases',
        batches: [
          {
            batchId: 'B-9012',
            expiry: '2026-10-21',
            daysLeft: 3,
            quantity: 50,
            binLocation: 'Cold Rack C-02',
            picked: true,
          },
        ],
      },
    ],
  },
  {
    id: 'SO-2026-008',
    channel: 'retail',
    customer: {
      name: 'Pinnacle Health Diagnostics',
      email: 'orders@pinnaclehd.net',
      phone: '+1 (555) 880-4512',
      address: '450 Innovation Parkway, Bldg 5',
    },
    location: 'Warehouse B',
    status: 'Delivered',
    createdAt: '2026-10-14 15:30',
    notes: 'Standard delivery receipt signed by inventory dock.',
    totalAmount: 1680.0,
    items: [
      {
        productId: 'p6',
        productName: 'Blood Glucose Test Strips',
        sku: 'SKU-6120',
        quantity: 60,
        unitPrice: 28.0,
        subtotal: 1680.0,
        unit: 'packs',
        batches: [
          {
            batchId: 'B-6041',
            expiry: '2027-01-01',
            daysLeft: 75,
            quantity: 60,
            binLocation: 'Aisle 2 • Shelf C-09',
            picked: true,
          },
        ],
      },
    ],
  },
]

// Status tone helper
function statusChipTone(status: SalesOrderStatus) {
  switch (status) {
    case 'Pending':
      return 'warning' as const
    case 'Picking':
      return 'info' as const
    case 'Shipped':
      return 'critical' as const
    case 'Delivered':
      return 'good' as const
  }
}

// Format currency
function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val)
}

// Flat item for the pick list drawer
type FlatPickItem = {
  itemId: string
  productName: string
  sku: string
  batchId: string
  expiry: string
  daysLeft: number
  binLocation: string
  quantity: number
  unit: string
  picked: boolean
}

export function SalesOrdersPage() {
  const { toast } = useToast()

  // Main state
  const [orders, setOrders] = useState<SalesOrder[]>(INITIAL_ORDERS)
  const [activeTab, setActiveTab] = useState<SalesOrderStatus | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLocation, setFilterLocation] = useState('All')
  const [filterChannel, setFilterChannel] = useState('All')
  const [page, setPage] = useState(1)
  const perPage = 5

  // Drawers & Modals state
  const [newOrderDrawerOpen, setNewOrderDrawerOpen] = useState(false)
  const [pickListDrawerOpen, setPickListDrawerOpen] = useState(false)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)

  // Status transition confirmation modal
  const [transitionModal, setTransitionModal] = useState<{
    orderId: string
    newStatus: SalesOrderStatus
    title: string
    message: string
    confirmLabel: string
    variant: 'primary' | 'success' | 'destructive'
  } | null>(null)

  // --- NEW SALES ORDER FORM STATE ---
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [channel, setChannel] = useState<SalesOrderChannel>('online')
  const [fulfillingLocation, setFulfillingLocation] = useState('Warehouse A')
  const [orderNotes, setOrderNotes] = useState('')

  // Product selection + FEFO allocation in New SO Drawer
  const [selectedProductId, setSelectedProductId] = useState<string>('p1')
  const [requestedQty, setRequestedQty] = useState<number>(30)
  const [customBatchAllocations, setCustomBatchAllocations] = useState<
    Record<string, number>
  >({})
  const [lineItems, setLineItems] = useState<SalesOrderItem[]>([])

  // Available locations
  const LOCATION_OPTIONS = [
    { value: 'Warehouse A', label: 'Warehouse A' },
    { value: 'Warehouse B', label: 'Warehouse B' },
    { value: 'Cold Store', label: 'Cold Store' },
    { value: 'Pharmacy Fridge', label: 'Pharmacy Fridge' },
    { value: 'Clinic North', label: 'Clinic North' },
  ]

  // Filter options for top bar
  const LOCATION_FILTER_OPTIONS = [
    { value: 'All', label: 'All Locations' },
    ...LOCATION_OPTIONS,
  ]

  const CHANNEL_FILTER_OPTIONS = [
    { value: 'All', label: 'All Channels' },
    { value: 'online', label: 'Online Store' },
    { value: 'retail', label: 'Retail Branch' },
  ]

  // Look up selected catalog product
  const currentCatalogProduct = useMemo(() => {
    return (
      CATALOG_PRODUCTS.find((p) => p.id === selectedProductId) ||
      CATALOG_PRODUCTS[0]
    )
  }, [selectedProductId])

  // FEFO batches available for selected product
  const availableProductBatches = useMemo(() => {
    if (!currentCatalogProduct) return []
    // Sort ascending by expiry date (FEFO: First-Expired First-Out)
    return [...currentCatalogProduct.batches].sort(
      (a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime(),
    )
  }, [currentCatalogProduct])

  // Automatic FEFO allocation calculator
  const autoAllocations = useMemo(() => {
    let remaining = Math.max(0, requestedQty || 0)
    const allocs: Record<string, number> = {}

    for (const b of availableProductBatches) {
      if (remaining <= 0) {
        allocs[b.batchId] = 0
      } else {
        const take = Math.min(b.available, remaining)
        allocs[b.batchId] = take
        remaining -= take
      }
    }
    return allocs
  }, [availableProductBatches, requestedQty])

  // Reset or initialize custom allocations when product or qty changes
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId)
    setCustomBatchAllocations({})
  }

  // Active batch allocation (custom overrides or auto-calculated)
  const currentAllocations = useMemo(() => {
    const res: Record<string, number> = {}
    for (const b of availableProductBatches) {
      if (customBatchAllocations[b.batchId] !== undefined) {
        res[b.batchId] = customBatchAllocations[b.batchId]
      } else {
        res[b.batchId] = autoAllocations[b.batchId] ?? 0
      }
    }
    return res
  }, [availableProductBatches, customBatchAllocations, autoAllocations])

  const totalAllocatedUnits = useMemo(() => {
    return Object.values(currentAllocations).reduce((acc, n) => acc + (n || 0), 0)
  }, [currentAllocations])

  // Handle manual override on a batch allocation input
  const handleBatchQtyOverride = (batchId: string, val: number) => {
    setCustomBatchAllocations((prev) => ({
      ...prev,
      [batchId]: Math.max(0, val),
    }))
  }

  // Add line item to New SO
  const handleAddLineItem = () => {
    if (!currentCatalogProduct) return
    if (totalAllocatedUnits <= 0) {
      toast('Please allocate at least 1 unit to add item.', 'warning')
      return
    }

    const itemBatches: OrderBatchAllocation[] = availableProductBatches
      .filter((b) => (currentAllocations[b.batchId] || 0) > 0)
      .map((b) => ({
        batchId: b.batchId,
        expiry: b.expiry,
        daysLeft: b.daysLeft,
        quantity: currentAllocations[b.batchId],
        binLocation: b.binLocation,
        picked: false,
      }))

    const newItem: SalesOrderItem = {
      productId: currentCatalogProduct.id,
      productName: currentCatalogProduct.name,
      sku: currentCatalogProduct.sku,
      quantity: totalAllocatedUnits,
      unitPrice: currentCatalogProduct.price,
      subtotal: totalAllocatedUnits * currentCatalogProduct.price,
      unit: currentCatalogProduct.unit,
      batches: itemBatches,
    }

    setLineItems((prev) => [...prev, newItem])
    toast(
      `Added ${totalAllocatedUnits}x ${currentCatalogProduct.name} to order.`,
      'success',
    )

    // Reset product selection inputs for next item
    setRequestedQty(20)
    setCustomBatchAllocations({})
  }

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Calculate order subtotals
  const orderSubtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + item.subtotal, 0)
  }, [lineItems])

  // Save new Sales Order
  const handleSaveOrder = () => {
    if (!customerName.trim()) {
      toast('Customer Name is required.', 'error')
      return
    }
    if (lineItems.length === 0) {
      toast('Please add at least one line item to the order.', 'warning')
      return
    }

    const nextNumber = orders.length + 1
    const newId = `SO-2026-${String(nextNumber).padStart(3, '0')}`
    const nowStr = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 16)

    const newOrder: SalesOrder = {
      id: newId,
      channel,
      customer: {
        name: customerName,
        email: customerEmail || 'unspecified@customer.com',
        phone: customerPhone || '+1 (555) 000-0000',
      },
      location: fulfillingLocation,
      items: lineItems,
      totalAmount: orderSubtotal,
      status: 'Pending',
      createdAt: nowStr,
      notes: orderNotes,
    }

    setOrders((prev) => [newOrder, ...prev])
    toast(`Sales Order ${newId} created successfully.`, 'success')

    // Reset drawer state
    setNewOrderDrawerOpen(false)
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setOrderNotes('')
    setLineItems([])
    setCustomBatchAllocations({})
  }

  // --- FILTER & SEARCH ORDERS ---
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab !== 'All' && order.status !== activeTab) {
        return false
      }
      // Location filter
      if (filterLocation !== 'All' && order.location !== filterLocation) {
        return false
      }
      // Channel filter
      if (filterChannel !== 'All' && order.channel !== filterChannel) {
        return false
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesId = order.id.toLowerCase().includes(q)
        const matchesCustomer = order.customer.name.toLowerCase().includes(q)
        const matchesEmail = order.customer.email.toLowerCase().includes(q)
        const matchesProduct = order.items.some(
          (it) =>
            it.productName.toLowerCase().includes(q) ||
            it.sku.toLowerCase().includes(q),
        )
        if (!matchesId && !matchesCustomer && !matchesEmail && !matchesProduct) {
          return false
        }
      }
      return true
    })
  }, [orders, activeTab, filterLocation, filterChannel, searchQuery])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage))
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage
    return filteredOrders.slice(start, start + perPage)
  }, [filteredOrders, page, perPage])

  // Reset page when filters change
  const handleTabChange = (tab: SalesOrderStatus | 'All') => {
    setActiveTab(tab)
    setPage(1)
  }

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      All: orders.length,
      Pending: orders.filter((o) => o.status === 'Pending').length,
      Picking: orders.filter((o) => o.status === 'Picking').length,
      Shipped: orders.filter((o) => o.status === 'Shipped').length,
      Delivered: orders.filter((o) => o.status === 'Delivered').length,
    }
  }, [orders])

  // --- STATUS TRANSITIONS ---
  // Pending → Picking → Shipped → Delivered
  const triggerStatusTransition = (
    order: SalesOrder,
    nextStatus: SalesOrderStatus,
  ) => {
    let title = ''
    let message = ''
    let confirmLabel = ''
    let variant: 'primary' | 'success' | 'destructive' = 'primary'

    if (nextStatus === 'Picking') {
      title = `Start Picking Order ${order.id}?`
      message = `This will change the order status from Pending to Picking and generate an automated pick list with FEFO bin locations.`
      confirmLabel = 'Start Picking'
      variant = 'primary'
    } else if (nextStatus === 'Shipped') {
      title = `Dispatch Order ${order.id}?`
      message = `All allocated items will be marked as picked and the order will be marked as Shipped for transit.`
      confirmLabel = 'Mark Shipped'
      variant = 'primary'
    } else if (nextStatus === 'Delivered') {
      title = `Mark Order ${order.id} as Delivered?`
      message = `Confirm receipt and successful delivery to ${order.customer.name}. This completes the sales order lifecycle.`
      confirmLabel = 'Confirm Delivery'
      variant = 'success'
    }

    setTransitionModal({
      orderId: order.id,
      newStatus: nextStatus,
      title,
      message,
      confirmLabel,
      variant,
    })
  }

  const handleConfirmTransition = () => {
    if (!transitionModal) return
    const { orderId, newStatus } = transitionModal

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord
        // If transitioning to Shipped or Delivered, mark all batches picked
        const updatedItems =
          newStatus === 'Shipped' || newStatus === 'Delivered'
            ? ord.items.map((it) => ({
                ...it,
                batches: it.batches.map((b) => ({ ...b, picked: true })),
              }))
            : ord.items

        return {
          ...ord,
          status: newStatus,
          items: updatedItems,
        }
      }),
    )

    // Update selected order if open in drawer
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
    }

    toast(`Order ${orderId} transitioned to ${newStatus}.`, 'success')
    setTransitionModal(null)
  }

  // --- PICK LIST DRAWER DATA & ACTIONS ---
  // When order status = "picking", row click shows pick list in Drawer: items ordered by location bin + FEFO batch.
  const flatPickItems = useMemo<FlatPickItem[]>(() => {
    if (!selectedOrder) return []
    const list: FlatPickItem[] = []

    selectedOrder.items.forEach((item, itemIdx) => {
      item.batches.forEach((batch, batchIdx) => {
        list.push({
          itemId: `${item.productId}-${batch.batchId}-${itemIdx}-${batchIdx}`,
          productName: item.productName,
          sku: item.sku,
          batchId: batch.batchId,
          expiry: batch.expiry,
          daysLeft: batch.daysLeft,
          binLocation: batch.binLocation,
          quantity: batch.quantity,
          unit: item.unit,
          picked: batch.picked,
        })
      })
    })

    // Sort by location bin ascending, then by expiry date (FEFO)
    return list.sort((a, b) => {
      const binCompare = a.binLocation.localeCompare(b.binLocation)
      if (binCompare !== 0) return binCompare
      return new Date(a.expiry).getTime() - new Date(b.expiry).getTime()
    })
  }, [selectedOrder])

  // Toggle picked state for an item in the pick list drawer
  const handleTogglePicked = (batchId: string, itemId: string) => {
    if (!selectedOrder) return

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== selectedOrder.id) return ord
        return {
          ...ord,
          items: ord.items.map((it) => ({
            ...it,
            batches: it.batches.map((b) => {
              if (b.batchId === batchId) {
                return { ...b, picked: !b.picked }
              }
              return b
            }),
          })),
        }
      }),
    )

    // Also update selectedOrder in memory
    setSelectedOrder((prev) => {
      if (!prev) return null
      return {
        ...prev,
        items: prev.items.map((it) => ({
          ...it,
          batches: it.batches.map((b) => {
            if (b.batchId === batchId) {
              return { ...b, picked: !b.picked }
            }
            return b
          }),
        })),
      }
    })
  }

  // Mark all pick items as picked
  const handlePickAll = () => {
    if (!selectedOrder) return

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== selectedOrder.id) return ord
        return {
          ...ord,
          items: ord.items.map((it) => ({
            ...it,
            batches: it.batches.map((b) => ({ ...b, picked: true })),
          })),
        }
      }),
    )

    setSelectedOrder((prev) => {
      if (!prev) return null
      return {
        ...prev,
        items: prev.items.map((it) => ({
          ...it,
          batches: it.batches.map((b) => ({ ...b, picked: true })),
        })),
      }
    })
    toast('All pick items marked as collected.', 'info')
  }

  // Complete picking button at bottom of pick list drawer: Transitions Picking → Shipped
  const handleCompletePicking = () => {
    if (!selectedOrder) return

    // Set order status to Shipped and ensure all batches marked picked
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== selectedOrder.id) return ord
        return {
          ...ord,
          status: 'Shipped',
          items: ord.items.map((it) => ({
            ...it,
            batches: it.batches.map((b) => ({ ...b, picked: true })),
          })),
        }
      }),
    )

    toast(
      `Picking completed for ${selectedOrder.id}! Order is marked as Shipped.`,
      'success',
    )
    setPickListDrawerOpen(false)
  }

  // Handle table row click: spec says "When order status = 'picking', row click shows pick list in Drawer"
  const handleRowClick = (order: SalesOrder) => {
    setSelectedOrder(order)
    if (order.status === 'Picking') {
      setPickListDrawerOpen(true)
    } else {
      setDetailsDrawerOpen(true)
    }
  }

  // Stats calculation for KPI cards
  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    return {
      totalOrders: orders.length,
      pending: orders.filter((o) => o.status === 'Pending').length,
      picking: orders.filter((o) => o.status === 'Picking').length,
      shipped: orders.filter((o) => o.status === 'Shipped').length,
      delivered: orders.filter((o) => o.status === 'Delivered').length,
      totalRevenue: totalRev,
    }
  }, [orders])

  const pickedCount = flatPickItems.filter((i) => i.picked).length
  const totalPickCount = flatPickItems.length
  const pickProgressPercent =
    totalPickCount > 0 ? Math.round((pickedCount / totalPickCount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Sales Orders"
        subtitle="Manage customer orders, FEFO automated picking batches, and fulfillment status"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => toast('Exported sales orders report to CSV.', 'info')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setNewOrderDrawerOpen(true)}
            >
              New Sales Order
            </Button>
          </div>
        }
      />

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding className="border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Total Orders
            </span>
            <div className="rounded-[8px] bg-blue-50 p-2 text-primary">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {stats.totalOrders}
          </div>
          <p className="mt-1 text-xs text-muted">
            Revenue: {formatCurrency(stats.totalRevenue)}
          </p>
        </Card>

        <Card padding className="border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Pending Queue
            </span>
            <div className="rounded-[8px] bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {stats.pending}
          </div>
          <p className="mt-1 text-xs text-muted">Awaiting picking dispatch</p>
        </Card>

        <Card padding className="border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              In Picking
            </span>
            <div className="rounded-[8px] bg-blue-50 p-2 text-blue-600">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {stats.picking}
          </div>
          <p className="mt-1 text-xs text-muted">FEFO pick lists active</p>
        </Card>

        <Card padding className="border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Fulfilled & Delivered
            </span>
            <div className="rounded-[8px] bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {stats.delivered}
          </div>
          <p className="mt-1 text-xs text-muted">
            {stats.shipped} orders currently in transit
          </p>
        </Card>
      </div>

      {/* Main Filter & Control Panel */}
      <Card padding={false} className="border-border">
        {/* Status Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border p-3">
          {(
            [
              'All',
              'Pending',
              'Picking',
              'Shipped',
              'Delivered',
            ] as (SalesOrderStatus | 'All')[]
          ).map((tab) => {
            const isActive = activeTab === tab
            const count = tabCounts[tab]
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={cn(
                  'flex items-center gap-2 rounded-[8px] px-3.5 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:bg-app hover:text-text',
                )}
              >
                <span>{tab}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[11px] font-semibold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Filter dropdowns */}
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search SO #, customer, product..."
              className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <Select
              options={LOCATION_FILTER_OPTIONS}
              value={filterLocation}
              onChange={(e) => {
                setFilterLocation(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <div>
            <Select
              options={CHANNEL_FILTER_OPTIONS}
              value={filterChannel}
              onChange={(e) => {
                setFilterChannel(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="h-10 w-full"
              onClick={() => {
                setSearchQuery('')
                setFilterLocation('All')
                setFilterChannel('All')
                setActiveTab('All')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Sales Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border bg-app text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-4 py-3.5">SO Number</th>
                <th className="px-4 py-3.5">Channel</th>
                <th className="px-4 py-3.5">Fulfilling Location</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Items Count</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Created At</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="h-8 w-8 text-muted/60" />
                      <p className="font-medium text-text">No sales orders found</p>
                      <p className="text-xs text-muted">
                        Try tweaking your search filters or status tab.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const totalUnits = order.items.reduce(
                    (sum, it) => sum + it.quantity,
                    0,
                  )
                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-app/70',
                        order.status === 'Picking' && 'hover:bg-blue-50/40',
                      )}
                    >
                      {/* Monospace SO Number */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-primary">
                            {order.id}
                          </span>
                          {order.status === 'Picking' && (
                            <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                              Pick List
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Channel Chip (retail/online) */}
                      <td className="px-4 py-3.5">
                        <Chip
                          label={order.channel === 'online' ? 'Online' : 'Retail'}
                          tone={order.channel === 'online' ? 'info' : 'neutral'}
                        />
                      </td>

                      {/* Fulfilling Location */}
                      <td className="px-4 py-3.5 text-text">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted shrink-0" />
                          <span>{order.location}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="font-medium text-text">
                            {order.customer.name}
                          </div>
                          <div className="text-xs text-muted">
                            {order.customer.email}
                          </div>
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="px-4 py-3.5 text-text">
                        <div>
                          <span className="font-medium">
                            {order.items.length}{' '}
                            {order.items.length === 1 ? 'sku' : 'skus'}
                          </span>
                          <span className="text-xs text-muted">
                            {' '}
                            ({totalUnits} units)
                          </span>
                        </div>
                      </td>

                      {/* Total (Currency) */}
                      <td className="px-4 py-3.5 font-semibold text-text">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      {/* Status Chip */}
                      <td className="px-4 py-3.5">
                        <Chip
                          label={order.status}
                          tone={statusChipTone(order.status)}
                        />
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3.5 text-xs text-muted">
                        {order.createdAt}
                      </td>

                      {/* Actions: Status Transitions Pending → Picking → Shipped → Delivered */}
                      <td
                        className="px-4 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'Pending' && (
                            <Button
                              variant="secondary"
                              className="h-8 px-2.5 text-xs text-primary hover:border-primary hover:bg-primary/5"
                              icon={<ClipboardList className="h-3.5 w-3.5" />}
                              onClick={() =>
                                triggerStatusTransition(order, 'Picking')
                              }
                            >
                              Start Picking
                            </Button>
                          )}

                          {order.status === 'Picking' && (
                            <Button
                              variant="primary"
                              className="h-8 px-2.5 text-xs"
                              icon={<PackageCheck className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setSelectedOrder(order)
                                setPickListDrawerOpen(true)
                              }}
                            >
                              Pick List
                            </Button>
                          )}

                          {order.status === 'Shipped' && (
                            <Button
                              variant="success"
                              className="h-8 px-2.5 text-xs"
                              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                              onClick={() =>
                                triggerStatusTransition(order, 'Delivered')
                              }
                            >
                              Mark Delivered
                            </Button>
                          )}

                          {order.status === 'Delivered' && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Fulfilled
                            </span>
                          )}

                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedOrder(order)
                              setDetailsDrawerOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 text-muted" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      {/* =========================================================================
          DRAWER 1: NEW SALES ORDER (WIDE)
          Product selection with FEFO auto-batch allocation & override
      ========================================================================= */}
      <Drawer
        open={newOrderDrawerOpen}
        title="Create New Sales Order"
        wide={true}
        onClose={() => setNewOrderDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted">Estimated Total: </span>
              <span className="text-base font-bold text-text">
                {formatCurrency(orderSubtotal)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setNewOrderDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveOrder}
                disabled={lineItems.length === 0 || !customerName.trim()}
              >
                Save Sales Order
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Section 1: Customer Information */}
          <div className="rounded-[12px] border border-border bg-app/30 p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">
              1. Customer Information
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Customer Name *"
                placeholder="e.g. Metro General Hospital"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <Input
                label="Customer Email"
                type="email"
                placeholder="purchasing@metrohealth.org"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <Select
                label="Sales Channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as SalesOrderChannel)}
                options={[
                  { value: 'online', label: 'Online Storefront' },
                  { value: 'retail', label: 'Retail Dispensary Branch' },
                ]}
              />
            </div>
          </div>

          {/* Section 2: Fulfilling Location */}
          <div className="rounded-[12px] border border-border bg-app/30 p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">
              2. Fulfillment Source
            </h3>
            <Select
              label="Fulfilling Location"
              value={fulfillingLocation}
              onChange={(e) => setFulfillingLocation(e.target.value)}
              options={LOCATION_OPTIONS}
            />
          </div>

          {/* Section 3: Product Selection with FEFO Auto-Batch Algorithm */}
          <div className="rounded-[12px] border border-border bg-app/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text">
                  3. Product Selection & FEFO Auto-Batch Allocation
                </h3>
                <p className="text-xs text-muted">
                  System prioritizes nearest expiration batches first (First-Expired,
                  First-Out).
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                <Sparkles className="h-3 w-3" /> FEFO Enabled
              </span>
            </div>

            {/* Product selection inputs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Select
                  label="Select Product"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  options={CATALOG_PRODUCTS.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.sku}) — $${p.price.toFixed(2)}/${p.unit}`,
                  }))}
                />
              </div>

              <div>
                <Input
                  label="Requested Quantity"
                  type="number"
                  min="1"
                  value={requestedQty || ''}
                  onChange={(e) =>
                    setRequestedQty(Math.max(1, parseInt(e.target.value) || 0))
                  }
                />
              </div>
            </div>

            {/* Sub-table: Auto-selected Batches with override capability */}
            <div className="mt-4 rounded-[8px] border border-border bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Batches Allocated for {currentCatalogProduct.name}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    totalAllocatedUnits === requestedQty
                      ? 'text-emerald-600'
                      : totalAllocatedUnits < requestedQty
                        ? 'text-amber-600'
                        : 'text-primary',
                  )}
                >
                  Total Allocated: {totalAllocatedUnits} / {requestedQty} units
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-app text-muted">
                    <tr>
                      <th className="px-3 py-2">Batch #</th>
                      <th className="px-3 py-2">Bin Location</th>
                      <th className="px-3 py-2">Expiry Date</th>
                      <th className="px-3 py-2">Days Left</th>
                      <th className="px-3 py-2">Available</th>
                      <th className="px-3 py-2 text-right">
                        Allocated (Override)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {availableProductBatches.map((b, idx) => {
                      const isNearest = idx === 0
                      const allocVal = currentAllocations[b.batchId] || 0
                      return (
                        <tr
                          key={b.batchId}
                          className={cn(
                            'hover:bg-app/50',
                            isNearest && 'bg-amber-50/40',
                          )}
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5 font-mono font-medium text-text">
                              <span>{b.batchId}</span>
                              {isNearest && (
                                <span className="rounded bg-amber-100 px-1 py-0.2 text-[10px] font-semibold text-amber-800">
                                  FEFO 1st
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-muted">{b.binLocation}</td>
                          <td className="px-3 py-2 font-medium text-text">
                            {b.expiry}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[11px] font-medium',
                                b.daysLeft <= 14
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-700',
                              )}
                            >
                              {b.daysLeft}d left
                            </span>
                          </td>
                          <td className="px-3 py-2 font-medium text-muted">
                            {b.available}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              max={b.available}
                              value={allocVal}
                              onChange={(e) =>
                                handleBatchQtyOverride(
                                  b.batchId,
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="h-8 w-20 rounded border border-border bg-surface px-2 text-right font-medium text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Status Note on Allocation */}
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>
                  💡 You can manually adjust the numbers in the Allocated column to
                  override the automated FEFO rule.
                </span>
                <Button
                  variant="primary"
                  className="h-8 px-3 text-xs"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={handleAddLineItem}
                >
                  Add to Order
                </Button>
              </div>
            </div>
          </div>

          {/* Section 4: Line Items Table with Subtotals */}
          <div className="rounded-[12px] border border-border bg-app/30 p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">
              4. Order Line Items ({lineItems.length})
            </h3>

            {lineItems.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-border p-6 text-center text-xs text-muted">
                No items added yet. Select a product above and click &quot;Add to Order&quot;.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[8px] border border-border bg-surface">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-app text-muted">
                    <tr>
                      <th className="px-3 py-2.5">Product</th>
                      <th className="px-3 py-2.5">Allocated Batches</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5">Price</th>
                      <th className="px-3 py-2.5">Subtotal</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-app/40">
                        <td className="px-3 py-2.5 font-medium text-text">
                          <div>{item.productName}</div>
                          <div className="font-mono text-[11px] text-muted">
                            {item.sku}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {item.batches.map((b) => (
                              <span
                                key={b.batchId}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800"
                              >
                                {b.batchId} ({b.quantity})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-text">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-3 py-2.5 text-muted">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-text">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Subtotal Calculation Box */}
            {lineItems.length > 0 && (
              <div className="mt-3 flex justify-end">
                <div className="w-64 space-y-1.5 text-right text-xs">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal:</span>
                    <span className="font-medium text-text">
                      {formatCurrency(orderSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Tax (0% Medical Exemption):</span>
                    <span className="font-medium text-text">$0.00</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-text">
                    <span>Order Total:</span>
                    <span className="text-primary">
                      {formatCurrency(orderSubtotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Order Notes */}
          <div className="rounded-[12px] border border-border bg-app/30 p-4">
            <h3 className="mb-2 text-sm font-semibold text-text">
              Special Handling Instructions / Notes
            </h3>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Include temperature log sheet in the transport crate..."
              className="w-full rounded-[8px] border border-border bg-surface p-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </Drawer>

      {/* =========================================================================
          DRAWER 2: PICK LIST VIEW
          When order status = "picking", row click shows pick list in Drawer:
          items ordered by location bin + FEFO batch.
          Each item has checkbox to mark as picked.
          "Complete Picking" button at bottom.
      ========================================================================= */}
      <Drawer
        open={pickListDrawerOpen}
        title={
          selectedOrder
            ? `Pick List • ${selectedOrder.id}`
            : 'Fulfillment Pick List'
        }
        wide={true}
        onClose={() => setPickListDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted">
              {pickedCount} of {totalPickCount} item batches collected (
              {pickProgressPercent}%)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setPickListDrawerOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                icon={<PackageCheck className="h-4 w-4" />}
                onClick={handleCompletePicking}
              >
                Complete Picking
              </Button>
            </div>
          </div>
        }
      >
        {selectedOrder ? (
          <div className="space-y-6">
            {/* Pick List Meta Banner */}
            <div className="rounded-[12px] border border-border bg-blue-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-primary">
                      {selectedOrder.id}
                    </span>
                    <Chip label="In Picking" tone="info" />
                    <Chip
                      label={selectedOrder.channel === 'online' ? 'Online' : 'Retail'}
                      tone={selectedOrder.channel === 'online' ? 'info' : 'neutral'}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Customer: <span className="font-semibold text-text">{selectedOrder.customer.name}</span> • Source:{' '}
                    <span className="font-semibold text-text">{selectedOrder.location}</span>
                  </p>
                </div>

                <Button
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                  icon={<CheckSquare className="h-3.5 w-3.5" />}
                  onClick={handlePickAll}
                >
                  Mark All Picked
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs font-medium text-muted">
                  <span>Picking Progress</span>
                  <span>{pickProgressPercent}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${pickProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Instruction banner */}
            <div className="flex items-center gap-2 rounded-[8px] bg-slate-50 p-3 text-xs text-slate-600">
              <Info className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Pick order optimized by <strong>Location Bin</strong> sequence
                and <strong>FEFO (Earliest Expiry Batch First)</strong>. Check off
                each item as it is scanned/placed into the tote.
              </span>
            </div>

            {/* Pick List Table */}
            <div className="overflow-x-auto rounded-[12px] border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-app text-xs uppercase text-muted">
                  <tr>
                    <th className="w-12 px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Location Bin</th>
                    <th className="px-4 py-3">Product / SKU</th>
                    <th className="px-4 py-3">FEFO Batch</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3 text-right">Pick Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {flatPickItems.map((item) => (
                    <tr
                      key={item.itemId}
                      onClick={() =>
                        handleTogglePicked(item.batchId, item.itemId)
                      }
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-app/50',
                        item.picked ? 'bg-green-50/30' : 'bg-surface',
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          className="flex items-center justify-center text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTogglePicked(item.batchId, item.itemId)
                          }}
                        >
                          {item.picked ? (
                            <CheckSquare className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Square className="h-5 w-5 text-muted hover:text-text" />
                          )}
                        </button>
                      </td>

                      {/* Location Bin */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 font-mono text-xs font-semibold text-amber-900 border border-amber-200">
                          <MapPin className="h-3 w-3 text-amber-600" />
                          {item.binLocation}
                        </span>
                      </td>

                      {/* Product Name & SKU */}
                      <td className="px-4 py-3">
                        <div className={cn(item.picked && 'line-through text-muted')}>
                          <div className="font-semibold text-text">
                            {item.productName}
                          </div>
                          <div className="font-mono text-xs text-muted">
                            {item.sku}
                          </div>
                        </div>
                      </td>

                      {/* FEFO Batch */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-text">
                          <Layers className="h-3.5 w-3.5 text-muted" />
                          <span>{item.batchId}</span>
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3 text-xs">
                        <span className="font-medium text-text">{item.expiry}</span>
                        <span
                          className={cn(
                            'ml-1.5 rounded px-1.5 py-0.2 text-[10px] font-semibold',
                            item.daysLeft <= 14
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700',
                          )}
                        >
                          {item.daysLeft}d left
                        </span>
                      </td>

                      {/* Pick Qty */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-base font-bold text-text">
                          {item.quantity}
                        </span>{' '}
                        <span className="text-xs text-muted">{item.unit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* =========================================================================
          DRAWER 3: GENERAL SALES ORDER DETAILS
          Shown on non-picking rows or when user clicks eye icon
      ========================================================================= */}
      <Drawer
        open={detailsDrawerOpen}
        title={selectedOrder ? `Order Details • ${selectedOrder.id}` : 'Order Details'}
        wide={true}
        onClose={() => setDetailsDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setDetailsDrawerOpen(false)}
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              {selectedOrder?.status === 'Pending' && (
                <Button
                  variant="primary"
                  icon={<ClipboardList className="h-4 w-4" />}
                  onClick={() => {
                    setDetailsDrawerOpen(false)
                    triggerStatusTransition(selectedOrder, 'Picking')
                  }}
                >
                  Start Picking
                </Button>
              )}
              {selectedOrder?.status === 'Picking' && (
                <Button
                  variant="primary"
                  icon={<PackageCheck className="h-4 w-4" />}
                  onClick={() => {
                    setDetailsDrawerOpen(false)
                    setPickListDrawerOpen(true)
                  }}
                >
                  Open Pick List
                </Button>
              )}
              {selectedOrder?.status === 'Shipped' && (
                <Button
                  variant="success"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => {
                    setDetailsDrawerOpen(false)
                    triggerStatusTransition(selectedOrder, 'Delivered')
                  }}
                >
                  Mark Delivered
                </Button>
              )}
            </div>
          </div>
        }
      >
        {selectedOrder ? (
          <div className="space-y-6">
            {/* Order Overview Banner */}
            <div className="flex flex-col gap-4 rounded-[12px] border border-border bg-app/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-primary">
                    {selectedOrder.id}
                  </span>
                  <Chip
                    label={selectedOrder.status}
                    tone={statusChipTone(selectedOrder.status)}
                  />
                  <Chip
                    label={selectedOrder.channel === 'online' ? 'Online Store' : 'Retail Branch'}
                    tone={selectedOrder.channel === 'online' ? 'info' : 'neutral'}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  Created {selectedOrder.createdAt} • Fulfilling from{' '}
                  <span className="font-semibold text-text">
                    {selectedOrder.location}
                  </span>
                </p>
              </div>

              <div className="text-right sm:text-right">
                <div className="text-xs text-muted">Total Order Value</div>
                <div className="text-xl font-bold text-text">
                  {formatCurrency(selectedOrder.totalAmount)}
                </div>
              </div>
            </div>

            {/* Customer Details Card */}
            <Card padding className="border-border">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
                Customer & Shipping Destination
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
                <div>
                  <span className="text-xs text-muted">Customer Name</span>
                  <p className="font-semibold text-text">{selectedOrder.customer.name}</p>
                </div>
                <div>
                  <span className="text-xs text-muted">Email Contact</span>
                  <p className="font-medium text-text">{selectedOrder.customer.email}</p>
                </div>
                <div>
                  <span className="text-xs text-muted">Phone Number</span>
                  <p className="font-medium text-text">{selectedOrder.customer.phone}</p>
                </div>
                {selectedOrder.customer.address && (
                  <div className="sm:col-span-3">
                    <span className="text-xs text-muted">Delivery Address</span>
                    <p className="font-medium text-text">{selectedOrder.customer.address}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Line items & allocated batches */}
            <Card padding={false} className="border-border">
              <div className="border-b border-border px-4 py-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Line Items & Allocated Batches
                </h4>
              </div>
              <div className="divide-y divide-border">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-text">
                          {item.productName}
                        </div>
                        <div className="font-mono text-xs text-muted">
                          {item.sku}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-text">
                          {item.quantity} {item.unit}
                        </div>
                        <div className="text-xs text-muted">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    </div>

                    {/* Batches Allocated Sub-table */}
                    <div className="mt-3 rounded-[8px] bg-app/60 p-2 text-xs">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Batches & Bin Locations (FEFO):
                      </div>
                      <div className="space-y-1">
                        {item.batches.map((b) => (
                          <div
                            key={b.batchId}
                            className="flex items-center justify-between text-muted"
                          >
                            <span className="font-mono font-medium text-text">
                              {b.batchId} ({b.quantity} units)
                            </span>
                            <span className="text-slate-600">{b.binLocation}</span>
                            <span>Expires: {b.expiry}</span>
                            <Chip
                              label={b.picked ? 'Picked' : 'Pending Pick'}
                              tone={b.picked ? 'good' : 'warning'}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="rounded-[8px] bg-slate-50 p-3 text-xs text-muted">
                <strong>Order Notes:</strong> {selectedOrder.notes}
              </div>
            )}
          </div>
        ) : null}
      </Drawer>

      {/* =========================================================================
          MODAL: STATUS TRANSITION CONFIRMATION
      ========================================================================= */}
      <Modal
        open={!!transitionModal}
        title={transitionModal?.title || 'Confirm Status Transition'}
        confirmLabel={transitionModal?.confirmLabel || 'Confirm'}
        confirmVariant={transitionModal?.variant || 'primary'}
        onClose={() => setTransitionModal(null)}
        onConfirm={handleConfirmTransition}
      >
        {transitionModal?.message}
      </Modal>
    </div>
  )
}
