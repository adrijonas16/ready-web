'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, List, Package, Settings, ClipboardList, ShoppingCart, Users, GraduationCap, Tag, Percent, Folders, Layers, Menu, X } from 'lucide-react';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/lists', label: 'Listas', icon: List },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/categories', label: 'Categorias', icon: Folders },
  { href: '/admin/campaigns', label: 'Campanas', icon: Percent },
  { href: '/admin/brands', label: 'Marcas', icon: Tag },
  { href: '/admin/sections', label: 'Grados', icon: Layers },
  { href: '/admin/schools', label: 'Colegios', icon: GraduationCap },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
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
          <p className="text-neutral-400 text-sm">No tienes permisos para el panel de administracion.</p>
        </div>
      </div>
    );
  }

  const NavContent = () => (
    <>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-500" /> Panel Admin
        </h2>
        <button className="md:hidden p-1 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(false)}>
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <nav className="p-3 space-y-0.5">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setSidebarOpen(false)}
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

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — fixed drawer on mobile, static on md+ */}
      <aside className={`
        fixed top-0 left-0 h-full w-56 bg-white shadow-[2px_0_8px_0px_rgba(0,0,0,0.05)] flex-shrink-0 z-40
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0 md:h-auto md:z-auto
      `}>
        <NavContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          <span className="text-sm font-bold text-slate-900">Panel Admin</span>
        </div>
        <main className="flex-1 p-4 md:p-6 bg-blue-50/50">{children}</main>
      </div>
    </div>
  );
}
