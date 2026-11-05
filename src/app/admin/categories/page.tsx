'use client';

import { useState, useEffect, useCallback } from 'react';
import { categoriesApi, productsApi, type Category } from '@/services/api';
import { Plus, Trash2, Search, X, Edit2, Check } from 'lucide-react';
import { Cargando, botonPrimario, tarjeta, th, useAvisos } from '../_ui';

export default function AdminCategoriesPage() {
  const avisos = useAvisos();
  const [categories, setCategories] = useState<Category[]>([]);
  const [conteo, setConteo] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(() => Promise.all([categoriesApi.getAll(), productsApi.getAll({ includeInactive: true })])
    .then(([cats, prods]) => {
      setCategories(cats);
      const n: Record<string, number> = {};
      prods.forEach(p => { n[p.category] = (n[p.category] ?? 0) + 1; });
      setConteo(n);
    })
    .catch(e => avisos.error(e, 'No pudimos cargar las categorías'))
    .finally(() => setLoading(false)), [avisos]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!name.trim()) return;
    try { await categoriesApi.create(name.trim()); avisos.exito(`Categoría "${name.trim()}" creada`); setName(''); setShowForm(false); load(); }
    catch (e) { avisos.error(e, 'No pudimos crear la categoría'); }
  };

  const rename = async (c: Category) => {
    const nuevo = editName.trim();
    if (!nuevo || nuevo === c.name) { setEditId(null); return; }
    try { await categoriesApi.update(c.id, nuevo); avisos.exito(`Categoría renombrada a "${nuevo}"`); setEditId(null); load(); }
    catch (e) { avisos.error(e, 'No pudimos renombrar la categoría'); }
  };

  const remove = async (c: Category) => {
    if (!confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
    try { await categoriesApi.delete(c.id); avisos.exito('Categoría eliminada'); load(); }
    catch (e) { avisos.error(e, 'No pudimos eliminar la categoría'); }
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900">Categorías ({categories.length})</h1>
        <button onClick={() => { setShowForm(true); setName(''); }} className={botonPrimario}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nueva categoría
        </button>
      </div>

      {showForm && (
        <div className={`${tarjeta} p-4 mb-4 flex items-center gap-3`}>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la categoría" aria-label="Nombre de la categoría"
            onKeyDown={e => e.key === 'Enter' && save()}
            className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm" autoFocus />
          <button onClick={save} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Crear</button>
          <button onClick={() => setShowForm(false)} aria-label="Cancelar" className="text-neutral-400"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className={`${tarjeta} p-3 mb-4`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar categoría…" aria-label="Buscar categoría"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
      </div>

      <div className={`${tarjeta} overflow-hidden`}>
        {loading ? <Cargando /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className={th}>Nombre</th>
                <th className={`${th} text-right`}>Productos</th>
                <th className={`${th} text-center w-24`}>Acciones</th>
              </tr></thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} data-categoria={c.name} className={`border-b border-slate-100 hover:bg-blue-50/30 ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900">
                      {editId === c.id ? (
                        <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus aria-label="Nuevo nombre"
                          onKeyDown={e => { if (e.key === 'Enter') rename(c); if (e.key === 'Escape') setEditId(null); }}
                          className="w-full max-w-xs px-2 py-1 border border-blue-300 rounded-lg text-sm" />
                      ) : c.name}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-slate-600">{conteo[c.name] ?? 0}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-center gap-1">
                        {editId === c.id ? (
                          <button onClick={() => rename(c)} aria-label="Guardar nombre" className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Check className="h-3.5 w-3.5" /></button>
                        ) : (
                          <button onClick={() => { setEditId(c.id); setEditName(c.name); }} aria-label={`Renombrar ${c.name}`} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 className="h-3.5 w-3.5" /></button>
                        )}
                        <button onClick={() => remove(c)} aria-label={`Eliminar ${c.name}`} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length === 0 && !loading && <p className="p-8 text-center text-neutral-400 text-sm">No hay categorías</p>}
      </div>
      <p className="text-[11px] text-neutral-400 mt-3">Al renombrar una categoría, sus productos se mueven al nuevo nombre. Solo se puede eliminar una categoría sin productos.</p>
    </div>
  );
}
