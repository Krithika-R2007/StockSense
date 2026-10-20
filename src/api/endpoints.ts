import { api, ApiError } from './client'
import { mockLoginResponse, mockUser } from './mockData'
import type { LoginResponse, User } from '../types/auth'

async function withMock<T>(fn: () => Promise<T>, mock: T): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof ApiError || e instanceof TypeError) return mock
    throw e
  }
}

export async function login(email: string, password: string) {
  return withMock(
    () =>
      api<LoginResponse>('/auth/login', {
        method: 'POST',
        json: { email, password },
      }),
    {
      ...mockLoginResponse,
      user: { ...mockUser, email: email || mockUser.email },
    },
  )
}

export async function forgotPassword(email: string) {
  return withMock(
    () =>
      api<void>('/auth/forgot-password', { method: 'POST', json: { email } }),
    undefined,
  )
}

export async function logout(refreshToken: string) {
  return withMock(
    () =>
      api<void>('/auth/logout', {
        method: 'POST',
        json: { refreshToken },
      }),
    undefined,
  )
}

export async function fetchProfile() {
  return withMock(() => api<User>('/users/me'), mockUser)
}

export async function stockSummary(locationId?: string) {
  const q = locationId ? `?locationId=${locationId}` : ''
  return withMock(
    () => api<Record<string, number>>(`/reports/stock-summary${q}`),
    { totalSkus: 1248, lowStock: 37, expiring30: 19, pendingTransfers: 6 },
  )
}

export type AlertType =
  | 'low_stock'
  | 'expiry_warning'
  | 'expired_batch'
  | 'transfer_suggested'
  | 'sync_conflict'

export type Alert = {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  read: boolean
  resolved: boolean
  createdAt: string
  type?: AlertType
  entityType?: 'inventory' | 'batches' | 'transfers' | 'sync'
  entityId?: string
  resolvedAt?: string
  deleted?: boolean
}

const now = Date.now()
const minsAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString()
const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString()

