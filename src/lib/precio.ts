import type { Product } from '@/lib/types';

/** true si el producto está en una campaña activa con un precio menor. */
export const enOferta = (p?: Pick<Product, 'basePrice' | 'salePrice'> | null): boolean =>
  !!p && p.salePrice != null && p.salePrice < p.basePrice;

/** Precio que se cobra: el de la campaña activa si lo hay, si no el precio normal. */
export const precioVenta = (p?: Pick<Product, 'basePrice' | 'salePrice'> | null): number =>
  !p ? 0 : enOferta(p) ? Number(p.salePrice) : p.basePrice;

/** Porcentaje de descuento redondeado (para la etiqueta "-10%"). */
export const descuentoPct = (p?: Pick<Product, 'basePrice' | 'salePrice'> | null): number =>
  enOferta(p) ? Math.round((1 - Number(p!.salePrice) / p!.basePrice) * 100) : 0;

export const redondear = (n: number) => Math.round(n * 100) / 100;

/** Cupones de la demo: código → porcentaje de descuento sobre los productos (no el envío). */
export const CUPONES: Record<string, number> = { REGRESO10: 10 };

export function aplicarCupon(codigo: string | null | undefined, subtotal: number): { codigo: string; porcentaje: number; descuento: number } | null {
  const c = (codigo ?? '').trim().toUpperCase();
  const porcentaje = CUPONES[c];
  if (!porcentaje) return null;
  return { codigo: c, porcentaje, descuento: redondear(subtotal * porcentaje / 100) };
}
