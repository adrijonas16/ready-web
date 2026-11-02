'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { Check, Package, Search, X } from 'lucide-react';
import { productsApi } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import { ItemVariante, Product, ProductDetail, SupplyItem, VariantValue } from '@/lib/types';
import { Tier, TIERS, tierLabel, tierProduct } from '@/lib/lista';
import { ESTILO_NIVEL } from './Paquetes';

const esNivel = (t?: string): t is Tier => t === 'economico' || t === 'medio' || t === 'premium';

function Foto({ src, alt, className }: { src?: string | null; alt: string; className: string }) {
  return src
    ? <img src={src} alt={alt} width={240} height={240} loading="lazy" className={`${className} object-contain`} />
    : <div className={`${className} flex items-center justify-center`}><Package className="h-8 w-8 text-tenue/40" aria-hidden="true" /></div>;
}

/**
 * Panel para ver el producto elegido (foto, marca, diseños) y cambiarlo por cualquier otro
 * del catálogo de la misma categoría.
 */
export default function SelectorProducto({ item, variantesActuales, onElegir, onClose }: {
  item: SupplyItem;
  variantesActuales: ItemVariante[];
  onElegir: (producto: Product, valores: ItemVariante[]) => void;
  onClose: () => void;
}) {
  const actual = item.matchedProduct;
  const [candidatos, setCandidatos] = useState<Product[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nivel, setNivel] = useState<Tier | 'todos'>('todos');
  const [marca, setMarca] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [extraBusqueda, setExtraBusqueda] = useState<Product[]>([]);
  const [elegido, setElegido] = useState<Product | undefined>(actual);
  const [detalle, setDetalle] = useState<ProductDetail | null>(null);
  const [valores, setValores] = useState<Record<string, VariantValue>>({});
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const previas = useRef(variantesActuales);
  const clavePrevias = variantesActuales.map(v => v.valueId).join(',');
  useEffect(() => { previas.current = variantesActuales; }, [variantesActuales]);

  // Cerrar con Escape y enfocar el panel al abrir
  useEffect(() => {
    cerrarRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = overflow; };
  }, [onClose]);

  // Opciones: los 3 niveles que eligió la IA + todo el catálogo de esa categoría
  useEffect(() => {
    const niveles = TIERS.map(t => tierProduct(item, t.id, true)).filter(Boolean) as Product[];
    const categoria = actual?.category ?? niveles[0]?.category;
    const pedir = categoria
      ? productsApi.getAll({ category: categoria, limit: 300 })
      : productsApi.search(item.nombreOriginal).catch(() => [] as Product[]);
    pedir
      .then((lista: Product[]) => {
        const todos = [...(actual ? [actual] : []), ...niveles, ...lista];
        setCandidatos(todos.filter((p, i) => todos.findIndex(x => x.id === p.id) === i));
      })
      .catch(() => setCandidatos([...(actual ? [actual] : []), ...niveles]))
      .finally(() => setCargando(false));
  }, [item, actual]);

  // Detalle del producto elegido (fotos y diseños)
  useEffect(() => {
    if (!elegido) return;
    let vivo = true;
    productsApi.getById(elegido.id).then((d: ProductDetail) => {
      if (!vivo) return;
      setDetalle(d);
      const iniciales: Record<string, VariantValue> = {};
      d.variants?.forEach(vt => {
        const activos = vt.values.filter(v => v.is_active !== false);
        const previo = activos.find(v => previas.current.some(a => a.valueId === v.id));
        if (activos.length) iniciales[vt.id] = previo ?? activos[0];
      });
      setValores(iniciales);
    }).catch(() => { if (vivo) { setDetalle(null); setValores({}); } });
    return () => { vivo = false; };
  }, [elegido, clavePrevias]);

  // Más parecidos primero (Fuse sobre el nombre del útil)
  const ordenados = useMemo(() => {
    const consulta = (item.nombreDetectado || item.nombreOriginal).replace(/\d+/g, ' ');
    const fuse = new Fuse(candidatos, { keys: ['name', 'brand'], threshold: 0.6, ignoreLocation: true, includeScore: true });
    const puntaje = new Map(fuse.search(consulta).map(r => [r.item.id, r.score ?? 1]));
    const destacados = new Set([actual?.id, item.productEconomicoId, item.productMedioId, item.productPremiumId].filter(Boolean));
    return [...candidatos].sort((a, b) =>
      (b.id === actual?.id ? 1 : 0) - (a.id === actual?.id ? 1 : 0)
      || (destacados.has(b.id) ? 1 : 0) - (destacados.has(a.id) ? 1 : 0)
      || (puntaje.get(a.id) ?? 1) - (puntaje.get(b.id) ?? 1)
      || a.basePrice - b.basePrice);
  }, [candidatos, item, actual]);

  // Búsqueda: primero dentro de la categoría, luego en todo el catálogo
  useEffect(() => {
    const q = busqueda.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => {
      productsApi.search(q).then((r: Product[]) => setExtraBusqueda(r)).catch(() => setExtraBusqueda([]));
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const visibles = useMemo(() => {
    let lista = ordenados;
    const q = busqueda.trim();
    if (q.length >= 2) {
      const fuse = new Fuse([...ordenados, ...extraBusqueda.filter(p => !ordenados.some(o => o.id === p.id))],
        { keys: ['name', 'brand', 'description'], threshold: 0.4, ignoreLocation: true });
      lista = fuse.search(q).map(r => r.item);
    }
    if (nivel !== 'todos') lista = lista.filter(p => p.tier === nivel);
    if (marca) lista = lista.filter(p => p.brand === marca);
    return lista;
  }, [ordenados, busqueda, extraBusqueda, nivel, marca]);

  const marcas = useMemo(() => [...new Set(candidatos.map(p => p.brand).filter(Boolean) as string[])].sort(), [candidatos]);

  const recargo = Object.values(valores).reduce((s, v) => s + (v.price_modifier || 0), 0);
  const imagenVariante = Object.values(valores).find(v => v.image_url)?.image_url;
  const fotoGrande = imagenVariante || detalle?.images?.[0]?.image_url || elegido?.imageUrl;
  const mismoQueActual = elegido?.id === actual?.id
    && Object.values(valores).every(v => variantesActuales.some(a => a.valueId === v.id))
    && Object.keys(valores).length === variantesActuales.length;

  const confirmar = () => {
    if (!elegido) return;
    const tipos = detalle?.variants ?? [];
    onElegir(elegido, Object.entries(valores).map(([tipoId, v]) => ({
      tipo: tipos.find(t => t.id === tipoId)?.name ?? 'Opción',
      valor: v.value,
      valueId: v.id,
      precio: v.price_modifier || 0,
      imagen: v.image_url,
    })));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="selector-titulo" onClick={e => e.stopPropagation()}
        className="animate-entrar flex h-full w-full flex-col bg-papel shadow-2xl sm:max-w-[680px]">
        {/* Encabezado */}
        <div className="flex items-start gap-3 border-b border-linea px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-tenue">La lista pide</p>
            <h2 id="selector-titulo" className="truncate text-xl font-bold">{item.nombreOriginal}</h2>
          </div>
          <button ref={cerrarRef} onClick={onClose} className="cursor-pointer rounded-xl p-2 hover:bg-fondo" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Producto elegido */}
          {elegido && (
            <section aria-label="Producto elegido" className="grid grid-cols-[112px_1fr] gap-4 border-b border-linea bg-fondo px-5 py-5 sm:grid-cols-[220px_1fr] sm:gap-5">
              <Foto src={fotoGrande} alt={elegido.name} className="aspect-square w-full self-start rounded-2xl border border-linea bg-papel p-2 sm:row-span-2" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {elegido.brand && <span className="text-sm font-semibold text-primario">{elegido.brand}</span>}
                  {esNivel(elegido.tier) && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO_NIVEL[elegido.tier].fondo}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${ESTILO_NIVEL[elegido.tier].punto}`} aria-hidden="true" />{tierLabel(elegido.tier)}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-bold leading-snug sm:text-lg">{elegido.name}</h3>
                <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">
                  {formatPrice(elegido.basePrice + recargo)}
                  {recargo > 0 && <span className="ml-2 text-sm font-medium text-tenue">incluye {formatPrice(recargo)} por el diseño</span>}
                </p>
                {(detalle?.description || elegido.description) && (
                  <p className="mt-2 line-clamp-3 text-sm text-tenue">{detalle?.description || elegido.description}</p>
                )}

              </div>
              <div className="col-span-2 -mt-2 sm:col-span-1 sm:col-start-2 sm:mt-0">
                {/* Diseños, colores y otras variantes */}
                {detalle?.variants?.map(vt => {
                  const activos = vt.values.filter(v => v.is_active !== false);
                  if (!activos.length) return null;
                  const conFoto = activos.some(v => v.image_url);
                  return (
                    <fieldset key={vt.id} className="mt-4">
                      <legend className="mb-2 text-sm font-semibold">
                        {vt.name}: <span className="font-normal text-tenue">{valores[vt.id]?.value}</span>
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {activos.map(v => {
                          const sel = valores[vt.id]?.id === v.id;
                          const agotado = v.stock <= 0;
                          return (
                            <button key={v.id} onClick={() => setValores(prev => ({ ...prev, [vt.id]: v }))} disabled={agotado}
                              aria-pressed={sel} title={`${v.value}${v.price_modifier ? ` (+${formatPrice(v.price_modifier)})` : ''}${agotado ? ' (agotado)' : ''}`}
                              className={`cursor-pointer rounded-xl border-2 transition-[border-color] disabled:cursor-not-allowed disabled:opacity-40 ${sel ? 'border-primario' : 'border-linea hover:border-tenue'} ${conFoto ? 'w-[76px] p-1 text-center' : 'px-3 py-1.5 text-sm'}`}>
                              {conFoto ? (
                                <>
                                  <Foto src={v.image_url} alt="" className="aspect-square w-full rounded-lg bg-fondo" />
                                  <span className="mt-1 block truncate text-xs">{v.value}</span>
                                </>
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  {v.color_hex && <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: v.color_hex }} aria-hidden="true" />}
                                  {v.value}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </section>
          )}

          {/* Todas las opciones */}
          <section aria-labelledby="otras" className="px-5 py-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="otras" className="text-lg font-bold">Todas las opciones</h3>
              <span className="text-sm text-tenue">{cargando ? 'Cargando…' : `${visibles.length} productos`}</span>
            </div>

            <label className="relative mt-3 block">
              <span className="sr-only">Buscar producto</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" aria-hidden="true" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} name="buscar-producto" autoComplete="off"
                placeholder="Buscar marca, diseño o tipo, ej.: dinosaurios…"
                className="w-full rounded-xl border border-linea py-2.5 pl-9 pr-3 text-sm focus:border-primario focus:outline-none focus-visible:ring-2 focus-visible:ring-primario/25" />
            </label>

            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por nivel">
              {(['todos', ...TIERS.map(t => t.id)] as const).map(n => (
                <button key={n} onClick={() => setNivel(n)} aria-pressed={nivel === n}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${nivel === n ? 'border-primario bg-primario text-white' : 'border-linea hover:border-tenue'}`}>
                  {n === 'todos' ? 'Todos' : tierLabel(n)}
                </button>
              ))}
            </div>
            {marcas.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por marca">
                {marcas.map(m => (
                  <button key={m} onClick={() => setMarca(marca === m ? null : m)} aria-pressed={marca === m}
                    className={`shrink-0 cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${marca === m ? 'border-grafito bg-grafito text-white' : 'border-linea text-tenue hover:border-tenue'}`}>
                    {m}
                  </button>
                ))}
              </div>
            )}

            {cargando ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4]" />)}
              </div>
            ) : visibles.length === 0 ? (
              <p className="mt-6 rounded-xl bg-fondo px-4 py-6 text-center text-tenue">No hay productos con ese filtro. Prueba con otra marca o búsqueda.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibles.map(p => {
                  const sel = elegido?.id === p.id;
                  const esActual = actual?.id === p.id;
                  return (
                    <li key={p.id}>
                      <button onClick={() => setElegido(p)} aria-pressed={sel}
                        className={`relative flex h-full w-full cursor-pointer flex-col rounded-2xl border-2 bg-papel p-2 text-left transition-[border-color,box-shadow] ${sel ? 'border-primario shadow-[0_6px_20px_-10px_rgba(29,78,216,0.6)]' : 'border-linea hover:border-tenue'}`}>
                        {sel && <span className="absolute right-2 top-2 z-10 rounded-full bg-primario p-1 text-white"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span>}
                        <Foto src={p.imageUrl} alt={p.name} className="aspect-square w-full rounded-xl bg-fondo" />
                        <span className="mt-2 flex items-center gap-1.5 text-xs">
                          {esNivel(p.tier) && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ESTILO_NIVEL[p.tier].punto}`} aria-hidden="true" />}
                          <span className="truncate font-semibold text-primario">{p.brand || tierLabel(esNivel(p.tier) ? p.tier : null)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-sm leading-snug">{p.name}</span>
                        <span className="mt-auto flex items-baseline justify-between gap-2 pt-1.5">
                          <span className="font-bold tabular-nums">{formatPrice(p.basePrice)}</span>
                          {esActual && <span className="text-xs text-tenue">Actual</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Confirmar */}
        <div className="border-t border-linea px-5 py-4">
          <button onClick={confirmar} disabled={!elegido || mismoQueActual}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primario py-3.5 font-bold text-white transition-colors hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-40">
            {mismoQueActual ? 'Es el que ya tienes' : elegido ? `Usar este, ${formatPrice(elegido.basePrice + recargo)} c/u` : 'Elige un producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