export const defaultAlerts: Alert[] = [
  {
    id: 'alt-1',
    title: 'Critical Low Stock: IV Saline 500ml',
    message: 'Only 48 units remain at Cold Store. Minimum safety threshold is 100 units.',
    severity: 'critical',
    type: 'low_stock',
    read: false,
    resolved: false,
    createdAt: minsAgo(5),
    entityType: 'inventory',
    entityId: 'i1',
  },
  {
    id: 'alt-2',
    title: 'Sync Conflict: Offline Stock Adjustment',
    message: 'Concurrent edits detected on Batch B-9012 between Warehouse A handheld and central database.',
    severity: 'warning',
    type: 'sync_conflict',
    read: false,
    resolved: false,
    createdAt: minsAgo(25),
    entityType: 'sync',
    entityId: 'sync-102',
  },
  {
    id: 'alt-3',
    title: 'Expiry Warning: Amoxicillin 500mg (Batch B-8102)',
    message: 'Batch B-8102 (320 packs) at Pharmacy Main will expire in 14 days (FEFO priority).',
    severity: 'warning',
    type: 'expiry_warning',
    read: false,
    resolved: false,
    createdAt: hoursAgo(1),
    entityType: 'batches',
    entityId: 'B-8102',
  },
  {
    id: 'alt-4',
    title: 'Transfer Suggested: Surgical Gloves (L)',
    message: 'Warehouse A has 450 excess units. Automated rule recommends transferring 150 units to Clinic North.',
    severity: 'info',
    type: 'transfer_suggested',
    read: true,
    resolved: false,
    createdAt: hoursAgo(2),
    entityType: 'transfers',
    entityId: 'TR-2401',
  },
  {
    id: 'alt-5',
    title: 'Expired Batch Detected: Insulin Glargine',
    message: 'Batch B-7620 (12 vials) at Pharmacy Fridge expired yesterday. Quarantine immediately.',
    severity: 'critical',
    type: 'expired_batch',
    read: false,
    resolved: false,
    createdAt: hoursAgo(4),
    entityType: 'batches',
    entityId: 'B-7620',
  },
  {
    id: 'alt-6',
    title: 'Low Stock: Surgical Gloves (M)',
    message: 'Warehouse A stock is at 85 units, approaching the reorder trigger of 100 units.',
    severity: 'warning',
    type: 'low_stock',
    read: true,
    resolved: false,
    createdAt: hoursAgo(6),
    entityType: 'inventory',
    entityId: 'i2',
  },
  {
    id: 'alt-7',
    title: 'Transfer Suggested: N95 Respirators',
    message: 'Clinic North inventory depleted due to emergency intake. Route emergency transfer from Warehouse A.',
    severity: 'info',
    type: 'transfer_suggested',
    read: false,
    resolved: false,
    createdAt: hoursAgo(9),
    entityType: 'transfers',
    entityId: 'TR-2402',
  },
  {
    id: 'alt-8',
    title: 'Expiry Warning: Heparin Sodium 5000U',
    message: 'Batch B-9044 (85 vials) at Central Hub expires within 21 days.',
    severity: 'warning',
    type: 'expiry_warning',
    read: false,
    resolved: false,
    createdAt: hoursAgo(26),
    entityType: 'batches',
    entityId: 'B-9044',
  },
  {
    id: 'alt-9',
    title: 'Critical Low Stock: Bandage Roll 4"',
    message: 'Warehouse B is completely out of stock (0 units on hand). Open PO-991 pending receipt.',
    severity: 'critical',
    type: 'low_stock',
    read: false,
    resolved: false,
    createdAt: hoursAgo(30),
    entityType: 'inventory',
    entityId: 'i3',
  },
  {
    id: 'alt-10',
    title: 'Sync Conflict: Price Revision Divergence',
    message: 'Supplier catalog auto-sync detected divergent SKU cost on SKU-1042. Local copy preserved.',
    severity: 'info',
    type: 'sync_conflict',
    read: true,
    resolved: false,
    createdAt: hoursAgo(34),
    entityType: 'sync',
    entityId: 'sync-103',
  },
  {
    id: 'alt-11',
    title: 'Expired Batch: Povidone Iodine 10%',
    message: 'Batch B-6511 (40 bottles) has passed the expiration date. Quarantined for safe disposal.',
    severity: 'critical',
    type: 'expired_batch',
    read: true,
    resolved: true,
    resolvedAt: 'Yesterday at 4:15 PM',
    createdAt: hoursAgo(38),
    entityType: 'batches',
    entityId: 'B-6511',
  },
  {
    id: 'alt-12',
    title: 'Transfer Suggested: Paracetamol Tablets 500mg',
    message: 'Clinic South has 1,200 units surplus. Rebalance transfer of 400 units to ER Bay recommended.',
    severity: 'info',
    type: 'transfer_suggested',
    read: true,
    resolved: true,
    resolvedAt: 'Yesterday at 2:00 PM',
    createdAt: hoursAgo(42),
    entityType: 'transfers',
    entityId: 'TR-2398',
  },
  {
    id: 'alt-13',
    title: 'Critical Low Stock: Paracetamol Infusion 100ml',
    message: 'Stock level critically low (15 bags). Daily consumption exceeds remaining supply.',
    severity: 'critical',
    type: 'low_stock',
    read: true,
    resolved: true,
    resolvedAt: '3 days ago',
    createdAt: daysAgo(3),
    entityType: 'inventory',
    entityId: 'i4',
  },
  {
    id: 'alt-14',
    title: 'Expiry Warning: Sterile Gauze Pads 4x4',
    message: 'Batch B-5421 (150 boxes) reaches 30-day expiration window. Ensure FEFO dispatch.',
    severity: 'warning',
    type: 'expiry_warning',
    read: true,
    resolved: false,
    createdAt: daysAgo(4),
    entityType: 'batches',
    entityId: 'B-5421',
  },
  {
    id: 'alt-15',
    title: 'Sync Conflict: Location Transfer Sequence Mismatch',
    message: 'Offline queue replayed out-of-order sequence #15847. Merged automatically using audit log chain.',
    severity: 'warning',
    type: 'sync_conflict',
    read: true,
    resolved: false,
    createdAt: daysAgo(5),
    entityType: 'sync',
    entityId: 'sync-104',
  },
  {
    id: 'alt-16',
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
  },
  {
    id: 'alt-17',
    title: 'Transfer Suggested: Disposable Syringes 5ml',
    message: 'Stock optimization algorithm detected uneven distribution across Warehouse A and Clinic South.',
    severity: 'info',
    type: 'transfer_suggested',
    read: true,
    resolved: true,
    resolvedAt: '8 days ago',
    createdAt: daysAgo(8),
    entityType: 'transfers',
    entityId: 'TR-2390',
  },
  {
    id: 'alt-18',
    title: 'Low Stock: Ciprofloxacin Eye Drops',
    message: 'Available inventory down to 22 units against reorder point of 50 units.',
    severity: 'warning',
    type: 'low_stock',
    read: true,
    resolved: false,
    createdAt: daysAgo(10),
    entityType: 'inventory',
    entityId: 'i5',
  },
]

