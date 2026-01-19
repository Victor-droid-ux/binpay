"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  Users,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Mail,
  Phone,
  Calendar,
  BarChart4,
  PieChart,
  LineChart,
  Printer,
  Clock,
  MapPin,
  Map,
  ZoomIn,
  ZoomOut,
  Layers,
  Filter,
  Navigation,
  Maximize,
  Minimize,
  Bell,
  MessageSquare,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { authApi, adminApi, ApiError } from "@/lib/api"
import { NIGERIAN_STATES, getStateByCode } from "@/lib/states-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

// State map centers configuration
const STATE_MAP_CENTERS: Record<string, { lat: number; lng: number }> = {
  'EN': { lat: 6.5244, lng: 7.4883 }, // Enugu State
  'en': { lat: 6.5244, lng: 7.4883 }, // Enugu State (lowercase)
  'LA': { lat: 6.5244, lng: 3.3792 }, // Lagos State
  'la': { lat: 6.5244, lng: 3.3792 }, // Lagos State (lowercase)
  'lagos': { lat: 6.5244, lng: 3.3792 }, // Lagos State (alternative)
  'LAGOS': { lat: 6.5244, lng: 3.3792 }, // Lagos State (alternative uppercase)
  'FC': { lat: 9.0765, lng: 7.3986 }, // Federal Capital Territory (Abuja)
  'fc': { lat: 9.0765, lng: 7.3986 }, // Federal Capital Territory (lowercase)
  'fct': { lat: 9.0765, lng: 7.3986 }, // Federal Capital Territory (alternative)
  'FCT': { lat: 9.0765, lng: 7.3986 }, // Federal Capital Territory (alternative uppercase)
}

// Enugu State LGA boundaries and major areas
const enuguStateLGAs = [
  { name: "Enugu North", center: { lat: 6.4598, lng: 7.5149 }, color: "#3B82F6" },
  { name: "Enugu South", center: { lat: 6.4372, lng: 7.5186 }, color: "#10B981" },
  { name: "Enugu East", center: { lat: 6.4474, lng: 7.5248 }, color: "#F59E0B" },
  { name: "Nsukka", center: { lat: 6.8567, lng: 7.3958 }, color: "#EF4444" },
  { name: "Oji River", center: { lat: 6.2167, lng: 7.2167 }, color: "#8B5CF6" },
  { name: "Awgu", center: { lat: 6.0833, lng: 7.4833 }, color: "#06B6D4" },
  { name: "Udi", center: { lat: 6.3167, lng: 7.4333 }, color: "#84CC16" },
  { name: "Nkanu West", center: { lat: 6.2833, lng: 7.6167 }, color: "#F97316" },
  { name: "Nkanu East", center: { lat: 6.3167, lng: 7.6833 }, color: "#EC4899" },
  { name: "Ezeagu", center: { lat: 6.35, lng: 7.15 }, color: "#6366F1" },
  { name: "Igbo Etiti", center: { lat: 6.7833, lng: 7.2833 }, color: "#14B8A6" },
  { name: "Uzo Uwani", center: { lat: 6.8167, lng: 7.5167 }, color: "#F43F5E" },
  { name: "Igbo Eze North", center: { lat: 6.9167, lng: 7.4167 }, color: "#A855F7" },
  { name: "Igbo Eze South", center: { lat: 6.8833, lng: 7.45 }, color: "#22C55E" },
  { name: "Udenu", center: { lat: 6.95, lng: 7.35 }, color: "#EAB308" },
  { name: "Aninri", center: { lat: 6.2167, lng: 7.5833 }, color: "#DC2626" },
  { name: "Isi Uzo", center: { lat: 6.75, lng: 7.5833 }, color: "#7C3AED" },
]

// Lagos State LGA boundaries and major areas
const lagosStateLGAs = [
  { name: "Ikeja", center: { lat: 6.5964, lng: 3.3406 }, color: "#3B82F6" },
  { name: "Lagos Island", center: { lat: 6.4541, lng: 3.3947 }, color: "#10B981" },
  { name: "Lagos Mainland", center: { lat: 6.5023, lng: 3.3792 }, color: "#F59E0B" },
  { name: "Surulere", center: { lat: 6.4969, lng: 3.3481 }, color: "#EF4444" },
  { name: "Ikorodu", center: { lat: 6.6194, lng: 3.5117 }, color: "#8B5CF6" },
  { name: "Epe", center: { lat: 6.5833, lng: 3.9833 }, color: "#06B6D4" },
  { name: "Badagry", center: { lat: 6.4167, lng: 2.8833 }, color: "#84CC16" },
  { name: "Alimosho", center: { lat: 6.5833, lng: 3.2667 }, color: "#F97316" },
  { name: "Oshodi-Isolo", center: { lat: 6.5333, lng: 3.3333 }, color: "#EC4899" },
  { name: "Mushin", center: { lat: 6.5272, lng: 3.3450 }, color: "#6366F1" },
]

// FCT Area Councils
const fctAreaCouncils = [
  { name: "Abuja Municipal", center: { lat: 9.0579, lng: 7.4951 }, color: "#3B82F6" },
  { name: "Gwagwalada", center: { lat: 8.9428, lng: 7.0833 }, color: "#10B981" },
  { name: "Kuje", center: { lat: 8.8833, lng: 7.2333 }, color: "#F59E0B" },
  { name: "Bwari", center: { lat: 9.2833, lng: 7.3833 }, color: "#EF4444" },
  { name: "Kwali", center: { lat: 8.8833, lng: 7.0167 }, color: "#8B5CF6" },
  { name: "Abaji", center: { lat: 8.7167, lng: 6.7333 }, color: "#06B6D4" },
]

