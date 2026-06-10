'use client';

import { useState, useEffect } from 'react';
import { ordersApi } from '@/services/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { Search, Package, Eye, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';
const STATUSES = ['RECIBIDO', 'EN_PREPARACION', 'ARMADO', 'EN_CAMINO', 'ENTREGADO'];
const STATUS_COLORS: Record<string, string> = {
  RECIBIDO: 'bg-purple-100 text-purple-700', EN_PREPARACION: 'bg-blue-100 text-blue-700',
  ARMADO: 'bg-indigo-100 text-indigo-700', EN_CAMINO: 'bg-cyan-100 text-cyan-700', ENTREGADO: 'bg-green-100 text-green-700',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await fetch(`${API}/orders`); const d = await r.json(); if (d.success) setOrders(d.data || []); }
    catch {} finally { setLoading(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    await ordersApi.updateStatus(id, status, `Cambiado a ${status} por admin`);
    load();
  };

  const filtered = orders.filter(o => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (search && !o.id.includes(search) && !o.shippingPhone?.includes(search)) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Pedidos ({orders.length})</h1>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-3 mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ID o telefono..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700">
          <option value="">Todos</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-[10px] text-neutral-400">{filtered.length} pedidos</span>
      </div>

      <div className="space-y-2">
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> :
          filtered.length === 0 ? <p className="text-center py-10 text-neutral-400 text-sm">No hay pedidos</p> :
          filtered.map(order => (
            <div key={order.id} className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">#{order.id.slice(0, 8)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                      {order.status}
                    </span>
                    {order.trackingNumber && <span className="text-[10px] text-neutral-400 font-mono">{order.trackingNumber}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-neutral-400">
                    <span>{order.shippingPhone}</span>
                    <span>{order.items?.length || 0} productos</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">{formatPrice(order.total)}</span>
                <select value={order.status} onChange={e => changeStatus(order.id, e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded-lg text-[10px]">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200"><ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} /></button>
              </div>

              {expanded === order.id && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-neutral-400">Direccion:</span> <span className="text-slate-700">{order.shippingAddress}</span></div>
                    <div><span className="text-neutral-400">Telefono:</span> <span className="text-slate-700">{order.shippingPhone}</span></div>
                  </div>
                  {order.statusHistory?.[0]?.notes && (
                    <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700 whitespace-pre-line">{order.statusHistory[0].notes}</div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Productos</p>
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg mb-1">
                        <span className="text-xs text-slate-700">{item.productName}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-neutral-400">x{item.quantity}</span>
                          <span className="font-bold text-slate-900">{formatPrice(item.unitPrice * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.statusHistory?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Historial</p>
                      {order.statusHistory.map((h: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-neutral-400">
                          <span className={`px-1.5 py-0.5 rounded ${STATUS_COLORS[h.status] || 'bg-slate-100'} text-[9px] font-bold`}>{h.status}</span>
                          <span>{formatDate(h.createdAt)}</span>
                          {h.notes && <span className="text-slate-600 truncate">{h.notes}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
