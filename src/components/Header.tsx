'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRealtimeNotifications } from '@/lib/useNotifications';
import { ShoppingBag, LogOut, Menu, X, Camera, Moon, Sun } from 'lucide-react';
import { useTema } from '@/lib/tema';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import NotificationBell from './NotificationBell';
import Logo from './Logo';

export default function Header() {
  const { user, isAdmin, logout, addNotification } = useAuth();
  // Avisos en vivo para el cliente (lista aprobada, estado del pedido) en la campanita
  const { notifications: enVivo } = useRealtimeNotifications(isAdmin ? undefined : user?.role, isAdmin ? undefined : user?.id);
  const vistos = useRef(new Set<string>());
  useEffect(() => {
    enVivo.forEach(n => {
      if (vistos.current.has(n.id)) return;
      vistos.current.add(n.id);
      if (n.type === 'list_ready' || n.type === 'order_update') addNotification(n.message, 'success');
    });
  }, [enVivo, addNotification]);
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { oscuro, alternar } = useTema();

  const nav = [
    { href: '/lists', label: 'Listas de colegios' },
    { href: '/catalog', label: 'Productos' },
    ...(user ? [{ href: '/my-lists', label: 'Mis listas' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (href: string) => (href === '/' || href === '/lists' ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-linea bg-papel/95 backdrop-blur print:hidden">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-3 sm:gap-6 sm:px-6" aria-label="Principal">
        <Logo />

        <div className="hidden lg:flex items-center gap-1">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-[0.95rem] font-medium transition-colors ${
                isActive(item.href) ? 'text-primario bg-primario-claro' : 'text-tenue hover:text-grafito'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
          <Link
            href="/upload"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-acento px-4 py-2 text-sm font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro transition-colors"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Subir mi lista
          </Link>

          <button type="button" onClick={alternar} aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} title={oscuro ? 'Modo claro' : 'Modo oscuro'}
            className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-xl text-grafito max-[379px]:hidden transition-colors hover:bg-fondo">
            <Sun className={`absolute inset-0 m-auto h-5 w-5 transition-[transform,opacity] duration-300 ${oscuro ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} aria-hidden="true" />
            <Moon className={`absolute inset-0 m-auto h-5 w-5 transition-[transform,opacity] duration-300 ${oscuro ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} aria-hidden="true" />
          </button>

          {user && <NotificationBell />}

          <Link href="/cart" data-carrito className="relative flex h-11 w-11 items-center justify-center rounded-xl text-grafito hover:bg-fondo" aria-label={`Carrito, ${itemCount} productos`}>
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span key={itemCount} className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primario px-1 text-[11px] font-bold text-white ring-2 ring-papel animate-cart-bounce">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden lg:flex items-center gap-1">
              <Link href="/profile" aria-label={`Mi perfil (${user.name})`} title="Mi perfil"
                aria-current={pathname === '/profile' ? 'page' : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-[box-shadow] hover:ring-2 hover:ring-primario ${pathname === '/profile' ? 'bg-primario text-white' : 'bg-primario-claro text-primario'}`}>
                {user.name.charAt(0).toUpperCase()}
              </Link>
              <button type="button" onClick={logout} className="flex h-11 w-11 items-center justify-center rounded-xl text-tenue hover:text-profe" title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden lg:inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold text-primario hover:bg-primario-claro">
              Iniciar sesión
            </Link>
          )}

          <button type="button" onClick={() => setOpen(!open)} className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl text-grafito hover:bg-fondo" aria-expanded={open} aria-controls="menu-movil" aria-label={open ? 'Cerrar menú' : 'Abrir menú'}>
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Cerrado: "invisible" además de max-h-0, para que los enlaces ocultos no reciban el foco del teclado */}
      <div id="menu-movil" className={`lg:hidden overflow-hidden border-t border-linea transition-[max-height,visibility] duration-200 ${open ? 'visible max-h-96' : 'invisible max-h-0 border-t-0'}`}>
        <div className="flex flex-col gap-1 px-4 py-3">
          <Link href="/upload" onClick={() => setOpen(false)} className="mb-2 inline-flex items-center justify-center gap-2 rounded-xl bg-acento px-4 py-3 font-bold text-grafito">
            <Camera className="h-4 w-4" aria-hidden="true" /> Subir mi lista
          </Link>
          {nav.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2.5 font-medium ${isActive(item.href) ? 'bg-primario-claro text-primario' : 'text-grafito'}`}>
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/profile" onClick={() => setOpen(false)} className={`rounded-lg px-3 py-2.5 font-medium ${isActive('/profile') ? 'bg-primario-claro text-primario' : 'text-grafito'}`}>Mi perfil</Link>
              <button type="button" onClick={() => { logout(); setOpen(false); }} className="rounded-lg px-3 py-2.5 text-left font-medium text-profe">Cerrar sesión</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium text-primario">Iniciar sesión</Link>
          )}
          {/* En pantallas muy angostas el botón de tema vive aquí */}
          <button type="button" onClick={alternar} className="rounded-lg px-3 py-2.5 text-left font-medium text-grafito min-[380px]:hidden">
            {oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          </button>
        </div>
      </div>
    </header>
  );
}