export default function StateAdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stateStats, setStateStats] = useState<any>(null)

  // Get current state's LGAs
  const getCurrentStateLGAs = () => {
    const stateCode = currentUser?.stateCode?.toUpperCase()
    if (stateCode === 'LA' || stateCode === 'LAGOS') return lagosStateLGAs
    if (stateCode === 'FC' || stateCode === 'FCT') return fctAreaCouncils
    return enuguStateLGAs // Default to Enugu
  }

  // Data loading states
  const [bills, setBills] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [isLoadingBills, setIsLoadingBills] = useState(false)
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)

  // Bills state
  const [billsSearchQuery, setBillsSearchQuery] = useState("")
  const [billsStatusFilter, setBillsStatusFilter] = useState("all")
  const [billsCurrentPage, setBillsCurrentPage] = useState(1)
  const billsPerPage = 5

  const [isNotificationSending, setIsNotificationSending] = useState<string | null>(null)
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null)

  // Payments state
  const [paymentsSearchQuery, setPaymentsSearchQuery] = useState("")
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState("all")
  const [paymentsCurrentPage, setPaymentsCurrentPage] = useState(1)
  const paymentsPerPage = 5

  // Users state
  const [usersSearchQuery, setUsersSearchQuery] = useState("")
  const [usersStatusFilter, setUsersStatusFilter] = useState("all")
  const [usersCurrentPage, setUsersCurrentPage] = useState(1)
  const usersPerPage = 5

  // Addresses state
  const [addressesSearchQuery, setAddressesSearchQuery] = useState("")
  const [addressesStatusFilter, setAddressesStatusFilter] = useState("all")
  const [addressesCurrentPage, setAddressesCurrentPage] = useState(1)
  const addressesPerPage = 10

  // Reports state
  const [reportsTypeFilter, setReportsTypeFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  // Map state
  const [mapFilter, setMapFilter] = useState("all")
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const [mapZoom, setMapZoom] = useState(10)
  const [mapCenter, setMapCenter] = useState({ lat: 6.5244, lng: 7.4883 }) // Default to Enugu, will be updated based on state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLGABoundaries, setShowLGABoundaries] = useState(true)

  // Address registration state
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false)
  const [newAddress, setNewAddress] = useState({
    lgaName: "",
    address: "",
    customerRef: "",
  })
  const [isRegisteringAddress, setIsRegisteringAddress] = useState(false)
  const [registeredBinId, setRegisteredBinId] = useState<string | null>(null)

  // Bill details dialog state
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [showBillDetails, setShowBillDetails] = useState(false)

  // Address details dialog state
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const [showAddressDetails, setShowAddressDetails] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [editedAddress, setEditedAddress] = useState({
    address: '',
    lgaName: '',
    customerRef: ''
  })

  // Load bills for current state
  const loadBills = async (stateCode: string) => {
    try {
      setIsLoadingBills(true)
      const response = await adminApi.getStateBills(stateCode, {
        page: billsCurrentPage,
        limit: 50, // Load more for local filtering
      })
      setBills(response.bills || [])
    } catch (err: any) {
      console.error("Failed to load bills:", err)
    } finally {
      setIsLoadingBills(false)
    }
  }

  // Load payments for current state
  const loadPayments = async (stateCode: string) => {
    try {
      setIsLoadingPayments(true)
      const response = await adminApi.getStatePayments(stateCode, {
        page: paymentsCurrentPage,
        limit: 50,
      })
      setPayments(response.payments || [])
    } catch (err: any) {
      console.error("Failed to load payments:", err)
    } finally {
      setIsLoadingPayments(false)
    }
  }

  // Load users for current state
  const loadUsers = async (stateCode: string) => {
    try {
      setIsLoadingUsers(true)
      const response = await adminApi.getStateUsers(stateCode, {
        page: usersCurrentPage,
        limit: 50,
      })
      setUsers(response.users || [])
    } catch (err: any) {
      console.error("Failed to load users:", err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Load registered addresses for current state
  const loadAddresses = async () => {
    try {
      setIsLoadingAddresses(true)
      const response = await adminApi.getAddresses()
      setAddresses(response.addresses || [])
    } catch (err: any) {
      console.error("Failed to load addresses:", err)
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  // Handle address registration
  const handleRegisterAddress = async () => {
    if (!newAddress.lgaName || !newAddress.address) {
      alert("Please fill in all required fields")
      return
    }

    try {
      setIsRegisteringAddress(true)
      const response = await adminApi.registerAddress(newAddress)
      setRegisteredBinId(response.binRegistration.binId)
      setNewAddress({ lgaName: "", address: "", customerRef: "" })
      // Reload addresses list
      await loadAddresses()
    } catch (err: any) {
      console.error("Failed to register address:", err)
      alert(err.response?.data?.message || "Failed to register address")
    } finally {
      setIsRegisteringAddress(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/admin/login')
  }

  // Check authentication and load state data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // Check if user is authenticated and is STATE_ADMIN
        const userResponse = await authApi.getCurrentUser()
        
        if (userResponse.role !== "STATE_ADMIN") {
          router.push("/admin/login")
          return
        }

        setCurrentUser(userResponse)

        // Load state statistics and data if stateCode is available
        if (userResponse.stateCode) {
          const statsResponse = await adminApi.getStateStats(userResponse.stateCode)
          setStateStats(statsResponse)
          
          // Load bills, payments, users, and addresses
          await Promise.all([
            loadBills(userResponse.stateCode),
            loadPayments(userResponse.stateCode),
            loadUsers(userResponse.stateCode),
            loadAddresses(),
          ])
        }
      } catch (err) {
        console.error("Auth/Data load error:", err)
        if (err instanceof ApiError && err.status === 401) {
          router.push("/admin/login")
        } else {
          setError("Failed to load dashboard data")
        }
      } finally {
        setIsInitialLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [router])

  // Update map center when currentUser changes
  useEffect(() => {
    if (currentUser?.stateCode) {
      const stateCode = currentUser.stateCode
      console.log('Setting map center for state:', stateCode)
      const center = STATE_MAP_CENTERS[stateCode] || STATE_MAP_CENTERS[stateCode.toUpperCase()]
      if (center) {
        console.log('Map center found:', center)
        setMapCenter(center)
      } else {
        console.log('No map center found for state code:', stateCode)
      }
    }
  }, [currentUser])

  // Use loaded state info
  const stateInfo = currentUser ? {
    name: currentUser.stateCode?.toUpperCase() || "Unknown",
    code: currentUser.stateCode || "",
    authority: "State Waste Management Authority",
    adminName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
    adminEmail: currentUser.email,
  } : {
    name: "Loading...",
    code: "",
    authority: "",
    adminName: "",
    adminEmail: "",
  }

  // Use loaded stats
  const stats = stateStats?.stats || {
    totalUsers: 0,
    totalBills: 0,
    paidBills: 0,
    pendingBills: 0,
    overdueBills: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    collectionRate: 0,
    activeUsers: 0,
  }

  // Filter bills based on search query and status filter
  const filteredBills = bills.filter((bill) => {
    const binId = bill.binRegistration?.binId || ''
    const address = bill.binRegistration?.address || ''
    const zone = bill.binRegistration?.zone || ''
    
    const matchesSearch =
      bill._id?.toLowerCase().includes(billsSearchQuery.toLowerCase()) ||
      binId.toLowerCase().includes(billsSearchQuery.toLowerCase()) ||
      address.toLowerCase().includes(billsSearchQuery.toLowerCase()) ||
      zone.toLowerCase().includes(billsSearchQuery.toLowerCase())

    const matchesStatus = billsStatusFilter === "all" || bill.status === billsStatusFilter

    return matchesSearch && matchesStatus
  })

  // Paginate bills
  const indexOfLastBill = billsCurrentPage * billsPerPage
  const indexOfFirstBill = indexOfLastBill - billsPerPage
  const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill)
  const totalBillsPages = Math.ceil(filteredBills.length / billsPerPage)

  // Filter payments based on search query and status filter
  const filteredPayments = payments.filter((payment) => {
    const binId = payment.billId?.binRegistration?.binId || ''
    const address = payment.billId?.binRegistration?.address || ''
    const zone = payment.billId?.binRegistration?.zone || ''
    const userName = `${payment.userId?.firstName || ''} ${payment.userId?.lastName || ''}`.trim()
    
    const matchesSearch =
      payment._id?.toLowerCase().includes(paymentsSearchQuery.toLowerCase()) ||
      payment.reference?.toLowerCase().includes(paymentsSearchQuery.toLowerCase()) ||
      binId.toLowerCase().includes(paymentsSearchQuery.toLowerCase()) ||
      userName.toLowerCase().includes(paymentsSearchQuery.toLowerCase()) ||
      address.toLowerCase().includes(paymentsSearchQuery.toLowerCase()) ||
      zone.toLowerCase().includes(paymentsSearchQuery.toLowerCase())

    const matchesStatus = paymentsStatusFilter === "all" || payment.status === paymentsStatusFilter

    return matchesSearch && matchesStatus
  })

  // Paginate payments
  const indexOfLastPayment = paymentsCurrentPage * paymentsPerPage
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment)
  const totalPaymentsPages = Math.ceil(filteredPayments.length / paymentsPerPage)

  // Filter users based on search query and status filter
  const filteredUsers = users.filter((user) => {
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    
    const matchesSearch =
      userName.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(usersSearchQuery.toLowerCase())

    const matchesStatus = usersStatusFilter === "all" || 
      (usersStatusFilter === "active" && user.isActive) ||
      (usersStatusFilter === "inactive" && !user.isActive)

    return matchesSearch && matchesStatus
  })

  // Paginate users
  const indexOfLastUser = usersCurrentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage)

  // Filter addresses based on search query and status filter
  const filteredAddresses = addresses.filter((address) => {
    const binId = address.binId || ''
    const addressText = address.address || ''
    const lgaName = address.lgaName || ''
    const customerRef = address.customerRef || ''
    const linkedUser = address.userId ? `${address.userId.firstName || ''} ${address.userId.lastName || ''}`.trim() : ''
    
    const matchesSearch =
      binId.toLowerCase().includes(addressesSearchQuery.toLowerCase()) ||
      addressText.toLowerCase().includes(addressesSearchQuery.toLowerCase()) ||
      lgaName.toLowerCase().includes(addressesSearchQuery.toLowerCase()) ||
      customerRef.toLowerCase().includes(addressesSearchQuery.toLowerCase()) ||
      linkedUser.toLowerCase().includes(addressesSearchQuery.toLowerCase())

    const matchesStatus = addressesStatusFilter === "all" || 
      (addressesStatusFilter === "active" && address.isActive) ||
      (addressesStatusFilter === "inactive" && !address.isActive)

    return matchesSearch && matchesStatus
  })

  // Paginate addresses
  const indexOfLastAddress = addressesCurrentPage * addressesPerPage
  const indexOfFirstAddress = indexOfLastAddress - addressesPerPage
  const currentAddresses = filteredAddresses.slice(indexOfFirstAddress, indexOfLastAddress)
  const totalAddressesPages = Math.ceil(filteredAddresses.length / addressesPerPage)

  // Filter reports based on type filter
  const reportsData: any[] = [] // Reports feature not yet implemented
  const filteredReports = reportsData.filter((report) => {
    return reportsTypeFilter === "all" || report.type === reportsTypeFilter
  })

  // Filter map markers based on status (use bills data)
  const filteredMapData = bills.filter((bill) => {
    if (mapFilter === "all") return true
    return bill.status === mapFilter
  })

  // Convert coordinates to pixel positions for the map
  const coordinateToPixel = (lat: number, lng: number, mapWidth: number, mapHeight: number) => {
    // Enugu State bounds (approximate)
    const bounds = {
      north: 7.0,
      south: 6.0,
      east: 7.8,
      west: 7.0,
    }

    // Apply zoom factor
    const zoomFactor = mapZoom / 10
    const centerLat = mapCenter.lat
    const centerLng = mapCenter.lng

    // Calculate visible bounds based on zoom and center
    const latRange = (bounds.north - bounds.south) / zoomFactor
    const lngRange = (bounds.east - bounds.west) / zoomFactor

    const visibleBounds = {
      north: centerLat + latRange / 2,
      south: centerLat - latRange / 2,
      east: centerLng + lngRange / 2,
      west: centerLng - lngRange / 2,
    }

    const x = ((lng - visibleBounds.west) / (visibleBounds.east - visibleBounds.west)) * mapWidth
    const y = ((visibleBounds.north - lat) / (visibleBounds.north - visibleBounds.south)) * mapHeight

    return { x: Math.max(0, Math.min(mapWidth, x)), y: Math.max(0, Math.min(mapHeight, y)) }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const sendOverdueNotification = async (bill: any) => {
    setIsNotificationSending(bill.id)
    console.log("[v0] Sending overdue notification to:", bill.customerName, bill.customerPhone)

    try {
      // Simulate API call to send SMS/Email notification
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, this would call your notification service
      // await notificationService.sendOverdueNotification({
      //   customerName: bill.customerName,
      //   customerPhone: bill.customerPhone,
      //   binId: bill.binId,
      //   amount: bill.amount,
      //   dueDate: bill.dueDate,
      //   daysOverdue: Math.floor((new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      // })

      setNotificationSuccess(bill.id)
      setTimeout(() => setNotificationSuccess(null), 3000)
      console.log("[v0] Notification sent successfully to", bill.customerName)
    } catch (error) {
      console.error("[v0] Failed to send notification:", error)
    } finally {
      setIsNotificationSending(null)
    }
  }

  const sendBulkOverdueNotifications = async () => {
    const overdueBills = bills.filter((bill) => bill.status === "overdue")
    console.log("[v0] Sending bulk notifications to", overdueBills.length, "overdue accounts")

    setIsNotificationSending("bulk")

    try {
      // Simulate bulk notification sending
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // In a real app, this would call your bulk notification service
      // await notificationService.sendBulkOverdueNotifications(overdueBills)

      setNotificationSuccess("bulk")
      setTimeout(() => setNotificationSuccess(null), 5000)
      console.log("[v0] Bulk notifications sent successfully")
    } catch (error) {
      console.error("[v0] Failed to send bulk notifications:", error)
    } finally {
      setIsNotificationSending(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading State */}
      {isInitialLoading && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isInitialLoading && (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {!isInitialLoading && (
        <>
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo href="/" size="sm" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  {stateInfo.authority} Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">{stateInfo.name} State Waste Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                State Admin
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {stateInfo.adminName}</h2>
          <p className="text-gray-600">Manage waste bills and payments for {stateInfo.name} State</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="map">State Map</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="users">Registered Addresses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{(stats.totalUsers || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Bills</p>
                      <p className="text-2xl font-bold text-gray-900">{(stats.totalBills || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₦{((stats.monthlyRevenue || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Bills</p>
                      <p className="text-2xl font-bold text-gray-900">{(stats.pendingBills || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>Latest successful payments in your state</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payments
                      .filter((payment) => payment.status === "successful")
                      .slice(0, 5)
                      .map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <div>
                              <p className="font-medium">{payment.binId}</p>
                              <p className="text-sm text-gray-600">{payment.customerName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Important notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Payment Gateway Maintenance</p>
                        <p className="text-sm text-yellow-700">Scheduled maintenance tonight 11 PM - 2 AM</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Monthly Report Ready</p>
                        <p className="text-sm text-green-700">January 2024 report is available for download</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Revenue Increase</p>
                        <p className="text-sm text-blue-700">15% increase in collections this month</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <div className={`grid gap-6 ${isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-4"}`}>
              {/* Map Controls */}
              {!isFullscreen && (
                <div className="lg:col-span-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Map className="w-5 h-5 mr-2" />
                        Map Controls
                      </CardTitle>
                      <CardDescription>Filter and control map display</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Status Filter */}
                      <div>
                        <Label className="text-sm font-medium">Filter by Status</Label>
                        <Select value={mapFilter} onValueChange={setMapFilter}>
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Properties</SelectItem>
                            <SelectItem value="paid">Paid (Green)</SelectItem>
                            <SelectItem value="pending">Due for Payment (Yellow)</SelectItem>
                            <SelectItem value="overdue">Overdue (Red)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* LGA Boundaries Toggle */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="showLGABoundaries"
                          checked={showLGABoundaries}
                          onChange={(e) => setShowLGABoundaries(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="showLGABoundaries" className="text-sm">
                          Show LGA Boundaries
                        </Label>
                      </div>

                      {/* Map Legend */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Legend</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Paid Bills</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm">Due for Payment</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                            <span className="text-sm">Overdue Bills</span>
                          </div>
                        </div>
                      </div>

                      {/* LGA List */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          {stateInfo.name === 'FEDERAL CAPITAL TERRITORY' ? 'Area Councils' : 'Local Government Areas'}
                        </Label>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {getCurrentStateLGAs().map((lga) => (
                            <div
                              key={lga.name}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => {
                                setMapCenter(lga.center)
                                setMapZoom(14)
                              }}
                            >
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lga.color }}></div>
                              <span className="text-sm">{lga.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Statistics */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Statistics</Label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Properties:</span>
                            <span className="font-medium">{bills.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">Paid:</span>
                            <span className="font-medium text-green-600">
                              {bills.filter((b) => b.status === "paid").length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-yellow-600">Pending:</span>
                            <span className="font-medium text-yellow-600">
                              {bills.filter((b) => b.status === "pending").length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-red-600">Overdue:</span>
                            <span className="font-medium text-red-600">
                              {bills.filter((b) => b.status === "overdue").length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Zoom Controls */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Zoom Level</Label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMapZoom(Math.max(mapZoom - 2, 6))}
                            disabled={mapZoom <= 6}
                          >
                            <ZoomOut className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium">{mapZoom}x</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMapZoom(Math.min(mapZoom + 2, 20))}
                            disabled={mapZoom >= 20}
                          >
                            <ZoomIn className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Reset View */}
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => {
                          // Reset to current state's center
                          if (currentUser?.stateCode) {
                            const center = STATE_MAP_CENTERS[currentUser.stateCode] || STATE_MAP_CENTERS[currentUser.stateCode.toUpperCase()]
                            if (center) {
                              setMapCenter(center)
                            }
                          }
                          setMapZoom(10)
                        }}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Reset View
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Map Display */}
              <div className={isFullscreen ? "col-span-1" : "lg:col-span-3"}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        {stateInfo.name} State - Registered Properties Map
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{filteredMapData.length} properties shown</Badge>
                        <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Interactive map showing all registered waste bin locations with payment status across {stateInfo.name} State
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Enhanced Map Container */}
                    <div
                      className={`relative w-full bg-gray-100 rounded-lg border overflow-hidden ${isFullscreen ? "h-[80vh]" : "h-[600px]"}`}
                    >
                      {/* Google Maps Embed */}
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${mapCenter.lat},${mapCenter.lng}&zoom=${mapZoom}&maptype=roadmap`}
                      ></iframe>

                      {/* Enhanced Map Controls Overlay */}
                      <div className="absolute top-4 right-4 flex flex-col space-y-2">
                        <Button variant="outline" size="sm" className="bg-white/95 hover:bg-white shadow-lg">
                          <Layers className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white/95 hover:bg-white shadow-lg">
                          <Filter className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Enhanced Coordinates Display */}
                      <div className="absolute bottom-4 left-4 bg-white/95 rounded-lg px-4 py-3 text-xs shadow-lg border">
                        <div className="font-semibold text-gray-700">
                          📍 {mapCenter.lat.toFixed(4)}°N, {mapCenter.lng.toFixed(4)}°E
                        </div>
                        <div className="text-gray-600 mt-1">
                          🔍 Zoom: {mapZoom}x | Scale: 1:{(mapZoom * 10000).toLocaleString()}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">🗺️ {stateInfo.name} State Coverage Area</div>
                      </div>

                      {/* Enhanced Compass with better styling */}
                      <div className="absolute top-4 left-4 bg-white/95 rounded-full p-3 shadow-lg border">
                        <div className="w-10 h-10 relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-red-600">N</span>
                          </div>
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-6 border-transparent border-b-red-600"></div>
                          <div className="absolute inset-0 border-2 border-gray-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Map Summary */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">Paid Properties</p>
                              <p className="text-lg font-bold text-green-600">
                                {bills.filter((b) => b.status === "paid").length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">Due for Payment</p>
                              <p className="text-lg font-bold text-yellow-600">
                                {bills.filter((b) => b.status === "pending").length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">Overdue Bills</p>
                              <p className="text-lg font-bold text-red-600">
                                {bills.filter((b) => b.status === "overdue").length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bills" className="mt-6">
            {/* Monthly Bill Generation Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Monthly Bill Generation
                </CardTitle>
                <CardDescription>
                  Generate bills for all registered addresses in {stateInfo.name} State
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 mb-1">Active Bins</p>
                    <p className="text-2xl font-bold text-blue-600">{addresses.length}</p>
                    <p className="text-xs text-blue-700 mt-1">Registered addresses</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900 mb-1">Current Bill Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₦{stats.averageBill?.toLocaleString() || '1,500'}
                    </p>
                    <p className="text-xs text-green-700 mt-1">Per bin, per month</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-900 mb-1">Expected Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ₦{((stats.averageBill || 1500) * addresses.length).toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-700 mt-1">This billing cycle</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Alert className="border-orange-600 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-900">
                      <span className="font-semibold">Important:</span> This will generate bills for all active bins that don't already have a bill for the current month.
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={async () => {
                      if (!confirm(`Generate monthly bills for ${addresses.length} active bins in ${stateInfo.name}?\n\nBill Amount: ₦${(stats.averageBill || 1500).toLocaleString()} per bin\nExpected Revenue: ₦${((stats.averageBill || 1500) * addresses.length).toLocaleString()}`)) {
                        return
                      }

                      try {
                        const data = await adminApi.generateMonthlyBills()
                        alert(`Bills Generated!\n\n✅ Generated: ${data.generated}\n⏭️ Skipped: ${data.skipped}\n❌ Errors: ${data.errors?.length || 0}`)
                        
                        // Reload bills
                        if (currentUser?.stateCode) {
                          await loadBills(currentUser.stateCode)
                        }
                      } catch (error) {
                        console.error('Failed to generate bills:', error)
                        alert('Failed to generate bills. Please try again.')
                      }
                    }}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Generate Monthly Bills
                  </Button>

                  <div className="text-xs text-gray-500">
                    <p>• Bills will only be generated for bins that are linked to users</p>
                    <p>• Duplicate bills for the same month will be skipped automatically</p>
                    <p>• Users will receive notifications about new bills</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bill Management</CardTitle>
                <CardDescription>Manage waste bills for {stateInfo.name} State</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by bill ID, bin ID, customer name, address, or zone..."
                          className="pl-10"
                          value={billsSearchQuery}
                          onChange={(e) => setBillsSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-48">
                      <Select value={billsStatusFilter} onValueChange={setBillsStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New Bill
                    </Button>
                    <Button
                      variant="outline"
                      onClick={sendBulkOverdueNotifications}
                      disabled={
                        isNotificationSending === "bulk" || bills.filter((b) => b.status === "overdue").length === 0
                      }
                      className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                    >
                      {isNotificationSending === "bulk" ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 mr-2" />
                          Notify All Overdue ({bills.filter((b) => b.status === "overdue").length})
                        </>
                      )}
                    </Button>
                  </div>

                  {notificationSuccess === "bulk" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-green-800 font-medium">
                        Bulk overdue notifications sent successfully to all overdue accounts!
                      </p>
                    </div>
                  )}

                  {/* Bills Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Bill ID</TableHead>
                          <TableHead>Bin & Address</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentBills.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell className="font-medium">{bill.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-blue-600">{bill.binId}</p>
                                <p className="text-sm text-gray-600">{bill.binAddress}</p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {bill.zone}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{bill.customerName}</p>
                                <p className="text-sm text-gray-600">{bill.customerPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(bill.amount)}</TableCell>
                            <TableCell>{formatDate(bill.dueDate)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  bill.status === "paid"
                                    ? "default"
                                    : bill.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedBill(bill)
                                    setShowBillDetails(true)
                                  }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    // TODO: Implement edit functionality
                                    toast({ title: 'Edit Bill', description: 'Edit functionality coming soon' })
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Bill
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    window.open(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/bills/${bill.id}/download`, '_blank')
                                  }}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </DropdownMenuItem>

                                  {bill.status === "overdue" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => sendOverdueNotification(bill)}
                                        disabled={isNotificationSending === bill.id}
                                        className="text-orange-600 focus:text-orange-700"
                                      >
                                        {isNotificationSending === bill.id ? (
                                          <>
                                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                          </>
                                        ) : (
                                          <>
                                            <Bell className="mr-2 h-4 w-4" />
                                            Send Overdue Notice
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => sendOverdueNotification(bill)}
                                        disabled={isNotificationSending === bill.id}
                                        className="text-blue-600 focus:text-blue-700"
                                      >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Send SMS Reminder
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Bill
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {notificationSuccess === bill.id && (
                                <div className="absolute right-0 top-0 -mt-2 -mr-2">
                                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Sent!</span>
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => billsCurrentPage > 1 && setBillsCurrentPage((prev) => Math.max(prev - 1, 1))}
                          aria-disabled={billsCurrentPage === 1}
                          className={billsCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalBillsPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === billsCurrentPage}
                            onClick={() => setBillsCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => billsCurrentPage < totalBillsPages && setBillsCurrentPage((prev) => Math.min(prev + 1, totalBillsPages))}
                          aria-disabled={billsCurrentPage === totalBillsPages}
                          className={billsCurrentPage === totalBillsPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>View and manage payments for {stateInfo.name} State</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by payment ID, bin ID, customer name, address, or zone..."
                          className="pl-10"
                          value={paymentsSearchQuery}
                          onChange={(e) => setPaymentsSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-48">
                      <Select value={paymentsStatusFilter} onValueChange={setPaymentsStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="successful">Successful</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button>
                      <Download className="w-4 h-4 mr-2" />
                      Export Payments
                    </Button>
                  </div>

                  {/* Payments Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Payment ID</TableHead>
                          <TableHead>Bin & Address</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-blue-600">{payment.binId}</p>
                                <p className="text-sm text-gray-600">{payment.binAddress}</p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {payment.zone}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>{payment.customerName}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{payment.paymentMethod?.replace("_", " ").toUpperCase() || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  payment.status === "successful"
                                    ? "default"
                                    : payment.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Receipt
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Receipt
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => paymentsCurrentPage > 1 && setPaymentsCurrentPage((prev) => Math.max(prev - 1, 1))}
                          aria-disabled={paymentsCurrentPage === 1}
                          className={paymentsCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPaymentsPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === paymentsCurrentPage}
                            onClick={() => setPaymentsCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => paymentsCurrentPage < totalPaymentsPages && setPaymentsCurrentPage((prev) => Math.min(prev + 1, totalPaymentsPages))}
                          aria-disabled={paymentsCurrentPage === totalPaymentsPages}
                          className={paymentsCurrentPage === totalPaymentsPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Registered Addresses</CardTitle>
                <CardDescription>Manage registered addresses and bin IDs in {stateInfo.name} State</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by bin ID, address, LGA, or customer reference..."
                          className="pl-10"
                          value={addressesSearchQuery}
                          onChange={(e) => setAddressesSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-48">
                      <Select value={addressesStatusFilter} onValueChange={setAddressesStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => setIsAddAddressOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Address
                    </Button>
                  </div>

                  {/* Addresses Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px]">Bin ID</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>LGA</TableHead>
                          <TableHead>Customer Reference</TableHead>
                          <TableHead>Linked User</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingAddresses ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              <div className="flex justify-center items-center">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                Loading addresses...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : currentAddresses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                              No registered addresses found
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentAddresses.map((address) => (
                          <TableRow key={address._id}>
                            <TableCell className="font-medium font-mono">
                              {address.binId || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[250px] truncate">
                                {address.address || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {address.lgaName || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {address.customerRef || '-'}
                            </TableCell>
                            <TableCell>
                              {address.userId ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {`${address.userId.firstName || ''} ${address.userId.lastName || ''}`.trim()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {address.userId.email}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline">Not Linked</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {address.createdAt 
                                ? new Date(address.createdAt).toLocaleDateString() 
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={address.isActive ? "default" : "secondary"}>
                                {address.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedAddress(address)
                                    setShowAddressDetails(true)
                                  }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedAddress(address)
                                    setEditedAddress({
                                      address: address.address || '',
                                      lgaName: address.lgaName || '',
                                      customerRef: address.customerRef || ''
                                    })
                                    setIsEditingAddress(true)
                                    setShowAddressDetails(true)
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Address
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={async () => {
                                    if (confirm(`Are you sure you want to ${address.isActive ? 'deactivate' : 'activate'} this address?`)) {
                                      try {
                                        // Add API call to toggle address status
                                        toast({
                                          title: address.isActive ? "Address Deactivated" : "Address Activated",
                                          description: `${address.binId} has been ${address.isActive ? 'deactivated' : 'activated'} successfully.`,
                                        })
                                        await loadAddresses()
                                      } catch (error) {
                                        toast({
                                          title: "Error",
                                          description: "Failed to update address status",
                                          variant: "destructive"
                                        })
                                      }
                                    }
                                  }}>
                                    {address.isActive ? (
                                      <>
                                        <Clock className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => addressesCurrentPage > 1 && setAddressesCurrentPage((prev) => Math.max(prev - 1, 1))}
                          aria-disabled={addressesCurrentPage === 1}
                          className={addressesCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalAddressesPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === addressesCurrentPage}
                            onClick={() => setAddressesCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => addressesCurrentPage < totalAddressesPages && setAddressesCurrentPage((prev) => Math.min(prev + 1, totalAddressesPages))}
                          aria-disabled={addressesCurrentPage === totalAddressesPages}
                          className={addressesCurrentPage === totalAddressesPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </CardContent>
            </Card>

            {/* Address Details Dialog */}
            <Dialog open={showAddressDetails} onOpenChange={(open) => {
              setShowAddressDetails(open)
              if (!open) {
                setIsEditingAddress(false)
              }
            }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isEditingAddress ? 'Edit Address' : 'Address Details'}
                  </DialogTitle>
                </DialogHeader>
                {selectedAddress && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bin ID</Label>
                        <p className="text-sm font-mono font-semibold">{selectedAddress.binId || 'N/A'}</p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Badge variant={selectedAddress.isActive ? "default" : "secondary"}>
                          {selectedAddress.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Address</Label>
                      {isEditingAddress ? (
                        <Textarea 
                          value={editedAddress.address}
                          onChange={(e) => setEditedAddress({...editedAddress, address: e.target.value})}
                          className="mt-1"
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm mt-1">{selectedAddress.address || 'N/A'}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>LGA</Label>
                        {isEditingAddress ? (
                          <Input 
                            value={editedAddress.lgaName}
                            onChange={(e) => setEditedAddress({...editedAddress, lgaName: e.target.value})}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm mt-1">{selectedAddress.lgaName || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <Label>Customer Reference</Label>
                        {isEditingAddress ? (
                          <Input 
                            value={editedAddress.customerRef}
                            onChange={(e) => setEditedAddress({...editedAddress, customerRef: e.target.value})}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm mt-1">{selectedAddress.customerRef || '-'}</p>
                        )}
                      </div>
                    </div>
                    {selectedAddress.userId && (
                      <div>
                        <Label>Linked User</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium">
                            {`${selectedAddress.userId.firstName || ''} ${selectedAddress.userId.lastName || ''}`.trim()}
                          </p>
                          <p className="text-xs text-gray-500">{selectedAddress.userId.email}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Created Date</Label>
                        <p className="text-sm mt-1">
                          {selectedAddress.createdAt 
                            ? new Date(selectedAddress.createdAt).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label>Last Updated</Label>
                        <p className="text-sm mt-1">
                          {selectedAddress.updatedAt 
                            ? new Date(selectedAddress.updatedAt).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowAddressDetails(false)
                    setIsEditingAddress(false)
                  }}>
                    {isEditingAddress ? 'Cancel' : 'Close'}
                  </Button>
                  {isEditingAddress && (
                    <Button onClick={async () => {
                      try {
                        await adminApi.updateAddress(selectedAddress._id, editedAddress)
                        toast({
                          title: "Address Updated",
                          description: "Address information has been updated successfully.",
                        })
                        setShowAddressDetails(false)
                        setIsEditingAddress(false)
                        await loadAddresses()
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to update address",
                          variant: "destructive"
                        })
                      }
                    }}>
                      Save Changes
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Available Reports */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Available Reports</CardTitle>
                    <CardDescription>Generate and download reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Label>Filter by type:</Label>
                        <Select value={reportsTypeFilter} onValueChange={setReportsTypeFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="financial">Financial</SelectItem>
                            <SelectItem value="analytics">Analytics</SelectItem>
                            <SelectItem value="operational">Operational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        {filteredReports.map((report) => (
                          <div
                            key={report.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedReport === report.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                            }`}
                            onClick={() => setSelectedReport(report.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{report.name}</p>
                                <p className="text-sm text-gray-600">{report.period}</p>
                              </div>
                              <Badge variant="outline" className="uppercase">
                                {report.format}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <Button className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Generate New Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Report Preview */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Report Preview</CardTitle>
                    <CardDescription>
                      {selectedReport
                        ? `Viewing ${reportsData.find((r) => r.id === selectedReport)?.name}`
                        : "Select a report to preview"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedReport ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {reportsData.find((r) => r.id === selectedReport)?.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {reportsData.find((r) => r.id === selectedReport)?.period}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Printer className="w-4 h-4 mr-2" />
                              Print
                            </Button>
                            <Button size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          {/* Sample report content based on type */}
                          {(() => {
                            const report = reportsData.find((r) => r.id === selectedReport)
                            switch (report?.type) {
                              case "financial":
                                return (
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-medium">Financial Summary</h4>
                                      <p className="text-sm text-gray-600">
                                        Generated: {formatDate(report.generatedDate)}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <Card>
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">Total Revenue</p>
                                            <p className="text-lg font-bold">₦4,560,000</p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">Collection Rate</p>
                                            <p className="text-lg font-bold">87%</p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <BarChart4 className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-600">Monthly revenue breakdown chart</p>
                                  </div>
                                )
                              case "analytics":
                                return (
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-medium">Analytics Report</h4>
                                      <p className="text-sm text-gray-600">
                                        Generated: {formatDate(report.generatedDate)}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <PieChart className="h-12 w-12 text-gray-400" />
                                      </div>
                                      <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <LineChart className="h-12 w-12 text-gray-400" />
                                      </div>
                                    </div>
                                    <div className="rounded-md border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Payment Method</TableHead>
                                            <TableHead>Transactions</TableHead>
                                            <TableHead>Percentage</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell>Card</TableCell>
                                            <TableCell>1,245</TableCell>
                                            <TableCell>45%</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>Bank Transfer</TableCell>
                                            <TableCell>876</TableCell>
                                            <TableCell>32%</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>USSD</TableCell>
                                            <TableCell>543</TableCell>
                                            <TableCell>20%</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>Mobile Money</TableCell>
                                            <TableCell>87</TableCell>
                                            <TableCell>3%</TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                )
                              case "operational":
                                return (
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-medium">Operational Report</h4>
                                      <p className="text-sm text-gray-600">
                                        Generated: {formatDate(report.generatedDate)}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                      <Card>
                                        <CardContent className="p-4">
                                          <div className="flex flex-col items-center">
                                            <p className="text-sm text-gray-600">Total Bills</p>
                                            <p className="text-2xl font-bold">8,934</p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="p-4">
                                          <div className="flex flex-col items-center">
                                            <p className="text-sm text-gray-600">Overdue</p>
                                            <p className="text-2xl font-bold text-red-600">234</p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="p-4">
                                          <div className="flex flex-col items-center">
                                            <p className="text-sm text-gray-600">Paid</p>
                                            <p className="text-2xl font-bold text-green-600">7,823</p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <BarChart4 className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <div className="rounded-md border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Zone</TableHead>
                                            <TableHead>Collection Rate</TableHead>
                                            <TableHead>Efficiency</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell>Enugu North</TableCell>
                                            <TableCell>92%</TableCell>
                                            <TableCell>High</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>Enugu South</TableCell>
                                            <TableCell>87%</TableCell>
                                            <TableCell>High</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>Enugu East</TableCell>
                                            <TableCell>78%</TableCell>
                                            <TableCell>Medium</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>Nsukka</TableCell>
                                            <TableCell>65%</TableCell>
                                            <TableCell>Medium</TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                )
                              default:
                                return (
                                  <div className="flex items-center justify-center h-64">
                                    <p className="text-gray-500">Select a report type to view details</p>
                                  </div>
                                )
                            }
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <FileText className="h-16 w-16 text-gray-300" />
                        <p className="text-gray-500">Select a report from the list to view details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Monthly Billing Amount
                  </CardTitle>
                  <CardDescription>
                    Set the monthly bill amount for waste collection in {stateInfo.name} State
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 mb-1">Current Monthly Rate</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ₦{stats.averageBill?.toLocaleString() || '1,500'}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">Per bin, per month</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newBillAmount">New Monthly Amount (₦)</Label>
                    <Input
                      id="newBillAmount"
                      type="number"
                      placeholder="Enter new amount"
                      min="0"
                      step="100"
                    />
                    <p className="text-xs text-gray-500">
                      This will apply to all new bills generated after the update. Existing unpaid bills remain unchanged.
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={async () => {
                      const input = document.getElementById('newBillAmount') as HTMLInputElement
                      const newAmount = parseFloat(input.value)
                      
                      if (!newAmount || newAmount < 0) {
                        alert('Please enter a valid amount')
                        return
                      }

                      try {
                        await adminApi.updateMonthlyBillAmount(newAmount)
                        alert(`Monthly bill amount updated to ₦${newAmount.toLocaleString()}`)
                        // Reload stats
                        if (currentUser?.stateCode) {
                          const statsResponse = await adminApi.getStateStats(currentUser.stateCode)
                          setStateStats(statsResponse)
                        }
                        input.value = ''
                      } catch (error) {
                        console.error('Failed to update bill amount:', error)
                        alert('Failed to update bill amount. Please try again.')
                      }
                    }}
                  >
                    Update Monthly Amount
                  </Button>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Impact</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Users will see the new amount on their dashboard</li>
                      <li>• New bills will be generated with the updated amount</li>
                      <li>• Existing unpaid bills keep their original amount</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    State Configuration
                  </CardTitle>
                  <CardDescription>
                    Manage your state's waste management settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">State Name</p>
                      <p className="text-gray-600">{stateInfo.name}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">State Code</p>
                      <p className="text-gray-600">{stateInfo.code}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">Bill Cycle</p>
                      <p className="text-gray-600">Monthly</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">Authority</p>
                      <p className="text-gray-600">{stateInfo.authority}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Address Dialog */}
      <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register New Address</DialogTitle>
            <DialogDescription>
              Add a new address to your state. A unique Bin ID will be automatically generated.
            </DialogDescription>
          </DialogHeader>
          
          {registeredBinId ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Address Registered Successfully!</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-green-800">
                    The address has been registered with the following Bin ID:
                  </p>
                  <p className="text-2xl font-bold text-green-900 font-mono tracking-wider">
                    {registeredBinId}
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    Share this Bin ID with the customer so they can link it to their account.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setRegisteredBinId(null)
                    setIsAddAddressOpen(false)
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">LGA Name *</label>
                <Select
                  value={newAddress.lgaName}
                  onValueChange={(value) => setNewAddress({ ...newAddress, lgaName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser?.stateCode && NIGERIAN_STATES[currentUser.stateCode.toLowerCase()] ? (
                      NIGERIAN_STATES[currentUser.stateCode.toLowerCase()].lgas.map((lga) => (
                        <SelectItem key={lga} value={lga}>
                          {lga}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No LGAs available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address *</label>
                <Textarea
                  placeholder="Enter full address (e.g., 15 Broad Street, Marina)"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Reference (Optional)</label>
                <Input
                  placeholder="e.g., Customer name or account number"
                  value={newAddress.customerRef}
                  onChange={(e) => setNewAddress({ ...newAddress, customerRef: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewAddress({ lgaName: "", address: "", customerRef: "" })
                    setIsAddAddressOpen(false)
                  }}
                  disabled={isRegisteringAddress}
                >
                  Cancel
                </Button>
                <Button onClick={handleRegisterAddress} disabled={isRegisteringAddress}>
                  {isRegisteringAddress ? "Registering..." : "Register Address"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  )
}
