'use client';

import { useState, useEffect } from 'react';
import { productsApi, brandsApi } from '@/services/api';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit2, Search, Star, Package, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterStock, setFilterStock] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prods, cats, brands] = await Promise.all([
        productsApi.getAll({ limit: 500 }),
        productsApi.getCategories(),
        brandsApi.getAll(),
      ]);
      setAllProducts(prods);
      setProducts(prods);
      setCategories(cats);
      setBrandNames(brands.map((b: any) => b.name).sort());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let f = [...allProducts];
    if (search) f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));
    if (filterCat) f = f.filter(p => p.category === filterCat);
    if (filterBrand) f = f.filter(p => p.brand === filterBrand);
    if (filterTier) f = f.filter(p => p.tier === filterTier);
    if (filterStock === 'low') f = f.filter(p => p.stock > 0 && p.stock <= 10);
    if (filterStock === 'out') f = f.filter(p => p.stock === 0);
    if (filterStock === 'ok') f = f.filter(p => p.stock > 10);
    setProducts(f);
  }, [search, filterCat, filterBrand, filterTier, filterStock, allProducts]);

  const toggleActive = async (id: string) => {
    try {
      await productsApi.delete(id);
      await loadData();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Productos ({allProducts.length})</h1>
        <Link href="/admin/products/new"
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </Link>
      </div>

      {/* Filters row */}
      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nombre o SKU..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 min-w-[120px]">
          <option value="">Categoria</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 min-w-[120px]">
          <option value="">Marca</option>
          {brandNames.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 min-w-[100px]">
          <option value="">Tier</option>
          <option value="economico">Economico</option>
          <option value="medio">Medio</option>
          <option value="premium">Premium</option>
        </select>
        <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 min-w-[100px]">
          <option value="">Stock</option>
          <option value="ok">En stock</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotado</option>
        </select>
        <span className="text-[10px] text-neutral-400">{products.length} resultados</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12"></th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marca</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tier</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rating</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Accion</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.id} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    <td className="px-4 py-2">
                      <div className="w-9 h-9 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-neutral-300" />}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <p className="text-xs font-medium text-slate-900 truncate max-w-[200px]">{p.name}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-[10px] font-mono text-neutral-400">{p.sku}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-slate-600">{p.category}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-slate-600">{p.brand}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        p.tier === 'premium' ? 'bg-amber-100 text-amber-700' :
                        p.tier === 'economico' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{p.tier}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-xs font-bold text-slate-900">{formatPrice(p.basePrice)}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={`text-xs font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-orange-500' : 'text-slate-900'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-neutral-400">{p.rating?.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/admin/products/${p.id}/edit`}
                          className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors" title="Editar">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <button onClick={async () => { if (confirm(`Eliminar "${p.name}"?`)) { await productsApi.delete(p.id); loadData(); } }}
                          className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors" title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div className="text-center py-10 text-neutral-400">
              <Package className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No hay productos con esos filtros</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
