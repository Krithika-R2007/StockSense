import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Check,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Hash,
  Link as LinkIcon,
  Copy,
  CheckCheck,
  Globe,
  User as UserIcon,
  Clock,
  Eye,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  FileCode,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Drawer } from '../components/ui/Drawer'
import { Pagination } from '../components/ui/Pagination'
import { PageHeader } from '../components/layout/PageHeader'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export type ActionType =
  | 'Created'
  | 'Updated'
  | 'Deleted'
  | 'Transferred'
  | 'Received'
  | 'Adjusted'

export type EntityType = 'Product' | 'Batch' | 'Transfer' | 'PO' | 'User'

export interface FieldDiff {
  field: string
  label: string
  before: string | number | boolean | null
  after: string | number | boolean | null
}

export interface AuditRecord {
  id: string
  sequence: number
  timestamp: string // ISO string
  action: ActionType
  entityType: EntityType
  entityName: string
  entityId: string
  user: {
    name: string
    email: string
    role: string
    avatarColor: string
  }
  ipAddress: string
  hash: string // 64 hex chars (SHA-256)
  prevHash: string // 64 hex chars
  diffs?: FieldDiff[]
  reason?: string
  userAgent?: string
}

// ---------------------------------------------------------------------------
// 15 MOCK AUDIT EVENTS (Cryptographically linked in chronological order 1..15)
// Displayed newest first (15 down to 1), each prevHash = hash of previous block.
// Genesis block (1) has prevHash of 64 zeroes.
// ---------------------------------------------------------------------------
const INITIAL_AUDIT_DATA: AuditRecord[] = [
  {
    id: 'evt-15',
    sequence: 15,
    timestamp: '2026-10-18T14:32:10Z',
    action: 'Adjusted',
    entityType: 'Product',
    entityName: 'Laptop Pro 15',
    entityId: 'PROD-1092',
    user: {
      name: 'Maria Chen',
      email: 'maria.chen@acme-logistics.com',
      role: 'Senior Inventory Manager',
      avatarColor: 'bg-blue-600',
    },
    ipAddress: '192.168.1.42',
    hash: 'c3aabd839576caaf57b95c988196d7c62a835062eca3b3ba52d354fe4aa4d1d7',
    prevHash: 'e0e25552b9ce1889c9af4807e148bf689bd9848a5147338863405a65026ea000',
    diffs: [
      { field: 'stockOnHand', label: 'Stock on Hand', before: 124, after: 118 },
      { field: 'reorderPoint', label: 'Reorder Safety Point', before: 50, after: 75 },
      { field: 'unitValue', label: 'Carrying Value', before: '$1,299.00', after: '$1,249.00' },
    ],
    reason: 'Cycle count physical reconciliation & reorder buffer buffer update for Q4 peak',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36',
  },
  {
    id: 'evt-14',
    sequence: 14,
    timestamp: '2026-10-18T11:15:00Z',
    action: 'Transferred',
    entityType: 'Transfer',
    entityName: 'Transfer #TR-8842',
    entityId: 'TR-8842',
    user: {
      name: 'David Kim',
      email: 'david.kim@acme-logistics.com',
      role: 'Logistics Coordinator',
      avatarColor: 'bg-emerald-600',
    },
    ipAddress: '10.0.12.8',
    hash: 'e0e25552b9ce1889c9af4807e148bf689bd9848a5147338863405a65026ea000',
    prevHash: 'a625bab21229faf1d8eaa7379d1c2c97533a5904d93c28af50b1bcbc72f8c3bd',
    diffs: [
      { field: 'originBay', label: 'Origin Location', before: 'Warehouse A - Bay 4', after: 'In Transit - Fleet #42' },
      { field: 'targetBay', label: 'Destination', before: 'Pending Dispatch', after: 'Cold Store Hub - Zone B' },
      { field: 'transferStatus', label: 'Transfer State', before: 'Pending Verification', after: 'Dispatched & Tracked' },
      { field: 'unitsMoved', label: 'Manifest Quantity', before: 0, after: 450 },
    ],
    reason: 'Urgent inter-facility cold-chain replenishment for emergency stock reserve',
    userAgent: 'HandheldScannerOS/3.4 (Honeywell CT40; Build/QP1A.190711.020)',
  },
  {
    id: 'evt-13',
    sequence: 13,
    timestamp: '2026-10-17T18:45:22Z',
    action: 'Received',
    entityType: 'PO',
    entityName: 'PO #PO-2026-0492 (MedSupply Global)',
    entityId: 'PO-0492',
    user: {
      name: 'Marcus Brody',
      email: 'm.brody@acme-logistics.com',
      role: 'Receiving Dock Lead',
      avatarColor: 'bg-purple-600',
    },
    ipAddress: '192.168.1.109',
    hash: 'a625bab21229faf1d8eaa7379d1c2c97533a5904d93c28af50b1bcbc72f8c3bd',
    prevHash: 'c5c71abc7010bc9f6c83e9fa8896589af40c92750a5dbac7d87077ea02cabec9',
    diffs: [
      { field: 'deliveryStatus', label: 'Fulfillment State', before: 'Awaiting Inbound Dock', after: 'Received & Inspected' },
      { field: 'receivedUnits', label: 'Total Units Checked', before: 0, after: 1200 },
      { field: 'qcPassed', label: 'QA Manifest Signoff', before: 'false', after: 'true (Pass)' },
      { field: 'dockBay', label: 'Dock Inbound Bay', before: 'Unassigned', after: 'Bay 7 - Cold Intake' },
    ],
    reason: 'Full shipment verified against carrier manifest; datalogger temperatures within specs',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
  },
  {
    id: 'evt-12',
    sequence: 12,
    timestamp: '2026-10-17T15:20:00Z',
    action: 'Updated',
    entityType: 'Batch',
    entityName: 'Batch #B2026-884 (Amoxicillin 500mg)',
    entityId: 'BAT-884',
    user: {
      name: 'Dr. Elena Rostova',
      email: 'elena.rostova@acme-logistics.com',
      role: 'Quality Assurance Director',
      avatarColor: 'bg-rose-600',
    },
    ipAddress: '172.16.0.45',
    hash: 'c5c71abc7010bc9f6c83e9fa8896589af40c92750a5dbac7d87077ea02cabec9',
    prevHash: '1be4a65ba31133da4bf3a17d879094d661b8eeff66552bfd52756763d30cf7c5',
    diffs: [
      { field: 'expiryDate', label: 'Lot Expiry Date', before: '2026-11-30', after: '2027-02-28' },
      { field: 'quarantineHold', label: 'Quarantine Lock', before: 'Active (Locked)', after: 'Released (Clear)' },
      { field: 'stabilityCert', label: 'Stability Certificate', before: 'Pending Review', after: 'CERT-QA-8849-PASS' },
    ],
    reason: 'Approved shelf-life extension protocol following 24-month accelerated degradation testing',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  },
  {
    id: 'evt-11',
    sequence: 11,
    timestamp: '2026-10-16T16:10:45Z',
    action: 'Updated',
    entityType: 'User',
    entityName: 'User: Sarah Jenkins',
    entityId: 'USR-304',
    user: {
      name: 'Maria Chen',
      email: 'maria.chen@acme-logistics.com',
      role: 'Senior Inventory Manager',
      avatarColor: 'bg-blue-600',
    },
    ipAddress: '192.168.1.42',
    hash: '1be4a65ba31133da4bf3a17d879094d661b8eeff66552bfd52756763d30cf7c5',
    prevHash: 'b157cfc48b56e6ab3159e3f3f50d4aaf30f50575f2ff6bccdeff954a0f5489c4',
    diffs: [
      { field: 'systemRole', label: 'Access Level', before: 'Warehouse Operator', after: 'Shift Supervisor' },
      { field: 'authorizedWarehouses', label: 'Facility Access', before: 'DC West Only', after: 'DC West + Cold Store' },
      { field: 'approvalThreshold', label: 'Transfer Approval Limit', before: '$0.00', after: '$25,000.00' },
    ],
    reason: 'Role elevation following supervisory certification and security clearance review',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36',
  },
  {
    id: 'evt-10',
    sequence: 10,
    timestamp: '2026-10-16T09:05:12Z',
    action: 'Created',
    entityType: 'Product',
    entityName: 'Wireless Barcode Scanner X-200',
    entityId: 'PROD-2041',
    user: {
      name: 'Alex Rivera',
      email: 'alex.rivera@acme-logistics.com',
      role: 'Master Catalog Specialist',
      avatarColor: 'bg-amber-600',
    },
    ipAddress: '10.0.12.19',
    hash: 'b157cfc48b56e6ab3159e3f3f50d4aaf30f50575f2ff6bccdeff954a0f5489c4',
    prevHash: '99e646c658408f96082d2493849d183645710ae3c75048aaa3083c115d999458',
    diffs: [
      { field: 'sku', label: 'Global SKU Code', before: 'null', after: 'SCAN-WLS-X200' },
      { field: 'category', label: 'Inventory Category', before: 'null', after: 'Equipment & Hardware' },
      { field: 'msrp', label: 'MSRP Unit Price', before: 'null', after: '$289.00' },
      { field: 'initialStock', label: 'Initial Baseline Units', before: 'null', after: '40 units' },
    ],
    reason: 'New product introduction into central distribution inventory catalog',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
  },
  {
    id: 'evt-9',
    sequence: 9,
    timestamp: '2026-10-15T19:30:00Z',
    action: 'Deleted',
    entityType: 'PO',
    entityName: 'PO #PO-2026-0488 (Cancelled Order)',
    entityId: 'PO-0488',
    user: {
      name: 'Liam Thorne',
      email: 'liam.thorne@acme-logistics.com',
      role: 'Procurement Officer',
      avatarColor: 'bg-indigo-600',
    },
    ipAddress: '192.168.1.88',
    hash: '99e646c658408f96082d2493849d183645710ae3c75048aaa3083c115d999458',
    prevHash: '9d343ac51eae28c8683c0d107d566ff166e6feabe1dc296608a9e1e460be1161',
    diffs: [
      { field: 'orderStatus', label: 'Order State', before: 'Draft Pending', after: 'Voided & Purged' },
      { field: 'committedTotal', label: 'Committed PO Amount', before: '$14,200.00', after: '$0.00' },
      { field: 'lineItems', label: 'Line Item Count', before: '3 SKUs (150 units)', after: 'None (Purged)' },
    ],
    reason: 'Duplicate purchase order entry cancelled prior to electronic supplier EDI transmission',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0',
  },
  {
    id: 'evt-8',
    sequence: 8,
    timestamp: '2026-10-15T13:40:19Z',
    action: 'Adjusted',
    entityType: 'Batch',
    entityName: 'Batch #B2026-902 (Lithium Batteries)',
    entityId: 'BAT-902',
    user: {
      name: 'David Kim',
      email: 'david.kim@acme-logistics.com',
      role: 'Logistics Coordinator',
      avatarColor: 'bg-emerald-600',
    },
    ipAddress: '10.0.12.8',
    hash: '9d343ac51eae28c8683c0d107d566ff166e6feabe1dc296608a9e1e460be1161',
    prevHash: '0a04ba15338b499734431862cbedb8dbef2e4dd209bac10eef3cf6468a0cfc4b',
    diffs: [
      { field: 'activeUnits', label: 'Available Inventory', before: 500, after: 475 },
      { field: 'quarantinedDamaged', label: 'Isolated Packaging Damage', before: 0, after: 25 },
      { field: 'hazmatAuditScore', label: 'Safety Compliance Check', before: 'Pending Inspection', after: 'Compliant' },
    ],
    reason: 'Mandatory hazmat safety audit; 25 units with dented exterior casings isolated to quarantine',
    userAgent: 'HandheldScannerOS/3.4 (Honeywell CT40)',
  },
  {
    id: 'evt-7',
    sequence: 7,
    timestamp: '2026-10-14T17:12:00Z',
    action: 'Created',
    entityType: 'Transfer',
    entityName: 'Transfer #TR-8819',
    entityId: 'TR-8819',
    user: {
      name: 'Marcus Brody',
      email: 'm.brody@acme-logistics.com',
      role: 'Receiving Dock Lead',
      avatarColor: 'bg-purple-600',
    },
    ipAddress: '192.168.1.109',
    hash: '0a04ba15338b499734431862cbedb8dbef2e4dd209bac10eef3cf6468a0cfc4b',
    prevHash: 'f7af1379f80b9b6e164e108a1e1f7cd4bed96b6f38c258f7f8cb66e575d213dd',
    diffs: [
      { field: 'dispatchOrigin', label: 'Origin Facility', before: 'null', after: 'Main Distribution Center' },
      { field: 'receivingLocation', label: 'Destination Clinic', before: 'null', after: 'Regional Pharmacy A' },
      { field: 'allocatedCarrier', label: 'Assigned Carrier', before: 'null', after: 'ExpressFleet Global #EF-994' },
      { field: 'transferPriority', label: 'Fulfillment Urgency', before: 'null', after: 'Expedited (Same Day)' },
    ],
    reason: 'Generated urgent transfer order for critical medication restock request',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: 'evt-6',
    sequence: 6,
    timestamp: '2026-10-14T10:22:33Z',
    action: 'Updated',
    entityType: 'Product',
    entityName: 'Ergonomic Office Chair V2',
    entityId: 'PROD-0883',
    user: {
      name: 'Alex Rivera',
      email: 'alex.rivera@acme-logistics.com',
      role: 'Master Catalog Specialist',
      avatarColor: 'bg-amber-600',
    },
    ipAddress: '10.0.12.19',
    hash: 'f7af1379f80b9b6e164e108a1e1f7cd4bed96b6f38c258f7f8cb66e575d213dd',
    prevHash: '8466699e3e533e301e1e945a63d177be03efa90c8a17dd0628eba9770f15fd23',
    diffs: [
      { field: 'unitPrice', label: 'Wholesale Price', before: '$349.00', after: '$319.00' },
      { field: 'leadTimeDays', label: 'Supplier Lead Time', before: '14 days', after: '7 days' },
      { field: 'preferredVendor', label: 'Primary Supplier', before: 'OfficeWorks Ltd', after: 'ErgoDynamic Direct' },
    ],
    reason: 'Direct manufacturer pricing tier active; contract term amendment #CT-2026-44',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
  },
  {
    id: 'evt-5',
    sequence: 5,
    timestamp: '2026-10-13T14:05:00Z',
    action: 'Created',
    entityType: 'User',
    entityName: 'User: Carlos Mendez',
    entityId: 'USR-305',
    user: {
      name: 'Maria Chen',
      email: 'maria.chen@acme-logistics.com',
      role: 'Senior Inventory Manager',
      avatarColor: 'bg-blue-600',
    },
    ipAddress: '192.168.1.42',
    hash: '8466699e3e533e301e1e945a63d177be03efa90c8a17dd0628eba9770f15fd23',
    prevHash: 'e6953725efab8f1bd813de7c0f7d223e73610c858c7bb6fc741d5d336a3e473a',
    diffs: [
      { field: 'userAccount', label: 'Account Status', before: 'null', after: 'Active & Verified' },
      { field: 'assignedRole', label: 'Base Role', before: 'null', after: 'Warehouse Associate' },
      { field: 'facilities', label: 'Permitted Facilities', before: 'null', after: 'Distribution Center West' },
      { field: 'mfaEnforced', label: 'Hardware MFA Key', before: 'null', after: 'Enforced (YubiKey 5)' },
    ],
    reason: 'New employee onboarding checklist completed; compliance training signed',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36',
  },
  {
    id: 'evt-4',
    sequence: 4,
    timestamp: '2026-10-12T16:48:10Z',
    action: 'Received',
    entityType: 'Transfer',
    entityName: 'Transfer #TR-8790',
    entityId: 'TR-8790',
    user: {
      name: 'Sarah Jenkins',
      email: 'sarah.j@acme-logistics.com',
      role: 'Shift Supervisor',
      avatarColor: 'bg-teal-600',
    },
    ipAddress: '10.0.14.51',
    hash: 'e6953725efab8f1bd813de7c0f7d223e73610c858c7bb6fc741d5d336a3e473a',
    prevHash: '9c09573974e3fed1f77b4d637cf5dd909678951821e1786372ad9d372e77b97b',
    diffs: [
      { field: 'transferStatus', label: 'Transit State', before: 'In Transit', after: 'Delivered & Shelved' },
      { field: 'receivedTimestamp', label: 'Arrival Seal Verification', before: 'null', after: '2026-10-12 16:45:00 UTC' },
      { field: 'receivingCustodian', label: 'Dock Custodian', before: 'Unassigned', after: 'Sarah Jenkins (#USR-304)' },
      { field: 'storageLocation', label: 'Assigned Aisle/Shelf', before: 'In Transit', after: 'Aisle 04 - Shelf B2' },
    ],
    reason: 'Inter-facility transfer received at Cold Store Hub; physical count matches electronic BOL',
    userAgent: 'HandheldScannerOS/3.4 (Honeywell CT40)',
  },
  {
    id: 'evt-3',
    sequence: 3,
    timestamp: '2026-10-11T11:20:44Z',
    action: 'Created',
    entityType: 'PO',
    entityName: 'PO #PO-2026-0480 (BioMed Corp)',
    entityId: 'PO-0480',
    user: {
      name: 'Liam Thorne',
      email: 'liam.thorne@acme-logistics.com',
      role: 'Procurement Officer',
      avatarColor: 'bg-indigo-600',
    },
    ipAddress: '192.168.1.88',
    hash: '9c09573974e3fed1f77b4d637cf5dd909678951821e1786372ad9d372e77b97b',
    prevHash: 'de937b9460d7ae17c4a9c5851b7f78f4638430a6387afa49c3d73c71706a128c',
    diffs: [
      { field: 'totalValue', label: 'Gross Purchase Commitment', before: 'null', after: '$54,800.00' },
      { field: 'paymentTerms', label: 'Supplier Terms', before: 'null', after: 'Net 30' },
      { field: 'targetDeliveryDate', label: 'Contracted Delivery SLA', before: 'null', after: '2026-11-01' },
      { field: 'itemCount', label: 'Total Catalog Units', before: 'null', after: '8,000 units' },
    ],
    reason: 'Quarterly contractual bulk order replenishment for central pharmaceutical stock',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0',
  },
  {
    id: 'evt-2',
    sequence: 2,
    timestamp: '2026-10-11T09:15:30Z',
    action: 'Updated',
    entityType: 'Product',
    entityName: 'Surgical Gloves Nitrile L',
    entityId: 'PROD-0145',
    user: {
      name: 'David Kim',
      email: 'david.kim@acme-logistics.com',
      role: 'Logistics Coordinator',
      avatarColor: 'bg-emerald-600',
    },
    ipAddress: '10.0.12.8',
    hash: 'de937b9460d7ae17c4a9c5851b7f78f4638430a6387afa49c3d73c71706a128c',
    prevHash: '8857e8d6e7d5ac40cc707a39cfadf9b1c31d431956e1ea9f45f8ad123b97ab7d',
    diffs: [
      { field: 'storageCondition', label: 'Storage Climate Requirement', before: 'Ambient (Unregulated)', after: 'Climate Controlled (15-25°C)' },
      { field: 'gtinBarcode', label: 'GTIN-12 Scan Barcode', before: '079357318892', after: '079357318899' },
      { field: 'fdaRegistration', label: 'FDA Medical Device Class', before: 'Class I Standard', after: 'Class I Exempt #FDA-9921' },
    ],
    reason: 'Updated FDA regulatory storage guideline requirements and revised manufacturer GS1 barcode',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
  },
  {
    id: 'evt-1',
    sequence: 1,
    timestamp: '2026-10-10T08:00:00Z',
    action: 'Created',
    entityType: 'Product',
    entityName: 'System Genesis & Master Ledger Initialization',
    entityId: 'SYS-GENESIS',
    user: {
      name: 'System Root Authority',
      email: 'root@acme-logistics.internal',
      role: 'Cryptographic Ledger Daemon',
      avatarColor: 'bg-slate-800',
    },
    ipAddress: '127.0.0.1',
    hash: '8857e8d6e7d5ac40cc707a39cfadf9b1c31d431956e1ea9f45f8ad123b97ab7d',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    diffs: [
      { field: 'merkleRoot', label: 'Merkle Genesis Seed', before: 'null', after: '0x58f793b8214fa89c44019a8e' },
      { field: 'chainAlgorithm', label: 'Cryptographic Standard', before: 'null', after: 'SHA-256 with Merkle Tree chaining' },
      { field: 'ledgerState', label: 'Immutability Lock', before: 'Uninitialized', after: 'Active & Enforced' },
    ],
    reason: 'Genesis audit block initialization: immutable cryptographic chain standard instantiated',
    userAgent: 'LedgerCore/2.1.0-alpha (x86_64-pc-linux-gnu; Kernel 6.6.14-enterprise)',
  },
]

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------
function formatEventDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatEventTime(iso: string) {
  try {
    const d = new Date(iso)
    return (
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' UTC'
    )
  } catch {
    return ''
  }
}

