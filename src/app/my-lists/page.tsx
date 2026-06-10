'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listsApi } from '@/services/api';
import { SupplyList } from '@/lib/types';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { List, Plus, Eye } from 'lucide-react';

export default function MyListsPage() {
  const { user } = useAuth();
  const [lists, setLists] = useState<SupplyList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLists();
    }
  }, [user]);

  const loadLists = async () => {
    try {
      const data = await listsApi.getAll({ userId: user?.id });
      setLists(data);
    } catch (err) {
      console.error('Error loading lists:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Inicia sesion para ver tus listas</h2>
          <Link href="/login" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-colors duration-150">
            Iniciar Sesion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mis Listas</h1>
        <div className="flex gap-2">
          <Link
            href="/send-list"
            className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-[box-shadow] duration-200 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Enviar Lista
          </Link>
          <Link
            href="/upload"
            className="bg-white text-slate-700 px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors duration-150"
          >
            Subir Foto
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lists.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <List className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No tienes listas aun</h3>
          <p className="text-neutral-400 text-sm mb-6">Envia o sube tu primera lista de utiles para comenzar.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/send-list" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-colors duration-150">
              Enviar mi lista
            </Link>
            <Link href="/upload" className="bg-white text-slate-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors duration-150">
              Subir foto
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sky-100 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Colegio</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Grado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Ano</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Fecha</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lists.map((list) => (
                <tr key={list.id} className="hover:bg-sky-100/50 transition-colors duration-100">
                  <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">{list.schoolName}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{list.gradeName}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{list.year}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={list.estado} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 text-sm text-neutral-400">{formatDate(list.fechaSubida)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/lists/${list.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 justify-end transition-colors duration-150"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
