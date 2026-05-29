// Copied API helper for React (Vite) app
// Support both Vite (`VITE_API_URL`) and Next (`NEXT_PUBLIC_API_URL`) envs.
const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
const API_BASE_URL =
  viteEnv?.VITE_API_URL ||
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined) ||
  'http://localhost:5000';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN' | 'company';
}

export interface Company {
  id: string;
  companyName: string;
  companySize: string;
  yearOfEstablishment: number;
  gstNumber: string;
  companyPhone?: string | null;
  companyLocation?: string | null;
  serviceArea?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: AuthUser;
  company: Company | null;
  accessToken: string;
}

export interface CompanyDashboardResponse {
  success: boolean;
  data: {
    company: Company;
    summary: {
      allOrders: number;
      availableOrders: number;
      claimedOrders: number;
      receivingReceivedOrders: number;
    };
    openOrders: Array<Record<string, unknown>>;
    allOrders: Array<Record<string, unknown>>;
    claimedOrders: Array<Record<string, unknown>>;
    receivingReceivedOrders: Array<Record<string, unknown>>;
  };
}

export type POStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PICKING'
  | 'PACKING'
  | 'SORTING'
  | 'SHIPPING'
  | 'FINAL_DELIVERY'
  | 'REJECTED';

export type TruckStatus =
  | 'UNDER_LOADING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'RECEIVING';

export interface TruckDeliveredItemSummary {
  lineItemId: string;
  description: string;
  quantity: number;
}

export interface TruckSummary {
  id: string;
  truckNumber: string;
  status: TruckStatus;
  materialLineItemId: string;
  materialDescription: string;
  nextStatus: TruckStatus | null;
  userShortageQuantity: number | null;
  userReceivingNote: string | null;
  userReceivingUpdatedAt: string | null;
  userReceivingUpdatedById: string | null;
  effectiveReceivedQuantity: number;
  deliveredItems: TruckDeliveredItemSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface RemainingByItemSummary {
  lineItemId: string;
  description: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
}

export interface OrderTruckSummary {
  purchaseOrderId: string;
  purchaseOrderStatus: POStatus;
  canAllocateTrucks: boolean;
  truckCount: number;
  receivingPendingTruckCount: number;
  receivingCompletedTruckCount: number;
  canFinalizeReceiving: boolean;
  trucks: TruckSummary[];
  remainingByItem: RemainingByItemSummary[];
  remainingTotalQuantity: number;
}

// API Helper Function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const authAPI = {
  register: async (userData: {
    name: string;
    phone: string;
    email: string;
    password: string;
    companyName: string;
    companySize: string;
    yearOfEstablishment: number;
    gstNumber: string;
    panNumber?: string;
    companyPhone?: string;
  }): Promise<AuthResponse> => {
    return apiCall('/api/user/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  registerAdmin: async (userData: {
    name: string;
    phone: string;
    email: string;
    password: string;
    adminSignupKey?: string;
  }): Promise<AuthResponse> => {
    return apiCall('/api/user/admin/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  registerCompany: async (userData: {
    name: string;
    phone: string;
    email: string;
    password: string;
    companyName: string;
    companySize: string;
    yearOfEstablishment: number;
    gstNumber: string;
    panNumber?: string;
    companyPhone?: string;
    companyLocation?: string;
    deliverySpeedDays?: number;
    serviceArea?: string;
    about?: string;
  }): Promise<AuthResponse> => {
    return apiCall('/api/company/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    return apiCall('/api/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getCurrentUser: async (token: string) => {
    return apiCall('/api/user/current', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateProfile: async (token: string, profileData: Record<string, unknown>) => {
    return apiCall('/api/user/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  },
};

export const purchaseOrderAPI = {
  checkDuplicate: async (token: string, payload: Record<string, unknown>) => {
    return apiCall('/api/purchaseorder/checkDuplicate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },

  create: async (token: string, payload: Record<string, unknown>) => {
    return apiCall('/api/purchaseorder', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },

  updateGoogleSheet: async (token: string, payload: Record<string, unknown>) => {
    return apiCall('/api/purchaseorder/updateGoogleSheet', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },

  getMyOrders: async (token: string) => {
    return apiCall('/api/purchaseorder/my', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getAdminDashboard: async (token: string) => {
    return apiCall('/api/purchaseorder/admin/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateStatus: async (token: string, orderId: string, status: POStatus, reviewNote = '') => {
    return apiCall(`/api/purchaseorder/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, reviewNote }),
    });
  },
};

export const truckTrackingAPI = {
  getOrderSummary: async (token: string, purchaseOrderId: string): Promise<{ success: boolean; data: OrderTruckSummary }> => {
    return apiCall(`/api/trucks/${purchaseOrderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getSummariesForOrders: async (
    token: string,
    orderIds: string[]
  ): Promise<{ success: boolean; data: Record<string, OrderTruckSummary> }> => {
    return apiCall('/api/trucks/summaries', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderIds }),
    });
  },

  allocateTrucks: async (
    token: string,
    purchaseOrderId: string,
    truckCount: number,
    allocations: Array<{ truckNumber: string; lineItemId: string }>
  ): Promise<{ success: boolean; data: OrderTruckSummary; message: string }> => {
    return apiCall(`/api/trucks/${purchaseOrderId}/allocate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ truckCount, allocations }),
    });
  },

  updateTruckStatus: async (
    token: string,
    purchaseOrderId: string,
    truckId: string,
    status: TruckStatus
  ): Promise<{ success: boolean; data: OrderTruckSummary; message: string }> => {
    return apiCall(`/api/trucks/${purchaseOrderId}/${truckId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
  },

  submitReceivingReport: async (
    token: string,
    purchaseOrderId: string,
    truckId: string,
    shortageQuantity: number,
    receivingNote: string
  ): Promise<{ success: boolean; data: OrderTruckSummary; message: string }> => {
    return apiCall(`/api/trucks/${purchaseOrderId}/${truckId}/receiving`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shortageQuantity, receivingNote }),
    });
  },

  finalizeReceivingOrder: async (
    token: string,
    purchaseOrderId: string
  ): Promise<{ success: boolean; data: OrderTruckSummary; message: string }> => {
    return apiCall(`/api/trucks/${purchaseOrderId}/receiving/finalize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  setTruckDeliveredItems: async (
    token: string,
    purchaseOrderId: string,
    truckId: string,
    quantity: number
  ): Promise<{ success: boolean; data: OrderTruckSummary; message: string }> => {
    return apiCall(`/api/trucks/${purchaseOrderId}/${truckId}/delivered-items`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });
  },
};

export const companyAPI = {
  getDashboard: async (token: string): Promise<CompanyDashboardResponse> => {
    return apiCall('/api/company/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getOpenPurchaseOrders: async (token: string): Promise<CompanyDashboardResponse> => {
    return apiCall('/api/company/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateProfile: async (token: string, profileData: Record<string, unknown>) => {
    return apiCall('/api/company/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (token: string, passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    return apiCall('/api/company/change-password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });
  },

  claimPurchaseOrder: async (
    token: string,
    purchaseOrderId: string,
    claimCode: string
  ): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> => {
    return apiCall(`/api/company/purchase-orders/${purchaseOrderId}/claim`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ claimCode }),
    });
  },
};

export default authAPI;