export async function fetchAlerts(unread?: boolean) {
  const q = unread ? '?unread=true' : ''
  return withMock(
    () => api<Alert[]>(`/alerts${q}`),
    unread ? defaultAlerts.filter((a) => !a.read && !a.resolved) : defaultAlerts,
  )
}

export async function markAllAlertsRead() {
  defaultAlerts.forEach((a) => {
    a.read = true
  })
  return withMock(
    () => api<void>('/alerts/mark-all-read', { method: 'PATCH' }),
    undefined,
  )
}

export async function resolveAlert(id: string) {
  const target = defaultAlerts.find((a) => a.id === id)
  if (target) {
    target.resolved = true
    target.read = true
    target.resolvedAt = 'Just now'
  }
  return withMock(
    () => api<void>(`/alerts/${id}/resolve`, { method: 'PATCH' }),
    undefined,
  )
}

export async function generatePO(payload: {
  productId: string
  quantity: number
}) {
  return withMock(
    () => api<{ poId: string }>('/reorder/generate-po', { method: 'POST', json: payload }),
    { poId: 'PO-DRAFT-001' },
  )
}

export async function movementByDate(date: string) {
  return withMock(
    () => api<{ sku: string; action: string; qty: number }[]>(`/reports/movement?date=${date}`),
    [{ sku: 'SKU-1042', action: 'Received', qty: 120 }],
  )
}

export async function fetchProducts(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString()
  return withMock(
    () => api<Product[]>(`/products${q ? `?${q}` : ''}`),
    mockProducts,
  )
}

export type Product = {
  id: string
  sku: string
  name: string
  category: string
  supplier: string
  unit: string
  cost: number
  price: number
  isActive: boolean
  image?: string
}

const mockProducts: Product[] = [
  {
    id: 'p1',
    sku: 'SKU-1042',
    name: 'Surgical Gloves (L)',
    category: 'PPE',
    supplier: 'MedSupply Co',
    unit: 'box',
    cost: 12.5,
    price: 18,
    isActive: true,
  },
  {
    id: 'p2',
    sku: 'SKU-2088',
    name: 'IV Saline 500ml',
    category: 'Fluids',
    supplier: 'FluidTech',
    unit: 'case',
    cost: 8,
    price: 14,
    isActive: true,
  },
  {
    id: 'p3',
    sku: 'SKU-4401',
    name: 'Insulin Glargine 100U/ml',
    category: 'Pharma',
    supplier: 'NordicCare',
    unit: 'vials',
    cost: 45.0,
    price: 72,
    isActive: true,
  },
  {
    id: 'p4',
    sku: 'SKU-3310',
    name: 'Bandage Roll 4"',
    category: 'Wound Care',
    supplier: 'MedSupply Co',
    unit: 'pack',
    cost: 3.2,
    price: 6.5,
    isActive: true,
  },
  {
    id: 'p5',
    sku: 'SKU-1199',
    name: 'N95 Respirator Mask',
    category: 'PPE',
    supplier: 'SafetyFirst',
    unit: 'box',
    cost: 22.0,
    price: 35,
    isActive: true,
  },
  {
    id: 'p6',
    sku: 'SKU-9902',
    name: 'Propofol 10mg/ml Injectable',
    category: 'Pharma',
    supplier: 'AstraHealth',
    unit: 'ampoules',
    cost: 32.0,
    price: 58,
    isActive: true,
  },
  {
    id: 'p7',
    sku: 'SKU-6120',
    name: 'Blood Glucose Test Strips',
    category: 'Diagnostics',
    supplier: 'DiaCheck',
    unit: 'pack',
    cost: 16.0,
    price: 28,
    isActive: true,
  },
  {
    id: 'p8',
    sku: 'SKU-7754',
    name: 'Infusion Set Microdrip',
    category: 'Devices',
    supplier: 'FluidTech',
    unit: 'box',
    cost: 14.5,
    price: 24,
    isActive: true,
  },
  {
    id: 'p9',
    sku: 'SKU-5201',
    name: 'Amoxicillin 500mg',
    category: 'Pharma',
    supplier: 'AstraHealth',
    unit: 'bottle',
    cost: 9.5,
    price: 19,
    isActive: true,
  },
  {
    id: 'p10',
    sku: 'SKU-3820',
    name: 'Sterile Gauze Pads 4x4',
    category: 'Wound Care',
    supplier: 'MedSupply Co',
    unit: 'box',
    cost: 5.0,
    price: 11,
    isActive: true,
  },
]

