'use client';

import { useState, useEffect, useCallback } from 'react';
import { brandsApi, productsApi, type Brand } from '@/services/api';
import { Plus, Edit2, Search, X, Upload, Trash2 } from 'lucide-react';
import { Cargando, botonPrimario, tarjeta, th, useAvisos } from '../_ui';
import { ErrorCampo } from '@/components/form/Campo';
import { LARGO, limpiarTexto } from '@/lib/validar';
import { validarArchivoImagen } from '@/lib/utils';

export default function AdminBrandsPage() {
  const avisos = useAvisos();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [conteo, setConteo] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const load = useCallback(() => Promise.all([brandsApi.getAll(), productsApi.getAll({ includeInactive: true })])
    .then(([bs, prods]) => {
      setBrands([...bs].sort((a, b) => a.name.localeCompare(b.name, 'es')));
      const n: Record<string, number> = {};
      prods.forEach(p => { if (p.brand) n[p.brand] = (n[p.brand] ?? 0) + 1; });
      setConteo(n);
    })
    .catch(e => avisos.error(e, 'No pudimos cargar las marcas'))
    .finally(() => setLoading(false)), [avisos]);
  useEffect(() => { load(); }, [load]);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (enviando) return;
    const nombre = limpiarTexto(name);
    const err = nombre.length < 2 ? 'Escribe el nombre de la marca (mínimo 2 letras).'
      : nombre.length > LARGO.corto ? `Máximo ${LARGO.corto} caracteres.`
      : brands.some(b => b.id !== editId && b.name.toLowerCase() === nombre.toLowerCase()) ? 'Ya existe una marca con ese nombre.' : null;
    setError(err);
    if (err) { document.getElementById('nombre-marca')?.focus(); return; }
    setEnviando(true);
    try {
      if (editId) { await brandsApi.update(editId, { name: nombre }); avisos.exito(`Marca guardada como "${nombre}"`); }
      else { await brandsApi.create(nombre); avisos.exito(`Marca "${nombre}" creada`); }
      setName(''); setEditId(null); setShowForm(false); load();
    } catch (e) { avisos.error(e, 'No pudimos guardar la marca'); }
    finally { setEnviando(false); }
  };

  const uploadLogo = async (b: Brand, file: File) => {
    const err = validarArchivoImagen(file);
    if (err) { avisos.error(new Error(err)); return; }
    try { await brandsApi.uploadLogo(b.id, file); avisos.exito(`Logo de ${b.name} actualizado`); load(); }
    catch (e) { avisos.error(e, 'No pudimos subir el logo'); }
  };

  const remove = async (b: Brand) => {
    const n = conteo[b.name] ?? 0;
    if (!confirm(n ? `¿Eliminar la marca "${b.name}"? ${n} ${n === 1 ? 'producto la usa y quedará' : 'productos la usan y quedarán'} con ese nombre de marca.` : `¿Eliminar la marca "${b.name}"?`)) return;
    try { await brandsApi.delete(b.id); avisos.exito('Marca eliminada'); load(); }
    catch (e) { avisos.error(e, 'No pudimos eliminar la marca'); }
  };

  const filtered = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900">Marcas ({brands.length})</h1>
        <button type="button" onClick={() => { setShowForm(true); setEditId(null); setName(''); setError(null); }} className={botonPrimario}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nueva marca
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} noValidate className={`${tarjeta} p-4 mb-4`}>
          <div className="flex items-center gap-3">
            <input id="nombre-marca" type="text" value={name} onChange={e => { setName(e.target.value); setError(null); }} placeholder="Nombre de la marca" aria-label="Nombre de la marca"
              maxLength={LARGO.corto} required aria-invalid={error ? true : undefined} aria-describedby={error ? 'nombre-marca-error' : undefined}
              className={`flex-1 min-w-0 px-3 py-2 border rounded-lg text-sm ${error ? 'border-profe' : 'border-slate-300'}`} autoFocus />
            <button type="submit" disabled={enviando} className="min-h-10 bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50">{editId ? 'Guardar' : 'Crear'}</button>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Cancelar" className="flex h-10 w-10 items-center justify-center text-tenue"><X className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <ErrorCampo id="nombre-marca" error={error} />
        </form>
      )}

      <div className={`${tarjeta} p-3 mb-4`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar marca…" aria-label="Buscar marca"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
      </div>

      <div className={`${tarjeta} overflow-hidden`}>
        {loading ? <Cargando /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className={`${th} w-16`}>Logo</th>
                <th className={th}>Nombre</th>
                <th className={`${th} text-right`}>Productos</th>
                <th className={`${th} text-center w-28`}>Acciones</th>
              </tr></thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr key={b.id} data-marca={b.name} className={`border-b border-slate-100 hover:bg-blue-50/30 ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-4 py-2">
                      <label className="relative w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-blue-50 overflow-hidden group" title={b.logoUrl ? 'Cambiar logo' : 'Subir logo'}>
                        {b.logoUrl ? <img src={b.logoUrl} alt={`Logo de ${b.name}`} width={40} height={40} loading="lazy" decoding="async" className="w-full h-full object-contain bg-white" /> : <Upload className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
                        {b.logoUrl && <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Upload className="h-3.5 w-3.5 text-white" aria-hidden="true" /></span>}
                        <input type="file" accept="image/*" className="sr-only" aria-label={`${b.logoUrl ? 'Cambiar' : 'Subir'} logo de ${b.name}`}
                          onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(b, f); e.target.value = ''; }} />
                      </label>
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-slate-900">{b.name}</td>
                    <td className="px-4 py-2 text-right text-xs text-slate-600">{conteo[b.name] ?? 0}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center gap-1">
                        <button type="button" onClick={() => { setEditId(b.id); setName(b.name); setShowForm(true); setError(null); }} aria-label={`Renombrar ${b.name}`}
                          className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(b)} aria-label={`Eliminar ${b.name}`}
                          className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length === 0 && !loading && <p className="p-8 text-center text-neutral-400 text-sm">No hay marcas</p>}
      </div>
      <p className="text-[11px] text-neutral-400 mt-3">Al renombrar una marca, sus productos pasan al nuevo nombre.</p>
    </div>
  );
}
