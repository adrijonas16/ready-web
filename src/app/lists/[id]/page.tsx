'use client';

import { useState, useEffect, useRef, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MODO_DEMO } from '@/lib/api-base';
import { listsApi, productsApi } from '@/services/api';
import { ItemVariante, ListDetail, ListExtras, Product, ProductDetail, SupplyItem } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, MessageSquare, Check, X, Loader2, ShoppingBag, RotateCcw, Info, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Toast from '@/components/Toast';
import { Tier, TIERS, SKU, OPCIONES_POR_DEFECTO, OpcionesServicios, OpcionServicio, buscarOpcion, esCuaderno, parseExtras, precioServicio, precioUnitario, tierProduct, variantesDe } from '@/lib/lista';
import { ElegirPaquete, CambiarPaquete } from '@/components/lista/Paquetes';
import FilaUtil from '@/components/lista/FilaUtil';
import Extras, { PreciosServicios } from '@/components/lista/Extras';
import SelectorProducto from '@/components/lista/SelectorProducto';
import PrecioAnimado from '@/components/PrecioAnimado';
import { lanzarConfeti, volarAlCarrito } from '@/lib/efectos';

// ── Observations Box ──
function ObservationBox({ listId, existing, onSaved }: { listId: string; existing?: string; onSaved: () => void }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await listsApi.addObservacion(listId, text.trim());
      setText('');
      onSaved();
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mb-4">
      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4 text-blue-500" /> Observaciones
      </h3>
      {existing && (
        <div className="bg-slate-50 rounded-xl p-3 mb-3 text-xs text-slate-600 whitespace-pre-line max-h-32 overflow-y-auto">
          {existing.trim()}
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Escribe una observación o corrección…" aria-label="Observación" name="observacion" autoComplete="off"
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        <button onClick={handleSend} disabled={!text.trim() || sending}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
          Enviar
        </button>
      </div>
      <p className="text-[10px] text-neutral-400 mt-1">Si hay un error en la lista, escribe aqui y lo corregiremos</p>
    </div>
  );
}

// ── Mientras la IA lee la lista ──
function LeyendoLista({ imageUrl, startedAt, onTimeout }: { imageUrl?: string; startedAt: number; onTimeout: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const seg = Math.floor((now - startedAt) / 1000);
  const paso = seg < 12 ? 'Leyendo cada línea de la lista…' : seg < 35 ? 'Buscando cada útil en nuestro catálogo…' : 'Calculando las opciones económica, estándar y premium…';
  const primera = imageUrl?.split('|').find(u => /^data:image\/|\.(jpe?g|png|webp|gif)(\?|$)/i.test(u));

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-[minmax(0,380px)_1fr] md:gap-10 md:py-12">
      <div className="relative order-2 mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-linea bg-papel sombra-hoja md:order-1">
        {primera
          ? <img src={primera} alt="Tu lista de útiles" width={380} height={507} className="max-h-[520px] h-auto w-full object-contain" />
          : <div className="papel-rayado h-[420px]" />}
        <div aria-hidden="true" className="animate-escaneo absolute inset-x-0 h-1 bg-acento shadow-[0_0_24px_6px_rgba(255,198,41,0.55)]" />
      </div>
      <div aria-live="polite" className="order-1 md:order-2">
        <h1 className="text-4xl font-extrabold tracking-[-0.03em]">Estamos leyendo tu lista</h1>
        <p className="mt-3 text-lg text-tenue">{onTimeout ? 'Está tardando más de lo normal. Recarga la página en un momento.' : paso}</p>
        <p className="mt-6 max-w-md text-sm text-tenue">
          Suele tomar menos de un minuto. Después nuestro equipo la revisa. Puedes cerrar esta página: la lista queda guardada en{' '}
          <Link href="/my-lists" className="font-semibold text-primario underline underline-offset-2">Mis listas</Link>.
        </p>
      </div>
    </div>
  );
}

// ── La lectura falló o se hará a mano ──
function SinLectura({ estado, mensaje, onRetry, retrying }: { estado?: string | null; mensaje?: string; onRetry: () => void; retrying: boolean }) {
  const error = estado === 'ERROR';
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${error ? 'bg-profe-claro text-profe' : 'bg-primario-claro text-primario'}`}>
        <Info className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight">{error ? 'No pudimos leer la lista' : 'Tu lista está en revisión'}</h1>
      <p className="mt-3 text-tenue">{mensaje || 'Nuestro equipo la revisará y te avisaremos cuando esté armada.'}</p>
      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        {error && (
          <button onClick={onRetry} disabled={retrying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-5 py-3 font-bold text-white hover:bg-primario-oscuro disabled:opacity-50">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Intentar de nuevo
          </button>
        )}
        <Link href="/upload" className="rounded-xl border-2 border-grafito px-5 py-3 font-bold hover:bg-fondo">Subir otra foto</Link>
      </div>
    </div>
  );
}


// ── Esperando la aprobación del equipo ──
function EnRevision({ estado, observaciones, utiles, libros, imageUrl, leida }: {
  estado: string; observaciones?: string; utiles: number; libros: number; imageUrl?: string; leida: boolean;
}) {
  const observada = estado === 'OBSERVADA';
  const pasos = [
    { t: 'Recibimos tu lista', hecho: true },
    { t: leida ? `La leímos: ${utiles} útiles${libros ? ` y ${libros} libros` : ''}` : 'La revisaremos a mano', hecho: leida },
    { t: observada ? 'Encontramos algo por corregir' : 'Nuestro equipo la está revisando', hecho: false, actual: true },
    { t: 'Eliges tu opción y compras', hecho: false },
  ];
  const primera = imageUrl?.split('|').find(u => /^data:image\/|\.(jpe?g|png|webp|gif)(\?|$)/i.test(u));

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-10 px-4 py-10 md:grid-cols-[1fr_320px] md:py-14">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{observada ? 'Tu lista necesita una corrección' : 'Tu lista está en revisión'}</h1>
        <p className="mt-3 max-w-xl text-lg text-tenue">
          {observada
            ? 'Revisa la observación de nuestro equipo. Cuando la corrijamos, podrás elegir tu opción.'
            : 'Revisamos que cada útil coincida con lo que pide el colegio. Cuando la aprobemos te avisamos y podrás elegir entre Económico, Normal y Premium.'}
        </p>
        {observada && observaciones && (
          <p className="mt-5 rounded-2xl border border-profe/30 bg-profe-claro px-4 py-3 text-profe">{observaciones}</p>
        )}
        <ol className="mt-8 space-y-0">
          {pasos.map((p, i) => (
            <li key={p.t} className="relative flex gap-4 pb-6 last:pb-0">
              {i < pasos.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${p.hecho ? 'bg-primario' : 'bg-linea'}`} aria-hidden="true" />}
              <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                p.hecho ? 'border-primario bg-primario text-white' : p.actual ? 'border-primario bg-papel text-primario' : 'border-linea bg-papel text-tenue'}`}>
                {p.hecho ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <p className={`pt-0.5 ${p.actual ? 'font-bold' : p.hecho ? '' : 'text-tenue'}`}>
                {p.t}{p.actual && !observada && <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-acento align-middle" aria-hidden="true" />}
              </p>
            </li>
          ))}
        </ol>
        {MODO_DEMO && !observada && (
          <p className="mt-6 rounded-xl border border-acento bg-acento-claro px-4 py-3 text-sm">
            Esta es una tienda de demostración: el administrador aprueba la lista solo, en unos segundos.
          </p>
        )}
        <p className="mt-8 text-sm text-tenue">
          Puedes cerrar esta página. La lista queda en <Link href="/my-lists" className="font-semibold text-primario underline underline-offset-2">Mis listas</Link>.
        </p>
      </div>
      {primera && (
        <img src={primera} alt="Tu lista de útiles" width={320} height={427} className="h-auto w-full rounded-2xl border border-linea bg-papel object-contain sombra-hoja" />
      )}
    </div>
  );
}

// ── Fotos de la lista original ──
function FotosLista({ urls, onClose }: { urls: string[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} onKeyDown={e => e.key === 'Escape' && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Lista original" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-2xl bg-papel p-4" onClick={e => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Lista original</h2>
          <button onClick={onClose} autoFocus className="rounded-lg p-1.5 hover:bg-fondo" aria-label="Cerrar"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          {urls.map((u, i) => /\.(pdf|docx?)(\?|$)/i.test(u)
            ? <a key={u} href={u} target="_blank" rel="noreferrer" className="block rounded-xl border border-linea p-4 font-semibold text-primario">Abrir archivo {i + 1}</a>
            : <img key={u} src={u} alt={`Hoja ${i + 1}`} width={720} height={960} loading="lazy" className="h-auto w-full rounded-xl border border-linea" />)}
        </div>
      </div>
    </div>
  );
}

// ── Página ──
export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem, setNotasPedido, setListaId, notasPedido } = useCart();
  const { user } = useAuth();
  const [data, setData] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const [extras, setExtras] = useState<ListExtras>(parseExtras());
  const [servicios, setServicios] = useState<PreciosServicios>({});
  const [opciones, setOpciones] = useState<OpcionesServicios>(OPCIONES_POR_DEFECTO);
  const [abierto, setAbierto] = useState<SupplyItem | null>(null);
  const [verFotos, setVerFotos] = useState(false);
  const [eligiendo, setEligiendo] = useState<Tier | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [pollStart] = useState(() => Date.now());
  const [agotado, setAgotado] = useState(false);
  const qtyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const extrasTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Confeti cuando la lista pasa de "en revisión" a aprobada con la página abierta
  const estadoAnterior = useRef<string | undefined>(undefined);
  useEffect(() => {
    const estado = data?.list.estado;
    if (estadoAnterior.current === 'PENDIENTE_REVISION' && estado === 'VALIDADA') lanzarConfeti();
    estadoAnterior.current = estado;
  }, [data?.list.estado]);
  const extrasCargados = useRef(false);

  const loadList = useCallback(() =>
    listsApi.getById(id)
      .then((result: ListDetail) => {
        setData(result);
        setLocalQty(prev => {
          const next: Record<string, number> = {};
          result.items.forEach(i => { next[i.id] = prev[i.id] ?? (i.userCustomQuantity || i.matchedQuantity || i.cantidad); });
          return next;
        });
        if (!extrasCargados.current && result.list.iaEstado !== 'PROCESANDO') {
          const e = parseExtras(result.list.extras);
          if (!e.etiquetas.nombre && result.list.estudianteNombre) e.etiquetas.nombre = result.list.estudianteNombre;
          if (!e.etiquetas.grado && result.list.estudianteGrado) e.etiquetas.grado = result.list.estudianteGrado;
          setExtras(e);
          extrasCargados.current = true;
        }
        return result;
      })
      .catch(() => null)
      .finally(() => setLoading(false)), [id]);

  useEffect(() => { loadList(); }, [loadList]);

  // Precios de los servicios (forrado, etiquetas, carátulas)
  useEffect(() => {
    productsApi.getAll({ category: 'Servicios' }).then(async (ps: Product[]) => {
      const bySku = (sku: string) => ps.find(p => p.sku === sku);
      const s = { forroCuaderno: bySku(SKU.forroCuaderno), forroLibro: bySku(SKU.forroLibro), etiqueta: bySku(SKU.etiqueta), caratula: bySku(SKU.caratula) };
      setServicios(s);
      // Colores, diseños y cursos salen de las variantes de cada servicio (editables en el admin)
      const [forro, etiqueta, caratula] = await Promise.all(
        [s.forroCuaderno, s.etiqueta, s.caratula].map(p => p ? productsApi.getById(p.id).catch(() => null) : null)) as (ProductDetail | null)[];
      const valores = (d: ProductDetail | null): OpcionServicio[] => (d?.variants?.[0]?.values ?? [])
        .filter(v => v.is_active !== false)
        .map(v => ({ nombre: v.value, hex: v.color_hex, imagen: v.image_url, recargo: Number(v.price_modifier) || 0 }));
      setOpciones({
        colores: valores(forro).length ? valores(forro) : OPCIONES_POR_DEFECTO.colores,
        disenos: valores(etiqueta).length ? valores(etiqueta) : OPCIONES_POR_DEFECTO.disenos,
        cursos: valores(caratula).length ? valores(caratula).map(v => v.nombre) : OPCIONES_POR_DEFECTO.cursos,
      });
    }).catch(() => {});
  }, []);

  // Mientras la IA lee la lista, consultar cada 3 s (hasta 4 minutos)
  const procesando = data?.list.iaEstado === 'PROCESANDO';
  useEffect(() => {
    if (!procesando || agotado) return;
    const t = setInterval(() => { loadList(); }, 3000);
    const limite = setTimeout(() => setAgotado(true), 4 * 60 * 1000);
    return () => { clearInterval(t); clearTimeout(limite); };
  }, [procesando, agotado, loadList]);

  // Esperando aprobación: revisar cada 30 s para desbloquear la lista sin recargar
  const esperandoAprobacion = !!data && !procesando && data.list.estado !== 'VALIDADA' && data.list.estado !== 'PROCESADA' && user?.role !== 'ADMIN';
  useEffect(() => {
    if (!esperandoAprobacion) return;
    const t = setInterval(() => { loadList(); }, MODO_DEMO ? 3000 : 30000);
    return () => clearInterval(t);
  }, [esperandoAprobacion, loadList]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  const patchItem = (itemId: string, patch: Partial<SupplyItem>) =>
    setData(d => d ? { ...d, items: d.items.map(i => i.id === itemId ? { ...i, ...patch } : i) } : d);

  const getQty = useCallback((item: SupplyItem) => localQty[item.id] ?? (item.userCustomQuantity || item.matchedQuantity || item.cantidad), [localQty]);

  const setQty = (item: SupplyItem, q: number) => {
    setLocalQty(prev => ({ ...prev, [item.id]: q }));
    clearTimeout(qtyTimers.current[item.id]);
    qtyTimers.current[item.id] = setTimeout(() => {
      listsApi.updateItem(id, item.id, { userCustomQuantity: q }).catch(() => {});
    }, 700);
  };

  const cambiarExtras = (e: ListExtras) => {
    setExtras(e);
    clearTimeout(extrasTimer.current);
    extrasTimer.current = setTimeout(() => {
      listsApi.updateExtras(id, e).catch(() => showToast('No se pudieron guardar los extras', 'error'));
    }, 800);
  };

  const elegirProducto = async (item: SupplyItem, p: Product, valores: ItemVariante[]) => {
    const antes = { matchedProductId: item.matchedProductId, matchedProduct: item.matchedProduct, priceAtMatch: item.priceAtMatch };
    patchItem(item.id, { matchedProductId: p.id, matchedProduct: p, priceAtMatch: p.basePrice });
    const variantes = { ...(extras.variantes ?? {}) };
    if (valores.length) variantes[item.id] = { productId: p.id, valores };
    else delete variantes[item.id];
    cambiarExtras({ ...extras, variantes });
    setAbierto(null);
    try {
      await listsApi.updateItem(id, item.id, { productId: p.id });
      showToast('Producto cambiado');
    } catch {
      patchItem(item.id, antes);
      showToast('No se pudo cambiar el producto', 'error');
    }
  };

  const elegirPaquete = async (tier: Tier) => {
    if (!data) return;
    setEligiendo(tier);
    const anterior = data;
    setData({
      ...data,
      list: { ...data.list, plan: tier },
      items: data.items.map(i => {
        const p = tierProduct(i, tier);
        return p ? { ...i, matchedProductId: p.id, matchedProduct: p, priceAtMatch: p.basePrice } : i;
      }),
    });
    try {
      await listsApi.updatePlan(id, { plan: tier, estudianteNombre: extras.etiquetas.nombre, estudianteGrado: extras.etiquetas.grado, aplicarATodos: true });
    } catch {
      setData(anterior);
      showToast('No se pudo elegir la opción', 'error');
    } finally {
      setEligiendo(null);
    }
  };

  const cerrarSelector = useCallback(() => setAbierto(null), []);

  const reintentar = async () => {
    setRetrying(true);
    try { await listsApi.reprocess(id); await loadList(); }
    catch { showToast('No se pudo reintentar', 'error'); }
    finally { setRetrying(false); }
  };

  const excluidos = useMemo(() => new Set(extras.excluidos ?? []), [extras.excluidos]);
  const incluir = (item: SupplyItem, v: boolean) => {
    const set = new Set(excluidos);
    if (v) set.delete(item.id); else set.add(item.id);
    cambiarExtras({ ...extras, excluidos: [...set] });
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primario" /></div>;
  if (!data) return <div className="py-20 text-center"><h1 className="text-2xl font-bold">No encontramos esta lista</h1><Link href="/my-lists" className="mt-4 inline-block font-semibold text-primario">Ver mis listas</Link></div>;

  const isOwner = !!user && data.list.userId === user.id;
  const isApproved = data.list.estado === 'VALIDADA' || data.list.estado === 'PROCESADA';
  if (!isApproved && !isOwner && user?.role !== 'ADMIN') {
    return <div className="py-20 text-center"><h1 className="text-2xl font-bold">Lista en revisión</h1><p className="mt-2 text-tenue">Esta lista todavía no fue aprobada.</p></div>;
  }

  const esAdmin = user?.role === 'ADMIN';
  if (procesando) return <LeyendoLista imageUrl={data.list.imageUrl} startedAt={pollStart} onTimeout={agotado} />;
  if (data.items.length === 0 && extras.libros.length === 0 && data.list.iaEstado === 'ERROR') {
    return <SinLectura estado={data.list.iaEstado} mensaje={data.list.iaMensaje} onRetry={reintentar} retrying={retrying} />;
  }
  // Solo se elige y compra cuando el equipo aprobó la lista
  if (!isApproved && !esAdmin) {
    return <EnRevision estado={data.list.estado} observaciones={data.list.observaciones} utiles={data.items.length}
      libros={extras.libros.length} imageUrl={data.list.imageUrl} leida={data.items.length > 0} />;
  }

  const items = data.items;
  const incluidos = items.filter(i => !excluidos.has(i.id));
  const hayNiveles = items.some(i => i.productEconomicoId || i.productMedioId || i.productPremiumId);
  const plan = (TIERS.some(t => t.id === data.list.plan) ? data.list.plan : null) as Tier | null;
  const imagenes = (data.list.imageUrl || '').split('|').filter(Boolean);

  // Totales
  const conProducto = incluidos.filter(i => i.matchedProduct);
  const totalUtiles = conProducto.reduce((s, i) => s + precioUnitario(i, extras) * getQty(i), 0);
  const cuadernos = incluidos.filter(esCuaderno).reduce((s, i) => s + getQty(i), 0);
  const libros = extras.libros.filter(l => l.titulo.trim()).reduce((s, l) => s + l.cantidad, 0);
  const conteo = {
    cuadernos,
    libros,
    etiquetas: cuadernos + libros,
    caratulas: extras.caratulas.activo ? extras.caratulas.cursos.length : 0,
  };
  const precioDe = (p?: Product) => p?.basePrice ?? 0;
  const colorForro = buscarOpcion(opciones.colores, extras.forro.color);
  const disenoEtiqueta = buscarOpcion(opciones.disenos, extras.etiquetas.diseno);
  const lineasExtras = [
    { label: `Forrado (${cuadernos} cuadernos)`, monto: extras.forro.activo ? precioServicio(servicios.forroCuaderno, colorForro) * cuadernos : 0 },
    { label: `Forrado (${libros} libros)`, monto: extras.forro.activo && extras.forrarLibros ? precioDe(servicios.forroLibro) * libros : 0 },
    { label: `Etiquetas (${conteo.etiquetas})`, monto: extras.etiquetas.activo ? precioServicio(servicios.etiqueta, disenoEtiqueta) * conteo.etiquetas : 0 },
    { label: `Carátulas (${conteo.caratulas})`, monto: precioDe(servicios.caratula) * conteo.caratulas },
    { label: 'Libros', monto: extras.libros.reduce((s, l) => s + (l.precio ? l.precio * l.cantidad : 0), 0) },
  ].filter(l => l.monto > 0);
  const librosPorCotizar = extras.libros.filter(l => l.titulo.trim() && !l.precio);
  const total = totalUtiles + lineasExtras.reduce((s, l) => s + l.monto, 0);

  const agregarAlCarrito = async () => {
    if (conProducto.length === 0 && lineasExtras.length === 0) { showToast('No hay nada para agregar', 'error'); return; }
    setAgregando(true);
    const etiquetaNota = [extras.etiquetas.nombre && `Nombre: ${extras.etiquetas.nombre}`, extras.etiquetas.grado && `Grado: ${extras.etiquetas.grado}`, `Diseño: ${extras.etiquetas.diseno}`].filter(Boolean).join(' | ');
    const origen = `${data.list.schoolName}, ${data.list.gradeName}`;
    const boton = document.activeElement;
    conProducto.slice(0, 6).forEach((i, k) => setTimeout(() => volarAlCarrito(boton, i.matchedProduct?.imageUrl), k * 110));
    try {
      conProducto.forEach(i => {
        const vs = variantesDe(i, extras);
        const nota = [vs.map(v => `${v.tipo}: ${v.valor}`).join(', '), i.userNotas || i.notas].filter(Boolean).join(' | ');
        addItem({ ...i.matchedProduct!, basePrice: precioUnitario(i, extras) }, getQty(i), nota || undefined, i);
      });
      const s = servicios;
      if (extras.forro.activo && s.forroCuaderno && cuadernos > 0) addItem({ ...s.forroCuaderno, basePrice: precioServicio(s.forroCuaderno, colorForro) }, cuadernos, `Color: ${extras.forro.color || 'a elegir'} (${origen})`);
      if (extras.forro.activo && extras.forrarLibros && s.forroLibro && libros > 0) addItem(s.forroLibro, libros, `(${origen})`);
      if (extras.etiquetas.activo && s.etiqueta && conteo.etiquetas > 0) addItem({ ...s.etiqueta, basePrice: precioServicio(s.etiqueta, disenoEtiqueta) }, conteo.etiquetas, `${etiquetaNota} (${origen})`);
      if (s.caratula && conteo.caratulas > 0) addItem(s.caratula, conteo.caratulas, `Cursos: ${extras.caratulas.cursos.join(', ')}${extras.etiquetas.nombre ? ` | Nombre: ${extras.etiquetas.nombre}` : ''}`);
      // Libros del catálogo: se piden en paralelo (react-best-practices: async-parallel)
      const conPrecio = extras.libros.filter(x => x.precio && x.productoId);
      const productosLibro = await Promise.allSettled(conPrecio.map(l => productsApi.getById(l.productoId!)));
      productosLibro.forEach((r, i) => {
        if (r.status === 'fulfilled') addItem(r.value, conPrecio[i].cantidad, `Libro: ${conPrecio[i].titulo}`);
        else librosPorCotizar.push(conPrecio[i]);
      });
      // Servicios elegidos cuyo precio aún no está configurado en la tienda
      const sinPrecio = [
        extras.forro.activo && !s.forroCuaderno && cuadernos > 0 && `Forrado de ${cuadernos} cuadernos, color ${extras.forro.color || 'a elegir'}`,
        extras.etiquetas.activo && !s.etiqueta && conteo.etiquetas > 0 && `${conteo.etiquetas} etiquetas (${etiquetaNota})`,
        conteo.caratulas > 0 && !s.caratula && `Carátulas: ${extras.caratulas.cursos.join(', ')}`,
      ].filter(Boolean) as string[];
      const pendientes = librosPorCotizar.map(l => `${l.titulo}${l.editorial ? ` (${l.editorial})` : ''} x${l.cantidad}`);
      const otras = notasPedido.filter(n => !n.includes(origen));
      setNotasPedido([
        ...otras,
        ...(pendientes.length ? [`Libros por cotizar, ${origen}: ${pendientes.join('; ')}`] : []),
        ...(sinPrecio.length ? [`Servicios por confirmar, ${origen}: ${sinPrecio.join('; ')}`] : []),
      ]);
      setListaId(id);
      await new Promise(r => setTimeout(r, 750));
      router.push('/cart');
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div className="pb-28 lg:pb-12">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-medium text-tenue hover:text-grafito">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
          </button>
          <p className="text-sm text-tenue"><span className="font-semibold text-grafito">{data.list.schoolName}</span>, {data.list.gradeName} {data.list.year}</p>
          {imagenes.length > 0 && (
            <button onClick={() => setVerFotos(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primario hover:underline">
              <ImageIcon className="h-4 w-4" aria-hidden="true" /> Ver lista original
            </button>
          )}
        </div>

        {esAdmin && !isApproved && (
          <p className="mb-5 rounded-xl bg-eco-claro px-4 py-3 text-sm">
            Vista de administrador: el cliente verá esta lista cuando la apruebes en{' '}
            <Link href={`/admin/lists/review/${id}`} className="font-semibold underline">Revisar lista</Link>.
          </p>
        )}

        {data.list.iaMensaje && (
          <p className={`mb-5 rounded-xl px-4 py-3 text-sm ${data.list.iaEstado === 'DEMO' ? 'bg-eco-claro' : 'bg-primario-claro text-primario-oscuro'}`}>{data.list.iaMensaje}</p>
        )}

        {!plan && hayNiveles ? (
          <ElegirPaquete items={items} qty={getQty} onElegir={elegirPaquete} eligiendo={eligiendo} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-8">
              <section aria-labelledby="utiles">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <h1 id="utiles" className="text-3xl font-extrabold tracking-[-0.03em]">Tu lista</h1>
                    <p className="text-tenue">Toca un útil para ver su foto, marca y todas las opciones. Desmarca lo que ya tienes.</p>
                  </div>
                </div>
                {hayNiveles && <div className="mb-3"><CambiarPaquete items={incluidos} qty={getQty} actual={plan} onElegir={elegirPaquete} /></div>}
                <ul className="divide-y divide-linea rounded-2xl border border-linea bg-papel px-3 sm:px-4">
                  {items.map((item, i) => (
                    <FilaUtil key={item.id} indice={i} item={item} incluido={!excluidos.has(item.id)} qty={getQty(item)}
                      precio={precioUnitario(item, extras)} variantes={variantesDe(item, extras)}
                      onIncluir={v => incluir(item, v)} onQty={q => setQty(item, q)} onAbrir={() => setAbierto(item)} />
                  ))}
                </ul>
              </section>

              <Extras extras={extras} onChange={cambiarExtras} conteo={conteo} servicios={servicios} opciones={opciones} />

              <ObservationBox listId={id} existing={data.list.userObservaciones} onSaved={() => loadList()} />
            </div>

            {/* Resumen */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-linea bg-papel p-5">
                <h2 className="text-lg font-extrabold">Resumen</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><dt>Útiles ({conProducto.length})</dt><dd className="font-semibold"><PrecioAnimado valor={totalUtiles} /></dd></div>
                  {lineasExtras.map(l => (
                    <div key={l.label} className="flex justify-between"><dt>{l.label}</dt><dd className="font-semibold tabular-nums">{formatPrice(l.monto)}</dd></div>
                  ))}
                  {librosPorCotizar.length > 0 && (
                    <div className="flex justify-between text-tenue"><dt>Libros por cotizar ({librosPorCotizar.length})</dt><dd>Te avisamos</dd></div>
                  )}
                </dl>
                <div className="mt-4 flex items-baseline justify-between border-t border-linea pt-4">
                  <span className="font-semibold">Total</span>
                  <PrecioAnimado valor={total} className="text-3xl font-extrabold tracking-tight" />
                </div>
                <button onClick={agregarAlCarrito} disabled={agregando}
                  className="mt-4 hidden w-full items-center justify-center gap-2 rounded-xl bg-acento py-3.5 font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro disabled:opacity-50 lg:flex">
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {agregando ? 'Agregando…' : 'Agregar al carrito'}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Barra fija en celular */}
      {(plan || !hayNiveles) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-papel/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <div>
              <p className="text-xs text-tenue">Total</p>
              <p className="text-2xl font-extrabold"><PrecioAnimado valor={total} /></p>
            </div>
            <button onClick={agregarAlCarrito} disabled={agregando}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-acento px-5 py-3.5 font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro disabled:opacity-50">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Agregar al carrito
            </button>
          </div>
        </div>
      )}

      {verFotos && <FotosLista urls={imagenes} onClose={() => setVerFotos(false)} />}
      {abierto && (
        <SelectorProducto item={abierto} variantesActuales={variantesDe(abierto, extras)}
          onElegir={(p, valores) => elegirProducto(abierto, p, valores)} onClose={cerrarSelector} />
      )}
    </div>
  );
}
