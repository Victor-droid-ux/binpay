// API Configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { requiresAuth = false, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge with any additional headers
  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }

  // Add auth token if required
  if (requiresAuth) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'An error occurred', data);
  }

  return data;
}

// Auth API
export const authApi = {
  login: async (credentials: { email?: string; phone?: string; password: string }) => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store tokens and user data
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
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
    const data = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store tokens and user data
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const data = await fetchApi('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    
    return data;
  },

  getCurrentUser: async () => {
    const data = await fetchApi('/auth/me', {
      requiresAuth: true,
    });
    // Backend returns { user: {...} }, extract the user object
    return data.user || data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

// Bills API
export const billsApi = {
  getAll: async (filters?: { status?: string; lgaId?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    return fetchApi(`/bills?${params.toString()}`, {
      requiresAuth: true,
    });
  },

  getById: async (id: string) => {
    return fetchApi(`/bills/${id}`, {
      requiresAuth: true,
    });
  },

  getByBinId: async (binId: string) => {
    return fetchApi(`/bills/lookup/${binId}`, {
      requiresAuth: true,
    });
  },

  create: async (billData: any) => {
    return fetchApi('/bills', {
      method: 'POST',
      body: JSON.stringify(billData),
      requiresAuth: true,
    });
  },

  update: async (id: string, billData: any) => {
    return fetchApi(`/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(billData),
      requiresAuth: true,
    });
  },

  // Bin registration
  registerBin: async (data: {
    stateCode: string;
    lgaName: string;
    address: string;
    customerRef?: string;
  }) => {
    return fetchApi('/bills/bins/register', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  getUserBins: async () => {
    return fetchApi('/bills/bins', {
      requiresAuth: true,
    });
  },
  // Search for address to find bin ID
  searchAddress: async (params: {
    address?: string;
    stateCode?: string;
    lgaName?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.address) queryParams.append('address', params.address);
    if (params.stateCode) queryParams.append('stateCode', params.stateCode);
    if (params.lgaName) queryParams.append('lgaName', params.lgaName);

    return fetchApi(`/bills/bins/search?${queryParams.toString()}`, {
      requiresAuth: true,
    });
  },

  // Link bin to user account
  linkBin: async (binId: string) => {
    return fetchApi('/bills/bins/link', {
      method: 'POST',
      body: JSON.stringify({ binId }),
      requiresAuth: true,
    });
  },

  // Unlink bin from user account
  unlinkBin: async (binId: string) => {
    return fetchApi('/bills/bins/unlink', {
      method: 'POST',
      body: JSON.stringify({ binId }),
      requiresAuth: true,
    });
  },

  // Get user dashboard statistics
  getUserStats: async () => {
    return fetchApi('/bills/user/stats', {
      requiresAuth: true,
    });
  },

  // Get user notifications
  getNotifications: async () => {
    return fetchApi('/bills/notifications', {
      requiresAuth: true,
    });
  },

  // Mark notification as read
  markNotificationRead: async (notificationId: string) => {
    return fetchApi(`/bills/notifications/${notificationId}/read`, {
      method: 'PUT',
      requiresAuth: true,
    });
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    return fetchApi('/bills/notifications/mark-all-read', {
      method: 'PUT',
      requiresAuth: true,
    });
  },

  // Get state billing information
  getStateBilling: async (stateCode: string) => {
    return fetchApi(`/bills/state-billing/${stateCode}`, {
      requiresAuth: false,
    });
  },
};

// Payments API
export const paymentsApi = {
  getAll: async (filters?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    return fetchApi(`/payments?${params.toString()}`, {
      requiresAuth: true,
    });
  },

  getById: async (id: string) => {
    return fetchApi(`/payments/${id}`, {
      requiresAuth: true,
    });
  },

  initialize: async (paymentData: { billId: string; method: 'CARD' | 'BANK_TRANSFER' | 'USSD' | 'MOBILE_MONEY' }) => {
    return fetchApi('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
      requiresAuth: true,
    });
  },

  verify: async (reference: string) => {
    return fetchApi(`/payments/verify/${reference}`, {
      requiresAuth: true,
    });
  },
};

// Admin API
export const adminApi = {
  getStateStats: async (stateCode: string) => {
    return fetchApi(`/admin/stats/${stateCode}`, {
      requiresAuth: true,
    });
  },

  getStateBills: async (stateCode: string, filters?: { status?: string; page?: number; limit?: number }) => {
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

  getStatePayments: async (stateCode: string, filters?: { status?: string; page?: number; limit?: number }) => {
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

  getStateUsers: async (stateCode: string, filters?: { page?: number; limit?: number; search?: string }) => {
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

  updateUserStatus: async (userId: string, isActive: boolean) => {
    return fetchApi(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
      requiresAuth: true,
    });
  },

  // Address/Bin registration for state admins
  registerAddress: async (data: {
    lgaName: string;
    address: string;
    customerRef?: string;
  }) => {
    return fetchApi('/admin/addresses/register', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  getAddresses: async () => {
    return fetchApi('/admin/addresses', {
      requiresAuth: true,
    });
  },

  // Update monthly bill amount for state
  updateMonthlyBillAmount: async (amount: number) => {
    return fetchApi('/admin/billing/monthly-amount', {
      method: 'PUT',
      body: JSON.stringify({ amount }),
      requiresAuth: true,
    });
  },

  // Generate monthly bills for all active bins in state
  generateMonthlyBills: async () => {
    return fetchApi('/admin/bills/generate', {
      method: 'POST',
      requiresAuth: true,
    });
  },

  // Generate bill for specific bin
  generateBillForBin: async (binId: string) => {
    return fetchApi(`/admin/bills/generate/${binId}`, {
      method: 'POST',
      requiresAuth: true,
    });
  },
};

// Super Admin API
export const superAdminApi = {
  getStats: async () => {
    return fetchApi('/admin/super/stats', {
      requiresAuth: true,
    });
  },

  getStateRevenues: async () => {
    return fetchApi('/admin/super/state-revenues', {
      requiresAuth: true,
    });
  },

  getAllStateAdmins: async () => {
    return fetchApi('/admin/super/state-admins', {
      requiresAuth: true,
    });
  },

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
    return fetchApi('/admin/super/state-admins', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  toggleStateAdminStatus: async (adminId: string) => {
    return fetchApi(`/admin/super/state-admins/${adminId}/toggle-status`, {
      method: 'PATCH',
      requiresAuth: true,
    });
  },

  updateStateAdmin: async (adminId: string, data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) => {
    return fetchApi(`/admin/super/state-admins/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  deleteStateAdmin: async (adminId: string) => {
    return fetchApi(`/admin/super/state-admins/${adminId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },

  getAllStates: async (filters?: { isActive?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
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
