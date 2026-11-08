'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  productsApi, brandsApi, categoriesApi, productImagesApi, variantsApi,
  type Brand, type Category, type ProductImage,
} from '@/services/api';
import type { Product, VariantType, VariantValue } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Check, Plus, Package, Trash2, Upload, Star, Save } from 'lucide-react';
import SearchSelect from '@/components/SearchSelect';
import { Interruptor, NIVELES, NivelBadge, campo, tarjeta, useAvisos } from '../_ui';
import { ErrorCampo } from '@/components/form/Campo';
import { LARGO, enfocar, primerError, validarEntero, validarPrecio, validarTexto } from '@/lib/validar';
import { validarArchivoImagen } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Información' },
  { num: 2, label: 'Fotos' },
  { num: 3, label: 'Variantes' },
  { num: 4, label: 'Revisar y publicar' },
];

const PRESETS = ['Color', 'Tamaño', 'Cantidad', 'Material', 'Personaje', 'Presentación', 'Diseño', 'Curso'];

interface Formulario { name: string; description: string; category: string; brand: string; sku: string; basePrice: string; stock: string; tier: string; isActive: boolean }
const vacio: Formulario = { name: '', description: '', category: '', brand: '', sku: '', basePrice: '0', stock: '100', tier: 'medio', isActive: true };

