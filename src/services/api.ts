import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'API Error');
    }
    return response.data.data as T;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'API Error');
    }
    return response.data.data as T;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'API Error');
    }
    return response.data.data as T;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'API Error');
    }
    return response.data.data as T;
  }

  async uploadFormData<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'API Error');
    }
    return response.data.data as T;
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post<{ token: string; user: any }>('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post<{ token: string; user: any }>('/auth/login', { email, password }),
  getCurrentUser: () => api.get<any>('/auth/me'),
};

// Schools API
export const schoolsApi = {
  getAll: () => api.get<any[]>('/schools'),
  getById: (id: string) => api.get<any>(`/schools/${id}`),
  getGrades: (id: string) => api.get<any[]>(`/schools/${id}/grades`),
  create: (name: string, address?: string) =>
    api.post<any>('/schools', { name, address }),
  createGrade: (schoolId: string, name: string, year: number) =>
    api.post<any>(`/schools/${schoolId}/grades`, { name, year }),
  getSchoolSections: (schoolId: string) => api.get<any[]>(`/schools/${schoolId}/sections`),
  setSchoolSections: (schoolId: string, sectionIds: string[]) =>
    api.put<boolean>(`/schools/${schoolId}/sections`, { sectionIds }),
};

// Sections API
export const sectionsApi = {
  getAll: () => api.get<any[]>('/sections'),
  create: (groupName: string, name: string, sortOrder: number) =>
    api.post<any>('/sections', { groupName, name, sortOrder }),
  delete: (id: string) => api.delete<boolean>(`/sections/${id}`),
};

// Lists API
export const listsApi = {
  upload: (formData: FormData) => api.uploadFormData<any>('/lists/upload', formData),
  getById: (id: string) => api.get<any>(`/lists/${id}`),
  getAll: (params?: { estado?: string; esOficial?: boolean; userId?: string }) =>
    api.get<any[]>('/lists', params),
  getOfficial: (params?: { schoolId?: string; gradeId?: string }) =>
    api.get<any[]>('/lists/official', params),
  updateStatus: (id: string, status: string, observaciones?: string) =>
    api.put<boolean>(`/lists/${id}/status`, { status, observaciones }),
  updateItem: (listId: string, itemId: string, data: any) =>
    api.put<boolean>(`/lists/${listId}/items/${itemId}`, data),
  reprocess: (id: string) => api.post<boolean>(`/lists/${id}/reprocess`),
  updatePlan: (id: string, data: { plan: string; estudianteNombre?: string; estudianteGrado?: string }) =>
    api.put<boolean>(`/lists/${id}/plan`, data),
  delete: (id: string) => api.delete<boolean>(`/lists/${id}`),
  addObservacion: (id: string, observacion: string) =>
    api.post<boolean>(`/lists/${id}/observaciones`, { observacion }),
  addItem: (listId: string, data: { nombreOriginal: string; cantidad: number; notas?: string }) =>
    api.post<any>(`/lists/${listId}/items`, data),
  deleteItem: (listId: string, itemId: string) =>
    api.delete<boolean>(`/lists/${listId}/items/${itemId}`),
  createFromText: (data: {
    userId: string;
    schoolId: string;
    gradeId: string;
    year: number;
    items: { nombreOriginal: string; cantidad: number; notas?: string }[];
  }) => api.post<any>('/lists/from-text', data),
};

// Products API
export const productsApi = {
  getAll: (params?: { category?: string; brand?: string; limit?: number }) =>
    api.get<any[]>('/products', params),
  getById: (id: string) => api.get<any>(`/products/${id}`),
  search: (query: string, category?: string) =>
    api.get<any[]>('/products/search', { q: query, category }),
  getCategories: () => api.get<string[]>('/products/categories'),
  create: (product: any) => api.post<any>('/products', product),
  update: (id: string, product: any) => api.put<any>(`/products/${id}`, product),
  delete: (id: string) => api.delete<boolean>(`/products/${id}`),
};

// Brands API
export const brandsApi = {
  getAll: () => api.get<any[]>('/brands'),
  create: (name: string, logoUrl?: string) => api.post<any>('/brands', { name, logoUrl }),
};

// Orders API
export const ordersApi = {
  create: (order: any) => api.post<any>('/orders', order),
  getById: (id: string) => api.get<any>(`/orders/${id}`),
  getByUserId: (userId: string) => api.get<any[]>(`/orders/user/${userId}`),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.put<boolean>(`/orders/${id}/status`, { status, notes }),
  getAll: () => api.get<any[]>('/orders'),
  getStats: () => api.get<any>('/orders/stats'),
};