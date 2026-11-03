'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, FlaskConical, MapPin, Package, Phone, Truck } from 'lucide-react';
import { ordersApi } from '@/services/api';
import { useAuth } from '@/lib/auth-context';
import { MODO_DEMO } from '@/lib/api-base';
import { formatPrice } from '@/lib/utils';

interface PedidoDetalle {
  id: string;
  total: number;
  status: string;
  shippingAddress: string;
  shippingPhone: string;
  createdAt: string;
  pago?: { metodo: string; operacion: string; estado: string };
  items: { id: string; productId: string; productName: string; imageUrl?: string; quantity: number; unitPrice: number; notes?: string }[];
  statusHistory: { status: string; notes?: string; createdAt: string }[];
}

const ETAPAS = [
  { id: 'RECIBIDO', t: 'Pedido recibido', d: 'Confirmamos tu pago de prueba.' },
  { id: 'EN_PREPARACION', t: 'Preparando', d: 'Juntamos cada útil de tu lista.' },
  { id: 'ARMADO', t: 'Armado', d: 'Forrado, etiquetado y empacado.' },
  { id: 'EN_CAMINO', t: 'En camino', d: 'Va hacia tu dirección.' },
  { id: 'ENTREGADO', t: 'Entregado', d: '¡Listo para el colegio!' },
];

const fecha = (iso: string) => new Date(iso).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [avanzando, setAvanzando] = useState(false);

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

  const actual = Math.max(0, ETAPAS.findIndex(e => e.id === pedido.status));
  const cuando = (etapa: string) => pedido.statusHistory.find(h => h.status === etapa)?.createdAt;

  const simularSiguiente = async () => {
    const siguiente = ETAPAS[actual + 1];
    if (!siguiente) return;
    setAvanzando(true);
    await ordersApi.updateStatus(pedido.id, siguiente.id, 'Avance simulado en la demo').catch(() => {});
    await cargar();
    setAvanzando(false);
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

      <div className="mt-8 grid items-start gap-6 md:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-linea bg-papel p-5 sm:p-6" aria-labelledby="titulo-seguimiento">
          <h2 id="titulo-seguimiento" className="flex items-center gap-2 font-bold"><Truck className="h-5 w-5 text-primario" aria-hidden="true" /> Seguimiento</h2>
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
          {MODO_DEMO && actual < ETAPAS.length - 1 && (
            <button type="button" onClick={simularSiguiente} disabled={avanzando}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-grafito px-4 py-2.5 text-sm font-bold hover:bg-fondo disabled:opacity-50">
              <FlaskConical className="h-4 w-4" aria-hidden="true" /> Simular el siguiente paso
            </button>
          )}

          <h2 className="mt-10 font-bold">Productos ({pedido.items.length})</h2>
          <ul className="mt-3 divide-y divide-linea">
            {pedido.items.map(it => (
              <li key={it.id} className="flex items-center gap-3 py-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-linea bg-white">
                  {it.imageUrl ? <img src={it.imageUrl} alt="" className="h-10 w-10 object-contain" /> : <Package className="h-5 w-5 text-tenue" aria-hidden="true" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{it.productName}</p>
                  <p className="truncate text-xs text-tenue">{it.quantity} × {formatPrice(it.unitPrice)}{it.notes ? ` · ${it.notes}` : ''}</p>
                </div>
                <p className="text-sm font-bold tabular-nums">{formatPrice(it.unitPrice * it.quantity)}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-linea bg-papel p-5">
            <h2 className="font-bold">Entrega</h2>
            <p className="mt-3 flex gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tenue" aria-hidden="true" />{pedido.shippingAddress || 'Sin dirección'}</p>
            <p className="mt-2 flex gap-2 text-sm"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-tenue" aria-hidden="true" />{pedido.shippingPhone}</p>
            {user?.name && <p className="mt-2 text-sm text-tenue">Para {user.name}</p>}
          </div>
          <div className="rounded-2xl border border-acento bg-acento-claro p-5">
            <h2 className="flex items-center gap-2 font-bold"><FlaskConical className="h-4 w-4" aria-hidden="true" /> Pago de prueba</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-slate-700">Método</dt><dd className="font-semibold capitalize">{pedido.pago?.metodo ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-700">Operación</dt><dd className="font-mono text-xs font-semibold">{pedido.pago?.operacion ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-700">Estado</dt><dd className="font-semibold">Aprobado</dd></div>
            </dl>
            <p className="mt-3 text-xs text-slate-700">No se cobró dinero: esta tienda es un ejemplo.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
