export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: 'USER' | 'ADMIN' | 'OPERATOR';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface School {
  id: string;
  name: string;
  address?: string;
}

export interface Grade {
  id: string;
  schoolId: string;
  name: string;
  year: number;
}

export type ListStatus = 'PENDIENTE_REVISION' | 'EN_REVISION' | 'OBSERVADA' | 'VALIDADA' | 'PROCESADA';

export interface SupplyList {
  id: string;
  userId?: string;
  schoolId: string;
  schoolName: string;
  gradeId: string;
  gradeName: string;
  year: number;
  imageUrl?: string;
  ocrText?: string;
  estado: ListStatus;
  esOficial: boolean;
  observaciones?: string;
  submittedBy?: string;
  userObservaciones?: string;
  plan?: string;
  estudianteNombre?: string;
  estudianteGrado?: string;
  fechaSubida?: string;
  fechaInicioRevision?: string;
  fechaValidacion?: string;
  createdAt: string;
}

export interface SupplyItem {
  id: string;
  supplyListId: string;
  nombreOriginal: string;
  nombreDetectado?: string;
  cantidad: number;
  notas?: string;
  userNotas?: string;
  userCustomQuantity?: number;
  matchedProductId?: string;
  matchedProduct?: Product;
  matchedQuantity?: number;
  priceAtMatch?: number;
  forro?: boolean;
  forroColor?: string;
  etiqueta?: string;
  etiquetaDibujo?: boolean;
  caratula?: boolean;
  caratulaCurso?: string;
  datosEstudiante?: string;
}

export interface ListDetail {
  list: SupplyList;
  items: SupplyItem[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  sku: string;
  basePrice: number;
  imageUrl?: string;
  stock: number;
  attributes?: string;
  rating?: number;
  tier?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  originalItem?: SupplyItem;
}

export type OrderStatus = 'RECIBIDO' | 'EN_PREPARACION' | 'ARMADO' | 'EN_CAMINO' | 'ENTREGADO';

export interface Order {
  id: string;
  userId: string;
  supplyListId?: string;
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  shippingPhone: string;
  trackingNumber?: string;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface OrderStatusHistory {
  status: string;
  notes?: string;
  createdAt: string;
}