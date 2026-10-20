import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  Package,
  Calendar,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  FileText,
  Trash2,
  Printer,
  Download,
  Send,
  XCircle,
  Check,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ClipboardList,
  History,
  ShieldCheck,
  Eye,
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

// ----------------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------------

export type POStatus = 'Draft' | 'Sent' | 'Partial' | 'Received' | 'Cancelled'

export type POLineItem = {
  id: string
  productId: string
  productName: string
  sku: string
  unit: string
  quantityOrdered: number
  quantityReceived: number
  unitCost: number
}

export type ReceivingItemReceipt = {
  productId: string
  productName: string
  sku: string
  quantityReceived: number
  batchNumber?: string
  expiryDate?: string
}

export type ReceivingRecord = {
  id: string
  receiptNumber: string
  receivedAt: string
  receivedBy: string
  items: ReceivingItemReceipt[]
  notes?: string
}

export type AuditLogEntry = {
  id: string
  timestamp: string
  user: string
  action: string
  details: string
}

export type PurchaseOrder = {
  id: string
  poNumber: string
  supplier: string
  supplierContact: {
    contactPerson: string
    email: string
    phone: string
    address: string
  }
  destination: string
  status: POStatus
  orderDate: string
  expectedDelivery: string
  actualDeliveryDate?: string
  createdBy: {
    name: string
    role: string
    initials: string
  }
  notes?: string
  shippingCost: number
  taxRate: number
  lines: POLineItem[]
  receivingHistory: ReceivingRecord[]
  auditTrail: AuditLogEntry[]
}

// ----------------------------------------------------------------------------
// Master Catalog for dynamic Line Items
// ----------------------------------------------------------------------------

type CatalogProduct = {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  cost: number
}

const MASTER_PRODUCTS: CatalogProduct[] = [
  { id: 'p1', sku: 'SKU-1042', name: 'Surgical Gloves (L)', category: 'PPE', unit: 'box', cost: 12.5 },
  { id: 'p2', sku: 'SKU-2088', name: 'IV Saline 500ml', category: 'Fluids', unit: 'case', cost: 8.0 },
  { id: 'p3', sku: 'SKU-4401', name: 'Insulin Glargine 100U/ml', category: 'Pharma', unit: 'vials', cost: 45.0 },
  { id: 'p4', sku: 'SKU-3310', name: 'Bandage Roll 4"', category: 'Wound Care', unit: 'pack', cost: 3.2 },
  { id: 'p5', sku: 'SKU-1199', name: 'N95 Respirator Mask', category: 'PPE', unit: 'box', cost: 22.0 },
  { id: 'p6', sku: 'SKU-9902', name: 'Propofol 10mg/ml Injectable', category: 'Pharma', unit: 'ampoules', cost: 32.0 },
  { id: 'p7', sku: 'SKU-6120', name: 'Blood Glucose Test Strips', category: 'Diagnostics', unit: 'pack', cost: 16.0 },
  { id: 'p8', sku: 'SKU-7754', name: 'Infusion Set Microdrip', category: 'Devices', unit: 'box', cost: 14.5 },
  { id: 'p9', sku: 'SKU-5201', name: 'Amoxicillin 500mg', category: 'Pharma', unit: 'bottle', cost: 9.5 },
]

const AVAILABLE_SUPPLIERS = [
  'Acme Supply Co',
  'Global Parts Ltd',
  'MedTech Solutions',
  'BioPharma Direct',
  'Apex Health Logistics',
  'Apex Surgical',
  'Metro Pharma Supplies',
  'Nova Diagnostics',
  'FluidTech Industries',
  'DiaCheck Medical',
]

const AVAILABLE_DESTINATIONS = [
  'Warehouse A',
  'Warehouse B',
  'Cold Store',
  'Clinic North',
  'ER Bay 3',
  'Central Pharmacy',
]

// ----------------------------------------------------------------------------
// Initial Mock Data (8 Purchase Orders across all statuses)
// ----------------------------------------------------------------------------

