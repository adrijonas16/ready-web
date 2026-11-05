'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Check, FileText, FlaskConical, Loader2, MapPin, MessageCircle, Package, Phone, RotateCcw, ShoppingBag, Truck, UserRound, XCircle } from 'lucide-react';
import { ordersApi, productsApi } from '@/services/api';
import { MODO_DEMO } from '@/lib/api-base';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/lib/types';
import { agruparPorPara, useCart } from '@/lib/cart-context';
import { enlaceWhatsapp, fechaLarga, useAjustes } from '@/lib/ajustes';
import { precioVenta } from '@/lib/precio';

const ETAPAS = [
  { id: 'RECIBIDO', t: 'Pedido recibido', d: 'Confirmamos tu pago de prueba.' },
  { id: 'EN_PREPARACION', t: 'Preparando', d: 'Juntamos cada útil de tu lista.' },
  { id: 'ARMADO', t: 'Armado', d: 'Forrado, etiquetado y empacado.' },
  { id: 'EN_CAMINO', t: 'En camino', d: 'Va hacia tu dirección.' },
  { id: 'ENTREGADO', t: 'Entregado', d: '¡Listo para el colegio!' },
];

const fecha = (iso: string) => new Date(iso).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Líneas de contactNotes que son datos internos (ya se muestran en otro lado)
const INTERNAS = /^(Email|Celular|Pago de prueba|GPS|Cupón):/;

/** Notas del pedido: lo "por cotizar" separado por alumno y las observaciones. */
function leerNotas(contactNotes?: string) {
  const porCotizar: { para: string | null; texto: string }[] = [];
  const otras: string[] = [];
  for (const linea of (contactNotes ?? '').split('\n').map(l => l.trim()).filter(Boolean)) {
    if (INTERNAS.test(linea)) continue;
    const m = linea.match(/^Por cotizar(?: — (.+?))?: (.+)$/);
    if (m) porCotizar.push({ para: m[1] ?? null, texto: m[2] });
    else otras.push(linea.replace(/^Observaciones: /, ''));
  }
  return { porCotizar, otras };
}

