'use client';

import { API, apiFetch } from '@/lib/api-base';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, Camera, Percent } from 'lucide-react';
import { productsApi } from '@/services/api';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import ConsultarProducto from '@/components/ConsultarProducto';
import { TIERS } from '@/lib/lista';
import { coincide as coincideBusqueda } from '@/lib/buscar';
import { precioVenta } from '@/lib/precio';
import { evento } from '@/lib/analytics';
import Paginador, { usePaginacion } from '@/components/Paginador';

/** Categorías internas que no se venden sueltas en la tienda */
const OCULTAS = new Set(['Servicios']);

interface Campana { id: string; name: string; slug: string; discount_percent: number }

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={activo}
      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${activo ? 'bg-primario text-white' : 'text-grafito hover:bg-fondo'}`}>
      {children}
    </button>
  );
}

export default function CatalogPage() {
  return <Suspense><Catalogo /></Suspense>;
}

function Catalogo() {
  const params = useSearchParams();
  const router = useRouter();
  const [todos, setTodos] = useState<Product[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [idsCampana, setIdsCampana] = useState<Set<string> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState(params.get('q') ?? '');
  const [categoria, setCategoria] = useState(params.get('categoria') ?? '');
  const [marca, setMarca] = useState('');
  const [nivel, setNivel] = useState(params.get('nivel') ?? '');
  const [campana, setCampana] = useState(params.get('campaign') ?? '');
  const [precioMax, setPrecioMax] = useState<number | null>(null);
  const [orden, setOrden] = useState('relevancia');
  const [filtrosMovil, setFiltrosMovil] = useState(false);

  useEffect(() => {
    Promise.all([
      productsApi.getAll({ limit: 1000 }),
      apiFetch(`${API}/campaigns?activeOnly=true`).then(r => r.json()).then(d => d.data || []).catch(() => []),
    ]).then(([ps, cs]) => {
      setTodos((ps as Product[]).filter(p => !OCULTAS.has(p.category)));
      setCampanas(cs);
    }).catch(() => setTodos([]))
      .finally(() => setCargando(false));
  }, []);

  // Productos de la oferta elegida (al quitar la oferta se olvidan durante el render)
  const [campanaPrevia, setCampanaPrevia] = useState(campana);
  if (campana !== campanaPrevia) {
    setCampanaPrevia(campana);
    if (!campana) setIdsCampana(null);
  }
  useEffect(() => {
    if (!campana) return;
    apiFetch(`${API}/campaigns/${campana}`).then(r => r.json())
      .then(res => setIdsCampana(new Set<string>(res.data?.products?.map((p: { id: string }) => p.id) || [])))
      .catch(() => setIdsCampana(new Set()));
  }, [campana]);

  // La categoría y la búsqueda quedan en la URL para poder compartir el enlace
  useEffect(() => {
    const q = new URLSearchParams();
    if (categoria) q.set('categoria', categoria);
    if (busqueda.trim()) q.set('q', busqueda.trim());
    if (nivel) q.set('nivel', nivel);
    if (campana) q.set('campaign', campana);
    router.replace(`/catalog${q.size ? `?${q}` : ''}`, { scroll: false });
  }, [categoria, busqueda, nivel, campana, router]);
  useEffect(() => { const t = setTimeout(() => { if (busqueda.trim().length > 1) evento('search', { search_term: busqueda.trim().slice(0, 100) }); }, 1500); return () => clearTimeout(t); }, [busqueda]);

  const precioTope = useMemo(() => Math.ceil(Math.max(10, ...todos.map(p => precioVenta(p)))), [todos]);
  const tope = precioMax ?? precioTope;

  const coincide = (p: Product, ignorar?: 'categoria' | 'marca' | 'nivel') => {
    // Sin importar tildes ni plurales: "lapiz" y "lapices" encuentran "Lápiz"
    if (busqueda.trim() && !coincideBusqueda(`${p.name} ${p.brand ?? ''} ${p.category}`, busqueda)) return false;
    if (ignorar !== 'categoria' && categoria && p.category !== categoria) return false;
    if (ignorar !== 'marca' && marca && p.brand !== marca) return false;
    if (ignorar !== 'nivel' && nivel && p.tier !== nivel) return false;
    if (idsCampana && !idsCampana.has(p.id)) return false;
    return precioVenta(p) <= tope;
  };

  const visibles = useMemo(() => {
    const lista = todos.filter(p => coincide(p));
    if (orden === 'precio-asc') lista.sort((a, b) => precioVenta(a) - precioVenta(b));
    else if (orden === 'precio-desc') lista.sort((a, b) => precioVenta(b) - precioVenta(a));
    else if (orden === 'nombre') lista.sort((a, b) => a.name.localeCompare(b.name));
    else lista.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || a.category.localeCompare(b.category) || precioVenta(a) - precioVenta(b));
    return lista;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, busqueda, categoria, marca, nivel, idsCampana, tope, orden]);
  const pag = usePaginacion(visibles, 24, [busqueda, categoria, marca, nivel, tope, orden, idsCampana?.size ?? 0].join('|'));

  const contar = (ignorar: 'categoria' | 'marca' | 'nivel', clave: (p: Product) => string | undefined) =>
    todos.filter(p => coincide(p, ignorar)).reduce((acc, p) => {
      const k = clave(p); if (k) acc[k] = (acc[k] || 0) + 1; return acc;
    }, {} as Record<string, number>);
  const porCategoria = contar('categoria', p => p.category);
  const porMarca = contar('marca', p => p.brand);
  const porNivel = contar('nivel', p => p.tier);
  const categorias = [...new Set(todos.map(p => p.category))].sort();
  const marcas = Object.keys(porMarca).sort();

  const activos = [categoria, marca, nivel, campana].filter(Boolean).length + (precioMax !== null ? 1 : 0);
  const limpiar = () => { setBusqueda(''); setCategoria(''); setMarca(''); setNivel(''); setCampana(''); setPrecioMax(null); };


  const Filtros = (
    <div className="space-y-6">
      <section aria-labelledby="f-nivel">
        <h2 id="f-nivel" className="mb-2 text-sm font-bold">Nivel</h2>
        {TIERS.map(t => (
          <Chip key={t.id} activo={nivel === t.id} onClick={() => setNivel(nivel === t.id ? '' : t.id)}>
            <span>{t.label}</span><span className={nivel === t.id ? 'text-white' : 'text-tenue'}>{porNivel[t.id] || 0}</span>
          </Chip>
        ))}
      </section>
      {marcas.length > 0 && (
        <section aria-labelledby="f-marca">
          <h2 id="f-marca" className="mb-2 text-sm font-bold">Marca</h2>
          <div className="max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {marcas.map(m => (
              <Chip key={m} activo={marca === m} onClick={() => setMarca(marca === m ? '' : m)}>
                <span className="truncate">{m}</span><span className={marca === m ? 'text-white' : 'text-tenue'}>{porMarca[m]}</span>
              </Chip>
            ))}
          </div>
        </section>
      )}
      <section aria-labelledby="f-precio">
        <h2 id="f-precio" className="mb-2 flex justify-between text-sm font-bold">Precio <span className="font-normal text-tenue">hasta S/ {tope}</span></h2>
        <input type="range" min={1} max={precioTope} step={1} value={tope} aria-labelledby="f-precio"
          onChange={e => setPrecioMax(Number(e.target.value) >= precioTope ? null : Number(e.target.value))}
          className="w-full cursor-pointer accent-primario" />
      </section>
      {campanas.length > 0 && (
        <section aria-labelledby="f-ofertas">
          <h2 id="f-ofertas" className="mb-2 flex items-center gap-1.5 text-sm font-bold"><Percent className="h-3.5 w-3.5 text-profe" aria-hidden="true" /> Ofertas</h2>
          {campanas.map(c => (
            <Chip key={c.id} activo={campana === c.slug} onClick={() => setCampana(campana === c.slug ? '' : c.slug)}>
              <span className="truncate">{c.name}</span><span className={campana === c.slug ? 'text-white' : 'text-profe'}>-{c.discount_percent}%</span>
            </Chip>
          ))}
        </section>
      )}
      {activos > 0 && <button onClick={limpiar} className="cursor-pointer text-sm font-semibold text-profe hover:underline">Quitar filtros ({activos})</button>}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">Arma tu pedido</h1>
          <p className="mt-1 text-tenue">Elige útil por útil. Puedes juntarlo con la lista de tu colegio en el mismo carrito.</p>
        </div>
        <Link href="/upload" className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border-2 border-grafito px-4 py-2.5 text-sm font-bold hover:bg-papel md:self-auto">
          <Camera className="h-4 w-4" aria-hidden="true" /> ¿Tienes la lista? Súbela
        </Link>
      </div>

      {/* Categorías */}
      <nav aria-label="Categorías" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        <button onClick={() => setCategoria('')} aria-pressed={!categoria}
          className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${!categoria ? 'border-primario bg-primario text-white' : 'border-linea bg-papel hover:border-tenue'}`}>
          Todo
        </button>
        {categorias.map(c => (
          <button key={c} onClick={() => setCategoria(categoria === c ? '' : c)} aria-pressed={categoria === c}
            className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${categoria === c ? 'border-primario bg-primario text-white' : 'border-linea bg-papel hover:border-tenue'}`}>
            {c} <span className={categoria === c ? 'text-white' : 'text-tenue'}>{porCategoria[c] || 0}</span>
          </button>
        ))}
      </nav>

      {/* Búsqueda y orden */}
      <div className="mt-4 flex flex-wrap gap-2 sm:flex-nowrap">
        <label className="relative min-w-0 flex-[1_1_100%] sm:flex-1">
          <span className="sr-only">Buscar productos</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-tenue" aria-hidden="true" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} name="q" type="search" autoComplete="off"
            placeholder="Busca cuadernos, colores, una marca…"
            className="buscador w-full rounded-xl border border-linea bg-papel py-3 pl-11 pr-12 focus:border-primario focus:outline-none focus-visible:ring-2 focus-visible:ring-primario/25" />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" title="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-tenue hover:bg-fondo hover:text-grafito">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </label>
        <button onClick={() => setFiltrosMovil(true)} aria-label="Filtros"
          className="relative flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-xl border border-linea bg-papel md:hidden">
          <SlidersHorizontal className="h-5 w-5" />
          {activos > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primario text-[11px] font-bold text-white">{activos}</span>}
        </button>
        <select value={orden} onChange={e => setOrden(e.target.value)} aria-label="Ordenar"
          className="h-[50px] flex-1 cursor-pointer rounded-xl border border-linea bg-papel px-3 text-sm text-grafito sm:flex-none">
          <option value="relevancia">Recomendados</option>
          <option value="precio-asc">Menor precio</option>
          <option value="precio-desc">Mayor precio</option>
          <option value="nombre">Nombre</option>
        </select>
      </div>

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-60 shrink-0 md:block">{Filtros}</aside>

        {filtrosMovil && (
          <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setFiltrosMovil(false)}>
            <div role="dialog" aria-modal="true" aria-label="Filtros" onClick={e => e.stopPropagation()}
              className="animate-entrar absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-papel">
              <div className="flex items-center justify-between border-b border-linea px-5 py-4">
                <h2 className="text-lg font-bold">Filtros</h2>
                <button onClick={() => setFiltrosMovil(false)} className="cursor-pointer rounded-lg p-1.5 hover:bg-fondo" aria-label="Cerrar"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{Filtros}</div>
              <div className="border-t border-linea p-4">
                <button onClick={() => setFiltrosMovil(false)} className="w-full cursor-pointer rounded-xl bg-primario py-3 font-bold text-white">Ver {visibles.length} productos</button>
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="mb-3 text-sm text-tenue" aria-live="polite">{cargando ? 'Cargando productos…' : `${visibles.length} productos`}</p>
          {cargando ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4]" />)}
            </div>
          ) : visibles.length === 0 ? (
            <div className="rounded-2xl border border-linea bg-papel px-6 py-14 text-center">
              <h2 className="text-lg font-bold">{busqueda.trim() ? `No encontramos «${busqueda.trim()}»` : 'No encontramos productos con esos filtros'}</h2>
              <p className="mt-1 text-tenue">Prueba con otra palabra o quita algún filtro.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {busqueda && <button onClick={() => setBusqueda('')} className="cursor-pointer rounded-xl border-2 border-grafito px-4 py-2 font-bold">Limpiar búsqueda</button>}
                {activos > 0 && <button onClick={limpiar} className="cursor-pointer rounded-xl bg-primario px-4 py-2.5 font-bold text-white">Quitar filtros</button>}
              </div>
              <div className="mx-auto mt-8 max-w-lg border-t border-linea pt-6">
                <ConsultarProducto key={busqueda.trim()} productoInicial={busqueda.trim()} />
              </div>
            </div>
          ) : (
            <>
              <h2 className="sr-only">Productos</h2>
              <div id="grilla-productos" className="grid scroll-mt-24 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {pag.visibles.map((p, i) => <ProductCard key={p.id} product={p} prioridad={pag.pagina === 1 && i < 4} />)}
              </div>
              <Paginador {...pag} onCambiar={pag.setPagina} nombre="productos" anclaId="grilla-productos" variante="tienda" />
              <div className="mt-10 rounded-2xl border border-dashed border-linea-fuerte bg-papel px-5 py-5">
                <ConsultarProducto />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
