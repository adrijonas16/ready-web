'use client';

import { useState, useEffect } from 'react';
import { listsApi } from '@/services/api';
import { SupplyList } from '@/lib/types';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { Eye, Filter, Plus } from 'lucide-react';

export default function AdminListsPage() {
  const [lists, setLists] = useState<SupplyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadLists();
  }, [filterStatus]);

  const loadLists = async () => {
    try {
      const params: any = {};
      if (filterStatus) params.estado = filterStatus;
      const data = await listsApi.getAll(params);
      setLists(data);
    } catch (err) {
      console.error('Error loading lists:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Listas</h1>
        <Link
          href="/admin/lists/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nueva Lista Oficial
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE_REVISION">Pendiente</option>
            <option value="EN_REVISION">En revisión</option>
            <option value="OBSERVADA">Observada</option>
            <option value="VALIDADA">Validada</option>
            <option value="PROCESADA">Procesada</option>
          </select>
        </div>
      </div>

      {/* Lists Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Colegio</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Grado</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Año</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Fecha</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Tipo</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lists.map((list) => (
                <tr key={list.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                  <td className="px-6 py-4 text-gray-900">{list.schoolName}</td>
                  <td className="px-6 py-4 text-gray-600">{list.gradeName}</td>
                  <td className="px-6 py-4 text-gray-600">{list.year}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={list.estado} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(list.fechaSubida)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${list.esOficial ? 'text-green-600' : 'text-gray-500'}`}>
                      {list.esOficial ? 'Oficial' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/lists/review/${list.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 justify-end"
                    >
                      <Eye className="h-4 w-4" />
                      Revisar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {lists.length === 0 && !loading && (
          <p className="p-6 text-center text-gray-500">No hay listas para mostrar</p>
        )}
      </div>
    </div>
  );
}