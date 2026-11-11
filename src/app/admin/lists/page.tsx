'use client';

import { useState, useEffect, useCallback } from 'react';
import { listsApi } from '@/services/api';
import { SupplyList } from '@/lib/types';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { Eye, Search, Image as ImageIcon, MessageSquare, Trash2, ClipboardCheck } from 'lucide-react';
import { useAvisos } from '../_ui';
import Paginador, { usePaginacion } from '@/components/Paginador';

export default function AdminListsPage() {
  const [lists, setLists] = useState<SupplyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const avisos = useAvisos();

  const loadLists = useCallback(() => {
    const params: { estado?: string } = {};
    if (filterStatus) params.estado = filterStatus;
    return listsApi.getAll(params)
      .then(setLists)
      .catch(err => avisos.error(err, 'No pudimos cargar las listas'))
      .finally(() => setLoading(false));
  }, [filterStatus, avisos]);

  useEffect(() => { loadLists(); }, [loadLists]);

  const deleteList = async (id: string) => {
    if (!confirm('¿Eliminar esta lista y todos sus útiles?')) return;
    try { await listsApi.delete(id); avisos.exito('Lista eliminada'); loadLists(); }
    catch (err) { avisos.error(err, 'No pudimos eliminar la lista'); }
  };

  const filtered = lists.filter(l => {
    if (filterType === 'oficial' && !l.esOficial) return false;
    if (filterType === 'usuario' && l.esOficial) return false;
    const q = search.trim().toLowerCase();
    if (q && ![l.schoolName, l.gradeName, l.estudianteNombre, l.submittedBy].some(t => t?.toLowerCase().includes(q))) return false;
    return true;
  });
  const pag = usePaginacion(filtered, 20, `${search}|${filterType}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900">Gestión de listas</h1>
        <Link href="/admin/lists/review" className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Bandeja de revisión</Link>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar colegio, grado o alumno…" aria-label="Buscar lista"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Estado"
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700">
          <option value="">Estado</option>
          <option value="PENDIENTE_REVISION">Pendiente</option>
          <option value="EN_REVISION">En revisión</option>
          <option value="OBSERVADA">Observada</option>
          <option value="RECHAZADA">Rechazada</option>
          <option value="VALIDADA">Validada</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Tipo"
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700">
          <option value="">Tipo</option>
          <option value="oficial">Oficial del colegio</option>
          <option value="usuario">De un cliente</option>
        </select>
        <span className="text-[10px] text-neutral-400">{filtered.length} listas</span>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Colegio</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grado</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Año</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Foto</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alumno / cliente</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pag.visibles.map((list, i) => (
                <tr key={list.id} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                  <td className="px-4 py-2 text-xs font-medium text-slate-900">{list.schoolName}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{list.gradeName}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{list.year}</td>
                  <td className="px-4 py-2"><StatusBadge status={list.estado} size="sm" /></td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${list.esOficial ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {list.esOficial ? 'Oficial' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {list.imageUrl ? <ImageIcon className="h-3.5 w-3.5 text-blue-500" /> : <span className="text-[10px] text-neutral-300">-</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      {list.estudianteNombre || list.submittedBy || '—'}
                      {list.userObservaciones && <MessageSquare className="h-3.5 w-3.5 text-orange-500" aria-label="Tiene observaciones del cliente" />}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[10px] text-neutral-400">{formatDate(list.fechaSubida)}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/admin/lists/review/${list.id}`} aria-label={`Revisar lista de ${list.schoolName} ${list.gradeName}`} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors inline-flex">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button onClick={() => deleteList(list.id)} aria-label={`Eliminar lista de ${list.schoolName} ${list.gradeName}`} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        <div className="px-4 pb-3"><Paginador {...pag} onCambiar={pag.setPagina} nombre="listas" /></div>
        {filtered.length === 0 && !loading && (
          <p className="p-8 text-center text-neutral-400 text-sm">No hay listas</p>
        )}
      </div>
    </div>
  );
}
