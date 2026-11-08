'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { productsApi, brandsApi, categoriesApi } from '@/services/api';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit2, Search, Package, EyeOff, Eye } from 'lucide-react';
import Link from 'next/link';
import { Cargando, NIVELES, NivelBadge, botonPrimario, tarjeta, th, useAvisos } from '../_ui';

const filtro = 'px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 min-w-[110px]';

export default function AdminProductsPage() {
  const avisos = useAvisos();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [filterEstado, setFilterEstado] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  const [cambiando, setCambiando] = useState<string | null>(null);

  const loadData = useCallback(() =>
    Promise.all([
      productsApi.getAll({ includeInactive: true }),
      categoriesApi.getAll(),
      brandsApi.getAll(),
    ]).then(([prods, cats, brands]) => {
      setAllProducts(prods);
      setCategories(cats.map(c => c.name));
      setBrandNames(brands.map(b => b.name).sort((a, b) => a.localeCompare(b, 'es')));
    }).catch(e => avisos.error(e, 'No pudimos cargar los productos'))
      .finally(() => setLoading(false)), [avisos]);

  useEffect(() => { loadData(); }, [loadData]);

  const sinTilde = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const products = useMemo(() => {
    let f = [...allProducts];
    if (filterEstado === 'activos') f = f.filter(p => p.isActive !== false);
    if (filterEstado === 'inactivos') f = f.filter(p => p.isActive === false);
    if (search) { const q = sinTilde(search); f = f.filter(p => sinTilde(p.name).includes(q) || sinTilde(p.sku ?? '').includes(q)); }
    if (filterCat) f = f.filter(p => p.category === filterCat);
    if (filterBrand) f = f.filter(p => p.brand === filterBrand);
    if (filterTier) f = f.filter(p => p.tier === filterTier);
    if (filterStock === 'low') f = f.filter(p => p.stock > 0 && p.stock <= 10);
    if (filterStock === 'out') f = f.filter(p => p.stock === 0);
    if (filterStock === 'ok') f = f.filter(p => p.stock > 10);
    return f;
  }, [search, filterCat, filterBrand, filterTier, filterStock, filterEstado, allProducts]);

  const activos = allProducts.filter(p => p.isActive !== false).length;

  const cambiarEstado = async (p: Product) => {
    const activar = p.isActive === false;
    if (!activar && !confirm(`¿Desactivar "${p.name}"? Dejará de verse en la tienda, pero podrás reactivarlo.`)) return;
    setCambiando(p.id);
    try {
      await productsApi.update(p.id, { isActive: activar });
      setAllProducts(prev => prev.map(x => x.id === p.id ? { ...x, isActive: activar } : x));
      avisos.exito(activar ? `"${p.name}" está activo otra vez` : `"${p.name}" quedó inactivo`);
    } catch (e) { avisos.error(e, 'No pudimos cambiar el estado del producto'); }
    finally { setCambiando(null); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900">Productos <span className="text-sm font-normal text-neutral-400">({activos} activos de {allProducts.length})</span></h1>
        <Link href="/admin/products/new" className={botonPrimario}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo producto
        </Link>
      </div>

      <div className={`${tarjeta} p-3 mb-4 flex flex-wrap items-center gap-2`}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar producto"
            placeholder="Buscar nombre o código…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value as typeof filterEstado)} className={filtro} aria-label="Estado">
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="todos">Todos</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={filtro} aria-label="Categoría">
          <option value="">Categoría</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className={filtro} aria-label="Marca">
          <option value="">Marca</option>
          {brandNames.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className={filtro} aria-label="Nivel">
          <option value="">Nivel</option>
          {NIVELES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className={filtro} aria-label="Stock">
          <option value="">Stock</option>
          <option value="ok">En stock</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotado</option>
        </select>
        <span className="text-[10px] text-neutral-400">{products.length} resultados</span>
      </div>

      {loading ? <Cargando /> : (
        <div className={`${tarjeta} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className={`${th} w-12`}><span className="sr-only">Foto</span></th>
                  <th className={th}>Producto</th>
                  <th className={th}>Código</th>
                  <th className={th}>Categoría</th>
                  <th className={th}>Marca</th>
                  <th className={th}>Nivel</th>
                  <th className={`${th} text-right`}>Precio</th>
                  <th className={`${th} text-right`}>Stock</th>
                  <th className={th}>Estado</th>
                  <th className={`${th} text-center w-24`}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.id} data-producto={p.id} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'} ${p.isActive === false ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-2">
                      <div className="w-9 h-9 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center">
                        {p.imageUrl ? <img width={64} height={64} decoding="async" src={p.imageUrl} alt="" aria-hidden="true" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-neutral-300" aria-hidden="true" />}
                      </div>
                    </td>
                    <td className="px-4 py-2"><p className="text-xs font-medium text-slate-900 truncate max-w-[220px]">{p.name}</p></td>
                    <td className="px-4 py-2"><span className="text-[10px] font-mono text-neutral-400">{p.sku}</span></td>
                    <td className="px-4 py-2"><span className="text-xs text-slate-600">{p.category}</span></td>
                    <td className="px-4 py-2"><span className="text-xs text-slate-600">{p.brand || '—'}</span></td>
                    <td className="px-4 py-2"><NivelBadge tier={p.tier} /></td>
                    <td className="px-4 py-2 text-right"><span className="text-xs font-bold text-slate-900">{formatPrice(p.basePrice)}</span></td>
                    <td className="px-4 py-2 text-right">
                      <span className={`text-xs font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-orange-500' : 'text-slate-900'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.isActive === false ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                        {p.isActive === false ? 'Inactivo' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/admin/products/${p.id}/edit`} aria-label={`Editar ${p.name}`}
                          className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors" title="Editar">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <button onClick={() => cambiarEstado(p)} disabled={cambiando === p.id}
                          aria-label={p.isActive === false ? `Reactivar ${p.name}` : `Desactivar ${p.name}`}
                          title={p.isActive === false ? 'Reactivar' : 'Desactivar'}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${p.isActive === false ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}>
                          {p.isActive === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
              <Package className="h-8 w-8 mx-auto mb-2 text-neutral-300" aria-hidden="true" />
              <p className="text-sm">No hay productos con esos filtros</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
