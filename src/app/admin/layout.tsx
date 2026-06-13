'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, Package, Settings, ClipboardList, ShoppingCart, Users, GraduationCap, Tag, Percent, Folders, Layers } from 'lucide-react';

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

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-56 bg-white shadow-[2px_0_8px_0px_rgba(0,0,0,0.05)] flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-500" /> Panel Admin
          </h2>
        </div>
        <nav className="p-3 space-y-0.5">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
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
      </aside>
      <main className="flex-1 p-6 bg-blue-50/50">{children}</main>
    </div>
  );
}
