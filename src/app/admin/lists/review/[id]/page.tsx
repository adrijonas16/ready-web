'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { listsApi, productsApi } from '@/services/api';
import { ListDetail, Product, SupplyItem } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { ArrowLeft, Check, AlertTriangle, RefreshCw, Search, Plus, Trash2, X, Eye, Coins, Star, Crown, Package, FileText, Save } from 'lucide-react';

const TIERS = [
  { id: 'economico', label: 'Economico', icon: Coins, color: 'green', updateKey: 'ProductEconomicoId' },
  { id: 'medio', label: 'Estandar', icon: Star, color: 'blue', updateKey: 'ProductMedioId' },
  { id: 'premium', label: 'Premium', icon: Crown, color: 'amber', updateKey: 'ProductPremiumId' },
] as const;

function TierBadge({ tier }: { tier?: string }) {
  const t = TIERS.find(t => t.id === tier);
  if (!t) return null;
  const colors: Record<string, string> = { green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700' };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${colors[t.color]}`}>{t.label}</span>;
}

// Local editable item for the Items tab
interface EditableItem {
  id: string;
  nombreOriginal: string;
  cantidad: number;
  notas: string;
  isNew?: boolean;
}

export default function ReviewListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'economico' | 'medio' | 'premium'>('items');

  // Local state for items tab - edits stay local until Save
  const [localItems, setLocalItems] = useState<EditableItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Search
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewTier, setPreviewTier] = useState('medio');

  useEffect(() => { loadList(); }, [id]);

  const loadList = async () => {
    try {
      const result = await listsApi.getById(id);
      setData(result);
      setLocalItems(result.items.map((i: SupplyItem) => ({
        id: i.id, nombreOriginal: i.nombreOriginal, cantidad: i.cantidad, notas: i.notas || '',
      })));
      setHasChanges(false);
      setDeletedIds([]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // --- Items tab: local edits ---
  const updateLocal = (idx: number, field: string, value: string | number) => {
    setLocalItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    setHasChanges(true);
  };

  const addLocalItem = () => {
    setLocalItems(prev => [...prev, { id: `new-${Date.now()}`, nombreOriginal: '', cantidad: 1, notas: '', isNew: true }]);
    setHasChanges(true);
  };

  const removeLocalItem = (idx: number) => {
    const item = localItems[idx];
    if (!item.isNew) setDeletedIds(prev => [...prev, item.id]);
    setLocalItems(prev => prev.filter((_, i) => i !== idx));
    setHasChanges(true);
  };

  const saveItems = async () => {
    setSaving(true);
    try {
      // Delete removed items
      for (const delId of deletedIds) {
        await listsApi.deleteItem(id, delId);
      }
      // Update existing and create new
      for (const item of localItems) {
        if (item.isNew) {
          if (item.nombreOriginal.trim()) {
            await listsApi.addItem(id, { nombreOriginal: item.nombreOriginal.trim(), cantidad: item.cantidad, notas: item.notas || undefined });
          }
        } else {
          await listsApi.updateItem(id, item.id, {
            nombreOriginal: item.nombreOriginal,
            cantidad: item.cantidad,
            notas: item.notas,
          });
        }
      }
      await loadList();
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  // --- Status ---
  const updateStatus = async (status: string, obs?: string) => {
    setSaving(true);
    try { await listsApi.updateStatus(id, status, obs); await loadList(); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const deleteList = async () => {
    if (!confirm('Eliminar esta lista?')) return;
    try { await listsApi.delete(id); router.push('/admin/lists'); }
    catch (err) { console.error(err); }
  };

  // --- Auto-match ---
  const runAutoMatch = async () => {
    if (hasChanges) { alert('Guarda los items primero antes de auto-asignar'); return; }
    setSaving(true);
    try { await listsApi.autoMatch(id, true); await loadList(); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  // --- Product search ---
  const openSearch = (item: SupplyItem, tier: string) => {
    setEditingItemId(item.id);
    setEditingTier(tier);
    setSearchProduct(item.nombreOriginal);
    doSearch(item.nombreOriginal, tier);
  };

  const doSearch = async (query?: string, tierFilter?: string) => {
    const q = query || searchProduct;
    if (!q.trim()) return;
    const tier = tierFilter !== undefined ? tierFilter : editingTier;
    try {
      const results = await productsApi.search(q);
      setSearchResults(tier ? results.filter((p: Product) => p.tier === tier) : results);
    } catch (err) { console.error(err); }
  };

  const assignProduct = async (product: Product) => {
    if (!editingItemId) return;
    setSaving(true);
    const tierConfig = TIERS.find(t => t.id === editingTier);
    try {
      if (tierConfig) {
        await listsApi.updateItem(id, editingItemId, { [tierConfig.updateKey]: product.id });
      } else {
        await listsApi.updateItem(id, editingItemId, { productId: product.id });
      }
      await loadList();
    } catch (err) { console.error(err); }
    finally { setSaving(false); setEditingItemId(null); setSearchResults([]); }
  };

  // --- Helpers ---
  if (loading) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  if (!data) return <div className="text-center py-12"><p className="text-gray-500">Lista no encontrada</p></div>;

  const canApprove = data.list.estado === 'EN_REVISION' || data.list.estado === 'OBSERVADA';
  const canStartReview = data.list.estado === 'PENDIENTE_REVISION';

  const getTierProduct = (item: SupplyItem, tierId: string): Product | undefined => {
    if (tierId === 'economico') return item.productEconomico;
    if (tierId === 'medio') return item.productMedio;
    if (tierId === 'premium') return item.productPremium;
  };
  const getTierPrice = (item: SupplyItem, tierId: string): number => {
    if (tierId === 'economico') return item.priceEconomico || 0;
    if (tierId === 'medio') return item.priceMedio || 0;
    if (tierId === 'premium') return item.pricePremium || 0;
    return 0;
  };
  const getTierTotal = (tierId: string) => data.items.reduce((s, i) => s + getTierPrice(i, tierId) * i.cantidad, 0);
  const getTierAssigned = (tierId: string) => data.items.filter(i => getTierProduct(i, tierId)).length;

  return (
    <div>
      <button onClick={() => router.push('/admin/lists')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="h-5 w-5" /> Volver
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{data.list.schoolName} - {data.list.gradeName}</h1>
            <p className="text-sm text-gray-500">{data.list.year} | {formatDate(data.list.fechaSubida)} | {data.items.length} items</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {saving && <span className="text-xs text-blue-500 animate-pulse">Guardando...</span>}
            {saved && <span className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Guardado</span>}
            <button onClick={runAutoMatch} disabled={saving}
              className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 flex items-center gap-1.5 disabled:opacity-50">
              <RefreshCw className="h-4 w-4" /> Auto-asignar
            </button>
            <button onClick={() => setShowPreview(true)} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> Vista Previa
            </button>
            <button onClick={deleteList} className="bg-red-50 text-red-500 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-1.5">
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
            {canStartReview && (
              <button onClick={() => updateStatus('EN_REVISION')} disabled={saving} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">Iniciar Revision</button>
            )}
            {canApprove && (
              <>
                <button onClick={() => updateStatus('OBSERVADA', 'Items requieren revision')} disabled={saving} className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:bg-orange-400 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Observar
                </button>
                <button onClick={() => updateStatus('VALIDADA')} disabled={saving} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-green-400 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Validar y Publicar
                </button>
              </>
            )}
          </div>
        </div>
        {data.list.imageUrl && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {data.list.imageUrl.split('|').map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img src={url} alt={`Img ${i + 1}`} className="h-24 rounded-lg border border-gray-200 object-cover hover:opacity-80" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Tier summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {TIERS.map(t => {
          const Icon = t.icon;
          const colors: Record<string, string> = { green: 'border-green-200 bg-green-50', blue: 'border-blue-200 bg-blue-50', amber: 'border-amber-200 bg-amber-50' };
          return (
            <div key={t.id} className={`rounded-xl border p-4 ${colors[t.color]}`}>
              <div className="flex items-center gap-2 mb-2"><Icon className="h-4 w-4" /><span className="text-sm font-bold">{t.label}</span></div>
              <p className="text-lg font-bold">{formatPrice(getTierTotal(t.id))}</p>
              <p className="text-[11px] text-gray-500">{getTierAssigned(t.id)}/{data.items.length} asignados</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setActiveTab('items')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 flex items-center justify-center gap-1.5 ${activeTab === 'items' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <FileText className="h-4 w-4" />Items{hasChanges && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
          </button>
          {TIERS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 flex items-center justify-center gap-1.5 ${activeTab === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <Icon className="h-4 w-4" />{t.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {/* === ITEMS TAB: local edits + save button === */}
          {activeTab === 'items' && (
            <div className="space-y-2">
              {localItems.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-400 w-5 text-right font-mono">{i + 1}.</span>
                  <input type="text" value={item.nombreOriginal}
                    onChange={(e) => updateLocal(i, 'nombreOriginal', e.target.value)}
                    placeholder="Nombre del producto"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none" />
                  <input type="number" value={item.cantidad} min={1}
                    onChange={(e) => updateLocal(i, 'cantidad', e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center bg-white focus:border-blue-500 outline-none" />
                  <input type="text" value={item.notas}
                    onChange={(e) => updateLocal(i, 'notas', e.target.value)}
                    placeholder="Notas..."
                    className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 outline-none" />
                  <button onClick={() => removeLocalItem(i)} className="text-gray-300 hover:text-red-500 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Add new row */}
              <button onClick={addLocalItem} className="w-full p-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 flex items-center justify-center gap-1.5">
                <Plus className="h-4 w-4" /> Agregar item
              </button>

              {/* Save button */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {hasChanges ? <span className="text-orange-500 font-medium">Hay cambios sin guardar</span> : 'Todo guardado'}
                </p>
                <button onClick={saveItems} disabled={!hasChanges || saving}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 flex items-center gap-2 transition-colors">
                  <Save className="h-4 w-4" /> Guardar Items
                </button>
              </div>
            </div>
          )}

          {/* === TIER TABS === */}
          {TIERS.map(t => activeTab === t.id && (
            <div key={t.id} className="space-y-2">
              {data.items.map((item, i) => {
                const product = getTierProduct(item, t.id);
                const price = getTierPrice(item, t.id);
                return (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl ${product ? 'bg-gray-50' : 'bg-orange-50 border border-orange-200'}`}>
                    <span className="text-xs text-gray-400 w-5 text-right font-mono">{i + 1}.</span>
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                      {product?.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="h-5 w-5 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">{item.nombreOriginal} x{item.cantidad}</p>
                      {product ? (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <span className="text-[10px] text-gray-400">{product.brand}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-orange-500 font-medium">Sin producto asignado</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 mr-2">
                      {price > 0 ? (
                        <>
                          <p className="text-sm font-bold text-gray-900">{formatPrice(price * item.cantidad)}</p>
                          <p className="text-[10px] text-gray-400">{formatPrice(price)} c/u</p>
                        </>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </div>
                    <button onClick={() => openSearch(item, t.id)}
                      className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1 flex-shrink-0">
                      <Search className="h-3 w-3" /> {product ? 'Cambiar' : 'Asignar'}
                    </button>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-500">{getTierAssigned(t.id)}/{data.items.length} productos asignados</span>
                <span className="text-lg font-bold text-gray-900">Total: {formatPrice(getTierTotal(t.id))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Modal */}
      {editingItemId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingItemId(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Buscar Producto</h3>
                  {editingTier && <TierBadge tier={editingTier} />}
                </div>
                <button onClick={() => setEditingItemId(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-2">
                <input type="text" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                  placeholder="Buscar..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" autoFocus />
                <button onClick={() => doSearch()} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"><Search className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setEditingTier(''); doSearch(undefined, ''); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${!editingTier ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>Todos</button>
                {TIERS.map(t => (
                  <button key={t.id} onClick={() => { setEditingTier(t.id); doSearch(undefined, t.id); }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${editingTier === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{t.label}</button>
                ))}
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Busca un producto</p>
              ) : searchResults.map(product => (
                <div key={product.id} onClick={() => assignProduct(product)}
                  className="p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer flex items-center gap-3">
                  {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package className="h-5 w-5 text-gray-300" /></div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                      <TierBadge tier={product.tier} />
                    </div>
                    <p className="text-xs text-gray-500">{product.brand} | {product.category}</p>
                    {product.description && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{product.description}</p>}
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(product.basePrice)}</p>
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
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-900">Vista Previa</h3>
                <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-gray-500 mb-3">{data.list.schoolName} - {data.list.gradeName} - {data.list.year}</p>
              <div className="flex gap-2">
                {TIERS.map(t => {
                  const Icon = t.icon;
                  const active = previewTier === t.id;
                  const colors: Record<string, string> = { green: 'bg-green-500 text-white', blue: 'bg-blue-500 text-white', amber: 'bg-amber-500 text-white' };
                  const inactive: Record<string, string> = { green: 'bg-green-50 text-green-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700' };
                  return (
                    <button key={t.id} onClick={() => setPreviewTier(t.id)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 ${active ? colors[t.color] : inactive[t.color]}`}>
                      <Icon className="h-4 w-4" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[55vh]">
              <div className="p-5 space-y-2">
                {data.items.map((item, i) => {
                  const product = getTierProduct(item, previewTier);
                  const price = getTierPrice(item, previewTier);
                  return (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-400 w-5 text-right">{i + 1}.</span>
                      <div className="w-11 h-11 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {product?.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product?.name || item.nombreOriginal}</p>
                        <p className="text-[10px] text-gray-400">{item.nombreOriginal}{product?.brand ? ` | ${product.brand}` : ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{price > 0 ? formatPrice(price * item.cantidad) : '-'}</p>
                        <p className="text-[10px] text-gray-400">x{item.cantidad}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-5 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{getTierAssigned(previewTier)}/{data.items.length} productos</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(getTierTotal(previewTier))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