export async function saveProduct(data: Partial<Product> & { id?: string }) {
  if (data.id) {
    return withMock(
      () => api<Product>(`/products/${data.id}`, { method: 'PUT', json: data }),
      { ...mockProducts[0], ...data } as Product,
    )
  }
  return withMock(
    () => api<Product>('/products', { method: 'POST', json: data }),
    { ...mockProducts[0], ...data, id: 'new' } as Product,
  )
}

export async function deleteProduct(id: string) {
  return withMock(
    () => api<void>(`/products/${id}`, { method: 'DELETE' }),
    undefined,
  )
}

export async function fetchInventory(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString()
  return withMock(
    () => api<InventoryRow[]>(`/inventory${q ? `?${q}` : ''}`),
    mockInventory,
  )
}

export type InventoryRow = {
  id: string
  product: string
  productId: string
  sku?: string
  category?: string
  location: string
  locationId: string
  batch: string
  onHand: number
  reserved: number
  available: number
  reorderPt: number
  expiryDays: number
  unitCost?: number
  batches?: { batch: string; expiry: string; qty: number; daysLeft?: number }[]
}

const mockInventory: InventoryRow[] = [
  {
    id: 'i1',
    product: 'IV Saline 500ml',
    productId: 'p2',
    sku: 'SKU-2088',
    category: 'Fluids',
    location: 'Cold Store',
    locationId: 'loc-cold',
    batch: 'B-9012',
    onHand: 120,
    reserved: 20,
    available: 100,
    reorderPt: 100,
    expiryDays: 45,
    unitCost: 8,
    batches: [
      { batch: 'B-9012', expiry: '2026-12-02', qty: 80, daysLeft: 45 },
      { batch: 'B-7700', expiry: '2027-02-15', qty: 40, daysLeft: 120 },
    ],
  },
  {
    id: 'i2',
    product: 'Surgical Gloves (L)',
    productId: 'p1',
    sku: 'SKU-1042',
    category: 'PPE',
    location: 'Warehouse A',
    locationId: 'loc-a',
    batch: 'B-7701',
    onHand: 500,
    reserved: 50,
    available: 450,
    reorderPt: 200,
    expiryDays: 640,
    unitCost: 12.5,
    batches: [
      { batch: 'B-7701', expiry: '2027-06-01', qty: 300, daysLeft: 591 },
      { batch: 'B-7702', expiry: '2027-11-20', qty: 200, daysLeft: 763 },
    ],
  },
  {
    id: 'i3',
    product: 'Insulin Glargine 100U/ml',
    productId: 'p3',
    sku: 'SKU-4401',
    category: 'Pharma',
    location: 'Pharmacy Fridge',
    locationId: 'loc-pharma',
    batch: 'B-8844',
    onHand: 18,
    reserved: 6,
    available: 12,
    reorderPt: 30,
    expiryDays: 4,
    unitCost: 45,
    batches: [
      { batch: 'B-8844', expiry: '2026-10-22', qty: 8, daysLeft: 4 },
      { batch: 'B-8890', expiry: '2026-11-15', qty: 10, daysLeft: 28 },
    ],
  },
  {
    id: 'i4',
    product: 'Bandage Roll 4"',
    productId: 'p4',
    sku: 'SKU-3310',
    category: 'Wound Care',
    location: 'Warehouse B',
    locationId: 'loc-b',
    batch: 'B-5520',
    onHand: 42,
    reserved: 15,
    available: 27,
    reorderPt: 50,
    expiryDays: 22,
    unitCost: 3.2,
    batches: [
      { batch: 'B-5520', expiry: '2026-11-09', qty: 27, daysLeft: 22 },
      { batch: 'B-5525', expiry: '2027-04-18', qty: 15, daysLeft: 182 },
    ],
  },
  {
    id: 'i5',
    product: 'N95 Respirator Mask',
    productId: 'p5',
    sku: 'SKU-1199',
    category: 'PPE',
    location: 'Warehouse A',
    locationId: 'loc-a',
    batch: 'B-3312',
    onHand: 890,
    reserved: 90,
    available: 800,
    reorderPt: 300,
    expiryDays: 380,
    unitCost: 22,
    batches: [
      { batch: 'B-3312', expiry: '2027-10-30', qty: 500, daysLeft: 377 },
      { batch: 'B-3318', expiry: '2028-02-14', qty: 390, daysLeft: 484 },
    ],
  },
  {
    id: 'i6',
    product: 'Propofol 10mg/ml Injectable',
    productId: 'p6',
    sku: 'SKU-9902',
    category: 'Pharma',
    location: 'Cold Store',
    locationId: 'loc-cold',
    batch: 'B-1002',
    onHand: 14,
    reserved: 2,
    available: 12,
    reorderPt: 25,
    expiryDays: -3,
    unitCost: 32,
    batches: [
      { batch: 'B-1002', expiry: '2026-10-15', qty: 6, daysLeft: -3 },
      { batch: 'B-1009', expiry: '2026-12-20', qty: 8, daysLeft: 63 },
    ],
  },
  {
    id: 'i7',
    product: 'Blood Glucose Test Strips',
    productId: 'p7',
    sku: 'SKU-6120',
    category: 'Diagnostics',
    location: 'Warehouse B',
    locationId: 'loc-b',
    batch: 'B-6041',
    onHand: 340,
    reserved: 40,
    available: 300,
    reorderPt: 150,
    expiryDays: 75,
    unitCost: 16,
    batches: [
      { batch: 'B-6041', expiry: '2027-01-01', qty: 180, daysLeft: 75 },
      { batch: 'B-6049', expiry: '2027-03-10', qty: 160, daysLeft: 143 },
    ],
  },
  {
    id: 'i8',
    product: 'Infusion Set Microdrip',
    productId: 'p8',
    sku: 'SKU-7754',
    category: 'Devices',
    location: 'Warehouse A',
    locationId: 'loc-a',
    batch: 'B-4190',
    onHand: 210,
    reserved: 30,
    available: 180,
    reorderPt: 80,
    expiryDays: 145,
    unitCost: 14.5,
    batches: [
      { batch: 'B-4190', expiry: '2027-03-12', qty: 120, daysLeft: 145 },
      { batch: 'B-4198', expiry: '2027-09-05', qty: 90, daysLeft: 322 },
    ],
  },
  {
    id: 'i9',
    product: 'Amoxicillin 500mg',
    productId: 'p9',
    sku: 'SKU-5201',
    category: 'Pharma',
    location: 'Pharmacy Fridge',
    locationId: 'loc-pharma',
    batch: 'B-7301',
    onHand: 65,
    reserved: 15,
    available: 50,
    reorderPt: 60,
    expiryDays: 18,
    unitCost: 9.5,
    batches: [
      { batch: 'B-7301', expiry: '2026-11-05', qty: 35, daysLeft: 18 },
      { batch: 'B-7309', expiry: '2027-02-18', qty: 30, daysLeft: 123 },
    ],
  },
  {
    id: 'i10',
    product: 'Sterile Gauze Pads 4x4',
    productId: 'p10',
    sku: 'SKU-3820',
    category: 'Wound Care',
    location: 'ER Bay',
    locationId: 'loc-er',
    batch: 'B-8110',
    onHand: 8,
    reserved: 0,
    available: 8,
    reorderPt: 20,
    expiryDays: 5,
    unitCost: 5,
    batches: [
      { batch: 'B-8110', expiry: '2026-10-23', qty: 8, daysLeft: 5 },
    ],
  },
]

