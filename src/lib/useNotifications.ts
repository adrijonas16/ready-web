'use client';

import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
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
  const connectionRef = useRef<signalR.HubConnection | null>(null);

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
    const connection = new signalR.HubConnectionBuilder()
      // Sin cookies: la API permite cualquier origen (AllowAnyOrigin), que no admite credenciales
      .withUrl(hubUrl, { withCredentials: false, accessTokenFactory: () => localStorage.getItem('token') ?? '' })
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

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

    connection.on('NewOrder', (data) => addNotification('new_order', data));
    connection.on('LowStock', (data) => addNotification('low_stock', data));
    connection.on('OutOfStock', (data) => addNotification('out_of_stock', data));
    connection.on('NewList', (data) => addNotification('new_list', data));
    connection.on('NewMessage', (data) => addNotification('new_message', data));
    connection.on('OrderUpdate', (data) => addNotification('order_update', data));
    connection.on('ListReady', (data) => addNotification('list_ready', data));

    connection.start().then(() => {
      setConnected(true);
      if (role === 'ADMIN') connection.invoke('JoinAdminGroup');
      if (userId) connection.invoke('JoinUserGroup', userId);
    }).catch(() => setConnected(false));

    return () => {
      connection.stop();
    };
  }, [role, userId]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, connected: MODO_DEMO || connected, unreadCount, markAsRead, clearAll };
}
