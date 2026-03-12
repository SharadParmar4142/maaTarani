// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_TIMEOUT_MS = 20000;

// API Helper Function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error((data as any)?.message || `Request failed with status ${response.status}`);
    }

    if (!isJson) {
      throw new Error('Server returned an invalid response format. Please check backend URL configuration.');
    }

    return data;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Backend may be sleeping on Render free tier. Please wait a moment and try again.');
    }
    if (error instanceof TypeError) {
      throw new Error('Unable to reach backend API. Verify NEXT_PUBLIC_API_URL points to your Render backend URL.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Auth API Functions
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
  }) => {
    return apiCall('/api/user/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
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
};

export default authAPI;
