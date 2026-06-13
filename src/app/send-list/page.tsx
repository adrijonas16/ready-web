'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { listsApi, schoolsApi, sectionsApi } from '@/services/api';
import { School, Grade, Section } from '@/lib/types';
import { groupSections } from '@/lib/constants';
import { CheckCircle, List, Plus, Trash2, ClipboardList, ArrowRight, School as SchoolIcon } from 'lucide-react';
import Link from 'next/link';

export default function SendListPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [items, setItems] = useState<{ name: string; quantity: number; notes: string }[]>([
    { name: '', quantity: 1, notes: '' },
  ]);
  const [bulkText, setBulkText] = useState('');
  const [mode, setMode] = useState<'manual' | 'bulk'>('manual');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedListId, setSubmittedListId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // New school/grade creation
  const [isNewSchool, setIsNewSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [isNewGrade, setIsNewGrade] = useState(false);
  const [newGradeName, setNewGradeName] = useState('');

  useEffect(() => { loadSchools(); loadSections(); }, []);

  useEffect(() => {
    if (selectedSchool && !isNewSchool) { loadGrades(selectedSchool); }
    else { setGrades([]); setSelectedGrade(''); }
  }, [selectedSchool, isNewSchool]);

  const loadSchools = async () => {
    try { const data = await schoolsApi.getAll(); setSchools(data); }
    catch (err) { console.error('Error loading schools:', err); }
  };

  const loadSections = async () => {
    try { const data = await sectionsApi.getAll(); setSections(data); }
    catch (err) { console.error('Error loading sections:', err); }
  };

  const loadGrades = async (schoolId: string) => {
    try { const data = await schoolsApi.getGrades(schoolId); setGrades(data); }
    catch (err) { console.error('Error loading grades:', err); }
  };

  const addItem = () => { setItems([...items, { name: '', quantity: 1, notes: '' }]); };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const parseBulkText = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed = lines.map(line => {
      const m = line.match(/^(\d+)\s*[x\-\.)\s]\s*/i);
      let name = line, quantity = 1;
      if (m) { quantity = parseInt(m[1]); name = line.slice(m[0].length).trim(); }
      return { name, quantity, notes: '' };
    });
    if (parsed.length > 0) { setItems(parsed); setMode('manual'); }
  };

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.name.trim().length > 0);
    if (validItems.length === 0) { setError('Agrega al menos un item'); return; }
    if (!user) { setError('Debes iniciar sesion'); return; }

    setSubmitting(true); setError('');

    try {
      let schoolId = selectedSchool;
      let gradeId = selectedGrade;

      // Create school if new
      if (isNewSchool) {
        if (!newSchoolName.trim()) { setError('Escribe el nombre del colegio'); setSubmitting(false); return; }
        const newSchool = await schoolsApi.create(newSchoolName.trim(), newSchoolAddress.trim() || undefined);
        schoolId = typeof newSchool === 'string' ? newSchool : newSchool.id || newSchool;
      }

      if (!schoolId) { setError('Selecciona o crea un colegio'); setSubmitting(false); return; }

      // Create grade if new
      if (isNewGrade || isNewSchool) {
        const gradeName = newGradeName.trim() || (isNewSchool ? newGradeName.trim() : '');
        if (!gradeName) { setError('Escribe el nombre del grado'); setSubmitting(false); return; }
        const newGrade = await schoolsApi.createGrade(schoolId, gradeName, year);
        gradeId = typeof newGrade === 'string' ? newGrade : newGrade.id || newGrade;
      }

      if (!gradeId) { setError('Selecciona o crea un grado'); setSubmitting(false); return; }

      const result = await listsApi.createFromText({
        userId: user.id, schoolId, gradeId, year,
        items: validItems.map(i => ({ nombreOriginal: i.name, cantidad: i.quantity, notas: i.notes || undefined })),
      });
      setSubmittedListId(result.id); setSubmitted(true);
    } catch (err: any) { setError(err.message || 'Error al enviar la lista'); }
    finally { setSubmitting(false); }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="text-center">
          <ClipboardList className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Inicia sesion para enviar tu lista</h2>
          <p className="text-neutral-400 text-sm mb-6">Necesitas estar registrado para enviar listas.</p>
          <Link href="/login" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            Iniciar Sesion
          </Link>
        </div>
      </div>
    );
  }

  if (submitted && submittedListId) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lista enviada</h2>
          <p className="text-neutral-400 text-sm mb-6">Estamos buscando los mejores productos. Te notificaremos cuando este lista.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push(`/lists/${submittedListId}`)}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
              Ver mi lista <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => router.push('/my-lists')}
              className="w-full bg-white text-slate-700 py-3 rounded-xl font-medium text-sm shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 hover:shadow-md transition-shadow">
              <List className="h-4 w-4" /> Mis listas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="max-w-3xl mx-auto py-6 px-4">
        <h1 className="text-slate-900 text-2xl font-bold tracking-tight mb-1">Enviar Lista de Utiles</h1>
        <p className="text-neutral-400 text-sm mb-6">Escribe los utiles y encontraremos los mejores productos.</p>

        <div className="space-y-4 animate-slide-up">
          {/* School & Grade */}
          <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Datos del colegio</h2>
              <button
                onClick={() => { setIsNewSchool(!isNewSchool); setSelectedSchool(''); setSelectedGrade(''); setIsNewGrade(false); }}
                className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
              >
                {isNewSchool ? 'Elegir colegio existente' : 'Mi colegio no esta en la lista'}
              </button>
            </div>

            {isNewSchool ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Nombre del colegio *</label>
                  <input
                    type="text"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    placeholder="Ej: Colegio Los Andes"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-neutral-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Direccion (opcional)</label>
                  <input
                    type="text"
                    value={newSchoolAddress}
                    onChange={(e) => setNewSchoolAddress(e.target.value)}
                    placeholder="Ej: Av. Principal 123, Santiago"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-neutral-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Grado / Curso *</label>
                    <select
                      value={newGradeName}
                      onChange={(e) => setNewGradeName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Seleccionar grado</option>
                      {groupSections(sections).map(g => (
                        <optgroup key={g.group} label={g.group}>
                          {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Ano</label>
                    <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Colegio</label>
                    <select value={selectedSchool} onChange={(e) => { setSelectedSchool(e.target.value); setIsNewGrade(false); setSelectedGrade(''); }}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      <option value="">Seleccionar colegio</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Ano</label>
                    <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {selectedSchool && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-neutral-400">Grado / Curso</label>
                      {grades.length > 0 && (
                        <button
                          onClick={() => { setIsNewGrade(!isNewGrade); setSelectedGrade(''); }}
                          className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          {isNewGrade ? 'Elegir grado existente' : 'Mi grado no aparece'}
                        </button>
                      )}
                    </div>

                    {isNewGrade || grades.length === 0 ? (
                      <select
                        value={newGradeName}
                        onChange={(e) => setNewGradeName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">Seleccionar grado</option>
                        {GRADE_OPTIONS.map(g => (
                          <optgroup key={g.group} label={g.group}>
                            {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    ) : (
                      <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                        <option value="">Seleccionar grado</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* List Items */}
          <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Lista de utiles</h2>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button onClick={() => setMode('manual')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${mode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  Item por item
                </button>
                <button onClick={() => setMode('bulk')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${mode === 'bulk' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  Pegar lista
                </button>
              </div>
            </div>

            {mode === 'bulk' ? (
              <div>
                <p className="text-xs text-neutral-400 mb-3">Un item por linea. Ej: "2 Cuadernos cuadriculados"</p>
                <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={10}
                  placeholder={"2 Cuadernos cuadriculados 100 hojas\n1 Regla 30cm\n3 Lapices HB\n1 Caja de colores 12 unidades"}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-neutral-400" />
                <button onClick={parseBulkText} disabled={!bulkText.trim()}
                  className="mt-3 bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
                  Procesar lista
                </button>
              </div>
            ) : (
              <div>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="w-6 text-xs text-neutral-400 font-mono text-right flex-shrink-0">{index + 1}.</span>
                      <input type="text" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Nombre del producto"
                        className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-neutral-400" />
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 rounded-full border border-blue-500 text-blue-500 flex items-center justify-center text-xs hover:bg-blue-50 transition-colors">-</button>
                        <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs hover:shadow-md hover:shadow-blue-500/25 transition-shadow">+</button>
                      </div>
                      <button onClick={() => removeItem(index)} disabled={items.length === 1}
                        className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-30">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-3 flex items-center gap-1.5 text-blue-500 hover:text-blue-600 font-bold text-sm transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Agregar item
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {/* Submit */}
          <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5">
            <p className="text-sm text-neutral-400 mb-4">
              <span className="font-bold text-slate-900">{items.filter(i => i.name.trim()).length}</span> items en tu lista
            </p>
            <button onClick={handleSubmit}
              disabled={submitting || items.filter(i => i.name.trim()).length === 0}
              className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><ClipboardList className="h-4 w-4" /> Enviar Lista</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
