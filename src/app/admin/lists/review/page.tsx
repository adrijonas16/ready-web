'use client';

import { useState, useEffect } from 'react';
import { listsApi } from '@/services/api';
import { SupplyList } from '@/lib/types';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react';

export default function ReviewQueuePage() {
  const [lists, setLists] = useState<SupplyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'in_review' | 'observed'>('pending');

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const data = await listsApi.getAll();
      setLists(data);
    } catch (err) {
      console.error('Error loading lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLists = lists.filter(list => {
    if (activeTab === 'pending') return list.estado === 'PENDIENTE_REVISION';
    if (activeTab === 'in_review') return list.estado === 'EN_REVISION';
    if (activeTab === 'observed') return list.estado === 'OBSERVADA';
    return false;
  });

  const counts = {
    pending: lists.filter(l => l.estado === 'PENDIENTE_REVISION').length,
    inReview: lists.filter(l => l.estado === 'EN_REVISION').length,
    observed: lists.filter(l => l.estado === 'OBSERVADA').length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Bandeja de Revisión</h1>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-4 text-center border-b-2 ${
              activeTab === 'pending'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" />
              Pendientes
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-sm">
                {counts.pending}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('in_review')}
            className={`flex-1 px-6 py-4 text-center border-b-2 ${
              activeTab === 'in_review'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Eye className="h-5 w-5" />
              En Revisión
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-sm">
                {counts.inReview}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('observed')}
            className={`flex-1 px-6 py-4 text-center border-b-2 ${
              activeTab === 'observed'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Observadas
              <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-sm">
                {counts.observed}
              </span>
            </div>
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay listas en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLists.map(list => (
                <div key={list.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {list.schoolName} - {list.gradeName}
                      </h3>
                      <StatusBadge status={list.estado} size="sm" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Año {list.year} • {formatDate(list.fechaSubida)}
                      {list.submittedBy && ` • Enviado por: ${list.submittedBy}`}
                    </p>
                    {list.observaciones && (
                      <p className="text-sm text-orange-600 mt-1">⚠ {list.observaciones}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/lists/review/${list.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                  >
                    Revisar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}