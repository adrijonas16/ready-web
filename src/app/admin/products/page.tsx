'use client';

import { useState, useEffect } from 'react';
import { productsApi } from '@/services/api';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit2, Trash2, Search, Star, Package, X, Image as ImageIcon, Layers } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

interface VariantType { id: string; name: string; displayOrder: number; values: VariantValue[] }
interface VariantValue { id: string; value: string; image_url?: string; price_modifier: number; stock: number; is_active: boolean }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedVariants, setExpandedVariants] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantType[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try { const data = await productsApi.getAll({ limit: 200 }); setProducts(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadVariants = async (productId: string) => {
    setLoadingVariants(true);
    try {
      const res = await fetch(`${API}/products/${productId}/variants`);
      const data = await res.json();
      if (data.success) setVariants(data.data);
    } catch (e) { console.error(e); }
    finally { setLoadingVariants(false); }
  };

  const toggleVariants = (productId: string) => {
    if (expandedVariants === productId) { setExpandedVariants(null); return; }
    setExpandedVariants(productId);
    loadVariants(productId);
  };

  const addVariantType = async (productId: string, name: string) => {
    await fetch(`${API}/products/${productId}/variants/types`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, displayOrder: variants.length })
    });
    loadVariants(productId);
  };

  const addVariantValue = async (productId: string, typeId: string, value: string, priceModifier: number, stock: number, colorHex?: string) => {
    const type = variants.find(v => v.id === typeId);
    await fetch(`${API}/products/${productId}/variants/types/${typeId}/values`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, priceModifier, stock, displayOrder: type?.values?.length || 0, colorHex })
    });
    loadVariants(productId);
  };

  const deleteVariantType = async (productId: string, typeId: string) => {
    await fetch(`${API}/products/${productId}/variants/types/${typeId}`, { method: 'DELETE' });
    loadVariants(productId);
  };

  const deleteVariantValue = async (productId: string, valueId: string) => {
    await fetch(`${API}/products/${productId}/variants/values/${valueId}`, { method: 'DELETE' });
    loadVariants(productId);
  };

  const uploadVariantImage = async (productId: string, valueId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`${API}/products/${productId}/variants/values/${valueId}/image`, { method: 'POST', body: fd });
    loadVariants(productId);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Productos ({products.length})</h1>
        <Link href="/admin/products/new"
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto, categoria o marca..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => (
            <div key={product.id} className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="h-5 w-5 text-neutral-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      product.tier === 'premium' ? 'bg-amber-100 text-amber-700' : product.tier === 'economico' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{product.tier}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span>{product.category}</span>
                    <span>{product.brand}</span>
                    <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />{product.rating?.toFixed(1)}</span>
                    <span>Stock: {product.stock}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-900">{formatPrice(product.basePrice)}</p>
                  <p className="text-[10px] text-neutral-400">{product.sku}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleVariants(product.id)}
                    className={`p-2 rounded-xl transition-colors ${expandedVariants === product.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    <Layers className="h-4 w-4" />
                  </button>
                  <Link href={`/admin/products/${product.id}/edit`} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {expandedVariants === product.id && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-blue-500" /> Variantes
                    </h3>
                    <NewVariantTypeButton onAdd={(name) => addVariantType(product.id, name)} />
                  </div>
                  {loadingVariants ? (
                    <div className="text-center py-4"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                  ) : variants.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-4">Sin variantes. Agrega: Color, Tamano, Cantidad, Personaje, Presentacion...</p>
                  ) : (
                    <div className="space-y-4">
                      {variants.map(vt => (
                        <div key={vt.id} className="bg-white rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-900">{vt.name}</span>
                            <button onClick={() => deleteVariantType(product.id, vt.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="h-3 w-3" /></button>
                          </div>
                          <div className="space-y-1.5">
                            {vt.values.map((val: any) => (
                              <div key={val.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                {/* Color swatch or image */}
                                {val.color_hex ? (
                                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: val.color_hex }} />
                                ) : val.image_url ? (
                                  <img src={val.image_url} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                                ) : (
                                  <label className="w-8 h-8 rounded-md bg-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-300 flex-shrink-0">
                                    <ImageIcon className="h-3 w-3 text-slate-400" />
                                    <input type="file" accept="image/*" className="hidden"
                                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(product.id, val.id, f); }} />
                                  </label>
                                )}
                                <span className="text-xs font-medium text-slate-700 flex-1">{val.value}</span>
                                {val.color_hex && <span className="text-[10px] text-neutral-400 font-mono">{val.color_hex}</span>}
                                <span className={`text-[10px] ${val.price_modifier > 0 ? 'text-red-500' : val.price_modifier < 0 ? 'text-green-500' : 'text-neutral-400'}`}>
                                  {val.price_modifier > 0 ? `+${formatPrice(val.price_modifier)}` : val.price_modifier < 0 ? formatPrice(val.price_modifier) : 'base'}
                                </span>
                                <span className="text-[10px] text-neutral-400">stk:{val.stock}</span>
                                {/* Upload image for this value */}
                                <label className="p-1 text-blue-400 hover:text-blue-600 cursor-pointer" title="Subir imagen">
                                  <ImageIcon className="h-3 w-3" />
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(product.id, val.id, f); }} />
                                </label>
                                <button onClick={() => deleteVariantValue(product.id, val.id)} className="text-red-400 hover:text-red-600 p-0.5"><X className="h-3 w-3" /></button>
                              </div>
                            ))}
                          </div>
                          <NewVariantValueButton onAdd={(value, price, stock, colorHex) => addVariantValue(product.id, vt.id, value, price, stock, colorHex)} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Live Preview */}
                  {variants.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Vista previa (como lo ve el cliente)</h4>
                      <div className="bg-sky-50 rounded-xl p-4">
                        <VariantPreview product={product} variants={variants} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ProductFormModal product={editing} onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); loadProducts(); }} />
      )}
    </div>
  );
}

function NewVariantTypeButton({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const presets = ['Color', 'Tamano', 'Cantidad', 'Material', 'Personaje', 'Presentacion', 'Tipo'];

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-blue-500 font-bold flex items-center gap-1"><Plus className="h-3 w-3" /> Agregar variante</button>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.map(p => (
        <button key={p} onClick={() => { onAdd(p); setOpen(false); }}
          className="px-2 py-1 text-[10px] bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 font-medium">{p}</button>
      ))}
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Otro..."
        className="px-2 py-1 border border-slate-200 rounded-lg text-xs w-20" />
      <button onClick={() => { if (name) { onAdd(name); setName(''); setOpen(false); } }} className="text-xs text-blue-500 font-bold">OK</button>
      <button onClick={() => setOpen(false)} className="text-xs text-neutral-400">X</button>
    </div>
  );
}

function NewVariantValueButton({ onAdd }: { onAdd: (value: string, price: number, stock: number, colorHex?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('100');
  const [colorHex, setColorHex] = useState('');
  const [showColor, setShowColor] = useState(false);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="mt-2 text-[10px] text-blue-500 font-bold flex items-center gap-0.5"><Plus className="h-2.5 w-2.5" /> Agregar valor</button>
  );

  return (
    <div className="mt-2 p-2.5 bg-blue-50 rounded-xl space-y-2">
      <div className="flex items-center gap-2">
        <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder="Ej: Rojo, Grande, 12 uds..."
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="+Precio"
          className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
        <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock"
          className="w-14 px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setShowColor(!showColor)}
          className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 ${showColor ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
          {colorHex ? <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorHex }} /> : null}
          Color
        </button>
        {showColor && (
          <input type="color" value={colorHex || '#3b82f6'} onChange={e => setColorHex(e.target.value)}
            className="w-8 h-8 rounded-lg border-0 cursor-pointer" />
        )}
        {colorHex && showColor && <span className="text-[10px] font-mono text-neutral-400">{colorHex}</span>}
        <div className="flex-1" />
        <button onClick={() => {
          if (value) {
            onAdd(value, parseFloat(price), parseInt(stock), colorHex || undefined);
            setValue(''); setPrice('0'); setStock('100'); setColorHex(''); setShowColor(false); setOpen(false);
          }
        }} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Agregar</button>
        <button onClick={() => setOpen(false)} className="text-neutral-400 text-xs px-1">X</button>
      </div>
    </div>
  );
}

function VariantPreview({ product, variants }: { product: Product; variants: VariantType[] }) {
  const [selected, setSelected] = useState<Record<string, any>>(() => {
    const d: Record<string, any> = {};
    variants.forEach(vt => { if (vt.values.length > 0) d[vt.id] = vt.values[0]; });
    return d;
  });

  const pricemod = Object.values(selected).reduce((s: number, v: any) => s + (v?.price_modifier || 0), 0);

  return (
    <div className="flex gap-4">
      {/* Mini product card */}
      <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
        {Object.values(selected).find((v: any) => v?.image_url) ? (
          <img src={(Object.values(selected).find((v: any) => v?.image_url) as any).image_url} alt="" className="w-full h-full object-cover rounded-xl" />
        ) : product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <Package className="h-6 w-6 text-neutral-300" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900">{product.name}</p>
        <p className="text-xs text-neutral-400">{product.brand}</p>
        <p className="text-base font-bold text-slate-900 mt-1">{formatPrice(product.basePrice + pricemod)}</p>
        {/* Variant selectors */}
        {variants.map(vt => (
          <div key={vt.id} className="mt-2">
            <p className="text-[10px] text-neutral-400 mb-1">{vt.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {vt.values.map((val: any) => (
                val.color_hex ? (
                  <button key={val.id} onClick={() => setSelected(p => ({...p, [vt.id]: val}))}
                    className={`w-6 h-6 rounded-full transition-all ${selected[vt.id]?.id === val.id ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : ''}`}
                    style={{ backgroundColor: val.color_hex }} title={val.value} />
                ) : (
                  <button key={val.id} onClick={() => setSelected(p => ({...p, [vt.id]: val}))}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                      selected[vt.id]?.id === val.id ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}>
                    {val.value}
                  </button>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductFormModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product?.name || '', description: product?.description || '', category: product?.category || '',
    brand: product?.brand || '', sku: product?.sku || '', basePrice: product?.basePrice?.toString() || '0',
    stock: product?.stock?.toString() || '100', tier: product?.tier || 'medio', rating: product?.rating?.toString() || '4.0',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { name: form.name, description: form.description, category: form.category, brand: form.brand,
        sku: form.sku || `SKU-${Date.now()}`, basePrice: parseFloat(form.basePrice), stock: parseInt(form.stock) };
      if (product) { await productsApi.update(product.id, data); }
      else { await productsApi.create(data); }
      onSaved();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-[20px] max-w-lg w-full max-h-[85vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{product ? 'Editar' : 'Nuevo'} Producto</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-neutral-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-neutral-400 mb-1">Nombre</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div><label className="block text-xs text-neutral-400 mb-1">Categoria</label>
              <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
            <div><label className="block text-xs text-neutral-400 mb-1">Marca</label>
              <input type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
            <div><label className="block text-xs text-neutral-400 mb-1">SKU</label>
              <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
            <div><label className="block text-xs text-neutral-400 mb-1">Precio base</label>
              <input type="number" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
            <div><label className="block text-xs text-neutral-400 mb-1">Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
            <div><label className="block text-xs text-neutral-400 mb-1">Tier</label>
              <select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm">
                <option value="economico">Economico</option><option value="medio">Medio</option><option value="premium">Premium</option>
              </select></div>
            <div className="col-span-2"><label className="block text-xs text-neutral-400 mb-1">Descripcion</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100">
          <button onClick={handleSave} disabled={saving || !form.name}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            {saving ? 'Guardando...' : product ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
