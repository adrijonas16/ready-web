'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ordersApi } from '@/services/api';
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils';
import { Search, ChevronDown, Printer, Download, MapPin, Mail, BookOpen, AlertTriangle, CreditCard, Truck, FileText, Package, User as UserIcon } from 'lucide-react';
import type { Order, OrderItem } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { Cargando, fechaCorta, hoyISO, tarjeta, useAvisos } from '../_ui';
import Paginador, { usePaginacion } from '@/components/Paginador';

const STATUSES = ['RECIBIDO', 'EN_PREPARACION', 'ARMADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'] as const;

// ── Notas de contacto: texto libre que arma el checkout ──
interface NotasPedido {
  email?: string; celular?: string; pago?: string; gps?: { lat: number; lng: number };
  libros: string[]; porConseguir: string[]; porConfirmar: string[]; notas: string[];
}
function leerNotas(texto?: string | null): NotasPedido {
  const r: NotasPedido = { libros: [], porConseguir: [], porConfirmar: [], notas: [] };
  if (!texto) return r;
  // Por si el backend lo manda como JSON
  try {
    const j = JSON.parse(texto);
    if (j && typeof j === 'object') {
      const lista = (v: unknown) => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);
      return {
        email: j.email, celular: j.celular ?? j.phone, pago: j.pago,
        gps: j.gps && Number.isFinite(Number(j.gps.lat)) ? { lat: Number(j.gps.lat), lng: Number(j.gps.lng) } : undefined,
        libros: lista(j.librosPorCotizar), porConseguir: lista(j.utilesPorConseguir), porConfirmar: lista(j.serviciosPorConfirmar), notas: lista(j.notas ?? j.notes),
      };
    }
  } catch { /* texto normal */ }
  for (const linea of texto.split('\n').map(l => l.trim()).filter(Boolean)) {
    let m: RegExpExecArray | null;
    if ((m = /^e-?mail:\s*(.+)$/i.exec(linea))) r.email = m[1].trim();
    else if ((m = /^(celular|tel[eé]fono):\s*(.+)$/i.exec(linea))) r.celular = m[2].trim();
    else if ((m = /^pago( de prueba)?:\s*(.+)$/i.exec(linea))) r.pago = m[2].trim();
    else if ((m = /^gps:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i.exec(linea))) r.gps = { lat: Number(m[1]), lng: Number(m[2]) };
    else if (/^libros por cotizar/i.test(linea)) r.libros.push(linea.replace(/^libros por cotizar,?\s*/i, ''));
    else if (/^[úu]tiles por conseguir/i.test(linea)) r.porConseguir.push(linea.replace(/^[úu]tiles por conseguir,?\s*/i, ''));
    else if (/^servicios por confirmar/i.test(linea)) r.porConfirmar.push(linea.replace(/^servicios por confirmar,?\s*/i, ''));
    else r.notas.push(linea);
  }
  return r;
}

const fechaLocal = (iso: string) => hoyISO(new Date(iso));
// Una caja por alumno: los productos sin "para" (comprados sueltos) van en su propia caja
const agrupar = (items: OrderItem[]) => {
  const g = new Map<string, OrderItem[]>();
  items.forEach(it => { const k = it.para?.trim() || ''; g.set(k, [...(g.get(k) ?? []), it]); });
  return [...g.entries()];
};
const nombreCaja = (para: string) => para || 'Otros productos';
const utiles = (items: OrderItem[]) => { const n = items.reduce((s, i) => s + i.quantity, 0); return `${n} ${n === 1 ? 'útil' : 'útiles'}`; };

