import { ItemVariante, ListBook, ListExtras, Product, SupplyItem } from '@/lib/types';
import { precioVenta, redondear } from '@/lib/precio';

export type Tier = 'economico' | 'medio' | 'premium';

export const TIERS: { id: Tier; label: string; desc: string }[] = [
  { id: 'economico', label: 'Económico', desc: 'Lo que pide la lista, al menor precio' },
  { id: 'medio', label: 'Normal', desc: 'Marcas conocidas y buena calidad' },
  { id: 'premium', label: 'Premium', desc: 'Lo mejor, para que dure todo el año' },
];

export const tierLabel = (t: Tier | null) => TIERS.find(x => x.id === t)?.label ?? 'Otro';

/** Producto del nivel; si el útil no lo tiene, el más cercano (igual que la API). */
export function tierProduct(item: SupplyItem, tier: Tier, exacto = false): Product | undefined {
  const e = item.productEconomico, m = item.productMedio, p = item.productPremium;
  if (exacto) return tier === 'economico' ? e : tier === 'premium' ? p : m;
  if (tier === 'economico') return e ?? m ?? p;
  if (tier === 'premium') return p ?? m ?? e;
  return m ?? e ?? p;
}

export function currentTier(item: SupplyItem): Tier | null {
  const id = item.matchedProductId;
  if (!id) return null;
  if (item.productEconomicoId === id) return 'economico';
  if (item.productMedioId === id) return 'medio';
  if (item.productPremiumId === id) return 'premium';
  return null;
}

export function esCuaderno(item: SupplyItem): boolean {
  const texto = `${item.matchedProduct?.category ?? ''} ${item.matchedProduct?.name ?? ''} ${item.nombreOriginal}`;
  return /cuaderno|cuad\.|cuadernillo/i.test(texto);
}

export const extrasVacios = (): ListExtras => ({
  forro: { activo: false, color: null },
  etiquetas: { activo: false, nombre: '', grado: '', diseno: 'lisa' },
  caratulas: { activo: false, cursos: [] },
  forrarLibros: false,
  libros: [],
  excluidos: [],
  variantes: {},
});

export function parseExtras(json?: string | null): ListExtras {
  const base = extrasVacios();
  if (!json) return base;
  try {
    const e = JSON.parse(json) as Partial<ListExtras>;
    return {
      forro: { ...base.forro, ...e.forro },
      etiquetas: { ...base.etiquetas, ...e.etiquetas },
      caratulas: { ...base.caratulas, ...e.caratulas, cursos: e.caratulas?.cursos ?? [] },
      forrarLibros: !!e.forrarLibros,
      libros: Array.isArray(e.libros) ? e.libros : [],
      excluidos: Array.isArray(e.excluidos) ? e.excluidos : [],
      variantes: e.variantes && typeof e.variantes === 'object' ? e.variantes : {},
    };
  } catch {
    return base;
  }
}

/** SKU de los servicios creados por la API en la categoría "Servicios". */
export const SKU = {
  forroCuaderno: 'SRV-FORRO-CUADERNO',
  forroLibro: 'SRV-FORRO-LIBRO',
  etiqueta: 'SRV-ETIQUETA',
  caratula: 'SRV-CARATULA',
} as const;

export const COLORES_FORRO = [
  { nombre: 'Azul', hex: '#2E62D9' },
  { nombre: 'Rojo', hex: '#D93A2B' },
  { nombre: 'Verde', hex: '#2F9E5B' },
  { nombre: 'Amarillo', hex: '#F2C230' },
  { nombre: 'Rosado', hex: '#F27BAA' },
  { nombre: 'Morado', hex: '#7D55D8' },
  { nombre: 'Celeste', hex: '#59B7E8' },
  { nombre: 'Naranja', hex: '#F28B30' },
  { nombre: 'Solo vinifán', hex: 'transparent' },
];

export const CURSOS = [
  'Matemática', 'Comunicación', 'Ciencia y Tecnología', 'Personal Social', 'Inglés',
  'Arte y Cultura', 'Educación Religiosa', 'Educación Física', 'Tutoría',
];

export const DISENOS_ETIQUETA = ['Lisa', 'Estrellas', 'Flores', 'Espacio', 'Deportes', 'Corazones'];

/** Opción de un servicio (color de forro, diseño de etiqueta, curso) */
export interface OpcionServicio { nombre: string; hex?: string | null; imagen?: string | null; recargo: number }

export interface OpcionesServicios {
  colores: OpcionServicio[];
  disenos: OpcionServicio[];
  cursos: string[];
}

/** Valores por defecto si el servicio aún no tiene variantes cargadas en el admin */
export const OPCIONES_POR_DEFECTO: OpcionesServicios = {
  colores: COLORES_FORRO.map(c => ({ nombre: c.nombre, hex: c.hex === 'transparent' ? null : c.hex, recargo: 0 })),
  disenos: DISENOS_ETIQUETA.map(d => ({ nombre: d, recargo: 0 })),
  cursos: CURSOS,
};

