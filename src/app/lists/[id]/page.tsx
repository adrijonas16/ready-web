'use client';

import { useState, useEffect, useRef, useCallback, useMemo, use } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NoEncontrado from '@/components/NoEncontrado';
import { MODO_DEMO, mensajeError } from '@/lib/api-base';
import { useAntiSpam, type DatosAntiSpam } from '@/lib/antispam';
import { AvisoError, CampoTrampa, ErrorCampo } from '@/components/form/Campo';
import { LARGO, validarTexto } from '@/lib/validar';
import { listsApi, productsApi } from '@/services/api';
import { ItemVariante, ListDetail, ListExtras, Product, SupplyItem } from '@/lib/types';
import { LineaNueva, useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, MessageSquare, Check, X, Loader2, ShoppingBag, RotateCcw, Info, Image as ImageIcon, Plus, Copy, Share2, Printer, Users, Link2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Toast from '@/components/Toast';
import { Tier, TIERS, buscarOpcion, parseExtras, paraQuien, precioServicio, precioSinOferta, precioUnitario, recargoDe, resumirLista, tierLabel, tierProduct, variantesDe } from '@/lib/lista';
import { useServicios } from '@/lib/servicios';
import { enlaceWhatsapp } from '@/lib/ajustes';
import { ElegirPaquete, CambiarPaquete } from '@/components/lista/Paquetes';
import FilaUtil from '@/components/lista/FilaUtil';
import Extras from '@/components/lista/Extras';
import SelectorProducto from '@/components/lista/SelectorProducto';
import PrecioAnimado from '@/components/PrecioAnimado';
import { lanzarConfeti, volarAlCarrito } from '@/lib/efectos';
import { copiaDe, esMiCopia, guardarCopia } from '@/lib/copias';

// ── Observaciones del cliente sobre su lista ──
function ObservationBox({ listId, existing, onSaved }: { listId: string; existing?: string; onSaved: () => void }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState('');
  const [enviado, setEnviado] = useState(false);
  const anti = useAntiSpam('observacion');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const err = validarTexto(text, { campo: 'tu observación', min: 3, max: LARGO.texto });
    setError(err); setErrorServidor(''); setEnviado(false);
    if (err) { document.getElementById('observacion')?.focus(); return; }
    const limite = anti.revisar();
    if (limite) { setErrorServidor(limite); return; }
    setSending(true);
    try {
      await listsApi.addObservacion(listId, text.trim(), await anti.datos());
      anti.anotar(); anti.reiniciar();
      setText(''); setEnviado(true);
      onSaved();
    } catch (er) {
      setErrorServidor(mensajeError(er, 'No pudimos enviar tu observación. Inténtalo de nuevo.'));
    } finally { setSending(false); }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mb-4">
      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4 text-blue-500" aria-hidden="true" /> Observaciones
      </h3>
      {existing && (
        <div className="bg-slate-50 rounded-xl p-3 mb-3 text-xs text-slate-600 whitespace-pre-line max-h-32 overflow-y-auto" tabIndex={0} role="region" aria-label="Observaciones enviadas">
          {existing.trim()}
        </div>
      )}
      <form onSubmit={handleSend} noValidate className="relative" aria-busy={sending}>
        <CampoTrampa {...anti.trampa} sufijo="obs" />
        <label htmlFor="observacion" className="sr-only">Observación</label>
        <div className="flex gap-2">
          <input id="observacion" type="text" value={text} onChange={e => { setText(e.target.value); setError(null); }}
            placeholder="Escribe una observación o corrección…" name="observacion" autoComplete="off" maxLength={LARGO.texto}
            aria-invalid={error ? true : undefined} aria-describedby={error ? 'observacion-error' : 'observacion-ayuda'}
            className={`min-w-0 flex-1 px-3 py-2 border rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${error ? 'border-profe' : 'border-slate-300'}`} />
          <button type="submit" disabled={sending}
            className="min-h-11 shrink-0 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        <ErrorCampo id="observacion" error={error} />
      </form>
      {errorServidor && <div className="mt-2"><AvisoError>{errorServidor}</AvisoError></div>}
      {enviado && <p role="status" className="mt-1 text-xs font-semibold text-eco">¡Gracias! Recibimos tu observación.</p>}
      <p id="observacion-ayuda" className="text-xs text-tenue mt-1">Si hay un error en la lista, escríbelo aquí y lo corregimos.</p>
    </div>
  );
}

