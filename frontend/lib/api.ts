// API Configuration and utilities
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { requiresAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }

  if (requiresAuth) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || "An error occurred",
      data,
    );
  }

  return data;
}

// Auth API
export const authApi = {
  login: async (credentials: {
    email?: string;
    phone?: string;
    password: string;
  }) => {
    const data = await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken)
      localStorage.setItem("refreshToken", data.refreshToken);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  register: async (userData: {
    email: string;
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
    stateCode?: string;
    lgaId?: string;
    address?: string;
  }) => {
    const data = await fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken)
      localStorage.setItem("refreshToken", data.refreshToken);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token available");
    const data = await fetchApi("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
    return data;
  },

  getCurrentUser: async () => {
    const data = await fetchApi("/auth/me", { requiresAuth: true });
    return data.user || data;
  },

  // FIX: logout clears all three keys set during login/register
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
};

// Bills API (user-facing)
export const billsApi = {
  // Register a new address for approval
  registerAddress: async (data: {
    lgaName: string;
    address: string;
    stateCode?: string;
    customerRef?: string;
  }) => {
    return fetchApi("/admin/addresses/register", {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  getAll: async (filters?: {
    status?: string;
    lgaId?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return fetchApi(`/bills?${params.toString()}`, { requiresAuth: true });
  },

  getById: async (id: string) => {
    return fetchApi(`/bills/${id}`, { requiresAuth: true });
  },

  getByBinId: async (binId: string) => {
    return fetchApi(`/bills/lookup/${binId}`, { requiresAuth: true });
  },

  create: async (billData: any) => {
    return fetchApi("/bills", {
      method: "POST",
      body: JSON.stringify(billData),
      requiresAuth: true,
    });
  },

  registerBin: async (data: {
    stateCode: string;
    lgaName: string;
    address: string;
    customerRef?: string;
  }) => {
    return fetchApi("/bills/bins/register", {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  getUserBins: async () => {
    return fetchApi("/bills/bins", { requiresAuth: true });
  },

  searchAddress: async (params: {
    address?: string;
    stateCode?: string;
    lgaName?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.address) queryParams.append("address", params.address);
    if (params.stateCode) queryParams.append("stateCode", params.stateCode);
    if (params.lgaName) queryParams.append("lgaName", params.lgaName);
    return fetchApi(`/bills/bins/search?${queryParams.toString()}`, {
      requiresAuth: true,
    });
  },

  linkBin: async (binId: string) => {
    return fetchApi("/bills/bins/link", {
      method: "POST",
      body: JSON.stringify({ binId }),
      requiresAuth: true,
    });
  },

  unlinkBin: async (binId: string) => {
    return fetchApi("/bills/bins/unlink", {
      method: "POST",
      body: JSON.stringify({ binId }),
      requiresAuth: true,
    });
  },

  getUserStats: async () => {
    return fetchApi("/bills/user/stats", { requiresAuth: true });
  },

  // User notifications (hits /bills/notifications — user-specific route)
  getNotifications: async () => {
    return fetchApi("/bills/notifications", { requiresAuth: true });
  },

  markNotificationRead: async (notificationId: string) => {
    return fetchApi(`/bills/notifications/${notificationId}/read`, {
      method: "PUT",
      requiresAuth: true,
    });
  },

  markAllNotificationsRead: async () => {
    return fetchApi("/bills/notifications/mark-all-read", {
      method: "PUT",
      requiresAuth: true,
    });
  },

  getStateBilling: async (stateCode: string) => {
    return fetchApi(`/bills/state-billing/${stateCode}`, {
      requiresAuth: false,
    });
  },
};

// Payments API
export const paymentsApi = {
  getAll: async (filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return fetchApi(`/payments?${params.toString()}`, { requiresAuth: true });
  },

  getById: async (id: string) => {
    return fetchApi(`/payments/${id}`, { requiresAuth: true });
  },

  initialize: async (paymentData: {
    billId: string;
    method: "CARD" | "BANK_TRANSFER" | "USSD" | "MOBILE_MONEY";
  }) => {
    return fetchApi("/payments/initialize", {
      method: "POST",
      body: JSON.stringify(paymentData),
      requiresAuth: true,
    });
  },

  verify: async (reference: string) => {
    return fetchApi(`/payments/verify/${reference}`, { requiresAuth: true });
  },
};

// Admin API
export const adminApi = {
  // Approve address registration — expects MongoDB _id of the BinRegistration document
  approveAddress: async (addressId: string) => {
    return fetchApi(`/admin/addresses/${addressId}/approve`, {
      method: "PATCH",
      requiresAuth: true,
    });
  },

  // Reject address registration — expects MongoDB _id of the BinRegistration document
  rejectAddress: async (addressId: string) => {
    return fetchApi(`/admin/addresses/${addressId}/reject`, {
      method: "PATCH",
      requiresAuth: true,
    });
  },

  // Get notifications for the logged-in state admin
  getNotifications: async () => {
    return fetchApi("/admin/notifications", { requiresAuth: true });
  },

  // FIX: added admin mark-notification-read endpoint
  markNotificationRead: async (notificationId: string) => {
    return fetchApi(`/admin/notifications/${notificationId}/read`, {
      method: "PUT",
      requiresAuth: true,
    });
  },

  notifyBinFull: async () => {
    return fetchApi("/admin/notify-bin-full", {
      method: "POST",
      requiresAuth: true,
    });
  },

  sendBulkOverdueNotifications: async (stateCode: string) => {
    return fetchApi(`/admin/notifications/overdue/${stateCode}`, {
      method: "POST",
      requiresAuth: true,
    });
  },

  getStateStats: async (stateCode: string) => {
    return fetchApi(`/admin/stats/${stateCode}`, { requiresAuth: true });
  },

  getStateBills: async (
    stateCode: string,
    filters?: { status?: string; page?: number; limit?: number },
  ) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return fetchApi(`/admin/bills/${stateCode}?${params.toString()}`, {
      requiresAuth: true,
    });
  },

  getStatePayments: async (
    stateCode: string,
    filters?: { status?: string; page?: number; limit?: number },
  ) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return fetchApi(`/admin/payments/${stateCode}?${params.toString()}`, {
      requiresAuth: true,
    });
  },

  getStateUsers: async (
    stateCode: string,
    filters?: { page?: number; limit?: number; search?: string },
  ) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return fetchApi(`/admin/users/${stateCode}?${params.toString()}`, {
      requiresAuth: true,
    });
  },

  getAllUsers: async (filters?: { page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return fetchApi(`/admin/users?${params.toString()}`, {
      requiresAuth: true,
    });
  },

  registerAddress: async (data: {
    lgaName: string;
    address: string;
    customerRef?: string;
  }) => {
    return fetchApi("/admin/addresses/register", {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  getAddresses: async () => {
    return fetchApi("/admin/addresses", { requiresAuth: true });
  },

  // Look up a single BinRegistration by its binId string (e.g. "EN000001")
  // Used as a fallback when old notifications don't carry addressId in metadata
  getAddressByBinId: async (binId: string) => {
    return fetchApi(`/admin/addresses/by-bin/${binId}`, { requiresAuth: true });
  },

  updateMonthlyBillAmount: async (amount: number) => {
    return fetchApi("/admin/billing/monthly-amount", {
      method: "PUT",
      body: JSON.stringify({ amount }),
      requiresAuth: true,
    });
  },

  generateMonthlyBills: async () => {
    return fetchApi("/admin/bills/generate", {
      method: "POST",
      requiresAuth: true,
    });
  },

  generateBillForBin: async (binId: string) => {
    return fetchApi(`/admin/bills/generate/${binId}`, {
      method: "POST",
      requiresAuth: true,
    });
  },

  updateAddress: async (
    addressId: string,
    data: { address?: string; lgaName?: string; customerRef?: string },
  ) => {
    return fetchApi(`/admin/addresses/${addressId}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  toggleAddressStatus: async (addressId: string) => {
    return fetchApi(`/admin/addresses/${addressId}/toggle-status`, {
      method: "PATCH",
      requiresAuth: true,
    });
  },
};

// Super Admin API
export const superAdminApi = {
  getStats: async () => fetchApi("/admin/super/stats", { requiresAuth: true }),

  getStateRevenues: async () =>
    fetchApi("/admin/super/state-revenues", { requiresAuth: true }),

  getAllStateAdmins: async () =>
    fetchApi("/admin/super/state-admins", { requiresAuth: true }),

  createStateAdmin: async (data: {
    email: string;
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
    stateCode: string;
    permissions?: Array<{
      id: string;
      name: string;
      description: string;
      canView: boolean;
      canCreate: boolean;
      canUpdate: boolean;
    }>;
  }) => {
    return fetchApi("/admin/super/state-admins", {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  toggleStateAdminStatus: async (adminId: string) =>
    fetchApi(`/admin/super/state-admins/${adminId}/toggle-status`, {
      method: "PATCH",
      requiresAuth: true,
    }),

  updateStateAdmin: async (
    adminId: string,
    data: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    },
  ) => {
    return fetchApi(`/admin/super/state-admins/${adminId}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  deleteStateAdmin: async (adminId: string) =>
    fetchApi(`/admin/super/state-admins/${adminId}`, {
      method: "DELETE",
      requiresAuth: true,
    }),

  getAllStates: async (filters?: { isActive?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) {
      params.append("isActive", filters.isActive.toString());
    }
    return fetchApi(`/admin/states?${params.toString()}`, {
      requiresAuth: true,
    });
  },
};

export default {
  auth: authApi,
  bills: billsApi,
  payments: paymentsApi,
  admin: adminApi,
  superAdmin: superAdminApi,
};
