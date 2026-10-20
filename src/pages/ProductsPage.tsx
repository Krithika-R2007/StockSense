import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Filter,
  MoreVertical,
  Package,
  PackageSearch,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Drawer } from '../components/ui/Drawer'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Pagination } from '../components/ui/Pagination'
import { PageHeader } from '../components/layout/PageHeader'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'

export type ProductCategory =
  | 'Electronics'
  | 'Food & Beverage'
  | 'Office Supplies'
  | 'Chemicals'
  | 'Raw Materials'

export interface ProductItem {
  id: string
  sku: string
  name: string
  description?: string
  category: ProductCategory
  supplier: string
  unit: string
  cost: number
  price: number
  isActive: boolean
  isPerishable: boolean
  shelfLifeDays?: number
  transactions: number
  image?: string
}

const CATEGORIES: ProductCategory[] = [
  'Electronics',
  'Food & Beverage',
  'Office Supplies',
  'Chemicals',
  'Raw Materials',
]

const SUPPLIERS = [
  'Apex Tech',
  'TechCraft',
  'GreenFields Organic',
  'PaperCraft Ltd',
  'BioChem Global',
  'Omega Materials',
]

const UNITS = ['pcs', 'kg', 'L', 'box', 'pack', 'unit', 'meter']

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-001',
    sku: 'SKU-001',
    name: 'Digital Multimeter Pro',
    description: 'High-precision industrial autoranging digital multimeter with backlight LCD.',
    category: 'Electronics',
    supplier: 'Apex Tech',
    unit: 'pcs',
    cost: 28.5,
    price: 49.99,
    isActive: true,
    isPerishable: false,
    transactions: 14,
  },
  {
    id: 'prod-002',
    sku: 'SKU-002',
    name: 'Soldering Station 60W',
    description: 'Adjustable temperature soldering station with ceramic heating core.',
    category: 'Electronics',
    supplier: 'Apex Tech',
    unit: 'pcs',
    cost: 42.0,
    price: 75.0,
    isActive: true,
    isPerishable: false,
    transactions: 8,
  },
  {
    id: 'prod-003',
    sku: 'SKU-003',
    name: 'USB-C Industrial Cable 2m',
    description: 'Braided reinforced nylon fast-charging and data transfer cable.',
    category: 'Electronics',
    supplier: 'TechCraft',
    unit: 'pcs',
    cost: 4.2,
    price: 11.5,
    isActive: true,
    isPerishable: false,
    transactions: 25,
  },
  {
    id: 'prod-004',
    sku: 'SKU-004',
    name: 'Thermal Imaging Sensor',
    description: 'Infrared compact sensor module with high sensitivity and I2C output.',
    category: 'Electronics',
    supplier: 'TechCraft',
    unit: 'pcs',
    cost: 115.0,
    price: 189.0,
    isActive: true,
    isPerishable: false,
    transactions: 3,
  },
  {
    id: 'prod-005',
    sku: 'SKU-005',
    name: 'Li-Ion Battery Pack 12V',
    description: 'Rechargeable 3000mAh battery pack with built-in protection circuit.',
    category: 'Electronics',
    supplier: 'Apex Tech',
    unit: 'pcs',
    cost: 34.0,
    price: 59.9,
    isActive: false,
    isPerishable: true,
    shelfLifeDays: 730,
    transactions: 19,
  },
  {
    id: 'prod-006',
    sku: 'SKU-006',
    name: 'Organic Arabica Coffee Beans',
    description: 'Fair-trade whole bean dark roast harvested from high altitude estates.',
    category: 'Food & Beverage',
    supplier: 'GreenFields Organic',
    unit: 'kg',
    cost: 14.5,
    price: 26.0,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 365,
    transactions: 42,
  },
  {
    id: 'prod-007',
    sku: 'SKU-007',
    name: 'Pure Olive Oil Extra Virgin',
    description: 'Cold-pressed extra virgin culinary grade olive oil in amber glass bottle.',
    category: 'Food & Beverage',
    supplier: 'GreenFields Organic',
    unit: 'L',
    cost: 8.8,
    price: 16.5,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 540,
    transactions: 30,
  },
  {
    id: 'prod-008',
    sku: 'SKU-008',
    name: 'Premium Almond Milk 1L',
    description: 'Unsweetened plant-based almond beverage, shelf-stable aseptic carton.',
    category: 'Food & Beverage',
    supplier: 'GreenFields Organic',
    unit: 'L',
    cost: 1.6,
    price: 3.8,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 180,
    transactions: 12,
  },
  {
    id: 'prod-009',
    sku: 'SKU-009',
    name: 'Dark Chocolate Chips 70%',
    description: 'Organic bittersweet couverture chocolate morsels for confectionary.',
    category: 'Food & Beverage',
    supplier: 'GreenFields Organic',
    unit: 'kg',
    cost: 9.2,
    price: 18.0,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 365,
    transactions: 5,
  },
  {
    id: 'prod-010',
    sku: 'SKU-010',
    name: 'Artisan Sea Salt Flakes',
    description: 'Natural mineral sea salt pyramid crystals collected by evaporation.',
    category: 'Food & Beverage',
    supplier: 'GreenFields Organic',
    unit: 'kg',
    cost: 4.5,
    price: 9.99,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 720,
    transactions: 0,
  },
  {
    id: 'prod-011',
    sku: 'SKU-011',
    name: 'Recycled Copy Paper A4',
    description: '80gsm high opacity multi-purpose office copy paper carton (5 reams).',
    category: 'Office Supplies',
    supplier: 'PaperCraft Ltd',
    unit: 'box',
    cost: 18.0,
    price: 29.5,
    isActive: true,
    isPerishable: false,
    transactions: 65,
  },
  {
    id: 'prod-012',
    sku: 'SKU-012',
    name: 'Ergonomic Gel Pens 0.7mm',
    description: 'Smooth flowing waterproof pigment black gel pens, 12 count pack.',
    category: 'Office Supplies',
    supplier: 'PaperCraft Ltd',
    unit: 'pack',
    cost: 3.5,
    price: 7.99,
    isActive: true,
    isPerishable: false,
    transactions: 22,
  },
  {
    id: 'prod-013',
    sku: 'SKU-013',
    name: 'Heavy Duty Desk Stapler',
    description: 'All-metal desk stapler with anti-jam mechanism up to 60 sheets.',
    category: 'Office Supplies',
    supplier: 'PaperCraft Ltd',
    unit: 'pcs',
    cost: 12.0,
    price: 22.5,
    isActive: true,
    isPerishable: false,
    transactions: 9,
  },
  {
    id: 'prod-014',
    sku: 'SKU-014',
    name: 'Adhesive Sticky Notes 3x3',
    description: 'Pastel yellow self-stick removable notes pads 100 sheets each.',
    category: 'Office Supplies',
    supplier: 'PaperCraft Ltd',
    unit: 'pack',
    cost: 2.1,
    price: 4.5,
    isActive: true,
    isPerishable: false,
    transactions: 17,
  },
  {
    id: 'prod-015',
    sku: 'SKU-015',
    name: 'Expanding File Folder 12-Pocket',
    description: 'Durable polypropylene accordion filing organizer with customizable tabs.',
    category: 'Office Supplies',
    supplier: 'PaperCraft Ltd',
    unit: 'pcs',
    cost: 5.4,
    price: 12.0,
    isActive: false,
    isPerishable: false,
    transactions: 0,
  },
  {
    id: 'prod-016',
    sku: 'SKU-016',
    name: 'Isopropyl Alcohol 99.9%',
    description: 'Technical grade pure solvent for precision cleaning and sanitization.',
    category: 'Chemicals',
    supplier: 'BioChem Global',
    unit: 'L',
    cost: 6.2,
    price: 12.5,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 730,
    transactions: 55,
  },
  {
    id: 'prod-017',
    sku: 'SKU-017',
    name: 'Industrial Degreaser Concentrated',
    description: 'Water-soluble alkaline cleaning compound for machine workshops.',
    category: 'Chemicals',
    supplier: 'BioChem Global',
    unit: 'L',
    cost: 11.0,
    price: 21.0,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 365,
    transactions: 18,
  },
  {
    id: 'prod-018',
    sku: 'SKU-018',
    name: 'Acetone ACS Grade',
    description: 'Laboratory solvent for high-performance extraction and parts prep.',
    category: 'Chemicals',
    supplier: 'BioChem Global',
    unit: 'L',
    cost: 7.5,
    price: 15.0,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 730,
    transactions: 11,
  },
  {
    id: 'prod-019',
    sku: 'SKU-019',
    name: 'Neutral pH Floor Cleaner',
    description: 'No-rinse neutral sanitizer suitable for epoxy and sealed concrete floors.',
    category: 'Chemicals',
    supplier: 'BioChem Global',
    unit: 'L',
    cost: 4.8,
    price: 9.5,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 365,
    transactions: 24,
  },
  {
    id: 'prod-020',
    sku: 'SKU-020',
    name: 'Laboratory Disinfectant Spray',
    description: 'Broad spectrum quaternary ammonium bactericidal and fungicidal spray.',
    category: 'Chemicals',
    supplier: 'BioChem Global',
    unit: 'pcs',
    cost: 5.5,
    price: 11.2,
    isActive: true,
    isPerishable: true,
    shelfLifeDays: 365,
    transactions: 0,
  },
  {
    id: 'prod-021',
    sku: 'SKU-021',
    name: 'Aluminum Extrusion Bar 2m',
    description: '6063-T5 architectural standard anodized square profile strut.',
    category: 'Raw Materials',
    supplier: 'Omega Materials',
    unit: 'pcs',
    cost: 16.5,
    price: 31.0,
    isActive: true,
    isPerishable: false,
    transactions: 38,
  },
  {
    id: 'prod-022',
    sku: 'SKU-022',
    name: 'Stainless Steel Screws M4',
    description: 'Grade 304 corrosion-resistant metric pan head machine screws (100pk).',
    category: 'Raw Materials',
    supplier: 'Omega Materials',
    unit: 'pack',
    cost: 8.2,
    price: 15.9,
    isActive: true,
    isPerishable: false,
    transactions: 44,
  },
  {
    id: 'prod-023',
    sku: 'SKU-023',
    name: 'HDPE Polymer Pellets',
    description: 'Virgin blow molding resin pellets for plastic container manufacturing.',
    category: 'Raw Materials',
    supplier: 'Omega Materials',
    unit: 'kg',
    cost: 2.8,
    price: 5.4,
    isActive: true,
    isPerishable: false,
    transactions: 16,
  },
  {
    id: 'prod-024',
    sku: 'SKU-024',
    name: 'Copper Wire Spool 18AWG',
    description: 'Solid enameled magnetic copper winding wire on 500g spool.',
    category: 'Raw Materials',
    supplier: 'Omega Materials',
    unit: 'pcs',
    cost: 24.0,
    price: 45.0,
    isActive: true,
    isPerishable: false,
    transactions: 12,
  },
  {
    id: 'prod-025',
    sku: 'SKU-025',
    name: 'Carbon Fiber Sheet 2mm',
    description: '3K twill weave glossy vacuum infused carbon composite panel 400x500mm.',
    category: 'Raw Materials',
    supplier: 'Omega Materials',
    unit: 'pcs',
    cost: 68.0,
    price: 118.0,
    isActive: false,
    isPerishable: false,
    transactions: 0,
  },
]

