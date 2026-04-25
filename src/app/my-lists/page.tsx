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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inicia sesión para ver tus listas</h2>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Listas</h1>
        <Link
          href="/upload"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nueva Lista
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : lists.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <List className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No tienes listas aún</h3>
          <p className="text-gray-500 mb-6">Sube tu primera lista de útiles para comenzar.</p>
          <Link href="/upload" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
            Subir mi primera lista
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Colegio</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Grado</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Año</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Fecha</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lists.map((list) => (
                <tr key={list.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{list.schoolName}</td>
                  <td className="px-6 py-4 text-gray-600">{list.gradeName}</td>
                  <td className="px-6 py-4 text-gray-600">{list.year}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={list.estado} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(list.fechaSubida)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/lists/${list.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 justify-end"
                    >
                      <Eye className="h-4 w-4" />
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