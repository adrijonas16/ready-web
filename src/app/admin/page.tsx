'use client';

import { apiJson } from '@/lib/api-base';
import StatusBadge from '@/components/StatusBadge';
import { useAvisos } from './_ui';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRealtimeNotifications } from '@/lib/useNotifications';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/types';
import { Package, ShoppingCart, TrendingUp, Clock, AlertTriangle, Bell, Users, ClipboardList, X, XCircle } from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalLists: number;
  pendingLists: number;
  totalUsers: number;
  lowStockProducts: { name: string; stock: number; baseprice?: number; basePrice?: number }[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { notifications, connected, unreadCount, markAsRead, clearAll } = useRealtimeNotifications(user?.role, user?.id);
  const [showNotifs, setShowNotifs] = useState(false);
  const avisos = useAvisos();

  useEffect(() => {
    Promise.all([
      apiJson<DashboardStats>('/orders/stats'),
      apiJson<Order[]>('/orders'),
    ]).then(([s, o]) => { setStats(s); setOrders(o || []); })
      .catch(err => avisos.error(err, 'No pudimos cargar el resumen'))
      .finally(() => setLoading(false));
  }, [avisos]);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'low_stock': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'out_of_stock': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'new_list': return <ClipboardList className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Resumen</h1>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-green-600' : 'text-red-500'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {connected ? 'En vivo' : 'Desconectado'}
          </div>
          <button onClick={() => setShowNotifs(!showNotifs)} aria-label={`Notificaciones${unreadCount ? ` (${unreadCount} sin leer)` : ''}`} className="relative p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <Bell className="h-4 w-4 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifs && (
        <div className="bg-white rounded-[20px] shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)] p-4 mb-6 animate-slide-down">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Notificaciones en vivo</h3>
            <div className="flex gap-2">
              <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600">Limpiar</button>
              <button onClick={() => setShowNotifs(false)}><X className="h-4 w-4 text-slate-400" /></button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin notificaciones. Las nuevas aparecerán aquí en tiempo real.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} onClick={() => markAsRead(n.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                  {getNotifIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700">{n.message}</p>
                    <p className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleTimeString('es-PE')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 stagger-children">
          {[
            { label: 'Pedidos', value: stats.totalOrders, icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
            { label: 'Ingresos', value: formatPrice(stats.totalRevenue), icon: TrendingUp, color: 'bg-green-100 text-green-600' },
            { label: 'Pendientes', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
            { label: 'Usuarios', value: stats.totalUsers, icon: Users, color: 'bg-purple-100 text-purple-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-neutral-400">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Second row stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{stats.totalProducts}</p>
                <p className="text-xs text-neutral-400">Productos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{stats.totalLists}</p>
                <p className="text-xs text-neutral-400">Listas ({stats.pendingLists} pendientes)</p>
              </div>
            </div>
          </div>
          <div className={`bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 ${stats.outOfStockCount > 0 ? 'border-2 border-red-200' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.outOfStockCount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${stats.outOfStockCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{stats.lowStockCount}</p>
                <p className="text-xs text-neutral-400">Stock bajo {stats.outOfStockCount > 0 && <span className="text-red-500">({stats.outOfStockCount} agotados)</span>}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {stats && stats.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Productos con stock bajo
          </h2>
          <div className="space-y-2">
            {stats.lowStockProducts.map((p, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${p.stock === 0 ? 'bg-red-50 border border-red-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-neutral-400">{formatPrice(p.baseprice || p.basePrice || 0)}</p>
                </div>
                <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {p.stock === 0 ? 'AGOTADO' : `${p.stock} uds`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Pedidos recientes</h2>
        {orders.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-6">No hay pedidos aún</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 10).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-900">#{order.id.slice(0, 8)}{order.userName ? ` · ${order.userName}` : ''}</p>
                  <p className="text-xs text-neutral-400">{order.items?.length || 0} productos · {order.shippingPhone}</p>
                  {order.statusHistory?.[0]?.notes && (
                    <p className="text-xs text-blue-500 mt-0.5">Obs: {order.statusHistory[0].notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatPrice(order.total)}</p>
                  <StatusBadge status={order.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
