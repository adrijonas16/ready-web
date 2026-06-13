'use client';

import { useState, useEffect } from 'react';
import { sectionsApi } from '@/services/api';
import { Section } from '@/lib/types';
import { groupSections } from '@/lib/constants';
import { Plus, Trash2, Search, X } from 'lucide-react';

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState('Primaria');
  const [name, setName] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { try { setSections(await sectionsApi.getAll()); } catch {} finally { setLoading(false); } };

  const save = async () => {
    if (!name.trim() || !groupName.trim()) return;
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sortOrder)) + 1 : 1;
    await sectionsApi.create(groupName.trim(), name.trim(), maxOrder);
    setName(''); setShowForm(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Eliminar este grado?')) return;
    await sectionsApi.delete(id);
    load();
  };

  const grouped = groupSections(sections);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Grados / Secciones ({sections.length})</h1>
        <button onClick={() => { setShowForm(true); setName(''); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
          <Plus className="h-4 w-4" /> Nuevo Grado
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-40">
              <label className="block text-xs text-slate-500 mb-1">Nivel</label>
              <select value={groupName} onChange={e => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="Inicial">Inicial</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Nombre del grado</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: 7mo Primaria"
                onKeyDown={e => e.key === 'Enter' && save()}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" autoFocus />
            </div>
            <div className="flex gap-2 pt-5">
              <button onClick={save} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Crear</button>
              <button onClick={() => setShowForm(false)} className="text-neutral-400"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {grouped.map(g => (
            <div key={g.group} className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900">{g.group}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {sections.filter(s => s.groupName === g.group).map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50/30">
                    <span className="text-sm text-slate-700">{s.name}</span>
                    <button onClick={() => remove(s.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {sections.length === 0 && <p className="text-center text-neutral-400 py-8 text-sm">No hay grados configurados</p>}
        </div>
      )}
    </div>
  );
}