function getCategoryTone(
  category: ProductCategory,
): 'info' | 'good' | 'neutral' | 'warning' | 'critical' {
  switch (category) {
    case 'Electronics':
      return 'info'
    case 'Food & Beverage':
      return 'good'
    case 'Office Supplies':
      return 'neutral'
    case 'Chemicals':
      return 'warning'
    case 'Raw Materials':
      return 'critical'
    default:
      return 'neutral'
  }
}

export function ProductsPage() {
  const { toast } = useToast()

  // Data state
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS)
  const [isLoading, setIsLoading] = useState(true)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [supplierFilter, setSupplierFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Selection & pagination
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Dropdown menu state per row
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Drawer state (Add / Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [drawerForm, setDrawerForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Electronics' as ProductCategory,
    supplier: 'Apex Tech',
    unit: 'pcs',
    cost: '0.00',
    price: '0.00',
    isPerishable: false,
    shelfLifeDays: '365',
    isActive: true,
    image: '',
  })

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  // Bulk Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1)
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [importRowsCount, setImportRowsCount] = useState<number>(5)

  // Initial simulated loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [])

  // Debounced search (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close row action dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeMenuId])

  // Generate next SKU
  function generateNextSku(): string {
    const numbers = products
      .map((p) => {
        const match = p.sku.match(/SKU-(\d+)/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((n) => !isNaN(n))
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0
    const next = maxNum + 1
    return `SKU-${next.toString().padStart(3, '0')}`
  }

  // Filtered and searched data
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim()
        const matchesName = item.name.toLowerCase().includes(query)
        const matchesSku = item.sku.toLowerCase().includes(query)
        const matchesSupplier = item.supplier.toLowerCase().includes(query)
        if (!matchesName && !matchesSku && !matchesSupplier) return false
      }

      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false
      }

      if (supplierFilter !== 'ALL' && item.supplier !== supplierFilter) {
        return false
      }

      if (statusFilter === 'active' && !item.isActive) return false
      if (statusFilter === 'inactive' && item.isActive) return false

      return true
    })
  }, [products, debouncedSearch, categoryFilter, supplierFilter, statusFilter])

  // Paginated data
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, page, pageSize])

  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize

  // Checkbox handlers
  const allCurrentPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.has(p.id))

  const isIndeterminate =
    paginatedProducts.some((p) => selectedIds.has(p.id)) && !allCurrentPageSelected

  function handleSelectAllCurrent(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        paginatedProducts.forEach((p) => next.add(p.id))
      } else {
        paginatedProducts.forEach((p) => next.delete(p.id))
      }
      return next
    })
  }

  function handleToggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Clear all filters
  function handleClearFilters() {
    setSearchQuery('')
    setDebouncedSearch('')
    setCategoryFilter('ALL')
    setSupplierFilter('ALL')
    setStatusFilter('ALL')
    setPage(1)
  }

  // Open Drawer for Add
  function handleOpenAddDrawer() {
    setEditingProduct(null)
    setDrawerForm({
      sku: generateNextSku(),
      name: '',
      description: '',
      category: 'Electronics',
      supplier: SUPPLIERS[0],
      unit: 'pcs',
      cost: '10.00',
      price: '20.00',
      isPerishable: false,
      shelfLifeDays: '365',
      isActive: true,
      image: '',
    })
    setIsDrawerOpen(true)
  }

  // Open Drawer for Edit
  function handleOpenEditDrawer(product: ProductItem) {
    setEditingProduct(product)
    setDrawerForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category,
      supplier: product.supplier,
      unit: product.unit,
      cost: product.cost.toFixed(2),
      price: product.price.toFixed(2),
      isPerishable: product.isPerishable,
      shelfLifeDays: product.shelfLifeDays ? product.shelfLifeDays.toString() : '365',
      isActive: product.isActive,
      image: product.image || '',
    })
    setIsDrawerOpen(true)
    setActiveMenuId(null)
  }

  // Duplicate Product
  function handleDuplicateProduct(product: ProductItem) {
    const newSku = `${product.sku}-COPY`
    const duplicate: ProductItem = {
      ...product,
      id: `prod-${Date.now()}`,
      sku: newSku,
      name: `${product.name} (Copy)`,
      transactions: 0,
    }
    setProducts((prev) => [duplicate, ...prev])
    toast(`Duplicated product as "${duplicate.name}"`, 'success')
    setActiveMenuId(null)
  }

  // Toggle Active/Inactive
  function handleToggleStatus(product: ProductItem) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, isActive: !p.isActive } : p,
      ),
    )
    toast(
      `Product "${product.name}" set to ${!product.isActive ? 'Active' : 'Inactive'}`,
      'info',
    )
    setActiveMenuId(null)
  }

  // Save product from Drawer
  function handleSaveDrawerProduct() {
    if (!drawerForm.name.trim()) {
      toast('Product Name is required', 'error')
      return
    }
    if (!drawerForm.sku.trim()) {
      toast('SKU is required', 'error')
      return
    }

    const costNum = parseFloat(drawerForm.cost) || 0
    const priceNum = parseFloat(drawerForm.price) || 0
    const shelfDays = drawerForm.isPerishable
      ? parseInt(drawerForm.shelfLifeDays, 10) || 365
      : undefined

    if (editingProduct) {
      // Update existing
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                sku: drawerForm.sku.trim(),
                name: drawerForm.name.trim(),
                description: drawerForm.description.trim(),
                category: drawerForm.category,
                supplier: drawerForm.supplier,
                unit: drawerForm.unit,
                cost: costNum,
                price: priceNum,
                isPerishable: drawerForm.isPerishable,
                shelfLifeDays: shelfDays,
                isActive: drawerForm.isActive,
                image: drawerForm.image,
              }
            : p,
        ),
      )
      toast(`Updated product "${drawerForm.name.trim()}"`, 'success')
    } else {
      // Create new
      const newProduct: ProductItem = {
        id: `prod-${Date.now()}`,
        sku: drawerForm.sku.trim(),
        name: drawerForm.name.trim(),
        description: drawerForm.description.trim(),
        category: drawerForm.category,
        supplier: drawerForm.supplier,
        unit: drawerForm.unit,
        cost: costNum,
        price: priceNum,
        isPerishable: drawerForm.isPerishable,
        shelfLifeDays: shelfDays,
        isActive: drawerForm.isActive,
        transactions: 0,
        image: drawerForm.image,
      }
      setProducts((prev) => [newProduct, ...prev])
      toast(`Product "${newProduct.name}" created successfully`, 'success')
    }

    setIsDrawerOpen(false)
  }

  // Delete product handling
  function handleInitiateDelete(product: ProductItem) {
    setProductToDelete(product)
    setIsDeleteModalOpen(true)
    setActiveMenuId(null)
  }

  function handleConfirmDelete() {
    if (!productToDelete) return
    if (productToDelete.transactions > 0) {
      toast('Cannot delete product with existing transaction history', 'error')
      setIsDeleteModalOpen(false)
      return
    }

    setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(productToDelete.id)
      return next
    })
    toast(`Product "${productToDelete.name}" deleted successfully`, 'success')
    setIsDeleteModalOpen(false)
    setProductToDelete(null)
  }

  // Bulk Deactivate
  function handleBulkDeactivate() {
    setProducts((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, isActive: false } : p)),
    )
    toast(`Deactivated ${selectedIds.size} products`, 'info')
    setSelectedIds(new Set())
  }

  // Export to CSV
  function handleExportCsv(targetProducts?: ProductItem[]) {
    const listToExport =
      targetProducts ||
      (selectedIds.size > 0
        ? products.filter((p) => selectedIds.has(p.id))
        : filteredProducts)

    if (listToExport.length === 0) {
      toast('No products to export', 'warning')
      return
    }

    const headers = [
      'SKU',
      'Name',
      'Category',
      'Supplier',
      'Unit',
      'Cost Price',
      'Selling Price',
      'Status',
      'Is Perishable',
      'Shelf Life Days',
      'Transactions',
    ]

    const rows = listToExport.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.supplier}"`,
      `"${p.unit}"`,
      p.cost.toFixed(2),
      p.price.toFixed(2),
      p.isActive ? 'Active' : 'Inactive',
      p.isPerishable ? 'Yes' : 'No',
      p.shelfLifeDays ?? '',
      p.transactions,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `products-export-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast(`Exported ${listToExport.length} products to CSV`, 'success')
  }

  // Bulk Delete
  function handleBulkDeleteClick() {
    setIsBulkDeleteModalOpen(true)
  }

  const bulkDeleteEligible = useMemo(() => {
    return products.filter((p) => selectedIds.has(p.id) && p.transactions === 0)
  }, [products, selectedIds])

  const bulkDeleteBlocked = useMemo(() => {
    return products.filter((p) => selectedIds.has(p.id) && p.transactions > 0)
  }, [products, selectedIds])

  function handleConfirmBulkDelete() {
    if (bulkDeleteEligible.length === 0) {
      toast('None of the selected products can be deleted (all have transactions)', 'warning')
      setIsBulkDeleteModalOpen(false)
      return
    }

    const eligibleIds = new Set(bulkDeleteEligible.map((p) => p.id))
    setProducts((prev) => prev.filter((p) => !eligibleIds.has(p.id)))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      eligibleIds.forEach((id) => next.delete(id))
      return next
    })

    toast(
      `Deleted ${bulkDeleteEligible.length} products.${
        bulkDeleteBlocked.length > 0
          ? ` (${bulkDeleteBlocked.length} skipped due to transaction history)`
          : ''
      }`,
      'success',
    )
    setIsBulkDeleteModalOpen(false)
  }

  // Download Sample Template CSV
  function handleDownloadSampleTemplate() {
    const headers = [
      'SKU',
      'Name',
      'Category',
      'Supplier',
      'Unit',
      'Cost',
      'Price',
      'IsPerishable',
      'ShelfLifeDays',
    ]
    const sampleRows = [
      'SKU-101,Smart Wi-Fi Thermostat,Electronics,Apex Tech,pcs,45.00,89.99,false,',
      'SKU-102,Premium Matcha Green Tea 250g,Food & Beverage,GreenFields Organic,pack,8.50,18.00,true,365',
      'SKU-103,Industrial Nitrile Gloves Box,Chemicals,BioChem Global,box,12.00,24.50,false,',
    ]
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'sample_products_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast('Sample CSV template downloaded', 'info')
  }

  // Confirm Bulk Import
  function handleConfirmImport() {
    const newItems: ProductItem[] = [
      {
        id: `import-${Date.now()}-1`,
        sku: 'SKU-026',
        name: 'Smart Wi-Fi Thermostat Pro',
        description: 'Programmable commercial grade cloud thermostat.',
        category: 'Electronics',
        supplier: 'Apex Tech',
        unit: 'pcs',
        cost: 45.0,
        price: 89.99,
        isActive: true,
        isPerishable: false,
        transactions: 0,
      },
      {
        id: `import-${Date.now()}-2`,
        sku: 'SKU-027',
        name: 'Premium Matcha Powder 250g',
        description: 'Ceremonial grade pure stone-ground green tea.',
        category: 'Food & Beverage',
        supplier: 'GreenFields Organic',
        unit: 'pack',
        cost: 8.5,
        price: 18.0,
        isActive: true,
        isPerishable: true,
        shelfLifeDays: 365,
        transactions: 0,
      },
      {
        id: `import-${Date.now()}-3`,
        sku: 'SKU-028',
        name: 'Industrial Nitrile Gloves XL',
        description: 'Heavy duty 8mil chemical and puncture resistant gloves (100pk).',
        category: 'Chemicals',
        supplier: 'BioChem Global',
        unit: 'box',
        cost: 12.0,
        price: 24.5,
        isActive: true,
        isPerishable: false,
        transactions: 0,
      },
      {
        id: `import-${Date.now()}-4`,
        sku: 'SKU-029',
        name: 'Thermal Receipt Paper 80mm',
        description: 'BPA-free thermal paper rolls for POS printers (50 rolls).',
        category: 'Office Supplies',
        supplier: 'PaperCraft Ltd',
        unit: 'box',
        cost: 21.0,
        price: 38.0,
        isActive: true,
        isPerishable: false,
        transactions: 0,
      },
      {
        id: `import-${Date.now()}-5`,
        sku: 'SKU-030',
        name: 'Brass Hex Bar Stock 12mm',
        description: 'Free-machining alloy 360 solid brass hex rod 1m length.',
        category: 'Raw Materials',
        supplier: 'Omega Materials',
        unit: 'pcs',
        cost: 14.2,
        price: 28.0,
        isActive: true,
        isPerishable: false,
        transactions: 0,
      },
    ]

    setProducts((prev) => [...newItems, ...prev])
    toast(`Successfully imported 5 products into catalog`, 'success')
    setIsImportModalOpen(false)
    setImportStep(1)
    setImportFileName(null)
  }

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    categoryFilter !== 'ALL' ||
    supplierFilter !== 'ALL' ||
    statusFilter !== 'ALL'

  return (
    <div className="relative pb-16">
      {/* Page Header */}
      <PageHeader
        title="Products"
        subtitle="Manage product catalog, pricing, SKU specifications, and suppliers"
      />

      {/* Top Bar - Sticky */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-border/80 bg-app/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search & Filters */}
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
            {/* Search Input with magnifier icon (expanding on focus) */}
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search SKU, name, supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-48 rounded-[8px] border border-border bg-surface pl-9 pr-8 text-sm text-text outline-none transition-all duration-200 placeholder:text-muted focus:w-64 focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-60 sm:focus:w-80"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 rounded-full p-0.5 text-muted hover:bg-slate-100 hover:text-text"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Filter by category"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Supplier Filter */}
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Filter by supplier"
            >
              <option value="ALL">All Suppliers</option>
              {SUPPLIERS.map((sup) => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters ? (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-10 px-2.5 text-xs text-muted hover:text-text"
              >
                Clear Filters
              </Button>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => {
                setImportStep(1)
                setIsImportModalOpen(true)
              }}
            >
              Bulk Import
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleOpenAddDrawer}
            >
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <Card padding={false} className="overflow-hidden border border-border shadow-[var(--shadow-card)]">
        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-3 p-6">
            <div className="flex items-center justify-between pb-4">
              <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-[8px] border border-slate-100 p-3"
              >
                <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-[8px] bg-slate-200" />
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-muted">
              <PackageSearch className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-text">No products found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">
              No products match your current search terms or filter selection. Try resetting your
              filters or adding a new product.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {hasActiveFilters ? (
                <Button variant="secondary" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              ) : null}
              <Button icon={<Plus className="h-4 w-4" />} onClick={handleOpenAddDrawer}>
                Add Product
              </Button>
            </div>
          </div>
        ) : (
          /* Products Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50/70 text-xs font-medium uppercase tracking-wider text-muted">
                <tr>
                  <th className="w-12 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all products on page"
                      checked={allCurrentPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate
                      }}
                      onChange={(e) => handleSelectAllCurrent(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                    />
                  </th>
                  <th className="w-14 px-2 py-3.5 text-center">Image</th>
                  <th className="px-4 py-3.5">SKU</th>
                  <th className="px-4 py-3.5">Product Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-3 py-3.5">Unit</th>
                  <th className="px-4 py-3.5 text-right">Cost Price</th>
                  <th className="px-4 py-3.5 text-right">Selling Price</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="w-12 px-3 py-3.5 text-center">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {paginatedProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id)
                  const isMenuOpen = activeMenuId === product.id

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        'transition-colors hover:bg-slate-50/80',
                        isSelected && 'bg-blue-50/40',
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select ${product.name}`}
                          checked={isSelected}
                          onChange={() => handleToggleRow(product.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                      </td>

                      {/* 40px Image Thumbnail Placeholder */}
                      <td className="px-2 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-border/70 bg-slate-100 text-slate-400">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full rounded-[8px] object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 stroke-[1.5]" />
                          )}
                        </div>
                      </td>

                      {/* SKU (monospace grey) */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-muted">
                          {product.sku}
                        </span>
                      </td>

                      {/* Product Name (bold) */}
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <span className="font-semibold text-text">{product.name}</span>
                          {product.isPerishable ? (
                            <span className="ml-2 inline-flex items-center text-[11px] font-normal text-amber-600">
                              (Perishable: {product.shelfLifeDays ?? 365}d)
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Category Chip */}
                      <td className="px-4 py-3">
                        <Chip
                          label={product.category}
                          tone={getCategoryTone(product.category)}
                        />
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3 text-text">{product.supplier}</td>

                      {/* Unit */}
                      <td className="px-3 py-3 font-mono text-xs text-muted">
                        {product.unit}
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-3 text-right font-medium text-text">
                        ${product.cost.toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3 text-right font-semibold text-text">
                        ${product.price.toFixed(2)}
                      </td>

                      {/* Status (green active dot or grey inactive dot) */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              product.isActive ? 'bg-success' : 'bg-slate-400',
                            )}
                          />
                          <span
                            className={
                              product.isActive ? 'text-success font-medium' : 'text-muted'
                            }
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Action Menu (MoreVertical) */}
                      <td className="relative px-3 py-3 text-center">
                        <button
                          type="button"
                          aria-label="Open product actions"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuId(isMenuOpen ? null : product.id)
                          }}
                          className="rounded-[6px] p-1.5 text-muted transition-colors hover:bg-slate-100 hover:text-text"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen ? (
                          <div
                            ref={menuRef}
                            className="absolute right-3 top-10 z-30 min-w-[160px] rounded-[8px] border border-border bg-surface p-1 text-left shadow-lg"
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenEditDrawer(product)}
                              className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-medium text-text hover:bg-app"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted" />
                              Edit Product
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateProduct(product)}
                              className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-medium text-text hover:bg-app"
                            >
                              <Copy className="h-3.5 w-3.5 text-muted" />
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(product)}
                              className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-medium text-text hover:bg-app"
                            >
                              {product.isActive ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-muted" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-muted" />
                                  Activate
                                </>
                              )}
                            </button>
                            <div className="my-1 border-t border-border" />
                            <button
                              type="button"
                              onClick={() => handleInitiateDelete(product)}
                              className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-medium text-error hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && filteredProducts.length > 0 ? (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-surface px-4 py-3 sm:flex-row">
            <div className="text-sm text-muted">
              Showing <span className="font-medium text-text">{startIndex + 1}</span>-
              <span className="font-medium text-text">
                {Math.min(endIndex, filteredProducts.length)}
              </span>{' '}
              of <span className="font-medium text-text">{filteredProducts.length}</span> products
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Page size:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="h-8 rounded-[8px] border border-border bg-surface px-2 text-xs text-text outline-none focus:border-primary"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        ) : null}
      </Card>

      {/* Bulk Action Bar (Floating Blue Bar from bottom when rows selected) */}
      {selectedIds.size > 0 ? (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center gap-3 rounded-[12px] bg-primary px-5 py-3 text-white shadow-2xl transition-all duration-300">
          <span className="text-sm font-semibold text-white">
            {selectedIds.size} {selectedIds.size === 1 ? 'product' : 'products'} selected
          </span>
          <div className="h-4 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDeactivate}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Deactivate
            </button>
            <button
              type="button"
              onClick={() => handleExportCsv()}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteClick}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-error px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-2 rounded-[6px] p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Add / Edit Product Drawer (480px / max-w-lg) */}
      <Drawer
        open={isDrawerOpen}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        onClose={() => setIsDrawerOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveDrawerProduct}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* SKU Field */}
          <div>
            <div className="flex items-center justify-between pb-1">
              <span className="text-sm font-medium text-text">SKU</span>
              {!editingProduct ? (
                <button
                  type="button"
                  onClick={() =>
                    setDrawerForm((prev) => ({ ...prev, sku: generateNextSku() }))
                  }
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <RefreshCw className="h-3 w-3" /> Auto-generate
                </button>
              ) : null}
            </div>
            <Input
              value={drawerForm.sku}
              onChange={(e) =>
                setDrawerForm((prev) => ({ ...prev, sku: e.target.value }))
              }
              placeholder="e.g. SKU-001"
              required
            />
          </div>

          {/* Product Name */}
          <Input
            label="Product Name *"
            value={drawerForm.name}
            onChange={(e) =>
              setDrawerForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Digital Multimeter Pro"
            required
          />

          {/* Description */}
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-text">Description</span>
            <textarea
              rows={3}
              value={drawerForm.description}
              onChange={(e) =>
                setDrawerForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Detailed product specifications, notes, or usage instructions..."
              className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {/* Category Dropdown */}
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-text">Category *</span>
            <select
              value={drawerForm.category}
              onChange={(e) =>
                setDrawerForm((prev) => ({
                  ...prev,
                  category: e.target.value as ProductCategory,
                }))
              }
              className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {/* Supplier Dropdown */}
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-text">Supplier *</span>
            <select
              value={drawerForm.supplier}
              onChange={(e) =>
                setDrawerForm((prev) => ({ ...prev, supplier: e.target.value }))
              }
              className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {SUPPLIERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {/* Unit Dropdown */}
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-text">Unit of Measure *</span>
            <select
              value={drawerForm.unit}
              onChange={(e) =>
                setDrawerForm((prev) => ({ ...prev, unit: e.target.value }))
              }
              className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost Price ($) *"
              type="number"
              step="0.01"
              min="0"
              value={drawerForm.cost}
              onChange={(e) =>
                setDrawerForm((prev) => ({ ...prev, cost: e.target.value }))
              }
              placeholder="0.00"
            />
            <Input
              label="Selling Price ($) *"
              type="number"
              step="0.01"
              min="0"
              value={drawerForm.price}
              onChange={(e) =>
                setDrawerForm((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="0.00"
            />
          </div>

          {/* Perishable Toggle */}
          <div className="rounded-[8px] border border-border bg-app/50 p-3">
            <label className="flex cursor-pointer items-center justify-between">
              <div>
                <span className="text-sm font-medium text-text">Is Perishable</span>
                <p className="text-xs text-muted">
                  Requires batch tracking and expiry date monitoring
                </p>
              </div>
              <input
                type="checkbox"
                checked={drawerForm.isPerishable}
                onChange={(e) =>
                  setDrawerForm((prev) => ({
                    ...prev,
                    isPerishable: e.target.checked,
                  }))
                }
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
              />
            </label>

            {drawerForm.isPerishable ? (
              <div className="mt-3 border-t border-border/80 pt-3">
                <Input
                  label="Shelf Life (Days) *"
                  type="number"
                  min="1"
                  value={drawerForm.shelfLifeDays}
                  onChange={(e) =>
                    setDrawerForm((prev) => ({
                      ...prev,
                      shelfLifeDays: e.target.value,
                    }))
                  }
                  placeholder="365"
                />
              </div>
            ) : null}
          </div>

          {/* Active Status */}
          <label className="flex cursor-pointer items-center justify-between rounded-[8px] border border-border bg-surface p-3">
            <div>
              <span className="text-sm font-medium text-text">Active in Catalog</span>
              <p className="text-xs text-muted">Inactive products cannot be ordered</p>
            </div>
            <input
              type="checkbox"
              checked={drawerForm.isActive}
              onChange={(e) =>
                setDrawerForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
            />
          </label>

          {/* Image Placeholder */}
          <div className="rounded-[8px] border border-dashed border-border p-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-muted">
              <Package className="h-6 w-6 stroke-[1.5]" />
            </div>
            <p className="mt-2 text-xs font-medium text-text">Product Image Placeholder</p>
            <p className="text-[11px] text-muted">PNG, JPG or WebP up to 5MB</p>
            <Button
              variant="secondary"
              className="mt-3 h-8 px-3 text-xs"
              onClick={() => {
                const sampleImg =
                  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&auto=format&fit=crop&q=80'
                setDrawerForm((prev) => ({
                  ...prev,
                  image: prev.image ? '' : sampleImg,
                }))
                toast(
                  drawerForm.image ? 'Image removed' : 'Sample thumbnail attached',
                  'info',
                )
              }}
            >
              {drawerForm.image ? 'Remove Image' : 'Attach Sample Image'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Product Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        title={
          productToDelete && productToDelete.transactions > 0
            ? 'Cannot Delete Product'
            : 'Delete Product'
        }
        onClose={() => {
          setIsDeleteModalOpen(false)
          setProductToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        confirmLabel={
          productToDelete && productToDelete.transactions > 0
            ? 'Understood'
            : 'Delete Permanently'
        }
        cancelLabel={productToDelete && productToDelete.transactions > 0 ? '' : 'Cancel'}
        confirmVariant={
          productToDelete && productToDelete.transactions > 0 ? 'primary' : 'destructive'
        }
      >
        {productToDelete ? (
          <div>
            {productToDelete.transactions > 0 ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold text-amber-950">Active Transaction History</p>
                    <p className="mt-0.5">
                      <strong>{productToDelete.name}</strong> ({productToDelete.sku}) has{' '}
                      <strong>{productToDelete.transactions} recorded transactions</strong> in the
                      inventory ledger.
                    </p>
                    <p className="mt-1">
                      Deleting products with transactions is disabled to protect financial audit
                      trails. You can <strong>Deactivate</strong> this product instead so it cannot
                      be used in new orders.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      handleToggleStatus(productToDelete)
                      setIsDeleteModalOpen(false)
                      setProductToDelete(null)
                    }}
                  >
                    Deactivate "{productToDelete.name}" Instead
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-text">{productToDelete.name}</strong> (
                  <span className="font-mono text-xs">{productToDelete.sku}</span>)?
                </p>
                <p className="text-xs text-muted">
                  This product has 0 transactions and will be removed from your catalog. This
                  action cannot be undone.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        open={isBulkDeleteModalOpen}
        title="Confirm Bulk Deletion"
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        confirmLabel={
          bulkDeleteEligible.length > 0
            ? `Delete ${bulkDeleteEligible.length} Products`
            : 'Close'
        }
        cancelLabel="Cancel"
        confirmVariant="destructive"
      >
        <div className="space-y-3 text-sm">
          <p>
            You selected <strong>{selectedIds.size} products</strong> for deletion.
          </p>

          {bulkDeleteBlocked.length > 0 ? (
            <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold text-amber-950">
                {bulkDeleteBlocked.length} products cannot be deleted:
              </p>
              <p className="mt-0.5 text-amber-800">
                They have existing stock movements and audit records. Only products with 0
                transactions will be deleted.
              </p>
            </div>
          ) : null}

          {bulkDeleteEligible.length > 0 ? (
            <p className="text-xs text-text">
              <strong>{bulkDeleteEligible.length} product(s)</strong> have no transactions and
              will be permanently removed.
            </p>
          ) : (
            <p className="text-xs text-error">
              None of the selected products can be deleted because all of them have transaction
              history. Consider deactivating them instead.
            </p>
          )}
        </div>
      </Modal>

      {/* Bulk Import 3-Step Wizard Modal */}
      <Modal
        open={isImportModalOpen}
        title="Bulk Import Products"
        onClose={() => {
          setIsImportModalOpen(false)
          setImportStep(1)
        }}
        confirmLabel={
          importStep === 1
            ? 'Continue to Mapping'
            : importStep === 2
              ? 'Review & Validate'
              : 'Confirm & Import 5 Products'
        }
        cancelLabel={importStep === 1 ? 'Cancel' : 'Back'}
        onConfirm={() => {
          if (importStep === 1) {
            setImportStep(2)
          } else if (importStep === 2) {
            setImportStep(3)
          } else {
            handleConfirmImport()
          }
        }}
      >
        <div className="space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            {[
              { num: 1, label: 'Upload' },
              { num: 2, label: 'Column Mapping' },
              { num: 3, label: 'Validation & Import' },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    importStep === step.num
                      ? 'bg-primary text-white'
                      : importStep > step.num
                        ? 'bg-success text-white'
                        : 'bg-slate-200 text-muted',
                  )}
                >
                  {importStep > step.num ? <Check className="h-3 w-3" /> : step.num}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    importStep === step.num ? 'text-primary' : 'text-muted',
                  )}
                >
                  {step.label}
                </span>
                {idx < 2 ? <ArrowRight className="h-3.5 w-3.5 text-muted/50" /> : null}
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {importStep === 1 ? (
            <div className="space-y-4">
              <div className="rounded-[10px] border-2 border-dashed border-border bg-app/50 p-6 text-center">
                <FileSpreadsheet className="mx-auto h-10 w-10 text-primary stroke-[1.5]" />
                <h4 className="mt-2 text-sm font-semibold text-text">
                  Choose a CSV file to upload
                </h4>
                <p className="mt-1 text-xs text-muted">
                  Support standard CSV or UTF-8 tab-delimited spreadsheets
                </p>

                <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                  <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-[8px] bg-primary px-4 text-xs font-medium text-white transition-colors hover:bg-primary-hover">
                    Browse Files
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setImportFileName(file.name)
                          toast(`Selected file: ${file.name}`, 'info')
                        }
                      }}
                    />
                  </label>
                  <Button
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    icon={<Download className="h-3.5 w-3.5" />}
                    onClick={handleDownloadSampleTemplate}
                  >
                    Download Template
                  </Button>
                </div>

                {importFileName ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span>{importFileName} (Ready)</span>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-muted">
                    No file selected yet. Using default 5-item batch for preview.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* Step 2: Column Mapping */}
          {importStep === 2 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                Confirm your CSV column headers correspond to the database attributes:
              </p>
              <div className="max-h-56 overflow-y-auto rounded-[8px] border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Target Field</th>
                      <th className="px-3 py-2 font-medium">CSV Header</th>
                      <th className="px-3 py-2 font-medium">Sample Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { field: 'SKU *', csv: 'SKU', sample: 'SKU-026' },
                      { field: 'Product Name *', csv: 'Name', sample: 'Smart Wi-Fi Thermostat Pro' },
                      { field: 'Category *', csv: 'Category', sample: 'Electronics' },
                      { field: 'Supplier *', csv: 'Supplier', sample: 'Apex Tech' },
                      { field: 'Unit *', csv: 'Unit', sample: 'pcs' },
                      { field: 'Cost Price *', csv: 'Cost', sample: '$45.00' },
                      { field: 'Selling Price *', csv: 'Price', sample: '$89.99' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-app">
                        <td className="px-3 py-2 font-medium text-text">{row.field}</td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-primary">
                            {row.csv}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted">{row.sample}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* Step 3: Validation Summary & Confirm */}
          {importStep === 3 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-[8px] border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div className="text-xs">
                  <p className="font-semibold text-emerald-950">Validation Successful</p>
                  <p className="text-emerald-800">
                    All {importRowsCount} rows passed schema validation. 0 duplicate SKUs found.
                  </p>
                </div>
              </div>

              <div className="rounded-[8px] border border-border p-3">
                <p className="text-xs font-medium text-text">Preview items to be created:</p>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  <li className="flex justify-between border-b border-border/50 pb-1">
                    <span>SKU-026 • Smart Wi-Fi Thermostat Pro</span>
                    <span className="font-semibold text-text">$89.99</span>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1">
                    <span>SKU-027 • Premium Matcha Powder 250g</span>
                    <span className="font-semibold text-text">$18.00</span>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1">
                    <span>SKU-028 • Industrial Nitrile Gloves XL</span>
                    <span className="font-semibold text-text">$24.50</span>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1">
                    <span>SKU-029 • Thermal Receipt Paper 80mm</span>
                    <span className="font-semibold text-text">$38.00</span>
                  </li>
                  <li className="flex justify-between">
                    <span>SKU-030 • Brass Hex Bar Stock 12mm</span>
                    <span className="font-semibold text-text">$28.00</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