export async function receiveStock(payload: unknown) {
  return withMock(
    () => api<void>('/inventory/receive', { method: 'POST', json: payload }),
    undefined,
  )
}

export async function adjustStock(payload: unknown) {
  return withMock(
    () => api<void>('/inventory/adjust', { method: 'POST', json: payload }),
    undefined,
  )
}

export async function writeoffStock(payload: unknown) {
  return withMock(
    () => api<void>('/inventory/writeoff', { method: 'POST', json: payload }),
    undefined,
  )
}

export async function fetchBatches(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString()
  return withMock(
    () => api<BatchRow[]>(`/batches${q ? `?${q}` : ''}`),
    mockBatches,
  )
}

export type BatchRow = {
  id: string
  product: string
  location: string
  manufactured: string
  expires: string
  daysLeft: number
  quantity: number
  status: 'active' | 'quarantined' | 'expired'
}

export type TraceEvent = {
  event: string
  user: string
  at: string
  location: string
  qty?: number
}

const mockBatches: BatchRow[] = [
  {
    id: 'B-9012',
    product: 'IV Saline 500ml',
    location: 'Cold Store',
    manufactured: '2025-01-10',
    expires: '2026-10-21',
    daysLeft: 3,
    quantity: 120,
    status: 'active',
  },
  {
    id: 'B-9105',
    product: 'Insulin Glargine 100U',
    location: 'Pharmacy Fridge',
    manufactured: '2025-04-12',
    expires: '2026-10-21',
    daysLeft: 3,
    quantity: 45,
    status: 'active',
  },
  {
    id: 'B-9106',
    product: 'Amoxicillin 500mg',
    location: 'Warehouse A',
    manufactured: '2025-02-15',
    expires: '2026-10-21',
    daysLeft: 3,
    quantity: 200,
    status: 'active',
  },
  {
    id: 'B-9120',
    product: 'Propofol 20ml',
    location: 'Cold Store',
    manufactured: '2025-05-01',
    expires: '2026-10-24',
    daysLeft: 6,
    quantity: 60,
    status: 'active',
  },
  {
    id: 'B-9121',
    product: 'Epinephrine 1mg/ml',
    location: 'ER Bay',
    manufactured: '2025-03-10',
    expires: '2026-10-24',
    daysLeft: 6,
    quantity: 30,
    status: 'active',
  },
  {
    id: 'B-9204',
    product: 'Surgical Gloves (L)',
    location: 'Warehouse A',
    manufactured: '2025-06-15',
    expires: '2026-10-28',
    daysLeft: 10,
    quantity: 350,
    status: 'active',
  },
  {
    id: 'B-9250',
    product: 'Paracetamol IV 10mg/ml',
    location: 'Warehouse B',
    manufactured: '2025-07-20',
    expires: '2026-10-31',
    daysLeft: 13,
    quantity: 180,
    status: 'active',
  },
  {
    id: 'B-9251',
    product: 'Sterile Gauze Roll 4"',
    location: 'Clinic North',
    manufactured: '2025-01-05',
    expires: '2026-10-31',
    daysLeft: 13,
    quantity: 240,
    status: 'active',
  },
  {
    id: 'B-9310',
    product: 'Heparin Sodium 5000U',
    location: 'Cold Store',
    manufactured: '2025-08-14',
    expires: '2026-11-08',
    daysLeft: 21,
    quantity: 85,
    status: 'active',
  },
  {
    id: 'B-9380',
    product: 'Ceftriaxone 1g',
    location: 'Pharmacy Fridge',
    manufactured: '2025-09-01',
    expires: '2026-11-15',
    daysLeft: 28,
    quantity: 110,
    status: 'active',
  },
  {
    id: 'B-9440',
    product: 'Atropine Sulfate',
    location: 'ER Bay',
    manufactured: '2025-06-01',
    expires: '2026-12-05',
    daysLeft: 48,
    quantity: 95,
    status: 'active',
  },
  {
    id: 'B-9520',
    product: 'Salbutamol Inhaler',
    location: 'Warehouse B',
    manufactured: '2025-08-10',
    expires: '2026-12-28',
    daysLeft: 71,
    quantity: 140,
    status: 'active',
  },
  {
    id: 'B-9600',
    product: 'Morphine Sulfate 10mg',
    location: 'Pharmacy Fridge',
    manufactured: '2025-10-01',
    expires: '2027-01-12',
    daysLeft: 86,
    quantity: 40,
    status: 'quarantined',
  },
  {
    id: 'B-7701',
    product: 'N95 Respirator Mask',
    location: 'Warehouse A',
    manufactured: '2025-10-15',
    expires: '2027-06-01',
    daysLeft: 226,
    quantity: 800,
    status: 'active',
  },
  {
    id: 'B-7720',
    product: 'Syringe 10ml Luer Lock',
    location: 'Warehouse A',
    manufactured: '2025-11-20',
    expires: '2027-11-15',
    daysLeft: 393,
    quantity: 1200,
    status: 'active',
  },
  {
    id: 'B-8844',
    product: 'Insulin Vial 10ml',
    location: 'Pharmacy Fridge',
    manufactured: '2024-11-02',
    expires: '2026-10-12',
    daysLeft: -6,
    quantity: 12,
    status: 'expired',
  },
  {
    id: 'B-8845',
    product: 'Dextrose 50% Infusion',
    location: 'Cold Store',
    manufactured: '2024-10-15',
    expires: '2026-10-12',
    daysLeft: -6,
    quantity: 35,
    status: 'expired',
  },
  {
    id: 'B-7021',
    product: 'Suture Silk 3-0',
    location: 'Warehouse B',
    manufactured: '2024-09-01',
    expires: '2026-10-03',
    daysLeft: -15,
    quantity: 50,
    status: 'quarantined',
  },
]

