"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  CreditCard,
  History,
  Bell,
  User,
  Calendar,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  LogOut,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { authApi, billsApi, paymentsApi } from "@/lib/api"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pay-bill")
  const [billLookup, setBillLookup] = useState({
    state: "",
    binId: "",
    customerRef: "",
  })

  // Add bill details state for when a bill is found
  const [foundBill, setFoundBill] = useState<{
    id: string
    binId: string
    address: string
    amount: number
    dueDate: string
    status: string
    zone: string
  } | null>(null)

  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [upcomingBills, setUpcomingBills] = useState<any[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [isLoadingBills, setIsLoadingBills] = useState(false)
  const [error, setError] = useState("")

  // Dashboard stats
  const [stats, setStats] = useState({
    totalPaid: 0,
    activeBins: 0,
    dueSoon: 0,
    thisMonth: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Address search states
  const [showAddressSearch, setShowAddressSearch] = useState(false)
  const [addressSearch, setAddressSearch] = useState({
    address: "",
    stateCode: "",
    lgaName: "",
  })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [userBins, setUserBins] = useState<any[]>([])
  const [isLoadingBins, setIsLoadingBins] = useState(false)

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // State billing information
  const [stateBillingInfo, setStateBillingInfo] = useState<{
    monthlyBillAmount: number;
    stateCode: string;
    stateName: string;
    billCycle: string;
  } | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a token first
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        if (!token) {
          router.push("/login")
          return
        }

        const currentUser = await authApi.getCurrentUser()
        if (currentUser.role !== "USER") {
          router.push("/login")
          return
        }
        setUser(currentUser)
        
        // Load user's data
        await loadStats()
        await loadPaymentHistory()
        await loadUpcomingBills()
        await loadUserBins()
        await loadNotifications()
      } catch (err: any) {
        console.error("Authentication error:", err)
        // Clear invalid tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
        }
        router.push("/login")
      } finally {
        setIsInitialLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const loadPaymentHistory = async () => {
    try {
      setIsLoadingPayments(true)
      const payments = await paymentsApi.getAll()
      setRecentPayments(payments.slice(0, 5)) // Show recent 5
    } catch (err: any) {
      console.error("Failed to load payments:", err)
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const loadUpcomingBills = async () => {
    try {
      setIsLoadingBills(true)
      const bills = await billsApi.getAll()
      const pending = bills.filter((b: any) => b.status === "pending")
      setUpcomingBills(pending.slice(0, 3)) // Show next 3 bills
    } catch (err: any) {
      console.error("Failed to load bills:", err)
    } finally {
      setIsLoadingBills(false)
    }
  }

  const loadUserBins = async () => {
    try {
      setIsLoadingBins(true)
      const response = await billsApi.getUserBins()
      setUserBins(response.bins || [])
      
      // Load state billing info from the first bin's state
      if (response.bins && response.bins.length > 0) {
        const stateCode = response.bins[0].stateCode
        try {
          const billingInfo = await billsApi.getStateBilling(stateCode)
          setStateBillingInfo(billingInfo)
        } catch (err) {
          console.error("Failed to load state billing info:", err)
        }
      }
    } catch (err: any) {
      console.error("Failed to load user bins:", err)
    } finally {
      setIsLoadingBins(false)
    }
  }

  const loadStats = async () => {
    try {
      setIsLoadingStats(true)
      const response = await billsApi.getUserStats()
      setStats(response.stats)
    } catch (err: any) {
      console.error("Failed to load stats:", err)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await billsApi.getNotifications()
      setNotifications(response.notifications || [])
      setUnreadCount(response.unreadCount || 0)
    } catch (err: any) {
      console.error("Failed to load notifications:", err)
    }
  }

  const handleAddressSearch = async () => {
    if (!addressSearch.address && !addressSearch.stateCode) {
      setError("Please enter an address or select a state")
      return
    }

    try {
      setError("")
      setIsSearching(true)
      const response = await billsApi.searchAddress(addressSearch)
      setSearchResults(response.results || [])
      
      if (response.results.length === 0) {
        setError("No addresses found. Please refine your search.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to search addresses")
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleLinkBin = async (binId: string) => {
    try {
      setError("")
      await billsApi.linkBin(binId)
      setShowAddressSearch(false)
      setSearchResults([])
      setAddressSearch({ address: "", stateCode: "", lgaName: "" })
      await loadUserBins() // Reload bins
      alert("Bin linked successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to link bin")
    }
  }

  const handleUnlinkBin = async (binId: string) => {
    if (!confirm("Are you sure you want to unlink this bin?")) {
      return
    }

    try {
      setError("")
      await billsApi.unlinkBin(binId)
      await loadUserBins() // Reload bins
      alert("Bin unlinked successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to unlink bin")
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const handleBillLookup = async () => {
    if (!billLookup.binId || !billLookup.state) {
      setFoundBill(null)
      return
    }

    try {
      setError("")
      // Lookup bill by BIN ID
      const response = await billsApi.getByBinId(billLookup.binId)
      
      // Check if we got bin registration and current bill
      if (!response.binRegistration) {
        setError("Bin ID not found")
        setFoundBill(null)
        return
      }

      if (!response.currentBill) {
        setError("No active bills found for this bin. Please contact your waste management authority.")
        setFoundBill(null)
        return
      }

      const bill = response.currentBill
      const binReg = response.binRegistration
      
      setFoundBill({
        id: bill._id,
        binId: binReg.binId,
        address: `${binReg.address}, ${binReg.lgaName}`,
        amount: bill.amount,
        dueDate: new Date(bill.dueDate).toLocaleDateString(),
        status: bill.status.toLowerCase(),
        zone: binReg.lgaName,
      })
    } catch (err: any) {
      setError(err.message || "Failed to find bill")
      setFoundBill(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const downloadBillPDF = async (billId: string, binId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({ title: 'Error', description: 'Please log in again', variant: 'destructive' })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bills/${billId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        toast({ title: 'Error', description: 'Session expired. Please log in again', variant: 'destructive' })
        router.push('/login')
        return
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to download bill' }))
        toast({ title: 'Error', description: error.error || 'Failed to download bill', variant: 'destructive' })
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bill-${binId}-${billId}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({ title: 'Success', description: 'Bill downloaded successfully' })
    } catch (err: any) {
      console.error("Failed to download bill:", err)
      toast({ title: 'Error', description: 'Failed to download bill', variant: 'destructive' })
    }
  }

  const handlePayment = async (billId: string, amount: number, method: 'CARD' | 'BANK_TRANSFER' | 'USSD' | 'MOBILE_MONEY' = 'CARD') => {
    try {
      setError("")
      // Initialize payment
      const response = await paymentsApi.initialize({
        billId,
        method,
      })

      // Redirect to Paystack payment page
      if (response.paystack?.authorizationUrl) {
        window.location.href = response.paystack.authorizationUrl
      } else {
        setError("Failed to initialize payment. Please try again.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment")
      console.error("Payment initialization error:", err)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Logo href="/" size="sm" />
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => setActiveTab("pay-bill")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "pay-bill" ? "bg-green-100 text-green-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pay Bills
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "history" ? "bg-green-100 text-green-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "profile" ? "bg-green-100 text-green-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Profile
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab("notifications")}
                className="relative"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {user?.name || "User"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("my-bins")}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    My Bins
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.name || "User"}!</h1>
          <p className="text-gray-600">Manage your waste bin payments across Nigeria</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Monthly Bill Amount Display */}
        {stateBillingInfo && (
          <Alert className="mb-6 border-green-600 bg-green-50">
            <CreditCard className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <span className="font-semibold">{stateBillingInfo.stateName} Monthly Billing:</span>{" "}
              ₦{stateBillingInfo.monthlyBillAmount.toLocaleString()} per bin ({stateBillingInfo.billCycle})
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      `₦${stats.totalPaid.toLocaleString()}`
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Active Bins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingBins ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      userBins.length
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("my-bins")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View →
                </Button>
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
                  <p className="text-sm font-medium text-gray-600">Due Soon</p>
                  {isLoadingBills ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : upcomingBills.length > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">
                        ₦{upcomingBills[0].amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Due {new Date(upcomingBills[0].dueDate).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">₦0</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingPayments ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      `₦${recentPayments
                        .filter((p) => {
                          const paymentDate = new Date(p.paidAt || p.createdAt)
                          const now = new Date()
                          return paymentDate.getMonth() === now.getMonth() && 
                                 paymentDate.getFullYear() === now.getFullYear()
                        })
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString()}`
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {activeTab === "pay-bill" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bill Lookup */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Pay Your Bill
                  </CardTitle>
                  <CardDescription>Enter your details to lookup and pay your waste bin bill</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={billLookup.state}
                      onValueChange={(value) => setBillLookup((prev) => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lagos">Lagos</SelectItem>
                        <SelectItem value="fct">FCT (Abuja)</SelectItem>
                        <SelectItem value="rivers">Rivers</SelectItem>
                        <SelectItem value="anambra">Anambra</SelectItem>
                        <SelectItem value="kano">Kano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="binId">Waste Bin ID</Label>
                    <Input
                      id="binId"
                      value={billLookup.binId}
                      onChange={(e) => setBillLookup((prev) => ({ ...prev, binId: e.target.value }))}
                      placeholder="e.g., LG001234"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerRef">Customer Reference (Optional)</Label>
                    <Input
                      id="customerRef"
                      value={billLookup.customerRef}
                      onChange={(e) => setBillLookup((prev) => ({ ...prev, customerRef: e.target.value }))}
                      placeholder="Your customer reference number"
                    />
                  </div>

                  <Button className="w-full" onClick={handleBillLookup}>
                    <Search className="w-4 h-4 mr-2" />
                    Lookup Bill
                  </Button>
                </CardContent>
              </Card>

              {/* Bill Lookup Results */}
              {foundBill && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-green-600">Bill Found!</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Bin ID</Label>
                        <p className="font-semibold text-blue-600">{foundBill.binId}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Amount Due</Label>
                        <p className="font-semibold text-lg">₦{foundBill.amount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Service Address</Label>
                      <p className="font-medium">{foundBill.address}</p>
                      <Badge variant="outline" className="mt-1">
                        {foundBill.zone}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Due Date</Label>
                        <p>{foundBill.dueDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <Badge variant={foundBill.status === "paid" ? "default" : "secondary"}>
                          {foundBill.status.charAt(0).toUpperCase() + foundBill.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Label className="text-sm font-medium text-gray-600 mb-3 block">Choose Payment Method</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          className="flex-col h-auto py-3"
                          onClick={() => handlePayment(foundBill.id, foundBill.amount, 'CARD')}
                          disabled={foundBill.status === 'paid'}
                        >
                          <CreditCard className="w-5 h-5 mb-1" />
                          <span className="text-xs">Card</span>
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-col h-auto py-3"
                          onClick={() => handlePayment(foundBill.id, foundBill.amount, 'BANK_TRANSFER')}
                          disabled={foundBill.status === 'paid'}
                        >
                          <CreditCard className="w-5 h-5 mb-1" />
                          <span className="text-xs">Bank Transfer</span>
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-col h-auto py-3"
                          onClick={() => handlePayment(foundBill.id, foundBill.amount, 'USSD')}
                          disabled={foundBill.status === 'paid'}
                        >
                          <CreditCard className="w-5 h-5 mb-1" />
                          <span className="text-xs">USSD</span>
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-col h-auto py-3"
                          onClick={() => handlePayment(foundBill.id, foundBill.amount, 'MOBILE_MONEY')}
                          disabled={foundBill.status === 'paid'}
                        >
                          <CreditCard className="w-5 h-5 mb-1" />
                          <span className="text-xs">Mobile Money</span>
                        </Button>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => downloadBillPDF(foundBill.id, foundBill.binId)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Bill
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Upcoming Bills */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Upcoming Bills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingBills ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                  ) : upcomingBills.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No upcoming bills</p>
                  ) : (
                    upcomingBills.map((bill) => (
                      <div key={bill._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={bill.status === "overdue" ? "destructive" : "secondary"}>
                            {bill.status === "overdue" ? "Overdue" : "Pending"}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(bill.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-blue-600">{bill.binRegistration?.binId}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          {bill.binRegistration?.address}, {bill.binRegistration?.lga}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {bill.binRegistration?.zone}
                          </Badge>
                          <p className="text-sm text-gray-600">
                            {bill.binRegistration?.state}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-green-600">₦{bill.amount.toLocaleString()}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handlePayment(bill._id, bill.amount, 'CARD')}
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Card
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePayment(bill._id, bill.amount, 'BANK_TRANSFER')}
                          >
                            Bank
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePayment(bill._id, bill.amount, 'USSD')}
                          >
                            USSD
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePayment(bill._id, bill.amount, 'MOBILE_MONEY')}
                          >
                            Mobile
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Payment History
              </CardTitle>
              <CardDescription>View all your past waste bin payments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : recentPayments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No payment history</p>
              ) : (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div key={payment._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Trash2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">{payment.bill?.binRegistration?.binId}</p>
                          <p className="text-sm text-gray-600">
                            {payment.bill?.binRegistration?.address}, {payment.bill?.binRegistration?.lga}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {payment.bill?.binRegistration?.zone}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {payment.bill?.binRegistration?.state}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₦{payment.amount.toLocaleString()}</p>
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                        <div className="flex space-x-1 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadBillPDF(payment.bill?._id, payment.bill?.binRegistration?.binId)}
                            disabled={payment.status !== "completed"}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {payment.status === "completed" && (
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "my-bins" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                My Active Bins
              </CardTitle>
              <CardDescription>Manage your linked waste bins</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBins ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : userBins.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">No linked bins yet</p>
                  <p className="text-sm text-gray-400 mb-6">Search for your address to link a bin to your account</p>
                  <Button onClick={() => setActiveTab("profile")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Find My Bin
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBins.map((bin: any) => (
                    <div key={bin._id} className="p-4 border rounded-lg hover:border-green-500 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              {bin.binId}
                            </Badge>
                            {bin.isActive && (
                              <Badge variant="default" className="bg-green-600">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-gray-900 mb-1">{bin.address}</p>
                          <p className="text-sm text-gray-600">{bin.lgaName}, {bin.stateCode.toUpperCase()}</p>
                          {bin.customerRef && (
                            <p className="text-xs text-gray-500 mt-1">Ref: {bin.customerRef}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Registered: {new Date(bin.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBillLookup({ state: bin.stateCode, binId: bin.binId, customerRef: "" })
                              setActiveTab("pay-bill")
                              handleBillLookup()
                            }}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Pay Bill
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlinkBin(bin.binId)}
                            className="text-red-600 hover:text-red-700 hover:border-red-600"
                          >
                            Unlink
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("profile")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Link Another Bin
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "notifications" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} unread</Badge>
                )}
              </CardTitle>
              <CardDescription>Stay updated on your bills and payments</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No notifications yet</p>
                  <p className="text-sm text-gray-400">You'll be notified when new bills are generated</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification._id} 
                      className={`p-4 border rounded-lg transition-colors ${
                        notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {notification.type === 'NEW_BILL' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                New Bill
                              </Badge>
                            )}
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              // Mark as read via API
                              await billsApi.markNotificationRead(notification._id)
                              // Update local state
                              setNotifications(notifications.map(n => 
                                n._id === notification._id ? { ...n, isRead: true } : n
                              ))
                              setUnreadCount(prev => Math.max(0, prev - 1))
                              setActiveTab('pay-bill')
                            } catch (err) {
                              console.error('Failed to mark notification as read:', err)
                            }
                          }}
                        >
                          View Bill
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        try {
                          await billsApi.markAllNotificationsRead()
                          setNotifications(notifications.map(n => ({ ...n, isRead: true })))
                          setUnreadCount(0)
                        } catch (err) {
                          console.error('Failed to mark all as read:', err)
                        }
                      }}
                    >
                      Mark All as Read
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={user?.name} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={user?.email} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue={user?.phone} />
                </div>
                <Button>Update Profile</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Bins</CardTitle>
                <CardDescription>Manage your linked waste bins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingBins ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : userBins.length > 0 ? (
                  <div className="space-y-3">
                    {userBins.map((bin: any) => (
                      <div key={bin._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-blue-600">{bin.binId}</p>
                          <p className="text-sm text-gray-600">{bin.address}</p>
                          <p className="text-xs text-gray-500">{bin.lgaName}, {bin.stateCode}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUnlinkBin(bin.binId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No linked bins yet</p>
                    <p className="text-sm text-gray-400">Search for your address below to link a bin</p>
                  </div>
                )}

                {!showAddressSearch ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowAddressSearch(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Find My Bin
                  </Button>
                ) : (
                  <div className="space-y-4 mt-4 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Search for Your Address</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setShowAddressSearch(false)
                          setSearchResults([])
                          setAddressSearch({ address: "", stateCode: "", lgaName: "" })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="searchAddress">Address</Label>
                      <Input
                        id="searchAddress"
                        placeholder="e.g., 123 Main Street"
                        value={addressSearch.address}
                        onChange={(e) => setAddressSearch(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="searchState">State</Label>
                      <Select
                        value={addressSearch.stateCode}
                        onValueChange={(value) => setAddressSearch(prev => ({ ...prev, stateCode: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lagos">Lagos</SelectItem>
                          <SelectItem value="fct">FCT (Abuja)</SelectItem>
                          <SelectItem value="enugu">Enugu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleAddressSearch}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Found {searchResults.length} address(es):</p>
                        {searchResults.map((result: any) => (
                          <div key={result.binId} className="flex items-center justify-between p-3 border rounded bg-white">
                            <div>
                              <p className="font-medium text-blue-600">{result.binId}</p>
                              <p className="text-sm text-gray-600">{result.address}</p>
                              <p className="text-xs text-gray-500">{result.lgaName}, {result.stateCode}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleLinkBin(result.binId)}
                            >
                              Link
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
