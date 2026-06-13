'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { listsApi, productsApi } from '@/services/api';
import { ListDetail, Product, SupplyItem } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { ArrowLeft, Check, AlertTriangle, RefreshCw, Search, Plus, Trash2, X, Eye, Coins, Star, Crown, Package } from 'lucide-react';

const TIERS = [
  { id: 'economico', label: 'Economico', icon: Coins, color: 'green' },
  { id: 'medio', label: 'Estandar', icon: Star, color: 'blue' },
  { id: 'premium', label: 'Premium', icon: Crown, color: 'amber' },
];

function TierBadge({ tier }: { tier?: string }) {
  const t = TIERS.find(t => t.id === tier);
  if (!t) return null;
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${colors[t.color]}`}>{t.label}</span>;
}

export default function ReviewListPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchTier, setSearchTier] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadList(); }, [resolvedParams.id]);

  const loadList = async () => {
    try { setData(await listsApi.getById(resolvedParams.id)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (status: string, observaciones?: string) => {
    setSaving(true);
    try { await listsApi.updateStatus(resolvedParams.id, status, observaciones); await loadList(); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const updateItem = async (itemId: string, updates: any) => {
    setSaving(true); setSaved(false);
    try { await listsApi.updateItem(resolvedParams.id, itemId, updates); await loadList(); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const addNewItem = async () => {
    if (!newItemName.trim()) return;
    setSaving(true);
    try {
      await listsApi.addItem(resolvedParams.id, { nombreOriginal: newItemName.trim(), cantidad: newItemQty });
      setNewItemName(''); setNewItemQty(1); await loadList();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Eliminar este item?')) return;
    setSaving(true);
    try { await listsApi.deleteItem(resolvedParams.id, itemId); await loadList(); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const deleteList = async () => {
    if (!confirm('Eliminar esta lista y todos sus items?')) return;
    try { await listsApi.delete(resolvedParams.id); router.push('/admin/lists'); }
    catch (err) { console.error(err); }
  };

  const handleSearch = async (query?: string, tierFilter?: string) => {
    const q = query || searchProduct;
    if (!q.trim()) return;
    const tier = tierFilter !== undefined ? tierFilter : searchTier;
    try {
      const results = await productsApi.search(q);
      setSearchResults(tier ? results.filter((p: Product) => p.tier === tier) : results);
    } catch (err) { console.error(err); }
  };

  const openSearchForItem = (item: SupplyItem, tier?: string) => {
    setEditingItemId(item.id);
    setSearchProduct(item.nombreOriginal);
    setSearchTier(tier || '');
    handleSearch(item.nombreOriginal, tier || '');
  };

  const assignProduct = async (product: Product) => {
    if (!editingItemId) return;
    await updateItem(editingItemId, { productId: product.id });
    setEditingItemId(null);
    setSearchResults([]);
  };

  if (loading) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  if (!data) return <div className="text-center py-12"><p className="text-gray-500">Lista no encontrada</p></div>;

  const canApprove = data.list.estado === 'EN_REVISION' || data.list.estado === 'OBSERVADA';
  const canStartReview = data.list.estado === 'PENDIENTE_REVISION';
  const totalEstimado = data.items.reduce((s, i) => s + ((i.priceAtMatch || 0) * (i.matchedQuantity || i.cantidad)), 0);
  const matchedCount = data.items.filter(i => i.matchedProductId).length;

  return (
    <div>
      <button onClick={() => router.push('/admin/lists')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5" /> Volver a listas
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Revision: {data.list.schoolName}</h1>
            <p className="text-gray-600">
              {data.list.gradeName} - Ano {data.list.year}
              <span className="mx-2">|</span>
              {formatDate(data.list.fechaSubida)}
              <span className="mx-2">|</span>
              <span className="font-medium">{matchedCount}/{data.items.length}</span> productos asignados
              <span className="mx-2">|</span>
              Total: <span className="font-bold text-gray-900">{formatPrice(totalEstimado)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {saving && <span className="text-xs text-blue-500 animate-pulse">Guardando...</span>}
            {saved && <span className="text-xs text-green-500 flex items-center gap-1"><Check className="h-3 w-3" /> Guardado</span>}
            <button onClick={() => setShowPreview(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2">
              <Eye className="h-4 w-4" /> Vista Previa
            </button>
            <button onClick={deleteList}
              className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-200 flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
            {canStartReview && (
              <button onClick={() => updateStatus('EN_REVISION')} disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400">
                Iniciar Revision
              </button>
            )}
            {canApprove && (
              <>
                <button onClick={() => updateStatus('OBSERVADA', 'Items requieren revision')} disabled={saving}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:bg-orange-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Observar
                </button>
                <button onClick={() => updateStatus('VALIDADA')} disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 flex items-center gap-2">
                  <Check className="h-4 w-4" /> Validar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Images */}
        {data.list.imageUrl && (
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {data.list.imageUrl.split('|').map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img src={url} alt={`Imagen ${i + 1}`} className="h-32 rounded-lg border border-gray-200 object-cover hover:opacity-80 transition-opacity" />
              </a>
            ))}
          </div>
        )}

        {data.list.ocrText && (
          <details className="mt-4">
            <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700">Ver texto OCR</summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 whitespace-pre-wrap">{data.list.ocrText}</pre>
          </details>
        )}
      </div>

      {/* Items as cards */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Items ({data.items.length})</h2>
          <button onClick={loadList} className="p-2 text-gray-400 hover:text-blue-600"><RefreshCw className="h-4 w-4" /></button>
        </div>

        {data.items.map((item) => (
          <div key={item.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${item.matchedProductId ? 'border-gray-100' : 'border-orange-200 bg-orange-50/30'}`}>
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Product image */}
                <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.matchedProduct?.imageUrl ? (
                    <img src={item.matchedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-gray-300" />
                  )}
                </div>

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <input type="text" defaultValue={item.nombreOriginal}
                        className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                        onBlur={(e) => e.target.value !== item.nombreOriginal && updateItem(item.id, { nombreOriginal: e.target.value })} />
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">Cant:</span>
                        <input type="number" defaultValue={item.cantidad} min={1}
                          className="w-12 text-xs border border-gray-200 rounded px-1 py-0.5"
                          onBlur={(e) => updateItem(item.id, { cantidad: parseInt(e.target.value) })} />
                        <input type="text" defaultValue={item.notas || ''} placeholder="Notas..."
                          className="text-xs text-gray-500 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none flex-1"
                          onBlur={(e) => updateItem(item.id, { notas: e.target.value })} />
                      </div>
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 p-1 flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Matched product */}
                  <div className="bg-gray-50 rounded-lg p-3 mt-2">
                    {item.matchedProduct ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-green-700">{item.matchedProduct.name}</span>
                            <TierBadge tier={item.matchedProduct.tier} />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.matchedProduct.brand} | {item.matchedProduct.category} | {formatPrice(item.matchedProduct.basePrice)} c/u
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{formatPrice((item.priceAtMatch || 0) * (item.matchedQuantity || item.cantidad))}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-orange-500 font-medium">Sin producto asignado</p>
                    )}

                    {/* Tier buttons to search by tier */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                      <span className="text-[10px] text-gray-400 font-medium">Asignar:</span>
                      {TIERS.map(t => {
                        const Icon = t.icon;
                        const isActive = item.matchedProduct?.tier === t.id;
                        const colors: Record<string, string> = {
                          green: isActive ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100',
                          blue: isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                          amber: isActive ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100',
                        };
                        return (
                          <button key={t.id} onClick={() => openSearchForItem(item, t.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${colors[t.color]}`}>
                            <Icon className="h-3 w-3" /> {t.label}
                          </button>
                        );
                      })}
                      <button onClick={() => openSearchForItem(item)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 ml-auto">
                        <Search className="h-3 w-3" /> Buscar todos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add new item */}
        <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-4">
          <div className="flex gap-2">
            <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNewItem()}
              placeholder="Agregar nuevo producto..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" value={newItemQty} onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
              min={1} className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center" />
            <button onClick={addNewItem} disabled={!newItemName.trim() || saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-1 text-sm">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {editingItemId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingItemId(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Buscar Producto</h3>
                <button onClick={() => setEditingItemId(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-2">
                <input type="text" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Buscar por nombre..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <button onClick={() => handleSearch()} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700">
                  <Search className="h-4 w-4" />
                </button>
              </div>
              {/* Tier filter */}
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setSearchTier(''); handleSearch(undefined, ''); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${!searchTier ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  Todos
                </button>
                {TIERS.map(t => (
                  <button key={t.id} onClick={() => { setSearchTier(t.id); handleSearch(undefined, t.id); }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${searchTier === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Busca un producto</p>
              ) : searchResults.map(product => (
                <div key={product.id} onClick={() => assignProduct(product)}
                  className="p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer flex items-center gap-3 transition-colors">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="h-5 w-5 text-gray-300" /></div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      <TierBadge tier={product.tier} />
                    </div>
                    <p className="text-xs text-gray-500">{product.brand} | {product.category}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatPrice(product.basePrice)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && data && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">Vista Previa de Lista</h3>
                <p className="text-xs text-gray-500">{data.list.schoolName} - {data.list.gradeName} - {data.list.year}</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-y-auto max-h-[65vh]">
              <div className="p-5 space-y-3">
                {data.items.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400 w-5 text-right">{i + 1}.</span>
                    <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.matchedProduct?.imageUrl ? (
                        <img src={item.matchedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.matchedProduct?.name || item.nombreOriginal}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{item.nombreOriginal}</span>
                        {item.matchedProduct && <TierBadge tier={item.matchedProduct.tier} />}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {item.priceAtMatch ? formatPrice(item.priceAtMatch * (item.matchedQuantity || item.cantidad)) : '-'}
                      </p>
                      <p className="text-[10px] text-gray-400">x{item.matchedQuantity || item.cantidad}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="p-5 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{matchedCount}/{data.items.length} productos asignados</span>
                  <span className="text-xs text-gray-400">{data.items.filter(i => !i.matchedProductId).length} pendientes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total estimado</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(totalEstimado)}</span>
                </div>
                {/* Breakdown by tier */}
                <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-2">
                  {TIERS.map(t => {
                    const tierItems = data.items.filter(i => i.matchedProduct?.tier === t.id);
                    const tierTotal = tierItems.reduce((s, i) => s + ((i.priceAtMatch || 0) * (i.matchedQuantity || i.cantidad)), 0);
                    return (
                      <div key={t.id} className="text-center">
                        <TierBadge tier={t.id} />
                        <p className="text-xs font-bold text-gray-700 mt-1">{formatPrice(tierTotal)}</p>
                        <p className="text-[10px] text-gray-400">{tierItems.length} items</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