export async function quarantineBatch(id: string) {
  return withMock(
    () => api<void>(`/batches/${id}/quarantine`, { method: 'PATCH' }),
    undefined,
  )
}

export async function releaseBatch(id: string) {
  return withMock(
    () => api<void>(`/batches/${id}/release`, { method: 'PATCH' }),
    undefined,
  )
}

export async function traceBatch(id: string) {
  return withMock(
    () =>
      api<TraceEvent[]>(
        `/batches/${id}/trace`,
      ),
    [
      { event: 'Received', user: 'James Okon', at: '2025-01-12 09:15', location: 'Dock Bay 2 / Cold Store', qty: 150 },
      { event: 'Transferred', user: 'Maria Chen', at: '2025-04-18 14:30', location: 'Cold Store -> Pharmacy Fridge', qty: 150 },
      { event: 'Picked', user: 'David Kim', at: '2025-07-22 11:05', location: 'Pharmacy Shelf B-2', qty: 30 },
      { event: 'Sold', user: 'Sarah Jenkins', at: '2025-09-14 16:45', location: 'Outpatient Dispensing', qty: 25 },
      { event: 'Expired', user: 'Auto-Audit System', at: '2026-10-18 00:01', location: 'Pharmacy Fridge', qty: 95 },
    ],
  )
}

