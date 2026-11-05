'use client';

import { useEffect, useState } from 'react';
import type { Product, ProductDetail } from '@/lib/types';
import { productsApi } from '@/services/api';
import { OPCIONES_POR_DEFECTO, OpcionServicio, OpcionesServicios, PreciosServicios, SKU } from '@/lib/lista';

let cache: Promise<{ servicios: PreciosServicios; opciones: OpcionesServicios }> | null = null;

/** Precios de los servicios (forrado, etiquetas, carátulas) y sus opciones (colores, diseños, cursos). */
export function cargarServicios() {
  cache ??= productsApi.getAll({ category: 'Servicios' }).then(async (ps: Product[]) => {
    const bySku = (sku: string) => ps.find(p => p.sku === sku);
    const servicios = { forroCuaderno: bySku(SKU.forroCuaderno), forroLibro: bySku(SKU.forroLibro), etiqueta: bySku(SKU.etiqueta), caratula: bySku(SKU.caratula) };
    // Colores, diseños y cursos salen de las variantes de cada servicio (editables en el admin)
    const [forro, etiqueta, caratula] = await Promise.all(
      [servicios.forroCuaderno, servicios.etiqueta, servicios.caratula].map(p => p ? productsApi.getById(p.id).catch(() => null) : null)) as (ProductDetail | null)[];
    const valores = (d: ProductDetail | null): OpcionServicio[] => (d?.variants?.[0]?.values ?? [])
      .filter(v => v.is_active !== false)
      .map(v => ({ nombre: v.value, hex: v.color_hex, imagen: v.image_url, recargo: Number(v.price_modifier) || 0 }));
    const opciones: OpcionesServicios = {
      colores: valores(forro).length ? valores(forro) : OPCIONES_POR_DEFECTO.colores,
      disenos: valores(etiqueta).length ? valores(etiqueta) : OPCIONES_POR_DEFECTO.disenos,
      cursos: valores(caratula).length ? valores(caratula).map(v => v.nombre) : OPCIONES_POR_DEFECTO.cursos,
    };
    return { servicios, opciones };
  }).catch(() => { cache = null; return { servicios: {}, opciones: OPCIONES_POR_DEFECTO }; });
  return cache;
}

export function useServicios() {
  const [estado, setEstado] = useState<{ servicios: PreciosServicios; opciones: OpcionesServicios; listo: boolean }>({ servicios: {}, opciones: OPCIONES_POR_DEFECTO, listo: false });
  useEffect(() => {
    let vivo = true;
    cargarServicios().then(r => { if (vivo) setEstado({ ...r, listo: true }); });
    return () => { vivo = false; };
  }, []);
  return estado;
}
