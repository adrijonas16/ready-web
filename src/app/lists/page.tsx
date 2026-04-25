'use client';

import { useState, useEffect } from 'react';
import { listsApi, schoolsApi } from '@/services/api';
import { SupplyList, School, Grade } from '@/lib/types';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { Package, GraduationCap, School as SchoolIcon, Plus, Search } from 'lucide-react';

export default function ListsPage() {
  const [officialLists, setOfficialLists] = useState<SupplyList[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      loadGrades(selectedSchool);
    } else {
      setGrades([]);
      setSelectedGrade('');
    }
  }, [selectedSchool]);

  const loadData = async () => {
    try {
      const [listsData, schoolsData] = await Promise.all([
        listsApi.getOfficial(),
        schoolsApi.getAll()
      ]);
      setOfficialLists(listsData);
      setSchools(schoolsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async (schoolId: string) => {
    try {
      const data = await schoolsApi.getGrades(schoolId);
      setGrades(data);
    } catch (err) {
      console.error('Error loading grades:', err);
    }
  };

  const filteredLists = officialLists.filter(list => {
    if (selectedSchool && list.schoolId !== selectedSchool) return false;
    if (selectedGrade && list.gradeId !== selectedGrade) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center gap-4 mb-4">
            <span className="text-6xl">📋</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Listas de Útiles
          </h1>
          <p className="text-gray-600 text-lg">Encuentra la lista de tu colegio y empieza a comprar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Search className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-bold text-lg text-gray-900">Buscar por colegio</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <SchoolIcon className="h-4 w-4 text-purple-500" />
                Colegio
              </label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white text-gray-900"
              >
                <option value="">Todos los colegios</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-pink-500" />
                Grado
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                disabled={!selectedSchool}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white text-gray-900"
              >
                <option value="">Todos los grados</option>
                {grades.map(grade => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setSelectedSchool(''); setSelectedGrade(''); }}
                className="w-full py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-medium hover:from-gray-200 hover:to-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Listas Oficiales</h2>
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {filteredLists.length} disponibles
            </span>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <span className="text-6xl mb-4 block">📭</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hay listas disponibles</h3>
              <p className="text-gray-500 mb-6">Prueba con otros filtros o sube tu propia lista</p>
              <Link href="/upload" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-shadow">
                <Plus className="h-5 w-5" />
                Subir mi lista
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLists.map((list, index) => {
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-purple-500 to-pink-500',
                  'from-green-500 to-emerald-500',
                  'from-orange-500 to-yellow-500',
                  'from-pink-500 to-rose-500',
                ];
                const color = colors[index % colors.length];
                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group"
                  >
                    <div className={`h-3 bg-gradient-to-r ${color}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:${color}">
                            {list.schoolName || 'Colegio'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            {list.gradeName || 'Grado'}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold">✓</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <span>📅</span>
                          Año {list.year}
                        </span>
                        <span className={`bg-gradient-to-r ${color} text-white px-4 py-2 rounded-xl font-medium text-sm group-hover:shadow-md transition-shadow flex items-center gap-1`}>
                          Ver lista <span>→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-2">¿No encuentras tu lista?</h2>
          <p className="text-white/80 mb-6">Sube la foto de la lista de tu hijo y nosotros la procesamos</p>
          <Link href="/upload" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
            <Plus className="h-5 w-5" />
            Subir mi lista
          </Link>
        </div>
      </div>
    </div>
  );
}