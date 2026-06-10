'use client';

import { useState, useEffect } from 'react';
import { brandsApi } from '@/services/api';
import { Plus, Edit2, Trash2, Search, X, Upload } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { try { setBrands(await brandsApi.getAll()); } catch {} finally { setLoading(false); } };

  const save = async () => {
    if (!name.trim()) return;
    if (editId) {
      await fetch(`${API}/brands/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    } else {
      await brandsApi.create(name);
    }
    setName(''); setEditId(null); setShowForm(false); load();
  };

  const uploadLogo = async (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    await fetch(`${API}/brands/${id}/logo`, { method: 'POST', body: fd });
    load();
  };

  const filtered = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Marcas ({brands.length})</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setName(''); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
          <Plus className="h-4 w-4" /> Nueva Marca
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 mb-4 flex items-center gap-3">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la marca"
            onKeyDown={e => e.key === 'Enter' && save()}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" autoFocus />
          <button onClick={save} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold">{editId ? 'Guardar' : 'Crear'}</button>
          <button onClick={() => setShowForm(false)} className="text-neutral-400"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar marca..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-12">Logo</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-24">Acciones</th>
            </tr></thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} className={`border-b border-slate-100 hover:bg-blue-50/30 ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-2">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <label className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-blue-50">
                        <Upload className="h-3 w-3 text-slate-400" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(b.id, f); }} />
                      </label>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium text-slate-900">{b.name}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => { setEditId(b.id); setName(b.name); setShowForm(true); }}
                      className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 mr-1"><Edit2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
