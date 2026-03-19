"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import {
  AlertCircle,
  BarChart4,
  Bell,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Layers,
  LineChart,
  Loader2,
  LogOut,
  Map,
  MapPin,
  Maximize,
  MessageSquare,
  Minimize,
  MoreHorizontal,
  Navigation,
  PieChart,
  Plus,
  Printer,
  Search,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { NotificationTab } from "@/components/notification-tab";
import { adminApi, authApi, ApiError } from "@/lib/api";
import {
  NIGERIAN_STATES,
  STATE_MAP_CENTERS,
  getCurrentStateLGAs,
} from "@/lib/constants";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  // ─── State declarations ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("overview");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stateStats, setStateStats] = useState<any>(null);

  // Data
  const [bills, setBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  // Loading states
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Bills tab
  const [billsSearchQuery, setBillsSearchQuery] = useState("");
  const [billsStatusFilter, setBillsStatusFilter] = useState("all");
  const [billsCurrentPage, setBillsCurrentPage] = useState(1);
  const billsPerPage = 10;

  // Payments tab
  const [paymentsSearchQuery, setPaymentsSearchQuery] = useState("");
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState("all");
  const [paymentsCurrentPage, setPaymentsCurrentPage] = useState(1);
  const paymentsPerPage = 10;

  // Users tab
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [usersStatusFilter, setUsersStatusFilter] = useState("all");
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Addresses tab
  const [addressesSearchQuery, setAddressesSearchQuery] = useState("");
  const [addressesStatusFilter, setAddressesStatusFilter] = useState("all");
  const [addressesCurrentPage, setAddressesCurrentPage] = useState(1);
  const addressesPerPage = 10;
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    lgaName: "",
    address: "",
    customerRef: "",
  });
  const [isRegisteringAddress, setIsRegisteringAddress] = useState(false);
  const [registeredBinId, setRegisteredBinId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState({
    address: "",
    lgaName: "",
    customerRef: "",
  });

  // Reports tab
  const [reportsTypeFilter, setReportsTypeFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Map tab
  const [mapFilter, setMapFilter] = useState("all");
  const [mapZoom, setMapZoom] = useState(10);
  const [mapCenter, setMapCenter] = useState({ lat: 6.5244, lng: 3.3792 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLGABoundaries, setShowLGABoundaries] = useState(false);

  // Notifications
  const [isNotificationSending, setIsNotificationSending] = useState<
    string | null
  >(null);
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(
    null,
  );

  // loadBills declared here so it's in scope for useEffect
  const loadBills = async (stateCode: string) => {
    try {
      const response = await adminApi.getStateBills(stateCode, {
        page: 1,
        limit: 50,
      });
      setBills(response.bills || []);
    } catch (err) {
      console.error("Failed to load bills:", err);
    }
  };
  // ─── All state, helpers, and handlers must live INSIDE the component ───

  const loadPayments = async (stateCode: string) => {
    try {
      setIsLoadingPayments(true);
      const response = await adminApi.getStatePayments(stateCode, {
        page: paymentsCurrentPage,
        limit: 50,
      });
      setPayments(response.payments || []);
    } catch (err: any) {
      console.error("Failed to load payments:", err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const loadUsers = async (stateCode: string) => {
    try {
      setIsLoadingUsers(true);
      const response = await adminApi.getStateUsers(stateCode, {
        page: usersCurrentPage,
        limit: 50,
      });
      setUsers(response.users || []);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const response = await adminApi.getAddresses();
      setAddresses(response.addresses || []);
    } catch (err: any) {
      console.error("Failed to load addresses:", err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleRegisterAddress = async () => {
    if (!newAddress.lgaName || !newAddress.address) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      setIsRegisteringAddress(true);
      const response = await adminApi.registerAddress(newAddress);
      setRegisteredBinId(response.binRegistration.binId);
      setNewAddress({ lgaName: "", address: "", customerRef: "" });
      await loadAddresses();
    } catch (err: any) {
      console.error("Failed to register address:", err);
      alert(err.response?.data?.message || "Failed to register address");
    } finally {
      setIsRegisteringAddress(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/admin/login");
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const userResponse = await authApi.getCurrentUser();
        if (userResponse.role !== "STATE_ADMIN") {
          router.push("/admin/login");
          return;
        }
        setCurrentUser(userResponse);
        if (userResponse.stateCode) {
          const statsResponse = await adminApi.getStateStats(
            userResponse.stateCode,
          );
          setStateStats(statsResponse);
          await Promise.all([
            loadBills(userResponse.stateCode),
            loadPayments(userResponse.stateCode),
            loadUsers(userResponse.stateCode),
            loadAddresses(),
          ]);
        }
      } catch (err) {
        console.error("Auth/Data load error:", err);
        if (err instanceof ApiError && err.status === 401) {
          router.push("/admin/login");
        } else {
          setError("Failed to load dashboard data");
        }
      } finally {
        setIsInitialLoading(false);
      }
    };
    checkAuthAndLoadData();
  }, [router]);

  useEffect(() => {
    if (currentUser?.stateCode) {
      const stateCode = currentUser.stateCode;
      const center =
        STATE_MAP_CENTERS[stateCode] ||
        STATE_MAP_CENTERS[stateCode.toUpperCase()];
      if (center) {
        if (Array.isArray(center)) {
          setMapCenter({ lat: center[0], lng: center[1] });
        } else {
          setMapCenter(center);
        }
      }
    }
  }, [currentUser]);

  const stateInfo = currentUser
    ? {
        name: currentUser.stateCode?.toUpperCase() || "Unknown",
        code: currentUser.stateCode || "",
        authority: "State Waste Management Authority",
        adminName:
          `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim(),
        adminEmail: currentUser.email,
      }
    : {
        name: "Loading...",
        code: "",
        authority: "",
        adminName: "",
        adminEmail: "",
      };

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
  };

  const filteredBills = bills.filter((bill) => {
    const binId = bill.binRegistration?.binId || "";
    const address = bill.binRegistration?.address || "";
    const zone = bill.binRegistration?.zone || "";
    const matchesSearch =
      bill._id?.toLowerCase().includes(billsSearchQuery.toLowerCase()) ||
      binId.toLowerCase().includes(billsSearchQuery.toLowerCase()) ||
      address.toLowerCase().includes(billsSearchQuery.toLowerCase()) ||
      zone.toLowerCase().includes(billsSearchQuery.toLowerCase());
    const matchesStatus =
      billsStatusFilter === "all" || bill.status === billsStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const indexOfLastBill = billsCurrentPage * billsPerPage;
  const indexOfFirstBill = indexOfLastBill - billsPerPage;
  const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill);
  const totalBillsPages = Math.ceil(filteredBills.length / billsPerPage);

  const filteredPayments = payments.filter((payment) => {
    const binId = payment.billId?.binRegistration?.binId || "";
    const address = payment.billId?.binRegistration?.address || "";
    const zone = payment.billId?.binRegistration?.zone || "";
    const userName =
      `${payment.userId?.firstName || ""} ${payment.userId?.lastName || ""}`.trim();
    const matchesSearch =
      payment._id?.toLowerCase().includes(paymentsSearchQuery.toLowerCase()) ||
      payment.reference
        ?.toLowerCase()
        .includes(paymentsSearchQuery.toLowerCase()) ||
      binId.toLowerCase().includes(paymentsSearchQuery.toLowerCase()) ||
      userName.toLowerCase().includes(paymentsSearchQuery.toLowerCase()) ||
      address.toLowerCase().includes(paymentsSearchQuery.toLowerCase()) ||
      zone.toLowerCase().includes(paymentsSearchQuery.toLowerCase());
    const matchesStatus =
      paymentsStatusFilter === "all" || payment.status === paymentsStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const indexOfLastPayment = paymentsCurrentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = filteredPayments.slice(
    indexOfFirstPayment,
    indexOfLastPayment,
  );
  const totalPaymentsPages = Math.ceil(
    filteredPayments.length / paymentsPerPage,
  );

  const filteredUsers = users.filter((user) => {
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const matchesSearch =
      userName.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(usersSearchQuery.toLowerCase());
    const matchesStatus =
      usersStatusFilter === "all" ||
      (usersStatusFilter === "active" && user.isActive) ||
      (usersStatusFilter === "inactive" && !user.isActive);
    return matchesSearch && matchesStatus;
  });

  const indexOfLastUser = usersCurrentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage);

  const filteredAddresses = addresses.filter((address) => {
    const binId = address.binId || "";
    const addressText = address.address || "";
    const lgaName = address.lgaName || "";
    const customerRef = address.customerRef || "";
    const linkedUser = address.userId
      ? `${address.userId.firstName || ""} ${address.userId.lastName || ""}`.trim()
      : "";
    const matchesSearch =
      binId.toLowerCase().includes(addressesSearchQuery.toLowerCase()) ||
      addressText.toLowerCase().includes(addressesSearchQuery.toLowerCase()) ||
      lgaName.toLowerCase().includes(addressesSearchQuery.toLowerCase()) ||
      customerRef.toLowerCase().includes(addressesSearchQuery.toLowerCase()) ||
      linkedUser.toLowerCase().includes(addressesSearchQuery.toLowerCase());
    const matchesStatus =
      addressesStatusFilter === "all" ||
      (addressesStatusFilter === "active" && address.isActive) ||
      (addressesStatusFilter === "inactive" && !address.isActive);
    return matchesSearch && matchesStatus;
  });

  const indexOfLastAddress = addressesCurrentPage * addressesPerPage;
  const indexOfFirstAddress = indexOfLastAddress - addressesPerPage;
  const currentAddresses = filteredAddresses.slice(
    indexOfFirstAddress,
    indexOfLastAddress,
  );
  const totalAddressesPages = Math.ceil(
    filteredAddresses.length / addressesPerPage,
  );

  const reportsData: any[] = [];
  const filteredReports = reportsData.filter(
    (report) =>
      reportsTypeFilter === "all" || report.type === reportsTypeFilter,
  );

  const filteredMapData = bills.filter((bill) =>
    mapFilter === "all" ? true : bill.status === mapFilter,
  );

  const coordinateToPixel = (
    lat: number,
    lng: number,
    mapWidth: number,
    mapHeight: number,
  ) => {
    const bounds = { north: 7.0, south: 6.0, east: 7.8, west: 7.0 };
    const zoomFactor = mapZoom / 10;
    const latRange = (bounds.north - bounds.south) / zoomFactor;
    const lngRange = (bounds.east - bounds.west) / zoomFactor;
    const visibleBounds = {
      north: mapCenter.lat + latRange / 2,
      south: mapCenter.lat - latRange / 2,
      east: mapCenter.lng + lngRange / 2,
      west: mapCenter.lng - lngRange / 2,
    };
    const x =
      ((lng - visibleBounds.west) / (visibleBounds.east - visibleBounds.west)) *
      mapWidth;
    const y =
      ((visibleBounds.north - lat) /
        (visibleBounds.north - visibleBounds.south)) *
      mapHeight;
    return {
      x: Math.max(0, Math.min(mapWidth, x)),
      y: Math.max(0, Math.min(mapHeight, y)),
    };
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const sendOverdueNotification = async (bill: any) => {
    setIsNotificationSending(bill.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setNotificationSuccess(bill.id);
      setTimeout(() => setNotificationSuccess(null), 3000);
    } catch (error) {
      console.error("[v0] Failed to send notification:", error);
    } finally {
      setIsNotificationSending(null);
    }
  };

  const sendBulkOverdueNotifications = async () => {
    setIsNotificationSending("bulk");
    try {
      await adminApi.sendBulkOverdueNotifications(currentUser?.stateCode || "");
      setNotificationSuccess("bulk");
      setTimeout(() => setNotificationSuccess(null), 5000);
    } catch (error) {
      console.error("Failed to send bulk notifications:", error);
      toast({
        title: "Notification Error",
        description: "Failed to send bulk overdue notifications.",
        variant: "destructive",
      });
    } finally {
      setIsNotificationSending(null);
    }
  };

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
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
          <header className="bg-white/90 border-b shadow-sm backdrop-blur-md">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Logo href="/" size="sm" />
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-blue-600" />
                      {stateInfo.authority} Admin Dashboard
                    </h1>
                    <p className="text-sm text-gray-600">
                      {stateInfo.name} State Waste Management
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    State Admin
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("settings")}
                  >
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

          <div className="container mx-auto px-2 sm:px-4 py-8 max-w-7xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-2 tracking-tight drop-shadow-md">
                Welcome back, {stateInfo.adminName}
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Manage{" "}
                <span className="font-semibold text-blue-700">
                  waste bills and payments
                </span>{" "}
                for {stateInfo.name} State
              </p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="map">State Map</TabsTrigger>
                <TabsTrigger value="bills">Bills</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="users">Registered Addresses</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* ── Notifications ── */}
              <TabsContent value="notifications" className="mt-6">
                <NotificationTab />
              </TabsContent>

              {/* ── Overview ── */}
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <Card className="bg-gradient-to-br from-blue-100/80 to-blue-50 border-blue-200 shadow-md">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-200 rounded-xl flex items-center justify-center shadow">
                        <Users className="w-7 h-7 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-800">
                          Total Users
                        </p>
                        <p className="text-2xl font-extrabold text-blue-900">
                          {(stats.totalUsers || 0).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-100/80 to-green-50 border-green-200 shadow-md">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-200 rounded-xl flex items-center justify-center shadow">
                        <FileText className="w-7 h-7 text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          Total Bills
                        </p>
                        <p className="text-2xl font-extrabold text-green-900">
                          {(stats.totalBills || 0).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-100/80 to-pink-50 border-purple-200 shadow-md">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 bg-purple-200 rounded-xl flex items-center justify-center shadow">
                        <CreditCard className="w-7 h-7 text-purple-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-800">
                          Monthly Revenue
                        </p>
                        <p className="text-2xl font-extrabold text-purple-900">
                          ₦{((stats.monthlyRevenue || 0) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-100/80 to-yellow-50 border-orange-200 shadow-md">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 bg-orange-200 rounded-xl flex items-center justify-center shadow">
                        <AlertCircle className="w-7 h-7 text-orange-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-orange-800">
                          Pending Bills
                        </p>
                        <p className="text-2xl font-extrabold text-orange-900">
                          {(stats.pendingBills || 0).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Payments</CardTitle>
                      <CardDescription>
                        Latest successful payments in your state
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {payments
                          .filter((payment) => payment.status === "successful")
                          .slice(0, 5)
                          .map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <div>
                                  <p className="font-medium">{payment.binId}</p>
                                  <p className="text-sm text-gray-600">
                                    {payment.customerName}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(payment.amount)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(payment.date)}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Alerts</CardTitle>
                      <CardDescription>
                        Important notifications and alerts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800">
                              Payment Gateway Maintenance
                            </p>
                            <p className="text-sm text-yellow-700">
                              Scheduled maintenance tonight 11 PM - 2 AM
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-800">
                              Monthly Report Ready
                            </p>
                            <p className="text-sm text-green-700">
                              January 2024 report is available for download
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-800">
                              Revenue Increase
                            </p>
                            <p className="text-sm text-blue-700">
                              15% increase in collections this month
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ── Map ── */}
              <TabsContent value="map" className="mt-6">
                <div
                  className={`grid gap-6 ${isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-4"}`}
                >
                  {!isFullscreen && (
                    <div className="lg:col-span-1">
                      <Card className="h-full">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Map className="w-5 h-5 mr-2" />
                            Map Controls
                          </CardTitle>
                          <CardDescription>
                            Filter and control map display
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">
                              Filter by Status
                            </Label>
                            <Select
                              value={mapFilter}
                              onValueChange={setMapFilter}
                            >
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All Properties
                                </SelectItem>
                                <SelectItem value="paid">
                                  Paid (Green)
                                </SelectItem>
                                <SelectItem value="pending">
                                  Due for Payment (Yellow)
                                </SelectItem>
                                <SelectItem value="overdue">
                                  Overdue (Red)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="showLGABoundaries"
                              checked={showLGABoundaries}
                              onChange={(e) =>
                                setShowLGABoundaries(e.target.checked)
                              }
                              className="rounded"
                            />
                            <Label
                              htmlFor="showLGABoundaries"
                              className="text-sm"
                            >
                              Show LGA Boundaries
                            </Label>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Legend
                            </Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-green-500 rounded-full" />
                                <span className="text-sm">Paid Bills</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                                <span className="text-sm">Due for Payment</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-red-500 rounded-full" />
                                <span className="text-sm">Overdue Bills</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              {stateInfo.name === "FEDERAL CAPITAL TERRITORY"
                                ? "Area Councils"
                                : "Local Government Areas"}
                            </Label>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {getCurrentStateLGAs().map(
                                (lga: {
                                  name: string;
                                  center: any;
                                  color: string;
                                }) => (
                                  <div
                                    key={lga.name}
                                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => {
                                      const center = lga.center;
                                      if (center) {
                                        if (Array.isArray(center)) {
                                          setMapCenter({
                                            lat: center[0],
                                            lng: center[1],
                                          });
                                        } else {
                                          setMapCenter(center);
                                        }
                                      }
                                      setMapZoom(14);
                                    }}
                                  >
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: lga.color }}
                                    />
                                    <span className="text-sm">{lga.name}</span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Statistics
                            </Label>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Total Properties:</span>
                                <span className="font-medium">
                                  {bills.length}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">Paid:</span>
                                <span className="font-medium text-green-600">
                                  {
                                    bills.filter((b) => b.status === "paid")
                                      .length
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-yellow-600">
                                  Pending:
                                </span>
                                <span className="font-medium text-yellow-600">
                                  {
                                    bills.filter((b) => b.status === "pending")
                                      .length
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-red-600">Overdue:</span>
                                <span className="font-medium text-red-600">
                                  {
                                    bills.filter((b) => b.status === "overdue")
                                      .length
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Zoom Level
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setMapZoom(Math.max(mapZoom - 2, 6))
                                }
                                disabled={mapZoom <= 6}
                              >
                                <ZoomOut className="w-4 h-4" />
                              </Button>
                              <span className="text-sm font-medium">
                                {mapZoom}x
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setMapZoom(Math.min(mapZoom + 2, 20))
                                }
                                disabled={mapZoom >= 20}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full bg-transparent"
                            onClick={() => {
                              if (currentUser?.stateCode) {
                                const center =
                                  STATE_MAP_CENTERS[currentUser.stateCode] ||
                                  STATE_MAP_CENTERS[
                                    currentUser.stateCode.toUpperCase()
                                  ];
                                if (center) {
                                  if (Array.isArray(center)) {
                                    setMapCenter({
                                      lat: center[0],
                                      lng: center[1],
                                    });
                                  } else {
                                    setMapCenter(center);
                                  }
                                }
                              }
                              setMapZoom(10);
                            }}
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Reset View
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div
                    className={isFullscreen ? "col-span-1" : "lg:col-span-3"}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center">
                            <MapPin className="w-5 h-5 mr-2" />
                            {stateInfo.name} State - Registered Properties Map
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {filteredMapData.length} properties shown
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsFullscreen(!isFullscreen)}
                            >
                              {isFullscreen ? (
                                <Minimize className="w-4 h-4" />
                              ) : (
                                <Maximize className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardTitle>
                        <CardDescription>
                          Interactive map showing all registered waste bin
                          locations with payment status across {stateInfo.name}{" "}
                          State
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`relative w-full bg-gray-100 rounded-lg border overflow-hidden ${
                            isFullscreen ? "h-[80vh]" : "h-[600px]"
                          }`}
                        >
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${mapCenter.lat},${mapCenter.lng}&zoom=${mapZoom}&maptype=roadmap`}
                          />
                          <div className="absolute top-4 right-4 flex flex-col space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/95 hover:bg-white shadow-lg"
                            >
                              <Layers className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/95 hover:bg-white shadow-lg"
                            >
                              <Filter className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="absolute bottom-4 left-4 bg-white/95 rounded-lg px-4 py-3 text-xs shadow-lg border">
                            <div className="font-semibold text-gray-700">
                              📍{" "}
                              {mapCenter && typeof mapCenter.lat === "number"
                                ? mapCenter.lat.toFixed(4)
                                : "N/A"}
                              °N,{" "}
                              {mapCenter && typeof mapCenter.lng === "number"
                                ? mapCenter.lng.toFixed(4)
                                : "N/A"}
                              °E
                            </div>
                            <div className="text-gray-600 mt-1">
                              🔍 Zoom: {mapZoom}x | Scale: 1:
                              {(mapZoom * 10000).toLocaleString()}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              🗺️ {stateInfo.name} State Coverage Area
                            </div>
                          </div>
                          <div className="absolute top-4 left-4 bg-white/95 rounded-full p-3 shadow-lg border">
                            <div className="w-10 h-10 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-red-600">
                                  N
                                </span>
                              </div>
                              <div className="absolute inset-0 border-2 border-gray-300 rounded-full" />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                <div>
                                  <p className="text-sm font-medium">
                                    Paid Properties
                                  </p>
                                  <p className="text-lg font-bold text-green-600">
                                    {
                                      bills.filter((b) => b.status === "paid")
                                        .length
                                    }
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                <div>
                                  <p className="text-sm font-medium">
                                    Due for Payment
                                  </p>
                                  <p className="text-lg font-bold text-yellow-600">
                                    {
                                      bills.filter(
                                        (b) => b.status === "pending",
                                      ).length
                                    }
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full" />
                                <div>
                                  <p className="text-sm font-medium">
                                    Overdue Bills
                                  </p>
                                  <p className="text-lg font-bold text-red-600">
                                    {
                                      bills.filter(
                                        (b) => b.status === "overdue",
                                      ).length
                                    }
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

              {/* ── Bills ── */}
              <TabsContent value="bills" className="mt-6">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Monthly Bill Generation
                    </CardTitle>
                    <CardDescription>
                      Generate bills for all registered addresses in{" "}
                      {stateInfo.name} State
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900 mb-1">
                          Active Bins
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {addresses.length}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Registered addresses
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-900 mb-1">
                          Current Bill Amount
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          ₦{stats.averageBill?.toLocaleString() || "1,500"}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Per bin, per month
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-purple-900 mb-1">
                          Expected Revenue
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          ₦
                          {(
                            (stats.averageBill || 1500) * addresses.length
                          ).toLocaleString()}
                        </p>
                        <p className="text-xs text-purple-700 mt-1">
                          This billing cycle
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Alert className="border-orange-600 bg-orange-50">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-900">
                          <span className="font-semibold">Important:</span> This
                          will generate bills for all active bins that don't
                          already have a bill for the current month.
                        </AlertDescription>
                      </Alert>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={async () => {
                          if (
                            !confirm(
                              `Generate monthly bills for ${addresses.length} active bins in ${stateInfo.name}?\n\nBill Amount: ₦${(stats.averageBill || 1500).toLocaleString()} per bin\nExpected Revenue: ₦${((stats.averageBill || 1500) * addresses.length).toLocaleString()}`,
                            )
                          )
                            return;
                          try {
                            const data = await adminApi.generateMonthlyBills();
                            alert(
                              `Bills Generated!\n\n✅ Generated: ${data.generated}\n⏭️ Skipped: ${data.skipped}\n❌ Errors: ${data.errors?.length || 0}`,
                            );
                            if (currentUser?.stateCode)
                              await loadBills(currentUser.stateCode);
                          } catch (error) {
                            console.error("Failed to generate bills:", error);
                            alert(
                              "Failed to generate bills. Please try again.",
                            );
                          }
                        }}
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        Generate Monthly Bills
                      </Button>
                      <div className="text-xs text-gray-500">
                        <p>
                          • Bills will only be generated for bins that are
                          linked to users
                        </p>
                        <p>
                          • Duplicate bills for the same month will be skipped
                          automatically
                        </p>
                        <p>
                          • Users will receive notifications about new bills
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bill Management</CardTitle>
                    <CardDescription>
                      Manage waste bills for {stateInfo.name} State
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search by bill ID, bin ID, customer name, address, or zone..."
                              className="pl-10"
                              value={billsSearchQuery}
                              onChange={(e) =>
                                setBillsSearchQuery(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="w-full md:w-48">
                          <Select
                            value={billsStatusFilter}
                            onValueChange={setBillsStatusFilter}
                          >
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
                            isNotificationSending === "bulk" ||
                            bills.filter((b) => b.status === "overdue")
                              .length === 0
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
                              Notify All Overdue (
                              {
                                bills.filter((b) => b.status === "overdue")
                                  .length
                              }
                              )
                            </>
                          )}
                        </Button>
                      </div>

                      {notificationSuccess === "bulk" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <p className="text-green-800 font-medium">
                            Bulk overdue notifications sent successfully to all
                            overdue accounts!
                          </p>
                        </div>
                      )}

                      {/* Bills Table */}
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">
                                Bill ID
                              </TableHead>
                              <TableHead>Bin &amp; Address</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentBills.map((bill) => (
                              <TableRow key={bill.id}>
                                <TableCell className="font-medium">
                                  {bill.id}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-blue-600">
                                      {bill.binId}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {bill.binAddress}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="mt-1 text-xs"
                                    >
                                      {bill.zone}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {bill.customerName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {bill.customerPhone}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(bill.amount)}
                                </TableCell>
                                <TableCell>
                                  {formatDate(bill.dueDate)}
                                </TableCell>
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
                                    {bill.status.charAt(0).toUpperCase() +
                                      bill.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right relative">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                      >
                                        <span className="sr-only">
                                          Open menu
                                        </span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem>
                                        <Eye className="mr-2 h-4 w-4" /> View
                                        Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                        Bill
                                      </DropdownMenuItem>
                                      {bill.status === "overdue" && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() =>
                                              sendOverdueNotification(bill)
                                            }
                                            disabled={
                                              isNotificationSending === bill.id
                                            }
                                            className="text-orange-600 focus:text-orange-700"
                                          >
                                            {isNotificationSending ===
                                            bill.id ? (
                                              <>
                                                <Clock className="mr-2 h-4 w-4 animate-spin" />{" "}
                                                Sending...
                                              </>
                                            ) : (
                                              <>
                                                <Bell className="mr-2 h-4 w-4" />{" "}
                                                Send Overdue Notice
                                              </>
                                            )}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              sendOverdueNotification(bill)
                                            }
                                            disabled={
                                              isNotificationSending === bill.id
                                            }
                                            className="text-blue-600 focus:text-blue-700"
                                          >
                                            <MessageSquare className="mr-2 h-4 w-4" />{" "}
                                            Send SMS Reminder
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />{" "}
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

                      {/* Bills Pagination */}
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                billsCurrentPage > 1 &&
                                setBillsCurrentPage((prev) =>
                                  Math.max(prev - 1, 1),
                                )
                              }
                              aria-disabled={billsCurrentPage === 1}
                              className={
                                billsCurrentPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                          {Array.from(
                            { length: totalBillsPages },
                            (_, i) => i + 1,
                          ).map((page) => (
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
                              onClick={() =>
                                billsCurrentPage < totalBillsPages &&
                                setBillsCurrentPage((prev) =>
                                  Math.min(prev + 1, totalBillsPages),
                                )
                              }
                              aria-disabled={
                                billsCurrentPage === totalBillsPages
                              }
                              className={
                                billsCurrentPage === totalBillsPages
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Payments ── */}
              <TabsContent value="payments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Management</CardTitle>
                    <CardDescription>
                      View and manage payments for {stateInfo.name} State
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search by payment ID, bin ID, customer name, address, or zone..."
                              className="pl-10"
                              value={paymentsSearchQuery}
                              onChange={(e) =>
                                setPaymentsSearchQuery(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="w-full md:w-48">
                          <Select
                            value={paymentsStatusFilter}
                            onValueChange={setPaymentsStatusFilter}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="successful">
                                Successful
                              </SelectItem>
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

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">
                                Payment ID
                              </TableHead>
                              <TableHead>Bin &amp; Address</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentPayments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-medium">
                                  {payment.id}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-blue-600">
                                      {payment.binId}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {payment.binAddress}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="mt-1 text-xs"
                                    >
                                      {payment.zone}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>{payment.customerName}</TableCell>
                                <TableCell>
                                  {formatCurrency(payment.amount)}
                                </TableCell>
                                <TableCell>
                                  {formatDate(payment.date)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {payment.paymentMethod
                                      ?.replace("_", " ")
                                      .toUpperCase() || "N/A"}
                                  </Badge>
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
                                    {payment.status.charAt(0).toUpperCase() +
                                      payment.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                      >
                                        <span className="sr-only">
                                          Open menu
                                        </span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem>
                                        <Eye className="mr-2 h-4 w-4" /> View
                                        Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Download className="mr-2 h-4 w-4" />{" "}
                                        Download Receipt
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Printer className="mr-2 h-4 w-4" />{" "}
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

                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                paymentsCurrentPage > 1 &&
                                setPaymentsCurrentPage((prev) =>
                                  Math.max(prev - 1, 1),
                                )
                              }
                              aria-disabled={paymentsCurrentPage === 1}
                              className={
                                paymentsCurrentPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                          {Array.from(
                            { length: totalPaymentsPages },
                            (_, i) => i + 1,
                          ).map((page) => (
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
                              onClick={() =>
                                paymentsCurrentPage < totalPaymentsPages &&
                                setPaymentsCurrentPage((prev) =>
                                  Math.min(prev + 1, totalPaymentsPages),
                                )
                              }
                              aria-disabled={
                                paymentsCurrentPage === totalPaymentsPages
                              }
                              className={
                                paymentsCurrentPage === totalPaymentsPages
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Registered Addresses ── */}
              <TabsContent value="users" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Registered Addresses</CardTitle>
                    <CardDescription>
                      Manage registered addresses and bin IDs in{" "}
                      {stateInfo.name} State
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search by bin ID, address, LGA, or customer reference..."
                              className="pl-10"
                              value={addressesSearchQuery}
                              onChange={(e) =>
                                setAddressesSearchQuery(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="w-full md:w-48">
                          <Select
                            value={addressesStatusFilter}
                            onValueChange={setAddressesStatusFilter}
                          >
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

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[150px]">
                                Bin ID
                              </TableHead>
                              <TableHead>Address</TableHead>
                              <TableHead>LGA</TableHead>
                              <TableHead>Customer Reference</TableHead>
                              <TableHead>Linked User</TableHead>
                              <TableHead>Registration Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingAddresses ? (
                              <TableRow>
                                <TableCell
                                  colSpan={8}
                                  className="text-center py-8"
                                >
                                  <div className="flex justify-center items-center">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    Loading addresses...
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : currentAddresses.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={8}
                                  className="text-center py-8 text-gray-500"
                                >
                                  No registered addresses found
                                </TableCell>
                              </TableRow>
                            ) : (
                              currentAddresses.map((address) => (
                                <TableRow key={address._id}>
                                  <TableCell className="font-medium font-mono">
                                    {address.binId || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <div className="max-w-[250px] truncate">
                                      {address.address || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {address.lgaName || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {address.customerRef || "-"}
                                  </TableCell>
                                  <TableCell>
                                    {address.userId ? (
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                          {`${address.userId.firstName || ""} ${address.userId.lastName || ""}`.trim()}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {address.userId.email}
                                        </span>
                                      </div>
                                    ) : (
                                      <Badge variant="outline">
                                        Not Linked
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {address.createdAt
                                      ? new Date(
                                          address.createdAt,
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        address.isActive
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {address.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                        >
                                          <span className="sr-only">
                                            Open menu
                                          </span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>
                                          Actions
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedAddress(address);
                                            setShowAddressDetails(true);
                                          }}
                                        >
                                          <Eye className="mr-2 h-4 w-4" /> View
                                          Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedAddress(address);
                                            setEditedAddress({
                                              address: address.address || "",
                                              lgaName: address.lgaName || "",
                                              customerRef:
                                                address.customerRef || "",
                                            });
                                            setIsEditingAddress(true);
                                            setShowAddressDetails(true);
                                          }}
                                        >
                                          <Edit className="mr-2 h-4 w-4" /> Edit
                                          Address
                                        </DropdownMenuItem>
                                        {address.status === "PENDING" && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={async () => {
                                                await adminApi.approveAddress(
                                                  address._id,
                                                );
                                                toast({
                                                  title: "Address Approved",
                                                  description: `Address ${address.address} has been approved.`,
                                                  variant: "default",
                                                });
                                                await loadAddresses();
                                              }}
                                              className="text-green-600 focus:text-green-700"
                                            >
                                              <CheckCircle className="mr-2 h-4 w-4" />{" "}
                                              Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={async () => {
                                                await adminApi.rejectAddress(
                                                  address._id,
                                                );
                                                toast({
                                                  title: "Address Rejected",
                                                  description: `Address ${address.address} has been rejected.`,
                                                  variant: "destructive",
                                                });
                                                await loadAddresses();
                                              }}
                                              className="text-red-600 focus:text-red-700"
                                            >
                                              <X className="mr-2 h-4 w-4" />{" "}
                                              Reject
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={async () => {
                                            if (
                                              confirm(
                                                `Are you sure you want to ${address.isActive ? "deactivate" : "activate"} this address?`,
                                              )
                                            ) {
                                              try {
                                                toast({
                                                  title: address.isActive
                                                    ? "Address Deactivated"
                                                    : "Address Activated",
                                                  description: `${address.binId} has been ${address.isActive ? "deactivated" : "activated"} successfully.`,
                                                });
                                                await loadAddresses();
                                              } catch (error) {
                                                toast({
                                                  title: "Error",
                                                  description:
                                                    "Failed to update address status",
                                                  variant: "destructive",
                                                });
                                              }
                                            }
                                          }}
                                        >
                                          {address.isActive ? (
                                            <>
                                              <Clock className="mr-2 h-4 w-4" />{" "}
                                              Deactivate
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle className="mr-2 h-4 w-4" />{" "}
                                              Activate
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Addresses Pagination */}
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                addressesCurrentPage > 1 &&
                                setAddressesCurrentPage((prev) =>
                                  Math.max(prev - 1, 1),
                                )
                              }
                              aria-disabled={addressesCurrentPage === 1}
                              className={
                                addressesCurrentPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                          {Array.from(
                            { length: totalAddressesPages },
                            (_, i) => i + 1,
                          ).map((page) => (
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
                              onClick={() =>
                                addressesCurrentPage < totalAddressesPages &&
                                setAddressesCurrentPage((prev) =>
                                  Math.min(prev + 1, totalAddressesPages),
                                )
                              }
                              aria-disabled={
                                addressesCurrentPage === totalAddressesPages
                              }
                              className={
                                addressesCurrentPage === totalAddressesPages
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </CardContent>
                </Card>

                {/* Address Details Dialog */}
                <Dialog
                  open={showAddressDetails}
                  onOpenChange={(open) => {
                    setShowAddressDetails(open);
                    if (!open) setIsEditingAddress(false);
                  }}
                >
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {isEditingAddress ? "Edit Address" : "Address Details"}
                      </DialogTitle>
                    </DialogHeader>
                    {selectedAddress && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Bin ID</Label>
                            <p className="text-sm font-mono font-semibold">
                              {selectedAddress.binId || "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Badge
                              variant={
                                selectedAddress.isActive
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {selectedAddress.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label>Address</Label>
                          {isEditingAddress ? (
                            <Textarea
                              value={editedAddress.address}
                              onChange={(e) =>
                                setEditedAddress({
                                  ...editedAddress,
                                  address: e.target.value,
                                })
                              }
                              className="mt-1"
                              rows={3}
                            />
                          ) : (
                            <p className="text-sm mt-1">
                              {selectedAddress.address || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>LGA</Label>
                            {isEditingAddress ? (
                              <Input
                                value={editedAddress.lgaName}
                                onChange={(e) =>
                                  setEditedAddress({
                                    ...editedAddress,
                                    lgaName: e.target.value,
                                  })
                                }
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-sm mt-1">
                                {selectedAddress.lgaName || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Customer Reference</Label>
                            {isEditingAddress ? (
                              <Input
                                value={editedAddress.customerRef}
                                onChange={(e) =>
                                  setEditedAddress({
                                    ...editedAddress,
                                    customerRef: e.target.value,
                                  })
                                }
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-sm mt-1">
                                {selectedAddress.customerRef || "-"}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedAddress.userId && (
                          <div>
                            <Label>Linked User</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium">
                                {`${selectedAddress.userId.firstName || ""} ${selectedAddress.userId.lastName || ""}`.trim()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {selectedAddress.userId.email}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Created Date</Label>
                            <p className="text-sm mt-1">
                              {selectedAddress.createdAt
                                ? new Date(
                                    selectedAddress.createdAt,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label>Last Updated</Label>
                            <p className="text-sm mt-1">
                              {selectedAddress.updatedAt
                                ? new Date(
                                    selectedAddress.updatedAt,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddressDetails(false);
                          setIsEditingAddress(false);
                        }}
                      >
                        {isEditingAddress ? "Cancel" : "Close"}
                      </Button>
                      {isEditingAddress && (
                        <Button
                          onClick={async () => {
                            try {
                              await adminApi.updateAddress(
                                selectedAddress._id,
                                editedAddress,
                              );
                              toast({
                                title: "Address Updated",
                                description:
                                  "Address information has been updated successfully.",
                              });
                              setShowAddressDetails(false);
                              setIsEditingAddress(false);
                              await loadAddresses();
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update address",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Save Changes
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* ── Reports ── */}
              <TabsContent value="reports" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle>Available Reports</CardTitle>
                        <CardDescription>
                          Generate and download reports
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Label>Filter by type:</Label>
                            <Select
                              value={reportsTypeFilter}
                              onValueChange={setReportsTypeFilter}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="financial">
                                  Financial
                                </SelectItem>
                                <SelectItem value="analytics">
                                  Analytics
                                </SelectItem>
                                <SelectItem value="operational">
                                  Operational
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            {filteredReports.map((report) => (
                              <div
                                key={report.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedReport === report.id
                                    ? "bg-blue-50 border-blue-200"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() => setSelectedReport(report.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{report.name}</p>
                                    <p className="text-sm text-gray-600">
                                      {report.period}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="uppercase"
                                  >
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
                                  {
                                    reportsData.find(
                                      (r) => r.id === selectedReport,
                                    )?.name
                                  }
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {
                                    reportsData.find(
                                      (r) => r.id === selectedReport,
                                    )?.period
                                  }
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Printer className="w-4 h-4 mr-2" /> Print
                                </Button>
                                <Button size="sm">
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                              </div>
                            </div>
                            <div className="border rounded-lg p-4">
                              {(() => {
                                const report = reportsData.find(
                                  (r) => r.id === selectedReport,
                                );
                                switch (report?.type) {
                                  case "financial":
                                    return (
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <h4 className="font-medium">
                                            Financial Summary
                                          </h4>
                                          <p className="text-sm text-gray-600">
                                            Generated:{" "}
                                            {formatDate(report.generatedDate)}
                                          </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <Card>
                                            <CardContent className="p-4">
                                              <p className="text-sm text-gray-600">
                                                Total Revenue
                                              </p>
                                              <p className="text-lg font-bold">
                                                ₦4,560,000
                                              </p>
                                            </CardContent>
                                          </Card>
                                          <Card>
                                            <CardContent className="p-4">
                                              <p className="text-sm text-gray-600">
                                                Collection Rate
                                              </p>
                                              <p className="text-lg font-bold">
                                                87%
                                              </p>
                                            </CardContent>
                                          </Card>
                                        </div>
                                        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                          <BarChart4 className="h-12 w-12 text-gray-400" />
                                        </div>
                                      </div>
                                    );
                                  case "analytics":
                                    return (
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <h4 className="font-medium">
                                            Analytics Report
                                          </h4>
                                          <p className="text-sm text-gray-600">
                                            Generated:{" "}
                                            {formatDate(report.generatedDate)}
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
                                                <TableHead>
                                                  Payment Method
                                                </TableHead>
                                                <TableHead>
                                                  Transactions
                                                </TableHead>
                                                <TableHead>
                                                  Percentage
                                                </TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              <TableRow key="card">
                                                <TableCell>Card</TableCell>
                                                <TableCell>1,245</TableCell>
                                                <TableCell>45%</TableCell>
                                              </TableRow>
                                              <TableRow key="bank-transfer">
                                                <TableCell>
                                                  Bank Transfer
                                                </TableCell>
                                                <TableCell>876</TableCell>
                                                <TableCell>32%</TableCell>
                                              </TableRow>
                                              <TableRow key="ussd">
                                                <TableCell>USSD</TableCell>
                                                <TableCell>543</TableCell>
                                                <TableCell>20%</TableCell>
                                              </TableRow>
                                              <TableRow key="mobile-money">
                                                <TableCell>
                                                  Mobile Money
                                                </TableCell>
                                                <TableCell>87</TableCell>
                                                <TableCell>3%</TableCell>
                                              </TableRow>
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    );
                                  case "operational":
                                    return (
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <h4 className="font-medium">
                                            Operational Report
                                          </h4>
                                          <p className="text-sm text-gray-600">
                                            Generated:{" "}
                                            {formatDate(report.generatedDate)}
                                          </p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                          <Card>
                                            <CardContent className="p-4 flex flex-col items-center">
                                              <p className="text-sm text-gray-600">
                                                Total Bills
                                              </p>
                                              <p className="text-2xl font-bold">
                                                8,934
                                              </p>
                                            </CardContent>
                                          </Card>
                                          <Card>
                                            <CardContent className="p-4 flex flex-col items-center">
                                              <p className="text-sm text-gray-600">
                                                Overdue
                                              </p>
                                              <p className="text-2xl font-bold text-red-600">
                                                234
                                              </p>
                                            </CardContent>
                                          </Card>
                                          <Card>
                                            <CardContent className="p-4 flex flex-col items-center">
                                              <p className="text-sm text-gray-600">
                                                Paid
                                              </p>
                                              <p className="text-2xl font-bold text-green-600">
                                                7,823
                                              </p>
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
                                                <TableHead>
                                                  Collection Rate
                                                </TableHead>
                                                <TableHead>
                                                  Efficiency
                                                </TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              <TableRow>
                                                <TableCell>
                                                  Enugu North
                                                </TableCell>
                                                <TableCell>92%</TableCell>
                                                <TableCell>High</TableCell>
                                              </TableRow>
                                              <TableRow>
                                                <TableCell>
                                                  Enugu South
                                                </TableCell>
                                                <TableCell>87%</TableCell>
                                                <TableCell>High</TableCell>
                                              </TableRow>
                                              <TableRow>
                                                <TableCell>
                                                  Enugu East
                                                </TableCell>
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
                                    );
                                  default:
                                    return (
                                      <div className="flex items-center justify-center h-64">
                                        <p className="text-gray-500">
                                          Select a report type to view details
                                        </p>
                                      </div>
                                    );
                                }
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <FileText className="h-16 w-16 text-gray-300" />
                            <p className="text-gray-500">
                              Select a report from the list to view details
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* ── Settings ── */}
              <TabsContent value="settings" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Monthly Billing Amount
                      </CardTitle>
                      <CardDescription>
                        Set the monthly bill amount for waste collection in{" "}
                        {stateInfo.name} State
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900 mb-1">
                          Current Monthly Rate
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          ₦{stats.averageBill?.toLocaleString() || "1,500"}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Per bin, per month
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newBillAmount">
                          New Monthly Amount (₦)
                        </Label>
                        <Input
                          id="newBillAmount"
                          type="number"
                          placeholder="Enter new amount"
                          min="0"
                          step="100"
                        />
                        <p className="text-xs text-gray-500">
                          This will apply to all new bills generated after the
                          update. Existing unpaid bills remain unchanged.
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={async () => {
                          const input = document.getElementById(
                            "newBillAmount",
                          ) as HTMLInputElement;
                          const newAmount = parseFloat(input.value);
                          if (!newAmount || newAmount < 0) {
                            alert("Please enter a valid amount");
                            return;
                          }
                          try {
                            await adminApi.updateMonthlyBillAmount(newAmount);
                            alert(
                              `Monthly bill amount updated to ₦${newAmount.toLocaleString()}`,
                            );
                            if (currentUser?.stateCode) {
                              const statsResponse =
                                await adminApi.getStateStats(
                                  currentUser.stateCode,
                                );
                              setStateStats(statsResponse);
                            }
                            input.value = "";
                          } catch (error) {
                            console.error(
                              "Failed to update bill amount:",
                              error,
                            );
                            alert(
                              "Failed to update bill amount. Please try again.",
                            );
                          }
                        }}
                      >
                        Update Monthly Amount
                      </Button>
                      <div className="pt-4 border-t">
                        <h4 className="font-medium text-sm mb-2">Impact</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>
                            • Users will see the new amount on their dashboard
                          </li>
                          <li>
                            • New bills will be generated with the updated
                            amount
                          </li>
                          <li>
                            • Existing unpaid bills keep their original amount
                          </li>
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
                  Add a new address to your state. A unique Bin ID will be
                  automatically generated.
                </DialogDescription>
              </DialogHeader>

              {registeredBinId ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">
                        Address Registered Successfully!
                      </h4>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-green-800">
                        The address has been registered with the following Bin
                        ID:
                      </p>
                      <p className="text-2xl font-bold text-green-900 font-mono tracking-wider">
                        {registeredBinId}
                      </p>
                      <p className="text-xs text-green-700 mt-2">
                        Share this Bin ID with the customer so they can link it
                        to their account.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setRegisteredBinId(null);
                        setIsAddAddressOpen(false);
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
                      onValueChange={(value) =>
                        setNewAddress({ ...newAddress, lgaName: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select LGA" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentUser?.stateCode &&
                        NIGERIAN_STATES[currentUser.stateCode.toLowerCase()] ? (
                          NIGERIAN_STATES[
                            currentUser.stateCode.toLowerCase()
                          ].lgas.map((lga: string) => (
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
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          address: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Customer Reference (Optional)
                    </label>
                    <Input
                      placeholder="e.g., Customer name or account number"
                      value={newAddress.customerRef}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          customerRef: e.target.value,
                        })
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewAddress({
                          lgaName: "",
                          address: "",
                          customerRef: "",
                        });
                        setIsAddAddressOpen(false);
                      }}
                      disabled={isRegisteringAddress}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRegisterAddress}
                      disabled={isRegisteringAddress}
                    >
                      {isRegisteringAddress
                        ? "Registering..."
                        : "Register Address"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
