'use client';

import { useEffect, useState, useRef } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import { API, MODO_DEMO } from '@/lib/api-base';

export interface RealtimeNotification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: unknown;
  read: boolean;
}

export function useRealtimeNotifications(role?: string, userId?: string) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  // Modo demo: los avisos llegan como eventos del navegador
  useEffect(() => {
    if (!userId || !MODO_DEMO) return;
    const nombres: Record<string, string> = { NewOrder: 'new_order', NewList: 'new_list', NewMessage: 'new_message', OrderUpdate: 'order_update', ListReady: 'list_ready' };
    const alAvisar = (ev: Event) => {
      const d = (ev as CustomEvent<{ tipo: string; mensaje: string; userId?: string; admin?: boolean; timestamp: string }>).detail;
      if (d.admin ? role !== 'ADMIN' && role !== 'OPERATOR' : d.userId !== userId) return;
      setNotifications(prev => [{ id: `${Date.now()}-${Math.random()}`, type: nombres[d.tipo] ?? d.tipo, message: d.mensaje, timestamp: d.timestamp, data: d, read: false }, ...prev].slice(0, 50));
    };
    window.addEventListener('ready-demo-aviso', alAvisar);
    const reloj = setInterval(() => { import('@/demo/servidor').then(m => m.avanzar()); }, 2000);
    return () => { window.removeEventListener('ready-demo-aviso', alAvisar); clearInterval(reloj); };
  }, [role, userId]);

  useEffect(() => {
    if (!userId || MODO_DEMO) return;
    // El hub vive en el mismo servidor que la API: https://…/api → https://…/hub/notifications
    const hubUrl = API.replace(/\/api\/?$/, '') + '/hub/notifications';
    // SignalR se descarga solo con sesión iniciada (no pesa en las páginas públicas)
    let cancelado = false;
    let conexion: HubConnection | null = null;
    const addNotification = (type: string, data: { message?: string; timestamp?: string }) => {
      setNotifications(prev => [{
        id: Date.now().toString(),
        type,
        message: data.message || '',
        timestamp: data.timestamp || new Date().toISOString(),
        data,
        read: false,
      }, ...prev].slice(0, 50));
    };

    import('@microsoft/signalr').then(signalR => {
      if (cancelado) return;
      const c = new signalR.HubConnectionBuilder()
        // Sin cookies: la API permite cualquier origen (AllowAnyOrigin), que no admite credenciales
        .withUrl(hubUrl, { withCredentials: false, accessTokenFactory: () => localStorage.getItem('token') ?? '' })
        .configureLogging(signalR.LogLevel.None)
        .withAutomaticReconnect()
        .build();
      conexion = c;
      connectionRef.current = c;
      const eventos: [string, string][] = [['NewOrder', 'new_order'], ['LowStock', 'low_stock'], ['OutOfStock', 'out_of_stock'], ['NewList', 'new_list'], ['NewMessage', 'new_message'], ['OrderUpdate', 'order_update'], ['ListReady', 'list_ready']];
      for (const [evento, tipo] of eventos) c.on(evento, (data) => addNotification(tipo, data));
      c.start().then(() => {
        setConnected(true);
        if (role === 'ADMIN') c.invoke('JoinAdminGroup');
        if (userId) c.invoke('JoinUserGroup', userId);
      }).catch(() => setConnected(false));
    }).catch(() => setConnected(false));

    return () => {
      cancelado = true;
      conexion?.stop();
    };
  }, [role, userId]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, connected: MODO_DEMO || connected, unreadCount, markAsRead, clearAll };
}
