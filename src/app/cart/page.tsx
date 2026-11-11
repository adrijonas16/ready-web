'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package, Check, UserRound, ClipboardList, Truck } from 'lucide-react';
import { agruparPorPara, useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { costoEnvio, envioProvinciasDistinto, useAjustes } from '@/lib/ajustes';
import { BASE } from '@/lib/peru';
import { formatPrice } from '@/lib/utils';
import { CartItem, NotaPedido } from '@/lib/types';

function Linea({ item, onQuitar, onCantidad, onFoto }: { item: CartItem; onQuitar: () => void; onCantidad: (q: number) => void; onFoto: () => void }) {
  const oferta = item.listPrice != null && item.listPrice > item.unitPrice;
  const pocoStock = item.product.category !== 'Servicios' && item.product.stock > 0 && item.quantity > item.product.stock;
  return (
    <li className="flex gap-3 py-4">
      <button type="button" aria-label={`Ver foto de ${item.product.name}`} onClick={onFoto}
        className="h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-linea bg-white">
        {item.product.imageUrl
          ? <img decoding="async" src={item.product.imageUrl} alt="" aria-hidden="true" width={64} height={64} className="h-full w-full object-contain p-1" />
          : <span className="flex h-full items-center justify-center"><Package className="h-6 w-6 text-tenue/40" aria-hidden="true" /></span>}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-snug">{item.product.name}</h3>
            {item.notes && <p className="mt-0.5 text-sm text-tenue line-clamp-2">{item.notes}</p>}
            <p className="mt-0.5 text-sm tabular-nums">
              {oferta && <span className="mr-1.5 text-tenue line-through"><span className="sr-only">Antes </span>{formatPrice(item.listPrice!)}</span>}
              <span className={oferta ? 'font-semibold text-profe' : 'text-tenue'}>{formatPrice(item.unitPrice)} c/u</span>
            </p>
            {pocoStock && <p className="mt-1 text-xs font-semibold text-profe">Solo quedan {item.product.stock}: te avisamos si falta alguno.</p>}
          </div>
          <p className="shrink-0 text-right font-bold tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <button onClick={onQuitar} aria-label={`Quitar ${item.product.name}`}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm text-tenue hover:bg-profe-claro hover:text-profe">
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Quitar
          </button>
          <div className="flex items-center rounded-lg border border-linea bg-papel" role="group" aria-label={`Cantidad de ${item.product.name}`}>
            <button onClick={() => onCantidad(Math.max(1, item.quantity - 1))} disabled={item.quantity <= 1} aria-label="Uno menos"
              className="flex h-10 w-10 cursor-pointer items-center justify-center hover:text-primario disabled:opacity-40"><Minus className="h-3.5 w-3.5" aria-hidden="true" /></button>
            <span className="w-7 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
            <button onClick={() => onCantidad(Math.min(99, item.quantity + 1))} aria-label="Uno más"
              className="flex h-10 w-10 cursor-pointer items-center justify-center hover:text-primario"><Plus className="h-3.5 w-3.5" aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </li>
  );
}

function Notas({ notas }: { notas: NotaPedido[] }) {
  if (notas.length === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-acento bg-acento-claro px-4 py-3 text-sm text-slate-900">
      <p className="font-bold">Por cotizar</p>
      {notas.map((n, i) => <p key={i} className="mt-1 whitespace-pre-line">{n.texto}</p>)}
      <p className="mt-2 text-slate-700">No se cobran ahora: te confirmamos el precio antes de enviar el pedido.</p>
    </div>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, removeGroup, total, ahorro, clearCart, notasPedido, itemCount } = useCart();
  const { user } = useAuth();
  const ajustes = useAjustes();
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);
  const [confirmarGrupo, setConfirmarGrupo] = useState<string | null | undefined>(undefined);
  const [foto, setFoto] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');

  const envio = costoEnvio(total, ajustes);
  const faltaGratis = ajustes.envioGratisDesde != null && envio > 0 ? ajustes.envioGratisDesde - total : 0;
  const totalFinal = total + envio;
  const mostrarAviso = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 2200); };

  if (items.length === 0 && notasPedido.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-tenue/40" aria-hidden="true" />
          <h1 className="mb-1 text-2xl font-extrabold">Tu carrito está vacío</h1>
          <p className="mb-8 text-tenue">Elige la lista de tu colegio o explora nuestro catálogo.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/lists" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-acento text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro px-6 py-3 text-sm font-bold">
              <ClipboardList className="h-4 w-4" aria-hidden="true" /> Buscar la lista de mi colegio
            </Link>
            <Link href="/catalog" className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-grafito px-6 py-2.5 text-sm font-bold hover:bg-papel">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Ver el catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const grupos = agruparPorPara(items);
  // Notas que no tienen grupo con productos (p. ej. una lista donde todo está por cotizar)
  const parasConLineas = new Set(grupos.map(g => g.para));
  const notasSueltas = notasPedido.filter(n => !parasConLineas.has(n.para ?? null));
  const varios = grupos.length > 1 || grupos.some(g => g.para);

  const botonPagar = (clase: string) => user ? (
    <Link href="/checkout" className={`flex items-center justify-center gap-2 rounded-xl bg-acento px-5 py-3.5 font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro ${clase}`}>
      Ir a pagar <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  ) : (
    <Link href="/login?redirect=/checkout" className={`flex items-center justify-center gap-2 rounded-xl bg-acento text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro px-5 py-3.5 font-bold ${clase}`}>
      Inicia sesión para pagar <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );

  return (
    <div className="pb-28 lg:pb-12">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {aviso && (
          <div role="status" className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-primario px-5 py-2.5 text-sm font-bold text-white shadow-lg animate-slide-down">
            <Check className="h-4 w-4 animate-check-pop" aria-hidden="true" /> {aviso}
          </div>
        )}

        {foto && (
          <div className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setFoto(null)}>
            <img src={foto} alt="Foto del producto ampliada" width={800} height={800} decoding="async" className="max-h-[90vh] max-w-[90vw] rounded-2xl bg-white object-contain" />
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Tu carrito</h1>
            <p className="text-tenue">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}{grupos.some(g => g.para) ? `, separados por alumno` : ''}</p>
          </div>
          <button onClick={() => setConfirmarVaciar(true)} className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-profe hover:underline">
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Vaciar carrito
          </button>
        </div>

        {(confirmarVaciar || confirmarGrupo !== undefined) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div role="alertdialog" aria-modal="true" aria-labelledby="titulo-confirmar" className="w-full max-w-sm rounded-2xl bg-papel p-6 shadow-xl animate-scale-in">
              <h2 id="titulo-confirmar" className="mb-1 text-lg font-bold">
                {confirmarVaciar ? '¿Vaciar el carrito?' : `¿Quitar todo lo de ${confirmarGrupo ?? 'otros productos'}?`}
              </h2>
              <p className="mb-5 text-sm text-tenue">
                {confirmarVaciar ? 'Se quitarán todos los productos y las notas por cotizar.' : 'Se quitan sus productos y lo que estaba por cotizar. La lista sigue guardada en Mis listas.'}
              </p>
              <div className="flex gap-3">
                <button autoFocus onClick={() => { setConfirmarVaciar(false); setConfirmarGrupo(undefined); }}
                  className="flex-1 rounded-xl border border-linea py-2.5 text-sm font-semibold hover:bg-fondo">Cancelar</button>
                <button onClick={() => {
                  if (confirmarVaciar) { clearCart(); mostrarAviso('Carrito vacío'); }
                  else { removeGroup(confirmarGrupo ?? null); mostrarAviso('Quitamos esos productos'); }
                  setConfirmarVaciar(false); setConfirmarGrupo(undefined);
                }} className="flex-1 rounded-xl bg-profe py-2.5 text-sm font-bold text-white hover:opacity-90">
                  {confirmarVaciar ? 'Vaciar' : 'Quitar'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-4">
            {grupos.map(g => {
              const subtotal = g.lineas.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
              const notas = notasPedido.filter(n => (n.para ?? null) === g.para);
              const nombre = g.para ?? 'Otros productos';
              return (
                <section key={nombre} aria-label={g.para ? `Para ${g.para}` : 'Otros productos'} className="rounded-2xl border border-linea bg-papel px-4 pt-4 sm:px-5">
                  {varios && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-linea pb-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primario-claro text-primario">
                        {g.para ? <UserRound className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-bold">{g.para ? <>Para {g.para}</> : 'Otros productos'}</h2>
                        <p className="text-sm text-tenue">{g.lineas.reduce((s, l) => s + l.quantity, 0)} productos · <span className="font-semibold text-grafito tabular-nums">{formatPrice(subtotal)}</span></p>
                      </div>
                      <button onClick={() => setConfirmarGrupo(g.para)} aria-label={`Quitar todo lo de ${nombre}`}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-tenue hover:bg-profe-claro hover:text-profe">
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Quitar todo
                      </button>
                    </div>
                  )}
                  <ul className="divide-y divide-linea">
                    {g.lineas.map(item => (
                      <Linea key={item.id} item={item} onQuitar={() => removeItem(item.id)} onCantidad={q => updateQuantity(item.id, q)}
                        onFoto={() => item.product.imageUrl && setFoto(item.product.imageUrl)} />
                    ))}
                  </ul>
                  <Notas notas={notas} />
                </section>
              );
            })}
            {notasSueltas.length > 0 && (
              <section aria-label="Por cotizar" className="rounded-2xl border border-linea bg-papel px-4 pt-4 sm:px-5">
                {[...new Set(notasSueltas.map(n => n.para ?? null))].map(para => (
                  <div key={para ?? '-'}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h2 className="font-bold">{para ? `Para ${para}` : 'Pendientes'}</h2>
                      <button onClick={() => setConfirmarGrupo(para)} aria-label={`Quitar todo lo de ${para ?? 'pendientes'}`}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-tenue hover:bg-profe-claro hover:text-profe">
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Quitar
                      </button>
                    </div>
                    <Notas notas={notasSueltas.filter(n => (n.para ?? null) === para)} />
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* Resumen */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-linea bg-papel p-5">
              <h2 className="text-lg font-extrabold">Resumen</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                {varios && grupos.map(g => (
                  <div key={g.para ?? '-'} className="flex justify-between gap-3 text-tenue">
                    <dt className="truncate">{g.para ?? 'Otros productos'}</dt>
                    <dd className="tabular-nums">{formatPrice(g.lineas.reduce((s, l) => s + l.unitPrice * l.quantity, 0))}</dd>
                  </div>
                ))}
                <div className="flex justify-between"><dt className="font-semibold">Subtotal</dt><dd className="font-semibold tabular-nums">{formatPrice(total)}</dd></div>
                {ahorro > 0 && <div className="flex justify-between text-profe"><dt>Ahorras con las ofertas</dt><dd className="tabular-nums">−{formatPrice(ahorro)}</dd></div>}
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-tenue" aria-hidden="true" /> Envío {envioProvinciasDistinto(ajustes) ? `en ${BASE}` : ajustes.coberturaNacional ? 'a todo el Perú' : `en ${BASE}`}</dt>
                  <dd className="font-semibold tabular-nums">{envio === 0 ? 'Gratis' : formatPrice(envio)}</dd>
                </div>
              </dl>
              {envio > 0 && envioProvinciasDistinto(ajustes) && (
                <p className="mt-1.5 text-xs text-tenue">A otros departamentos: {formatPrice(ajustes.costoEnvioProvincias!)}. Se calcula al elegir la dirección.</p>
              )}
              {faltaGratis > 0 && <p className="mt-2.5 rounded-lg bg-eco-claro px-3 py-2 text-xs">Te faltan <b>{formatPrice(faltaGratis)}</b> para el envío gratis.</p>}
              <div className="mt-4 flex items-baseline justify-between border-t border-linea pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-3xl font-extrabold tracking-tight tabular-nums">{formatPrice(totalFinal)}</span>
              </div>
              <p className="mt-1 text-xs text-tenue">¿Tienes un cupón? Lo aplicas al pagar.</p>
              {botonPagar('mt-4 hidden w-full lg:flex')}
            </div>
          </aside>
        </div>
      </div>

      {/* Barra fija de pago en celular */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-papel/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-tenue">Total{envio > 0 ? ' con envío' : ', envío gratis'}</p>
            <p className="text-2xl font-extrabold tabular-nums">{formatPrice(totalFinal)}</p>
          </div>
          {botonPagar('ml-auto shrink-0')}
        </div>
      </div>
    </div>
  );
}
