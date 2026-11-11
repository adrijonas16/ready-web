'use client';

import { useState, useEffect, useCallback } from 'react';
import { schoolsApi, sectionsApi, listsApi } from '@/services/api';
import { Plus, Edit2, Trash2, Search, X, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { Section, School, Grade } from '@/lib/types';
import { groupSections } from '@/lib/constants';
import { Cargando, añoEscolar, añosElegibles, botonPrimario, campo, tarjeta, useAvisos } from '../_ui';
import { ErrorCampo } from '@/components/form/Campo';
import { LARGO, limpiarTexto } from '@/lib/validar';
import Paginador, { usePaginacion } from '@/components/Paginador';
import { buscarOpciones } from '@/lib/buscar';
import { BASE, DEPARTAMENTOS } from '@/lib/peru';

export default function AdminSchoolsPage() {
  const avisos = useAvisos();
  const [schools, setSchools] = useState<School[]>([]);
  const [listasPorColegio, setListasPorColegio] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [departamento, setDepartamento] = useState<string>(BASE);
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');
  const [filtroDep, setFiltroDep] = useState('');
  const [errores, setErrores] = useState<{ nombre?: string | null; direccion?: string | null }>({});
  const [enviando, setEnviando] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [newGrade, setNewGrade] = useState('');
  const [newYear, setNewYear] = useState(añoEscolar());
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [schoolSectionIds, setSchoolSectionIds] = useState<Set<string>>(new Set());
  const [savingSections, setSavingSections] = useState(false);

  const load = useCallback(() => Promise.all([schoolsApi.getAll({ todos: true }), listsApi.getAll().catch(() => [])])
    .then(([s, ls]) => {
      setSchools(s);
      const n: Record<string, number> = {};
      ls.forEach(l => { n[l.schoolId] = (n[l.schoolId] ?? 0) + 1; });
      setListasPorColegio(n);
    })
    .catch(e => avisos.error(e, 'No pudimos cargar los colegios'))
    .finally(() => setLoading(false)), [avisos]);
  useEffect(() => {
    load();
    sectionsApi.getAll().then(setAllSections).catch(e => avisos.error(e, 'No pudimos cargar los grados'));
  }, [load, avisos]);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (enviando) return;
    const nombre = limpiarTexto(name), dir = limpiarTexto(address);
    const errs = {
      nombre: nombre.length < 3 ? 'Escribe el nombre del colegio.' : nombre.length > LARGO.nombre ? `Máximo ${LARGO.nombre} caracteres.`
        : schools.some(x => x.id !== editId && x.name.toLowerCase() === nombre.toLowerCase() && (x.departamento ?? BASE) === departamento)
          ? `Ya existe un colegio con ese nombre en ${departamento}.` : null,
      direccion: dir.length > LARGO.direccion ? `Máximo ${LARGO.direccion} caracteres.` : null,
    };
    setErrores(errs);
    if (errs.nombre || errs.direccion) { document.getElementById(errs.nombre ? 'nombre-colegio' : 'direccion-colegio')?.focus(); return; }
    setEnviando(true);
    try {
      const datos = { name: nombre, address: dir || undefined, departamento, provincia: limpiarTexto(provincia) || undefined, distrito: limpiarTexto(distrito) || undefined };
      if (editId) { await schoolsApi.update(editId, datos); avisos.exito('Colegio guardado'); }
      else { await schoolsApi.create(datos); avisos.exito(`Colegio "${nombre}" creado`); }
      limpiarForm(); setShowForm(false); load();
    } catch (e) { avisos.error(e, 'No pudimos guardar el colegio'); }
    finally { setEnviando(false); }
  };

  const limpiarForm = () => { setName(''); setAddress(''); setDepartamento(filtroDep || BASE); setProvincia(''); setDistrito(''); setEditId(null); setErrores({}); };

  const deleteSchool = async (s: School) => {
    const n = listasPorColegio[s.id] ?? 0;
    if (n) { avisos.error(null, `No se puede eliminar "${s.name}": tiene ${n} ${n === 1 ? 'lista' : 'listas'}. Elimina o mueve esas listas primero.`); return; }
    if (!confirm(`¿Eliminar "${s.name}" y todos sus grados?`)) return;
    try { await schoolsApi.delete(s.id); avisos.exito('Colegio eliminado'); if (expanded === s.id) setExpanded(null); load(); }
    catch (e) { avisos.error(e, 'No pudimos eliminar el colegio'); }
  };

  const toggleGrades = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    try {
      const [gradesData, schoolSecs] = await Promise.all([schoolsApi.getGrades(id), schoolsApi.getSchoolSections(id)]);
      setGrades(gradesData);
      setSchoolSectionIds(new Set(schoolSecs.map(s => s.id)));
    } catch (e) { avisos.error(e, 'No pudimos cargar los grados del colegio'); }
  };

  const toggleSection = async (schoolId: string, sectionId: string) => {
    const newSet = new Set(schoolSectionIds);
    if (newSet.has(sectionId)) newSet.delete(sectionId); else newSet.add(sectionId);
    setSchoolSectionIds(newSet);
    setSavingSections(true);
    try { await schoolsApi.setSchoolSections(schoolId, Array.from(newSet)); }
    catch (e) { avisos.error(e, 'No pudimos guardar los grados que ofrece el colegio'); }
    finally { setSavingSections(false); }
  };

  const addGrade = async () => {
    if (!newGrade || !expanded) { avisos.error(null, 'Elige el grado'); return; }
    if (grades.some(g => g.name === newGrade && g.year === newYear)) { avisos.error(null, `${newGrade} ${newYear} ya existe`); return; }
    try {
      await schoolsApi.createGrade(expanded, newGrade, newYear);
      avisos.exito(`${newGrade} (${newYear}) agregado`);
      setNewGrade('');
      setGrades(await schoolsApi.getGrades(expanded));
    } catch (e) { avisos.error(e, 'No pudimos agregar el grado'); }
  };

  const deleteGrade = async (schoolId: string, g: Grade) => {
    if (!confirm(`¿Eliminar ${g.name} (${g.year})?`)) return;
    try { await schoolsApi.deleteGrade(schoolId, g.id); avisos.exito('Grado eliminado'); setGrades(await schoolsApi.getGrades(schoolId)); }
    catch (e) { avisos.error(e, 'No pudimos eliminar el grado'); }
  };

  // Misma búsqueda amigable que en la tienda (cualquier palabra, sin tildes, con errores de tipeo)
  const delDepartamento = filtroDep ? schools.filter(s => (s.departamento ?? BASE) === filtroDep) : schools;
  const filtered = search.trim() ? buscarOpciones(delDepartamento.map(s => ({ ...s, label: s.name })), search) : delDepartamento;
  const pag = usePaginacion(filtered, 20, `${filtroDep}|${search}`);
  const porDepartamento = schools.reduce<Record<string, number>>((n, s) => { const d = s.departamento ?? BASE; n[d] = (n[d] ?? 0) + 1; return n; }, {});
  const ordenGrado = (g: Grade) => allSections.find(s => s.name === g.name)?.sortOrder ?? 999;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900">Colegios ({schools.length})</h1>
        <button type="button" onClick={() => { limpiarForm(); setShowForm(true); }} className={botonPrimario}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo colegio
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} noValidate className={`${tarjeta} p-4 mb-4 space-y-2`}>
          <div>
            <input id="nombre-colegio" type="text" value={name} onChange={e => { setName(e.target.value); setErrores(x => ({ ...x, nombre: null })); }} placeholder="Nombre del colegio" aria-label="Nombre del colegio"
              maxLength={LARGO.nombre} required autoComplete="off" aria-invalid={errores.nombre ? true : undefined} aria-describedby={errores.nombre ? 'nombre-colegio-error' : undefined}
              className={`${campo} ${errores.nombre ? '!border-profe' : ''}`} autoFocus />
            <ErrorCampo id="nombre-colegio" error={errores.nombre} />
          </div>
          <div>
            <input id="direccion-colegio" type="text" value={address} onChange={e => { setAddress(e.target.value); setErrores(x => ({ ...x, direccion: null })); }} placeholder="Dirección (opcional)" aria-label="Dirección"
              maxLength={LARGO.direccion} autoComplete="off" aria-invalid={errores.direccion ? true : undefined} aria-describedby={errores.direccion ? 'direccion-colegio-error' : undefined}
              className={`${campo} ${errores.direccion ? '!border-profe' : ''}`} />
            <ErrorCampo id="direccion-colegio" error={errores.direccion} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="text-[11px] text-slate-600">Departamento
              <select value={departamento} onChange={e => setDepartamento(e.target.value)} className={`${campo} mt-0.5`}>
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="text-[11px] text-slate-600">Provincia <span className="text-tenue">(opcional)</span>
              <input type="text" value={provincia} onChange={e => setProvincia(e.target.value)} maxLength={80} autoComplete="off" className={`${campo} mt-0.5`} />
            </label>
            <label className="text-[11px] text-slate-600">Distrito <span className="text-tenue">(opcional)</span>
              <input type="text" value={distrito} onChange={e => setDistrito(e.target.value)} maxLength={80} autoComplete="off" className={`${campo} mt-0.5`} />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={enviando} className="min-h-10 bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50">{editId ? 'Guardar' : 'Crear'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="min-h-10 px-3 text-tenue text-xs">Cancelar</button>
          </div>
        </form>
      )}

      <div className={`${tarjeta} p-3 mb-4 flex flex-wrap gap-2`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colegio…" aria-label="Buscar colegio"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={filtroDep} onChange={e => setFiltroDep(e.target.value)} aria-label="Departamento" className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700">
          <option value="">Todos los departamentos</option>
          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d} ({porDepartamento[d] ?? 0})</option>)}
        </select>
      </div>

      <div id="lista-colegios" className="space-y-2 scroll-mt-20">
        {loading ? <Cargando /> : pag.visibles.map(s => (
          <div key={s.id} data-colegio={s.name} className={`${tarjeta} overflow-hidden`}>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-4 w-4 text-blue-500" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                <p className="text-[10px] text-neutral-400 truncate">{s.address || 'Sin dirección'} · {[s.distrito, s.departamento ?? BASE].filter(Boolean).join(', ')} · {listasPorColegio[s.id] ?? 0} listas</p>
              </div>
              <button onClick={() => toggleGrades(s.id)} aria-expanded={expanded === s.id} aria-label={`Grados de ${s.name}`} className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200">
                {expanded === s.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => { setEditId(s.id); setName(s.name); setAddress(s.address || ''); setDepartamento(s.departamento ?? BASE); setProvincia(s.provincia ?? ''); setDistrito(s.distrito ?? ''); setErrores({}); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                aria-label={`Editar ${s.name}`} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => deleteSchool(s)} aria-label={`Eliminar ${s.name}`} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>

            {expanded === s.id && (
              <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">
                    Grados que ofrece este colegio {savingSections && <span className="text-blue-500 normal-case">(guardando…)</span>}
                  </p>
                  {groupSections(allSections).map(group => (
                    <div key={group.group}>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{group.group}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {allSections.filter(sec => sec.groupName === group.group).map(sec => (
                          <button key={sec.id} onClick={() => toggleSection(s.id, sec.id)} aria-pressed={schoolSectionIds.has(sec.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${schoolSectionIds.has(sec.id) ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                            {sec.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Grados con lista ({grades.length})</p>
                  <ul className="space-y-1 mb-2">
                    {[...grades].sort((a, b) => b.year - a.year || ordenGrado(a) - ordenGrado(b)).map(g => (
                      <li key={g.id} data-grado={`${g.name} ${g.year}`} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg">
                        <span className="text-xs text-slate-700">{g.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${g.year === añoEscolar() ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>Año {g.year}</span>
                          <button onClick={() => deleteGrade(s.id, g)} aria-label={`Eliminar ${g.name} ${g.year}`} className="text-red-300 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <select value={newGrade} onChange={e => setNewGrade(e.target.value)} aria-label="Grado" className="flex-1 min-w-[160px] px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="">Elegir grado</option>
                      {groupSections(allSections.filter(x => schoolSectionIds.has(x.id))).map(g => (
                        <optgroup key={g.group} label={g.group}>
                          {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <select value={newYear} onChange={e => setNewYear(Number(e.target.value))} aria-label="Año escolar" className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                      {añosElegibles().map(a => <option key={a} value={a}>Año {a}{a === añoEscolar() ? ' (el que vende la tienda)' : ''}</option>)}
                    </select>
                    <button onClick={addGrade} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Agregar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {!loading && filtered.length === 0 && <p className="text-center py-8 text-neutral-400 text-sm">No hay colegios</p>}
      </div>
      <Paginador {...pag} onCambiar={pag.setPagina} nombre="colegios" anclaId="lista-colegios" />
    </div>
  );
}