export async function suggestTransfer(payload: unknown) {
  return withMock(
    () =>
      api<
        { location: string; distanceKm: number; available: number; score: number }[]
      >('/transfers/suggest', { method: 'POST', json: payload }),
    [
      { location: 'Warehouse A', distanceKm: 12, available: 200, score: 87 },
      { location: 'Warehouse B', distanceKm: 28, available: 150, score: 72 },
      { location: 'Cold Store', distanceKm: 5, available: 40, score: 65 },
    ],
  )
}

export async function createTransfer(payload: unknown) {
  const newId = `TR-${String(Math.floor(2500 + Math.random() * 7000))}`
  const p = payload as Partial<TransferCard> & { product?: string; quantity?: number; batches?: TransferBatch[] }
  const newCard: TransferCard = {
    id: p?.id || newId,
    status: p?.status || 'pending_approval',
    source: p?.source || 'Warehouse A',
    destination: p?.destination || 'Clinic North',
    productCount: p?.productCount || (p?.items ? p.items.length : 1),
    totalUnits: p?.totalUnits || p?.quantity || 50,
    urgency: p?.urgency || 'normal',
    createdAt: 'Just now',
    items: p?.items || (p?.product ? [{ product: p.product, qty: p.quantity || 50 }] : [{ product: 'Medical Supplies', qty: 50 }]),
    batches: p?.batches || [],
    timeline: [
      { status: 'Drafted & Submitted', timestamp: 'Just now', user: 'Staff' },
    ],
  }
  return withMock(
    () => api<{ id: string }>('/transfers', { method: 'POST', json: payload }),
    { id: newCard.id },
  ).then((res) => {
    mockTransferCards.unshift(newCard)
    return res
  })
}

export async function fetchTransfers() {
  return withMock(
    () => api<TransferCard[]>('/transfers'),
    mockTransferCards,
  )
}

export type TransferItem = {
  product: string
  sku?: string
  qty: number
}

export type TransferBatch = {
  batchId: string
  expiry: string
  qty: number
  daysLeft?: number
}

export type TransferTimelineEvent = {
  status: string
  timestamp: string
  user?: string
  note?: string
}

export type TransferCard = {
  id: string
  status: 'suggested' | 'pending_approval' | 'in_transit' | 'completed'
  source: string
  destination: string
  productCount: number
  urgency: 'critical' | 'normal'
  cancelled?: boolean
  totalUnits?: number
  items?: TransferItem[]
  batches?: TransferBatch[]
  dispatched?: boolean
  rejectionReason?: string
  createdAt?: string
  timeline?: TransferTimelineEvent[]
}

