import { useState, useRef, useId } from 'react'
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Check,
  ShieldAlert,
  AlertTriangle,
  Download,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Key,
  Copy,
  Bell,
  MapPin,
  Building,
  Truck,
  Star,
  Search,
  Clock,
  HardDrive,
  Database,
  Sliders,
  CheckCircle2,
  XCircle,
  Moon,
  ExternalLink,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/layout/PageHeader'
import { useToast } from '../components/toast/ToastContext'
import { cn } from '../lib/cn'

// --- TYPES ---

type TabType = 'profile' | 'notifications' | 'locations' | 'suppliers' | 'system'

type NotificationChannel = 'email' | 'push' | 'inApp'

type NotificationPreference = {
  id: string
  label: string
  description: string
  email: boolean
  push: boolean
  inApp: boolean
}

type LocationType = 'Warehouse' | 'Branch' | 'Cold Storage'
type LocationStatus = 'active' | 'inactive'

type LocationItem = {
  id: string
  name: string
  type: LocationType
  address: string
  latitude: number
  longitude: number
  status: LocationStatus
}

type SupplierStatus = 'Active' | 'Inactive'

type SupplierItem = {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  leadTimeDays: number
  rating: number // 1 to 5
  status: SupplierStatus
}

// --- INITIAL MOCK DATA ---

const initialNotificationPreferences: NotificationPreference[] = [
  {
    id: 'low_stock',
    label: 'Low Stock Alerts',
    description: 'Triggered when inventory levels fall below configured safety reorder thresholds',
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: 'expiry',
    label: 'Expiry Warnings',
    description: 'Advance notices for pharmaceutical and perishable batches nearing expiration (7/15/30 days)',
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: 'transfers',
    label: 'Transfer Requests & Updates',
    description: 'Alerts when stock transfer requests are submitted, approved, dispatched, or completed',
    email: false,
    push: true,
    inApp: true,
  },
  {
    id: 'po_updates',
    label: 'Purchase Order Updates',
    description: 'Notifications for purchase order status changes, supplier acceptances, and dock deliveries',
    email: true,
    push: false,
    inApp: true,
  },
]

const initialLocations: LocationItem[] = [
  {
    id: 'loc-1',
    name: 'Central Warehouse Alpha',
    type: 'Warehouse',
    address: '4500 Industrial Pkwy, Sector 4, Chicago, IL 60609',
    latitude: 41.8781,
    longitude: -87.6298,
    status: 'active',
  },
  {
    id: 'loc-2',
    name: 'Cold Storage Facility 1',
    type: 'Cold Storage',
    address: '820 Arctic Way, Bay 12, Chicago, IL 60616',
    latitude: 41.8825,
    longitude: -87.6441,
    status: 'active',
  },
  {
    id: 'loc-3',
    name: 'Downtown Medical Clinic',
    type: 'Branch',
    address: '102 Health Blvd, Suite 300, Chicago, IL 60601',
    latitude: 41.8902,
    longitude: -87.6234,
    status: 'active',
  },
  {
    id: 'loc-4',
    name: 'Eastside Distribution Hub',
    type: 'Warehouse',
    address: '1290 Harbor Ave, Dock 4, Chicago, IL 60617',
    latitude: 41.865,
    longitude: -87.61,
    status: 'inactive',
  },
]

const initialSuppliers: SupplierItem[] = [
  {
    id: 'sup-1',
    name: 'MedSupply Direct Ltd',
    contactPerson: 'Sarah Jenkins',
    email: 'sarah.j@medsupply.com',
    phone: '+1 (555) 301-4421',
    leadTimeDays: 3,
    rating: 5.0,
    status: 'Active',
  },
  {
    id: 'sup-2',
    name: 'BioPharma Solutions',
    contactPerson: 'Marcus Thorne',
    email: 'mthorne@biopharma.org',
    phone: '+1 (555) 782-9901',
    leadTimeDays: 7,
    rating: 4.5,
    status: 'Active',
  },
  {
    id: 'sup-3',
    name: 'Apex Surgical Instruments',
    contactPerson: 'Elena Rostova',
    email: 'elena@apexsurgical.com',
    phone: '+1 (555) 443-1289',
    leadTimeDays: 5,
    rating: 4.0,
    status: 'Active',
  },
  {
    id: 'sup-4',
    name: 'PureCare Hygiene & Safety',
    contactPerson: 'David Kim',
    email: 'dkim@purecare.co',
    phone: '+1 (555) 882-6612',
    leadTimeDays: 2,
    rating: 4.8,
    status: 'Active',
  },
  {
    id: 'sup-5',
    name: 'Global Logistics & ColdChain',
    contactPerson: 'Amira Patel',
    email: 'amira.p@glcoldchain.com',
    phone: '+1 (555) 991-3320',
    leadTimeDays: 14,
    rating: 3.5,
    status: 'Inactive',
  },
]

// --- HELPER SUBCOMPONENTS ---

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        checked ? 'bg-primary' : 'bg-slate-300',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const isFilled = i <= fullStars
          const isHalf = !isFilled && i === fullStars + 1 && hasHalf
          return (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                    ? 'fill-amber-200 text-amber-400'
                    : 'text-slate-300',
              )}
            />
          )
        })}
      </div>
      <span className="text-xs font-semibold text-text">{rating.toFixed(1)}</span>
    </div>
  )
}

// --- MAIN SETTINGS PAGE ---

