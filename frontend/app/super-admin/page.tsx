"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Shield,
  Users,
  MapPin,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Settings,
  UserPlus,
  Lock,
  Unlock,
  Phone,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  Download,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { NIGERIAN_STATES } from "@/lib/states-data"
import { type StateAdmin, type User, DEFAULT_STATE_ADMIN_PERMISSIONS } from "@/lib/auth-types"
import { superAdminApi, authApi, ApiError } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface StateRevenue {
  stateCode: string
  stateName: string
  monthlyRevenue: number
  totalRevenue?: number
  totalBills: number
  paidBills: number
  pendingBills: number
  overdueBills: number
  collectionRate: number
  totalUsers: number
  activeUsers: number
  lastUpdated: string
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState("all")
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false)
  const [isViewAdminOpen, setIsViewAdminOpen] = useState(false)
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false)
  const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<StateAdmin | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [revenueFilter, setRevenueFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [platformStats, setPlatformStats] = useState<any>(null)
  const [stateRevenueData, setStateRevenueData] = useState<StateRevenue[]>([])
  const [stateAdmins, setStateAdmins] = useState<StateAdmin[]>([])

  // Check authentication and load data on mount
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // Check if user is authenticated and is SUPER_ADMIN
        const currentUser = await authApi.getCurrentUser()
        
        if (currentUser.user.role !== "SUPER_ADMIN") {
          router.push("/super-admin/login")
          return
        }

        // Load platform stats, state admins, and state revenues
        const [statsRes, adminsRes, revenuesRes] = await Promise.all([
          superAdminApi.getStats(),
          superAdminApi.getAllStateAdmins(),
          superAdminApi.getStateRevenues(),
        ])

        setPlatformStats(statsRes.stats)
        setStateRevenueData(revenuesRes.stateRevenues || [])
        
        // Transform backend data to match frontend interface
        const transformedAdmins: StateAdmin[] = adminsRes.stateAdmins.map((admin: any) => ({
          id: admin._id || admin.id,
          userId: admin._id || admin.id,
          stateCode: admin.stateCode || "",
          authorityName: admin.managedState?.authorityName || "",
          permissions: admin.permissions || DEFAULT_STATE_ADMIN_PERMISSIONS,
          isActive: admin.isActive,
          createdBy: "super_admin",
          createdAt: admin.createdAt,
          lastLogin: admin.lastLogin,
        }))
        
        setStateAdmins(transformedAdmins)
        
        // Transform users list
        const transformedUsers: User[] = adminsRes.stateAdmins.map((admin: any) => ({
          id: admin._id || admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          phone: admin.phone,
          role: "STATE_ADMIN" as any,
          stateCode: admin.stateCode,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
          lastLogin: admin.lastLogin,
          permissions: [],
        }))
        
        setUsers(transformedUsers)
      } catch (err) {
        console.error("Auth/Data load error:", err)
        if (err instanceof ApiError && err.status === 401) {
          router.push("/super-admin/login")
        } else {
          setError("Failed to load dashboard data")
        }
      } finally {
        setIsInitialLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [])

  const [users, setUsers] = useState<User[]>([])

  const [newAdmin, setNewAdmin] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    stateCode: "",
    password: "",
    confirmPassword: "",
    permissions: DEFAULT_STATE_ADMIN_PERMISSIONS,
  })

  const activeStates = Object.values(NIGERIAN_STATES).filter((state) => state.isActive)
  const statesWithAdmins = stateAdmins.map((admin) => admin.stateCode)
  const statesWithoutAdmins = activeStates.filter(
    (state) =>
      !statesWithAdmins.includes(Object.keys(NIGERIAN_STATES).find((key) => NIGERIAN_STATES[key] === state) || ""),
  )

  const filteredAdmins = stateAdmins.filter((admin) => {
    const user = users.find((u) => u.id === admin.userId)
    const state = Object.values(NIGERIAN_STATES).find(
      (s) => Object.keys(NIGERIAN_STATES).find((key) => NIGERIAN_STATES[key] === s) === admin.stateCode,
    )

    if (!user || !state) return false

    const matchesSearch =
      searchQuery === "" ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.authorityName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesState = selectedState === "all" || admin.stateCode === selectedState

    return matchesSearch && matchesState
  })

  const handleCreateAdmin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate passwords match
      if (newAdmin.password !== newAdmin.confirmPassword) {
        setError("Passwords do not match")
        setIsLoading(false)
        return
      }

      // Create state admin via API
      const response = await superAdminApi.createStateAdmin({
        email: newAdmin.email,
        phone: newAdmin.phone,
        password: newAdmin.password,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        stateCode: newAdmin.stateCode,
        permissions: newAdmin.permissions,
      })

      // Add new admin to local state
      const newUser: User = {
        id: response.stateAdmin.id,
        email: response.stateAdmin.email,
        firstName: response.stateAdmin.firstName,
        lastName: response.stateAdmin.lastName,
        phone: response.stateAdmin.phone,
        role: "STATE_ADMIN" as any,
        stateCode: response.stateAdmin.stateCode,
        isActive: true,
        createdAt: response.stateAdmin.createdAt,
        permissions: [],
      }

      const newStateAdmin: StateAdmin = {
        id: response.stateAdmin.id,
        userId: response.stateAdmin.id,
        stateCode: response.stateAdmin.stateCode,
        authorityName: NIGERIAN_STATES[response.stateAdmin.stateCode]?.wasteAuthority.name || "",
        permissions: response.stateAdmin.permissions || newAdmin.permissions,
        isActive: true,
        createdBy: "super_admin",
        createdAt: response.stateAdmin.createdAt,
      }

      setUsers([...users, newUser])
      setStateAdmins([...stateAdmins, newStateAdmin])

      // Reset form
      setNewAdmin({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        stateCode: "",
        password: "",
        confirmPassword: "",
        permissions: DEFAULT_STATE_ADMIN_PERMISSIONS,
      })

      setIsCreateAdminOpen(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to create state admin")
      }
      console.error("Create admin error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAdminStatus = async (adminId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await superAdminApi.toggleStateAdminStatus(adminId)

      // Update local state
      setStateAdmins(stateAdmins.map((admin) => (admin.id === adminId ? { ...admin, isActive: !admin.isActive } : admin)))

      setUsers(
        users.map((user) => {
          const admin = stateAdmins.find((a) => a.id === adminId)
          return admin && user.id === admin.userId ? { ...user, isActive: !user.isActive } : user
        }),
      )
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to toggle admin status")
      }
      console.error("Toggle status error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewAdmin = (admin: StateAdmin) => {
    setSelectedAdmin(admin)
    setIsViewAdminOpen(true)
  }

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return
    
    setIsLoading(true)
    setError(null)

    try {
      const user = users.find((u) => u.id === selectedAdmin.userId)
      if (!user) {
        throw new Error("User not found")
      }

      const response = await superAdminApi.updateStateAdmin(selectedAdmin.id, {
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
      })

      // Update local state
      setUsers(users.map((u) => (u.id === selectedAdmin.userId ? {
        ...u,
        email: response.stateAdmin.email,
        phone: response.stateAdmin.phone,
        firstName: response.stateAdmin.firstName,
        lastName: response.stateAdmin.lastName,
      } : u)))

      setIsEditAdminOpen(false)
      setSelectedAdmin(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to update admin")
      }
      console.error("Update admin error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return
    
    setIsLoading(true)
    setError(null)

    try {
      await superAdminApi.deleteStateAdmin(selectedAdmin.id)

      // Remove from local state
      setStateAdmins(stateAdmins.filter((admin) => admin.id !== selectedAdmin.id))
      setUsers(users.filter((user) => user.id !== selectedAdmin.userId))

      setIsDeleteAdminOpen(false)
      setSelectedAdmin(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to delete admin")
      }
      console.error("Delete admin error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalRevenue = () => {
    // Use platformStats if available, otherwise calculate from stateRevenueData
    if (platformStats?.monthlyRevenue !== undefined) {
      return platformStats.monthlyRevenue
    }
    return stateRevenueData.reduce((sum, state) => sum + state.monthlyRevenue, 0)
  }

  const calculateTotalBills = () => {
    // Use platformStats if available, otherwise calculate from stateRevenueData
    if (platformStats?.totalBills !== undefined) {
      return platformStats.totalBills
    }
    return stateRevenueData.reduce((sum, state) => sum + state.totalBills, 0)
  }

  const calculateTotalPaidBills = () => {
    // Use platformStats if available, otherwise calculate from stateRevenueData
    if (platformStats?.paidBills !== undefined) {
      return platformStats.paidBills
    }
    return stateRevenueData.reduce((sum, state) => sum + state.paidBills, 0)
  }

  const calculateAverageCollectionRate = () => {
    // Calculate from platformStats if available
    if (platformStats?.totalBills > 0 && platformStats?.paidBills !== undefined) {
      return Math.round((platformStats.paidBills / platformStats.totalBills) * 100)
    }
    // Otherwise calculate from stateRevenueData
    if (stateRevenueData.length === 0) return 0
    const total = stateRevenueData.reduce((sum, state) => sum + state.collectionRate, 0)
    return Math.round(total / stateRevenueData.length)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStateData = (stateCode: string) => {
    return Object.values(NIGERIAN_STATES).find(
      (state) => Object.keys(NIGERIAN_STATES).find((key) => NIGERIAN_STATES[key] === state) === stateCode,
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading State */}
      {isInitialLoading && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading super admin dashboard...</p>
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
                  <Shield className="w-5 h-5 mr-2 text-red-600" />
                  Super Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">Manage state administrators across Nigeria</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="destructive" className="flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Super Admin
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="admins">State Admins</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="states">States Coverage</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {/* Platform Statistics */}
            {platformStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₦{(platformStats.totalRevenue / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-gray-500">
                          ₦{(platformStats.monthlyRevenue / 1000000).toFixed(1)}M this month
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {platformStats.totalUsers.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Platform-wide</p>
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
                        <p className="text-sm font-medium text-gray-600">Total Bills</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {platformStats.totalBills.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {platformStats.paidBills.toLocaleString()} paid
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active States</p>
                        <p className="text-2xl font-bold text-gray-900">{platformStats.activeStates}</p>
                        <p className="text-xs text-gray-500">of {platformStats.totalStates} total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Admin Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Admins</p>
                      <p className="text-2xl font-bold text-gray-900">{stateAdmins.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Admins</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stateAdmins.filter((admin) => admin.isActive).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">States Covered</p>
                      <p className="text-2xl font-bold text-gray-900">{statesWithAdmins.length}</p>
                      <p className="text-xs text-gray-500">of {activeStates.length} active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending States</p>
                      <p className="text-2xl font-bold text-gray-900">{statesWithoutAdmins.length}</p>
                      <p className="text-xs text-gray-500">need admins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stateAdmins.slice(0, 5).map((admin) => {
                    const user = users.find((u) => u.id === admin.userId)
                    const state = getStateData(admin.stateCode)
                    return (
                      <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${admin.isActive ? "bg-green-500" : "bg-red-500"}`} />
                          <div>
                            <p className="font-medium">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {state?.name} - {admin.authorityName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="text-sm font-medium">{formatDate(admin.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* State Admins Tab */}
          <TabsContent value="admins" className="mt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search admins by name, email, or state..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {Object.entries(NIGERIAN_STATES).map(([key, state]) => (
                    <SelectItem key={key} value={key}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create State Administrator</DialogTitle>
                    <DialogDescription>
                      Create a new administrator account for a state waste management authority.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newAdmin.firstName}
                        onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newAdmin.lastName}
                        onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        placeholder="admin@authority.gov.ng"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={newAdmin.phone}
                        onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                        placeholder="+234 800 123 4567"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="state">State</Label>
                      <Select
                        value={newAdmin.stateCode}
                        onValueChange={(value) => setNewAdmin({ ...newAdmin, stateCode: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(NIGERIAN_STATES)
                            .filter(([key, state]) => state.isActive && !statesWithAdmins.includes(key))
                            .map(([key, state]) => (
                              <SelectItem key={key} value={key}>
                                {state.name} - {state.wasteAuthority.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={newAdmin.confirmPassword}
                        onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-1 gap-3 mt-2 max-h-48 overflow-y-auto">
                      {newAdmin.permissions.map((permission, index) => (
                        <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{permission.name}</p>
                            <p className="text-sm text-gray-600">{permission.description}</p>
                          </div>
                          <div className="flex space-x-2">
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={permission.canView}
                                onCheckedChange={(checked) => {
                                  const updatedPermissions = [...newAdmin.permissions]
                                  updatedPermissions[index].canView = checked
                                  setNewAdmin({ ...newAdmin, permissions: updatedPermissions })
                                }}
                              />
                              <span className="text-xs">View</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={permission.canCreate}
                                onCheckedChange={(checked) => {
                                  const updatedPermissions = [...newAdmin.permissions]
                                  updatedPermissions[index].canCreate = checked
                                  setNewAdmin({ ...newAdmin, permissions: updatedPermissions })
                                }}
                              />
                              <span className="text-xs">Create</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={permission.canUpdate}
                                onCheckedChange={(checked) => {
                                  const updatedPermissions = [...newAdmin.permissions]
                                  updatedPermissions[index].canUpdate = checked
                                  setNewAdmin({ ...newAdmin, permissions: updatedPermissions })
                                }}
                              />
                              <span className="text-xs">Update</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateAdminOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAdmin} disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create Admin"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* View Admin Dialog */}
              <Dialog open={isViewAdminOpen} onOpenChange={setIsViewAdminOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Administrator Details</DialogTitle>
                    <DialogDescription>View state administrator information</DialogDescription>
                  </DialogHeader>
                  {selectedAdmin && (() => {
                    const user = users.find((u) => u.id === selectedAdmin.userId)
                    const state = getStateData(selectedAdmin.stateCode)
                    return (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-600">Full Name</Label>
                            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Email</Label>
                            <p className="font-medium">{user?.email}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Phone</Label>
                            <p className="font-medium">{user?.phone}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Status</Label>
                            <div>
                              <Badge variant={selectedAdmin.isActive ? "default" : "secondary"}>
                                {selectedAdmin.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-gray-600">State</Label>
                            <p className="font-medium">{state?.name}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Authority</Label>
                            <p className="font-medium">{selectedAdmin.authorityName}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Created</Label>
                            <p className="font-medium">{formatDate(selectedAdmin.createdAt)}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Last Login</Label>
                            <p className="font-medium">
                              {selectedAdmin.lastLogin ? formatDate(selectedAdmin.lastLogin) : "Never"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsViewAdminOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Admin Dialog */}
              <Dialog open={isEditAdminOpen} onOpenChange={setIsEditAdminOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Administrator</DialogTitle>
                    <DialogDescription>Update state administrator information</DialogDescription>
                  </DialogHeader>
                  {selectedAdmin && (() => {
                    const user = users.find((u) => u.id === selectedAdmin.userId)
                    if (!user) return null
                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-firstName">First Name</Label>
                          <Input
                            id="edit-firstName"
                            value={user.firstName}
                            onChange={(e) => {
                              setUsers(users.map((u) => 
                                u.id === selectedAdmin.userId 
                                  ? { ...u, firstName: e.target.value }
                                  : u
                              ))
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-lastName">Last Name</Label>
                          <Input
                            id="edit-lastName"
                            value={user.lastName}
                            onChange={(e) => {
                              setUsers(users.map((u) => 
                                u.id === selectedAdmin.userId 
                                  ? { ...u, lastName: e.target.value }
                                  : u
                              ))
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-email">Email</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={user.email}
                            onChange={(e) => {
                              setUsers(users.map((u) => 
                                u.id === selectedAdmin.userId 
                                  ? { ...u, email: e.target.value }
                                  : u
                              ))
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-phone">Phone</Label>
                          <Input
                            id="edit-phone"
                            value={user.phone}
                            onChange={(e) => {
                              setUsers(users.map((u) => 
                                u.id === selectedAdmin.userId 
                                  ? { ...u, phone: e.target.value }
                                  : u
                              ))
                            }}
                          />
                        </div>
                      </div>
                    )
                  })()}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsEditAdminOpen(false)
                      setSelectedAdmin(null)
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditAdmin} disabled={isLoading}>
                      {isLoading ? "Updating..." : "Update Admin"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Admin Confirmation Dialog */}
              <Dialog open={isDeleteAdminOpen} onOpenChange={setIsDeleteAdminOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Administrator</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this administrator? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedAdmin && (() => {
                    const user = users.find((u) => u.id === selectedAdmin.userId)
                    const state = getStateData(selectedAdmin.stateCode)
                    return (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                        <p className="text-sm text-gray-600">{state?.name} - {selectedAdmin.authorityName}</p>
                      </div>
                    )
                  })()}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsDeleteAdminOpen(false)
                      setSelectedAdmin(null)
                    }}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAdmin} disabled={isLoading}>
                      {isLoading ? "Deleting..." : "Delete Admin"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>State Administrators</CardTitle>
                <CardDescription>
                  Manage administrator accounts for all state waste management authorities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Administrator</TableHead>
                      <TableHead>State & Authority</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.map((admin) => {
                      const user = users.find((u) => u.id === admin.userId)
                      const state = getStateData(admin.stateCode)
                      return (
                        <TableRow key={admin.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {user?.firstName} {user?.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{user?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{state?.name}</p>
                              <p className="text-sm text-gray-600">{admin.authorityName}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{user?.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={admin.isActive ? "default" : "secondary"}>
                              {admin.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{admin.lastLogin ? formatDate(admin.lastLogin) : "Never"}</div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewAdmin(admin)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedAdmin(admin)
                                  setIsEditAdminOpen(true)
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Admin
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleAdminStatus(admin.id)}>
                                  {admin.isActive ? (
                                    <>
                                      <Lock className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedAdmin(admin)
                                    setIsDeleteAdminOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Admin
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="mt-6">
            {/* Revenue Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₦{(calculateTotalRevenue() / 1000000).toFixed(1)}M
                      </p>
                      {platformStats?.revenueGrowth !== undefined && (
                        <p className={`text-xs flex items-center mt-1 ${
                          platformStats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {platformStats.revenueGrowth >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {platformStats.revenueGrowth >= 0 ? '+' : ''}{platformStats.revenueGrowth}% from last month
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{calculateAverageCollectionRate()}%</p>
                      <p className="text-xs text-gray-500 mt-1">Average across all states</p>
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
                      <p className="text-sm font-medium text-gray-600">Total Bills</p>
                      <p className="text-2xl font-bold text-gray-900">{calculateTotalBills().toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">{calculateTotalPaidBills().toLocaleString()} paid</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active States</p>
                      <p className="text-2xl font-bold text-gray-900">{stateRevenueData.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Generating revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by State Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Revenue by State
                    </CardTitle>
                    <CardDescription>Detailed financial breakdown for each state</CardDescription>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Select value={revenueFilter} onValueChange={setRevenueFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by performance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        <SelectItem value="high">High Performance (&gt;85%)</SelectItem>
                        <SelectItem value="medium">Medium Performance (70-85%)</SelectItem>
                        <SelectItem value="low">Low Performance (&lt;70%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State</TableHead>
                      <TableHead>Monthly Revenue</TableHead>
                      <TableHead>Total Bills</TableHead>
                      <TableHead>Paid Bills</TableHead>
                      <TableHead>Collection Rate</TableHead>
                      <TableHead>Total Users</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stateRevenueData
                      .filter((state) => {
                        if (revenueFilter === "high") return state.collectionRate > 85
                        if (revenueFilter === "medium") return state.collectionRate >= 70 && state.collectionRate <= 85
                        if (revenueFilter === "low") return state.collectionRate < 70
                        return true
                      })
                      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
                      .map((state) => (
                        <TableRow key={state.stateCode}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{state.stateName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-green-600">{formatCurrency(state.monthlyRevenue)}</p>
                              <p className="text-xs text-gray-500">₦{(state.monthlyRevenue / 1000000).toFixed(1)}M</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{state.totalBills.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">
                                {state.pendingBills} pending, {state.overdueBills} overdue
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-blue-600">{state.paidBills.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">
                                {Math.round((state.paidBills / state.totalBills) * 100)}% of total
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  state.collectionRate > 85
                                    ? "default"
                                    : state.collectionRate >= 70
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {state.collectionRate}%
                              </Badge>
                              {state.collectionRate > 85 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : state.collectionRate < 70 ? (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{state.totalUsers.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{state.activeUsers.toLocaleString()} active</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{formatDate(state.lastUpdated)}</p>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
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
                                  Download Report
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <BarChart3 className="mr-2 h-4 w-4" />
                                  View Analytics
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Revenue Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Revenue Distribution
                  </CardTitle>
                  <CardDescription>Revenue contribution by state</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stateRevenueData
                      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
                      .map((state) => {
                        const percentage = (state.monthlyRevenue / calculateTotalRevenue()) * 100
                        return (
                          <div key={state.stateCode}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{state.stateName}</span>
                              <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Collection Performance
                  </CardTitle>
                  <CardDescription>Collection rates across states</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stateRevenueData
                      .sort((a, b) => b.collectionRate - a.collectionRate)
                      .map((state) => (
                        <div key={state.stateCode}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{state.stateName}</span>
                            <span className="text-sm font-semibold">{state.collectionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                state.collectionRate > 85
                                  ? "bg-green-600"
                                  : state.collectionRate >= 70
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                              }`}
                              style={{ width: `${state.collectionRate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* States Coverage Tab */}
          <TabsContent value="states" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    States with Admins ({statesWithAdmins.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stateAdmins.map((admin) => {
                      const state = getStateData(admin.stateCode)
                      const user = users.find((u) => u.id === admin.userId)
                      return (
                        <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{state?.name}</p>
                            <p className="text-sm text-gray-600">{admin.authorityName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <Badge variant={admin.isActive ? "default" : "secondary"} className="text-xs">
                              {admin.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-600">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    States Needing Admins ({statesWithoutAdmins.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statesWithoutAdmins.map((state) => {
                      const stateKey = Object.keys(NIGERIAN_STATES).find((key) => NIGERIAN_STATES[key] === state)
                      return (
                        <div
                          key={stateKey}
                          className="flex items-center justify-between p-3 border rounded-lg border-orange-200"
                        >
                          <div>
                            <p className="font-medium">{state.name}</p>
                            <p className="text-sm text-gray-600">{state.wasteAuthority.name}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setNewAdmin({ ...newAdmin, stateCode: stateKey || "" })
                              setIsCreateAdminOpen(true)
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Admin
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Activity Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Active Admins</span>
                      <span className="font-bold text-green-600">
                        {stateAdmins.filter((admin) => admin.isActive).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Inactive Admins</span>
                      <span className="font-bold text-red-600">
                        {stateAdmins.filter((admin) => !admin.isActive).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>States Coverage</span>
                      <span className="font-bold text-blue-600">
                        {Math.round((statesWithAdmins.length / activeStates.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Logins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stateAdmins
                      .filter((admin) => admin.lastLogin)
                      .sort((a, b) => new Date(b.lastLogin!).getTime() - new Date(a.lastLogin!).getTime())
                      .slice(0, 5)
                      .map((admin) => {
                        const user = users.find((u) => u.id === admin.userId)
                        const state = getStateData(admin.stateCode)
                        return (
                          <div key={admin.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {user?.firstName} {user?.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{state?.name}</p>
                            </div>
                            <p className="text-sm text-gray-500">{formatDate(admin.lastLogin!)}</p>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </>
      )}
    </div>
  )
}
