'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { productsApi } from '@/services/api';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

/** Vitrina de la tienda en el inicio: categorías y productos, todo desde la base de datos. */
export default function Vitrina() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    productsApi.getAll({ limit: 1000 })
      .then((ps: Product[]) => setProductos(ps.filter(p => p.category !== 'Servicios')))
      .catch(() => setProductos([]))
      .finally(() => setCargado(true));
  }, []);

  if (cargado && productos.length === 0) return null;

  const categorias = Object.entries(productos.reduce((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {} as Record<string, Product[]>)).sort((a, b) => b[1].length - a[1].length);

  // Destacados: con foto y stock primero, variando de categoría
  const destacados = categorias
    .map(([, ps]) => ps.filter(p => p.stock > 0).sort((a, b) => Number(!!b.imageUrl) - Number(!!a.imageUrl))[0])
    .filter(Boolean)
    .slice(0, 8) as Product[];

  return (
    <>
      <section aria-labelledby="categorias" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 id="categorias" className="text-3xl font-extrabold tracking-[-0.02em]">Compra por categoría</h2>
          <Link href="/catalog" className="inline-flex shrink-0 items-center text-sm font-semibold text-primario hover:underline">
            Ver todo <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(cargado ? categorias.slice(0, 12) : Array.from({ length: 6 }).map((_, i) => [`c${i}`, []] as [string, Product[]])).map(([nombre, ps]) => {
            const foto = ps.find(p => p.imageUrl)?.imageUrl;
            return (
              <li key={nombre}>
                {cargado ? (
                  <Link href={`/catalog?categoria=${encodeURIComponent(nombre)}`}
                    className="group flex h-full flex-col rounded-2xl border border-linea bg-papel p-3 transition-[border-color] hover:border-primario/50">
                    <span className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-fondo">
                      {foto
                        ? <img src={foto} alt="" width={160} height={120} loading="lazy" className="h-full w-full object-contain p-2 transition-transform group-hover:scale-[1.04]" />
                        : <span className="font-display text-3xl font-bold text-primario/30">{nombre.charAt(0)}</span>}
                    </span>
                    <span className="mt-2 font-semibold leading-tight">{nombre}</span>
                    <span className="text-sm text-tenue">{ps.length} productos</span>
                  </Link>
                ) : <div className="skeleton h-40" />}
              </li>
            );
          })}
        </ul>
      </section>

      {destacados.length > 0 && (
        <section aria-labelledby="destacados" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <h2 id="destacados" className="text-3xl font-extrabold tracking-[-0.02em]">Para empezar el año</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {destacados.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
