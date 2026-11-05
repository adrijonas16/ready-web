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
