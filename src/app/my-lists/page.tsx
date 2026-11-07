'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ClipboardList, Package, ShoppingBag, Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { listsApi, ordersApi } from '@/services/api';
import { ListDetail, SupplyList } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatPrice } from '@/lib/utils';
import { Tier, parseExtras, resumirLista, tierLabel } from '@/lib/lista';
import { useServicios } from '@/lib/servicios';

interface PedidoResumen { id: string; total: number; status: string; createdAt: string; items: unknown[] }

const ESTADO_PEDIDO: Record<string, string> = {
  RECIBIDO: 'Recibido', EN_PREPARACION: 'Preparando', ARMADO: 'Armado', EN_CAMINO: 'En camino', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
};

const fechaCorta = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function MyListsPage() {
  const { user, isLoading } = useAuth();
  const [lists, setLists] = useState<SupplyList[]>([]);
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [detalles, setDetalles] = useState<Record<string, ListDetail>>({});
  const { servicios, opciones } = useServicios();
  const { lineasDeLista } = useCart();

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    Promise.all([
      listsApi.getAll({ userId: user.id }).catch(() => [] as SupplyList[]),
      ordersApi.getByUserId(user.id).catch(() => [] as PedidoResumen[]),
    ]).then(([l, p]) => {
      if (!vivo) return;
      setLists(l); setPedidos(p); setCargando(false);
      // Detalle de las listas aprobadas para mostrar el total de la opción elegida
      Promise.all(l.filter(x => x.estado === 'VALIDADA' || x.estado === 'PROCESADA').map(x => listsApi.getById(x.id).catch(() => null)))
        .then(ds => { if (vivo) setDetalles(Object.fromEntries(ds.filter(Boolean).map(d => [d!.list.id, d!]))); });
    });
    return () => { vivo = false; };
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        {!isLoading && (
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-extrabold">Inicia sesión para ver tus listas</h1>
            <p className="mb-6 text-tenue">Aquí verás tus listas subidas y tus pedidos.</p>
            <Link href="/login?redirect=/my-lists" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-acento text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro px-5 py-3 font-bold">Iniciar sesión</Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Mis listas y pedidos</h1>
        <Link href="/upload" className="inline-flex items-center gap-2 rounded-xl bg-acento px-4 py-2.5 text-sm font-bold text-grafito hover:brightness-95">
          <Upload className="h-4 w-4" aria-hidden="true" /> Subir otra lista
        </Link>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primario border-t-transparent" /></div>
      ) : (
        <>
          <section className="mt-8" aria-labelledby="titulo-pedidos">
            <h2 id="titulo-pedidos" className="text-lg font-bold">Pedidos</h2>
            {pedidos.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-linea-fuerte px-5 py-6 text-tenue">
                Aún no tienes pedidos. Elige una lista o arma tu pedido en el <Link href="/catalog" className="font-semibold text-primario underline underline-offset-2">catálogo</Link>.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-papel">
                {pedidos.map(p => (
                  <li key={p.id}>
                    <Link href={`/orders/${p.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-fondo">
                      <Package className="h-5 w-5 shrink-0 text-primario" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Pedido {p.id}</p>
                        <p className="text-sm text-tenue">{formatDate(p.createdAt)} · {p.items.length} productos</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${p.status === 'CANCELADO' ? 'bg-profe-claro text-profe' : 'bg-eco-claro text-eco'}`}>{ESTADO_PEDIDO[p.status] ?? p.status}</span>
                      <span className="hidden w-24 text-right font-bold tabular-nums sm:block">{formatPrice(p.total)}</span>
                      <ChevronRight className="h-4 w-4 text-tenue" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10" aria-labelledby="titulo-listas">
            <h2 id="titulo-listas" className="text-lg font-bold">Tus listas</h2>
            {lists.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-linea-fuerte px-5 py-8 text-center">
                <ClipboardList className="mx-auto h-8 w-8 text-tenue" aria-hidden="true" />
                <p className="mt-3 text-tenue">Sube la foto de la lista del colegio y te la armamos completa.</p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-papel">
                {lists.map(l => {
                  const d = detalles[l.id];
                  const extras = parseExtras(d?.list.extras ?? l.extras);
                  const alumno = extras.etiquetas.nombre.trim() || l.estudianteNombre?.trim();
                  const plan = (['economico', 'medio', 'premium'].includes(l.plan ?? '') ? l.plan : null) as Tier | null;
                  const total = d && plan ? resumirLista(d.items, extras, servicios, opciones).total : null;
                  const enCarrito = lineasDeLista(l.id);
                  const totalCarrito = enCarrito.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
                  return (
                    <li key={l.id}>
                      <Link href={`/lists/${l.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-fondo">
                        <ClipboardList className="h-5 w-5 shrink-0 text-primario" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{alumno ? <>{alumno} <span className="font-normal text-tenue">· {l.schoolName}</span></> : l.schoolName}</p>
                          <p className="text-sm text-tenue">
                            {l.gradeName} {l.year} · {l.copiaDe ? `Armada el ${fechaCorta(l.createdAt)}` : `Subida el ${fechaCorta(l.fechaSubida)}`}
                          </p>
                          {(plan || enCarrito.length > 0) && (
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                              {plan && <span className="rounded-full bg-primario-claro px-2 py-0.5 text-xs font-semibold text-primario">Opción {tierLabel(plan)}</span>}
                              {total !== null && <span className="font-semibold tabular-nums">{formatPrice(total)}</span>}
                              {enCarrito.length > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-eco-claro px-2 py-0.5 text-xs font-semibold text-eco">
                                  <ShoppingBag className="h-3 w-3" aria-hidden="true" /> En tu carrito ({formatPrice(totalCarrito)})
                                </span>
                              )}
                            </p>
                          )}
                          {!plan && (l.estado === 'VALIDADA' || l.estado === 'PROCESADA') && <p className="mt-1 text-sm font-semibold text-primario">Elige tu opción</p>}
                        </div>
                        <StatusBadge status={l.estado} size="sm" />
                        <ChevronRight className="h-4 w-4 shrink-0 text-tenue" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
