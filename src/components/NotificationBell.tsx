'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Bell, Check, X } from 'lucide-react';

export default function NotificationBell() {
  const { notifications, markAsRead, clearNotifications } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return '💡';
    }
  };

  const getBgColor = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-100';
      case 'error': return 'bg-red-50 border-red-100';
      case 'info': return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Bell className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slide-down">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-500">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span>🔔</span>
                Notificaciones
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <span className="text-4xl mb-3 block">🔕</span>
                  <p className="font-medium">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification, i) => (
                    <div
                      key={notification.id}
                      className={`p-4 flex items-start gap-3 hover:bg-gray-50/50 transition-colors duration-150 ${getBgColor(notification.type)}`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <span className="text-xl">{getIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-relaxed">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {notification.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 hover:bg-white rounded-lg transition-all duration-200 hover:shadow-sm"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={clearNotifications}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  Limpiar todas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