export function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // --- TAB 1: PROFILE STATE ---
  const [profileName, setProfileName] = useState('Maria Chen')
  const profileEmail = 'maria.chen@example.com'
  const [profilePhone, setProfilePhone] = useState('+1 (555) 234-5678')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password Strength Calculation
  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)

  const passwordCriteriaCount = [
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length

  let passwordStrengthLevel = 0
  let passwordStrengthLabel = 'None'
  let passwordStrengthColor = 'bg-slate-200'

  if (newPassword.length > 0) {
    if (passwordCriteriaCount <= 2) {
      passwordStrengthLevel = 1
      passwordStrengthLabel = 'Weak'
      passwordStrengthColor = 'bg-error'
    } else if (passwordCriteriaCount <= 3) {
      passwordStrengthLevel = 2
      passwordStrengthLabel = 'Fair'
      passwordStrengthColor = 'bg-amber-500'
    } else if (passwordCriteriaCount <= 4) {
      passwordStrengthLevel = 3
      passwordStrengthLabel = 'Good'
      passwordStrengthColor = 'bg-blue-500'
    } else {
      passwordStrengthLevel = 4
      passwordStrengthLabel = 'Strong'
      passwordStrengthColor = 'bg-success'
    }
  }

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword

  // Handlers for Profile
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Please upload a valid image file.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result as string)
      toast('Profile avatar updated.', 'success')
    }
    reader.readAsDataURL(file)
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profileName.trim()) {
      toast('Name is required.', 'error')
      return
    }
    toast('Profile details updated successfully.', 'success')
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword) {
      toast('Please enter your current password.', 'error')
      return
    }
    if (newPassword.length < 8) {
      toast('New password must be at least 8 characters long.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('New password and confirm password do not match.', 'error')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast('Password changed successfully.', 'success')
  }

  // --- TAB 2: NOTIFICATIONS STATE ---
  const [preferences, setPreferences] = useState<NotificationPreference[]>(
    initialNotificationPreferences,
  )
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true)
  const [quietFrom, setQuietFrom] = useState('22:00')
  const [quietTo, setQuietTo] = useState('07:00')
  const [urgentBypass, setUrgentBypass] = useState(true)

  function handleTogglePref(id: string, channel: NotificationChannel, value: boolean) {
    setPreferences((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [channel]: value } : item)),
    )
  }

  function handleSavePreferences() {
    toast('Notification preferences saved successfully.', 'success')
  }

  // --- TAB 3: LOCATIONS STATE ---
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations)
  const [locationSearch, setLocationSearch] = useState('')
  const [locationTypeFilter, setLocationTypeFilter] = useState('all')

  // Add / Edit Location Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [locFormName, setLocFormName] = useState('')
  const [locFormType, setLocFormType] = useState<LocationType>('Warehouse')
  const [locFormAddress, setLocFormAddress] = useState('')
  const [locFormLat, setLocFormLat] = useState('')
  const [locFormLng, setLocFormLng] = useState('')
  const [locFormStatus, setLocFormStatus] = useState<LocationStatus>('active')

  // Delete Location Modal
  const [deletingLocation, setDeletingLocation] = useState<LocationItem | null>(null)

  function openAddLocationModal() {
    setEditingLocationId(null)
    setLocFormName('')
    setLocFormType('Warehouse')
    setLocFormAddress('')
    setLocFormLat('41.8781')
    setLocFormLng('-87.6298')
    setLocFormStatus('active')
    setIsLocationModalOpen(true)
  }

  function openEditLocationModal(loc: LocationItem) {
    setEditingLocationId(loc.id)
    setLocFormName(loc.name)
    setLocFormType(loc.type)
    setLocFormAddress(loc.address)
    setLocFormLat(String(loc.latitude))
    setLocFormLng(String(loc.longitude))
    setLocFormStatus(loc.status)
    setIsLocationModalOpen(true)
  }

  function handleSaveLocationModal() {
    if (!locFormName.trim()) {
      toast('Location name is required.', 'error')
      return
    }
    if (!locFormAddress.trim()) {
      toast('Address is required.', 'error')
      return
    }

    const latVal = parseFloat(locFormLat) || 0
    const lngVal = parseFloat(locFormLng) || 0

    if (editingLocationId) {
      setLocations((prev) =>
        prev.map((l) =>
          l.id === editingLocationId
            ? {
                ...l,
                name: locFormName.trim(),
                type: locFormType,
                address: locFormAddress.trim(),
                latitude: latVal,
                longitude: lngVal,
                status: locFormStatus,
              }
            : l,
        ),
      )
      toast('Location updated successfully.', 'success')
    } else {
      const newLoc: LocationItem = {
        id: `loc-${Date.now()}`,
        name: locFormName.trim(),
        type: locFormType,
        address: locFormAddress.trim(),
        latitude: latVal,
        longitude: lngVal,
        status: locFormStatus,
      }
      setLocations((prev) => [newLoc, ...prev])
      toast('New location added successfully.', 'success')
    }
    setIsLocationModalOpen(false)
  }

  function handleConfirmDeleteLocation() {
    if (!deletingLocation) return
    setLocations((prev) => prev.filter((l) => l.id !== deletingLocation.id))
    toast(`Location "${deletingLocation.name}" deleted.`, 'success')
    setDeletingLocation(null)
  }

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      loc.address.toLowerCase().includes(locationSearch.toLowerCase())
    const matchesType =
      locationTypeFilter === 'all' || loc.type.toLowerCase() === locationTypeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  // --- TAB 4: SUPPLIERS STATE ---
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierStatusFilter, setSupplierStatusFilter] = useState('all')

  // Add / Edit Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)
  const [supFormName, setSupFormName] = useState('')
  const [supFormContact, setSupFormContact] = useState('')
  const [supFormEmail, setSupFormEmail] = useState('')
  const [supFormPhone, setSupFormPhone] = useState('')
  const [supFormLeadTime, setSupFormLeadTime] = useState('3')
  const [supFormRating, setSupFormRating] = useState('5.0')
  const [supFormStatus, setSupFormStatus] = useState<SupplierStatus>('Active')

  // Delete Supplier Modal
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierItem | null>(null)

  function openAddSupplierModal() {
    setEditingSupplierId(null)
    setSupFormName('')
    setSupFormContact('')
    setSupFormEmail('')
    setSupFormPhone('')
    setSupFormLeadTime('3')
    setSupFormRating('5.0')
    setSupFormStatus('Active')
    setIsSupplierModalOpen(true)
  }

  function openEditSupplierModal(sup: SupplierItem) {
    setEditingSupplierId(sup.id)
    setSupFormName(sup.name)
    setSupFormContact(sup.contactPerson)
    setSupFormEmail(sup.email)
    setSupFormPhone(sup.phone)
    setSupFormLeadTime(String(sup.leadTimeDays))
    setSupFormRating(String(sup.rating))
    setSupFormStatus(sup.status)
    setIsSupplierModalOpen(true)
  }

  function handleSaveSupplierModal() {
    if (!supFormName.trim()) {
      toast('Supplier name is required.', 'error')
      return
    }
    if (!supFormContact.trim()) {
      toast('Contact person is required.', 'error')
      return
    }
    if (!supFormEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supFormEmail)) {
      toast('A valid email address is required.', 'error')
      return
    }
    if (!supFormPhone.trim()) {
      toast('Phone number is required.', 'error')
      return
    }

    const leadTimeNum = Math.max(1, parseInt(supFormLeadTime, 10) || 1)
    const ratingNum = Math.min(5, Math.max(1, parseFloat(supFormRating) || 5))

    if (editingSupplierId) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplierId
            ? {
                ...s,
                name: supFormName.trim(),
                contactPerson: supFormContact.trim(),
                email: supFormEmail.trim(),
                phone: supFormPhone.trim(),
                leadTimeDays: leadTimeNum,
                rating: ratingNum,
                status: supFormStatus,
              }
            : s,
        ),
      )
      toast('Supplier updated successfully.', 'success')
    } else {
      const newSup: SupplierItem = {
        id: `sup-${Date.now()}`,
        name: supFormName.trim(),
        contactPerson: supFormContact.trim(),
        email: supFormEmail.trim(),
        phone: supFormPhone.trim(),
        leadTimeDays: leadTimeNum,
        rating: ratingNum,
        status: supFormStatus,
      }
      setSuppliers((prev) => [newSup, ...prev])
      toast('New supplier added successfully.', 'success')
    }
    setIsSupplierModalOpen(false)
  }

  function handleConfirmDeleteSupplier() {
    if (!deletingSupplier) return
    setSuppliers((prev) => prev.filter((s) => s.id !== deletingSupplier.id))
    toast(`Supplier "${deletingSupplier.name}" deleted.`, 'success')
    setDeletingSupplier(null)
  }

  const filteredSuppliers = suppliers.filter((sup) => {
    const matchesSearch =
      sup.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      sup.contactPerson.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      sup.email.toLowerCase().includes(supplierSearch.toLowerCase())
    const matchesStatus =
      supplierStatusFilter === 'all' ||
      sup.status.toLowerCase() === supplierStatusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  // --- TAB 5: SYSTEM STATE ---
  const [apiKey, setApiKey] = useState('inv_live_94f83b1a7c024e88d12e6503ba97')
  const [showApiKey, setShowApiKey] = useState(false)
  const apiEndpointUrl = 'https://api.inventrack.health/v1'

  // Danger Zone Modals
  const [isResetSettingsModalOpen, setIsResetSettingsModalOpen] = useState(false)
  const [resetConfirmInput, setResetConfirmInput] = useState('')

  const [isDeleteAllDataModalOpen, setIsDeleteAllDataModalOpen] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')

  const [isRegenerateKeyModalOpen, setIsRegenerateKeyModalOpen] = useState(false)

  // Export Data to CSV
  function handleExportData() {
    try {
      const csvRows: string[] = []
      csvRows.push('Category,Identifier,Name,Detail1,Detail2,Status')

      locations.forEach((loc) => {
        csvRows.push(
          `"Location","${loc.id}","${loc.name}","${loc.type}","${loc.address.replace(/"/g, '""')}","${loc.status}"`,
        )
      })

      suppliers.forEach((sup) => {
        csvRows.push(
          `"Supplier","${sup.id}","${sup.name}","${sup.contactPerson}","${sup.email}","${sup.status}"`,
        )
      })

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `inventrack_export_${new Date().toISOString().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast('All system data exported to CSV file successfully.', 'success')
    } catch {
      toast('Failed to generate export file.', 'error')
    }
  }

  function handleClearCache() {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && !k.includes('token') && !k.includes('user')) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
      toast('System and offline cache cleared successfully (14.2 MB freed).', 'success')
    } catch {
      toast('Error clearing application cache.', 'error')
    }
  }

  function handleCopyText(text: string, label: string) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
      toast(`${label} copied to clipboard!`, 'info')
    } else {
      toast('Clipboard access unavailable.', 'warning')
    }
  }

  function handleRegenerateKey() {
    const newRandomKey = `inv_live_${Array.from({ length: 28 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('')}`
    setApiKey(newRandomKey)
    setIsRegenerateKeyModalOpen(false)
    toast('API Key regenerated successfully. Update external integrations.', 'success')
  }

  function handleConfirmResetSettings() {
    if (resetConfirmInput.trim() !== 'RESET') {
      toast('Please type RESET in capital letters to confirm.', 'error')
      return
    }
    setProfileName('Maria Chen')
    setProfilePhone('+1 (555) 234-5678')
    setAvatarPreview(null)
    setPreferences(initialNotificationPreferences)
    setQuietHoursEnabled(true)
    setQuietFrom('22:00')
    setQuietTo('07:00')
    setUrgentBypass(true)
    setIsResetSettingsModalOpen(false)
    setResetConfirmInput('')
    toast('All user settings restored to factory defaults.', 'warning')
  }

  function handleConfirmDeleteAllData() {
    if (deleteConfirmInput.trim() !== 'DELETE ALL DATA') {
      toast('Please type DELETE ALL DATA exactly to confirm.', 'error')
      return
    }
    setLocations([])
    setSuppliers([])
    setIsDeleteAllDataModalOpen(false)
    setDeleteConfirmInput('')
    toast('All inventory and operational records have been permanently erased.', 'error')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, notification channels, facility locations, approved suppliers, and system configurations."
      />

      {/* Tab Navigation */}
      <div className="border-b border-border bg-surface rounded-[12px] p-1.5 shadow-[var(--shadow-card)]">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar" aria-label="Settings Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:bg-app hover:text-text',
            )}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === 'notifications'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:bg-app hover:text-text',
            )}
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('locations')}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === 'locations'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:bg-app hover:text-text',
            )}
          >
            <MapPin className="h-4 w-4" />
            <span>Locations</span>
            <span
              className={cn(
                'ml-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                activeTab === 'locations'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {locations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === 'suppliers'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:bg-app hover:text-text',
            )}
          >
            <Truck className="h-4 w-4" />
            <span>Suppliers</span>
            <span
              className={cn(
                'ml-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                activeTab === 'suppliers'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {suppliers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === 'system'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:bg-app hover:text-text',
            )}
          >
            <Sliders className="h-4 w-4" />
            <span>System</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Avatar & Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="User Profile">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm flex items-center justify-center bg-gradient-to-tr from-primary to-blue-400 text-white text-2xl font-bold">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="User avatar preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>
                          {profileName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || 'MC'}
                        </span>
                      )}
                    </div>
                    {/* Camera Overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Upload new profile picture"
                    >
                      <Camera className="h-6 w-6" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-base font-semibold text-text">{profileName || 'User'}</h4>
                    <p className="text-xs text-muted mt-0.5">{profileEmail}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        icon={<Camera className="h-4 w-4" />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Photo
                      </Button>
                      {avatarPreview ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setAvatarPreview(null)
                            toast('Avatar reset to default initials.', 'info')
                          }}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Maria Chen"
                    required
                  />

                  {/* Read Only Email */}
                  <div>
                    <label className="flex flex-col gap-2 text-left">
                      <span className="text-sm font-medium text-text flex items-center justify-between">
                        <span>Email Address</span>
                        <span className="text-xs font-normal text-muted inline-flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Read-only
                        </span>
                      </span>
                      <input
                        type="email"
                        value={profileEmail}
                        readOnly
                        disabled
                        className="h-10 w-full rounded-[8px] border border-border bg-slate-100 px-3 text-sm text-muted cursor-not-allowed outline-none"
                      />
                    </label>
                  </div>

                  <Input
                    label="Phone Number"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />

                  <div>
                    <label className="flex flex-col gap-2 text-left">
                      <span className="text-sm font-medium text-text">Assigned Role</span>
                      <div className="flex h-10 items-center rounded-[8px] border border-border bg-slate-50 px-3">
                        <Chip label="Admin" tone="good" />
                        <span className="ml-2 text-xs text-muted">Full administrative privileges</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" icon={<Check className="h-4 w-4" />}>
                    Save Profile
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Column: Security & Change Password */}
          <div className="space-y-6">
            <Card title="Change Password">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <p className="text-xs text-muted">
                  Ensure your account is protected with a strong, multi-factor compliant password.
                </p>

                {/* Current Password */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label htmlFor="current-pw" className="text-sm font-medium text-text">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="current-pw"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-10 w-full rounded-[8px] border border-border bg-surface pl-3 pr-10 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-2.5 text-muted hover:text-text"
                      aria-label="Toggle current password visibility"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label htmlFor="new-pw" className="text-sm font-medium text-text">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-pw"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-10 w-full rounded-[8px] border border-border bg-surface pl-3 pr-10 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-muted hover:text-text"
                      aria-label="Toggle new password visibility"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="space-y-2 rounded-[8px] bg-slate-50 p-3 border border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Password Strength:</span>
                      <span className="font-semibold text-text">{passwordStrengthLabel}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            step <= passwordStrengthLevel ? passwordStrengthColor : 'bg-slate-200',
                          )}
                        />
                      ))}
                    </div>

                    <div className="space-y-1 pt-1 text-[11px] text-muted">
                      <div className="flex items-center gap-1.5">
                        {hasMinLength ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasUpper && hasLower ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>Uppercase & lowercase letters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasNumber ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>At least 1 numerical digit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasSpecial ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>At least 1 special character</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label htmlFor="confirm-pw" className="text-sm font-medium text-text">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-pw"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="h-10 w-full rounded-[8px] border border-border bg-surface pl-3 pr-10 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-muted hover:text-text"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p
                      className={cn(
                        'text-xs flex items-center gap-1 mt-1',
                        passwordsMatch ? 'text-success' : 'text-error',
                      )}
                    >
                      {passwordsMatch ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Passwords match
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> Passwords do not match
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={!newPassword || !confirmPassword || !passwordsMatch || !hasMinLength}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card title="Alert Channels & Event Subscriptions">
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Choose the delivery channel for critical inventory event notifications. Emergency notifications cannot be completely disabled.
              </p>

              {/* Table of notification preferences */}
              <div className="overflow-hidden rounded-[8px] border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-3 min-w-[280px]">Event Type & Scope</th>
                        <th className="px-4 py-3 text-center w-28">Email</th>
                        <th className="px-4 py-3 text-center w-28">Push</th>
                        <th className="px-4 py-3 text-center w-28">In-App</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface">
                      {preferences.map((pref) => (
                        <tr key={pref.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-text">{pref.label}</div>
                            <div className="text-xs text-muted mt-0.5">{pref.description}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={pref.email}
                                onChange={(val) => handleTogglePref(pref.id, 'email', val)}
                                label={`Email notifications for ${pref.label}`}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={pref.push}
                                onChange={(val) => handleTogglePref(pref.id, 'push', val)}
                                label={`Push notifications for ${pref.label}`}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={pref.inApp}
                                onChange={(val) => handleTogglePref(pref.id, 'inApp', val)}
                                label={`In-App notifications for ${pref.label}`}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>

          {/* Quiet Hours Section */}
          <Card title="Quiet Hours Configuration">
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h4 className="text-sm font-semibold text-text flex items-center gap-2">
                    <Moon className="h-4 w-4 text-primary" />
                    Mute Non-Urgent Notifications
                  </h4>
                  <p className="text-xs text-muted mt-0.5">
                    Suppress sound, vibration, and push notifications during off-work intervals.
                  </p>
                </div>
                <ToggleSwitch
                  checked={quietHoursEnabled}
                  onChange={setQuietHoursEnabled}
                  label="Enable Quiet Hours"
                />
              </div>

              {quietHoursEnabled && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="flex flex-col gap-2 text-left">
                        <span className="text-sm font-medium text-text flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-muted" /> Quiet Hours Start
                        </span>
                        <input
                          type="time"
                          value={quietFrom}
                          onChange={(e) => setQuietFrom(e.target.value)}
                          className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="flex flex-col gap-2 text-left">
                        <span className="text-sm font-medium text-text flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-muted" /> Quiet Hours End
                        </span>
                        <input
                          type="time"
                          value={quietTo}
                          onChange={(e) => setQuietTo(e.target.value)}
                          className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="flex flex-col gap-2 text-left">
                        <span className="text-sm font-medium text-text">Timezone Reference</span>
                        <input
                          type="text"
                          value="America/Chicago (CST, UTC-6)"
                          readOnly
                          disabled
                          className="h-10 w-full rounded-[8px] border border-border bg-slate-100 px-3 text-sm text-muted cursor-not-allowed"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="urgent-bypass"
                      checked={urgentBypass}
                      onChange={(e) => setUrgentBypass(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="urgent-bypass" className="text-xs text-text cursor-pointer select-none">
                      <span className="font-medium">Emergency Bypass:</span> Always deliver critical cold-chain failures and batch quarantine alerts regardless of quiet hours.
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  icon={<Check className="h-4 w-4" />}
                  onClick={handleSavePreferences}
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LOCATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          <Card
            title="Managed Locations & Storage Bays"
            action={
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={openAddLocationModal}
              >
                Add Location
              </Button>
            }
          >
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search by location name or address..."
                    className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="w-full sm:w-48">
                  <Select
                    value={locationTypeFilter}
                    onChange={(e) => setLocationTypeFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Facility Types' },
                      { value: 'Warehouse', label: 'Warehouse' },
                      { value: 'Cold Storage', label: 'Cold Storage' },
                      { value: 'Branch', label: 'Branch' },
                    ]}
                  />
                </div>
              </div>

              {/* Locations Table */}
              <div className="overflow-hidden rounded-[8px] border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Facility Name</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 min-w-[240px]">Address & Coordinates</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface">
                      {filteredLocations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                            No locations found matching your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredLocations.map((loc) => {
                          const typeTone =
                            loc.type === 'Cold Storage'
                              ? 'info'
                              : loc.type === 'Branch'
                                ? 'warning'
                                : 'neutral'

                          return (
                            <tr key={loc.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-text flex items-center gap-2">
                                  <Building className="h-4 w-4 text-primary" />
                                  {loc.name}
                                </div>
                                <div className="text-xs text-muted mt-0.5">ID: {loc.id}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <Chip label={loc.type} tone={typeTone} />
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="text-xs text-text">{loc.address}</div>
                                <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  <span>
                                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <div className="inline-flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      'h-2 w-2 rounded-full',
                                      loc.status === 'active' ? 'bg-success' : 'bg-slate-400',
                                    )}
                                  />
                                  <span className="capitalize text-xs font-medium text-text">
                                    {loc.status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="inline-flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    className="h-8 px-2 text-primary"
                                    icon={<Edit2 className="h-3.5 w-3.5" />}
                                    onClick={() => openEditLocationModal(loc)}
                                    title="Edit location"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="h-8 px-2 text-error hover:bg-red-50"
                                    icon={<Trash2 className="h-3.5 w-3.5" />}
                                    onClick={() => setDeletingLocation(loc)}
                                    title="Delete location"
                                  >
                                    Delete
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
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPPLIERS */}
      {/* ========================================================================= */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <Card
            title="Approved Suppliers & Vendor Roster"
            action={
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={openAddSupplierModal}
              >
                Add Supplier
              </Button>
            }
          >
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    placeholder="Search supplier, contact person, or email..."
                    className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="w-full sm:w-48">
                  <Select
                    value={supplierStatusFilter}
                    onChange={(e) => setSupplierStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Vendor Statuses' },
                      { value: 'Active', label: 'Active Only' },
                      { value: 'Inactive', label: 'Inactive Only' },
                    ]}
                  />
                </div>
              </div>

              {/* Suppliers Table */}
              <div className="overflow-hidden rounded-[8px] border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-3 min-w-[200px]">Supplier Name</th>
                        <th className="px-4 py-3">Contact Person</th>
                        <th className="px-4 py-3">Email & Phone</th>
                        <th className="px-4 py-3 text-center">Lead Time</th>
                        <th className="px-4 py-3 text-center">Rating</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface">
                      {filteredSuppliers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                            No suppliers found matching your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredSuppliers.map((sup) => (
                          <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-text flex items-center gap-2">
                                <Truck className="h-4 w-4 text-primary" />
                                {sup.name}
                              </div>
                              <div className="text-xs text-muted mt-0.5">ID: {sup.id}</div>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-text">{sup.contactPerson}</td>
                            <td className="px-4 py-3.5">
                              <div className="text-xs text-text flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted" />
                                {sup.email}
                              </div>
                              <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3 text-muted" />
                                {sup.phone}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                                {sup.leadTimeDays} {sup.leadTimeDays === 1 ? 'day' : 'days'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex justify-center">
                                <StarRating rating={sup.rating} />
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Chip
                                label={sup.status}
                                tone={sup.status === 'Active' ? 'good' : 'neutral'}
                              />
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="inline-flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  className="h-8 px-2 text-primary"
                                  icon={<Edit2 className="h-3.5 w-3.5" />}
                                  onClick={() => openEditSupplierModal(sup)}
                                  title="Edit supplier"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="h-8 px-2 text-error hover:bg-red-50"
                                  icon={<Trash2 className="h-3.5 w-3.5" />}
                                  onClick={() => setDeletingSupplier(sup)}
                                  title="Delete supplier"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SYSTEM */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Data Management Section */}
          <Card title="Data Management & Storage Operations">
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Export operational datasets, manage client-side storage cache, and view database statistics.
              </p>

              {/* Database quick metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                <div className="rounded-[8px] bg-slate-50 border border-border p-3 text-left">
                  <div className="text-xs text-muted flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-primary" /> Database Size
                  </div>
                  <div className="text-lg font-bold text-text mt-1">24.8 MB</div>
                </div>
                <div className="rounded-[8px] bg-slate-50 border border-border p-3 text-left">
                  <div className="text-xs text-muted flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-primary" /> Offline Cache
                  </div>
                  <div className="text-lg font-bold text-text mt-1">14.2 MB</div>
                </div>
                <div className="rounded-[8px] bg-slate-50 border border-border p-3 text-left">
                  <div className="text-xs text-muted">Total Skus</div>
                  <div className="text-lg font-bold text-text mt-1">1,248</div>
                </div>
                <div className="rounded-[8px] bg-slate-50 border border-border p-3 text-left">
                  <div className="text-xs text-muted">Audit Records</div>
                  <div className="text-lg font-bold text-text mt-1">15,847</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  icon={<Download className="h-4 w-4" />}
                  onClick={handleExportData}
                >
                  Export All Data (CSV)
                </Button>
                <Button
                  variant="secondary"
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={handleClearCache}
                >
                  Clear Cache
                </Button>
              </div>
            </div>
          </Card>

          {/* API Settings Section */}
          <Card title="API Configuration & Integration Keys">
            <div className="space-y-5">
              <p className="text-sm text-muted">
                Integrate external hospital management, ERP, and logistics platforms using our REST endpoints.
              </p>

              <div className="space-y-4">
                {/* Endpoint URL (read-only) */}
                <div>
                  <label className="flex flex-col gap-2 text-left">
                    <span className="text-sm font-medium text-text">API Endpoint Base URL</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={apiEndpointUrl}
                        readOnly
                        disabled
                        className="h-10 flex-1 rounded-[8px] border border-border bg-slate-100 px-3 text-sm text-muted font-mono"
                      />
                      <Button
                        variant="secondary"
                        icon={<Copy className="h-4 w-4" />}
                        onClick={() => handleCopyText(apiEndpointUrl, 'API Endpoint URL')}
                      >
                        Copy URL
                      </Button>
                    </div>
                  </label>
                </div>

                {/* API Key (masked with reveal toggle) */}
                <div>
                  <label className="flex flex-col gap-2 text-left">
                    <span className="text-sm font-medium text-text flex items-center justify-between">
                      <span>Production API Secret Key</span>
                      <span className="text-xs text-muted">Used in Authorization: Bearer header</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          readOnly
                          className="h-10 w-full rounded-[8px] border border-border bg-slate-50 pl-3 pr-10 text-sm font-mono text-text outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2.5 top-2.5 text-muted hover:text-text"
                          aria-label="Toggle API Key visibility"
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      <Button
                        variant="secondary"
                        icon={<Copy className="h-4 w-4" />}
                        onClick={() => handleCopyText(apiKey, 'API Secret Key')}
                      >
                        Copy Key
                      </Button>

                      <Button
                        variant="destructiveOutline"
                        icon={<Key className="h-4 w-4" />}
                        onClick={() => setIsRegenerateKeyModalOpen(true)}
                      >
                        Regenerate
                      </Button>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Danger Zone (Red-Bordered Card) */}
          <div className="rounded-[12px] border-2 border-red-300 bg-red-50/20 p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2.5 border-b border-red-200 pb-3 text-error">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-base font-bold">Danger Zone</h3>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted">
                The operations below are irrevocable and carry severe operational consequences. Double authentication is required.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[8px] border border-red-200 bg-white p-4">
                <div>
                  <h4 className="text-sm font-semibold text-text">Reset All Settings</h4>
                  <p className="text-xs text-muted mt-0.5">
                    Restores notifications, quiet hours, user preferences, and dashboard layout back to standard system defaults.
                  </p>
                </div>
                <Button
                  variant="destructiveOutline"
                  onClick={() => {
                    setResetConfirmInput('')
                    setIsResetSettingsModalOpen(true)
                  }}
                >
                  Reset All Settings
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[8px] border border-red-200 bg-white p-4">
                <div>
                  <h4 className="text-sm font-semibold text-error">Delete All Data</h4>
                  <p className="text-xs text-muted mt-0.5">
                    Permanently purges test batches, transactional inventory adjustments, transfers, and vendor relationships.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteConfirmInput('')
                    setIsDeleteAllDataModalOpen(true)
                  }}
                >
                  Delete All Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. ADD / EDIT LOCATION MODAL */}
      <Modal
        open={isLocationModalOpen}
        title={editingLocationId ? 'Edit Facility Location' : 'Add New Location'}
        confirmLabel={editingLocationId ? 'Save Changes' : 'Create Location'}
        onConfirm={handleSaveLocationModal}
        onClose={() => setIsLocationModalOpen(false)}
      >
        <div className="space-y-4 pt-1">
          <Input
            label="Location Name"
            value={locFormName}
            onChange={(e) => setLocFormName(e.target.value)}
            placeholder="e.g. North Annex Depot"
            required
          />

          <Select
            label="Facility Type"
            value={locFormType}
            onChange={(e) => setLocFormType(e.target.value as LocationType)}
            options={[
              { value: 'Warehouse', label: 'Warehouse' },
              { value: 'Cold Storage', label: 'Cold Storage' },
              { value: 'Branch', label: 'Branch' },
            ]}
          />

          <div>
            <label className="flex flex-col gap-2 text-left">
              <span className="text-sm font-medium text-text">Physical Street Address</span>
              <textarea
                value={locFormAddress}
                onChange={(e) => setLocFormAddress(e.target.value)}
                placeholder="Street address, Bay/Suite, City, State, ZIP..."
                rows={3}
                className="w-full rounded-[8px] border border-border bg-surface p-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={locFormLat}
              onChange={(e) => setLocFormLat(e.target.value)}
              placeholder="e.g. 41.8781"
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={locFormLng}
              onChange={(e) => setLocFormLng(e.target.value)}
              placeholder="e.g. -87.6298"
            />
          </div>

          <Select
            label="Operational Status"
            value={locFormStatus}
            onChange={(e) => setLocFormStatus(e.target.value as LocationStatus)}
            options={[
              { value: 'active', label: 'Active (Accepting Inventory)' },
              { value: 'inactive', label: 'Inactive (Decommissioned)' },
            ]}
          />
        </div>
      </Modal>

      {/* 2. DELETE LOCATION CONFIRM MODAL */}
      <Modal
        open={Boolean(deletingLocation)}
        title="Confirm Decommission Location"
        confirmLabel="Delete Location"
        confirmVariant="destructive"
        onConfirm={handleConfirmDeleteLocation}
        onClose={() => setDeletingLocation(null)}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-error">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Irreversible Deletion</span>
          </div>
          <p className="text-sm text-muted">
            Are you sure you want to permanently delete{' '}
            <strong className="text-text">{deletingLocation?.name}</strong>?
          </p>
          <p className="text-xs text-muted">
            Please ensure all stock on-hand has been relocated or written off before removing this facility from active tracking.
          </p>
        </div>
      </Modal>

      {/* 3. ADD / EDIT SUPPLIER MODAL */}
      <Modal
        open={isSupplierModalOpen}
        title={editingSupplierId ? 'Edit Supplier Details' : 'Add New Approved Supplier'}
        confirmLabel={editingSupplierId ? 'Save Changes' : 'Add Supplier'}
        onConfirm={handleSaveSupplierModal}
        onClose={() => setIsSupplierModalOpen(false)}
      >
        <div className="space-y-4 pt-1">
          <Input
            label="Supplier Company Name"
            value={supFormName}
            onChange={(e) => setSupFormName(e.target.value)}
            placeholder="e.g. MedSupply Innovations"
            required
          />

          <Input
            label="Contact Person Name"
            value={supFormContact}
            onChange={(e) => setSupFormContact(e.target.value)}
            placeholder="e.g. Sarah Jenkins"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Email"
              type="email"
              value={supFormEmail}
              onChange={(e) => setSupFormEmail(e.target.value)}
              placeholder="vendor@example.com"
              required
            />
            <Input
              label="Phone Number"
              value={supFormPhone}
              onChange={(e) => setSupFormPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Lead Time (Days)"
              type="number"
              min="1"
              value={supFormLeadTime}
              onChange={(e) => setSupFormLeadTime(e.target.value)}
              required
            />
            <Select
              label="Performance Rating"
              value={supFormRating}
              onChange={(e) => setSupFormRating(e.target.value)}
              options={[
                { value: '5.0', label: '5.0 Stars (Excellent)' },
                { value: '4.5', label: '4.5 Stars (Very Good)' },
                { value: '4.0', label: '4.0 Stars (Good)' },
                { value: '3.5', label: '3.5 Stars (Average)' },
                { value: '3.0', label: '3.0 Stars (Fair)' },
                { value: '2.0', label: '2.0 Stars (Poor)' },
              ]}
            />
          </div>

          <Select
            label="Status"
            value={supFormStatus}
            onChange={(e) => setSupFormStatus(e.target.value as SupplierStatus)}
            options={[
              { value: 'Active', label: 'Active Vendor' },
              { value: 'Inactive', label: 'Inactive / Suspended' },
            ]}
          />
        </div>
      </Modal>

      {/* 4. DELETE SUPPLIER CONFIRM MODAL */}
      <Modal
        open={Boolean(deletingSupplier)}
        title="Confirm Delete Supplier"
        confirmLabel="Delete Supplier"
        confirmVariant="destructive"
        onConfirm={handleConfirmDeleteSupplier}
        onClose={() => setDeletingSupplier(null)}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-error">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Remove Approved Vendor</span>
          </div>
          <p className="text-sm text-muted">
            Are you sure you want to remove{' '}
            <strong className="text-text">{deletingSupplier?.name}</strong> from the supplier directory?
          </p>
          <p className="text-xs text-muted">
            Historic purchase orders and batch tracing linked to this supplier will be preserved in audit records.
          </p>
        </div>
      </Modal>

      {/* 5. REGENERATE API KEY CONFIRM MODAL */}
      <Modal
        open={isRegenerateKeyModalOpen}
        title="Regenerate API Secret Key"
        confirmLabel="Regenerate Key"
        confirmVariant="destructive"
        onConfirm={handleRegenerateKey}
        onClose={() => setIsRegenerateKeyModalOpen(false)}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-error">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Active Integrations Will Break</span>
          </div>
          <p className="text-sm text-muted">
            Generating a new API secret key immediately revokes the current key. Any warehouse scanning devices, webhooks, or third-party automated scripts must be updated immediately with the new secret.
          </p>
        </div>
      </Modal>

      {/* 6. RESET ALL SETTINGS DOUBLE-CONFIRM MODAL */}
      <Modal
        open={isResetSettingsModalOpen}
        title="Reset All Settings to Factory Default"
        confirmLabel="Confirm Reset"
        confirmVariant="destructive"
        onConfirm={handleConfirmResetSettings}
        onClose={() => setIsResetSettingsModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-[8px] bg-red-50 p-3 border border-red-200 text-xs text-error">
            This action will revert all notification preferences, quiet hours, user profile fields, and display configurations to system default.
          </div>
          <p className="text-xs text-muted">
            To proceed, type <strong className="text-text">RESET</strong> in capital letters below:
          </p>
          <input
            type="text"
            value={resetConfirmInput}
            onChange={(e) => setResetConfirmInput(e.target.value)}
            placeholder="Type RESET"
            className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-error focus:ring-2 focus:ring-error/20"
          />
        </div>
      </Modal>

      {/* 7. DELETE ALL DATA DOUBLE-CONFIRM MODAL */}
      <Modal
        open={isDeleteAllDataModalOpen}
        title="Purge Operational & Inventory Records"
        confirmLabel="Permanently Delete All Data"
        confirmVariant="destructive"
        onConfirm={handleConfirmDeleteAllData}
        onClose={() => setIsDeleteAllDataModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-[8px] bg-red-50 p-3 border border-red-200 text-xs text-error">
            <strong>CRITICAL WARNING:</strong> This will erase all inventory locations, suppliers, batches, and transactions. This operation is irreversible.
          </div>
          <p className="text-xs text-muted">
            To confirm permanent deletion, type <strong className="text-error">DELETE ALL DATA</strong> in uppercase below:
          </p>
          <input
            type="text"
            value={deleteConfirmInput}
            onChange={(e) => setDeleteConfirmInput(e.target.value)}
            placeholder="Type DELETE ALL DATA"
            className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none focus:border-error focus:ring-2 focus:ring-error/20"
          />
        </div>
      </Modal>
    </div>
  )
}
