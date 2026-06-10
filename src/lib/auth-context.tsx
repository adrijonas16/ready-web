'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  loginWithGoogle: () => void;
  loginWithToken: (token: string, userId: string) => void;
  notifications: Notification[];
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  createdAt: Date;
  read: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      // Validate token against real backend
      authApi.getCurrentUser()
        .then((userData) => {
          setToken(storedToken);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          // Token invalid or expired - clear and force re-login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    addNotification('¡Bienvenido de vuelta!', 'success');
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authApi.register(email, password, name);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    addNotification('¡Cuenta creada exitosamente!', 'success');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    addNotification('Sesión cerrada', 'info');
  };

  const loginWithGoogle = () => {
    addNotification('Google login no disponible en modo local', 'info');
  };

  const loginWithToken = (newToken: string, userId: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api'}/auth/me`, { headers: { Authorization: `Bearer ${newToken}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setUser(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
          addNotification('Bienvenido!', 'success');
        }
      })
      .catch(console.error);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAdmin: user?.role === 'ADMIN' || user?.role === 'OPERATOR',
        loginWithGoogle,
        loginWithToken,
        notifications,
        addNotification,
        markAsRead,
        clearNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}