function getActionChipTone(action: ActionType) {
  switch (action) {
    case 'Created':
      return 'good'
    case 'Received':
      return 'good'
    case 'Updated':
      return 'info'
    case 'Transferred':
      return 'neutral'
    case 'Adjusted':
      return 'warning'
    case 'Deleted':
      return 'expired'
    default:
      return 'neutral'
  }
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export function AuditLogPage() {
  const { toast } = useToast()

  // State
  const [events, setEvents] = useState<AuditRecord[]>(INITIAL_AUDIT_DATA)
  const [selectedEvent, setSelectedEvent] = useState<AuditRecord | null>(null)
  const [isTamperSimulated, setIsTamperSimulated] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('ALL')
  const [actionFilter, setActionFilter] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // Chain Verification State
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationProgress, setVerificationProgress] = useState(0)
  const [verifyingBlockIndex, setVerifyingBlockIndex] = useState<number | null>(null)
  const [verifiedEventIds, setVerifiedEventIds] = useState<Set<string>>(new Set())
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verified' | 'broken'>('idle')
  const [brokenAtSequence, setBrokenAtSequence] = useState<number | null>(null)
  const [brokenBlockDetails, setBrokenBlockDetails] = useState<{
    expectedPrev: string
    actualPrev: string
    blockNumber: number
  } | null>(null)

  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Toggle Tamper Simulation
  const handleToggleTamper = () => {
    if (!isTamperSimulated) {
      // Corrupt Block #8's hash
      setEvents((prev) =>
        prev.map((e) =>
          e.sequence === 8
            ? {
                ...e,
                hash: '0xbad00000000000000000000000000000000000000000000000000000deadbeef',
              }
            : e,
        ),
      )
      setIsTamperSimulated(true)
      // Reset verification if it was verified
      if (verificationStatus === 'verified') {
        setVerificationStatus('idle')
        setVerifiedEventIds(new Set())
      }
      toast(
        'Tampering simulated: Block #8 payload hash intentionally modified.',
        'warning',
      )
    } else {
      // Restore valid chain
      setEvents(INITIAL_AUDIT_DATA)
      setIsTamperSimulated(false)
      setVerificationStatus('idle')
      setBrokenAtSequence(null)
      setBrokenBlockDetails(null)
      setVerifiedEventIds(new Set())
      toast('Chain restored to pristine cryptographic baseline.', 'info')
    }
  }

  // Restore chain function for error banner action
  const handleRestoreChain = () => {
    setEvents(INITIAL_AUDIT_DATA)
    setIsTamperSimulated(false)
    setVerificationStatus('idle')
    setBrokenAtSequence(null)
    setBrokenBlockDetails(null)
    setVerifiedEventIds(new Set())
    toast('Corrupted block repaired. Ready for cryptographic re-verification.', 'success')
  }

  // Chain Verification Engine
  const runChainVerification = () => {
    if (isVerifying) return

    setIsVerifying(true)
    setVerificationStatus('idle')
    setBrokenAtSequence(null)
    setBrokenBlockDetails(null)
    setVerifiedEventIds(new Set())
    setVerificationProgress(0)

    // Verification runs in chronological order from Genesis (1) up to 15
    const chronological = [...events].sort((a, b) => a.sequence - b.sequence)
    const totalBlocks = chronological.length
    let currentStep = 0
    const localVerified = new Set<string>()

    if (verificationTimerRef.current) {
      clearInterval(verificationTimerRef.current)
    }

    verificationTimerRef.current = setInterval(() => {
      if (currentStep < totalBlocks) {
        const block = chronological[currentStep]
        setVerifyingBlockIndex(block.sequence)
        setVerificationProgress(Math.round(((currentStep + 1) / totalBlocks) * 100))

        // Cryptographic check: does this block's prevHash match previous block's hash?
        if (currentStep > 0) {
          const prevBlock = chronological[currentStep - 1]
          if (block.prevHash !== prevBlock.hash) {
            // Broken chain detected!
            if (verificationTimerRef.current) {
              clearInterval(verificationTimerRef.current)
            }
            setIsVerifying(false)
            setVerifyingBlockIndex(null)
            setVerificationStatus('broken')
            setBrokenAtSequence(block.sequence)
            setBrokenBlockDetails({
              expectedPrev: prevBlock.hash,
              actualPrev: block.prevHash,
              blockNumber: block.sequence,
            })
            toast(
              `Integrity violation detected! Block #${block.sequence} hash pointer mismatch.`,
              'error',
            )
            return
          }
        } else {
          // Genesis check
          if (block.prevHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
            if (verificationTimerRef.current) {
              clearInterval(verificationTimerRef.current)
            }
            setIsVerifying(false)
            setVerifyingBlockIndex(null)
            setVerificationStatus('broken')
            setBrokenAtSequence(block.sequence)
            toast('Genesis block validation failure!', 'error')
            return
          }
        }

        // Also check if block was deliberately tampered
        if (block.hash.startsWith('0xbad00000000000000000000000000000000000000000000000000000deadbeef')) {
          if (verificationTimerRef.current) {
            clearInterval(verificationTimerRef.current)
          }
          setIsVerifying(false)
          setVerifyingBlockIndex(null)
          setVerificationStatus('broken')
          setBrokenAtSequence(block.sequence)
          setBrokenBlockDetails({
            expectedPrev: '9d343ac51eae28c8683c0d107d566ff166e6feabe1dc296608a9e1e460be1161',
            actualPrev: block.hash,
            blockNumber: block.sequence,
          })
          toast(
            `Tampering detected! Block #${block.sequence} checksum failed cryptographic validation.`,
            'error',
          )
          return
        }

        // Passed this block
        localVerified.add(block.id)
        setVerifiedEventIds(new Set(localVerified))
        currentStep++
      } else {
        // Complete successfully
        if (verificationTimerRef.current) {
          clearInterval(verificationTimerRef.current)
        }
        setIsVerifying(false)
        setVerifyingBlockIndex(null)
        setVerificationStatus('verified')
        toast('Chain integrity verified — no tampering detected.', 'success')
      }
    }, 110)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (verificationTimerRef.current) {
        clearInterval(verificationTimerRef.current)
      }
    }
  }, [])

  // Clipboard copy handler
  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast(`${label} copied to clipboard!`, 'info')
    }
  }

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Search query filter (user name, email, entity name, entity id, action, hash, ip, reason)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesUser =
          evt.user.name.toLowerCase().includes(query) ||
          evt.user.email.toLowerCase().includes(query)
        const matchesEntity =
          evt.entityName.toLowerCase().includes(query) ||
          evt.entityId.toLowerCase().includes(query)
        const matchesAction = evt.action.toLowerCase().includes(query)
        const matchesHash =
          evt.hash.toLowerCase().includes(query) ||
          evt.prevHash.toLowerCase().includes(query)
        const matchesIp = evt.ipAddress.toLowerCase().includes(query)
        const matchesReason = evt.reason?.toLowerCase().includes(query) || false

        if (
          !matchesUser &&
          !matchesEntity &&
          !matchesAction &&
          !matchesHash &&
          !matchesIp &&
          !matchesReason
        ) {
          return false
        }
      }

      // Entity filter
      if (entityFilter !== 'ALL' && evt.entityType !== entityFilter) {
        return false
      }

      // Action filter
      if (actionFilter !== 'ALL' && evt.action !== actionFilter) {
        return false
      }

      // Date Range filters
      if (dateFrom) {
        const eventDay = evt.timestamp.slice(0, 10)
        if (eventDay < dateFrom) return false
      }
      if (dateTo) {
        const eventDay = evt.timestamp.slice(0, 10)
        if (eventDay > dateTo) return false
      }

      return true
    })
  }, [events, searchQuery, entityFilter, actionFilter, dateFrom, dateTo])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, entityFilter, actionFilter, dateFrom, dateTo])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize))
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEvents.slice(start, start + pageSize)
  }, [filteredEvents, currentPage, pageSize])

  const hasActiveFilters =
    searchQuery !== '' ||
    entityFilter !== 'ALL' ||
    actionFilter !== 'ALL' ||
    dateFrom !== '' ||
    dateTo !== ''

  const handleResetFilters = () => {
    setSearchQuery('')
    setEntityFilter('ALL')
    setActionFilter('ALL')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="mx-auto max-w-7xl pb-16">
      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER                                                        */}
      {/* ------------------------------------------------------------------ */}
      <PageHeader
        title="Audit Log"
        subtitle="Cryptographically sealed, append-only ledger tracking all entity mutations, warehouse transfers, and system events."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={isTamperSimulated ? 'destructive' : 'secondary'}
              onClick={handleToggleTamper}
              icon={
                isTamperSimulated ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )
              }
              title={
                isTamperSimulated
                  ? 'Revert to pristine untampered chain'
                  : 'Inject mock hash corruption at Block #8 to test tamper detection'
              }
            >
              {isTamperSimulated ? 'Clear Tamper Simulation' : 'Simulate Tampering'}
            </Button>
            <Button
              variant="primary"
              onClick={runChainVerification}
              disabled={isVerifying}
              icon={
                isVerifying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )
              }
            >
              {isVerifying ? 'Verifying Chain...' : 'Verify Chain'}
            </Button>
          </div>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* VERIFICATION PROGRESS & STATUS BANNERS                             */}
      {/* ------------------------------------------------------------------ */}
      {isVerifying && (
        <div className="mb-6 rounded-[12px] border border-blue-200 bg-blue-50/80 p-4 shadow-sm transition-all">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-primary">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text">
                  Verifying Cryptographic Ledger Chain Integrity...
                </h4>
                <p className="text-xs text-muted">
                  Recomputing SHA-256 forward hashes and validating Merkle integrity for Block #{verifyingBlockIndex ?? 1} of 15
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-primary">
              <span>{verificationProgress}% Completed</span>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-200/70">
            <div
              className="h-full bg-primary transition-all duration-150 ease-out"
              style={{ width: `${verificationProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Banner */}
      {!isVerifying && verificationStatus === 'verified' && (
        <div className="mb-6 rounded-[12px] border border-emerald-300 bg-emerald-50/90 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-emerald-950">
                  Chain integrity verified — no tampering detected.
                </h4>
                <p className="mt-0.5 text-sm text-emerald-800">
                  All 15 blocks validated against sequential SHA-256 cryptographic hashes.
                  The hash chain matches root Merkle signatures with zero uncommitted or mutated ledger entries.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-emerald-700">
                  <span>Timestamp: {new Date().toLocaleTimeString()} UTC</span>
                  <span>•</span>
                  <span>Validated Blocks: 15 / 15</span>
                  <span>•</span>
                  <span>Genesis Root: 8857e8d6…7ab7d</span>
                  <span>•</span>
                  <span>Head Hash: c3aabd83…4d1d7</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                onClick={runChainVerification}
                className="h-8 text-xs font-medium"
              >
                Re-verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tamper / Corruption Error Banner */}
      {!isVerifying && verificationStatus === 'broken' && (
        <div className="mb-6 rounded-[12px] border border-red-300 bg-red-50/95 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-red-950">
                  Chain Integrity Violation Detected!
                </h4>
                <p className="mt-0.5 text-sm text-red-800">
                  Cryptographic verification halted at Block #{brokenAtSequence}. The block hash does not
                  match previous forward pointer reference. Potential unauthorized ledger modification detected.
                </p>
                {brokenBlockDetails && (
                  <div className="mt-2 rounded-[8px] bg-red-100/70 p-2 text-xs font-mono text-red-900 border border-red-200">
                    <div>Violation at Block #{brokenBlockDetails.blockNumber}:</div>
                    <div className="truncate">Expected Prev: {brokenBlockDetails.expectedPrev}</div>
                    <div className="truncate text-red-700 font-bold">Corrupted Ref: {brokenBlockDetails.actualPrev}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="destructive"
                onClick={handleRestoreChain}
                className="h-8 text-xs font-medium"
                icon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Repair & Restore Ledger
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* FILTER & CONTROL BAR                                               */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          {/* Search Box */}
          <div className="lg:col-span-4">
            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-medium text-text">Search Audit Trail</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search user, entity, action, hash, IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </label>
          </div>

          {/* Entity Filter */}
          <div className="lg:col-span-2">
            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-medium text-text">Entity Type</span>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">All Entities</option>
                <option value="Product">Product</option>
                <option value="Batch">Batch</option>
                <option value="Transfer">Transfer</option>
                <option value="PO">Purchase Order (PO)</option>
                <option value="User">User</option>
              </select>
            </label>
          </div>

          {/* Action Filter */}
          <div className="lg:col-span-2">
            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-medium text-text">Action</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">All Actions</option>
                <option value="Created">Created</option>
                <option value="Updated">Updated</option>
                <option value="Deleted">Deleted</option>
                <option value="Transferred">Transferred</option>
                <option value="Received">Received</option>
                <option value="Adjusted">Adjusted</option>
              </select>
            </label>
          </div>

          {/* Date From */}
          <div className="lg:col-span-2">
            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-medium text-text">From Date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
              </input>
            </label>
          </div>

          {/* Date To */}
          <div className="lg:col-span-2">
            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-medium text-text">To Date</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
              </input>
            </label>
          </div>
        </div>

        {/* Filter Summary & Quick Reset */}
        <div className="mt-3 flex flex-wrap items-center justify-between border-t border-border/60 pt-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-text">{filteredEvents.length}</strong> of{' '}
              {events.length} audit blocks
            </span>
            {hasActiveFilters && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                Filters Active
              </span>
            )}
            {isTamperSimulated && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
                Tampered Block #8 Active
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-primary hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* TIMELINE FEED                                                      */}
      {/* ------------------------------------------------------------------ */}
      {filteredEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-text">No Audit Events Found</h3>
          <p className="mt-1 text-sm text-muted">
            No events match your current filter criteria. Try adjusting your search keyword or date range.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="relative">
          <div className="space-y-6">
            {paginatedEvents.map((evt, index) => {
              const isVerified = verifiedEventIds.has(evt.id)
              const isCurrentVerifying = verifyingBlockIndex === evt.sequence
              const isBroken = brokenAtSequence === evt.sequence

              return (
                <div
                  key={evt.id}
                  className="relative flex flex-col md:flex-row md:items-stretch gap-4"
                >
                  {/* Left Column: Timestamp & Hash Badge */}
                  <div className="shrink-0 md:w-44 md:text-right pt-2 flex md:flex-col justify-between items-center md:items-end gap-1">
                    <div>
                      <div className="text-xs font-semibold text-text">
                        {formatEventDate(evt.timestamp)}
                      </div>
                      <div className="text-[11px] font-mono text-muted">
                        {formatEventTime(evt.timestamp)}
                      </div>
                    </div>

                    {/* Hash Badge: First 8 chars of SHA-256 hash, monospace, grey bg */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(evt.hash, `Block #${evt.sequence} Hash`)}
                        title={`Full SHA-256:\n${evt.hash}\n\nClick to copy`}
                        className="group inline-flex items-center gap-1 rounded-[6px] border border-border bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <Hash className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                        <span className="font-semibold">{evt.hash.slice(0, 8)}</span>
                        <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity" />
                      </button>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400">
                      Block #{evt.sequence}
                    </div>
                  </div>

                  {/* Center Column: Connector Line with Node Dot */}
                  <div className="hidden md:flex relative flex-col items-center shrink-0 w-8">
                    {/* Continuous vertical connector line */}
                    <div
                      className={cn(
                        'absolute top-0 bottom-0 w-0.5',
                        isBroken
                          ? 'bg-red-300'
                          : isVerified
                          ? 'bg-emerald-300'
                          : 'bg-border',
                      )}
                    />

                    {/* Node Dot / Verification Indicator */}
                    <div
                      className={cn(
                        'relative z-10 mt-3 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-surface transition-all duration-300 shadow-sm',
                        isBroken
                          ? 'border-red-600 bg-red-600 text-white ring-4 ring-red-100 animate-pulse'
                          : isCurrentVerifying
                          ? 'border-primary bg-primary/10 text-primary ring-4 ring-primary/20 animate-spin'
                          : isVerified
                          ? 'border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'border-slate-300 text-slate-400',
                      )}
                    >
                      {isBroken ? (
                        <ShieldAlert className="h-3.5 w-3.5 stroke-[2.5]" />
                      ) : isCurrentVerifying ? (
                        <RefreshCw className="h-3.5 w-3.5" />
                      ) : isVerified ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Right Column: Event Detail Card */}
                  <div className="flex-1">
                    <Card
                      className={cn(
                        'transition-all duration-200 hover:shadow-md',
                        isBroken && 'border-red-400 bg-red-50/20 ring-1 ring-red-400',
                        isCurrentVerifying && 'border-primary ring-1 ring-primary',
                      )}
                    >
                      {/* Card Header: Action Chip, Entity Link, Block Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Action label as Chip */}
                          <Chip
                            label={evt.action}
                            tone={getActionChipTone(evt.action)}
                          />

                          {/* Entity: "Product: Laptop Pro 15" linked text */}
                          <button
                            type="button"
                            onClick={() => setSelectedEvent(evt)}
                            className="text-left text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
                          >
                            {evt.entityType}: {evt.entityName}
                          </button>
                        </div>

                        {/* Top-right Status / Verification Indicator */}
                        <div className="flex items-center gap-2">
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Valid Hash
                            </span>
                          )}
                          {isBroken && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-300">
                              <XCircle className="h-3 w-3 text-red-600" />
                              Tampered
                            </span>
                          )}
                          <span className="text-xs font-mono text-muted">
                            #{evt.entityId}
                          </span>
                        </div>
                      </div>

                      {/* User & IP Information */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        {/* User who performed it */}
                        <div className="flex items-center gap-1.5 font-medium text-text">
                          <div
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white',
                              evt.user.avatarColor,
                            )}
                          >
                            {evt.user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <span>{evt.user.name}</span>
                          <span className="text-muted font-normal">
                            ({evt.user.role})
                          </span>
                        </div>

                        {/* IP address (grey muted) */}
                        <div className="flex items-center gap-1 font-mono text-muted">
                          <Globe className="h-3.5 w-3.5 text-slate-400" />
                          <span>IP: {evt.ipAddress}</span>
                        </div>

                        {/* Reason / Context */}
                        {evt.reason && (
                          <div className="text-slate-500 italic truncate max-w-md">
                            "{evt.reason}"
                          </div>
                        )}
                      </div>

                      {/* Before/After Diff View (side by side for updates/adjustments) */}
                      {evt.diffs && evt.diffs.length > 0 && (
                        <div className="mt-3.5 rounded-[8px] border border-border bg-app/60 p-3">
                          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
                            <span className="flex items-center gap-1.5">
                              <Activity className="h-3.5 w-3.5 text-primary" />
                              <span>State Transformation ({evt.diffs.length} fields)</span>
                            </span>
                            <span className="text-[11px] font-mono text-muted">
                              Before → After
                            </span>
                          </div>

                          <div className="space-y-2">
                            {evt.diffs.map((diff, diffIdx) => (
                              <div
                                key={diffIdx}
                                className="grid grid-cols-1 gap-2 rounded-[6px] border border-border/70 bg-surface p-2 text-xs sm:grid-cols-7 sm:items-center"
                              >
                                {/* Field Label */}
                                <div className="font-medium text-text sm:col-span-2 truncate flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                                  <span title={diff.label}>{diff.label}</span>
                                </div>

                                {/* Before Side (Red Tinted) */}
                                <div className="flex items-center gap-1.5 rounded bg-red-50/80 border border-red-200/60 px-2 py-1 font-mono text-red-900 sm:col-span-2 truncate">
                                  <span className="text-[10px] font-bold text-red-600">-</span>
                                  <span
                                    className="line-through truncate text-red-700"
                                    title={String(diff.before ?? 'None')}
                                  >
                                    {diff.before !== null ? String(diff.before) : 'None'}
                                  </span>
                                </div>

                                {/* Arrow Divider */}
                                <div className="hidden sm:flex justify-center text-muted sm:col-span-1">
                                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                                </div>

                                {/* After Side (Green Tinted) */}
                                <div className="flex items-center gap-1.5 rounded bg-emerald-50/80 border border-emerald-200/60 px-2 py-1 font-mono text-emerald-950 sm:col-span-2 truncate">
                                  <span className="text-[10px] font-bold text-emerald-600">+</span>
                                  <span
                                    className="font-semibold truncate text-emerald-800"
                                    title={String(diff.after ?? 'None')}
                                  >
                                    {diff.after !== null ? String(diff.after) : 'None'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Card Footer: Previous Hash Linking Entries Together */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted">
                        <div className="flex items-center gap-1.5 font-mono">
                          <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span>Previous Hash:</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(evt.prevHash, `Block #${evt.sequence} Previous Hash`)
                            }
                            title={`Full Previous Hash:\n${evt.prevHash}\n\nClick to copy`}
                            className="rounded bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 text-slate-700 transition-colors"
                          >
                            {evt.prevHash ===
                            '0000000000000000000000000000000000000000000000000000000000000000'
                              ? '00000000 (Genesis)'
                              : `${evt.prevHash.slice(0, 10)}…`}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect Cryptographic Payload
                        </button>
                      </div>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>

          {/* -------------------------------------------------------------- */}
          {/* PAGINATION AT BOTTOM                                           */}
          {/* -------------------------------------------------------------- */}
          <div className="mt-8 border-t border-border/80 pt-4">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DRAWER: DETAILED CRYPTOGRAPHIC INSPECTOR                           */}
      {/* ------------------------------------------------------------------ */}
      <Drawer
        open={Boolean(selectedEvent)}
        title={
          selectedEvent
            ? `Audit Block #${selectedEvent.sequence} — Cryptographic Proof`
            : ''
        }
        onClose={() => setSelectedEvent(null)}
        wide
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (selectedEvent) {
                  handleCopy(selectedEvent.hash, 'Block SHA-256 Hash')
                }
              }}
              icon={<Copy className="h-4 w-4" />}
            >
              Copy Full Hash
            </Button>
            <Button variant="primary" onClick={() => setSelectedEvent(null)}>
              Done
            </Button>
          </div>
        }
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Chip
                  label={selectedEvent.action}
                  tone={getActionChipTone(selectedEvent.action)}
                />
                <span className="font-semibold text-text">
                  {selectedEvent.entityType}: {selectedEvent.entityName}
                </span>
              </div>
              <span className="font-mono text-xs text-muted">
                Sequence: #{selectedEvent.sequence} of 15
              </span>
            </div>

            {/* Cryptographic Chain Proof */}
            <div className="rounded-[10px] border border-border bg-slate-50/70 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-text">
                <Shield className="h-4 w-4 text-primary" />
                Cryptographic Header & Hashes
              </h4>

              <div className="mt-3 space-y-3 text-xs">
                {/* Block Hash */}
                <div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Block SHA-256 Hash</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedEvent.hash, 'Block Hash')}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                  <div className="mt-1 break-all rounded-[6px] border border-border bg-surface p-2 font-mono text-[11px] text-slate-800">
                    {selectedEvent.hash}
                  </div>
                </div>

                {/* Previous Hash */}
                <div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Previous Block Hash (Parent Link)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedEvent.prevHash, 'Previous Hash')}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                  <div className="mt-1 break-all rounded-[6px] border border-border bg-surface p-2 font-mono text-[11px] text-slate-800">
                    {selectedEvent.prevHash}
                  </div>
                </div>

                {/* Ledger Proof Metadata */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded border border-border/80 bg-surface p-2">
                    <span className="text-[11px] text-muted">Merkle Root Leaf</span>
                    <div className="font-mono font-medium text-text">
                      Leaf #{selectedEvent.sequence} (Depth 4)
                    </div>
                  </div>
                  <div className="rounded border border-border/80 bg-surface p-2">
                    <span className="text-[11px] text-muted">Signature Algorithm</span>
                    <div className="font-mono font-medium text-text">
                      Ed25519 + SHA-256
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actor & Session Metadata */}
            <div className="rounded-[10px] border border-border bg-surface p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-text">
                <UserIcon className="h-4 w-4 text-primary" />
                Actor & Provenance Details
              </h4>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted">User Name:</span>
                  <div className="font-semibold text-text">{selectedEvent.user.name}</div>
                </div>
                <div>
                  <span className="text-muted">Role & Permission:</span>
                  <div className="text-text">{selectedEvent.user.role}</div>
                </div>
                <div>
                  <span className="text-muted">Email:</span>
                  <div className="font-mono text-text">{selectedEvent.user.email}</div>
                </div>
                <div>
                  <span className="text-muted">Source IP:</span>
                  <div className="font-mono text-text">{selectedEvent.ipAddress}</div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted">Timestamp:</span>
                  <div className="font-mono text-text">
                    {selectedEvent.timestamp} ({formatEventDate(selectedEvent.timestamp)}{' '}
                    {formatEventTime(selectedEvent.timestamp)})
                  </div>
                </div>
                {selectedEvent.userAgent && (
                  <div className="sm:col-span-2">
                    <span className="text-muted">Client User-Agent:</span>
                    <div className="font-mono text-[11px] text-slate-600 break-all bg-app p-1.5 rounded mt-0.5">
                      {selectedEvent.userAgent}
                    </div>
                  </div>
                )}
                {selectedEvent.reason && (
                  <div className="sm:col-span-2">
                    <span className="text-muted">Audit Note / Justification:</span>
                    <div className="text-slate-700 italic bg-app p-2 rounded mt-0.5">
                      "{selectedEvent.reason}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Diff Comparison */}
            {selectedEvent.diffs && selectedEvent.diffs.length > 0 && (
              <div className="rounded-[10px] border border-border bg-surface p-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-text">
                  <Activity className="h-4 w-4 text-primary" />
                  Full Payload Mutation Diff
                </h4>
                <div className="mt-3 space-y-2">
                  {selectedEvent.diffs.map((diff, i) => (
                    <div
                      key={i}
                      className="rounded-[6px] border border-border/80 p-2.5 text-xs bg-app/40"
                    >
                      <div className="font-medium text-text mb-1.5">{diff.label}</div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="bg-red-50 p-1.5 rounded border border-red-200 text-red-900">
                          <span className="text-muted block text-[10px] uppercase font-sans">
                            Before State
                          </span>
                          <span className="line-through">{String(diff.before ?? 'null')}</span>
                        </div>
                        <div className="bg-emerald-50 p-1.5 rounded border border-emerald-200 text-emerald-950 font-semibold">
                          <span className="text-muted block text-[10px] uppercase font-sans">
                            After State
                          </span>
                          <span>{String(diff.after ?? 'null')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
