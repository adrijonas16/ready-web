'use client';

import { useState, useEffect, useCallback } from 'react';
import { sectionsApi } from '@/services/api';
import { Section } from '@/lib/types';
import { groupSections } from '@/lib/constants';
import { Plus, Trash2, X, Edit2, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { Cargando, botonPrimario, tarjeta, useAvisos } from '../_ui';
import { ErrorCampo } from '@/components/form/Campo';
import { LARGO, limpiarTexto } from '@/lib/validar';

export default function AdminSectionsPage() {
  const avisos = useAvisos();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState('Primaria');
  const [customGroup, setCustomGroup] = useState('');
  const [useCustomGroup, setUseCustomGroup] = useState(false);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [moviendo, setMoviendo] = useState(false);
  const [errores, setErrores] = useState<{ nivel?: string | null; nombre?: string | null; editar?: string | null }>({});
  const [enviando, setEnviando] = useState(false);

  const load = useCallback(() => sectionsApi.getAll()
    .then(s => setSections([...s].sort((a, b) => a.sortOrder - b.sortOrder)))
    .catch(e => avisos.error(e, 'No pudimos cargar los grados'))
    .finally(() => setLoading(false)), [avisos]);
  useEffect(() => { load(); }, [load]);

  const errorNombre = (v: string, id?: string) => {
    const t = limpiarTexto(v);
    if (t.length < 2) return 'Escribe el nombre del grado.';
    if (t.length > LARGO.corto) return `Máximo ${LARGO.corto} caracteres.`;
    if (sections.some(x => x.id !== id && x.name.toLowerCase() === t.toLowerCase())) return 'Ya existe un grado con ese nombre.';
    return null;
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (enviando) return;
    const group = useCustomGroup ? limpiarTexto(customGroup) : groupName;
    const errs = { nivel: group.length < 2 ? 'Escribe el nombre del nivel.' : null, nombre: errorNombre(name) };
    setErrores(errs);
    if (errs.nivel || errs.nombre) { document.getElementById(errs.nivel ? 'nivel-grado' : 'nombre-grado')?.focus(); return; }
    const nombre = limpiarTexto(name);
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sortOrder)) + 1 : 1;
    setEnviando(true);
    try {
      await sectionsApi.create(group, nombre, maxOrder);
      avisos.exito(`Grado "${nombre}" creado`);
      setName(''); setCustomGroup(''); setUseCustomGroup(false); setShowForm(false); load();
    } catch (e) { avisos.error(e, 'No pudimos crear el grado'); }
    finally { setEnviando(false); }
  };

  const rename = async (s: Section) => {
    if (enviando) return;
    const nuevo = limpiarTexto(editName);
    if (nuevo === s.name) { setEditId(null); return; }
    const err = errorNombre(nuevo, s.id);
    setErrores(x => ({ ...x, editar: err }));
    if (err) return;
    setEnviando(true);
    try { await sectionsApi.update(s.id, { name: nuevo, groupName: s.groupName, sortOrder: s.sortOrder }); avisos.exito(`Renombrado a "${nuevo}"`); setEditId(null); load(); }
    catch (e) { avisos.error(e, 'No pudimos renombrar el grado'); }
    finally { setEnviando(false); }
  };

  /** Intercambia el orden con el grado vecino del mismo nivel */
  const mover = async (s: Section, dir: -1 | 1) => {
    const grupo = sections.filter(x => x.groupName === s.groupName);
    const i = grupo.findIndex(x => x.id === s.id);
    const otro = grupo[i + dir];
    if (!otro) return;
    setMoviendo(true);
    try {
      // Si tienen el mismo número de orden, se separan
      const a = s.sortOrder === otro.sortOrder ? otro.sortOrder + dir : otro.sortOrder;
      await sectionsApi.update(s.id, { name: s.name, groupName: s.groupName, sortOrder: a });
      await sectionsApi.update(otro.id, { name: otro.name, groupName: otro.groupName, sortOrder: s.sortOrder });
      await load();
    } catch (e) { avisos.error(e, 'No pudimos cambiar el orden'); }
    finally { setMoviendo(false); }
  };

  const existingGroups = [...new Set(sections.map(s => s.groupName))];

  const remove = async (s: Section) => {
    if (!confirm(`¿Eliminar el grado "${s.name}"?`)) return;
    try { await sectionsApi.delete(s.id); avisos.exito('Grado eliminado'); load(); }
    catch (e) { avisos.error(e, 'No pudimos eliminar el grado'); }
  };

  const grouped = groupSections(sections);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900">Grados ({sections.length})</h1>
        <button type="button" onClick={() => { setShowForm(true); setName(''); setErrores({}); }} className={botonPrimario}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo grado
        </button>
      </div>
      <p className="text-xs text-neutral-400 mb-4 -mt-2">Estos son los grados que puede ofrecer un colegio. El orden es el que ven los clientes al elegir su grado.</p>

      {showForm && (
        <form onSubmit={save} noValidate className={`${tarjeta} p-4 mb-4 space-y-3`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
            <div className="w-full sm:w-48">
              <label className="block text-xs text-slate-500 mb-1" htmlFor="nivel-grado">Nivel</label>
              {useCustomGroup ? (
                <div className="flex gap-1">
                  <input id="nivel-grado" type="text" value={customGroup} onChange={e => { setCustomGroup(e.target.value); setErrores(x => ({ ...x, nivel: null })); }} placeholder="Nombre del nuevo nivel"
                    maxLength={LARGO.corto} required aria-invalid={errores.nivel ? true : undefined} aria-describedby={errores.nivel ? 'nivel-grado-error' : undefined}
                    className={`flex-1 min-w-0 px-3 py-2 border rounded-lg text-sm ${errores.nivel ? 'border-profe' : 'border-slate-300'}`} autoFocus />
                  <button type="button" onClick={() => setUseCustomGroup(false)} aria-label="Usar un nivel existente" className="text-tenue px-2"><X className="h-3.5 w-3.5" aria-hidden="true" /></button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <select id="nivel-grado" value={groupName} onChange={e => setGroupName(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    {['Inicial', 'Primaria', 'Secundaria'].filter(g => !existingGroups.includes(g)).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <button type="button" onClick={() => setUseCustomGroup(true)} aria-label="Nuevo nivel" title="Nuevo nivel"
                    className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-blue-500 hover:bg-blue-50"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              )}
              <ErrorCampo id="nivel-grado" error={errores.nivel} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1" htmlFor="nombre-grado">Nombre del grado</label>
              <input id="nombre-grado" type="text" value={name} onChange={e => { setName(e.target.value); setErrores(x => ({ ...x, nombre: null })); }} placeholder="Ej: 6to Primaria"
                maxLength={LARGO.corto} required aria-invalid={errores.nombre ? true : undefined} aria-describedby={errores.nombre ? 'nombre-grado-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errores.nombre ? 'border-profe' : 'border-slate-300'}`} autoFocus />
              <ErrorCampo id="nombre-grado" error={errores.nombre} />
            </div>
            <div className="flex gap-2 sm:pt-5">
              <button type="submit" disabled={enviando} className="min-h-10 bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50">Crear</button>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Cancelar" className="flex h-10 w-10 items-center justify-center text-tenue"><X className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        </form>
      )}

      {loading ? <Cargando /> : (
        <div className="space-y-4">
          {grouped.map(g => {
            const grupo = sections.filter(s => s.groupName === g.group);
            return (
              <section key={g.group} aria-label={g.group} className={`${tarjeta} overflow-hidden`}>
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h2 className="text-sm font-bold text-slate-900">{g.group}</h2>
                </div>
                <ul className="divide-y divide-slate-100">
                  {grupo.map((s, i) => (
                    <li key={s.id} data-seccion={s.name} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50/30">
                      {editId === s.id ? (
                        <span className="flex-1 min-w-0">
                          <input id={`renombrar-${s.id}`} value={editName} onChange={e => { setEditName(e.target.value); setErrores(x => ({ ...x, editar: null })); }} autoFocus aria-label="Nuevo nombre del grado" maxLength={LARGO.corto}
                            aria-invalid={errores.editar ? true : undefined} aria-describedby={errores.editar ? `renombrar-${s.id}-error` : undefined}
                            onKeyDown={e => { if (e.key === 'Enter') rename(s); if (e.key === 'Escape') setEditId(null); }}
                            className={`w-full px-2 py-1 border rounded-lg text-sm ${errores.editar ? 'border-profe' : 'border-blue-300'}`} />
                          <ErrorCampo id={`renombrar-${s.id}`} error={errores.editar} />
                        </span>
                      ) : <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">{s.name}</span>}
                      <button onClick={() => mover(s, -1)} disabled={i === 0 || moviendo} aria-label={`Subir ${s.name}`} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-20"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => mover(s, 1)} disabled={i === grupo.length - 1 || moviendo} aria-label={`Bajar ${s.name}`} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-20"><ArrowDown className="h-3.5 w-3.5" /></button>
                      {editId === s.id
                        ? <button onClick={() => rename(s)} aria-label="Guardar nombre" className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Check className="h-3.5 w-3.5" /></button>
                        : <button onClick={() => { setEditId(s.id); setEditName(s.name); setErrores(x => ({ ...x, editar: null })); }} aria-label={`Renombrar ${s.name}`} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 className="h-3.5 w-3.5" /></button>}
                      <button onClick={() => remove(s)} aria-label={`Eliminar ${s.name}`} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {sections.length === 0 && <p className="text-center text-neutral-400 py-8 text-sm">No hay grados configurados</p>}
        </div>
      )}
    </div>
  );
}