// ── Mientras la IA lee la lista ──
function LeyendoLista({ imageUrl, startedAt, onTimeout }: { imageUrl?: string; startedAt: number; onTimeout: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const seg = Math.floor((now - startedAt) / 1000);
  const paso = seg < 12 ? 'Leyendo cada línea de la lista…' : seg < 35 ? 'Buscando cada útil en nuestro catálogo…' : 'Calculando las opciones económica, estándar y premium…';
  const primera = imageUrl?.split('|').find(u => /^data:image\/|\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(u));

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-[minmax(0,380px)_1fr] md:gap-10 md:py-12">
      <div className="relative order-2 mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-linea bg-papel sombra-hoja md:order-1">
        {primera
          ? <img src={primera} alt="Tu lista de útiles" width={380} height={507} className="max-h-[520px] h-auto w-full object-contain" />
          : <div className="papel-rayado h-[420px]" />}
        <div aria-hidden="true" className="animate-escaneo absolute inset-x-0 top-0 bottom-1"><div className="h-1 bg-acento shadow-[0_0_24px_6px_rgba(255,198,41,0.55)]" /></div>
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
  const primera = imageUrl?.split('|').find(u => /^data:image\/|\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(u));

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

// ── Versión para imprimir (solo se ve al imprimir) ──
function ListaImprimible({ data, resumen, extras, qty, para, plan }: {
  data: ListDetail; resumen: ReturnType<typeof resumirLista>; extras: ListExtras; qty: (i: SupplyItem) => number; para: string; plan: Tier | null;
}) {
  return (
    <div className="hidden print:block print:p-0">
      <h1 className="text-2xl font-extrabold">Lista de útiles · {data.list.schoolName}</h1>
      <p className="mt-1 text-sm">{data.list.gradeName} {data.list.year} · Para {para}{plan ? ` · Opción ${tierLabel(plan)}` : ''}</p>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead><tr className="border-b-2 border-black text-left"><th className="py-1.5">Útil</th><th className="py-1.5">Producto</th><th className="py-1.5 text-right">Cant.</th><th className="py-1.5 text-right">Total</th></tr></thead>
        <tbody>
          {resumen.incluidos.map(i => (
            <tr key={i.id} className="border-b border-gray-300 align-top">
              <td className="py-1.5 pr-2">{i.nombreOriginal}</td>
              <td className="py-1.5 pr-2">{i.matchedProduct ? `${i.matchedProduct.name}${i.matchedProduct.brand ? ` (${i.matchedProduct.brand})` : ''}${variantesDe(i, extras).map(v => `, ${v.tipo}: ${v.valor}`).join('')}` : 'Por conseguir'}</td>
              <td className="py-1.5 text-right">{qty(i)}</td>
              <td className="py-1.5 text-right">{i.matchedProduct ? formatPrice(precioUnitario(i, extras) * qty(i)) : '—'}</td>
            </tr>
          ))}
          {resumen.lineasExtras.map(l => (
            <tr key={l.clave} className="border-b border-gray-300"><td className="py-1.5" colSpan={3}>{l.label}</td><td className="py-1.5 text-right">{formatPrice(l.monto)}</td></tr>
          ))}
          {resumen.librosPorCotizar.map(l => (
            <tr key={l.id} className="border-b border-gray-300"><td className="py-1.5" colSpan={3}>Libro: {l.titulo} x{l.cantidad}</td><td className="py-1.5 text-right">Por cotizar</td></tr>
          ))}
        </tbody>
        <tfoot><tr><td className="pt-3 font-bold" colSpan={3}>Total</td><td className="pt-3 text-right text-lg font-bold">{formatPrice(resumen.total)}</td></tr></tfoot>
      </table>
      <p className="mt-6 text-xs">Ready · Útiles escolares en Arequipa</p>
    </div>
  );
}

/** true mientras se imprime: la versión en tabla solo se arma para imprimir. */
function useImprimiendo() {
  const [imprimiendo, setImprimiendo] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('print');
    const cambiar = (v: boolean) => flushSync(() => setImprimiendo(v));
    const antes = () => cambiar(true), despues = () => cambiar(false), alCambiar = (e: MediaQueryListEvent) => cambiar(e.matches);
    window.addEventListener('beforeprint', antes);
    window.addEventListener('afterprint', despues);
    mql.addEventListener('change', alCambiar);
    return () => { window.removeEventListener('beforeprint', antes); window.removeEventListener('afterprint', despues); mql.removeEventListener('change', alCambiar); };
  }, []);
  return [imprimiendo, setImprimiendo] as const;
}

