'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ShoppingBag, LogOut, Menu, X, Camera } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import NotificationBell from './NotificationBell';
import Logo from './Logo';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: '/lists', label: 'Listas de colegios' },
    { href: '/catalog', label: 'Catálogo' },
    ...(user ? [{ href: '/my-lists', label: 'Mis listas' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (href: string) => (href === '/' || href === '/lists' ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-linea bg-papel/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6" aria-label="Principal">
        <Logo />

        <div className="hidden md:flex items-center gap-1">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-[0.95rem] font-medium transition-colors ${
                isActive(item.href) ? 'text-pizarra bg-pizarra-claro' : 'text-tenue hover:text-grafito'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/upload"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-coral px-4 py-2 text-sm font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-coral-oscuro transition-colors"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Subir mi lista
          </Link>

          {user && <NotificationBell />}

          <Link href="/cart" className="relative rounded-xl p-2.5 text-grafito hover:bg-fondo" aria-label={`Carrito, ${itemCount} productos`}>
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pizarra px-1 text-[11px] font-bold text-white ring-2 ring-papel animate-cart-bounce">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pizarra-claro text-sm font-bold text-pizarra" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </span>
              <button onClick={logout} className="rounded-xl p-2 text-tenue hover:text-profe" title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden md:inline-flex rounded-xl px-3 py-2 text-sm font-semibold text-pizarra hover:bg-pizarra-claro">
              Iniciar sesión
            </Link>
          )}

          <button onClick={() => setOpen(!open)} className="md:hidden rounded-xl p-2 text-grafito hover:bg-fondo" aria-expanded={open} aria-label="Menú">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <div className={`md:hidden overflow-hidden border-t border-linea transition-[max-height] duration-200 ${open ? 'max-h-96' : 'max-h-0 border-t-0'}`}>
        <div className="flex flex-col gap-1 px-4 py-3">
          <Link href="/upload" onClick={() => setOpen(false)} className="mb-2 inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-4 py-3 font-bold text-grafito">
            <Camera className="h-4 w-4" aria-hidden="true" /> Subir mi lista
          </Link>
          {nav.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2.5 font-medium ${isActive(item.href) ? 'bg-pizarra-claro text-pizarra' : 'text-grafito'}`}>
              {item.label}
            </Link>
          ))}
          {user ? (
            <button onClick={() => { logout(); setOpen(false); }} className="rounded-lg px-3 py-2.5 text-left font-medium text-profe">Cerrar sesión</button>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium text-pizarra">Iniciar sesión</Link>
          )}
        </div>
      </div>
    </header>
  );
}
