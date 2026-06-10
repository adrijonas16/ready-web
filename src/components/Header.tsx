'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { ShoppingCart, User, LogOut, Menu, X, List, Home, Package, ClipboardList, FileText, Settings } from 'lucide-react';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/catalog', label: 'Catalogo', icon: Package },
    { href: '/lists', label: 'Listas', icon: ClipboardList },
    { href: '/send-list', label: 'Enviar Lista', icon: FileText },
    ...(user ? [{ href: '/my-lists', label: 'Mis Listas', icon: List }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white rounded-b-2xl shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105">
                <List className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">
                Ready
              </span>
            </Link>

            <div className="hidden md:flex ml-10 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/80'
                    } px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-2`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && <NotificationBell />}

            {user ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-2.5 bg-blue-500 text-white rounded-xl transition-shadow duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold ring-2 ring-white animate-cart-bounce">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <div className="hidden md:flex items-center gap-2 pl-1 pr-3 py-1 bg-zinc-100/50 rounded-full">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-700 text-sm">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-150"
                  title="Cerrar sesion"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors duration-150"
                >
                  Iniciar Sesion
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-shadow duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Registrarse
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors duration-150"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-200 ease-[var(--ease-out)] ${mobileMenuOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
          <div className="pt-2 border-t border-slate-100 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2.5 px-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isActive(item.href)
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  } flex items-center gap-2`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