// ── Página ──
export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { replaceList, lineasDeLista } = useCart();
  const { user } = useAuth();
  const [data, setData] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const [extras, setExtras] = useState<ListExtras>(parseExtras());
  const { servicios, opciones } = useServicios();
  const [menuCompartir, setMenuCompartir] = useState(false);
  const [imprimiendo, setImprimiendo] = useImprimiendo();
  const [abierto, setAbierto] = useState<SupplyItem | null>(null);
  const [verFotos, setVerFotos] = useState(false);
  const [eligiendo, setEligiendo] = useState<Tier | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [panelAgregar, setPanelAgregar] = useState(false);
  const [copiando, setCopiando] = useState(false);
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

  // Lista del colegio (o de otra familia): se ve, pero al ajustarla se trabaja sobre una copia propia,
  // así lo que cambia una familia no le cambia la lista a las demás.
  const compartida = !!data && user?.role !== 'ADMIN' && !(user && data.list.userId === user.id) && !esMiCopia(id);
  const copiaPrevia = compartida ? copiaDe(id) : undefined;

  const copiarYAbrir = async (plan?: Tier, nueva = false, original = id) => {
    if (copiando) return;
    setCopiando(true);
    try {
      const r = await listsApi.copiar(original, { userId: user?.id, plan, nueva });
      guardarCopia(original, r.id);
      if (r.existente && plan) {
        // Ya tenía su versión: se le aplica la opción que acaba de elegir (no se abre la vieja con otro plan)
        await listsApi.updatePlan(r.id, { plan, aplicarATodos: true });
        showToast(`Abrimos tu versión de esta lista con la opción ${tierLabel(plan)}.`);
      } else if (r.existente) showToast('Ya tenías tu versión de esta lista. La abrimos.');
      else if (nueva) showToast('Armamos otra copia de la lista. Ponle el nombre del alumno en las etiquetas.');
      router.replace(`/lists/${r.id}`);
    } catch {
      showToast('No pudimos preparar tu lista. Intenta de nuevo.', 'error');
      setCopiando(false);
      setEligiendo(null);
    }
  };

  const patchItem = (itemId: string, patch: Partial<SupplyItem>) =>
    setData(d => d ? { ...d, items: d.items.map(i => i.id === itemId ? { ...i, ...patch } : i) } : d);

  const getQty = useCallback((item: SupplyItem) => localQty[item.id] ?? (item.userCustomQuantity || item.matchedQuantity || item.cantidad), [localQty]);

  const setQty = (item: SupplyItem, q: number) => {
    if (compartida) { copiarYAbrir(); return; }
    setLocalQty(prev => ({ ...prev, [item.id]: q }));
    clearTimeout(qtyTimers.current[item.id]);
    qtyTimers.current[item.id] = setTimeout(() => {
      listsApi.updateItem(id, item.id, { userCustomQuantity: q }).catch(() => {});
    }, 700);
  };

  const cambiarExtras = (e: ListExtras) => {
    if (compartida) { copiarYAbrir(); return; }
    setExtras(e);
    clearTimeout(extrasTimer.current);
    extrasTimer.current = setTimeout(() => {
      listsApi.updateExtras(id, e).catch(() => showToast('No se pudieron guardar los extras', 'error'));
    }, 800);
  };

  const elegirProducto = async (item: SupplyItem, p: Product, valores: ItemVariante[]) => {
    if (compartida) { setAbierto(null); copiarYAbrir(); return; }
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
    if (compartida) { await copiarYAbrir(tier); return; }
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
  // Agregar a la lista algo que no pide el colegio (de la tienda o pedido por su nombre)
  const abrirAgregar = () => { if (compartida) copiarYAbrir(); else setPanelAgregar(true); };

  const sumarItem = (nuevo: SupplyItem, cantidad: number) => {
    setData(d => d ? { ...d, items: [...d.items, nuevo] } : d);
    setLocalQty(prev => ({ ...prev, [nuevo.id]: cantidad }));
    setPanelAgregar(false);
    setTimeout(() => document.getElementById(`util-${nuevo.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  };

  const agregarUtil = async (p: Product, valores: ItemVariante[], cantidad: number, anti?: DatosAntiSpam) => {
    try {
      const r = await listsApi.addItem(id, { nombreOriginal: p.name, cantidad, productId: p.id, porCliente: true }, anti);
      sumarItem({ ...r, matchedProductId: p.id, matchedProduct: p, priceAtMatch: p.basePrice, matchedQuantity: cantidad, agregado: true }, cantidad);
      if (valores.length) cambiarExtras({ ...extras, variantes: { ...(extras.variantes ?? {}), [r.id]: { productId: p.id, valores } } });
      showToast(`Agregaste ${p.name}`);
    } catch (err) {
      showToast(mensajeError(err, 'No se pudo agregar'), 'error');
    }
  };

  const pedirUtil = async (nombre: string, cantidad: number, anti: DatosAntiSpam): Promise<string | null> => {
    try {
      const r = await listsApi.addItem(id, { nombreOriginal: nombre, cantidad, porCliente: true }, anti);
      sumarItem({ ...r, agregado: true }, cantidad);
      showToast('Lo agregamos. Te confirmamos el precio al revisar tu pedido.');
      return null;
    } catch (err) {
      return mensajeError(err, 'No se pudo agregar. Inténtalo de nuevo.');
    }
  };

  const quitarUtil = async (item: SupplyItem) => {
    const anterior = data;
    setData(d => d ? { ...d, items: d.items.filter(i => i.id !== item.id) } : d);
    try {
      await listsApi.deleteItem(id, item.id);
      if (extras.variantes?.[item.id]) {
        const variantes = { ...extras.variantes };
        delete variantes[item.id];
        cambiarExtras({ ...extras, variantes });
      }
    } catch {
      setData(anterior);
      showToast('No se pudo quitar', 'error');
    }
  };

  const incluir = (item: SupplyItem, v: boolean) => {
    if (compartida) { copiarYAbrir(); return; }
    const set = new Set(excluidos);
    if (v) set.delete(item.id); else set.add(item.id);
    cambiarExtras({ ...extras, excluidos: [...set] });
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primario" /></div>;
  if (!data) return (
    <NoEncontrado titulo="No encontramos esta lista" texto="Puede que el enlace esté incompleto o que la lista se haya eliminado. Busca la lista de tu colegio o sube la tuya."
      principal={{ href: '/lists', texto: 'Buscar la lista de mi colegio' }} secundarias={[{ href: '/upload', texto: 'Subir mi lista' }, { href: '/my-lists', texto: 'Ver mis listas' }]} />
  );

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
  const hayNiveles = items.some(i => i.productEconomicoId || i.productMedioId || i.productPremiumId);
  // En una lista compartida siempre se empieza eligiendo la opción (se guarda en la copia propia)
  const plan = (!compartida && TIERS.some(t => t.id === data.list.plan) ? data.list.plan : null) as Tier | null;
  const imagenes = (data.list.imageUrl || '').split('|').filter(Boolean);

  // Totales
  const resumen = resumirLista(items, extras, servicios, opciones, getQty);
  const { incluidos, conProducto, totalUtiles, cuadernos, libros, conteo, lineasExtras, librosPorCotizar, total, ahorro } = resumen;
  const colorForro = buscarOpcion(opciones.colores, extras.forro.color);
  const disenoEtiqueta = buscarOpcion(opciones.disenos, extras.etiquetas.diseno);
  const para = paraQuien(extras, data.list);
  const enCarrito = lineasDeLista(id);
  const totalEnCarrito = enCarrito.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const agregarAlCarrito = async () => {
    if (conProducto.length === 0 && lineasExtras.length === 0) { showToast('No hay nada para agregar', 'error'); return; }
    setAgregando(true);
    const etiquetaNota = [extras.etiquetas.nombre && `Nombre: ${extras.etiquetas.nombre}`, extras.etiquetas.grado && `Grado: ${extras.etiquetas.grado}`, `Diseño: ${extras.etiquetas.diseno}`].filter(Boolean).join(' | ');
    const boton = document.activeElement;
    conProducto.slice(0, 6).forEach((i, k) => setTimeout(() => volarAlCarrito(boton, i.matchedProduct?.imageUrl), k * 110));
    try {
      const lineas: LineaNueva[] = conProducto.map(i => {
        const vs = variantesDe(i, extras);
        const nota = [vs.map(v => `${v.tipo}: ${v.valor}`).join(', '), i.userNotas || i.notas].filter(Boolean).join(' | ');
        return { product: i.matchedProduct!, quantity: getQty(i), notes: nota || undefined, unitPrice: precioUnitario(i, extras), listPrice: precioSinOferta(i, extras), recargo: recargoDe(i, extras) || undefined };
      });
      const servicio = (product: Product, quantity: number, notes: string, recargo = 0): LineaNueva =>
        ({ product, quantity, notes, recargo: recargo || undefined, unitPrice: precioServicio(product) + recargo, listPrice: product.basePrice + recargo });
      const s = servicios;
      if (extras.forro.activo && s.forroCuaderno && cuadernos > 0) lineas.push(servicio(s.forroCuaderno, cuadernos, `Color: ${extras.forro.color || 'a elegir'}`, colorForro?.recargo));
      if (extras.forro.activo && extras.forrarLibros && s.forroLibro && libros > 0) lineas.push(servicio(s.forroLibro, libros, `Forro de libros, color: ${extras.forro.color || 'a elegir'}`));
      if (extras.etiquetas.activo && s.etiqueta && conteo.etiquetas > 0) lineas.push(servicio(s.etiqueta, conteo.etiquetas, etiquetaNota, disenoEtiqueta?.recargo));
      if (s.caratula && conteo.caratulas > 0) lineas.push(servicio(s.caratula, conteo.caratulas, `Cursos: ${extras.caratulas.cursos.join(', ')}${extras.etiquetas.nombre ? ` | Nombre: ${extras.etiquetas.nombre}` : ''}`));
      // Libros del catálogo: se piden en paralelo (react-best-practices: async-parallel)
      const porCotizar = [...librosPorCotizar];
      const conPrecio = extras.libros.filter(x => x.precio && x.productoId);
      const productosLibro = await Promise.allSettled(conPrecio.map(l => productsApi.getById(l.productoId!)));
      productosLibro.forEach((r, i) => {
        if (r.status === 'fulfilled') lineas.push({ product: r.value, quantity: conPrecio[i].cantidad, notes: `Libro: ${conPrecio[i].titulo}` });
        else porCotizar.push(conPrecio[i]);
      });
      // Servicios elegidos cuyo precio aún no está configurado en la tienda
      const sinPrecio = [
        extras.forro.activo && !s.forroCuaderno && cuadernos > 0 && `Forrado de ${cuadernos} cuadernos, color ${extras.forro.color || 'a elegir'}`,
        extras.etiquetas.activo && !s.etiqueta && conteo.etiquetas > 0 && `${conteo.etiquetas} etiquetas (${etiquetaNota})`,
        conteo.caratulas > 0 && !s.caratula && `Carátulas: ${extras.caratulas.cursos.join(', ')}`,
      ].filter(Boolean) as string[];
      const pendientes = porCotizar.map(l => `${l.titulo}${l.editorial ? ` (${l.editorial})` : ''} x${l.cantidad}`);
      const porConseguir = incluidos.filter(i => !i.matchedProduct).map(i => `${i.nombreOriginal} x${getQty(i)}`);
      const notas = [
        ...(pendientes.length ? [`Libros por cotizar: ${pendientes.join('; ')}`] : []),
        ...(sinPrecio.length ? [`Servicios por confirmar: ${sinPrecio.join('; ')}`] : []),
        ...(porConseguir.length ? [`Útiles por conseguir: ${porConseguir.join('; ')}`] : []),
      ];
      // Volver a agregar la lista reemplaza lo que ya estaba de ella en el carrito (no se duplica)
      replaceList(id, para, lineas, notas);
      await new Promise(r => setTimeout(r, 750));
      router.push('/cart');
    } finally {
      setAgregando(false);
    }
  };

  const enlace = typeof window !== 'undefined' ? `${window.location.origin}/lists/${id}` : `/lists/${id}`;
  const textoCompartir = `Lista de útiles de ${data.list.schoolName}, ${data.list.gradeName} ${data.list.year} en Ready`;
  const compartir = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try { await navigator.share({ title: textoCompartir, text: textoCompartir, url: enlace }); return; }
      catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; }
    }
    setMenuCompartir(v => !v);
  };
  const copiarEnlace = async () => {
    try { await navigator.clipboard.writeText(enlace); showToast('Enlace copiado'); }
    catch { showToast('No se pudo copiar. Copia la dirección de la página.', 'error'); }
    setMenuCompartir(false);
  };

  return (
    <div className="pb-28 lg:pb-12">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {imprimiendo && <ListaImprimible data={data} resumen={resumen} extras={extras} qty={getQty} para={para} plan={plan} />}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 print:hidden">
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
          <div className="relative ml-auto flex items-center gap-1">
            <button onClick={compartir} aria-expanded={menuCompartir} aria-haspopup="menu"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-grafito hover:bg-papel">
              <Share2 className="h-4 w-4" aria-hidden="true" /> Compartir
            </button>
            <button onClick={() => { flushSync(() => setImprimiendo(true)); window.print(); }} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-grafito hover:bg-papel">
              <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir
            </button>
            {menuCompartir && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuCompartir(false)} aria-hidden="true" />
                <div role="menu" aria-label="Compartir la lista" className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-xl border border-linea bg-papel py-1 shadow-xl animate-slide-down">
                  <button role="menuitem" onClick={copiarEnlace} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-fondo">
                    <Link2 className="h-4 w-4 text-primario" aria-hidden="true" /> Copiar enlace
                  </button>
                  <a role="menuitem" href={enlaceWhatsapp('', `${textoCompartir}: ${enlace}`)} target="_blank" rel="noreferrer" onClick={() => setMenuCompartir(false)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-fondo">
                    <MessageCircle className="h-4 w-4 text-eco" aria-hidden="true" /> Enviar por WhatsApp
                  </a>
                </div>
              </>
            )}
          </div>
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

        {copiaPrevia && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-acento bg-acento-claro px-4 py-3">
            <Copy className="h-5 w-5 shrink-0 text-slate-900" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm text-slate-900">Ya armaste esta lista antes, con tus cambios. Si eliges una opción, se la aplicamos a tu versión.</p>
            <Link href={`/lists/${copiaPrevia}`} className="rounded-xl bg-grafito px-4 py-2 text-sm font-bold text-papel hover:opacity-90">Abrir la mía</Link>
            <button onClick={() => copiarYAbrir(undefined, true)} disabled={copiando}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-grafito px-4 py-1.5 text-sm font-bold text-slate-900 hover:bg-papel disabled:opacity-50">
              <Users className="h-4 w-4" aria-hidden="true" /> Armar otra copia (para otro hijo)
            </button>
          </div>
        )}

        {!compartida && data.list.copiaDe && (
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <p className="text-tenue">Esta es tu versión de la lista{para && extras.etiquetas.nombre ? <>, para <b className="text-grafito">{para}</b></> : ''}. ¿Otro hijo en el mismo grado?</p>
            <button onClick={() => copiarYAbrir(undefined, true, data.list.copiaDe!)} disabled={copiando}
              className="inline-flex items-center gap-1.5 font-semibold text-primario hover:underline disabled:opacity-50">
              <Users className="h-4 w-4" aria-hidden="true" /> Armar otra copia (para otro hijo)
            </button>
          </div>
        )}

        {!plan && hayNiveles ? (
          <>
            <ElegirPaquete items={items} qty={getQty} onElegir={elegirPaquete} eligiendo={eligiendo} />
            {compartida && (
              <p className="mt-4 text-sm text-tenue">
                Al elegir, guardamos tu propia versión de esta lista: puedes cambiar productos, quitar lo que ya tienes y agregar más. La lista del colegio no cambia para los demás.
              </p>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
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
                      precio={precioUnitario(item, extras)} precioOriginal={precioSinOferta(item, extras)} variantes={variantesDe(item, extras)}
                      onIncluir={v => incluir(item, v)} onQty={q => setQty(item, q)} onAbrir={() => setAbierto(item)}
                      onQuitar={() => quitarUtil(item)} />
                  ))}
                </ul>
                <button onClick={abrirAgregar}
                  className="group mt-3 flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-linea-fuerte px-4 py-4 text-left transition-colors hover:border-primario hover:bg-primario-claro">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-acento text-slate-900 transition-transform group-hover:rotate-90">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-bold">Agregar otro útil</span>
                    <span className="block text-sm text-tenue">Algo que no pide el colegio: más cuadernos, una mochila, colores extra…</span>
                  </span>
                </button>
              </section>

              <Extras extras={extras} onChange={cambiarExtras} conteo={conteo} servicios={servicios} opciones={opciones} />

              <ObservationBox listId={id} existing={data.list.userObservaciones} onSaved={() => loadList()} />
            </div>

            {/* Resumen */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-linea bg-papel p-5">
                <h2 className="text-lg font-extrabold">Resumen</h2>
                <p className="mt-0.5 truncate text-sm text-tenue">Para <span className="font-semibold text-grafito">{para}</span>{plan ? ` · ${tierLabel(plan)}` : ''}</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><dt>Útiles ({conProducto.length})</dt><dd className="font-semibold"><PrecioAnimado valor={totalUtiles} /></dd></div>
                  {lineasExtras.map(l => (
                    <div key={l.label} className="flex justify-between"><dt>{l.label}</dt><dd className="font-semibold tabular-nums">{formatPrice(l.monto)}</dd></div>
                  ))}
                  {librosPorCotizar.length > 0 && (
                    <div className="flex justify-between text-tenue"><dt>Libros por cotizar ({librosPorCotizar.length})</dt><dd>Te avisamos</dd></div>
                  )}
                  {ahorro > 0 && (
                    <div className="flex justify-between text-profe"><dt>Ahorras con las ofertas</dt><dd className="font-semibold tabular-nums">−{formatPrice(ahorro)}</dd></div>
                  )}
                </dl>
                <div className="mt-4 flex items-baseline justify-between border-t border-linea pt-4">
                  <span className="font-semibold">Total</span>
                  <PrecioAnimado valor={total} className="text-3xl font-extrabold tracking-tight" />
                </div>
                {enCarrito.length > 0 && (
                  <p role="status" className="mt-4 rounded-xl bg-eco-claro px-3 py-2.5 text-sm">
                    <Check className="mr-1 inline h-4 w-4 text-eco" aria-hidden="true" />
                    Ya está en tu carrito ({formatPrice(totalEnCarrito)}).{' '}
                    {Math.abs(totalEnCarrito - total) > 0.005 ? 'Actualiza el carrito para llevar los cambios.' : <Link href="/cart" className="font-semibold underline underline-offset-2">Ver carrito</Link>}
                  </p>
                )}
                <button onClick={agregarAlCarrito} disabled={agregando}
                  className="mt-4 hidden w-full items-center justify-center gap-2 rounded-xl bg-acento py-3.5 font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro disabled:opacity-50 lg:flex">
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {agregando ? 'Agregando…' : enCarrito.length > 0 ? 'Actualizar carrito' : 'Agregar al carrito'}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Barra fija en celular */}
      {(plan || !hayNiveles) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-papel/95 backdrop-blur lg:hidden print:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-tenue">{enCarrito.length > 0 ? `En tu carrito: ${formatPrice(totalEnCarrito)}` : 'Total'}</p>
              <p className="text-2xl font-extrabold"><PrecioAnimado valor={total} /></p>
            </div>
            <button onClick={agregarAlCarrito} disabled={agregando}
              className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl bg-acento px-5 py-3.5 font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro disabled:opacity-50">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {enCarrito.length > 0 ? 'Actualizar carrito' : 'Agregar al carrito'}
            </button>
          </div>
        </div>
      )}

      {verFotos && <FotosLista urls={imagenes} onClose={() => setVerFotos(false)} />}
      {abierto && (
        <SelectorProducto item={abierto} variantesActuales={variantesDe(abierto, extras)}
          onElegir={(p, valores) => elegirProducto(abierto, p, valores)} onClose={cerrarSelector} />
      )}
      {panelAgregar && (
        <SelectorProducto onElegir={agregarUtil} onPedirTexto={pedirUtil} onClose={() => setPanelAgregar(false)} />
      )}
    </div>
  );
}