const iguales = (a?: string | null, b?: string | null) => (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();
export const buscarOpcion = (lista: OpcionServicio[], nombre?: string | null) => lista.find(o => iguales(o.nombre, nombre));

/** Variantes elegidas para el producto actual del útil (si cambió de producto, ya no aplican). */
export function variantesDe(item: SupplyItem, extras: ListExtras): ItemVariante[] {
  const v = extras.variantes?.[item.id];
  return v && v.productId === item.matchedProductId ? v.valores : [];
}

/** Recargo del diseño o color elegido para el útil. */
export const recargoDe = (item: SupplyItem, extras: ListExtras) => variantesDe(item, extras).reduce((s, v) => s + (v.precio || 0), 0);

/** Precio unitario del útil (con la oferta activa), más el recargo de su diseño o color. */
export function precioUnitario(item: SupplyItem, extras: ListExtras): number {
  if (!item.matchedProduct) return 0;
  return redondear(precioVenta(item.matchedProduct) + recargoDe(item, extras));
}

/** Precio unitario sin oferta (para mostrarlo tachado). */
export function precioSinOferta(item: SupplyItem, extras: ListExtras): number {
  if (!item.matchedProduct) return 0;
  return redondear(item.matchedProduct.basePrice + recargoDe(item, extras));
}

/** Precio unitario de un servicio con el recargo de la opción elegida (si el admin le puso uno). */
export const precioServicio = (base?: Product, opcion?: OpcionServicio) => (base ? precioVenta(base) + (opcion?.recargo ?? 0) : 0);

/** Productos de los servicios (forrado, etiquetas, carátulas) con su precio. */
export interface PreciosServicios {
  forroCuaderno?: Product;
  forroLibro?: Product;
  etiqueta?: Product;
  caratula?: Product;
}

export const cantidadDe = (item: SupplyItem) => item.userCustomQuantity || item.matchedQuantity || item.cantidad;

/** Para quién es la lista: el nombre del alumno (etiquetas) o "Colegio, Grado". */
export function paraQuien(extras: ListExtras, list: { schoolName: string; gradeName: string; estudianteNombre?: string }) {
  return extras.etiquetas.nombre.trim() || list.estudianteNombre?.trim() || `${list.schoolName}, ${list.gradeName}`;
}

export interface LineaExtra { clave: 'forroCuaderno' | 'forroLibro' | 'etiqueta' | 'caratula' | 'libros'; label: string; monto: number }

export interface ResumenLista {
  incluidos: SupplyItem[];
  conProducto: SupplyItem[];
  totalUtiles: number;
  cuadernos: number;
  libros: number;
  conteo: { cuadernos: number; libros: number; etiquetas: number; caratulas: number };
  lineasExtras: LineaExtra[];
  librosPorCotizar: ListBook[];
  total: number;
  /** Lo que se ahorra por las ofertas en los útiles */
  ahorro: number;
}

/** Totales de una lista armada: útiles incluidos, servicios y libros. */
export function resumirLista(items: SupplyItem[], extras: ListExtras, servicios: PreciosServicios, opciones: OpcionesServicios, qty: (i: SupplyItem) => number = cantidadDe): ResumenLista {
  const excluidos = new Set(extras.excluidos ?? []);
  const incluidos = items.filter(i => !excluidos.has(i.id));
  const conProducto = incluidos.filter(i => i.matchedProduct);
  const totalUtiles = redondear(conProducto.reduce((s, i) => s + precioUnitario(i, extras) * qty(i), 0));
  const ahorro = redondear(conProducto.reduce((s, i) => s + (precioSinOferta(i, extras) - precioUnitario(i, extras)) * qty(i), 0));
  const cuadernos = incluidos.filter(esCuaderno).reduce((s, i) => s + qty(i), 0);
  const libros = extras.libros.filter(l => l.titulo.trim()).reduce((s, l) => s + l.cantidad, 0);
  const conteo = { cuadernos, libros, etiquetas: cuadernos + libros, caratulas: extras.caratulas.activo ? extras.caratulas.cursos.length : 0 };
  const colorForro = buscarOpcion(opciones.colores, extras.forro.color);
  const disenoEtiqueta = buscarOpcion(opciones.disenos, extras.etiquetas.diseno);
  const lineasExtras = ([
    { clave: 'forroCuaderno', label: `Forrado (${cuadernos} cuadernos)`, monto: extras.forro.activo ? precioServicio(servicios.forroCuaderno, colorForro) * cuadernos : 0 },
    { clave: 'forroLibro', label: `Forrado (${libros} ${libros === 1 ? 'libro' : 'libros'})`, monto: extras.forro.activo && extras.forrarLibros ? precioServicio(servicios.forroLibro) * libros : 0 },
    { clave: 'etiqueta', label: `Etiquetas (${conteo.etiquetas})`, monto: extras.etiquetas.activo ? precioServicio(servicios.etiqueta, disenoEtiqueta) * conteo.etiquetas : 0 },
    { clave: 'caratula', label: `Carátulas (${conteo.caratulas})`, monto: precioServicio(servicios.caratula) * conteo.caratulas },
    { clave: 'libros', label: 'Libros', monto: extras.libros.reduce((s, l) => s + (l.precio ? l.precio * l.cantidad : 0), 0) },
  ] as LineaExtra[]).filter(l => l.monto > 0).map(l => ({ ...l, monto: redondear(l.monto) }));
  const librosPorCotizar = extras.libros.filter(l => l.titulo.trim() && !l.precio);
  const total = redondear(totalUtiles + lineasExtras.reduce((s, l) => s + l.monto, 0));
  return { incluidos, conProducto, totalUtiles, cuadernos, libros, conteo, lineasExtras, librosPorCotizar, total, ahorro };
}
