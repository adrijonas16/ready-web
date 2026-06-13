'use client';

import { useState, useEffect } from 'react';
import { listsApi, schoolsApi, sectionsApi } from '@/services/api';
import { SupplyList, School, Section } from '@/lib/types';
import { groupSections } from '@/lib/constants';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { Package, GraduationCap, Search, ArrowRight } from 'lucide-react';
import SearchSelect from '@/components/SearchSelect';

export default function ListsPage() {
  const [officialLists, setOfficialLists] = useState<SupplyList[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [schoolSections, setSchoolSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (selectedSchool) { loadSchoolSections(selectedSchool); }
    else { setSchoolSections([]); setSelectedGrade(''); }
  }, [selectedSchool]);

  const loadData = async () => {
    try {
      const [listsData, schoolsData, sectionsData] = await Promise.all([listsApi.getOfficial(), schoolsApi.getAll(), sectionsApi.getAll()]);
      setOfficialLists(listsData);
      setSchools(schoolsData);
      setAllSections(sectionsData);
    } catch (err) { console.error('Error loading data:', err); }
    finally { setLoading(false); }
  };

  const loadSchoolSections = async (schoolId: string) => {
    try { const data = await schoolsApi.getSchoolSections(schoolId); setSchoolSections(data); }
    catch (err) { console.error('Error loading school sections:', err); }
  };

  const filteredLists = officialLists.filter(list => {
    if (list.estado !== 'VALIDADA' && list.estado !== 'PROCESADA') return false;
    if (selectedSchool && list.schoolId !== selectedSchool) return false;
    if (selectedGrade && list.gradeName !== selectedGrade) return false;
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
            <SearchSelect
              value={selectedSchool}
              onChange={setSelectedSchool}
              placeholder="Todos los colegios"
              options={schools.map(s => ({ value: s.id, label: s.name }))}
            />
            <SearchSelect
              value={selectedGrade}
              onChange={setSelectedGrade}
              placeholder="Todos los grados"
              options={(selectedSchool && schoolSections.length > 0 ? schoolSections : allSections).map(s => ({ value: s.name, label: s.name, group: s.groupName }))}
            />
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
            <p className="text-neutral-400 text-sm">Prueba con otros filtros</p>
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

      </div>
    </div>
  );
}
