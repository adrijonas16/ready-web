'use client';

import { API, apiFetch } from '@/lib/api-base';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/lib/types';
import { authApi, PerfilInput } from '@/services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  /** Guarda el perfil (PUT /auth/me) y actualiza la sesión */
  guardarPerfil: (datos: PerfilInput) => Promise<User>;
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

// Las notificaciones de la campanita se guardan en este navegador, una lista por usuario
const MAX_AVISOS = 30;
const claveAvisos = (uid: string) => `ready-avisos-${uid}`;
function leerAvisos(uid: string): Notification[] {
  try {
    const crudo = JSON.parse(localStorage.getItem(claveAvisos(uid)) || '[]') as (Omit<Notification, 'createdAt'> & { createdAt: string })[];
    return crudo.map(n => ({ ...n, createdAt: new Date(n.createdAt) })).filter(n => !isNaN(n.createdAt.getTime()));
  } catch { return []; }
}
const recientes = (lista: Notification[]) => lista.filter(n => Date.now() - n.createdAt.getTime() < 4000);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Se guarda junto con el dueño para no escribir los avisos de un usuario en la lista de otro
  const [avisos, setAvisos] = useState<{ uid: string | null; lista: Notification[] }>({ uid: null, lista: [] });
  const notifications = avisos.lista;
  const uid = user?.id ?? null;

  useEffect(() => {
    // Al cambiar de usuario: sus avisos guardados + los que se acaban de crear (p. ej. "¡Bienvenido!")
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura de localStorage al cambiar de sesión
    setAvisos(prev => {
      const guardados = uid ? leerAvisos(uid) : [];
      const ids = new Set(guardados.map(n => n.id));
      return { uid, lista: [...recientes(prev.lista).filter(n => !ids.has(n.id)), ...guardados].slice(0, MAX_AVISOS) };
    });
  }, [uid]);

  useEffect(() => {
    if (!avisos.uid || avisos.uid !== uid) return;
    try { localStorage.setItem(claveAvisos(avisos.uid), JSON.stringify(avisos.lista)); } catch { /* sin espacio */ }
  }, [avisos, uid]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // Validate token against real backend (sin sesión guardada no hay nada que validar)
    const validacion = storedToken && storedUser
      ? authApi.getCurrentUser()
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
      : Promise.resolve();
    validacion.finally(() => setIsLoading(false));
  }, []);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const nueva: Notification = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, type, createdAt: new Date(), read: false };
    setAvisos(prev => ({ ...prev, lista: [nueva, ...prev.lista].slice(0, MAX_AVISOS) }));
  }, []);

  const markAsRead = (id: string) => {
    setAvisos(prev => ({ ...prev, lista: prev.lista.map(n => n.id === id ? { ...n, read: true } : n) }));
  };

  const clearNotifications = () => {
    setAvisos(prev => ({ ...prev, lista: [] }));
  };

  const guardarPerfil = async (datos: PerfilInput) => {
    const actualizado = await authApi.updateMe(datos);
    setUser(actualizado);
    localStorage.setItem('user', JSON.stringify(actualizado));
    return actualizado;
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
    apiFetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${newToken}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setUser(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
          addNotification('¡Bienvenido!', 'success');
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
        guardarPerfil,
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