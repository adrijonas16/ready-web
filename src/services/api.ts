import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, User, School, Grade, Section, SupplyList, SupplyItem, ListDetail, Product, ProductDetail, Order, Settings, Entrega, Comprobante } from '@/lib/types';
import { API, MODO_DEMO, llamarDemo } from '@/lib/api-base';

const API_BASE_URL = API;

/** En modo demo, axios no sale a la red: responde el servidor de demostración. */
async function adaptadorDemo(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const url = axios.getUri(config);
  let cuerpo: unknown = config.data;
  if (typeof cuerpo === 'string') { try { cuerpo = JSON.parse(cuerpo); } catch { /* texto */ } }
  const auth = config.headers?.Authorization;
  const r = await llamarDemo(config.method ?? 'get', url, cuerpo, typeof auth === 'string' ? auth : null);
  const respuesta: AxiosResponse = { data: r.body, status: r.status, statusText: r.status === 200 ? 'OK' : 'Error', headers: {}, config };
  if (r.status >= 400) throw new AxiosError(r.body.error?.message, String(r.status), config, null, respuesta);
  return respuesta;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(MODO_DEMO ? { adapter: adaptadorDemo } : {}),
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

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'API Error');
    }
    return response.data.data as T;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'API Error');
    }
    return response.data.data as T;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
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

