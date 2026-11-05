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
  createdAt?: string;
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

export interface Section {
  id: string;
  groupName: string;
  name: string;
  sortOrder: number;
}

export type ListStatus = 'PENDIENTE_REVISION' | 'EN_REVISION' | 'OBSERVADA' | 'RECHAZADA' | 'VALIDADA' | 'PROCESADA';

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
  /** Lectura automática: PROCESANDO, LISTO, ERROR, MANUAL (sin IA) o DEMO (lector de prueba). */
  iaEstado?: 'PROCESANDO' | 'LISTO' | 'ERROR' | 'MANUAL' | 'DEMO' | null;
  iaMensaje?: string;
  /** JSON de ListExtras guardado en la lista */
  extras?: string;
  /** Lista original de la que se copió (o null) */
  copiaDe?: string | null;
  createdAt: string;
}

export interface ListBook {
  id: string;
  titulo: string;
  editorial: string;
  cantidad: number;
  productoId?: string | null;
  precio?: number | null;
}

export interface ListExtras {
  forro: { activo: boolean; color?: string | null };
  etiquetas: { activo: boolean; nombre: string; grado: string; diseno: string };
  caratulas: { activo: boolean; cursos: string[] };
  forrarLibros: boolean;
  libros: ListBook[];
  /** Útiles que el cliente ya tiene */
  excluidos?: string[];
  /** Diseño, color u otra variante elegida por útil (itemId → producto y valores) */
  variantes?: Record<string, { productId: string; valores: ItemVariante[] }>;
}

export interface ItemVariante {
  tipo: string;
  valor: string;
  valueId: string;
  precio: number;
  imagen?: string | null;
}

export interface VariantValue {
  id: string;
  value: string;
  image_url?: string | null;
  price_modifier: number;
  stock: number;
  is_active: boolean;
  color_hex?: string | null;
}

export interface VariantType {
  id: string;
  name: string;
  values: VariantValue[];
}

export interface ProductDetail extends Product {
  variants?: VariantType[];
  images?: { id: string; image_url: string; alt_text?: string | null; imageUrl?: string; isPrimary?: boolean }[];
}

export interface SupplyItem {
  /** Lo agregó el cliente por su cuenta: no viene en la lista del colegio */
  agregado?: boolean;
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
  productEconomicoId?: string;
  productEconomico?: Product;
  priceEconomico?: number;
  productMedioId?: string;
  productMedio?: Product;
  priceMedio?: number;
  productPremiumId?: string;
  productPremium?: Product;
  pricePremium?: number;
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
  isActive?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  originalItem?: SupplyItem;
}

export type OrderStatus = 'RECIBIDO' | 'EN_PREPARACION' | 'ARMADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

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
  contactNotes?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  pago?: { metodo: string; operacion: string; estado: string };
  entrega?: { fecha?: string | null; franja?: string | null } | null;
  costoEnvio?: number | null;
  comprobante?: { tipo: 'boleta' | 'factura'; documento?: string; razonSocial?: string | null } | null;
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
  imageUrl?: string;
  /** Para quién es el útil (hermanos con listas distintas) */
  para?: string | null;
}

export interface OrderStatusHistory {
  status: string;
  notes?: string;
  createdAt: string;
}