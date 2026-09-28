import {
  Customer,
  SupportCase,
  Memory,
  ChatResponse,
  AnalyticsMetric,
  DemoStep
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'recalldesk_auth_token';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Session-Token'] = token;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth Token Utilities
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // Auth Endpoints
  async login(payload: { email: string; password: string }): Promise<{
    success: boolean;
    token?: string;
    customer?: Customer;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<any>(res);
    if (data.success && data.token) {
      api.setToken(data.token);
    }
    return data;
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    environment?: Record<string, any>;
  }): Promise<{
    success: boolean;
    token?: string;
    customer?: Customer;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<any>(res);
    if (data.success && data.token) {
      api.setToken(data.token);
    }
    return data;
  },

  async getMe(): Promise<Customer> {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Customer>(res);
  },

  async logout(): Promise<any> {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      api.setToken(null);
    }
    return { success: true };
  },

  async forgotPassword(payload: { email: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/api/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_BASE}/api/customers`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Customer[]>(res);
  },

  async getCustomer(id: string): Promise<Customer> {
    const res = await fetch(`${API_BASE}/api/customers/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Customer>(res);
  },

  async getCustomerCases(id: string): Promise<SupportCase[]> {
    const res = await fetch(`${API_BASE}/api/customers/${id}/cases`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<SupportCase[]>(res);
  },

  async getCustomerMemories(id: string): Promise<Memory[]> {
    const res = await fetch(`${API_BASE}/api/customers/${id}/memories`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Memory[]>(res);
  },

  async getCustomerHistory(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/customers/${id}/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async updateCustomerEnvironment(id: string, env: Record<string, any>): Promise<Customer> {
    const res = await fetch(`${API_BASE}/api/customers/${id}/environment`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(env),
    });
    return handleResponse<Customer>(res);
  },

  // Cases
  async getCases(): Promise<SupportCase[]> {
    const res = await fetch(`${API_BASE}/api/cases`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<SupportCase[]>(res);
  },

  async getCase(id: string): Promise<SupportCase> {
    const res = await fetch(`${API_BASE}/api/cases/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<SupportCase>(res);
  },

  // Chat with Hindsight Engine
  async sendChatMessage(payload: {
    customer_id: string;
    case_id?: string;
    message: string;
    environment?: Record<string, any>;
    auto_execute_diagnostics?: boolean;
  }): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ChatResponse>(res);
  },

  // Memory Feedback
  async submitMemoryFeedback(
    memoryId: string,
    payload: { was_useful: boolean; result?: string; notes?: string }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/api/memories/${memoryId}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  // Analytics & Health
  async getAnalytics(): Promise<AnalyticsMetric> {
    const res = await fetch(`${API_BASE}/api/analytics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AnalyticsMetric>(res);
  },

  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/health`);
    return handleResponse<any>(res);
  },

  // Demo Controls
  async resetDemo(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async runFullDemo(customerId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ customer_id: customerId }),
    });
    return handleResponse<any>(res);
  },

  async getDemoSteps(customerId?: string): Promise<DemoStep[]> {
    const url = customerId
      ? `${API_BASE}/api/demo/steps?customer_id=${encodeURIComponent(customerId)}`
      : `${API_BASE}/api/demo/steps`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DemoStep[]>(res);
  },
};
