'use client';

import { useState, useEffect } from 'react';
import { listsApi } from '@/services/api';
import { SupplyList } from '@/lib/types';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { Eye, Search, Image as ImageIcon, MessageSquare, Trash2 } from 'lucide-react';

export default function AdminListsPage() {
  const [lists, setLists] = useState<SupplyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadLists(); }, [filterStatus]);

  const loadLists = async () => {
    try {
      const params: any = {};
      if (filterStatus) params.estado = filterStatus;
      const data = await listsApi.getAll(params);
      setLists(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteList = async (id: string) => {
    if (!confirm('Eliminar esta lista y todos sus items?')) return;
    try { await listsApi.delete(id); loadLists(); }
    catch (err) { console.error(err); }
  };

  const filtered = lists.filter(l => {
    if (filterType === 'oficial' && !l.esOficial) return false;
    if (filterType === 'usuario' && l.esOficial) return false;
    if (search && !l.schoolName?.toLowerCase().includes(search.toLowerCase()) && !l.gradeName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-4">Gestion de Listas</h1>

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar colegio o grado..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700">
          <option value="">Estado</option>
          <option value="PENDIENTE_REVISION">Pendiente</option>
          <option value="EN_REVISION">En revision</option>
          <option value="OBSERVADA">Observada</option>
          <option value="VALIDADA">Validada</option>
          <option value="PROCESADA">Procesada</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700">
          <option value="">Tipo</option>
          <option value="oficial">Oficial</option>
          <option value="usuario">Usuario</option>
        </select>
        <span className="text-[10px] text-neutral-400">{filtered.length} listas</span>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Colegio</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grado</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ano</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Foto</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Obs</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((list, i) => (
                <tr key={list.id} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                  <td className="px-4 py-2 text-xs font-medium text-slate-900">{list.schoolName}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{list.gradeName}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{list.year}</td>
                  <td className="px-4 py-2"><StatusBadge status={list.estado} size="sm" /></td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${list.esOficial ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {list.esOficial ? 'Oficial' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {list.imageUrl ? <ImageIcon className="h-3.5 w-3.5 text-blue-500" /> : <span className="text-[10px] text-neutral-300">-</span>}
                  </td>
                  <td className="px-4 py-2">
                    {list.userObservaciones ? <MessageSquare className="h-3.5 w-3.5 text-orange-500" /> : <span className="text-[10px] text-neutral-300">-</span>}
                  </td>
                  <td className="px-4 py-2 text-[10px] text-neutral-400">{formatDate(list.fechaSubida)}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/admin/lists/review/${list.id}`} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors inline-flex">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button onClick={() => deleteList(list.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors">
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
        {filtered.length === 0 && !loading && (
          <p className="p-8 text-center text-neutral-400 text-sm">No hay listas</p>
        )}
      </div>
    </div>
  );
}