const mockTransferCards: TransferCard[] = [
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
      { product: 'N95 Respirator', sku: 'SKU-1199', qty: 100 },
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
        note: 'Clinic North projected to stock out in 48 hours.',
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
      { product: 'Insulin Glargine 100U', sku: 'SKU-4401', qty: 45 },
    ],
    batches: [
      { batchId: 'B-9105', expiry: '2026-10-21', qty: 45, daysLeft: 3 },
    ],
    timeline: [
      {
        status: 'FEFO Surplus Alert',
        timestamp: '45 mins ago',
        user: 'FEFO Optimizer',
        note: 'Batch B-9105 expiring in 3 days; redirect to high-turnover pharmacy.',
      },
    ],
  },
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
      { product: 'N95 Respirator', sku: 'SKU-1199', qty: 100 },
      { product: 'Surgical Gloves (L)', sku: 'SKU-1042', qty: 60 },
      { product: 'IV Saline 500ml', sku: 'SKU-2088', qty: 40 },
    ],
    batches: [
      { batchId: 'B-7701', expiry: '2026-06-15', qty: 100, daysLeft: 240 },
      { batchId: 'B-9204', expiry: '2026-10-28', qty: 60, daysLeft: 10 },
      { batchId: 'B-9012', expiry: '2026-10-21', qty: 40, daysLeft: 3 },
    ],
    timeline: [
      {
        status: 'Drafted',
        timestamp: '1 hour ago',
        user: 'Maria Chen',
      },
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
      { product: 'IV Saline 500ml', sku: 'SKU-2088', qty: 45 },
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
      { product: 'IV Saline 500ml', sku: 'SKU-2088', qty: 40 },
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
        note: 'Loaded on Transit Van #4. ETA 20 mins.',
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
    dispatched: false,
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
        status: 'Staged for Dispatch',
        timestamp: '4 hours ago',
        user: 'Warehouse A Staff',
        note: 'Staged at Bay 2 waiting for courier dispatch.',
      },
    ],
  },
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
]

export async function patchTransfer(id: string, action: string, body?: unknown) {
  return withMock(
    () =>
      api<void>(`/transfers/${id}/${action}`, {
        method: 'PATCH',
        json: body,
      }),
    undefined,
  ).then(() => {
    const card = mockTransferCards.find((c) => c.id === id)
    if (!card) return
    const now = 'Just now'
    if (action === 'approve') {
      card.status = 'in_transit'
      card.timeline = [
        ...(card.timeline || []),
        { status: 'Approved', timestamp: now, user: 'Manager' },
      ]
    } else if (action === 'reject') {
      card.status = 'completed'
      card.cancelled = true
      const reason = (body as { reason?: string })?.reason || 'Transfer rejected by manager'
      card.rejectionReason = reason
      card.timeline = [
        ...(card.timeline || []),
        { status: 'Rejected', timestamp: now, user: 'Manager', note: reason },
      ]
    } else if (action === 'dispatch') {
      card.dispatched = true
      card.timeline = [
        ...(card.timeline || []),
        { status: 'Dispatched', timestamp: now, user: 'Source Staff', note: 'En route to destination' },
      ]
    } else if (action === 'receive') {
      card.status = 'completed'
      card.timeline = [
        ...(card.timeline || []),
        { status: 'Received', timestamp: now, user: 'Destination Staff', note: 'Received and added to local inventory' },
      ]
    } else if (action === 'submit_approval') {
      card.status = 'pending_approval'
      card.timeline = [
        ...(card.timeline || []),
        { status: 'Submitted for Approval', timestamp: now, user: 'Staff' },
      ]
    }
  })
}

export async function verifyAuditChain() {
  return withMock(
    () => api<{ valid: boolean; count: number; brokenAt?: number }>('/audit/verify'),
    { valid: true, count: 15847 },
  )
}

export async function fetchAuditLogs(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString()
  return withMock(
    () => api<AuditEvent[]>(`/audit/logs${q ? `?${q}` : ''}`),
    mockAudit,
  )
}

export type AuditEvent = {
  sequence: number
  type: string
  user: string
  ipHash: string
  at: string
  hash: string
  prevHash: string
  diff: { before: unknown; after: unknown }
}

const mockAudit: AuditEvent[] = [
  {
    sequence: 15847,
    type: 'STOCK_ADJUST',
    user: 'Maria Chen',
    ipHash: 'a3f2…9b1c',
    at: '2026-09-30 09:01',
    hash: 'sha512:abc…def',
    prevHash: 'sha512:999…888',
    diff: { before: { qty: 100 }, after: { qty: 120 } },
  },
]

export async function fetchUsers() {
  return withMock(
    () => api<{ name: string; email: string; role: string; status: string; lastLogin: string; locations: string[] }[]>('/users'),
    [
      {
        name: 'Maria Chen',
        email: 'maria.chen@example.com',
        role: 'Admin',
        status: 'Active',
        lastLogin: '2026-09-30',
        locations: ['Warehouse A', 'Cold Store'],
      },
    ],
  )
}

export async function inviteUser(payload: unknown) {
  return withMock(
    () => api<void>('/users/invite', { method: 'POST', json: payload }),
    undefined,
  )
}

export async function syncPush(payload: unknown) {
  return withMock(
    () => api<{ synced: number; conflicts: number }>('/sync/push', { method: 'POST', json: payload }),
    { synced: 2, conflicts: 1 },
  )
}
