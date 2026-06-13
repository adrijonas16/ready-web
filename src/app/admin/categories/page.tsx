'use client';

import { useState, useEffect } from 'react';
import { categoriesApi } from '@/services/api';
import { Plus, Trash2, Search, X } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { try { setCategories(await categoriesApi.getAll()); } catch {} finally { setLoading(false); } };

  const save = async () => {
    if (!name.trim()) return;
    await categoriesApi.create(name.trim());
    setName(''); setShowForm(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Eliminar esta categoria?')) return;
    await categoriesApi.delete(id);
    load();
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Categorias ({categories.length})</h1>
        <button onClick={() => { setShowForm(true); setName(''); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
          <Plus className="h-4 w-4" /> Nueva Categoria
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 mb-4 flex items-center gap-3">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la categoria"
            onKeyDown={e => e.key === 'Enter' && save()}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" autoFocus />
          <button onClick={save} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Crear</button>
          <button onClick={() => setShowForm(false)} className="text-neutral-400"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar categoria..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-20">Eliminar</th>
            </tr></thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-b border-slate-100 hover:bg-blue-50/30 ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => remove(c.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length === 0 && !loading && <p className="p-8 text-center text-neutral-400 text-sm">No hay categorias</p>}
      </div>
    </div>
  );
}