function csv(orders: Order[]) {
  const esc = (v: unknown) => { const t = String(v ?? ''); return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const filas = [['Pedido', 'Fecha', 'Estado', 'Cliente', 'Correo', 'Teléfono', 'Dirección', 'Pago', 'Entrega', 'Útiles', 'Envío', 'Total', 'Notas']];
  for (const o of orders) {
    const n = leerNotas(o.contactNotes);
    filas.push([
      o.id, formatDate(o.createdAt), getStatusLabel(o.status), o.userName ?? '', o.userEmail ?? n.email ?? '', o.shippingPhone, o.shippingAddress,
      o.pago ? `${o.pago.metodo} ${o.pago.operacion ?? ''}`.trim() : '', o.entrega?.fecha ? `${fechaCorta(o.entrega.fecha)} ${o.entrega.franja ?? ''}`.trim() : '',
      String(o.items?.reduce((s, i) => s + i.quantity, 0) ?? 0), String(o.costoEnvio ?? ''), o.total.toFixed(2),
      [...n.notas, ...n.libros.map(l => `Libros por cotizar: ${l}`), ...n.porConseguir.map(l => `Útiles por conseguir: ${l}`)].join(' | '),
    ]);
  }
  // BOM para que Excel lea bien las tildes
  return '﻿' + filas.map(f => f.map(esc).join(',')).join('\r\n');
}

export default function AdminOrdersPage() {
  const avisos = useAvisos();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  // Qué se imprime: el pedido completo o una hoja por caja (alumno) para armar y rotular
  const [impresion, setImpresion] = useState<{ id: string; modo: 'pedido' | 'cajas' } | null>(null);
  const imprimiendo = impresion?.id ?? null;

  const load = useCallback(() => ordersApi.getAll().then(o => setOrders(o || []))
    .catch(e => avisos.error(e, 'No pudimos cargar los pedidos'))
    .finally(() => setLoading(false)), [avisos]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!impresion) return;
    const fin = () => setImpresion(null);
    window.addEventListener('afterprint', fin);
    const t = setTimeout(() => window.print(), 50);
    return () => { clearTimeout(t); window.removeEventListener('afterprint', fin); };
  }, [impresion]);

  const changeStatus = async (o: Order, status: string) => {
    if (status === o.status || cambiando) return;
    if (status === 'CANCELADO' && !confirm(`¿Cancelar el pedido ${o.id}?`)) return;
    setCambiando(o.id);
    try { await ordersApi.updateStatus(o.id, status, `Cambiado a "${getStatusLabel(status)}" desde el panel`); avisos.exito(`Pedido ${o.id}: ${getStatusLabel(status)}`); await load(); }
    catch (e) { avisos.error(e, 'No pudimos cambiar el estado'); }
    finally { setCambiando(null); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      if (filterStatus && o.status !== filterStatus) return false;
      const dia = fechaLocal(o.createdAt);
      if (desde && dia < desde) return false;
      if (hasta && dia > hasta) return false;
      if (q) {
        const n = leerNotas(o.contactNotes);
        const texto = [o.id, o.shippingPhone, o.userName, o.userEmail, n.email, o.shippingAddress].filter(Boolean).join(' ').toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [orders, filterStatus, search, desde, hasta]);
  const pag = usePaginacion(filtered, 20, [filterStatus, search, desde, hasta].join('|'));

  const exportar = () => {
    if (!filtered.length) { avisos.error(null, 'No hay pedidos para exportar'); return; }
    const url = URL.createObjectURL(new Blob([csv(filtered)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `pedidos-${hoyISO()}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avisos.exito(`${filtered.length} pedidos exportados`);
  };

  const totalFiltrado = filtered.filter(o => o.status !== 'CANCELADO').reduce((s, o) => s + o.total, 0);

  return (
    <div className={imprimiendo ? 'imprimiendo' : ''}>
      {/* Al imprimir solo se ve el pedido elegido */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .zona-impresion, .zona-impresion * { visibility: visible !important; }
        .zona-impresion { position: absolute; inset: 0 auto auto 0; width: 100%; box-shadow: none !important; }
        .no-imprimir { display: none !important; }
        .hoja-caja { break-after: page; }
        .hoja-caja:last-child { break-after: auto; }
      }
      @media screen { .solo-imprimir { display: none !important; } }`}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900">Pedidos ({orders.length})</h1>
        <button onClick={exportar} className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50">
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> Exportar CSV
        </button>
      </div>

      <div className={`${tarjeta} p-3 mb-4 flex flex-wrap items-end gap-2`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pedido, cliente, correo o teléfono…" aria-label="Buscar pedido"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Estado" className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700">
          <option value="">Todos los estados</option>
          {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
        </select>
        <label className="text-[10px] text-slate-500">Desde
          <input type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)} className="block px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </label>
        <label className="text-[10px] text-slate-500">Hasta
          <input type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)} className="block px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </label>
        {(desde || hasta || filterStatus || search) && <button onClick={() => { setDesde(''); setHasta(''); setFilterStatus(''); setSearch(''); }} className="text-xs text-blue-500 px-1 py-2">Limpiar</button>}
        <span className="text-[10px] text-neutral-400 py-2" data-resumen-pedidos>{filtered.length} pedidos · {formatPrice(totalFiltrado)}</span>
      </div>

      <div id="lista-pedidos" className="space-y-2 scroll-mt-20">
        {loading ? <Cargando /> :
          filtered.length === 0 ? <p className="text-center py-10 text-neutral-400 text-sm">No hay pedidos</p> :
          pag.visibles.map(order => {
            const abierto = expanded === order.id || imprimiendo === order.id;
            const n = leerNotas(order.contactNotes);
            const email = order.userEmail || n.email;
            const unidades = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
            const cajas = agrupar(order.items ?? []);
            const porCajas = impresion?.id === order.id && impresion.modo === 'cajas';
            return (
              <article key={order.id} data-pedido={order.id} aria-label={`Pedido ${order.id}`}
                className={`${tarjeta} overflow-hidden ${imprimiendo === order.id ? 'zona-impresion' : ''}`}>
                <div className={`px-4 py-3 grid grid-cols-[1fr_auto] sm:flex sm:flex-wrap sm:items-center gap-x-3 gap-y-2 ${porCajas ? 'no-imprimir' : ''}`}>
                  <div className="min-w-0 sm:flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">#{order.id}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5 truncate">{order.userName || 'Cliente'}{email ? <span className="text-neutral-400"> · {email}</span> : null}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {formatDate(order.createdAt)} · {unidades} útiles{cajas.length > 1 ? <> · <strong className="text-slate-700">{cajas.length} cajas</strong></> : null} · {order.shippingPhone}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 text-right self-start sm:self-center">{formatPrice(order.total)}</span>
                  <div className="col-span-2 flex items-center gap-2 no-imprimir">
                    <select value={order.status} disabled={cambiando === order.id} onChange={e => changeStatus(order, e.target.value)} aria-label={`Estado del pedido ${order.id}`}
                      className="flex-1 sm:flex-none px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                      {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                    </select>
                    <button onClick={() => setImpresion({ id: order.id, modo: 'pedido' })} aria-label={`Imprimir pedido ${order.id}`} title="Imprimir pedido"
                      className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><Printer className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    {cajas.length > 1 && (
                      <button onClick={() => setImpresion({ id: order.id, modo: 'cajas' })} aria-label={`Imprimir una hoja por caja del pedido ${order.id}`} title="Imprimir por caja"
                        className="px-2 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" aria-hidden="true" /> Por caja
                      </button>
                    )}
                    <button onClick={() => setExpanded(expanded === order.id ? null : order.id)} aria-expanded={abierto} aria-label={`Ver detalle del pedido ${order.id}`}
                      className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><ChevronDown className={`h-3.5 w-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`} /></button>
                  </div>
                </div>

                {porCajas && <HojasPorCaja order={order} cajas={cajas} direccion={order.shippingAddress} />}

                {abierto && !porCajas && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 space-y-3 text-xs" data-detalle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Bloque icono={UserIcon} titulo="Cliente">
                        <p className="text-slate-700">{order.userName || '—'}</p>
                        {email && <p><a href={`mailto:${email}`} className="text-blue-500 hover:underline inline-flex items-center gap-1"><Mail className="h-3 w-3" aria-hidden="true" />{email}</a></p>}
                        <p className="text-slate-700">Teléfono: {order.shippingPhone || n.celular || '—'}</p>
                      </Bloque>
                      <Bloque icono={Truck} titulo="Entrega">
                        <p className="text-slate-700">{order.shippingAddress || '—'}</p>
                        {n.gps && (
                          <p><a href={`https://www.google.com/maps?q=${n.gps.lat},${n.gps.lng}`} target="_blank" rel="noopener noreferrer"
                            className="text-blue-500 hover:underline inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" /> Ver ubicación en el mapa</a></p>
                        )}
                        {order.entrega?.fecha && <p className="text-slate-700">Fecha: <strong>{fechaCorta(order.entrega.fecha)}</strong>{order.entrega.franja ? ` · ${order.entrega.franja}` : ''}</p>}
                        {order.costoEnvio !== undefined && order.costoEnvio !== null && <p className="text-slate-700">Envío: {order.costoEnvio ? formatPrice(order.costoEnvio) : 'Gratis'}</p>}
                      </Bloque>
                      <Bloque icono={CreditCard} titulo="Pago">
                        {order.pago ? <p className="text-slate-700">{order.pago.metodo}{order.pago.operacion ? ` · operación ${order.pago.operacion}` : ''}{order.pago.estado ? ` · ${order.pago.estado.toLowerCase()}` : ''}</p>
                          : <p className="text-slate-700">{n.pago || '—'}</p>}
                      </Bloque>
                      <Bloque icono={FileText} titulo="Comprobante">
                        {order.comprobante ? (
                          <p className="text-slate-700">{order.comprobante.tipo === 'factura' ? 'Factura' : 'Boleta'}{order.comprobante.documento ? ` · ${order.comprobante.tipo === 'factura' ? 'RUC' : 'DNI'} ${order.comprobante.documento}` : ''}{order.comprobante.razonSocial ? ` · ${order.comprobante.razonSocial}` : ''}</p>
                        ) : <p className="text-slate-700">Boleta simple</p>}
                      </Bloque>
                    </div>

                    {(n.notas.length > 0 || n.libros.length > 0 || n.porConseguir.length > 0 || n.porConfirmar.length > 0) && (
                      <div className="space-y-2" data-notas>
                        {n.notas.length > 0 && <div className="bg-blue-50 rounded-lg p-2.5 text-blue-700 whitespace-pre-line"><strong>Nota del cliente:</strong> {n.notas.join('\n')}</div>}
                        {n.libros.map((l, i) => <Alerta key={`l${i}`} icono={BookOpen} titulo="Libros por cotizar" texto={l} />)}
                        {n.porConseguir.map((l, i) => <Alerta key={`c${i}`} icono={AlertTriangle} titulo="Útiles por conseguir" texto={l} />)}
                        {n.porConfirmar.map((l, i) => <Alerta key={`s${i}`} icono={AlertTriangle} titulo="Servicios por confirmar" texto={l} />)}
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Útiles ({unidades})</p>
                      {cajas.map(([para, items], c) => (
                        <div key={para || '-'} className="mb-2">
                          {cajas.length > 1 && (
                            <p className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                              <Package className="h-3 w-3" aria-hidden="true" /> Caja {c + 1} de {cajas.length}: {para ? `para ${para}` : nombreCaja(para)}
                              <span className="font-normal text-neutral-400">· {utiles(items)}</span>
                            </p>
                          )}
                          {cajas.length === 1 && para && <p className="text-[11px] font-bold text-slate-700 mb-1">Para {para}</p>}
                          {items.map((item, i) => (
                            <div key={item.id ?? i} className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white rounded-lg mb-1">
                              <div className="min-w-0">
                                <p className="text-slate-700 truncate">{item.productName}</p>
                                {item.notes && <p className="text-[10px] text-neutral-400 truncate">{item.notes}</p>}
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-neutral-400">{item.quantity} × {formatPrice(item.unitPrice)}</span>
                                <span className="font-bold text-slate-900">{formatPrice(item.unitPrice * item.quantity)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <p className="text-right font-bold text-slate-900">Total: {formatPrice(order.total)}</p>
                    </div>

                    {order.statusHistory?.length > 0 && (
                      <div className="no-imprimir">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Historial</p>
                        {order.statusHistory.map((h, i) => (
                          <div key={i} className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 mb-0.5">
                            <StatusBadge status={h.status} size="sm" />
                            <span>{formatDate(h.createdAt)}</span>
                            {h.notes && <span className="text-slate-600">{h.notes}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
      </div>
      <div className="no-imprimir"><Paginador {...pag} onCambiar={pag.setPagina} nombre="pedidos" anclaId="lista-pedidos" /></div>
    </div>
  );
}

/** Una hoja por caja: se imprime, se arma la caja marcando cada producto y se pega la hoja como rótulo */
function HojasPorCaja({ order, cajas, direccion }: { order: Order; cajas: [string, OrderItem[]][]; direccion?: string }) {
  return (
    <div className="solo-imprimir text-slate-900">
      {cajas.map(([para, items], c) => (
        <section key={para || '-'} className="hoja-caja p-6" aria-label={`Caja ${c + 1}`}>
          <header className="border-b-2 border-slate-900 pb-3 mb-4">
            <p className="text-sm">Pedido #{order.id} · Caja {c + 1} de {cajas.length}</p>
            <h2 className="text-3xl font-bold mt-1">{para ? `Para ${para}` : nombreCaja(para)}</h2>
            <p className="text-sm mt-1">{order.userName || 'Cliente'} · {order.shippingPhone}</p>
            {direccion && <p className="text-sm">{direccion}</p>}
          </header>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-slate-400">
                <th scope="col" className="w-8 py-1.5"><span className="sr-only">Listo</span></th>
                <th scope="col" className="w-14 py-1.5">Cant.</th>
                <th scope="col" className="py-1.5">Producto</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id ?? i} className="border-b border-slate-200 align-top">
                  <td className="py-1.5"><span className="inline-block h-4 w-4 border-2 border-slate-900 rounded-sm" aria-hidden="true" /></td>
                  <td className="py-1.5 font-bold tabular-nums">{item.quantity}</td>
                  <td className="py-1.5">{item.productName}{item.notes && <span className="block text-xs text-slate-600">{item.notes}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm font-bold">{utiles(items)} en esta caja</p>
        </section>
      ))}
    </div>
  );
}

function Bloque({ icono: Icono, titulo, children }: { icono: typeof Mail; titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-2.5 space-y-0.5 min-w-0 break-words">
      <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Icono className="h-3 w-3" aria-hidden="true" />{titulo}</p>
      {children}
    </div>
  );
}

function Alerta({ icono: Icono, titulo, texto }: { icono: typeof Mail; titulo: string; texto: string }) {
  return (
    <div className="bg-acento-claro border border-acento/40 rounded-lg p-2.5 text-slate-900 flex gap-2">
      <Icono className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p><strong>{titulo}:</strong> {texto}</p>
    </div>
  );
}
