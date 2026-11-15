'use client';

import { API, apiFetch } from '@/lib/api-base';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, Camera, Percent, ChevronDown, ChevronRight } from 'lucide-react';
import { productsApi, TODOS_LOS_PRODUCTOS } from '@/services/api';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import ConsultarProducto from '@/components/ConsultarProducto';
import { TIERS } from '@/lib/lista';
import { coincide as coincideBusqueda } from '@/lib/buscar';
import { precioVenta } from '@/lib/precio';
import { evento } from '@/lib/analytics';
import Paginador, { usePaginacion } from '@/components/Paginador';
import { etiquetaCategoria, iconoCategoria, ordenarCategorias } from '@/lib/categorias';

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
  const [categoria, setCategoriaEstado] = useState(params.get('categoria') ?? '');
  const [sub, setSub] = useState(params.get('sub') ?? '');
  // Al cambiar de categoría se olvida la subcategoría
  const setCategoria = (c: string) => { setCategoriaEstado(c); setSub(''); };
  const [marca, setMarca] = useState('');
  const [nivel, setNivel] = useState(params.get('nivel') ?? '');
  const [campana, setCampana] = useState(params.get('campaign') ?? '');
  const [precioMax, setPrecioMax] = useState<number | null>(null);
  const [orden, setOrden] = useState('relevancia');
  const [filtrosMovil, setFiltrosMovil] = useState(false);

  useEffect(() => {
    Promise.all([
      productsApi.getAll({ limit: TODOS_LOS_PRODUCTOS }),
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

  // La categoría, la búsqueda y los filtros quedan en la URL para poder compartir el enlace
  const urlDeseada = (() => {
    const q = new URLSearchParams();
    if (categoria) q.set('categoria', categoria);
    if (sub) q.set('sub', sub);
    if (busqueda.trim()) q.set('q', busqueda.trim());
    if (nivel) q.set('nivel', nivel);
    if (campana) q.set('campaign', campana);
    return q.toString();
  })();
  useEffect(() => {
    router.replace(`/catalog${urlDeseada ? `?${urlDeseada}` : ''}`, { scroll: false });
  }, [urlDeseada, router]);
  // Y al revés: si la URL cambia desde fuera (menú "Categorías" de la cabecera), los filtros la siguen
  const urlActual = params.toString();
  const [urlVista, setUrlVista] = useState(urlActual);
  if (urlActual !== urlVista) {
    setUrlVista(urlActual);
    if (urlActual !== urlDeseada) {
      setCategoriaEstado(params.get('categoria') ?? '');
      setSub(params.get('sub') ?? '');
      setNivel(params.get('nivel') ?? '');
      setCampana(params.get('campaign') ?? '');
      if ((params.get('q') ?? '') !== busqueda.trim()) setBusqueda(params.get('q') ?? '');
    }
  }
  useEffect(() => { const t = setTimeout(() => { if (busqueda.trim().length > 1) evento('search', { search_term: busqueda.trim().slice(0, 100) }); }, 1500); return () => clearTimeout(t); }, [busqueda]);

  const precioTope = useMemo(() => Math.ceil(Math.max(10, ...todos.map(p => precioVenta(p)))), [todos]);
  const tope = precioMax ?? precioTope;

  const coincide = (p: Product, ignorar?: 'categoria' | 'sub' | 'marca' | 'nivel') => {
    // Sin importar tildes ni plurales: "lapiz" y "lapices" encuentran "Lápiz"
    if (busqueda.trim() && !coincideBusqueda(`${p.name} ${p.brand ?? ''} ${p.category} ${p.subcategory ?? ''}`, busqueda)) return false;
    if (ignorar !== 'categoria' && categoria && p.category !== categoria) return false;
    if (ignorar !== 'categoria' && ignorar !== 'sub' && sub && p.subcategory !== sub) return false;
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
  }, [todos, busqueda, categoria, sub, marca, nivel, idsCampana, tope, orden]);
  const pag = usePaginacion(visibles, 24, [busqueda, categoria, sub, marca, nivel, tope, orden, idsCampana?.size ?? 0].join('|'));

  const contar = (ignorar: 'categoria' | 'sub' | 'marca' | 'nivel', clave: (p: Product) => string | null | undefined) =>
    todos.filter(p => coincide(p, ignorar)).reduce((acc, p) => {
      const k = clave(p); if (k) acc[k] = (acc[k] || 0) + 1; return acc;
    }, {} as Record<string, number>);
  const porCategoria = contar('categoria', p => p.category);
  const porSub = contar('sub', p => p.subcategory);
  const totalCategorias = Object.values(porCategoria).reduce((s, n) => s + n, 0);
  const subsDe = (c: string) => [...new Set(todos.filter(p => p.category === c && p.subcategory).map(p => p.subcategory as string))]
    .sort((a, b) => a.localeCompare(b, 'es'));
  const porMarca = contar('marca', p => p.brand);
  const porNivel = contar('nivel', p => p.tier);
  const categorias = ordenarCategorias([...new Set(todos.map(p => p.category))], c => c);
  const marcas = Object.keys(porMarca).sort();

  const activos = [categoria, marca, nivel, campana].filter(Boolean).length + (precioMax !== null ? 1 : 0);
  const limpiar = () => { setBusqueda(''); setCategoria(''); setMarca(''); setNivel(''); setCampana(''); setPrecioMax(null); };
  // Chips de los filtros activos (se quitan uno por uno)
  const nombreCampana = campanas.find(c => c.slug === campana)?.name;
  const chips = [
    categoria && !sub && { texto: etiquetaCategoria(categoria), quitar: () => setCategoria('') },
    sub && { texto: sub, quitar: () => setSub('') },
    marca && { texto: marca, quitar: () => setMarca('') },
    nivel && { texto: TIERS.find(t => t.id === nivel)?.label ?? nivel, quitar: () => setNivel('') },
    campana && { texto: nombreCampana ?? 'Oferta', quitar: () => setCampana('') },
    precioMax !== null && { texto: `Hasta S/ ${precioMax}`, quitar: () => setPrecioMax(null) },
  ].filter(Boolean) as { texto: string; quitar: () => void }[];


  const Filtros = (
    <div className="space-y-6">
      <section aria-labelledby="f-categoria">
        <h2 id="f-categoria" className="mb-2 text-sm font-bold">Categorías</h2>
        <Chip activo={!categoria} onClick={() => setCategoria('')}>
          <span>Todas</span><span className={!categoria ? 'text-white' : 'text-tenue'}>{totalCategorias}</span>
        </Chip>
        <ul className="mt-0.5">
          {categorias.map(c => {
            const Icono = iconoCategoria(c);
            const elegida = categoria === c;
            const subs = elegida ? subsDe(c) : [];
            return (
              <li key={c}>
                <button onClick={() => elegida && !sub ? setCategoria('') : setCategoria(c)} aria-pressed={elegida && !sub} aria-expanded={subsDe(c).length ? elegida : undefined}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${elegida && !sub ? 'bg-primario text-white' : elegida ? 'font-semibold text-primario hover:bg-fondo' : 'text-grafito hover:bg-fondo'}`}>
                  <Icono className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                  <span className="flex-1 truncate">{etiquetaCategoria(c)}</span>
                  <span className={elegida && !sub ? 'text-white' : 'text-tenue'}>{porCategoria[c] || 0}</span>
                  {subsDe(c).length > 0 && (elegida
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-tenue" aria-hidden="true" />)}
                </button>
                {subs.length > 0 && (
                  <ul className="my-1 ml-5 border-l border-linea pl-2" aria-label={`Subcategorías de ${etiquetaCategoria(c)}`}>
                    {subs.map(s => (
                      <li key={s}>
                        <button onClick={() => setSub(sub === s ? '' : s)} aria-pressed={sub === s}
                          className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1 text-left text-[13px] transition-colors ${sub === s ? 'bg-primario text-white' : 'text-grafito hover:bg-fondo'}`}>
                          <span className="truncate">{s}</span><span className={sub === s ? 'text-white' : 'text-tenue'}>{porSub[s] || 0}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
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
          {categoria && (
            <nav aria-label="Ruta" className="mb-1 text-sm text-tenue">
              <ol className="flex flex-wrap items-center gap-1">
                <li><button onClick={() => setCategoria('')} className="cursor-pointer hover:text-primario hover:underline">Productos</button></li>
                <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
                <li>{sub
                  ? <button onClick={() => setSub('')} className="cursor-pointer hover:text-primario hover:underline">{etiquetaCategoria(categoria)}</button>
                  : <span aria-current="page" className="font-semibold text-grafito">{etiquetaCategoria(categoria)}</span>}</li>
                {sub && <><li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li><li aria-current="page" className="font-semibold text-grafito">{sub}</li></>}
              </ol>
            </nav>
          )}
          <h1 className="text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">{sub || (categoria ? etiquetaCategoria(categoria) : 'Arma tu pedido')}</h1>
          <p className="mt-1 text-tenue">{categoria
            ? 'Elige lo que necesitas; puedes juntarlo con la lista de tu colegio en el mismo carrito.'
            : 'Elige útil por útil. Puedes juntarlo con la lista de tu colegio en el mismo carrito.'}</p>
        </div>
        <Link href="/upload" className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border-2 border-grafito px-4 py-2.5 text-sm font-bold hover:bg-papel md:self-auto">
          <Camera className="h-4 w-4" aria-hidden="true" /> ¿Tienes la lista? Súbela
        </Link>
      </div>

      {/* Búsqueda y orden */}
      <div className="mt-6 flex flex-wrap gap-2 sm:flex-nowrap">
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
        <select value={sub ? `${categoria}|${sub}` : categoria} aria-label="Categoría"
          onChange={e => { const [c, s = ''] = e.target.value.split('|'); setCategoriaEstado(c); setSub(s); }}
          className="h-[50px] min-w-0 flex-1 cursor-pointer rounded-xl border border-linea bg-papel px-3 text-sm text-grafito md:hidden">
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <optgroup key={c} label={etiquetaCategoria(c)}>
              <option value={c}>Todo en {etiquetaCategoria(c)}</option>
              {subsDe(c).map(s => <option key={s} value={`${c}|${s}`}>{s}</option>)}
            </optgroup>
          ))}
        </select>
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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="mr-1 text-sm text-tenue" aria-live="polite">{cargando ? 'Cargando productos…' : `${visibles.length} productos`}</p>
            {chips.map(c => (
              <button key={c.texto} onClick={c.quitar} aria-label={`Quitar filtro ${c.texto}`}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-linea bg-papel py-1 pl-3 pr-2 text-xs font-semibold text-grafito hover:border-tenue">
                {c.texto} <X className="h-3.5 w-3.5 text-tenue" aria-hidden="true" />
              </button>
            ))}
            {chips.length > 1 && <button onClick={limpiar} className="cursor-pointer text-xs font-semibold text-profe hover:underline">Quitar todos</button>}
          </div>
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
