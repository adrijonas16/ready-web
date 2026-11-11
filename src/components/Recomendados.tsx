'use client';

import { useEffect, useState } from 'react';
import { productsApi } from '@/services/api';
import type { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

const MAX = 8;

const palabras = (nombre: string) =>
  nombre.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(Boolean);

/** Cuántas palabras iniciales comparten dos nombres ("cuaderno a4 cuadriculado ..." con otra marca = 3). */
function parecido(a: string[], b: string[]) {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/**
 * Elige recomendados: primero el mismo útil en otras marcas y precios, después lo demás de la categoría,
 * y si faltan, otros útiles de la tienda. Sin servicios (forrado, etiquetas) ni productos agotados.
 */
export function elegirRecomendados(actual: Pick<Product, 'id' | 'name'>, candidatos: Product[]) {
  const base = palabras(actual.name);
  const vistos = new Set<string>([actual.id]);
  return candidatos
    .filter(p => {
      if (vistos.has(p.id) || p.category === 'Servicios' || p.stock <= 0) return false;
      vistos.add(p.id);
      return true;
    })
    .map((p, orden) => ({ p, orden, score: parecido(base, palabras(p.name)) }))
    .sort((x, y) => y.score - x.score || (y.p.rating ?? 0) - (x.p.rating ?? 0) || x.orden - y.orden)
    .slice(0, MAX)
    .map(x => x.p);
}

export default function Recomendados({ producto }: { producto: Pick<Product, 'id' | 'name' | 'category'> }) {
  const [lista, setLista] = useState<Product[] | null>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      const [mismaCategoria, generales] = await Promise.allSettled([
        productsApi.getAll({ category: producto.category, limit: 60 }),
        productsApi.getAll({ limit: 24 }),
      ]);
      const candidatos = [
        ...(mismaCategoria.status === 'fulfilled' ? mismaCategoria.value : []),
        ...(generales.status === 'fulfilled' ? generales.value : []),
      ];
      if (vigente) setLista(elegirRecomendados(producto, candidatos));
    })();
    return () => { vigente = false; };
  }, [producto]);

  if (!lista || lista.length === 0) return null;

  return (
    <section aria-labelledby="titulo-recomendados" className="mt-10">
      <h2 id="titulo-recomendados" className="mb-4 text-lg font-bold text-slate-900">Recomendados</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {lista.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