const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-108',
    poNumber: 'PO-2026-108',
    supplier: 'Acme Supply Co',
    supplierContact: {
      contactPerson: 'Robert Miller',
      email: 'rmiller@acmesupply.com',
      phone: '+1 (555) 234-8901',
      address: '742 Evergreen Terrace, Industrial Park, Sector 4',
    },
    destination: 'Warehouse A',
    status: 'Draft',
    orderDate: '2026-10-18',
    expectedDelivery: '2026-10-25',
    createdBy: {
      name: 'Sarah Jenkins',
      role: 'Procurement Lead',
      initials: 'SJ',
    },
    notes: 'Drafting bi-monthly restocking order. Need final review before transmitting to vendor.',
    shippingCost: 75.0,
    taxRate: 0.05,
    lines: [
      {
        id: 'li-108-1',
        productId: 'p1',
        productName: 'Surgical Gloves (L)',
        sku: 'SKU-1042',
        unit: 'box',
        quantityOrdered: 500,
        quantityReceived: 0,
        unitCost: 12.5,
      },
      {
        id: 'li-108-2',
        productId: 'p4',
        productName: 'Bandage Roll 4"',
        sku: 'SKU-3310',
        unit: 'pack',
        quantityOrdered: 300,
        quantityReceived: 0,
        unitCost: 3.2,
      },
    ],
    receivingHistory: [],
    auditTrail: [
      {
        id: 'aud-108-1',
        timestamp: '2026-10-18 10:14 AM',
        user: 'Sarah Jenkins',
        action: 'Draft Created',
        details: 'Initial purchase order drafted with 2 line items (estimated $7,210.00).',
      },
    ],
  },
  {
    id: 'po-107',
    poNumber: 'PO-2026-107',
    supplier: 'Global Parts Ltd',
    supplierContact: {
      contactPerson: 'David K. Vance',
      email: 'dvance@globalparts.io',
      phone: '+1 (555) 782-9900',
      address: '120 Logistics Parkway, Suite 500, Seattle, WA',
    },
    destination: 'Cold Store',
    status: 'Sent',
    orderDate: '2026-10-16',
    expectedDelivery: '2026-10-22',
    createdBy: {
      name: 'Marcus Vance',
      role: 'Inventory Analyst',
      initials: 'MV',
    },
    notes: 'Dispatched via EDI. Awaiting dispatch confirmation and bill of lading from carrier.',
    shippingCost: 120.0,
    taxRate: 0.05,
    lines: [
      {
        id: 'li-107-1',
        productId: 'p2',
        productName: 'IV Saline 500ml',
        sku: 'SKU-2088',
        unit: 'case',
        quantityOrdered: 400,
        quantityReceived: 0,
        unitCost: 8.0,
      },
      {
        id: 'li-107-2',
        productId: 'p8',
        productName: 'Infusion Set Microdrip',
        sku: 'SKU-7754',
        unit: 'box',
        quantityOrdered: 250,
        quantityReceived: 0,
        unitCost: 14.5,
      },
    ],
    receivingHistory: [],
    auditTrail: [
      {
        id: 'aud-107-1',
        timestamp: '2026-10-16 09:30 AM',
        user: 'Marcus Vance',
        action: 'Draft Created',
        details: 'Order created for restocking cold store IV solutions.',
      },
      {
        id: 'aud-107-2',
        timestamp: '2026-10-16 02:40 PM',
        user: 'Marcus Vance',
        action: 'Sent to Supplier',
        details: 'Transmitted electronically to Global Parts Ltd EDI gateway.',
      },
    ],
  },
  {
    id: 'po-106',
    poNumber: 'PO-2026-106',
    supplier: 'MedTech Solutions',
    supplierContact: {
      contactPerson: 'Jessica Alba',
      email: 'orders@medtechsolutions.org',
      phone: '+1 (555) 441-2099',
      address: '88 Medical Mile, Suite 210, Boston, MA',
    },
    destination: 'Clinic North',
    status: 'Sent',
    orderDate: '2026-10-15',
    expectedDelivery: '2026-10-21',
    createdBy: {
      name: 'Elena Rostova',
      role: 'Supply Coordinator',
      initials: 'ER',
    },
    notes: 'Expedited shipping selected for seasonal inventory prep.',
    shippingCost: 150.0,
    taxRate: 0.05,
    lines: [
      {
        id: 'li-106-1',
        productId: 'p5',
        productName: 'N95 Respirator Mask',
        sku: 'SKU-1199',
        unit: 'box',
        quantityOrdered: 600,
        quantityReceived: 0,
        unitCost: 22.0,
      },
      {
        id: 'li-106-2',
        productId: 'p7',
        productName: 'Blood Glucose Test Strips',
        sku: 'SKU-6120',
        unit: 'pack',
        quantityOrdered: 200,
        quantityReceived: 0,
        unitCost: 16.0,
      },
    ],
    receivingHistory: [],
    auditTrail: [
      {
        id: 'aud-106-1',
        timestamp: '2026-10-15 11:05 AM',
        user: 'Elena Rostova',
        action: 'Draft Created',
        details: 'Seasonal respiratory PPE restock for Clinic North.',
      },
      {
        id: 'aud-106-2',
        timestamp: '2026-10-15 01:15 PM',
        user: 'Elena Rostova',
        action: 'Sent to Supplier',
        details: 'PO approved and transmitted with expedited delivery request.',
      },
    ],
  },
  {
    id: 'po-105',
    poNumber: 'PO-2026-105',
    supplier: 'BioPharma Direct',
    supplierContact: {
      contactPerson: 'Dr. Gregory House',
      email: 'ghouse@biopharmadirect.com',
      phone: '+1 (555) 890-3321',
      address: '300 Research Boulevard, Cambridge, MA',
    },
    destination: 'Central Pharmacy',
    status: 'Partial',
    orderDate: '2026-10-10',
    expectedDelivery: '2026-10-19',
    createdBy: {
      name: 'David Chen',
      role: 'Head Pharmacist',
      initials: 'DC',
    },
    notes: 'First shipment arrived under active cold-chain logger verification. Secondary pallet en route.',
    shippingCost: 95.0,
    taxRate: 0.05,
    lines: [
      {
        id: 'li-105-1',
        productId: 'p3',
        productName: 'Insulin Glargine 100U/ml',
        sku: 'SKU-4401',
        unit: 'vials',
        quantityOrdered: 300,
        quantityReceived: 180,
        unitCost: 45.0,
      },
      {
        id: 'li-105-2',
        productId: 'p6',
        productName: 'Propofol 10mg/ml Injectable',
        sku: 'SKU-9902',
        unit: 'ampoules',
        quantityOrdered: 150,
        quantityReceived: 90,
        unitCost: 32.0,
      },
    ],
    receivingHistory: [
      {
        id: 'rec-105-1',
        receiptNumber: 'RC-8821',
        receivedAt: '2026-10-14 09:20 AM',
        receivedBy: 'David Chen',
        notes: 'Temperature sensors confirmed 3.4°C upon dock arrival. Cold chain certified.',
        items: [
          {
            productId: 'p3',
            productName: 'Insulin Glargine 100U/ml',
            sku: 'SKU-4401',
            quantityReceived: 180,
            batchNumber: 'LOT-INS-9041',
            expiryDate: '2027-08-30',
          },
          {
            productId: 'p6',
            productName: 'Propofol 10mg/ml Injectable',
            sku: 'SKU-9902',
            quantityReceived: 90,
            batchNumber: 'LOT-PRF-4412',
            expiryDate: '2027-04-15',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-105-1',
        timestamp: '2026-10-10 08:30 AM',
        user: 'David Chen',
        action: 'Draft Created',
        details: 'Monthly high-value pharmaceutical requisition created.',
      },
      {
        id: 'aud-105-2',
        timestamp: '2026-10-10 10:15 AM',
        user: 'David Chen',
        action: 'Sent to Supplier',
        details: 'Sent directly to BioPharma Direct key account rep.',
      },
      {
        id: 'aud-105-3',
        timestamp: '2026-10-14 09:20 AM',
        user: 'David Chen',
        action: 'Partial Receipt Logged',
        details: 'Receipt RC-8821: 270 items received (180 Insulin, 90 Propofol).',
      },
    ],
  },
  {
    id: 'po-104',
    poNumber: 'PO-2026-104',
    supplier: 'Apex Health Logistics',
    supplierContact: {
      contactPerson: 'Samantha Sterling',
      email: 'ssterling@apexlogistics.com',
      phone: '+1 (555) 671-4433',
      address: '500 Commerce Way, Dallas, TX',
    },
    destination: 'Warehouse B',
    status: 'Partial',
    orderDate: '2026-10-08',
    expectedDelivery: '2026-10-17',
    createdBy: {
      name: 'Sarah Jenkins',
      role: 'Procurement Lead',
      initials: 'SJ',
    },
    notes: 'Split shipment. Remaining gloves backordered until Oct 20.',
    shippingCost: 85.0,
    taxRate: 0.05,
    lines: [
      {
        id: 'li-104-1',
        productId: 'p9',
        productName: 'Amoxicillin 500mg',
        sku: 'SKU-5201',
        unit: 'bottle',
        quantityOrdered: 500,
        quantityReceived: 350,
        unitCost: 9.5,
      },
      {
        id: 'li-104-2',
        productId: 'p1',
        productName: 'Surgical Gloves (L)',
        sku: 'SKU-1042',
        unit: 'box',
        quantityOrdered: 400,
        quantityReceived: 200,
        unitCost: 12.5,
      },
      {
        id: 'li-104-3',
        productId: 'p4',
        productName: 'Bandage Roll 4"',
        sku: 'SKU-3310',
        unit: 'pack',
        quantityOrdered: 200,
        quantityReceived: 200,
        unitCost: 3.2,
      },
    ],
    receivingHistory: [
      {
        id: 'rec-104-1',
        receiptNumber: 'RC-8790',
        receivedAt: '2026-10-12 02:15 PM',
        receivedBy: 'Marcus Vance',
        notes: 'First delivery truck. Received Amoxicillin bottles and all bandages.',
        items: [
          {
            productId: 'p9',
            productName: 'Amoxicillin 500mg',
            sku: 'SKU-5201',
            quantityReceived: 350,
            batchNumber: 'LOT-AMX-2026A',
            expiryDate: '2028-01-20',
          },
          {
            productId: 'p4',
            productName: 'Bandage Roll 4"',
            sku: 'SKU-3310',
            quantityReceived: 200,
            batchNumber: 'LOT-BND-889',
            expiryDate: '2029-06-15',
          },
        ],
      },
      {
        id: 'rec-104-2',
        receiptNumber: 'RC-8805',
        receivedAt: '2026-10-15 11:40 AM',
        receivedBy: 'Sarah Jenkins',
        notes: 'Partial shipment of gloves arrived via secondary courier.',
        items: [
          {
            productId: 'p1',
            productName: 'Surgical Gloves (L)',
            sku: 'SKU-1042',
            quantityReceived: 200,
            batchNumber: 'LOT-GLV-1042B',
            expiryDate: '2028-11-01',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-104-1',
        timestamp: '2026-10-08 09:12 AM',
        user: 'Sarah Jenkins',
        action: 'Draft Created',
        details: 'Stock replenishment for Warehouse B inventory buffers.',
      },
      {
        id: 'aud-104-2',
        timestamp: '2026-10-08 11:30 AM',
        user: 'Sarah Jenkins',
        action: 'Sent to Supplier',
        details: 'Order transmitted to Apex Health Logistics.',
      },
      {
        id: 'aud-104-3',
        timestamp: '2026-10-12 02:15 PM',
        user: 'Marcus Vance',
        action: 'Partial Receipt Logged',
        details: 'Receipt RC-8790: 550 total units logged into Warehouse B.',
      },
      {
        id: 'aud-104-4',
        timestamp: '2026-10-15 11:40 AM',
        user: 'Sarah Jenkins',
        action: 'Partial Receipt Logged',
        details: 'Receipt RC-8805: 200 boxes surgical gloves received.',
      },
    ],
  },
  {
    id: 'po-103',
    poNumber: 'PO-2026-103',
    supplier: 'Metro Pharma Supplies',
    supplierContact: {
      contactPerson: 'Anthony Morales',
      email: 'amorales@metropharma.com',
      phone: '+1 (555) 302-8117',
      address: '920 East 45th Street, New York, NY',
    },
    destination: 'Cold Store',
    status: 'Received',
    orderDate: '2026-10-02',
    expectedDelivery: '2026-10-09',
    actualDeliveryDate: '2026-10-09',
    createdBy: {
      name: 'David Chen',
      role: 'Head Pharmacist',
      initials: 'DC',
    },
    notes: 'Order fulfilled and inspected. Temperature loggers verified within 2-8°C.',
    shippingCost: 110.0,
    taxRate: 0.05,
    lines: [
      {
        id: 'li-103-1',
        productId: 'p2',
        productName: 'IV Saline 500ml',
        sku: 'SKU-2088',
        unit: 'case',
        quantityOrdered: 600,
        quantityReceived: 600,
        unitCost: 8.0,
      },
      {
        id: 'li-103-2',
        productId: 'p6',
        productName: 'Propofol 10mg/ml Injectable',
        sku: 'SKU-9902',
        unit: 'ampoules',
        quantityOrdered: 200,
        quantityReceived: 200,
        unitCost: 32.0,
      },
    ],
    receivingHistory: [
      {
        id: 'rec-103-1',
        receiptNumber: 'RC-8742',
        receivedAt: '2026-10-09 01:50 PM',
        receivedBy: 'David Chen',
        notes: 'Full order delivered on schedule. 100% quantity verified with no damage.',
        items: [
          {
            productId: 'p2',
            productName: 'IV Saline 500ml',
            sku: 'SKU-2088',
            quantityReceived: 600,
            batchNumber: 'LOT-SAL-3390',
            expiryDate: '2027-12-15',
          },
          {
            productId: 'p6',
            productName: 'Propofol 10mg/ml Injectable',
            sku: 'SKU-9902',
            quantityReceived: 200,
            batchNumber: 'LOT-PRF-1102',
            expiryDate: '2027-09-30',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-103-1',
        timestamp: '2026-10-02 08:45 AM',
        user: 'David Chen',
        action: 'Draft Created',
        details: 'Critical fluids and anaesthesia order drafted.',
      },
      {
        id: 'aud-103-2',
        timestamp: '2026-10-02 10:20 AM',
        user: 'David Chen',
        action: 'Sent to Supplier',
        details: 'PO sent to Metro Pharma Supplies.',
      },
      {
        id: 'aud-103-3',
        timestamp: '2026-10-09 01:50 PM',
        user: 'David Chen',
        action: 'Order Fulfilled',
        details: 'Full receipt RC-8742 recorded. All 800 items received and cleared to stock.',
      },
    ],
  },
  {
    id: 'po-102',
    poNumber: 'PO-2026-102',
    supplier: 'Apex Surgical',
    supplierContact: {
      contactPerson: 'Linda Wu',
      email: 'lwu@apexsurgical.net',
      phone: '+1 (555) 914-5500',
      address: '414 Medical Center Parkway, San Diego, CA',
    },
    destination: 'Warehouse A',
    status: 'Received',
    orderDate: '2026-09-28',
    expectedDelivery: '2026-10-05',
    actualDeliveryDate: '2026-10-04',
    createdBy: {
      name: 'Marcus Vance',
      role: 'Inventory Analyst',
      initials: 'MV',
    },
    notes: 'Dock 4 intake. All lots verified against safety certificate.',
    shippingCost: 90.0,
    taxRate: 0.05,
    lines: [
      {
        id: 'li-102-1',
        productId: 'p1',
        productName: 'Surgical Gloves (L)',
        sku: 'SKU-1042',
        unit: 'box',
        quantityOrdered: 800,
        quantityReceived: 800,
        unitCost: 12.5,
      },
      {
        id: 'li-102-2',
        productId: 'p5',
        productName: 'N95 Respirator Mask',
        sku: 'SKU-1199',
        unit: 'box',
        quantityOrdered: 400,
        quantityReceived: 400,
        unitCost: 22.0,
      },
    ],
    receivingHistory: [
      {
        id: 'rec-102-1',
        receiptNumber: 'RC-8699',
        receivedAt: '2026-10-04 03:30 PM',
        receivedBy: 'Marcus Vance',
        notes: 'Delivered a day early. Certificates of compliance verified and filed.',
        items: [
          {
            productId: 'p1',
            productName: 'Surgical Gloves (L)',
            sku: 'SKU-1042',
            quantityReceived: 800,
            batchNumber: 'LOT-GLV-8812',
            expiryDate: '2028-10-01',
          },
          {
            productId: 'p5',
            productName: 'N95 Respirator Mask',
            sku: 'SKU-1199',
            quantityReceived: 400,
            batchNumber: 'LOT-MSK-9921',
            expiryDate: '2029-03-31',
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'aud-102-1',
        timestamp: '2026-09-28 09:00 AM',
        user: 'Marcus Vance',
        action: 'Draft Created',
        details: 'PPE quarterly bulk requisition.',
      },
      {
        id: 'aud-102-2',
        timestamp: '2026-09-28 11:15 AM',
        user: 'Marcus Vance',
        action: 'Sent to Supplier',
        details: 'Transmitted to Apex Surgical with priority handling.',
      },
      {
        id: 'aud-102-3',
        timestamp: '2026-10-04 03:30 PM',
        user: 'Marcus Vance',
        action: 'Order Fulfilled',
        details: 'Receipt RC-8699 logged. 1,200 items received in Warehouse A.',
      },
    ],
  },
  {
    id: 'po-101',
    poNumber: 'PO-2026-101',
    supplier: 'Nova Diagnostics',
    supplierContact: {
      contactPerson: 'Kevin Patel',
      email: 'orders@novadiagnostics.com',
      phone: '+1 (555) 777-1234',
      address: '15 Biotech Drive, Raleigh, NC',
    },
    destination: 'ER Bay 3',
    status: 'Cancelled',
    orderDate: '2026-09-25',
    expectedDelivery: '2026-10-01',
    createdBy: {
      name: 'Elena Rostova',
      role: 'Supply Coordinator',
      initials: 'ER',
    },
    notes: 'Supplier notified of national raw material shortage. Order cancelled without penalty.',
    shippingCost: 50.0,
    taxRate: 0.05,
    lines: [
      {
        id: 'li-101-1',
        productId: 'p7',
        productName: 'Blood Glucose Test Strips',
        sku: 'SKU-6120',
        unit: 'pack',
        quantityOrdered: 500,
        quantityReceived: 0,
        unitCost: 16.0,
      },
    ],
    receivingHistory: [],
    auditTrail: [
      {
        id: 'aud-101-1',
        timestamp: '2026-09-25 10:10 AM',
        user: 'Elena Rostova',
        action: 'Draft Created',
        details: 'Diagnostics order for ER Bay 3.',
      },
      {
        id: 'aud-101-2',
        timestamp: '2026-09-25 01:20 PM',
        user: 'Elena Rostova',
        action: 'Sent to Supplier',
        details: 'PO submitted via supplier web portal.',
      },
      {
        id: 'aud-101-3',
        timestamp: '2026-09-27 04:45 PM',
        user: 'Elena Rostova',
        action: 'Order Cancelled',
        details: 'Cancelled by mutual agreement due to supplier raw material disruption.',
      },
    ],
  },
]

// ----------------------------------------------------------------------------
// Helper Utilities
// ----------------------------------------------------------------------------

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(val)
}

function calculatePOTotals(po: PurchaseOrder) {
  const subtotal = po.lines.reduce(
    (sum, line) => sum + line.quantityOrdered * line.unitCost,
    0,
  )
  const tax = subtotal * po.taxRate
  const total = subtotal + tax + po.shippingCost
  const totalOrdered = po.lines.reduce((sum, line) => sum + line.quantityOrdered, 0)
  const totalReceived = po.lines.reduce((sum, line) => sum + line.quantityReceived, 0)
  const progressPercent =
    totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0

  return { subtotal, tax, total, totalOrdered, totalReceived, progressPercent }
}

function statusTone(status: POStatus): 'good' | 'warning' | 'critical' | 'expired' | 'neutral' | 'info' {
  switch (status) {
    case 'Draft':
      return 'neutral'
    case 'Sent':
      return 'info'
    case 'Partial':
      return 'warning'
    case 'Received':
      return 'good'
    case 'Cancelled':
      return 'expired'
  }
}

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

export function PurchaseOrdersPage() {
  const { toast } = useToast()

  // State: Data
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS)

  // State: Filters & View
  const [activeTab, setActiveTab] = useState<POStatus | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDestination, setSelectedDestination] = useState('All')
  const [page, setPage] = useState(1)
  const perPage = 6

  // State: Drawers & Modals
  const [isNewPODrawerOpen, setIsNewPODrawerOpen] = useState(false)
  const [selectedPODetail, setSelectedPODetail] = useState<PurchaseOrder | null>(null)
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null)

  // State: Receiving Modal form inputs (keyed by line item ID)
  const [receivingInputs, setReceivingInputs] = useState<
    Record<
      string,
      {
        qty: number
        batchNumber: string
        expiryDate: string
      }
    >
  >({})
  const [receivingNotes, setReceivingNotes] = useState('')

  // State: New PO Form
  type NewLineDraft = {
    tempId: string
    productId: string
    productName: string
    sku: string
    unit: string
    quantity: number
    unitCost: number
  }

  const [newPOSupplier, setNewPOSupplier] = useState(AVAILABLE_SUPPLIERS[0])
  const [newPODestination, setNewPODestination] = useState(AVAILABLE_DESTINATIONS[0])
  const [newPODeliveryDate, setNewPODeliveryDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [newPONotes, setNewPONotes] = useState('')
  const [newPOLines, setNewPOLines] = useState<NewLineDraft[]>([
    {
      tempId: 'temp-1',
      productId: MASTER_PRODUCTS[0].id,
      productName: MASTER_PRODUCTS[0].name,
      sku: MASTER_PRODUCTS[0].sku,
      unit: MASTER_PRODUCTS[0].unit,
      quantity: 100,
      unitCost: MASTER_PRODUCTS[0].cost,
    },
  ])

  // --------------------------------------------------------------------------
  // Summary Stats
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    const totalCount = purchaseOrders.length
    const draftCount = purchaseOrders.filter((p) => p.status === 'Draft').length
    const activeCount = purchaseOrders.filter(
      (p) => p.status === 'Sent' || p.status === 'Partial',
    ).length
    const receivedCount = purchaseOrders.filter((p) => p.status === 'Received').length

    const activeValue = purchaseOrders
      .filter((p) => p.status === 'Sent' || p.status === 'Partial')
      .reduce((sum, p) => sum + calculatePOTotals(p).total, 0)

    const totalSpend = purchaseOrders
      .filter((p) => p.status !== 'Cancelled')
      .reduce((sum, p) => sum + calculatePOTotals(p).total, 0)

    return {
      totalCount,
      draftCount,
      activeCount,
      receivedCount,
      activeValue,
      totalSpend,
    }
  }, [purchaseOrders])

  // Tab Counts
  const tabCounts = useMemo(() => {
    return {
      All: purchaseOrders.length,
      Draft: purchaseOrders.filter((p) => p.status === 'Draft').length,
      Sent: purchaseOrders.filter((p) => p.status === 'Sent').length,
      Partial: purchaseOrders.filter((p) => p.status === 'Partial').length,
      Received: purchaseOrders.filter((p) => p.status === 'Received').length,
      Cancelled: purchaseOrders.filter((p) => p.status === 'Cancelled').length,
    }
  }, [purchaseOrders])

  // --------------------------------------------------------------------------
  // Filtering & Pagination
  // --------------------------------------------------------------------------
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      // Tab filter
      if (activeTab !== 'All' && po.status !== activeTab) {
        return false
      }

      // Destination filter
      if (selectedDestination !== 'All' && po.destination !== selectedDestination) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesPO = po.poNumber.toLowerCase().includes(query)
        const matchesSupplier = po.supplier.toLowerCase().includes(query)
        const matchesUser = po.createdBy.name.toLowerCase().includes(query)
        const matchesProducts = po.lines.some(
          (l) =>
            l.productName.toLowerCase().includes(query) ||
            l.sku.toLowerCase().includes(query),
        )

        if (!matchesPO && !matchesSupplier && !matchesUser && !matchesProducts) {
          return false
        }
      }

      return true
    })
  }, [purchaseOrders, activeTab, selectedDestination, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredPOs.length / perPage))
  const paginatedPOs = useMemo(() => {
    const start = (page - 1) * perPage
    return filteredPOs.slice(start, start + perPage)
  }, [filteredPOs, page, perPage])

  // --------------------------------------------------------------------------
  // Handlers: New PO Creation
  // --------------------------------------------------------------------------
  function resetNewPOForm() {
    setNewPOSupplier(AVAILABLE_SUPPLIERS[0])
    setNewPODestination(AVAILABLE_DESTINATIONS[0])
    const d = new Date()
    d.setDate(d.getDate() + 7)
    setNewPODeliveryDate(d.toISOString().split('T')[0])
    setNewPONotes('')
    setNewPOLines([
      {
        tempId: `temp-${Date.now()}`,
        productId: MASTER_PRODUCTS[0].id,
        productName: MASTER_PRODUCTS[0].name,
        sku: MASTER_PRODUCTS[0].sku,
        unit: MASTER_PRODUCTS[0].unit,
        quantity: 100,
        unitCost: MASTER_PRODUCTS[0].cost,
      },
    ])
  }

  function handleOpenNewPODrawer() {
    resetNewPOForm()
    setIsNewPODrawerOpen(true)
  }

  function handleAddLineItem() {
    const defaultProduct = MASTER_PRODUCTS[0]
    setNewPOLines((prev) => [
      ...prev,
      {
        tempId: `temp-${Date.now()}-${Math.random()}`,
        productId: defaultProduct.id,
        productName: defaultProduct.name,
        sku: defaultProduct.sku,
        unit: defaultProduct.unit,
        quantity: 50,
        unitCost: defaultProduct.cost,
      },
    ])
  }

  function handleRemoveLineItem(tempId: string) {
    if (newPOLines.length <= 1) {
      toast('A purchase order must contain at least one line item.', 'warning')
      return
    }
    setNewPOLines((prev) => prev.filter((item) => item.tempId !== tempId))
  }

  function handleProductChangeInLine(tempId: string, productId: string) {
    const prod = MASTER_PRODUCTS.find((p) => p.id === productId)
    if (!prod) return

    setNewPOLines((prev) =>
      prev.map((item) =>
        item.tempId === tempId
          ? {
              ...item,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              unit: prod.unit,
              unitCost: prod.cost,
            }
          : item,
      ),
    )
  }

  function handleQuantityChangeInLine(tempId: string, qty: number) {
    const validQty = Math.max(1, isNaN(qty) ? 1 : qty)
    setNewPOLines((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, quantity: validQty } : item)),
    )
  }

  function handleCostChangeInLine(tempId: string, cost: number) {
    const validCost = Math.max(0, isNaN(cost) ? 0 : cost)
    setNewPOLines((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, unitCost: validCost } : item)),
    )
  }

  // Calculate new PO drawer running totals
  const newPOSubtotal = useMemo(() => {
    return newPOLines.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
  }, [newPOLines])
  const newPOTax = newPOSubtotal * 0.05
  const newPOTotal = newPOSubtotal + newPOTax + 75.0 // $75 standard shipping

  function handleSaveNewPO(targetStatus: 'Draft' | 'Sent') {
    if (newPOLines.length === 0) {
      toast('Please add at least one line item.', 'error')
      return
    }

    // Generate next PO Number
    const nextNumber = 100 + purchaseOrders.length + 1
    const poNumber = `PO-2026-${nextNumber}`
    const today = new Date().toISOString().split('T')[0]

    const newLines: POLineItem[] = newPOLines.map((l, index) => ({
      id: `li-${nextNumber}-${index + 1}`,
      productId: l.productId,
      productName: l.productName,
      sku: l.sku,
      unit: l.unit,
      quantityOrdered: l.quantity,
      quantityReceived: 0,
      unitCost: l.unitCost,
    }))

    const initialAudit: AuditLogEntry[] = [
      {
        id: `aud-${nextNumber}-1`,
        timestamp: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        user: 'Current User (Admin)',
        action: targetStatus === 'Draft' ? 'Draft Created' : 'Order Created & Transmitted',
        details:
          targetStatus === 'Draft'
            ? `Purchase order created with ${newLines.length} line items ($${newPOTotal.toFixed(2)}).`
            : `Purchase order created and sent to ${newPOSupplier} via electronic dispatch.`,
      },
    ]

    const newPO: PurchaseOrder = {
      id: `po-${nextNumber}`,
      poNumber,
      supplier: newPOSupplier,
      supplierContact: {
        contactPerson: 'Vendor Dispatch Desk',
        email: `dispatch@${newPOSupplier.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        phone: '+1 (555) 019-8234',
        address: 'Logistics Center 10B, Distribution Way',
      },
      destination: newPODestination,
      status: targetStatus,
      orderDate: today,
      expectedDelivery: newPODeliveryDate,
      createdBy: {
        name: 'Current User',
        role: 'Purchasing Manager',
        initials: 'CU',
      },
      notes: newPONotes.trim() || undefined,
      shippingCost: 75.0,
      taxRate: 0.05,
      lines: newLines,
      receivingHistory: [],
      auditTrail: initialAudit,
    }

    setPurchaseOrders((prev) => [newPO, ...prev])
    setIsNewPODrawerOpen(false)

    if (targetStatus === 'Draft') {
      toast(`${poNumber} successfully saved as Draft.`, 'info')
    } else {
      toast(`${poNumber} dispatched to ${newPOSupplier}.`, 'success')
    }
  }

  // --------------------------------------------------------------------------
  // Handlers: Receiving Flow
  // --------------------------------------------------------------------------
  function handleOpenReceiveModal(po: PurchaseOrder, e?: React.MouseEvent) {
    if (e) e.stopPropagation()

    // Pre-populate receiving inputs with remaining balance
    const inputs: Record<string, { qty: number; batchNumber: string; expiryDate: string }> = {}
    const defaultBatch = `LOT-RCV-${Math.floor(1000 + Math.random() * 9000)}`
    const defaultExpiry = new Date()
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 2)
    const expiryStr = defaultExpiry.toISOString().split('T')[0]

    po.lines.forEach((line) => {
      const remaining = Math.max(0, line.quantityOrdered - line.quantityReceived)
      inputs[line.id] = {
        qty: remaining,
        batchNumber: defaultBatch,
        expiryDate: expiryStr,
      }
    })

    setReceivingInputs(inputs)
    setReceivingNotes('')
    setReceivingPO(po)
  }

  function handleReceiveQtyChange(lineId: string, val: number, maxQty: number) {
    const safeVal = Math.min(maxQty, Math.max(0, isNaN(val) ? 0 : val))
    setReceivingInputs((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        qty: safeVal,
      },
    }))
  }

  function handleReceiveBatchChange(lineId: string, batchNumber: string) {
    setReceivingInputs((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        batchNumber,
      },
    }))
  }

  function handleReceiveExpiryChange(lineId: string, expiryDate: string) {
    setReceivingInputs((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        expiryDate,
      },
    }))
  }

  function handleSetAllReceiveRemaining() {
    if (!receivingPO) return
    const updated = { ...receivingInputs }
    receivingPO.lines.forEach((l) => {
      const remaining = Math.max(0, l.quantityOrdered - l.quantityReceived)
      if (updated[l.id]) {
        updated[l.id].qty = remaining
      }
    })
    setReceivingInputs(updated)
  }

  function handleSetAllReceiveZero() {
    if (!receivingPO) return
    const updated = { ...receivingInputs }
    receivingPO.lines.forEach((l) => {
      if (updated[l.id]) {
        updated[l.id].qty = 0
      }
    })
    setReceivingInputs(updated)
  }

  function handleConfirmReceipt() {
    if (!receivingPO) return

    // Calculate items being received
    const itemsReceived: ReceivingItemReceipt[] = []
    let totalUnitsReceivedInBatch = 0

    receivingPO.lines.forEach((line) => {
      const input = receivingInputs[line.id]
      const qtyToReceive = input?.qty || 0
      if (qtyToReceive > 0) {
        itemsReceived.push({
          productId: line.productId,
          productName: line.productName,
          sku: line.sku,
          quantityReceived: qtyToReceive,
          batchNumber: input?.batchNumber || `LOT-${Date.now()}`,
          expiryDate: input?.expiryDate || '2028-12-31',
        })
        totalUnitsReceivedInBatch += qtyToReceive
      }
    })

    if (totalUnitsReceivedInBatch === 0) {
      toast('Please enter a quantity greater than zero for at least one item.', 'warning')
      return
    }

    const now = new Date()
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    const receiptNum = `RC-${Math.floor(1000 + Math.random() * 9000)}`

    const newReceipt: ReceivingRecord = {
      id: `rec-${Date.now()}`,
      receiptNumber: receiptNum,
      receivedAt: timestamp,
      receivedBy: 'Current User',
      notes: receivingNotes.trim() || undefined,
      items: itemsReceived,
    }

    // Calculate new lines state
    let allLinesComplete = true
    const updatedLines = receivingPO.lines.map((line) => {
      const added = receivingInputs[line.id]?.qty || 0
      const newReceived = line.quantityReceived + added
      if (newReceived < line.quantityOrdered) {
        allLinesComplete = false
      }
      return {
        ...line,
        quantityReceived: newReceived,
      }
    })

    const nextStatus: POStatus = allLinesComplete ? 'Received' : 'Partial'

    const auditEntry: AuditLogEntry = {
      id: `aud-recv-${Date.now()}`,
      timestamp,
      user: 'Current User',
      action: allLinesComplete ? 'Order Completed' : 'Partial Receipt Logged',
      details: `Logged Receipt ${receiptNum} with ${totalUnitsReceivedInBatch} units across ${itemsReceived.length} line items. Status set to ${nextStatus}.`,
    }

    const updatedPO: PurchaseOrder = {
      ...receivingPO,
      status: nextStatus,
      actualDeliveryDate: allLinesComplete ? now.toISOString().split('T')[0] : receivingPO.actualDeliveryDate,
      lines: updatedLines,
      receivingHistory: [newReceipt, ...receivingPO.receivingHistory],
      auditTrail: [auditEntry, ...receivingPO.auditTrail],
    }

    setPurchaseOrders((prev) =>
      prev.map((item) => (item.id === updatedPO.id ? updatedPO : item)),
    )

    // Update detail view if open
    if (selectedPODetail && selectedPODetail.id === updatedPO.id) {
      setSelectedPODetail(updatedPO)
    }

    setReceivingPO(null)
    toast(
      `Received ${totalUnitsReceivedInBatch} units for ${updatedPO.poNumber}. Status: ${nextStatus}.`,
      'success',
    )
  }

  // --------------------------------------------------------------------------
  // Handlers: Status Transitions (Send Draft, Cancel)
  // --------------------------------------------------------------------------
  function handleSendDraft(po: PurchaseOrder, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    const now = new Date()
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

    const auditEntry: AuditLogEntry = {
      id: `aud-send-${Date.now()}`,
      timestamp,
      user: 'Current User',
      action: 'Sent to Supplier',
      details: `Purchase order dispatched to ${po.supplier} by Current User.`,
    }

    const updatedPO: PurchaseOrder = {
      ...po,
      status: 'Sent',
      auditTrail: [auditEntry, ...po.auditTrail],
    }

    setPurchaseOrders((prev) =>
      prev.map((item) => (item.id === updatedPO.id ? updatedPO : item)),
    )

    if (selectedPODetail && selectedPODetail.id === updatedPO.id) {
      setSelectedPODetail(updatedPO)
    }

    toast(`${po.poNumber} has been transmitted to ${po.supplier}.`, 'success')
  }

  function handleCancelPO(po: PurchaseOrder, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    if (po.status === 'Received') {
      toast('Cannot cancel a fulfilled purchase order.', 'error')
      return
    }

    const now = new Date()
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

    const auditEntry: AuditLogEntry = {
      id: `aud-cancel-${Date.now()}`,
      timestamp,
      user: 'Current User',
      action: 'Order Cancelled',
      details: 'Order marked as cancelled by Current User.',
    }

    const updatedPO: PurchaseOrder = {
      ...po,
      status: 'Cancelled',
      auditTrail: [auditEntry, ...po.auditTrail],
    }

    setPurchaseOrders((prev) =>
      prev.map((item) => (item.id === updatedPO.id ? updatedPO : item)),
    )

    if (selectedPODetail && selectedPODetail.id === updatedPO.id) {
      setSelectedPODetail(updatedPO)
    }

    toast(`${po.poNumber} has been cancelled.`, 'warning')
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage supplier procurement, monitor shipment fulfillment, and log inventory intake."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => toast('Exporting purchase orders report...', 'info')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleOpenNewPODrawer}
            >
              + New PO
            </Button>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding className="border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">All Purchase Orders</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-text">{stats.totalCount}</p>
            <span className="text-xs font-medium text-muted">Active: {stats.activeCount}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Total pipeline volume across all vendors</p>
        </Card>

        <Card padding className="border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Awaiting Delivery</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Truck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-text">{formatCurrency(stats.activeValue)}</p>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              {stats.activeCount} orders
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">Committed transit and partial fulfillment</p>
        </Card>

        <Card padding className="border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Fulfilled Orders</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-text">{stats.receivedCount}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <TrendingUp className="h-3.5 w-3.5" /> 100% Verified
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">All line items safely inspected & stocked</p>
        </Card>

        <Card padding className="border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Draft Orders</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 text-slate-600">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-text">{stats.draftCount}</p>
            <span className="text-xs font-medium text-muted">Pending Review</span>
          </div>
          <p className="mt-1 text-xs text-muted">Drafts awaiting approval before transmission</p>
        </Card>
      </div>

      {/* Status Tabs Bar & Filter Bar */}
      <Card padding className="border-border">
        <div className="flex flex-col gap-4">
          {/* Horizontal Pill Bar */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'All', label: 'All Orders', count: tabCounts.All },
                  { id: 'Draft', label: 'Draft', count: tabCounts.Draft },
                  { id: 'Sent', label: 'Sent', count: tabCounts.Sent },
                  { id: 'Partial', label: 'Partial', count: tabCounts.Partial },
                  { id: 'Received', label: 'Received', count: tabCounts.Received },
                  { id: 'Cancelled', label: 'Cancelled', count: tabCounts.Cancelled },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id)
                      setPage(1)
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-app text-muted hover:bg-slate-200/60 hover:text-text',
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-300/60 text-text',
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search & Location Filter controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by PO number, supplier, product, or buyer..."
                className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex min-w-[170px] items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 text-muted" />
                <select
                  value={selectedDestination}
                  onChange={(e) => {
                    setSelectedDestination(e.target.value)
                    setPage(1)
                  }}
                  className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="All">All Destinations</option>
                  {AVAILABLE_DESTINATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {(searchQuery || selectedDestination !== 'All' || activeTab !== 'All') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedDestination('All')
                    setActiveTab('All')
                    setPage(1)
                  }}
                  className="h-10 text-xs text-muted"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card padding={false} className="overflow-hidden border-border">
        {paginatedPOs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted/40" />
            <h3 className="mt-3 text-base font-semibold text-text">No purchase orders found</h3>
            <p className="mt-1 text-sm text-muted">
              Try adjusting your search criteria or create a new purchase order.
            </p>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              className="mt-4"
              onClick={handleOpenNewPODrawer}
            >
              Create Purchase Order
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border bg-app/80 text-xs font-semibold text-muted">
                <tr>
                  <th className="px-4 py-3.5">PO Number</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">Destination</th>
                  <th className="px-4 py-3.5 text-right">Total Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Expected Delivery</th>
                  <th className="px-4 py-3.5">Created By</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedPOs.map((po) => {
                  const totals = calculatePOTotals(po)
                  const isDraft = po.status === 'Draft'
                  const isPartial = po.status === 'Partial'
                  const isReceived = po.status === 'Received'

                  // Dynamic row tinting
                  const rowClass = cn(
                    'cursor-pointer transition-colors',
                    isDraft && 'bg-slate-50/70 hover:bg-slate-100/80',
                    isReceived && 'bg-emerald-50/30 hover:bg-emerald-100/40',
                    !isDraft && !isReceived && 'hover:bg-app/60',
                  )

                  return (
                    <tr
                      key={po.id}
                      onClick={() => setSelectedPODetail(po)}
                      className={rowClass}
                    >
                      {/* PO Number (Monospace) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-primary hover:underline">
                            {po.poNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted">{po.orderDate}</span>
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-text">
                          <Building2 className="h-3.5 w-3.5 text-muted" />
                          <span>{po.supplier}</span>
                        </div>
                        <span className="text-xs text-muted">
                          {po.lines.length} {po.lines.length === 1 ? 'line item' : 'line items'}
                        </span>
                      </td>

                      {/* Destination */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-sm text-text">
                          <MapPin className="h-3.5 w-3.5 text-muted" />
                          <span>{po.destination}</span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3.5 text-right font-semibold text-text">
                        <div>{formatCurrency(totals.total)}</div>
                        <span className="text-[11px] font-normal text-muted">
                          Subtotal: {formatCurrency(totals.subtotal)}
                        </span>
                      </td>

                      {/* Status + Progress for Partial */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <div>
                            <Chip label={po.status} tone={statusTone(po.status)} />
                          </div>
                          {isPartial && (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-amber-500 transition-all"
                                  style={{ width: `${totals.progressPercent}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-medium text-amber-700">
                                {totals.progressPercent}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Expected Delivery */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-text">
                          <Calendar className="h-3.5 w-3.5 text-muted" />
                          <span>{po.expectedDelivery}</span>
                        </div>
                        {isReceived ? (
                          <span className="text-[11px] text-success">
                            Delivered {po.actualDeliveryDate || po.expectedDelivery}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted">Scheduled</span>
                        )}
                      </td>

                      {/* Created By */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {po.createdBy.initials}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-text">
                              {po.createdBy.name}
                            </div>
                            <div className="text-[10px] text-muted">{po.createdBy.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(po.status === 'Sent' || po.status === 'Partial') && (
                            <Button
                              variant="success"
                              className="h-8 px-2.5 text-xs font-medium"
                              icon={<Package className="h-3.5 w-3.5" />}
                              onClick={(e) => handleOpenReceiveModal(po, e)}
                            >
                              Receive
                            </Button>
                          )}

                          {po.status === 'Draft' && (
                            <Button
                              variant="primary"
                              className="h-8 px-2.5 text-xs font-medium"
                              icon={<Send className="h-3.5 w-3.5" />}
                              onClick={(e) => handleSendDraft(po, e)}
                            >
                              Send
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            className="h-8 px-2 text-xs"
                            onClick={() => setSelectedPODetail(po)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="flex flex-col items-center justify-between border-t border-border px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted">
            Showing <span className="font-medium text-text">{paginatedPOs.length}</span> of{' '}
            <span className="font-medium text-text">{filteredPOs.length}</span> purchase orders
          </p>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </Card>

      {/* ---------------------------------------------------------------------- */}
      {/* Drawer: New PO Flow (Wide)                                             */}
      {/* ---------------------------------------------------------------------- */}
      <Drawer
        open={isNewPODrawerOpen}
        title="Create New Purchase Order"
        wide={true}
        onClose={() => setIsNewPODrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsNewPODrawerOpen(false)}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={<FileText className="h-4 w-4" />}
                onClick={() => handleSaveNewPO('Draft')}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                icon={<Send className="h-4 w-4" />}
                onClick={() => handleSaveNewPO('Sent')}
              >
                Send to Supplier
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Order Meta Section */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Supplier"
              value={newPOSupplier}
              onChange={(e) => setNewPOSupplier(e.target.value)}
              options={AVAILABLE_SUPPLIERS.map((s) => ({ value: s, label: s }))}
            />

            <Select
              label="Destination Location"
              value={newPODestination}
              onChange={(e) => setNewPODestination(e.target.value)}
              options={AVAILABLE_DESTINATIONS.map((d) => ({ value: d, label: d }))}
            />

            <Input
              label="Expected Delivery Date"
              type="date"
              value={newPODeliveryDate}
              onChange={(e) => setNewPODeliveryDate(e.target.value)}
            />
          </div>

          {/* Line Items Section */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text">Order Line Items</h3>
                <p className="text-xs text-muted">
                  Add products to order, set quantities, and review unit purchase costs.
                </p>
              </div>
              <Button
                variant="secondary"
                className="h-8 px-2.5 text-xs"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleAddLineItem}
              >
                + Add Line
              </Button>
            </div>

            <div className="overflow-x-auto rounded-[8px] border border-border bg-surface">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-b border-border bg-app/80 font-medium text-muted">
                  <tr>
                    <th className="px-3 py-2.5">Product</th>
                    <th className="px-3 py-2.5">SKU / Unit</th>
                    <th className="px-3 py-2.5 w-24">Quantity</th>
                    <th className="px-3 py-2.5 w-28 text-right">Unit Cost ($)</th>
                    <th className="px-3 py-2.5 text-right">Line Total</th>
                    <th className="px-3 py-2.5 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {newPOLines.map((line) => {
                    const lineTotal = line.quantity * line.unitCost
                    return (
                      <tr key={line.tempId} className="hover:bg-app/40">
                        {/* Product Dropdown */}
                        <td className="px-3 py-2">
                          <select
                            value={line.productId}
                            onChange={(e) =>
                              handleProductChangeInLine(line.tempId, e.target.value)
                            }
                            className="h-9 w-full rounded-[6px] border border-border bg-surface px-2 text-xs text-text outline-none focus:border-primary"
                          >
                            {MASTER_PRODUCTS.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} ({prod.category})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* SKU & Unit */}
                        <td className="px-3 py-2 text-muted">
                          <div className="font-mono text-text">{line.sku}</div>
                          <div className="text-[10px]">per {line.unit}</div>
                        </td>

                        {/* Quantity */}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) =>
                              handleQuantityChangeInLine(
                                line.tempId,
                                parseInt(e.target.value, 10),
                              )
                            }
                            className="h-9 w-20 rounded-[6px] border border-border bg-surface px-2 text-center text-xs text-text outline-none focus:border-primary"
                          />
                        </td>

                        {/* Unit Cost */}
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitCost}
                            onChange={(e) =>
                              handleCostChangeInLine(
                                line.tempId,
                                parseFloat(e.target.value),
                              )
                            }
                            className="h-9 w-24 rounded-[6px] border border-border bg-surface px-2 text-right text-xs text-text outline-none focus:border-primary"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="px-3 py-2 text-right font-medium text-text">
                          {formatCurrency(lineTotal)}
                        </td>

                        {/* Delete line */}
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(line.tempId)}
                            className="rounded-[6px] p-1.5 text-muted hover:bg-red-50 hover:text-error"
                            title="Remove line"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Card */}
            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-2 rounded-[8px] border border-border bg-app/50 p-3 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Subtotal ({newPOLines.length} lines):</span>
                  <span className="font-medium text-text">{formatCurrency(newPOSubtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Estimated Tax (5%):</span>
                  <span className="font-medium text-text">{formatCurrency(newPOTax)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Standard Shipping:</span>
                  <span className="font-medium text-text">{formatCurrency(75.0)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-text">
                  <span>Total Cost:</span>
                  <span className="text-primary">{formatCurrency(newPOTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes textarea */}
          <div>
            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-sm font-medium text-text">Vendor Instructions & Notes</span>
              <textarea
                rows={3}
                value={newPONotes}
                onChange={(e) => setNewPONotes(e.target.value)}
                placeholder="Add special packaging, dock handling instructions, or internal requisition references..."
                className="w-full rounded-[8px] border border-border bg-surface p-3 text-xs text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
        </div>
      </Drawer>

      {/* ---------------------------------------------------------------------- */}
      {/* Modal: Receiving Flow                                                  */}
      {/* ---------------------------------------------------------------------- */}
      <Modal
        open={receivingPO !== null}
        title={`Receive Items — ${receivingPO?.poNumber || ''}`}
        confirmLabel="Confirm Receipt"
        cancelLabel="Cancel"
        confirmVariant="success"
        onConfirm={handleConfirmReceipt}
        onClose={() => setReceivingPO(null)}
      >
        {receivingPO && (
          <div className="space-y-4">
            {/* Context Header */}
            <div className="rounded-[8px] border border-border bg-app/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-text">{receivingPO.supplier}</span>
                  <span className="text-muted"> → {receivingPO.destination}</span>
                </div>
                <Chip label={receivingPO.status} tone={statusTone(receivingPO.status)} />
              </div>
              <p className="mt-1 text-muted">
                Input the quantities inspected and accepted at dock intake today.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-text">Items to Receive</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSetAllReceiveRemaining}
                  className="font-medium text-primary hover:underline"
                >
                  Receive All Remaining
                </button>
                <span className="text-muted">·</span>
                <button
                  type="button"
                  onClick={handleSetAllReceiveZero}
                  className="text-muted hover:text-text hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Line Items Receiving List */}
            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
              {receivingPO.lines.map((line) => {
                const remaining = Math.max(0, line.quantityOrdered - line.quantityReceived)
                const currentInput = receivingInputs[line.id] || {
                  qty: 0,
                  batchNumber: '',
                  expiryDate: '',
                }

                return (
                  <div
                    key={line.id}
                    className="rounded-[8px] border border-border bg-surface p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-text">{line.productName}</div>
                        <div className="text-[11px] text-muted">
                          SKU: {line.sku} · Ordered: {line.quantityOrdered} · Received:{' '}
                          {line.quantityReceived}
                        </div>
                      </div>
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-[11px] font-semibold',
                          remaining === 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800',
                        )}
                      >
                        {remaining} remaining
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div>
                        <label className="text-[11px] font-medium text-text">
                          Receive Qty ({line.unit})
                        </label>
                        <div className="mt-1 flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={currentInput.qty}
                            onChange={(e) =>
                              handleReceiveQtyChange(
                                line.id,
                                parseInt(e.target.value, 10),
                                remaining,
                              )
                            }
                            className="h-8 w-full rounded-[6px] border border-border bg-surface px-2 text-center text-xs font-semibold text-text outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => handleReceiveQtyChange(line.id, remaining, remaining)}
                            className="h-8 rounded-[6px] border border-border bg-app px-2 text-[10px] font-medium text-text hover:bg-slate-200"
                          >
                            Max
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-text">
                          Batch / Lot #
                        </label>
                        <input
                          type="text"
                          value={currentInput.batchNumber}
                          onChange={(e) => handleReceiveBatchChange(line.id, e.target.value)}
                          placeholder="e.g. LOT-2026-X"
                          className="mt-1 h-8 w-full rounded-[6px] border border-border bg-surface px-2 text-xs text-text outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-text">
                          Expiration Date
                        </label>
                        <input
                          type="date"
                          value={currentInput.expiryDate}
                          onChange={(e) => handleReceiveExpiryChange(line.id, e.target.value)}
                          className="mt-1 h-8 w-full rounded-[6px] border border-border bg-surface px-2 text-xs text-text outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Receiving Notes */}
            <div>
              <label className="text-xs font-medium text-text">
                Receiving Notes & Inspection Log
              </label>
              <input
                type="text"
                value={receivingNotes}
                onChange={(e) => setReceivingNotes(e.target.value)}
                placeholder="e.g. Pallet seal intact; cold chain logger verified at 3.5°C"
                className="mt-1 h-9 w-full rounded-[8px] border border-border bg-surface px-3 text-xs text-text outline-none focus:border-primary"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ---------------------------------------------------------------------- */}
      {/* Drawer: Detail View (Wide)                                             */}
      {/* ---------------------------------------------------------------------- */}
      <Drawer
        open={selectedPODetail !== null}
        title={`Purchase Order: ${selectedPODetail?.poNumber || ''}`}
        wide={true}
        onClose={() => setSelectedPODetail(null)}
        footer={
          selectedPODetail ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  icon={<Printer className="h-4 w-4" />}
                  onClick={() => toast(`Printing document for ${selectedPODetail.poNumber}...`, 'info')}
                >
                  Print PO
                </Button>
                {selectedPODetail.status !== 'Received' &&
                  selectedPODetail.status !== 'Cancelled' && (
                    <Button
                      variant="destructiveOutline"
                      icon={<XCircle className="h-4 w-4" />}
                      onClick={() => handleCancelPO(selectedPODetail)}
                    >
                      Cancel Order
                    </Button>
                  )}
              </div>

              <div className="flex items-center gap-2">
                {selectedPODetail.status === 'Draft' && (
                  <Button
                    variant="primary"
                    icon={<Send className="h-4 w-4" />}
                    onClick={() => handleSendDraft(selectedPODetail)}
                  >
                    Send to Supplier
                  </Button>
                )}

                {(selectedPODetail.status === 'Sent' ||
                  selectedPODetail.status === 'Partial') && (
                  <Button
                    variant="success"
                    icon={<Package className="h-4 w-4" />}
                    onClick={() => handleOpenReceiveModal(selectedPODetail)}
                  >
                    Receive Items
                  </Button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {selectedPODetail && (
          <div className="space-y-6">
            {/* Status & Highlights Card */}
            <div className="rounded-[12px] border border-border bg-app/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-bold text-text">
                      {selectedPODetail.poNumber}
                    </span>
                    <Chip
                      label={selectedPODetail.status}
                      tone={statusTone(selectedPODetail.status)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Ordered on {selectedPODetail.orderDate} · Expected on{' '}
                    {selectedPODetail.expectedDelivery}
                  </p>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-xs text-muted">Total Order Value</span>
                  <div className="text-xl font-bold text-primary">
                    {formatCurrency(calculatePOTotals(selectedPODetail).total)}
                  </div>
                </div>
              </div>

              {/* Progress bar for partial */}
              {selectedPODetail.status === 'Partial' && (
                <div className="mt-4 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text">Fulfillment Progress</span>
                    <span className="font-semibold text-amber-700">
                      {calculatePOTotals(selectedPODetail).progressPercent}% (
                      {calculatePOTotals(selectedPODetail).totalReceived} of{' '}
                      {calculatePOTotals(selectedPODetail).totalOrdered} units)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{
                        width: `${calculatePOTotals(selectedPODetail).progressPercent}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Key Information 3-Column Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Supplier Info */}
              <div className="rounded-[8px] border border-border bg-surface p-3.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-text">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Supplier Details</span>
                </div>
                <div className="mt-2.5 font-medium text-text">{selectedPODetail.supplier}</div>
                <div className="mt-1 text-muted">
                  Contact: {selectedPODetail.supplierContact.contactPerson}
                </div>
                <div className="text-muted">{selectedPODetail.supplierContact.email}</div>
                <div className="text-muted">{selectedPODetail.supplierContact.phone}</div>
                <div className="mt-1 text-[11px] text-muted">
                  {selectedPODetail.supplierContact.address}
                </div>
              </div>

              {/* Destination & Delivery */}
              <div className="rounded-[8px] border border-border bg-surface p-3.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-text">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Ship To Location</span>
                </div>
                <div className="mt-2.5 font-medium text-text">
                  {selectedPODetail.destination}
                </div>
                <div className="mt-1 text-muted">Facility Receiving Dock #2</div>
                <div className="mt-2 border-t border-border pt-2">
                  <div className="text-muted">
                    Order Date:{' '}
                    <span className="font-medium text-text">{selectedPODetail.orderDate}</span>
                  </div>
                  <div className="text-muted">
                    Expected:{' '}
                    <span className="font-medium text-text">
                      {selectedPODetail.expectedDelivery}
                    </span>
                  </div>
                  {selectedPODetail.actualDeliveryDate && (
                    <div className="text-success">
                      Received:{' '}
                      <span className="font-medium">
                        {selectedPODetail.actualDeliveryDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Originator / Created By */}
              <div className="rounded-[8px] border border-border bg-surface p-3.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-text">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Order Origin</span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {selectedPODetail.createdBy.initials}
                  </div>
                  <div>
                    <div className="font-medium text-text">
                      {selectedPODetail.createdBy.name}
                    </div>
                    <div className="text-[11px] text-muted">
                      {selectedPODetail.createdBy.role}
                    </div>
                  </div>
                </div>
                {selectedPODetail.notes && (
                  <div className="mt-3 rounded bg-app p-2 text-[11px] text-text">
                    <span className="font-semibold text-muted">Notes: </span>
                    {selectedPODetail.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text">
                  Line Items ({selectedPODetail.lines.length})
                </h3>
                <span className="text-xs text-muted">
                  Total Items: {calculatePOTotals(selectedPODetail).totalOrdered}
                </span>
              </div>

              <div className="overflow-x-auto rounded-[8px] border border-border bg-surface">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="border-b border-border bg-app/80 font-medium text-muted">
                    <tr>
                      <th className="px-3 py-2.5">Product</th>
                      <th className="px-3 py-2.5">SKU</th>
                      <th className="px-3 py-2.5 text-right">Unit Cost</th>
                      <th className="px-3 py-2.5 text-center">Ordered</th>
                      <th className="px-3 py-2.5 text-center">Received</th>
                      <th className="px-3 py-2.5">Fulfillment</th>
                      <th className="px-3 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedPODetail.lines.map((line) => {
                      const lineTotal = line.quantityOrdered * line.unitCost
                      const pct =
                        line.quantityOrdered > 0
                          ? Math.round((line.quantityReceived / line.quantityOrdered) * 100)
                          : 0

                      return (
                        <tr key={line.id} className="hover:bg-app/40">
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-text">{line.productName}</div>
                            <span className="text-[10px] text-muted">Unit: {line.unit}</span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-muted">{line.sku}</td>
                          <td className="px-3 py-2.5 text-right font-medium text-text">
                            {formatCurrency(line.unitCost)}
                          </td>
                          <td className="px-3 py-2.5 text-center font-medium text-text">
                            {line.quantityOrdered}
                          </td>
                          <td className="px-3 py-2.5 text-center font-semibold text-text">
                            <span
                              className={cn(
                                line.quantityReceived === line.quantityOrdered
                                  ? 'text-success'
                                  : line.quantityReceived > 0
                                    ? 'text-amber-600'
                                    : 'text-muted',
                              )}
                            >
                              {line.quantityReceived}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    pct === 100 ? 'bg-success' : 'bg-amber-500',
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-text">
                            {formatCurrency(lineTotal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="mt-3 flex justify-end">
                <div className="w-full max-w-xs space-y-1.5 rounded-[8px] border border-border bg-app/50 p-3 text-xs">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal:</span>
                    <span className="font-medium text-text">
                      {formatCurrency(calculatePOTotals(selectedPODetail).subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Tax (5%):</span>
                    <span className="font-medium text-text">
                      {formatCurrency(calculatePOTotals(selectedPODetail).tax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Freight / Shipping:</span>
                    <span className="font-medium text-text">
                      {formatCurrency(selectedPODetail.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-text">
                    <span>Grand Total:</span>
                    <span className="text-primary">
                      {formatCurrency(calculatePOTotals(selectedPODetail).total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Receiving History Section */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-text">Receiving History</h3>
                </div>
                <span className="text-xs text-muted">
                  {selectedPODetail.receivingHistory.length}{' '}
                  {selectedPODetail.receivingHistory.length === 1 ? 'receipt' : 'receipts'} logged
                </span>
              </div>

              {selectedPODetail.receivingHistory.length === 0 ? (
                <div className="rounded-[8px] border border-dashed border-border bg-app/30 p-4 text-center text-xs text-muted">
                  No dock receiving receipts logged yet. When items arrive, click &ldquo;Receive Items&rdquo; to record intake.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPODetail.receivingHistory.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="rounded-[8px] border border-border bg-surface p-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-text">
                            {receipt.receiptNumber}
                          </span>
                          <span className="text-muted">· Received by {receipt.receivedBy}</span>
                        </div>
                        <span className="text-[11px] text-muted">{receipt.receivedAt}</span>
                      </div>

                      {receipt.notes && (
                        <p className="mt-1 text-[11px] text-slate-600 italic">
                          &ldquo;{receipt.notes}&rdquo;
                        </p>
                      )}

                      <div className="mt-2.5 divide-y divide-border rounded border border-border bg-app/40">
                        {receipt.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3 py-1.5 text-[11px]"
                          >
                            <span className="font-medium text-text">{item.productName}</span>
                            <div className="flex items-center gap-3 text-muted">
                              {item.batchNumber && (
                                <span className="font-mono">{item.batchNumber}</span>
                              )}
                              {item.expiryDate && (
                                <span>Exp: {item.expiryDate}</span>
                              )}
                              <span className="font-semibold text-success">
                                +{item.quantityReceived} units
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Trail Section */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-text">Audit Trail</h3>
              </div>

              <div className="rounded-[8px] border border-border bg-surface p-4">
                <ol className="relative border-l border-border pl-4 space-y-4 text-xs">
                  {selectedPODetail.auditTrail.map((entry) => (
                    <li key={entry.id} className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary" />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text">{entry.action}</span>
                        <span className="text-[10px] text-muted">{entry.timestamp}</span>
                      </div>
                      <p className="mt-0.5 text-muted">{entry.details}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Logged by <span className="font-medium">{entry.user}</span>
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
