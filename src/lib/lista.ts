import { ListExtras, Product, SupplyItem } from '@/lib/types';

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

export const DISENOS_ETIQUETA = ['lisa', 'estrellas', 'flores', 'espacio', 'deportes', 'corazones'] as const;
