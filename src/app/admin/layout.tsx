'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, List, Package, Settings, ShoppingCart, Users, GraduationCap, Tag, Percent, Folders, Layers, Menu, X, ClipboardCheck, Store, MessageCircleQuestionMark, Send } from 'lucide-react';
import { AvisosProvider, puedeVer } from './_ui';

const adminNavItems = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/lists', label: 'Listas', icon: List },
  { href: '/admin/lists/review', label: 'Revisión de listas', icon: ClipboardCheck },
  { href: '/admin/consultas', label: 'Consultas', icon: MessageCircleQuestionMark },
  { href: '/admin/pedir-listas', label: 'Pedir listas', icon: Send },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/categories', label: 'Categorías', icon: Folders },
  { href: '/admin/campaigns', label: 'Campañas', icon: Percent },
  { href: '/admin/brands', label: 'Marcas', icon: Tag },
  { href: '/admin/sections', label: 'Grados', icon: Layers },
  { href: '/admin/schools', label: 'Colegios', icon: GraduationCap },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/settings', label: 'Configuración', icon: Store },
];

/** Opción del menú que corresponde a la página (la más específica) */
function activa(pathname: string, items: typeof adminNavItems) {
  return items.filter(i => pathname === i.href || (i.href !== '/admin' && pathname.startsWith(i.href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? (pathname === '/admin' ? '/admin' : '');
}

function NavContent({ pathname, onClose, rol }: { pathname: string; onClose: () => void; rol?: string }) {
  const items = adminNavItems.filter(i => puedeVer(rol, i.href));
  const actual = activa(pathname, items);
  return (
    <>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-500" aria-hidden="true" /> Panel de administración
        </h2>
        <button className="md:hidden p-1 rounded-lg hover:bg-slate-100" onClick={onClose} aria-label="Cerrar menú">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <nav className="p-3 space-y-0.5" aria-label="Secciones del panel">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = actual === item.href;
          return (
            <Link key={item.href} href={item.href}
              onClick={onClose} aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, user } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-sky-100">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-sky-100">
        <div className="bg-white p-8 rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso restringido</h2>
          <p className="text-neutral-400 text-sm">No tienes permisos para el panel de administración.</p>
        </div>
      </div>
    );
  }

  const permitido = puedeVer(user?.role, pathname);

  return (
    <AvisosProvider>
    <div className="flex min-h-[calc(100vh-64px)] admin-panel">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — fixed drawer on mobile, static on md+ */}
      <aside aria-label="Menú del panel" className={`print:hidden
        fixed top-0 left-0 h-full w-56 bg-white shadow-[2px_0_8px_0px_rgba(0,0,0,0.05)] flex-shrink-0 z-40
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0 md:h-auto md:z-auto
      `}>
        <NavContent pathname={pathname} rol={user?.role} onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 print:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Abrir menú del panel">
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          <span className="text-sm font-bold text-slate-900">Panel de administración</span>
        </div>
        {/* El <main> lo pone el layout principal: aquí solo una sección */}
        <section className="flex-1 min-w-0 p-4 md:p-6 bg-blue-50/50 print:bg-white print:p-0">
          {permitido ? children : (
            <div className="bg-white p-8 rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] text-center max-w-md mx-auto mt-8">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Sección solo para administradores</h1>
              <p className="text-neutral-400 text-sm">Como operador puedes atender pedidos y revisar listas.</p>
            </div>
          )}
        </section>
      </div>
    </div>
    </AvisosProvider>
  );
}
