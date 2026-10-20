export const inventoryRows = [
  {
    id: '1',
    sku: 'SKU-1042',
    product: 'Surgical Gloves (L)',
    category: 'PPE',
    location: 'Warehouse A',
    quantity: 420,
    reorder: 200,
    status: 'In Stock' as const,
  },
  {
    id: '2',
    sku: 'SKU-2088',
    product: 'IV Saline 500ml',
    category: 'Fluids',
    location: 'Cold Store',
    quantity: 48,
    reorder: 100,
    status: 'Low Stock' as const,
  },
  {
    id: '3',
    sku: 'SKU-3310',
    product: 'Bandage Roll 4"',
    category: 'Wound Care',
    location: 'Warehouse B',
    quantity: 0,
    reorder: 50,
    status: 'Out of Stock' as const,
  },
  {
    id: '4',
    sku: 'SKU-1199',
    product: 'N95 Respirator',
    category: 'PPE',
    location: 'Warehouse A',
    quantity: 890,
    reorder: 300,
    status: 'In Stock' as const,
  },
]

export const batchRows = [
  {
    id: 'B-9012',
    product: 'IV Saline 500ml',
    location: 'Cold Store',
    mfg: '2025-01-10',
    expiry: '2026-04-15',
    daysLeft: 45,
    qty: 120,
    fefo: 'Warning' as const,
  },
  {
    id: 'B-8844',
    product: 'Insulin Vial',
    location: 'Pharmacy Fridge',
    mfg: '2024-11-02',
    expiry: '2025-10-01',
    daysLeft: -1,
    qty: 12,
    fefo: 'Expired' as const,
  },
  {
    id: 'B-7701',
    product: 'Surgical Gloves (L)',
    location: 'Warehouse A',
    mfg: '2025-06-01',
    expiry: '2027-06-01',
    daysLeft: 640,
    qty: 500,
    fefo: 'Good' as const,
  },
]

export const transfers = [
  {
    id: 'TR-2401',
    from: 'Warehouse A',
    to: 'Clinic North',
    product: 'N95 Respirator',
    qty: 200,
    date: '2026-09-28',
    status: 'Pending' as const,
    by: 'Maria Chen',
    reason: 'Seasonal demand spike at north clinic.',
  },
  {
    id: 'TR-2398',
    from: 'Cold Store',
    to: 'ER Bay 3',
    product: 'IV Saline 500ml',
    qty: 40,
    date: '2026-09-27',
    status: 'Approved' as const,
    by: 'James Okon',
    reason: 'Emergency restock.',
  },
  {
    id: 'TR-2390',
    from: 'Warehouse B',
    to: 'Warehouse A',
    product: 'Bandage Roll 4"',
    qty: 100,
    date: '2026-09-25',
    status: 'Rejected' as const,
    by: 'Priya Nair',
    reason: 'Duplicate request — stock already in transit.',
  },
]

export const users = [
  {
    name: 'Maria Chen',
    email: 'maria.chen@example.com',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2026-09-30 08:12',
  },
  {
    name: 'James Okon',
    email: 'james.okon@example.com',
    role: 'Warehouse Manager',
    status: 'Active',
    lastLogin: '2026-09-29 17:44',
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    role: 'Auditor',
    status: 'Invited',
    lastLogin: '—',
  },
]

export const stockChart = [
  { name: 'PPE', value: 4200 },
  { name: 'Fluids', value: 1800 },
  { name: 'Wound', value: 950 },
  { name: 'Pharma', value: 3100 },
  { name: 'Devices', value: 1200 },
]

export const expiryChart = [
  { month: 'Oct', count: 12 },
  { month: 'Nov', count: 28 },
  { month: 'Dec', count: 45 },
  { month: 'Jan', count: 18 },
  { month: 'Feb', count: 8 },
  { month: 'Mar', count: 22 },
]
