'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, brandsApi, categoriesApi } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Check, Plus, X, Star, Package, Trash2, Image as ImageIcon, Upload, ChevronDown, ShoppingCart } from 'lucide-react';
import SearchSelect from '@/components/SearchSelect';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

interface VariantType { id: string; name: string; values: VariantValue[] }
interface VariantValue { id: string; value: string; image_url?: string; price_modifier: number; stock: number; color_hex?: string; is_active: boolean }
interface Spec { tipo: string; descripcion: string }
interface FAQ { pregunta: string; respuesta: string }

const STEPS = [
  { num: 1, label: 'Informacion Producto', sub: '' },
  { num: 2, label: 'Variantes', sub: '' },
  { num: 3, label: 'Stock y Oferta', sub: '' },
  { num: 4, label: 'Preguntas Frecuentes', sub: '' },
];

export default function ProductWizard({ productId }: { productId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(productId || '');

  // Step 1: Info
  const [form, setForm] = useState({
    name: '', description: '', shortDesc: '', category: '', brand: '', sku: '',
    basePrice: '0', stock: '100', tier: 'medio', rating: '4.0', saleUnit: 'unidad',
  });
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [specs, setSpecs] = useState<Spec[]>([]);

  // Selects data
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Step 2: Variants
  const [variants, setVariants] = useState<VariantType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [showTypePresets, setShowTypePresets] = useState(false);

  // Step 4: FAQ
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  // Load categories and brands
  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
    brandsApi.getAll().then(setBrands).catch(() => {});
  }, []);

  // Load existing product
  useEffect(() => {
    if (productId) {
      fetch(`${API}/products/${productId}`).then(r => r.json()).then(d => {
        if (d.success) {
          const p = d.data;
          setForm({
            name: p.name || '', description: p.description || '', shortDesc: '',
            category: p.category || '', brand: p.brand || '', sku: p.sku || '',
            basePrice: String(p.basePrice || 0), stock: String(p.stock || 0),
            tier: p.tier || 'medio', rating: String(p.rating || 4), saleUnit: p.saleUnit || 'unidad',
          });
          if (p.imageUrl) setImages([p.imageUrl]);
          if (p.images?.length) setImages(p.images.map((i: any) => i.image_url));
          if (p.variants?.length) setVariants(p.variants);
          setSavedId(productId);
        }
      });
    }
  }, [productId]);

  const updateForm = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  // Save step 1
  const saveInfo = async () => {
    setSaving(true);
    try {
      const data = {
        name: form.name, description: form.description, category: form.category,
        brand: form.brand, sku: form.sku || `SKU-${Date.now()}`,
        basePrice: parseFloat(form.basePrice), stock: parseInt(form.stock),
      };
      if (savedId) {
        await productsApi.update(savedId, data);
      } else {
        const id = await productsApi.create(data);
        setSavedId(typeof id === 'string' ? id : (id as any));
      }
      setStep(2);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // Variant operations
  const addVariantType = async (name: string) => {
    if (!savedId) return;
    await fetch(`${API}/products/${savedId}/variants/types`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, displayOrder: variants.length })
    });
    await reloadVariants();
    setShowTypePresets(false);
    setNewTypeName('');
  };

  const addVariantValue = async (typeId: string, value: string, priceModifier: number, stock: number, colorHex?: string) => {
    if (!savedId) return;
    const type = variants.find(v => v.id === typeId);
    await fetch(`${API}/products/${savedId}/variants/types/${typeId}/values`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, priceModifier, stock, displayOrder: type?.values?.length || 0, colorHex })
    });
    await reloadVariants();
  };

  const deleteVariantType = async (typeId: string) => {
    await fetch(`${API}/products/${savedId}/variants/types/${typeId}`, { method: 'DELETE' });
    await reloadVariants();
  };

  const deleteVariantValue = async (valueId: string) => {
    await fetch(`${API}/products/${savedId}/variants/values/${valueId}`, { method: 'DELETE' });
    await reloadVariants();
  };

  const uploadVariantImage = async (valueId: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    await fetch(`${API}/products/${savedId}/variants/values/${valueId}/image`, { method: 'POST', body: fd });
    await reloadVariants();
  };

  const reloadVariants = async () => {
    const res = await fetch(`${API}/products/${savedId}/variants`);
    const d = await res.json();
    if (d.success) setVariants(d.data);
  };

  const stepComplete = (n: number) => {
    if (n === 1) return !!form.name && !!form.category;
    if (n === 2) return variants.length > 0;
    return false;
  };

  // Compute price range from variants
  const priceRange = () => {
    const base = parseFloat(form.basePrice) || 0;
    if (variants.length === 0) return { min: base, max: base };
    const mods = variants.flatMap(v => v.values.map(val => val.price_modifier));
    return { min: base + Math.min(0, ...mods), max: base + Math.max(0, ...mods) };
  };

  const totalVariantStock = variants.reduce((s, vt) => s + vt.values.reduce((s2, v) => s2 + v.stock, 0), 0);
  const { min: minPrice, max: maxPrice } = priceRange();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/admin/products')} className="text-neutral-400 hover:text-slate-700 text-sm">Productos</button>
        <span className="text-neutral-300">/</span>
        <span className="text-slate-900 text-sm font-medium">{productId ? 'Editar' : 'Crear'} Producto</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left: Steps sidebar */}
        <div className="flex flex-row md:flex-col md:w-52 flex-shrink-0 gap-2 md:gap-0 md:space-y-3 overflow-x-auto pb-2 md:pb-0">
          {STEPS.map(s => (
            <button key={s.num} onClick={() => (s.num === 1 || savedId) && setStep(s.num)}
              className={`flex-shrink-0 md:w-full text-left p-2 md:p-3 rounded-[16px] transition-all duration-150 ${
                step === s.num
                  ? 'bg-white shadow-[0px_2px_6px_2px_rgba(0,0,0,0.15)] border border-slate-900'
                  : 'bg-white shadow-[0px_2px_6px_2px_rgba(0,0,0,0.08)] hover:shadow-md'
              }`}>
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                  stepComplete(s.num) ? 'bg-blue-500 text-white' :
                  step === s.num ? 'bg-slate-900 text-white border border-slate-900' :
                  'border border-slate-200 text-slate-500'
                }`}>
                  {stepComplete(s.num) ? <Check className="h-3 w-3" /> : s.num}
                </div>
              </div>
              <p className={`text-xs md:text-sm whitespace-nowrap ${step === s.num ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{s.label}</p>
              <p className="hidden md:block text-[10px] text-neutral-400 mt-0.5">
                {s.num === 1 && form.name ? `${form.name}` : ''}
                {s.num === 2 ? `${variants.length} grupos de variantes` : ''}
                {s.num === 3 ? `Stock: ${parseInt(form.stock) + totalVariantStock}` : ''}
                {s.num === 4 ? `${faqs.length} preguntas` : ''}
              </p>
            </button>
          ))}
        </div>

        {/* Center: Form */}
        <div className="flex-1 bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 min-h-[500px]">
          {/* Step 1: Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-900 mb-1">Codigo Producto</label>
                  <input type="text" value={form.sku || `SKU-${Date.now()}`} disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs text-slate-900 mb-1">Categoria *</label>
                  <SearchSelect
                    value={form.category}
                    onChange={v => updateForm('category', v)}
                    placeholder="Seleccionar categoria"
                    options={categories.map((c: any) => ({ value: c.name, label: c.name }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-900 mb-1">Marca</label>
                  <SearchSelect
                    value={form.brand}
                    onChange={v => updateForm('brand', v)}
                    placeholder="Seleccionar marca"
                    options={brands.map((b: any) => ({ value: b.name, label: b.name }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-900 mb-1">Tier</label>
                  <select value={form.tier} onChange={e => updateForm('tier', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="economico">Economico</option>
                    <option value="medio">Estandar</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              <Field label="Nombre" value={form.name} onChange={v => updateForm('name', v)} placeholder="Cuaderno A4 Rayado 100 hojas" full />

              {/* Images */}
              <div>
                <label className="block text-xs text-slate-900 mb-1">Imagenes del producto (hasta 5)</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setImages(images.filter((_, j) => j !== i))}
                        className="absolute inset-0 bg-red-500/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[8px] text-center py-0.5">Principal</span>}
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="w-16 h-16 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors">
                      <Upload className="h-4 w-4 text-blue-500 mb-0.5" />
                      <span className="text-[8px] text-blue-500 font-medium">Subir</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={async e => {
                        const files = e.target.files;
                        if (!files) return;

                        // Auto-save product first if new
                        let pid = savedId;
                        if (!pid && form.name && form.category) {
                          setSaving(true);
                          try {
                            const data = { name: form.name, description: form.description, category: form.category, brand: form.brand, sku: form.sku || `SKU-${Date.now()}`, basePrice: parseFloat(form.basePrice), stock: parseInt(form.stock) };
                            const id = await productsApi.create(data);
                            pid = typeof id === 'string' ? id : String(id);
                            setSavedId(pid);
                          } catch (err) { console.error(err); setSaving(false); return; }
                          setSaving(false);
                        }

                        if (!pid) { alert('Primero escribe nombre y categoria del producto'); return; }

                        for (let i = 0; i < Math.min(files.length, 5 - images.length); i++) {
                          const fd = new FormData();
                          fd.append('file', files[i]);
                          fd.append('isPrimary', String(images.length === 0 && i === 0));
                          try {
                            const res = await fetch(`${API}/products/${pid}/images`, { method: 'POST', body: fd });
                            const d = await res.json();
                            if (d.success) setImages(prev => [...prev, d.data.imageUrl]);
                          } catch (err) { console.error('Upload error:', err); }
                        }
                      }} />
                    </label>
                  )}
                </div>
                {images.length === 0 && <p className="text-[10px] text-neutral-400 mt-1">Sube al menos 1 imagen. La primera sera la principal.</p>}
              </div>

              <Field label="Detalle corto (128 chars)" value={form.shortDesc} onChange={v => updateForm('shortDesc', v)} placeholder="Descripcion breve..." full />
              <FieldArea label="Descripcion completa (512 chars)" value={form.description} onChange={v => updateForm('description', v)} placeholder="Descripcion detallada..." />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Precio Base" value={form.basePrice} onChange={v => updateForm('basePrice', v)} type="number" />
                <Field label="Stock" value={form.stock} onChange={v => updateForm('stock', v)} type="number" />
                <div>
                  <label className="block text-xs text-slate-900 mb-1">Unidad de venta</label>
                  <select value={form.saleUnit} onChange={e => updateForm('saleUnit', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="unidad">Unidad</option><option value="docena">Docena</option>
                    <option value="media_docena">Media Docena</option><option value="caja">Caja</option>
                    <option value="ciento">Ciento</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs text-slate-900 mb-1">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((t, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-blue-500 px-2 py-1 rounded-lg flex items-center gap-1">
                      {t} <button onClick={() => setTags(tags.filter((_, j) => j !== i))}><X className="h-2.5 w-2.5 text-red-400" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && newTag) { setTags([...tags, newTag]); setNewTag(''); } }}
                    placeholder="Agregar tag..." className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>

              {/* Specs table */}
              <div>
                <label className="block text-xs text-slate-900 mb-1">Especificaciones</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-900">Tipo</div>
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-900">Descripcion</div>
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-900">Accion</div>
                  </div>
                  {specs.map((s, i) => (
                    <div key={i} className="grid grid-cols-3 border-b border-slate-100">
                      <input className="px-3 py-1.5 text-xs border-r border-slate-100" value={s.tipo}
                        onChange={e => { const n = [...specs]; n[i].tipo = e.target.value; setSpecs(n); }} />
                      <input className="px-3 py-1.5 text-xs border-r border-slate-100" value={s.descripcion}
                        onChange={e => { const n = [...specs]; n[i].descripcion = e.target.value; setSpecs(n); }} />
                      <div className="px-3 py-1.5 flex gap-2">
                        <button onClick={() => setSpecs(specs.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-red-400" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSpecs([...specs, { tipo: '', descripcion: '' }])}
                  className="mt-2 text-xs text-blue-500 font-medium flex items-center gap-1"><Plus className="h-3 w-3" /> Agregar especificacion</button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={saveInfo} disabled={saving || !form.name || !form.category}
                  className="bg-blue-500 text-white px-8 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
                  {saving ? 'Guardando...' : 'Guardar y Continuar'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Variants */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Variantes del producto</h2>
                <div className="relative">
                  <button onClick={() => setShowTypePresets(!showTypePresets)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
                    <Plus className="h-3 w-3" /> Nueva Variante
                  </button>
                  {showTypePresets && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-10 w-48 animate-slide-down">
                      {['Color', 'Tamano', 'Cantidad', 'Material', 'Personaje', 'Presentacion', 'Tipo'].map(p => (
                        <button key={p} onClick={() => addVariantType(p)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-blue-50 text-slate-700">{p}</button>
                      ))}
                      <div className="flex gap-1 mt-1 pt-1 border-t border-slate-100">
                        <input type="text" value={newTypeName} onChange={e => setNewTypeName(e.target.value)}
                          placeholder="Otro..." className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs" />
                        <button onClick={() => { if (newTypeName) addVariantType(newTypeName); }}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs">OK</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <Package className="h-10 w-10 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm">Agrega variantes como Color, Tamano, Cantidad...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {variants.map(vt => (
                    <div key={vt.id} className="border border-slate-200 rounded-[16px] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                        <span className="text-sm font-bold text-slate-900">{vt.name}</span>
                        <button onClick={() => deleteVariantType(vt.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="p-3 space-y-2">
                        {vt.values.map((val: any) => (
                          <div key={val.id} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                            {/* Image/Color preview */}
                            {val.color_hex ? (
                              <div className="w-10 h-10 rounded-full border-2 border-white shadow flex-shrink-0 relative group" style={{ backgroundColor: val.color_hex }}>
                                <label className="absolute inset-0 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 bg-black/30 flex items-center justify-center transition-opacity">
                                  <Upload className="h-3 w-3 text-white" />
                                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(val.id, f); }} />
                                </label>
                              </div>
                            ) : val.image_url ? (
                              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative group">
                                <img src={val.image_url} alt="" className="w-full h-full object-cover" />
                                <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-black/30 flex items-center justify-center transition-opacity">
                                  <Upload className="h-3 w-3 text-white" />
                                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(val.id, f); }} />
                                </label>
                              </div>
                            ) : (
                              <label className="w-10 h-10 rounded-xl bg-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors flex-shrink-0 border-2 border-dashed border-slate-300">
                                <Upload className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[7px] text-slate-400 mt-0.5">Foto</span>
                                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(val.id, f); }} />
                              </label>
                            )}

                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-slate-700 block">{val.value}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {val.color_hex && <span className="text-[9px] font-mono text-neutral-400">{val.color_hex}</span>}
                                <span className={`text-[10px] ${val.price_modifier > 0 ? 'text-red-500' : val.price_modifier < 0 ? 'text-green-500' : 'text-neutral-400'}`}>
                                  {val.price_modifier > 0 ? `+${formatPrice(val.price_modifier)}` : val.price_modifier < 0 ? formatPrice(val.price_modifier) : 'precio base'}
                                </span>
                                <span className="text-[10px] text-neutral-400">stock: {val.stock}</span>
                              </div>
                            </div>

                            <button onClick={() => deleteVariantValue(val.id)} className="text-red-300 hover:text-red-500 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        ))}
                        <AddValueInline onAdd={(v, p, s, c) => addVariantValue(vt.id, v, p, s, c)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(1)} className="text-sm text-neutral-400 hover:text-slate-700">Atras</button>
                <button onClick={() => setStep(3)} className="bg-blue-500 text-white px-8 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Stock & Offers */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Stock y Oferta</h2>
              <div className="grid grid-cols-2 gap-3">
                <InfoBox label="Precio maximo variante" value={formatPrice(maxPrice)} />
                <InfoBox label="Precio minimo variante" value={formatPrice(minPrice)} />
                <InfoBox label="Stock total" value={String(parseInt(form.stock) + totalVariantStock)} />
                <InfoBox label="Combinaciones con stock" value={String(variants.reduce((s, vt) => s + vt.values.filter(v => v.stock > 0).length, 0))} />
              </div>

              {variants.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-2">Resumen de variantes</p>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200">
                      <div className="px-3 py-1.5 text-xs font-medium">Variante</div>
                      <div className="px-3 py-1.5 text-xs font-medium">Valor</div>
                      <div className="px-3 py-1.5 text-xs font-medium">Precio</div>
                      <div className="px-3 py-1.5 text-xs font-medium">Stock</div>
                    </div>
                    {variants.flatMap(vt => vt.values.map(v => (
                      <div key={v.id} className="grid grid-cols-4 border-b border-slate-100">
                        <div className="px-3 py-1.5 text-xs text-neutral-400">{vt.name}</div>
                        <div className="px-3 py-1.5 text-xs">{v.value}</div>
                        <div className="px-3 py-1.5 text-xs">{formatPrice(parseFloat(form.basePrice) + v.price_modifier)}</div>
                        <div className="px-3 py-1.5 text-xs">{v.stock}</div>
                      </div>
                    )))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(2)} className="text-sm text-neutral-400">Atras</button>
                <button onClick={() => setStep(4)} className="bg-blue-500 text-white px-8 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: FAQ */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Preguntas Frecuentes</h2>
              {faqs.map((f, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Pregunta {i + 1}</span>
                    <button onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-red-400" /></button>
                  </div>
                  <input type="text" value={f.pregunta} onChange={e => { const n = [...faqs]; n[i].pregunta = e.target.value; setFaqs(n); }}
                    placeholder="Pregunta..." className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  <textarea value={f.respuesta} onChange={e => { const n = [...faqs]; n[i].respuesta = e.target.value; setFaqs(n); }}
                    placeholder="Respuesta..." rows={2} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              ))}
              <button onClick={() => setFaqs([...faqs, { pregunta: '', respuesta: '' }])}
                className="text-xs text-blue-500 font-medium flex items-center gap-1"><Plus className="h-3 w-3" /> Agregar pregunta</button>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(3)} className="text-sm text-neutral-400">Atras</button>
                <div className="flex gap-3">
                  <button onClick={() => router.push('/admin/products')}
                    className="px-8 py-2 bg-slate-100 rounded-lg text-sm font-medium text-red-500 hover:bg-slate-200">Cancelar</button>
                  <button onClick={() => router.push('/admin/products')}
                    className="bg-blue-500 text-white px-8 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
                    Publicar Producto
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4">
            <p className="text-sm font-medium text-slate-900 mb-1">Vista Previa</p>
            <p className="text-[10px] text-neutral-400 mb-3">Los cambios se reflejan aqui</p>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {/* Product preview card */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center relative">
                  {images[0] ? (
                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-10 w-10 text-neutral-200" />
                  )}
                  {form.tier && (
                    <span className={`absolute top-2 left-2 text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                      form.tier === 'premium' ? 'bg-amber-100 text-amber-700' : form.tier === 'economico' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{form.tier}</span>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-1 px-2 pt-2">
                    {images.slice(0, 4).map((img, i) => (
                      <div key={i} className={`w-10 h-10 rounded-lg overflow-hidden border ${i === 0 ? 'border-blue-500' : 'border-slate-200'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {images.length > 4 && (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[8px] text-blue-500 font-medium border border-slate-200">
                        +{images.length - 4}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{form.name || 'Nombre del producto'}</p>
                    <p className="text-[10px] text-neutral-400">{form.brand || 'Marca'} - {form.category || 'Categoria'}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{formatPrice(parseFloat(form.basePrice) || 0)}</span>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t, i) => (
                        <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Variant preview */}
                  {variants.map(vt => (
                    <div key={vt.id}>
                      <p className="text-[10px] text-slate-900 mb-1">{vt.name}:</p>
                      <div className="flex flex-wrap gap-1">
                        {vt.values.slice(0, 6).map((v: any, i: number) => (
                          v.color_hex ? (
                            <div key={v.id} className={`w-5 h-5 rounded-full ${i === 0 ? 'ring-1 ring-blue-500 ring-offset-1' : ''}`}
                              style={{ backgroundColor: v.color_hex }} />
                          ) : (
                            <span key={v.id} className={`text-[9px] px-1.5 py-0.5 rounded ${i === 0 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              {v.value}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  ))}

                  <button className="w-full bg-blue-500 text-white py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                    <ShoppingCart className="h-3 w-3" /> Comprar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory summary */}
          <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 space-y-2">
            <p className="text-sm font-medium text-slate-900">Inventario</p>
            <InfoBox label="Precio max combinacion" value={formatPrice(maxPrice)} small />
            <InfoBox label="Precio min combinacion" value={formatPrice(minPrice)} small />
            <InfoBox label="Stock total" value={String(parseInt(form.stock || '0') + totalVariantStock)} small />
            <InfoBox label="Variantes con stock" value={String(variants.reduce((s, vt) => s + vt.values.filter(v => v.stock > 0).length, 0))} small />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──

function Field({ label, value, onChange, placeholder, type, full }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs text-slate-900 mb-1">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
    </div>
  );
}

function FieldArea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-900 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
    </div>
  );
}

function InfoBox({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className={`${small ? 'p-2' : 'p-3'} border border-slate-200 rounded-lg`}>
      <p className={`${small ? 'text-[10px]' : 'text-xs'} text-slate-900 mb-0.5`}>{label}</p>
      <p className={`${small ? 'text-xs' : 'text-sm'} font-bold text-slate-700`}>{value}</p>
    </div>
  );
}

function AddValueInline({ onAdd }: { onAdd: (v: string, p: number, s: number, c?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('100');
  const [color, setColor] = useState('');
  const [showColor, setShowColor] = useState(false);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-[10px] text-blue-500 font-bold flex items-center gap-0.5 mt-1">
      <Plus className="h-2.5 w-2.5" /> Agregar valor
    </button>
  );

  return (
    <div className="mt-2 p-2.5 bg-blue-50 rounded-xl space-y-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-[10px] text-slate-500 mb-0.5">Valor</label>
          <input type="text" value={val} onChange={e => setVal(e.target.value)} placeholder="Ej: 100 hojas, Rojo, A4..."
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </div>
        <div className="w-20">
          <label className="block text-[10px] text-slate-500 mb-0.5">+/- Precio</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0"
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </div>
        <div className="w-16">
          <label className="block text-[10px] text-slate-500 mb-0.5">Stock</label>
          <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="100"
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setShowColor(!showColor)}
          className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 ${showColor ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
          {color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />} Color
        </button>
        {showColor && <input type="color" value={color || '#3b82f6'} onChange={e => setColor(e.target.value)} className="w-8 h-6 rounded border-0 cursor-pointer" />}
        <div className="flex-1" />
        <button onClick={() => { if (val) { onAdd(val, parseFloat(price), parseInt(stock), color || undefined); setVal(''); setPrice('0'); setStock('100'); setColor(''); setOpen(false); } }}
          className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Agregar</button>
        <button onClick={() => setOpen(false)} className="text-neutral-400 text-xs">X</button>
      </div>
    </div>
  );
}
