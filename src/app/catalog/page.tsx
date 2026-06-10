'use client';

import { useState, useEffect } from 'react';
import { productsApi, brandsApi } from '@/services/api';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { Search, MapPin, X, ChevronDown, ChevronUp, SlidersHorizontal, Star } from 'lucide-react';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30000]);
  const [sortBy, setSortBy] = useState('name');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Collapsible sections
  const [openSections, setOpenSections] = useState({ categories: true, brands: true, tier: true, price: true });
  const toggleSection = (s: string) => setOpenSections(prev => ({ ...prev, [s]: !(prev as any)[s] }));

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData, brandsData] = await Promise.all([
        productsApi.getAll({ limit: 200 }), productsApi.getCategories(), brandsApi.getAll()
      ]);
      setAllProducts(productsData);
      setProducts(productsData);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Get filtered products for display
  const getFiltered = () => {
    let filtered = [...allProducts];
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()));
    if (selectedCategory) filtered = filtered.filter(p => p.category === selectedCategory);
    if (selectedBrand) filtered = filtered.filter(p => p.brand === selectedBrand);
    if (selectedTier) filtered = filtered.filter(p => p.tier === selectedTier);
    filtered = filtered.filter(p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]);

    if (sortBy === 'price-asc') filtered.sort((a, b) => a.basePrice - b.basePrice);
    else if (sortBy === 'price-desc') filtered.sort((a, b) => b.basePrice - a.basePrice);
    else if (sortBy === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  };

  // Get available options based on current filters (cascading)
  const getAvailable = () => {
    let base = [...allProducts];
    if (search) base = base.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()));

    // For categories: apply brand + tier filters
    const forCategories = base.filter(p => {
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (selectedTier && p.tier !== selectedTier) return false;
      return p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1];
    });

    // For brands: apply category + tier filters
    const forBrands = base.filter(p => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedTier && p.tier !== selectedTier) return false;
      return p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1];
    });

    // For tiers: apply category + brand filters
    const forTiers = base.filter(p => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      return p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1];
    });

    return {
      categories: [...new Set(forCategories.map(p => p.category))].sort(),
      categoryCounts: forCategories.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {} as Record<string, number>),
      brands: [...new Set(forBrands.map(p => p.brand).filter(Boolean))].sort() as string[],
      brandCounts: forBrands.reduce((acc, p) => { if (p.brand) acc[p.brand] = (acc[p.brand] || 0) + 1; return acc; }, {} as Record<string, number>),
      tierCounts: ['economico', 'medio', 'premium'].reduce((acc, t) => { acc[t] = forTiers.filter(p => p.tier === t).length; return acc; }, {} as Record<string, number>),
    };
  };

  useEffect(() => { setProducts(getFiltered()); }, [selectedCategory, selectedBrand, selectedTier, priceRange, sortBy, search, allProducts]);

  const available = getAvailable();

  const clearFilters = () => {
    setSearch(''); setSelectedCategory(''); setSelectedBrand(''); setSelectedTier('');
    setPriceRange([0, 30000]); setSortBy('name');
  };

  const activeFilterCount = [selectedCategory, selectedBrand, selectedTier].filter(Boolean).length + (priceRange[0] > 0 || priceRange[1] < 30000 ? 1 : 0);

  const FilterSidebar = () => (
    <div className="space-y-4">
      {/* Categories */}
      <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        <button onClick={() => toggleSection('categories')} className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-slate-900">
          Categorias {openSections.categories ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
        </button>
        {openSections.categories && (
          <div className="px-4 pb-3 space-y-1">
            <button onClick={() => setSelectedCategory('')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${!selectedCategory ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              Todas ({allProducts.length})
            </button>
            {available.categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex justify-between transition-colors ${selectedCategory === cat ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span>{cat}</span>
                <span className={selectedCategory === cat ? 'text-white/70' : 'text-neutral-400'}>{available.categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Brands */}
      <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        <button onClick={() => toggleSection('brands')} className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-slate-900">
          Marcas {openSections.brands ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
        </button>
        {openSections.brands && (
          <div className="px-4 pb-3 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {available.brands.map(bName => (
              <button key={bName} onClick={() => setSelectedBrand(selectedBrand === bName ? '' : bName)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex justify-between transition-colors ${selectedBrand === bName ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span>{bName}</span>
                <span className={selectedBrand === bName ? 'text-white/70' : 'text-neutral-400'}>{available.brandCounts[bName] || 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tier */}
      <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        <button onClick={() => toggleSection('tier')} className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-slate-900">
          Calidad {openSections.tier ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
        </button>
        {openSections.tier && (
          <div className="px-4 pb-3 space-y-1">
            {['economico', 'medio', 'premium'].map(tier => {
              const count = available.tierCounts[tier] || 0;
              if (count === 0 && selectedTier !== tier) return null;
              return (
                <button key={tier} onClick={() => setSelectedTier(selectedTier === tier ? '' : tier)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${selectedTier === tier ? 'bg-blue-500 text-white' : count === 0 ? 'text-neutral-300' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className={`w-2 h-2 rounded-full ${tier === 'premium' ? 'bg-amber-400' : tier === 'medio' ? 'bg-blue-400' : 'bg-green-400'}`} />
                  <span className="capitalize">{tier}</span>
                  <span className={`ml-auto ${selectedTier === tier ? 'text-white/70' : 'text-neutral-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        <button onClick={() => toggleSection('price')} className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-slate-900">
          Precio {openSections.price ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
        </button>
        {openSections.price && (
          <div className="px-4 pb-3">
            <input type="range" min="0" max="30000" step="500" value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full accent-blue-500" />
            <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
              <span>S/ 0</span>
              <span className="font-bold text-slate-900">Hasta S/ {(priceRange[1] / 100).toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="w-full py-2 text-xs text-red-500 font-medium hover:text-red-600">
          Limpiar filtros ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Arequipa Banner */}
        <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 mb-4 flex items-center gap-4 overflow-hidden relative">
          {/* Arequipa flag */}
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative bg-red-600 flex items-center justify-center">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 bg-red-600" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-red-600" />
            </div>
            <div className="relative z-10 w-6 h-6 border-2 border-yellow-400 rounded-full bg-white flex items-center justify-center">
              <span className="text-[8px]">🏔️</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Envios en Arequipa</p>
            <p className="text-xs text-neutral-400">La Ciudad Blanca — Proximamente en Lima, Cusco y mas</p>
          </div>
          {/* Mini Peru flag */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-5 rounded-sm overflow-hidden flex shadow-sm">
              <div className="w-1/3 bg-red-600" />
              <div className="w-1/3 bg-white" />
              <div className="w-1/3 bg-red-600" />
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">Peru</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar productos, marcas..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl text-sm shadow-[0px_2px_4px_0px_rgba(0,0,0,0.06)] border-none placeholder-neutral-400" />
          </div>
          <button onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-[0px_2px_4px_0px_rgba(0,0,0,0.06)] relative">
            <SlidersHorizontal className="h-5 w-5 text-slate-600" />
            {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-white rounded-xl px-3 py-2 text-sm shadow-[0px_2px_4px_0px_rgba(0,0,0,0.06)] border-none text-slate-600">
            <option value="name">Nombre</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="rating">Mejor valorado</option>
          </select>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters - desktop */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <FilterSidebar />
          </div>

          {/* Mobile filters overlay */}
          {showMobileFilters && (
            <div className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setShowMobileFilters(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-72 bg-sky-100 p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Filtros</h2>
                  <button onClick={() => setShowMobileFilters(false)}><X className="h-5 w-5 text-slate-600" /></button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Products grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-neutral-400">{products.length} productos</p>
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2">
                  {selectedCategory && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">{selectedCategory} <button onClick={() => setSelectedCategory('')}><X className="h-2.5 w-2.5" /></button></span>}
                  {selectedBrand && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">{selectedBrand} <button onClick={() => setSelectedBrand('')}><X className="h-2.5 w-2.5" /></button></span>}
                  {selectedTier && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 capitalize">{selectedTier} <button onClick={() => setSelectedTier('')}><X className="h-2.5 w-2.5" /></button></span>}
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)]">
                    <div className="m-3 rounded-2xl aspect-square skeleton" />
                    <div className="px-4 pb-4 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/3" /></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-16 text-center">
                <Search className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                <button onClick={clearFilters} className="text-blue-500 text-sm font-medium mt-2">Limpiar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
