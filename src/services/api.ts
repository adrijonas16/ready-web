import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, User, School, Grade, Section, SupplyList, SupplyItem, ListDetail, Product, ProductDetail, Order, Settings, Entrega, Comprobante, VariantType, VariantValue } from '@/lib/types';
import { API, MODO_DEMO, llamarDemo } from '@/lib/api-base';
import { evento, medirCompra } from '@/lib/analytics';
import type { DatosAntiSpam } from '@/lib/antispam';

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
  logoUrl?: string | null;
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
  /** Envía también el campo trampa y el tiempo de llenado (antispam) */
  register: (email: string, password: string, name: string, anti?: DatosAntiSpam) =>
    api.post<{ token: string; user: User }>('/auth/register', { email, password, name, ...anti }),
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
  update: (id: string, name: string, address?: string) => api.put<boolean>(`/schools/${id}`, { name, address }),
  delete: (id: string) => api.delete<boolean>(`/schools/${id}`),
  deleteGrade: (schoolId: string, gradeId: string) => api.delete<boolean>(`/schools/${schoolId}/grades/${gradeId}`),
  getSchoolSections: (schoolId: string) => api.get<Section[]>(`/schools/${schoolId}/sections`),
  setSchoolSections: (schoolId: string, sectionIds: string[]) =>
    api.put<boolean>(`/schools/${schoolId}/sections`, { sectionIds }),
};

// Sections API
export const sectionsApi = {
  getAll: () => api.get<Section[]>('/sections'),
  create: (groupName: string, name: string, sortOrder?: number) =>
    api.post<Section>('/sections', { groupName, name, sortOrder: sortOrder || 0 }),
  update: (id: string, data: { name: string; groupName: string; sortOrder: number }) =>
    api.put<Section>(`/sections/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/sections/${id}`),
};

// Lists API
export const listsApi = {
  upload: (formData: FormData) => api.uploadFormData<SupplyList>('/lists/upload', formData).then(l => { evento('generate_lead', { lead_source: 'foto_lista', currency: 'PEN', value: 0 }); return l; }),
  getById: (id: string) => api.get<ListDetail>(`/lists/${id}`),
  getAll: (params?: { estado?: string; esOficial?: boolean; userId?: string }) =>
    api.get<SupplyList[]>('/lists', params),
  getOfficial: (params?: { schoolId?: string; gradeId?: string }) =>
    api.get<SupplyList[]>('/lists/official', params),
  updateStatus: (id: string, status: string, observaciones?: string, esOficial?: boolean) =>
    api.put<boolean>(`/lists/${id}/status`, { status, observaciones, ...(esOficial !== undefined ? { esOficial } : {}) }),
  /** (admin) Corrige colegio, grado o año de la lista */
  update: (id: string, data: { schoolId?: string; gradeId?: string; year?: number }) =>
    api.put<boolean>(`/lists/${id}`, data),
  updateItem: (listId: string, itemId: string, data: Partial<SupplyItem> & { productId?: string }) =>
    api.put<boolean>(`/lists/${listId}/items/${itemId}`, data),
  reprocess: (id: string) => api.post<boolean>(`/lists/${id}/reprocess`),
  autoMatch: (id: string, force = false) => api.post<boolean>(`/lists/${id}/auto-match?force=${force}`),
  updatePlan: (id: string, data: { plan: string; estudianteNombre?: string; estudianteGrado?: string; aplicarATodos?: boolean }) =>
    api.put<boolean>(`/lists/${id}/plan`, data),
  updateExtras: (id: string, extras: unknown) => api.put<boolean>(`/lists/${id}/extras`, extras),
  delete: (id: string) => api.delete<boolean>(`/lists/${id}`),
  addObservacion: (id: string, observacion: string, anti?: DatosAntiSpam) =>
    api.post<boolean>(`/lists/${id}/observaciones`, { observacion, ...anti }),
  addItem: (listId: string, data: { nombreOriginal: string; cantidad: number; notas?: string; productId?: string; porCliente?: boolean }, anti?: DatosAntiSpam) =>
    api.post<SupplyItem>(`/lists/${listId}/items`, { ...data, ...anti }),
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
  getAll: (params?: { category?: string; brand?: string; limit?: number; includeInactive?: boolean }) =>
    api.get<Product[]>('/products', params),
  getById: (id: string) => api.get<ProductDetail>(`/products/${id}`),
  search: (query: string, category?: string) =>
    api.get<Product[]>('/products/search', { q: query, category }),
  getCategories: () => api.get<string[]>('/products/categories'),
  /** Devuelve el producto creado completo (con id). */
  create: (product: Partial<Product>) => api.post<Product>('/products', product),
  update: (id: string, product: Partial<Product>) => api.put<Product>(`/products/${id}`, product),
  delete: (id: string) => api.delete<boolean>(`/products/${id}`),
};

