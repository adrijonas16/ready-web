'use client';

import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

export interface RealtimeNotification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: any;
  read: boolean;
}

export function useRealtimeNotifications(role?: string, userId?: string) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5050/hub/notifications')
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    const addNotification = (type: string, data: any) => {
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
    }).catch(err => console.error('SignalR connection error:', err));

    return () => {
      connection.stop();
    };
  }, [role, userId]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, connected, unreadCount, markAsRead, clearAll };
}