export interface Brand {
  id: string;
  name: string;
  logo_url?: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface CreateOrderInput {
  userId?: string;
  /** Compatibilidad: la primera de supplyListIds */
  supplyListId?: string;
  supplyListIds?: string[];
  shippingAddress: string;
  shippingPhone: string;
  contactNotes?: string;
  items: { productId: string; productName?: string; quantity: number; unitPrice: number; recargo?: number; notes?: string; para?: string }[];
  pago?: { metodo: string; operacion: string; estado: string };
  entrega?: Entrega;
  costoEnvio?: number;
  comprobante?: Comprobante;
  cupon?: string;
}

export interface PerfilInput { name?: string; phone?: string; address?: string; documento?: string }

export interface OrderStats {
  [key: string]: unknown;
}

// Auth API
export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post<{ token: string; user: User }>('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  getCurrentUser: () => api.get<User>('/auth/me'),
  /** Guarda nombre, celular, dirección y DNI/RUC del usuario logueado */
  updateMe: (data: PerfilInput) => api.put<User>('/auth/me', data),
};

// Configuración pública de la tienda
export const settingsApi = {
  get: () => api.get<Settings>('/settings'),
};

// Schools API
export const schoolsApi = {
  getAll: () => api.get<School[]>('/schools'),
  getById: (id: string) => api.get<School>(`/schools/${id}`),
  getGrades: (id: string) => api.get<Grade[]>(`/schools/${id}/grades`),
  create: (name: string, address?: string) =>
    api.post<School>('/schools', { name, address }),
  createGrade: (schoolId: string, name: string, year: number) =>
    api.post<Grade | string>(`/schools/${schoolId}/grades`, { name, year }),
  getSchoolSections: (schoolId: string) => api.get<Section[]>(`/schools/${schoolId}/sections`),
  setSchoolSections: (schoolId: string, sectionIds: string[]) =>
    api.put<boolean>(`/schools/${schoolId}/sections`, { sectionIds }),
};

// Sections API
export const sectionsApi = {
  getAll: () => api.get<Section[]>('/sections'),
  create: (groupName: string, name: string, sortOrder?: number) =>
    api.post<Section>('/sections', { groupName, name, sortOrder: sortOrder || 0 }),
  delete: (id: string) => api.delete<boolean>(`/sections/${id}`),
};

// Lists API
export const listsApi = {
  upload: (formData: FormData) => api.uploadFormData<SupplyList>('/lists/upload', formData),
  getById: (id: string) => api.get<ListDetail>(`/lists/${id}`),
  getAll: (params?: { estado?: string; esOficial?: boolean; userId?: string }) =>
    api.get<SupplyList[]>('/lists', params),
  getOfficial: (params?: { schoolId?: string; gradeId?: string }) =>
    api.get<SupplyList[]>('/lists/official', params),
  updateStatus: (id: string, status: string, observaciones?: string) =>
    api.put<boolean>(`/lists/${id}/status`, { status, observaciones }),
  updateItem: (listId: string, itemId: string, data: Partial<SupplyItem> & { productId?: string }) =>
    api.put<boolean>(`/lists/${listId}/items/${itemId}`, data),
  reprocess: (id: string) => api.post<boolean>(`/lists/${id}/reprocess`),
  autoMatch: (id: string, force = false) => api.post<boolean>(`/lists/${id}/auto-match?force=${force}`),
  updatePlan: (id: string, data: { plan: string; estudianteNombre?: string; estudianteGrado?: string; aplicarATodos?: boolean }) =>
    api.put<boolean>(`/lists/${id}/plan`, data),
  updateExtras: (id: string, extras: unknown) => api.put<boolean>(`/lists/${id}/extras`, extras),
  delete: (id: string) => api.delete<boolean>(`/lists/${id}`),
  addObservacion: (id: string, observacion: string) =>
    api.post<boolean>(`/lists/${id}/observaciones`, { observacion }),
  addItem: (listId: string, data: { nombreOriginal: string; cantidad: number; notas?: string; productId?: string; porCliente?: boolean }) =>
    api.post<SupplyItem>(`/lists/${listId}/items`, data),
  /** Copia personal de una lista (la del colegio) para ajustarla sin cambiar la de los demás */
  copiar: (listId: string, data: { userId?: string; plan?: string; nueva?: boolean }) =>
    api.post<{ id: string; existente: boolean }>(`/lists/${listId}/copia`, data),
  deleteItem: (listId: string, itemId: string) =>
    api.delete<boolean>(`/lists/${listId}/items/${itemId}`),
  createFromText: (data: {
    userId: string;
    schoolId: string;
    gradeId: string;
    year: number;
    items: { nombreOriginal: string; cantidad: number; notas?: string }[];
  }) => api.post<SupplyList>('/lists/from-text', data),
};

// Products API
export const productsApi = {
  getAll: (params?: { category?: string; brand?: string; limit?: number }) =>
    api.get<Product[]>('/products', params),
  getById: (id: string) => api.get<ProductDetail>(`/products/${id}`),
  search: (query: string, category?: string) =>
    api.get<Product[]>('/products/search', { q: query, category }),
  getCategories: () => api.get<string[]>('/products/categories'),
  /** Devuelve el id del producto creado. */
  create: (product: Partial<Product>) => api.post<string>('/products', product),
  update: (id: string, product: Partial<Product>) => api.put<Product>(`/products/${id}`, product),
  delete: (id: string) => api.delete<boolean>(`/products/${id}`),
};

// Brands API
export const brandsApi = {
  getAll: () => api.get<Brand[]>('/brands'),
  create: (name: string, logoUrl?: string) => api.post<Brand>('/brands', { name, logoUrl }),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),
  create: (name: string) => api.post<Category>('/categories', { name }),
  delete: (id: string) => api.delete<boolean>(`/categories/${id}`),
};

// Orders API
export const ordersApi = {
  create: (order: CreateOrderInput) => api.post<Order>('/orders', order),
  getById: (id: string) => api.get<Order>(`/orders/${id}`),
  getByUserId: (userId: string) => api.get<Order[]>(`/orders/user/${userId}`),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.put<boolean>(`/orders/${id}/status`, { status, notes }),
  /** El cliente cancela su pedido (solo si está RECIBIDO) */
  cancel: (id: string) => api.put<Order>(`/orders/${id}/cancel`),
  getAll: () => api.get<Order[]>('/orders'),
  getStats: () => api.get<OrderStats>('/orders/stats'),
};