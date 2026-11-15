'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Highlighter, Layers, Notebook, Paintbrush, PenLine, Ruler, Shapes, Sticker } from 'lucide-react';
import { categoriesApi, type CategoriaArbol } from '@/services/api';

/** Orden de las categorías en el menú y el catálogo (las que no estén aquí van al final, por nombre). */
const ORDEN = ['Cuadernos', 'Escritura', 'Colores', 'Arte', 'Papeles', 'Pegar', 'Útiles', 'Libros'];

const ICONOS: Record<string, LucideIcon> = {
  Cuadernos: Notebook, Escritura: PenLine, Colores: Highlighter, Arte: Paintbrush,
  Papeles: Layers, Pegar: Sticker, 'Útiles': Ruler, Libros: BookOpen,
};
export const iconoCategoria = (nombre: string): LucideIcon => ICONOS[nombre] ?? Shapes;

/** Nombre que ve el cliente: "Útiles" es muy genérico como categoría. */
const ETIQUETAS: Record<string, string> = { 'Útiles': 'Geometría y organización', Pegar: 'Pegamentos y cintas' };
export const etiquetaCategoria = (nombre: string) => ETIQUETAS[nombre] ?? nombre;

export const ordenarCategorias = <T,>(lista: T[], nombre: (x: T) => string) =>
  [...lista].sort((a, b) => {
    const ia = ORDEN.indexOf(nombre(a)), ib = ORDEN.indexOf(nombre(b));
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || nombre(a).localeCompare(nombre(b), 'es');
  });

/** Enlace al catálogo filtrado por categoría y, opcionalmente, subcategoría. */
export function urlCatalogo(categoria?: string, sub?: string) {
  const q = new URLSearchParams();
  if (categoria) q.set('categoria', categoria);
  if (sub) q.set('sub', sub);
  return `/catalog${q.size ? `?${q}` : ''}`;
}

// El árbol cambia poco: se pide una vez por visita y lo comparten la cabecera y el catálogo
let cache: Promise<CategoriaArbol[]> | null = null;
const pedirArbol = () => {
  cache ??= categoriesApi.arbol()
    .then(a => ordenarCategorias(a, c => c.nombre))
    .catch(() => { cache = null; return [] as CategoriaArbol[]; });
  return cache;
};

/** Categorías y subcategorías con su cantidad de productos; null mientras carga. */
export function useArbolCategorias() {
  const [arbol, setArbol] = useState<CategoriaArbol[] | null>(null);
  useEffect(() => {
    let vivo = true;
    pedirArbol().then(a => { if (vivo) setArbol(a); });
    return () => { vivo = false; };
  }, []);
  return arbol;
}
