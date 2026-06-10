'use client';

import { useState, useEffect } from 'react';
import { schoolsApi } from '@/services/api';
import { Plus, Edit2, Trash2, Search, X, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [newGrade, setNewGrade] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { try { setSchools(await schoolsApi.getAll()); } catch {} finally { setLoading(false); } };

  const save = async () => {
    if (!name.trim()) return;
    if (editId) {
      await fetch(`${API}/schools/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, address }) });
    } else {
      await schoolsApi.create(name, address || undefined);
    }
    setName(''); setAddress(''); setEditId(null); setShowForm(false); load();
  };

  const deleteSchool = async (id: string) => {
    if (!confirm('Eliminar colegio y todos sus grados?')) return;
    await fetch(`${API}/schools/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleGrades = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    const data = await schoolsApi.getGrades(id);
    setGrades(data);
  };

  const addGrade = async () => {
    if (!newGrade.trim() || !expanded) return;
    await schoolsApi.createGrade(expanded, newGrade, new Date().getFullYear());
    setNewGrade('');
    const data = await schoolsApi.getGrades(expanded);
    setGrades(data);
  };

  const deleteGrade = async (schoolId: string, gradeId: string) => {
    await fetch(`${API}/schools/${schoolId}/grades/${gradeId}`, { method: 'DELETE' });
    const data = await schoolsApi.getGrades(schoolId);
    setGrades(data);
  };

  const filtered = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Colegios ({schools.length})</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setName(''); setAddress(''); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
          <Plus className="h-4 w-4" /> Nuevo Colegio
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 mb-4 space-y-2">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del colegio"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" autoFocus />
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Direccion (opcional)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <div className="flex gap-2">
            <button onClick={save} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold">{editId ? 'Guardar' : 'Crear'}</button>
            <button onClick={() => setShowForm(false)} className="text-neutral-400 text-xs">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colegio..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> :
          filtered.map(s => (
            <div key={s.id} className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{s.name}</p>
                  <p className="text-[10px] text-neutral-400">{s.address || 'Sin direccion'}</p>
                </div>
                <button onClick={() => toggleGrades(s.id)} className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200">
                  {expanded === s.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { setEditId(s.id); setName(s.name); setAddress(s.address || ''); setShowForm(true); }}
                  className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => deleteSchool(s.id)}
                  className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>

              {expanded === s.id && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Grados ({grades.length})</p>
                  <div className="space-y-1 mb-2">
                    {grades.map(g => (
                      <div key={g.id} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg">
                        <span className="text-xs text-slate-700">{g.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400">{g.year}</span>
                          <button onClick={() => deleteGrade(s.id, g.id)} className="text-red-300 hover:text-red-500"><X className="h-3 w-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newGrade} onChange={e => setNewGrade(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addGrade()}
                      placeholder="Nuevo grado (ej: 4to Primaria)" className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                    <button onClick={addGrade} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Agregar</button>
                  </div>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
