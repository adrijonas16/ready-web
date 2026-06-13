'use client';

import { useState, useEffect } from 'react';
import { listsApi, schoolsApi } from '@/services/api';
import { SupplyList, School, Grade } from '@/lib/types';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { Package, GraduationCap, School as SchoolIcon, Plus, Search, ArrowRight } from 'lucide-react';

export default function ListsPage() {
  const [officialLists, setOfficialLists] = useState<SupplyList[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (selectedSchool) { loadGrades(selectedSchool); }
    else { setGrades([]); setSelectedGrade(''); }
  }, [selectedSchool]);

  const loadData = async () => {
    try {
      const [listsData, schoolsData] = await Promise.all([listsApi.getOfficial(), schoolsApi.getAll()]);
      setOfficialLists(listsData);
      setSchools(schoolsData);
    } catch (err) { console.error('Error loading data:', err); }
    finally { setLoading(false); }
  };

  const loadGrades = async (schoolId: string) => {
    try { const data = await schoolsApi.getGrades(schoolId); setGrades(data); }
    catch (err) { console.error('Error loading grades:', err); }
  };

  const filteredLists = officialLists.filter(list => {
    if (list.estado !== 'VALIDADA' && list.estado !== 'PROCESADA') return false;
    if (selectedSchool && list.schoolId !== selectedSchool) return false;
    if (selectedGrade && list.gradeId !== selectedGrade) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-sky-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-slate-900 text-2xl font-bold tracking-tight mb-6">Listas de Utiles</h1>

        {/* Filters */}
        <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Buscar por colegio</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm">
              <option value="">Todos los colegios</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} disabled={!selectedSchool}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-neutral-400 text-sm">
              <option value="">Todos los grados</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button onClick={() => { setSelectedSchool(''); setSelectedGrade(''); }}
              className="py-3 px-4 bg-white text-slate-600 rounded-xl font-medium text-sm border border-slate-200 hover:bg-slate-50 transition-colors">
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Official Lists */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-900 text-lg font-bold">Listas Oficiales</h2>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">{filteredLists.length} disponibles</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-12 text-center">
            <Package className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No hay listas disponibles</h3>
            <p className="text-neutral-400 text-sm mb-6">Prueba con otros filtros o envia tu propia lista</p>
            <Link href="/send-list" className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
              <Plus className="h-4 w-4" /> Enviar mi lista
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children mb-8">
            {filteredLists.map((list) => (
              <Link key={list.id} href={`/lists/${list.id}`}
                className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)] group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-500 transition-colors">{list.schoolName || 'Colegio'}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" /> {list.gradeName || 'Grado'}
                      </p>
                    </div>
                    <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                      <Package className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-neutral-400">Ano {list.year}</span>
                    <span className="text-blue-500 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-[gap]">
                      Ver lista <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA Banner */}
        <div className="bg-blue-500 rounded-[20px] p-7 text-white shadow-lg shadow-blue-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1">No encuentras tu lista?</h2>
              <p className="text-white/60 text-sm">Envia la lista de tu hijo y la procesamos</p>
            </div>
            <div className="flex gap-3">
              <Link href="/send-list" className="bg-white text-blue-500 px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-shadow">
                Enviar lista
              </Link>
              <Link href="/upload" className="bg-white/15 text-white px-5 py-2.5 rounded-xl font-bold text-sm border border-white/20 hover:bg-white/25 transition-colors">
                Subir foto
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