export default function ProductWizard({ productId }: { productId?: string }) {
  const router = useRouter();
  const avisos = useAvisos();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(productId || '');
  const [cargando, setCargando] = useState(!!productId);

  const [form, setForm] = useState<Formulario>(vacio);
  const [guardado, setGuardado] = useState<Formulario>(vacio);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [variants, setVariants] = useState<VariantType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [errores, setErrores] = useState<Partial<Record<keyof Formulario, string | null>>>({});
  const ac = (k: keyof Formulario) => ({ id: `p-${k}`, 'aria-invalid': errores[k] ? true : undefined, 'aria-describedby': errores[k] ? `p-${k}-error` : undefined });

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(e => avisos.error(e, 'No pudimos cargar las categorías'));
    brandsApi.getAll().then(setBrands).catch(e => avisos.error(e, 'No pudimos cargar las marcas'));
  }, [avisos]);

  const cargarFotos = useCallback(async (id: string) => {
    try { setImages(await productImagesApi.getAll(id)); }
    catch (e) { avisos.error(e, 'No pudimos cargar las fotos'); }
  }, [avisos]);

  useEffect(() => {
    if (!productId) return;
    productsApi.getById(productId).then(p => {
      const f: Formulario = {
        name: p.name || '', description: p.description || '', category: p.category || '', brand: p.brand || '', sku: p.sku || '',
        basePrice: String(p.basePrice ?? 0), stock: String(p.stock ?? 0), tier: p.tier || 'medio', isActive: p.isActive !== false,
      };
      setForm(f); setGuardado(f);
      setVariants(p.variants ?? []);
      setSavedId(productId);
    }).catch(e => avisos.error(e, 'No encontramos el producto'))
      .finally(() => setCargando(false));
    productImagesApi.getAll(productId).then(setImages).catch(e => avisos.error(e, 'No pudimos cargar las fotos'));
  }, [productId, avisos]);

  const updateForm = <K extends keyof Formulario>(key: K, val: Formulario[K]) => { setForm(prev => ({ ...prev, [key]: val })); setErrores(e => ({ ...e, [key]: null })); };
  const cambiosSinGuardar = JSON.stringify(form) !== JSON.stringify(guardado);
  const esServicio = form.category === 'Servicios' || /^SRV-/.test(guardado.sku);

  const datos = (): Partial<Product> => ({
    name: form.name.trim(), description: form.description.trim(), category: form.category, brand: form.brand || undefined,
    sku: form.sku.trim() || undefined, basePrice: parseFloat(form.basePrice) || 0, stock: Math.max(0, parseInt(form.stock) || 0),
    tier: form.tier, isActive: form.isActive,
  });

  /** Crea o actualiza el producto con lo que hay en el formulario. Devuelve el id o null si falló. */
  const guardarInfo = async (mensaje?: string): Promise<string | null> => {
    if (saving) return null;
    const errs: Partial<Record<keyof Formulario, string | null>> = {
      name: validarTexto(form.name, { campo: 'el nombre del producto', min: 3, max: LARGO.titulo }),
      sku: form.sku.trim() && form.sku.trim() !== guardado.sku && !/^[A-Z0-9-]{2,40}$/.test(form.sku.trim()) ? 'El código lleva solo letras, números y guiones (2 a 40).' : null,
      category: form.category ? null : 'Elige la categoría.',
      basePrice: validarPrecio(form.basePrice, { permitirCero: esServicio }),
      stock: validarEntero(form.stock, { campo: 'el stock', min: 0, max: 99999 }),
      description: validarTexto(form.description, { obligatorio: false, max: 1000 }),
    };
    setErrores(errs);
    const primero = primerError(errs);
    if (primero) {
      setStep(1);
      avisos.error(null, 'Revisa los datos marcados en rojo');
      setTimeout(() => enfocar(`p-${primero}`), 50);
      return null;
    }
    setSaving(true);
    try {
      let id = savedId;
      if (id) {
        await productsApi.update(id, datos());
      } else {
        const creado = await productsApi.create(datos());
        id = creado.id;
        setSavedId(id);
        if (creado.sku) setForm(f => ({ ...f, sku: creado.sku }));
        window.history.replaceState(null, '', `/admin/products/${id}/edit`);
      }
      setGuardado({ ...form, sku: form.sku || guardado.sku });
      if (mensaje) avisos.exito(mensaje);
      return id;
    } catch (e) { avisos.error(e, 'No pudimos guardar el producto'); return null; }
    finally { setSaving(false); }
  };

  // ── Fotos ──
  const subirFotos = async (files: FileList) => {
    if (!savedId) return;
    const validas = Array.from(files).filter(f => { const err = validarArchivoImagen(f); if (err) avisos.error(null, err); return !err; });
    if (!validas.length) return;
    setSubiendo(true);
    let n = 0;
    try {
      for (const f of validas.slice(0, Math.max(0, 8 - images.length))) {
        await productImagesApi.upload(savedId, f, images.length === 0 && n === 0);
        n++;
      }
      if (n) avisos.exito(n === 1 ? 'Foto subida' : `${n} fotos subidas`);
    } catch (e) { avisos.error(e, 'No pudimos subir la foto'); }
    finally { setSubiendo(false); cargarFotos(savedId); }
  };
  const borrarFoto = async (im: ProductImage) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try { await productImagesApi.delete(savedId, im.id); avisos.exito('Foto eliminada'); }
    catch (e) { avisos.error(e, 'No pudimos eliminar la foto'); }
    cargarFotos(savedId);
  };
  const hacerPrincipal = async (im: ProductImage) => {
    try { await productImagesApi.setPrimary(savedId, im.id); avisos.exito('Foto principal cambiada'); }
    catch (e) { avisos.error(e, 'No pudimos cambiar la foto principal'); }
    cargarFotos(savedId);
  };

  // ── Variantes ──
  const reloadVariants = useCallback(async () => {
    if (!savedId) return;
    try { setVariants(await variantsApi.getAll(savedId)); }
    catch (e) { avisos.error(e, 'No pudimos cargar las variantes'); }
  }, [savedId, avisos]);

  const accion = async (fn: () => Promise<unknown>, ok: string, mal: string) => {
    try { await fn(); avisos.exito(ok); return true; }
    catch (e) { avisos.error(e, mal); return false; }
    finally { await reloadVariants(); }
  };
  const addVariantType = (name: string) => {
    if (!name.trim()) return;
    if (variants.some(v => v.name.toLowerCase() === name.trim().toLowerCase())) { avisos.error(null, `Ya hay un grupo "${name}"`); return; }
    accion(() => variantsApi.createType(savedId, name.trim(), variants.length), `Grupo "${name}" agregado`, 'No pudimos agregar el grupo').then(() => setNewTypeName(''));
  };

  const imagenPrincipal = images.find(i => i.isPrimary)?.imageUrl ?? images[0]?.imageUrl;
  const base = parseFloat(form.basePrice) || 0;
  const mods = variants.flatMap(v => v.values.filter(x => x.is_active !== false).map(val => Number(val.price_modifier) || 0));
  const minPrice = base + Math.min(0, ...mods), maxPrice = base + Math.max(0, ...mods);
  const stepComplete = (n: number) => (n === 1 ? !!savedId && !cambiosSinGuardar : n === 2 ? images.length > 0 : n === 3 ? variants.length > 0 : false);

  const irA = async (n: number) => {
    if (n > 1 && !savedId) { const id = await guardarInfo('Producto creado'); if (!id) return; }
    else if (n > 1 && step === 1 && cambiosSinGuardar) { if (!(await guardarInfo('Cambios guardados'))) return; }
    setStep(n);
  };

  const publicar = async () => {
    const id = await guardarInfo();
    if (!id) return;
    avisos.exito(form.isActive ? `"${form.name}" publicado en la tienda` : `"${form.name}" guardado como inactivo`);
    router.push('/admin/products');
  };

  if (cargando) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <nav aria-label="Ruta" className="flex items-center gap-2 mb-4 text-sm">
        <Link href="/admin/products" className="text-neutral-400 hover:text-slate-700">Productos</Link>
        <span className="text-neutral-300" aria-hidden="true">/</span>
        <span className="text-slate-900 font-medium">{productId || savedId ? 'Editar producto' : 'Nuevo producto'}</span>
      </nav>
      <h1 className="sr-only">{productId || savedId ? `Editar ${form.name}` : 'Nuevo producto'}</h1>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Pasos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-col md:w-52 flex-shrink-0 gap-2 md:gap-3" role="tablist" aria-label="Pasos">
          {STEPS.map(s => (
            <button key={s.num} role="tab" aria-selected={step === s.num} onClick={() => irA(s.num)}
              className={`min-w-0 text-left p-2 md:p-3 rounded-[16px] transition-all duration-150 bg-white ${
                step === s.num ? 'shadow-[0px_2px_6px_2px_rgba(0,0,0,0.15)] border border-slate-900' : 'shadow-[0px_2px_6px_2px_rgba(0,0,0,0.08)] hover:shadow-md'}`}>
              <div className={`w-6 h-6 mb-1 rounded-md flex items-center justify-center text-xs font-bold ${
                stepComplete(s.num) ? 'bg-blue-500 text-white' : step === s.num ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-500'}`}>
                {stepComplete(s.num) ? <Check className="h-3 w-3" aria-hidden="true" /> : s.num}
              </div>
              <p className={`text-xs md:text-sm truncate ${step === s.num ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{s.label}</p>
              <p className="hidden md:block text-[10px] text-neutral-400 mt-0.5 truncate">
                {s.num === 1 ? (form.name || '') : s.num === 2 ? `${images.length} ${images.length === 1 ? 'foto' : 'fotos'}` : s.num === 3 ? `${variants.length} grupos de variantes` : (form.isActive ? 'Activo' : 'Inactivo')}
              </p>
            </button>
          ))}
        </div>

        <div className={`flex-1 min-w-0 ${tarjeta} rounded-[20px] p-4 sm:p-5 min-h-[420px]`}>
          {/* Paso 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Campo label="Nombre *" full error={errores.name} id="p-name">
                  <input {...ac('name')} required maxLength={LARGO.titulo} value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Cuaderno A4 rayado 100 hojas" className={campo} />
                </Campo>
                <Campo label="Código" error={errores.sku} id="p-sku">
                  <input {...ac('sku')} maxLength={40} autoComplete="off" value={form.sku} onChange={e => updateForm('sku', e.target.value.toUpperCase())} disabled={esServicio && !!guardado.sku}
                    placeholder="Se genera solo si lo dejas vacío" className={`${campo} font-mono disabled:bg-slate-50 disabled:text-slate-400`} />
                  {esServicio && !!guardado.sku && <p className="text-[10px] text-neutral-400 mt-1">El código de los servicios no se cambia: la tienda lo usa para encontrarlos.</p>}
                </Campo>
                <Campo label="Categoría *" grupo error={errores.category} id="p-category">
                  <SearchSelect id="p-category" invalido={!!errores.category} describedBy={errores.category ? 'p-category-error' : undefined}
                    value={form.category} onChange={v => updateForm('category', v)} placeholder="Elegir categoría"
                    options={categories.map(c => ({ value: c.name, label: c.name }))} />
                </Campo>
                <Campo label="Marca" grupo>
                  <SearchSelect value={form.brand} onChange={v => updateForm('brand', v)} placeholder="Elegir marca"
                    options={brands.map(b => ({ value: b.name, label: b.name }))} />
                </Campo>
                <Campo label="Nivel">
                  <select value={form.tier} onChange={e => updateForm('tier', e.target.value)} className={campo} aria-label="Nivel">
                    {NIVELES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </Campo>
                <Campo label="Precio (S/) *" error={errores.basePrice} id="p-basePrice">
                  <input {...ac('basePrice')} type="number" inputMode="decimal" required min={0} max={99999} step="0.01" value={form.basePrice} onChange={e => updateForm('basePrice', e.target.value)} className={campo} />
                </Campo>
                <Campo label="Stock" error={errores.stock} id="p-stock">
                  <input {...ac('stock')} type="number" inputMode="numeric" min={0} max={99999} step={1} value={form.stock} onChange={e => updateForm('stock', e.target.value)} className={campo} />
                </Campo>
                <Campo label="Descripción" full error={errores.description} id="p-description">
                  <textarea {...ac('description')} value={form.description} onChange={e => updateForm('description', e.target.value)} maxLength={1000} rows={4}
                    placeholder="Qué es, medidas, para qué sirve…" className={campo} />
                </Campo>
                <div className="sm:col-span-2">
                  <Interruptor activo={form.isActive} onChange={v => updateForm('isActive', v)} etiqueta="Activo (se ve en la tienda)" />
                </div>
              </div>
              <div className="flex flex-wrap justify-end items-center gap-3 pt-2">
                {cambiosSinGuardar && savedId && <span className="text-xs text-orange-500 font-medium">Hay cambios sin guardar</span>}
                <button onClick={async () => { const id = await guardarInfo(savedId ? 'Cambios guardados' : 'Producto creado'); if (id) setStep(2); }}
                  disabled={saving}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
                  {saving ? 'Guardando…' : 'Guardar y continuar'}
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: fotos */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Fotos del producto</h2>
              <p className="text-xs text-neutral-400">La foto principal es la que se ve en el catálogo y en las listas. Puedes subir hasta 8.</p>
              <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Fotos">
                {images.map(im => (
                  <li key={im.id} data-foto={im.id} className={`relative rounded-xl overflow-hidden border-2 ${im.isPrimary ? 'border-blue-500' : 'border-slate-200'}`}>
                    <img width={240} height={240} src={im.imageUrl} alt={im.altText || form.name} className="w-full aspect-square object-cover bg-slate-50" />
                    {im.isPrimary && <span className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Principal</span>}
                    <div className="flex border-t border-slate-200 bg-white">
                      {!im.isPrimary && (
                        <button onClick={() => hacerPrincipal(im)} className="flex-1 py-1.5 text-[11px] text-blue-500 font-medium hover:bg-blue-50 flex items-center justify-center gap-1">
                          <Star className="h-3 w-3" aria-hidden="true" /> Principal
                        </button>
                      )}
                      <button onClick={() => borrarFoto(im)} aria-label="Eliminar foto" className="flex-1 py-1.5 text-[11px] text-red-500 font-medium hover:bg-red-50 flex items-center justify-center gap-1">
                        <Trash2 className="h-3 w-3" aria-hidden="true" /> Eliminar
                      </button>
                    </div>
                  </li>
                ))}
                {images.length < 8 && (
                  <li>
                    <label className="w-full aspect-square border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors">
                      <Upload className="h-5 w-5 text-blue-500 mb-1" aria-hidden="true" />
                      <span className="text-xs text-blue-500 font-medium">{subiendo ? 'Subiendo…' : 'Subir fotos'}</span>
                      <input type="file" accept="image/*" multiple className="sr-only" aria-label="Subir fotos" disabled={subiendo}
                        onChange={e => { if (e.target.files?.length) subirFotos(e.target.files); e.target.value = ''; }} />
                    </label>
                  </li>
                )}
              </ul>
              <Navegacion atras={() => setStep(1)} siguiente={() => setStep(3)} />
            </div>
          )}

          {/* Paso 3: variantes */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Variantes</h2>
                <p className="text-xs text-neutral-400">Colores, diseños o tamaños que el cliente puede elegir. Cada opción puede tener su recargo, su stock y su foto.</p>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-slate-500 mr-1">Agregar grupo:</span>
                {PRESETS.filter(p => !variants.some(v => v.name === p)).map(p => (
                  <button key={p} onClick={() => addVariantType(p)} className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-blue-50">{p}</button>
                ))}
                <input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addVariantType(newTypeName)}
                  placeholder="Otro…" aria-label="Nombre de otro grupo" className="px-2 py-1 border border-slate-200 rounded-lg text-xs w-28" />
                <button onClick={() => addVariantType(newTypeName)} disabled={!newTypeName.trim()} className="bg-blue-500 text-white px-2.5 py-1 rounded-lg text-xs disabled:opacity-40">Agregar</button>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                  <Package className="h-10 w-10 mx-auto mb-2 text-neutral-300" aria-hidden="true" />
                  <p className="text-sm">Este producto no tiene variantes. Es opcional.</p>
                </div>
              ) : variants.map(vt => (
                <section key={vt.id} aria-label={`Grupo ${vt.name}`} className="border border-slate-200 rounded-[16px] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-900">{vt.name} <span className="text-[10px] font-normal text-neutral-400">({vt.values.length})</span></h3>
                    <button onClick={() => { if (confirm(`¿Eliminar el grupo "${vt.name}" con todas sus opciones?`)) accion(() => variantsApi.deleteType(savedId, vt.id), 'Grupo eliminado', 'No pudimos eliminar el grupo'); }}
                      aria-label={`Eliminar grupo ${vt.name}`} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="p-3 space-y-2">
                    {vt.values.map(val => (
                      <FilaValor key={val.id} val={val} base={base}
                        onGuardar={d => accion(() => variantsApi.updateValue(savedId, val.id, d), `"${d.value}" guardado`, 'No pudimos guardar la opción')}
                        onBorrar={() => { if (confirm(`¿Eliminar "${val.value}"?`)) accion(() => variantsApi.deleteValue(savedId, val.id), 'Opción eliminada', 'No pudimos eliminar la opción'); }}
                        onFoto={f => accion(() => variantsApi.uploadValueImage(savedId, val.id, f), 'Foto de la opción subida', 'No pudimos subir la foto')} />
                    ))}
                    <AgregarValor onAdd={d => accion(() => variantsApi.createValue(savedId, vt.id, { ...d, displayOrder: vt.values.length }), `"${d.value}" agregado`, 'No pudimos agregar la opción')} />
                  </div>
                </section>
              ))}
              <Navegacion atras={() => setStep(2)} siguiente={() => setStep(4)} />
            </div>
          )}

          {/* Paso 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Revisar y publicar</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Dato label="Nombre" valor={form.name} />
                <Dato label="Código" valor={form.sku || '—'} />
                <Dato label="Categoría" valor={form.category} />
                <Dato label="Marca" valor={form.brand || '—'} />
                <Dato label="Nivel" valor={NIVELES.find(n => n.id === form.tier)?.label ?? ''} />
                <Dato label="Precio" valor={minPrice !== maxPrice ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}` : formatPrice(base)} />
                <Dato label="Stock" valor={form.stock} />
                <Dato label="Fotos" valor={String(images.length)} />
                <Dato label="Variantes" valor={variants.map(v => `${v.name} (${v.values.length})`).join(', ') || 'Ninguna'} />
              </dl>
              <Interruptor activo={form.isActive} onChange={v => updateForm('isActive', v)} etiqueta="Activo (se ve en la tienda)" />
              {images.length === 0 && <p className="text-xs text-orange-500">Aún no tiene fotos: en la tienda se verá un dibujo genérico.</p>}
              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <button onClick={() => setStep(3)} className="text-sm text-neutral-400 hover:text-slate-700">Atrás</button>
                <div className="flex gap-3">
                  <Link href="/admin/products" className="px-5 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200">Salir sin publicar</Link>
                  <button onClick={publicar} disabled={saving}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-shadow disabled:opacity-50 flex items-center gap-1.5">
                    <Save className="h-4 w-4" aria-hidden="true" /> {saving ? 'Guardando…' : form.isActive ? 'Publicar producto' : 'Guardar como inactivo'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vista previa */}
        <aside aria-label="Vista previa" className="hidden lg:block w-64 flex-shrink-0">
          <div className={`${tarjeta} rounded-[20px] p-4`}>
            <p className="text-sm font-medium text-slate-900 mb-3">Vista previa</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center relative">
                {imagenPrincipal ? <img width={64} height={64} decoding="async" src={imagenPrincipal} alt="" aria-hidden="true" className="w-full h-full object-cover" /> : <Package className="h-10 w-10 text-neutral-200" aria-hidden="true" />}
                <span className="absolute top-2 left-2"><NivelBadge tier={form.tier} /></span>
                {!form.isActive && <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-900 text-white">Inactivo</span>}
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-bold text-slate-900">{form.name || 'Nombre del producto'}</p>
                <p className="text-[10px] text-neutral-400">{form.brand || 'Marca'} · {form.category || 'Categoría'}</p>
                <p className="text-base font-bold text-slate-900">{formatPrice(base)}</p>
                {variants.map(vt => (
                  <div key={vt.id}>
                    <p className="text-[10px] text-slate-900">{vt.name}:</p>
                    <div className="flex flex-wrap gap-1">
                      {vt.values.filter(v => v.is_active !== false).slice(0, 8).map(v => v.color_hex
                        ? <span key={v.id} title={v.value} className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: v.color_hex }} />
                        : <span key={v.id} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{v.value}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Piezas ──

function Campo({ label, children, full, grupo, error, id }: { label: string; children: React.ReactNode; full?: boolean; grupo?: boolean; error?: string | null; id?: string }) {
  // Con un desplegable propio (botón + buscador) no se usa <label>, que le cambiaría el nombre al botón
  const Tag = grupo ? 'div' : 'label';
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <Tag className="block" {...(grupo ? { role: 'group', 'aria-label': label.replace(' *', '') } : {})}>
        <span className="block text-xs text-slate-900 mb-1">{label}</span>
        {children}
      </Tag>
      {id && <ErrorCampo id={id} error={error} />}
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="p-3 border border-slate-200 rounded-lg min-w-0">
      <dt className="text-[10px] text-slate-500">{label}</dt>
      <dd className="text-sm font-bold text-slate-700 break-words">{valor}</dd>
    </div>
  );
}

function Navegacion({ atras, siguiente }: { atras: () => void; siguiente: () => void }) {
  return (
    <div className="flex justify-between pt-3">
      <button onClick={atras} className="text-sm text-neutral-400 hover:text-slate-700">Atrás</button>
      <button onClick={siguiente} className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">Continuar</button>
    </div>
  );
}

type DatosValor = { value: string; colorHex: string | null; priceModifier: number; stock: number; isActive: boolean };

function FilaValor({ val, base, onGuardar, onBorrar, onFoto }: {
  val: VariantValue; base: number; onGuardar: (d: DatosValor) => Promise<boolean>; onBorrar: () => void; onFoto: (f: File) => void;
}) {
  const inicial = (): DatosValor => ({ value: val.value, colorHex: val.color_hex ?? null, priceModifier: Number(val.price_modifier) || 0, stock: Number(val.stock) || 0, isActive: val.is_active !== false });
  const [d, setD] = useState<DatosValor>(inicial);
  const [guardando, setGuardando] = useState(false);
  const sucio = JSON.stringify(d) !== JSON.stringify(inicial());
  const set = <K extends keyof DatosValor>(k: K, v: DatosValor[K]) => setD(prev => ({ ...prev, [k]: v }));

  return (
    <div data-valor={val.id} className={`flex flex-wrap items-end gap-2 p-2.5 rounded-xl ${d.isActive ? 'bg-slate-50' : 'bg-slate-50 opacity-60'}`}>
      <label className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-100 hover:bg-blue-50"
        title="Cambiar foto" style={d.colorHex && !val.image_url ? { backgroundColor: d.colorHex, borderStyle: 'solid' } : undefined}>
        {val.image_url ? <img width={64} height={64} decoding="async" src={val.image_url} alt="" aria-hidden="true" className="w-full h-full object-cover" /> : !d.colorHex && <Upload className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
        <input type="file" accept="image/*" className="sr-only" aria-label={`Foto de ${val.value}`} onChange={e => { const f = e.target.files?.[0]; if (f) onFoto(f); e.target.value = ''; }} />
      </label>
      <label className="flex-1 min-w-[120px]">
        <span className="block text-[10px] text-slate-500 mb-0.5">Opción</span>
        <input value={d.value} onChange={e => set('value', e.target.value)} aria-label="Nombre de la opción" maxLength={LARGO.corto} required className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white" />
      </label>
      <div>
        <span className="block text-[10px] text-slate-500 mb-0.5">Color</span>
        <div className="flex items-center gap-1 h-[30px]">
          <input type="checkbox" checked={!!d.colorHex} onChange={e => set('colorHex', e.target.checked ? (val.color_hex || '#3b82f6') : null)} aria-label="Tiene color" />
          {d.colorHex && <input type="color" value={d.colorHex} onChange={e => set('colorHex', e.target.value)} aria-label="Color" className="w-7 h-6 rounded border-0 cursor-pointer" />}
        </div>
      </div>
      <label className="w-20">
        <span className="block text-[10px] text-slate-500 mb-0.5">Recargo S/</span>
        <input type="number" inputMode="decimal" step="0.1" min={-9999} max={9999} value={d.priceModifier} onChange={e => set('priceModifier', Math.max(-9999, Math.min(9999, Math.round((parseFloat(e.target.value) || 0) * 100) / 100)))} aria-label="Recargo" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white" />
      </label>
      <label className="w-16">
        <span className="block text-[10px] text-slate-500 mb-0.5">Stock</span>
        <input type="number" inputMode="numeric" min={0} max={99999} step={1} value={d.stock} onChange={e => set('stock', Math.min(99999, Math.max(0, parseInt(e.target.value) || 0)))} aria-label="Stock de la opción" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white" />
      </label>
      <div className="pb-1.5"><Interruptor activo={d.isActive} onChange={v => set('isActive', v)} etiqueta="Activa" /></div>
      <span className="text-[10px] text-neutral-400 pb-2 w-16">{formatPrice(base + d.priceModifier)}</span>
      <div className="flex gap-1 pb-0.5">
        <button onClick={async () => { setGuardando(true); await onGuardar(d); setGuardando(false); }} disabled={!sucio || guardando || !d.value.trim()}
          className="bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30">{guardando ? '…' : 'Guardar'}</button>
        <button onClick={onBorrar} aria-label={`Eliminar ${val.value}`} className="text-red-300 hover:text-red-500 p-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function AgregarValor({ onAdd }: { onAdd: (d: { value: string; priceModifier: number; stock: number; colorHex: string | null }) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('100');
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="min-h-10 text-xs text-blue-500 font-bold flex items-center gap-0.5 mt-1">
      <Plus className="h-3 w-3" aria-hidden="true" /> Agregar opción
    </button>
  );
  const agregar = async () => {
    if (enviando) return;
    const err = validarTexto(val, { campo: 'el nombre de la opción', max: LARGO.corto })
      ?? (Math.abs(Number(price)) > 9999 || validarPrecio(Math.abs(Number(price) || 0), { permitirCero: true }) ? 'El recargo no es válido (máximo 2 decimales).' : null)
      ?? validarEntero(stock, { campo: 'el stock', min: 0, max: 99999 });
    setError(err);
    if (err) return;
    setEnviando(true);
    const ok = await onAdd({ value: val.trim(), priceModifier: parseFloat(price) || 0, stock: parseInt(stock) || 0, colorHex: color });
    setEnviando(false);
    if (ok) { setVal(''); setPrice('0'); setStock('100'); setColor(null); setOpen(false); }
  };
  return (
    <div className="mt-2 p-2.5 bg-blue-50 rounded-xl flex flex-wrap gap-2 items-end">
      <label className="flex-1 min-w-[120px]">
        <span className="block text-[10px] text-slate-500 mb-0.5">Nueva opción</span>
        <input value={val} onChange={e => { setVal(e.target.value); setError(null); }} onKeyDown={e => e.key === 'Enter' && agregar()} placeholder="Ej: Rojo, A4, 100 hojas…" autoFocus maxLength={LARGO.corto}
          aria-invalid={error ? true : undefined} aria-describedby={error ? 'nueva-opcion-error' : undefined}
          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white" />
      </label>
      <label className="w-20">
        <span className="block text-[10px] text-slate-500 mb-0.5">Recargo S/</span>
        <input type="number" inputMode="decimal" step="0.1" min={-9999} max={9999} value={price} onChange={e => { setPrice(e.target.value); setError(null); }} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white" />
      </label>
      <label className="w-16">
        <span className="block text-[10px] text-slate-500 mb-0.5">Stock</span>
        <input type="number" inputMode="numeric" min={0} max={99999} step={1} value={stock} onChange={e => { setStock(e.target.value); setError(null); }} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white" />
      </label>
      <div className="flex items-center gap-1 h-[30px]">
        <input type="checkbox" checked={!!color} onChange={e => setColor(e.target.checked ? '#3b82f6' : null)} aria-label="Nueva opción con color" />
        <span className="text-[10px] text-slate-500">Color</span>
        {color && <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Color de la nueva opción" className="w-7 h-6 rounded border-0 cursor-pointer" />}
      </div>
      <button type="button" onClick={agregar} disabled={enviando} className="min-h-10 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40">Agregar</button>
      <button type="button" onClick={() => setOpen(false)} className="min-h-10 text-tenue text-xs px-2 py-1.5">Cancelar</button>
      {error && <div className="w-full"><ErrorCampo id="nueva-opcion" error={error} /></div>}
    </div>
  );
}
