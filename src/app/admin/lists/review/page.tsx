'use client';

import { useState, useEffect } from 'react';
import { listsApi } from '@/services/api';
import { SupplyList } from '@/lib/types';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { Clock, AlertTriangle, Eye, Ban } from 'lucide-react';
import { Cargando, useAvisos } from '../../_ui';
import Paginador, { usePaginacion } from '@/components/Paginador';

const PESTAÑAS = [
  { id: 'PENDIENTE_REVISION', label: 'Pendientes', icon: Clock, activo: 'border-yellow-500 text-yellow-700', chip: 'bg-yellow-100 text-yellow-800' },
  { id: 'EN_REVISION', label: 'En revisión', icon: Eye, activo: 'border-blue-500 text-blue-600', chip: 'bg-blue-100 text-blue-800' },
  { id: 'OBSERVADA', label: 'Observadas', icon: AlertTriangle, activo: 'border-orange-500 text-orange-600', chip: 'bg-orange-100 text-orange-800' },
  { id: 'RECHAZADA', label: 'Rechazadas', icon: Ban, activo: 'border-red-500 text-red-600', chip: 'bg-red-100 text-red-800' },
] as const;

export default function ReviewQueuePage() {
  const avisos = useAvisos();
  const [lists, setLists] = useState<SupplyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('PENDIENTE_REVISION');

  useEffect(() => {
    listsApi.getAll()
      .then(setLists)
      .catch(err => avisos.error(err, 'No pudimos cargar las listas'))
      .finally(() => setLoading(false));
  }, [avisos]);

  const filteredLists = lists.filter(l => l.estado === activeTab);
  const pag = usePaginacion(filteredLists, 20, activeTab);
  const cuenta = (estado: string) => lists.filter(l => l.estado === estado).length;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-4">Revisión de listas</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-gray-100" role="tablist">
          {PESTAÑAS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} role="tab" aria-selected={activeTab === t.id} onClick={() => setActiveTab(t.id)}
                className={`min-w-0 px-2 py-3 text-xs sm:text-sm border-b-2 ${activeTab === t.id ? t.activo : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <span className="flex items-center justify-center gap-1.5">
                  <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{t.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${t.chip}`}>{cuenta(t.id)}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-3 sm:p-4">
          {loading ? <Cargando /> : filteredLists.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No hay listas en esta bandeja</p>
          ) : (
            <ul className="space-y-3">
              {pag.visibles.map(list => (
                <li key={list.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900">{list.schoolName} – {list.gradeName}</h2>
                      <StatusBadge status={list.estado} size="sm" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Año {list.year} · {formatDate(list.fechaSubida)}
                      {list.submittedBy && ` · Enviada por ${list.submittedBy}`}
                      {list.estudianteNombre && ` · Alumno: ${list.estudianteNombre}`}
                    </p>
                    {list.observaciones && <p className="text-sm text-orange-600 mt-1">⚠ {list.observaciones}</p>}
                    {list.userObservaciones && <p className="text-sm text-blue-600 mt-1">El cliente escribió: {list.userObservaciones}</p>}
                  </div>
                  <Link href={`/admin/lists/review/${list.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-center flex-shrink-0">
                    Revisar
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Paginador {...pag} onCambiar={pag.setPagina} nombre="listas" />
        </div>
      </div>
    </div>
  );
}