export default function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem } = useCart();
  const ajustes = useAjustes();
  const [pedido, setPedido] = useState<Order | null>(null);
  const [cargando, setCargando] = useState(true);
  const [avanzando, setAvanzando] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [comprando, setComprando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = useCallback(() => ordersApi.getById(id).then(setPedido).catch(() => setPedido(null)).finally(() => setCargando(false)), [id]);
  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) {
    return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primario border-t-transparent" /></div>;
  }
  if (!pedido) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Package className="mx-auto h-10 w-10 text-tenue" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold">No encontramos ese pedido</h1>
        <p className="mt-2 text-tenue">Revisa el enlace o vuelve a tus listas.</p>
        <Link href="/my-lists" className="mt-6 inline-block rounded-xl bg-primario px-5 py-3 font-bold text-white hover:bg-primario-oscuro">Ir a Mis listas</Link>
      </div>
    );
  }

  const cancelado = pedido.status === 'CANCELADO';
  const actual = Math.max(0, ETAPAS.findIndex(e => e.id === pedido.status));
  const cuando = (etapa: string) => pedido.statusHistory.find(h => h.status === etapa)?.createdAt;
  const grupos = agruparPorPara(pedido.items);
  const { porCotizar, otras } = leerNotas(pedido.contactNotes);
  const subtotal = pedido.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const envio = pedido.costoEnvio ?? 0;
  const ayuda = enlaceWhatsapp(ajustes.whatsapp, `Hola, necesito ayuda con mi pedido ${pedido.id}`);

  const simularSiguiente = async () => {
    const siguiente = ETAPAS[actual + 1];
    if (!siguiente) return;
    setAvanzando(true);
    await ordersApi.updateStatus(pedido.id, siguiente.id, 'Avance simulado en la demo').catch(() => {});
    await cargar();
    setAvanzando(false);
  };

  const cancelar = async () => {
    setCancelando(true);
    try {
      const r = await ordersApi.cancel(pedido.id);
      setPedido(r);
      setAviso({ ok: true, texto: 'Cancelamos tu pedido. Como es un pago de prueba, no hay nada que devolver.' });
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setAviso({ ok: false, texto: msg || 'No pudimos cancelar el pedido. Escríbenos por WhatsApp.' });
    } finally { setCancelando(false); setConfirmarCancelar(false); }
  };

  // "Comprar de nuevo": las mismas líneas (con el precio de hoy y el mismo recargo de diseño o color)
  const comprarDeNuevo = async () => {
    setComprando(true);
    const productos = await Promise.allSettled(pedido.items.map(i => productsApi.getById(i.productId)));
    let agregados = 0;
    pedido.items.forEach((it, k) => {
      const r = productos[k];
      if (r.status !== 'fulfilled' || r.value.isActive === false) return;
      const recargo = it.recargo ?? 0;
      addItem(r.value, it.quantity, { notes: it.notes, para: it.para ?? undefined, recargo: recargo || undefined, unitPrice: precioVenta(r.value) + recargo });
      agregados++;
    });
    setComprando(false);
    if (agregados === 0) { setAviso({ ok: false, texto: 'Esos productos ya no están disponibles.' }); return; }
    router.push('/cart');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Link href="/my-lists" className="inline-flex items-center gap-1.5 text-sm text-tenue hover:text-grafito">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Mis listas y pedidos
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Pedido {pedido.id}</h1>
          <p className="mt-1 text-tenue">Hecho el {fecha(pedido.createdAt)}</p>
        </div>
        <p className="text-2xl font-extrabold tabular-nums">{formatPrice(pedido.total)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={comprarDeNuevo} disabled={comprando}
          className="inline-flex items-center gap-2 rounded-xl bg-acento px-4 py-2.5 text-sm font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro disabled:opacity-50">
          {comprando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />} Comprar de nuevo
        </button>
        {pedido.status === 'RECIBIDO' && (
          <button onClick={() => setConfirmarCancelar(true)}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-profe/60 px-4 py-2 text-sm font-bold text-profe hover:bg-profe-claro">
            <XCircle className="h-4 w-4" aria-hidden="true" /> Cancelar pedido
          </button>
        )}
        <a href={ayuda} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-linea px-4 py-2 text-sm font-bold hover:border-eco">
          <MessageCircle className="h-4 w-4 text-eco" aria-hidden="true" /> Ayuda por WhatsApp
        </a>
      </div>

      {aviso && <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm ${aviso.ok ? 'bg-eco-claro' : 'bg-profe-claro text-profe'}`}>{aviso.texto}</p>}

      {confirmarCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div role="alertdialog" aria-modal="true" aria-labelledby="titulo-cancelar" aria-describedby="texto-cancelar" className="w-full max-w-sm rounded-2xl bg-papel p-6 shadow-xl animate-scale-in">
            <h2 id="titulo-cancelar" className="text-lg font-bold">¿Cancelar el pedido {pedido.id}?</h2>
            <p id="texto-cancelar" className="mb-5 mt-1 text-sm text-tenue">Aún no empezamos a prepararlo, así que se cancela al instante. Tus listas siguen guardadas.</p>
            <div className="flex gap-3">
              <button autoFocus onClick={() => setConfirmarCancelar(false)} className="flex-1 rounded-xl border border-linea py-2.5 text-sm font-semibold hover:bg-fondo">No, mantener</button>
              <button onClick={cancelar} disabled={cancelando} className="flex-1 rounded-xl bg-profe py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
                {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-linea bg-papel p-5 sm:p-6" aria-labelledby="titulo-seguimiento">
          <h2 id="titulo-seguimiento" className="flex items-center gap-2 font-bold"><Truck className="h-5 w-5 text-primario" aria-hidden="true" /> Seguimiento</h2>
          {cancelado ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-profe-claro px-4 py-3 text-profe">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">Pedido cancelado</p>
                <p className="text-sm">{cuando('CANCELADO') ? fecha(cuando('CANCELADO')!) : ''}</p>
              </div>
            </div>
          ) : (
            <ol className="mt-5">
              {ETAPAS.map((e, i) => {
                const hecho = i <= actual;
                return (
                  <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < ETAPAS.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 transition-colors duration-500 ${i < actual ? 'bg-eco' : 'bg-linea'}`} aria-hidden="true" />}
                    <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-500 ${
                      hecho ? 'border-eco bg-eco text-white' : 'border-linea bg-papel text-tenue'}`}>
                      {hecho ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                    </span>
                    <div className="pt-0.5">
                      <p className={hecho ? 'font-bold' : 'text-tenue'}>{e.t}{i === actual && i < ETAPAS.length - 1 && <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-acento align-middle" aria-hidden="true" />}</p>
                      <p className="text-sm text-tenue">{cuando(e.id) ? fecha(cuando(e.id)!) : e.d}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {MODO_DEMO && !cancelado && actual < ETAPAS.length - 1 && (
            <button type="button" onClick={simularSiguiente} disabled={avanzando}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-grafito px-4 py-2.5 text-sm font-bold hover:bg-fondo disabled:opacity-50">
              <FlaskConical className="h-4 w-4" aria-hidden="true" /> Simular el siguiente paso
            </button>
          )}

          <h2 className="mt-10 font-bold">Productos ({pedido.items.reduce((s, i) => s + i.quantity, 0)})</h2>
          {grupos.map(g => {
            const pendientes = porCotizar.filter(n => n.para === g.para);
            return (
              <div key={g.para ?? '-'} className="mt-4">
                {(grupos.length > 1 || g.para) && (
                  <h3 className="flex items-center justify-between gap-2 border-b border-linea pb-2 text-sm font-bold">
                    <span className="flex min-w-0 items-center gap-2">
                      {g.para ? <UserRound className="h-4 w-4 shrink-0 text-primario" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4 shrink-0 text-primario" aria-hidden="true" />}
                      <span className="truncate">{g.para ? `Para ${g.para}` : 'Otros productos'}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatPrice(g.lineas.reduce((s, i) => s + i.unitPrice * i.quantity, 0))}</span>
                  </h3>
                )}
                <ul className="divide-y divide-linea">
                  {g.lineas.map(it => (
                    <li key={it.id} className="flex items-center gap-3 py-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-linea bg-white">
                        {it.imageUrl ? <img src={it.imageUrl} alt="" className="h-10 w-10 object-contain" /> : <Package className="h-5 w-5 text-tenue" aria-hidden="true" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{it.productName}</p>
                        <p className="text-xs text-tenue">{it.quantity} × {formatPrice(it.unitPrice)}{it.notes ? ` · ${it.notes}` : ''}</p>
                      </div>
                      <p className="text-sm font-bold tabular-nums">{formatPrice(it.unitPrice * it.quantity)}</p>
                    </li>
                  ))}
                </ul>
                {pendientes.length > 0 && (
                  <div className="mt-1 rounded-xl border border-acento bg-acento-claro px-3 py-2.5 text-sm text-slate-900">
                    <p className="font-bold">Por cotizar</p>
                    {pendientes.map((n, k) => <p key={k} className="mt-0.5">{n.texto}</p>)}
                  </div>
                )}
              </div>
            );
          })}
          {porCotizar.filter(n => !grupos.some(g => g.para === n.para)).length > 0 && (
            <div className="mt-4 rounded-xl border border-acento bg-acento-claro px-3 py-2.5 text-sm text-slate-900">
              <p className="font-bold">Por cotizar</p>
              {porCotizar.filter(n => !grupos.some(g => g.para === n.para)).map((n, k) => <p key={k} className="mt-0.5">{n.para ? `${n.para}: ` : ''}{n.texto}</p>)}
            </div>
          )}
          {porCotizar.length > 0 && <p className="mt-2 text-xs text-tenue">Lo que está por cotizar no se cobró: te escribimos con el precio antes de enviarlo.</p>}

          <dl className="mt-6 space-y-1.5 border-t border-linea pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-tenue">Productos</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
            {!!pedido.descuento && <div className="flex justify-between text-eco"><dt>Cupón {pedido.cupon}</dt><dd className="tabular-nums">−{formatPrice(pedido.descuento)}</dd></div>}
            <div className="flex justify-between"><dt className="text-tenue">Envío</dt><dd className="tabular-nums">{envio === 0 ? 'Gratis' : formatPrice(envio)}</dd></div>
            <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(pedido.total)}</dd></div>
          </dl>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-linea bg-papel p-5">
            <h2 className="font-bold">Entrega</h2>
            {pedido.entrega?.fecha && (
              <p className="mt-3 flex gap-2 text-sm"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-tenue" aria-hidden="true" />
                <span><span className="font-semibold">{fechaLarga(pedido.entrega.fecha, true)}</span>{pedido.entrega.franja ? `, de ${pedido.entrega.franja}` : ''}</span>
              </p>
            )}
            <p className="mt-2 flex gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tenue" aria-hidden="true" />{pedido.shippingAddress || 'Sin dirección'}</p>
            <p className="mt-2 flex gap-2 text-sm"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-tenue" aria-hidden="true" />{pedido.shippingPhone}</p>
            <p className="mt-2 flex gap-2 text-sm"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-tenue" aria-hidden="true" />Envío: {envio === 0 ? 'gratis' : formatPrice(envio)}</p>
            {pedido.userName && <p className="mt-2 text-sm text-tenue">A nombre de {pedido.userName}</p>}
          </div>
          {pedido.comprobante && (
            <div className="rounded-2xl border border-linea bg-papel p-5">
              <h2 className="flex items-center gap-2 font-bold"><FileText className="h-4 w-4 text-primario" aria-hidden="true" /> Comprobante</h2>
              <p className="mt-2 text-sm"><span className="font-semibold">{pedido.comprobante.tipo === 'factura' ? 'Factura' : 'Boleta'}</span>
                {pedido.comprobante.documento ? ` · ${pedido.comprobante.tipo === 'factura' ? 'RUC' : 'DNI'} ${pedido.comprobante.documento}` : ' sin DNI'}</p>
              {pedido.comprobante.razonSocial && <p className="text-sm text-tenue">{pedido.comprobante.razonSocial}</p>}
            </div>
          )}
          {otras.length > 0 && (
            <div className="rounded-2xl border border-linea bg-papel p-5">
              <h2 className="font-bold">Tus observaciones</h2>
              {otras.map((o, k) => <p key={k} className="mt-2 whitespace-pre-line text-sm text-tenue">{o}</p>)}
            </div>
          )}
          <div className="rounded-2xl border border-acento bg-acento-claro p-5 text-slate-900">
            <h2 className="flex items-center gap-2 font-bold"><FlaskConical className="h-4 w-4" aria-hidden="true" /> Pago de prueba</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-slate-700">Método</dt><dd className="font-semibold capitalize">{pedido.pago?.metodo ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-700">Operación</dt><dd className="font-mono text-xs font-semibold">{pedido.pago?.operacion ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-700">Estado</dt><dd className="font-semibold">{cancelado ? 'Anulado' : 'Aprobado'}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-slate-700">No se cobró dinero: esta tienda es un ejemplo.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
