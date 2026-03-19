"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MapPin,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { authApi, billsApi, paymentsApi, adminApi } from "@/lib/api";
import { useToast, toast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const router = useRouter();
  const { toast: showToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pay-bill");
  const [billLookup, setBillLookup] = useState({
    state: "",
    binId: "",
    customerRef: "",
  });
  const [foundBill, setFoundBill] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalPaid: 0,
    activeBins: 0,
    dueSoon: 0,
    thisMonth: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [addressSearch, setAddressSearch] = useState({
    address: "",
    stateCode: "",
    lgaName: "",
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userBins, setUserBins] = useState<any[]>([]);
  const [isLoadingBins, setIsLoadingBins] = useState(false);

  // FIX: track whether the user has searched so we can show register form
  const [hasSearched, setHasSearched] = useState(false);
  const [isRegisteringAddress, setIsRegisteringAddress] = useState(false);
  const [registeredBinId, setRegisteredBinId] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [stateBillingInfo, setStateBillingInfo] = useState<{
    monthlyBillAmount: number;
    stateCode: string;
    stateName: string;
    billCycle: string;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;
        if (!token) {
          router.push("/login");
          return;
        }

        const currentUser = await authApi.getCurrentUser();
        if (currentUser.role !== "USER") {
          router.push("/login");
          return;
        }
        setUser(currentUser);

        await Promise.all([
          loadStats(),
          loadPaymentHistory(),
          loadUpcomingBills(),
          loadUserBins(),
          loadNotifications(),
        ]);

        // Warn if no bins linked yet
        try {
          const bins = await billsApi.getUserBins();
          if (!bins.bins || bins.bins.length === 0) {
            setError(
              "You are not linked to any bin. Go to Profile to register or link your address.",
            );
          }
        } catch (_) {}
      } catch (err: any) {
        console.error("Authentication error:", err);
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
        router.push("/login");
      } finally {
        setIsInitialLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const loadPaymentHistory = async () => {
    try {
      setIsLoadingPayments(true);
      const response = await paymentsApi.getAll();
      const arr = Array.isArray(response) ? response : response.payments || [];
      setRecentPayments(arr.slice(0, 5));
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const loadUpcomingBills = async () => {
    try {
      setIsLoadingBills(true);
      const response = await billsApi.getAll();
      const arr = Array.isArray(response) ? response : response.bills || [];
      setUpcomingBills(
        arr.filter((b: any) => b.status === "pending").slice(0, 3),
      );
    } catch (err) {
      console.error("Failed to load bills:", err);
    } finally {
      setIsLoadingBills(false);
    }
  };

  const loadUserBins = async () => {
    try {
      setIsLoadingBins(true);
      const response = await billsApi.getUserBins();
      setUserBins(response.bins || []);
      if (response.bins && response.bins.length > 0) {
        try {
          const billingInfo = await billsApi.getStateBilling(
            response.bins[0].stateCode,
          );
          setStateBillingInfo(billingInfo);
        } catch (_) {}
      }
    } catch (err) {
      console.error("Failed to load user bins:", err);
    } finally {
      setIsLoadingBins(false);
    }
  };

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await billsApi.getUserStats();
      setStats(response.stats);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // FIX: use billsApi.getNotifications() which hits /bills/notifications
  // (the user notification endpoint, not the admin one)
  const loadNotifications = async () => {
    try {
      const response = await billsApi.getNotifications();
      const notifs = response.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const handleAddressSearch = async () => {
    if (!addressSearch.address && !addressSearch.stateCode) {
      setError("Please enter an address or select a state");
      return;
    }
    try {
      setError("");
      setIsSearching(true);
      setHasSearched(false);
      const response = await billsApi.searchAddress(addressSearch);
      setSearchResults(response.results || []);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || "Failed to search addresses");
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkBin = async (binId: string) => {
    try {
      setError("");
      await billsApi.linkBin(binId);
      setShowAddressSearch(false);
      setSearchResults([]);
      setHasSearched(false);
      setAddressSearch({ address: "", stateCode: "", lgaName: "" });
      await loadUserBins();
      showToast({ title: "Bin linked successfully!" });
    } catch (err: any) {
      let errorMsg = err?.message || "Failed to link bin";
      if (err?.data?.error) errorMsg = err.data.error;
      setError(errorMsg);
    }
  };

  const handleUnlinkBin = async (binId: string) => {
    if (!confirm("Are you sure you want to unlink this bin?")) return;
    try {
      setError("");
      await billsApi.unlinkBin(binId);
      await loadUserBins();
      showToast({ title: "Bin unlinked successfully" });
    } catch (err: any) {
      setError(err.message || "Failed to unlink bin");
    }
  };

  // FIX: address registration now a dedicated handler that calls billsApi.registerAddress
  // It no longer requires stateCode from the form — the backend reads it from the JWT token
  const handleRegisterAddress = async () => {
    const { address, lgaName } = addressSearch;
    if (!address || !lgaName) {
      setError("Please enter both an address and select an LGA to register.");
      return;
    }
    try {
      setIsRegisteringAddress(true);
      setError("");
      const response = await billsApi.registerAddress({
        address,
        lgaName,
        stateCode: addressSearch.stateCode, // optional — backend uses JWT stateCode
      });
      setRegisteredBinId(response.binRegistration?.binId || null);
      showToast({
        title: "Address submitted for approval",
        description:
          "Your state admin will review and approve your address. You will be notified.",
      });
      setShowAddressSearch(false);
      setHasSearched(false);
      setAddressSearch({ address: "", stateCode: "", lgaName: "" });
      setSearchResults([]);
      // Reload notifications so the user can see any immediate feedback
      await loadNotifications();
    } catch (err: any) {
      setError(err?.message || "Failed to register address");
    } finally {
      setIsRegisteringAddress(false);
    }
  };

  // FIX: logout now removes "accessToken" (the key used during login/register)
  // Previously it removed "token" which was never set, so logout had no effect
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleBillLookup = async () => {
    if (!billLookup.binId || !billLookup.state) {
      setFoundBill(null);
      return;
    }
    try {
      setError("");
      const response = await billsApi.getByBinId(billLookup.binId);
      if (!response.binRegistration) {
        setError("Bin ID not found");
        setFoundBill(null);
        return;
      }
      if (!response.currentBill) {
        setError(
          "No active bill found for this bin. Try linking it to your account.",
        );
        setFoundBill(null);
        return;
      }
      setFoundBill(response.currentBill);
    } catch (err: any) {
      setError(err?.message || "Failed to lookup bill");
      setFoundBill(null);
    }
  };

  const downloadBillPDF = async (billId: string, binId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        showToast({
          title: "Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/bills/${billId}/download`,
        { method: "GET", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        showToast({
          title: "Error",
          description: "Failed to download bill",
          variant: "destructive",
        });
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bill-${binId}-${billId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast({ title: "Bill downloaded successfully" });
    } catch (err) {
      showToast({
        title: "Error",
        description: "Failed to download bill",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async (
    billId: string,
    amount: number,
    method: "CARD" | "BANK_TRANSFER" | "USSD" | "MOBILE_MONEY" = "CARD",
  ) => {
    try {
      setError("");
      const response = await paymentsApi.initialize({ billId, method });
      if (response.paystack?.authorizationUrl) {
        window.location.href = response.paystack.authorizationUrl;
      } else {
        setError("Failed to initialize payment. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment");
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/90 border-b shadow-sm backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo href="/" size="sm" />
              <nav className="hidden md:flex items-center space-x-2">
                {["pay-bill", "history", "my-bins", "profile"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded-md text-sm font-medium capitalize ${
                      activeTab === tab
                        ? "bg-green-100 text-green-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.replace("-", " ")}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification bell with unread badge */}
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
                    {user?.firstName || "User"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                    <User className="w-4 h-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("my-bins")}>
                    <Trash2 className="w-4 h-4 mr-2" /> My Bins
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-8 max-w-7xl">
        {/* Welcome */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary mb-2 tracking-tight">
            Welcome back, {user?.firstName || "User"}!
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Manage your{" "}
            <span className="font-semibold text-green-700">
              waste bin payments
            </span>{" "}
            across Nigeria
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Registered bin ID success banner */}
        {registeredBinId && (
          <Alert className="mb-6 border-green-600 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <span className="font-semibold">Address submitted!</span> Your Bin
              ID is{" "}
              <span className="font-mono font-bold">{registeredBinId}</span>.
              You will be notified once approved by your state admin.{" "}
              <button
                className="underline ml-2"
                onClick={() => setRegisteredBinId(null)}
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}

        {stateBillingInfo && (
          <Alert className="mb-6 border-green-600 bg-green-50">
            <CreditCard className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <span className="font-semibold">
                {stateBillingInfo.stateName} Monthly Billing:
              </span>{" "}
              ₦{stateBillingInfo.monthlyBillAmount.toLocaleString()} per bin (
              {stateBillingInfo.billCycle})
            </AlertDescription>
          </Alert>
        )}

        {/* Bin Full Alert Button */}
        <Alert className="mb-6 border-yellow-600 bg-yellow-50">
          <AlertDescription className="text-yellow-900">
            <div className="flex justify-center">
              <Button
                className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-all duration-200 text-lg flex items-center gap-2"
                onClick={async () => {
                  setError("");
                  try {
                    await adminApi.notifyBinFull();
                    showToast({
                      title: "Admin notified",
                      description:
                        "Your state admin has been notified that your bin is full.",
                    });
                  } catch (err: any) {
                    let msg =
                      err?.data?.error ||
                      err?.message ||
                      "Failed to notify state admin.";
                    setError(msg);
                  }
                }}
              >
                <span>🗑️</span>
                Bin Full? Notify State Admin
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Quick Stats — 2x2 on mobile, 4 across on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-10">
          {/* Total Paid */}
          <Card className="bg-gradient-to-br from-green-100/80 to-green-50 border-green-200 shadow-md">
            <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-14 sm:h-14 bg-green-200 rounded-xl flex items-center justify-center shadow shrink-0">
                <CreditCard className="w-5 h-5 sm:w-7 sm:h-7 text-green-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-green-800">
                  Total Paid
                </p>
                <p className="text-base sm:text-2xl font-extrabold text-green-900 truncate">
                  {isLoadingStats ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `₦${stats.totalPaid.toLocaleString()}`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Active Bins */}
          <Card className="bg-gradient-to-br from-blue-100/80 to-blue-50 border-blue-200 shadow-md">
            <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-14 sm:h-14 bg-blue-200 rounded-xl flex items-center justify-center shadow shrink-0">
                <Trash2 className="w-5 h-5 sm:w-7 sm:h-7 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-blue-800">
                  Active Bins
                </p>
                <p className="text-base sm:text-2xl font-extrabold text-blue-900">
                  {isLoadingBins ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    userBins.length
                  )}
                </p>
                <button
                  onClick={() => setActiveTab("my-bins")}
                  className="text-xs text-blue-600 font-medium mt-0.5 hover:underline"
                >
                  View →
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Due Soon */}
          <Card className="bg-gradient-to-br from-orange-100/80 to-yellow-50 border-orange-200 shadow-md">
            <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-14 sm:h-14 bg-orange-200 rounded-xl flex items-center justify-center shadow shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-7 sm:h-7 text-orange-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-orange-800">
                  Due Soon
                </p>
                {isLoadingBills ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : upcomingBills.length > 0 ? (
                  <>
                    <p className="text-base sm:text-2xl font-extrabold text-orange-900 truncate">
                      ₦{upcomingBills[0].amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      Due{" "}
                      {new Date(upcomingBills[0].dueDate).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p className="text-base sm:text-2xl font-extrabold text-orange-900">
                    ₦0
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card className="bg-gradient-to-br from-purple-100/80 to-pink-50 border-purple-200 shadow-md">
            <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-14 sm:h-14 bg-purple-200 rounded-xl flex items-center justify-center shadow shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-purple-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-purple-800">
                  This Month
                </p>
                <p className="text-base sm:text-2xl font-extrabold text-purple-900 truncate">
                  {isLoadingPayments ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `₦${recentPayments
                      .filter((p) => {
                        const d = new Date(p.paidAt || p.createdAt);
                        const now = new Date();
                        return (
                          d.getMonth() === now.getMonth() &&
                          d.getFullYear() === now.getFullYear()
                        );
                      })
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Pay Bill Tab ─── */}
        {activeTab === "pay-bill" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Pay Your Bill
                  </CardTitle>
                  <CardDescription>
                    Enter your bin ID to lookup and pay your bill
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={billLookup.state}
                      onValueChange={(v) =>
                        setBillLookup((p) => ({ ...p, state: v }))
                      }
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
                        <SelectItem value="enugu">Enugu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="binId">Waste Bin ID</Label>
                    <Input
                      id="binId"
                      value={billLookup.binId}
                      onChange={(e) =>
                        setBillLookup((p) => ({ ...p, binId: e.target.value }))
                      }
                      placeholder="e.g., LG001234"
                    />
                  </div>
                  <Button className="w-full" onClick={handleBillLookup}>
                    <Search className="w-4 h-4 mr-2" /> Lookup Bill
                  </Button>
                </CardContent>
              </Card>

              {foundBill && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-green-600">
                      Bill Found!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Bin ID</Label>
                        <p className="font-semibold text-blue-600">
                          {foundBill.binId}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">
                          Amount Due
                        </Label>
                        <p className="font-semibold text-lg">
                          ₦{foundBill.amount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          "CARD",
                          "BANK_TRANSFER",
                          "USSD",
                          "MOBILE_MONEY",
                        ] as const
                      ).map((method) => (
                        <Button
                          key={method}
                          variant={method === "CARD" ? "default" : "outline"}
                          onClick={() =>
                            handlePayment(
                              foundBill._id,
                              foundBill.amount,
                              method,
                            )
                          }
                          disabled={foundBill.status === "paid"}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {method.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        downloadBillPDF(foundBill._id, foundBill.binId)
                      }
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Bill
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" /> Upcoming Bills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingBills ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                  ) : upcomingBills.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No upcoming bills
                    </p>
                  ) : (
                    upcomingBills.map((bill) => (
                      <div key={bill._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={
                              bill.status === "overdue"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {bill.status === "overdue" ? "Overdue" : "Pending"}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(bill.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-blue-600">
                          {bill.binRegistration?.binId}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          ₦{bill.amount.toLocaleString()}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handlePayment(bill._id, bill.amount, "CARD")
                            }
                          >
                            <CreditCard className="w-3 h-3 mr-1" /> Card
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handlePayment(
                                bill._id,
                                bill.amount,
                                "BANK_TRANSFER",
                              )
                            }
                          >
                            Bank
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

        {/* ─── Payment History Tab ─── */}
        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" /> Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : recentPayments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No payment history
                </p>
              ) : (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Trash2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">
                            {payment.bill?.binRegistration?.binId}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ₦{payment.amount.toLocaleString()}
                        </p>
                        <Badge
                          variant={
                            payment.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── My Bins Tab ─── */}
        {activeTab === "my-bins" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trash2 className="w-5 h-5 mr-2" /> My Active Bins
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
                  <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No linked bins yet</p>
                  <Button onClick={() => setActiveTab("profile")}>
                    <Plus className="w-4 h-4 mr-2" /> Register or Find My Bin
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBins.map((bin: any) => (
                    <div key={bin._id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className="text-blue-600 border-blue-600 font-mono"
                            >
                              {bin.binId}
                            </Badge>
                            {bin.isActive && (
                              <Badge className="bg-green-600">Active</Badge>
                            )}
                            {bin.status === "PENDING" && (
                              <Badge className="bg-yellow-500">
                                Pending Approval
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{bin.address}</p>
                          <p className="text-sm text-gray-600">
                            {bin.lgaName}, {bin.stateCode?.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnlinkBin(bin.binId)}
                            className="text-red-600"
                          >
                            Unlink
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("profile")}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Link Another Bin
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Notifications Tab ─── */}
        {activeTab === "notifications" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" /> Notifications
                </span>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} unread</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    You'll be notified when your address is approved or rejected
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-4 border rounded-lg ${n.isRead ? "bg-white" : "bg-blue-50 border-blue-200"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {!n.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                            {n.type === "ADDRESS_APPROVED" && (
                              <Badge className="bg-green-100 text-green-700">
                                Address Approved ✅
                              </Badge>
                            )}
                            {n.type === "ADDRESS_REJECTED" && (
                              <Badge className="bg-red-100 text-red-700">
                                Address Rejected ❌
                              </Badge>
                            )}
                            {n.type === "NEW_BILL" && (
                              <Badge className="bg-blue-100 text-blue-700">
                                New Bill
                              </Badge>
                            )}
                            {n.type === "OVERDUE_BILL" && (
                              <Badge className="bg-red-100 text-red-700">
                                Overdue Bill
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900">
                            {n.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {n.message}
                          </p>
                          {/* Show bin ID prominently for approved addresses */}
                          {n.type === "ADDRESS_APPROVED" &&
                            n.metadata?.binId && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-800">
                                  Your Bin ID:{" "}
                                  <span className="font-mono font-bold text-green-900">
                                    {n.metadata.binId}
                                  </span>
                                </span>
                              </div>
                            )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!n.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await billsApi.markNotificationRead(n._id);
                                setNotifications((prev) =>
                                  prev.map((x) =>
                                    x._id === n._id
                                      ? { ...x, isRead: true }
                                      : x,
                                  ),
                                );
                                setUnreadCount((c) => Math.max(0, c - 1));
                              } catch (_) {}
                            }}
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        try {
                          await billsApi.markAllNotificationsRead();
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, isRead: true })),
                          );
                          setUnreadCount(0);
                        } catch (_) {}
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

        {/* ─── Profile Tab ─── */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    defaultValue={`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} readOnly />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input defaultValue={user?.phone} readOnly />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    defaultValue={
                      user?.stateCode?.toUpperCase() || "Not assigned"
                    }
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Bins & Address Registration</CardTitle>
                <CardDescription>
                  Link an existing bin or register a new address for approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing bins */}
                {userBins.length > 0 && (
                  <div className="space-y-2">
                    {userBins.map((bin: any) => (
                      <div
                        key={bin._id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-blue-600 font-mono">
                            {bin.binId}
                          </p>
                          <p className="text-sm text-gray-600">{bin.address}</p>
                          {bin.status === "PENDING" && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs mt-1">
                              Pending Admin Approval
                            </Badge>
                          )}
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
                )}

                {!showAddressSearch ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowAddressSearch(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Find or Register My Bin
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Search for Your Address</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddressSearch(false);
                          setSearchResults([]);
                          setHasSearched(false);
                          setAddressSearch({
                            address: "",
                            stateCode: "",
                            lgaName: "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div>
                      <Label>Address</Label>
                      <Input
                        placeholder="e.g., 123 Main Street"
                        value={addressSearch.address}
                        onChange={(e) =>
                          setAddressSearch((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Select
                        value={addressSearch.stateCode}
                        onValueChange={(v) =>
                          setAddressSearch((p) => ({ ...p, stateCode: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lagos">Lagos</SelectItem>
                          <SelectItem value="fct">FCT (Abuja)</SelectItem>
                          <SelectItem value="enugu">Enugu</SelectItem>
                          <SelectItem value="rivers">Rivers</SelectItem>
                          <SelectItem value="anambra">Anambra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleAddressSearch}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Search Existing Addresses
                    </Button>

                    {/* Search results */}
                    {hasSearched && searchResults.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Found {searchResults.length} address(es):
                        </p>
                        {searchResults.map((result: any) => (
                          <div
                            key={result.binId}
                            className="flex items-center justify-between p-3 border rounded bg-white"
                          >
                            <div>
                              <p className="font-mono font-medium text-blue-600">
                                {result.binId}
                              </p>
                              <p className="text-sm text-gray-600">
                                {result.address}
                              </p>
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

                    {/* FIX: show register form when search has been done and found nothing,
                        OR always show it as an alternative below the search results */}
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        {hasSearched && searchResults.length === 0
                          ? "No address found. Register a new one:"
                          : "Or register a new address:"}
                      </p>
                      <div className="space-y-3">
                        <div>
                          <Label>LGA *</Label>
                          <Input
                            placeholder="e.g., Ikeja"
                            value={addressSearch.lgaName}
                            onChange={(e) =>
                              setAddressSearch((p) => ({
                                ...p,
                                lgaName: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Your state (
                          {user?.stateCode?.toUpperCase() || "unknown"}) will be
                          used automatically. The address and LGA above will be
                          submitted.
                        </p>
                        <Button
                          className="w-full"
                          onClick={handleRegisterAddress}
                          disabled={
                            isRegisteringAddress ||
                            !addressSearch.address ||
                            !addressSearch.lgaName
                          }
                        >
                          {isRegisteringAddress ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                              Submitting...
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4 mr-2" /> Submit Address
                              for Approval
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-400 text-center">
                          Your state admin will review and approve your address.
                          You'll be notified when done.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