// Brands API
export const brandsApi = {
  getAll: () => api.get<Brand[]>('/brands'),
  create: (name: string, logoUrl?: string) => api.post<Brand>('/brands', { name, logoUrl }),
  update: (id: string, data: { name: string; logoUrl?: string | null }) => api.put<Brand>(`/brands/${id}`, data),
  uploadLogo: (id: string, file: File) => { const fd = new FormData(); fd.append('file', file); return api.uploadFormData<Brand>(`/brands/${id}/logo`, fd); },
  delete: (id: string) => api.delete<boolean>(`/brands/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),
  create: (name: string) => api.post<Category>('/categories', { name }),
  update: (id: string, name: string) => api.put<Category>(`/categories/${id}`, { name }),
  delete: (id: string) => api.delete<boolean>(`/categories/${id}`),
};

// Orders API
export const ordersApi = {
  create: (order: CreateOrderInput, anti?: DatosAntiSpam) => api.post<Order>('/orders', { ...order, ...anti }).then(o => { medirCompra(order, o); return o; }),
  getById: (id: string) => api.get<Order>(`/orders/${id}`),
  getByUserId: (userId: string) => api.get<Order[]>(`/orders/user/${userId}`),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.put<boolean>(`/orders/${id}/status`, { status, notes }),
  /** El cliente cancela su pedido (solo si está RECIBIDO) */
  cancel: (id: string) => api.put<Order>(`/orders/${id}/cancel`),
  getAll: () => api.get<Order[]>('/orders'),
  getStats: () => api.get<OrderStats>('/orders/stats'),
};

// ── Administración (panel) ──

export interface ProductImage { id: string; imageUrl: string; altText?: string | null; isPrimary: boolean; displayOrder: number }

export const productImagesApi = {
  getAll: (productId: string) => api.get<ProductImage[]>(`/products/${productId}/images`),
  upload: (productId: string, file: File, isPrimary = false) => {
    const fd = new FormData(); fd.append('file', file); fd.append('isPrimary', String(isPrimary));
    return api.uploadFormData<ProductImage>(`/products/${productId}/images`, fd);
  },
  delete: (productId: string, imageId: string) => api.delete<boolean>(`/products/${productId}/images/${imageId}`),
  setPrimary: (productId: string, imageId: string) => api.put<boolean>(`/products/${productId}/images/${imageId}/primary`),
};

export const variantsApi = {
  getAll: (productId: string) => api.get<VariantType[]>(`/products/${productId}/variants`),
  createType: (productId: string, name: string, displayOrder = 0) =>
    api.post<VariantType>(`/products/${productId}/variants/types`, { name, displayOrder }),
  deleteType: (productId: string, typeId: string) => api.delete<boolean>(`/products/${productId}/variants/types/${typeId}`),
  createValue: (productId: string, typeId: string, data: { value: string; priceModifier: number; stock: number; colorHex?: string | null; displayOrder?: number }) =>
    api.post<VariantValue>(`/products/${productId}/variants/types/${typeId}/values`, data),
  updateValue: (productId: string, valueId: string, data: { value: string; colorHex: string | null; priceModifier: number; stock: number; isActive: boolean }) =>
    api.put<boolean>(`/products/${productId}/variants/values/${valueId}`, data),
  deleteValue: (productId: string, valueId: string) => api.delete<boolean>(`/products/${productId}/variants/values/${valueId}`),
  uploadValueImage: (productId: string, valueId: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.uploadFormData<boolean>(`/products/${productId}/variants/values/${valueId}/image`, fd);
  },
};

export interface Campaign {
  id: string; name: string; slug: string; description?: string | null;
  discountPercent: number; startDate?: string | null; endDate?: string | null;
  isActive: boolean; imageUrl?: string | null; productCount?: number;
}
export type CampaignInput = { name: string; slug: string; description?: string | null; discountPercent: number; discountFixed?: number; startDate?: string | null; endDate?: string | null; isActive?: boolean; imageUrl?: string | null };

export const campaignsApi = {
  getAll: () => api.get<Campaign[]>('/campaigns'),
  getBySlug: (slugOrId: string) => api.get<Campaign & { products: Product[] }>(`/campaigns/${slugOrId}`),
  create: (data: CampaignInput) => api.post<Campaign>('/campaigns', data),
  update: (id: string, data: Partial<CampaignInput>) => api.put<Campaign>(`/campaigns/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/campaigns/${id}`),
  addProducts: (id: string, productIds: string[]) => api.post<boolean>(`/campaigns/${id}/products`, { productIds }),
  removeProduct: (id: string, productId: string) => api.delete<boolean>(`/campaigns/${id}/products/${productId}`),
  uploadImage: (id: string, file: File) => { const fd = new FormData(); fd.append('file', file); return api.uploadFormData<Campaign>(`/campaigns/${id}/image`, fd); },
};

export interface NewsItem {
  id: string; title: string; content?: string | null; imageUrl?: string | null; linkUrl?: string | null;
  campaignId?: string | null; campaignName?: string | null; displayOrder: number; isActive: boolean; createdAt?: string;
}
export type NewsInput = { title: string; content?: string | null; imageUrl?: string | null; linkUrl?: string | null; campaignId?: string | null; displayOrder: number; isActive: boolean };

export const newsApi = {
  getAll: () => api.get<NewsItem[]>('/news'),
  create: (data: NewsInput) => api.post<NewsItem>('/news', data),
  update: (id: string, data: NewsInput) => api.put<NewsItem>(`/news/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/news/${id}`),
  uploadImage: (id: string, file: File) => { const fd = new FormData(); fd.append('file', file); return api.uploadFormData<NewsItem>(`/news/${id}/image`, fd); },
};

export const usersApi = {
  getAll: () => api.get<User[]>('/auth/users'),
  setRole: (id: string, role: User['role']) => api.put<boolean>(`/auth/users/${id}/role`, { role }),
};

/** Configuración de la tienda (GET público, PUT solo admin) */
export interface ConfiguracionTienda {
  costoEnvio: number; envioGratisDesde: number | null; whatsapp: string; telefono: string;
  horarioEntrega: string; diasEntrega: number; zonas?: string;
}
export const configuracionApi = {
  get: () => api.get<ConfiguracionTienda>('/settings'),
  save: (data: ConfiguracionTienda) => api.put<ConfiguracionTienda>('/settings', data),
};