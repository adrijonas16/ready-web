'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { listsApi, productsApi } from '@/services/api';
import { ListDetail, Product } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { ArrowLeft, Check, AlertTriangle, RefreshCw, Search, Save, Plus, Trash2 } from 'lucide-react';

export default function ReviewListPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  useEffect(() => {
    loadList();
  }, [resolvedParams.id]);

  const loadList = async () => {
    try {
      const result = await listsApi.getById(resolvedParams.id);
      setData(result);
    } catch (err) {
      console.error('Error loading list:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string, observaciones?: string) => {
    setSaving(true);
    try {
      await listsApi.updateStatus(resolvedParams.id, status, observaciones);
      await loadList();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (itemId: string, updates: any) => {
    setSaving(true);
    try {
      await listsApi.updateItem(resolvedParams.id, itemId, updates);
      setEditingItemId(null);
      await loadList();
    } catch (err) {
      console.error('Error updating item:', err);
    } finally {
      setSaving(false);
    }
  };

  const addNewItem = async () => {
    if (!newItemName.trim()) return;
    setSaving(true);
    try {
      await listsApi.addItem(resolvedParams.id, { nombreOriginal: newItemName.trim(), cantidad: newItemQty });
      setNewItemName('');
      setNewItemQty(1);
      await loadList();
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Eliminar este item?')) return;
    setSaving(true);
    try {
      await listsApi.deleteItem(resolvedParams.id, itemId);
      await loadList();
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchProduct.trim()) return;
    try {
      const results = await productsApi.search(searchProduct);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lista no encontrada</p>
      </div>
    );
  }

  const canApprove = data.list.estado === 'EN_REVISION' || data.list.estado === 'OBSERVADA';
  const canStartReview = data.list.estado === 'PENDIENTE_REVISION';

  return (
    <div>
      <button onClick={() => router.push('/admin/lists')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5" />
        Volver a listas
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Revisión: {data.list.schoolName}
            </h1>
            <p className="text-gray-600">
              {data.list.gradeName} - Año {data.list.year}
              <span className="mx-2">•</span>
              {formatDate(data.list.fechaSubida)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {canStartReview && (
              <button
                onClick={() => updateStatus('EN_REVISION')}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
              >
                {saving ? <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full" /> : null}
                Iniciar Revisión
              </button>
            )}
            {canApprove && (
              <>
                <button
                  onClick={() => updateStatus('OBSERVADA', 'Hay items que no pudieron ser procesados correctamente')}
                  disabled={saving}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:bg-orange-400 flex items-center gap-2"
                >
                  <AlertTriangle className="h-5 w-5" />
                  Marcar Observada
                </button>
                <button
                  onClick={() => updateStatus('VALIDADA')}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 flex items-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  Validar Lista
                </button>
              </>
            )}
          </div>
        </div>

        {data.list.ocrText && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Texto extraído (OCR):</p>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">{data.list.ocrText}</pre>
          </div>
        )}

        {data.list.imageUrl && (
          <div className="mt-4">
            <a href={data.list.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
              Ver imagen original →
            </a>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Items ({data.items.length})
          </h2>
          <button
            onClick={loadList}
            className="p-2 text-gray-400 hover:text-blue-600"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Original</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Detectado</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Cantidad</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Producto Match</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Precio</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Notas</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((item) => (
                <tr key={item.id} className={!item.matchedProductId ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={item.nombreOriginal}
                      className="px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                      onBlur={(e) => updateItem(item.id, { nombreOriginal: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={item.nombreDetectado || ''}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      onBlur={(e) => updateItem(item.id, { nombreDetectado: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={item.cantidad}
                      min={1}
                      className="px-2 py-1 border border-gray-300 rounded w-16 text-sm"
                      onBlur={(e) => updateItem(item.id, { cantidad: parseInt(e.target.value) })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {item.matchedProduct ? (
                      <span className="text-green-600">{item.matchedProduct.name}</span>
                    ) : (
                      <span className="text-red-500">Sin match</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.priceAtMatch ? (
                      <span>{formatPrice(item.priceAtMatch)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="text"
                      defaultValue={item.notas || ''}
                      placeholder="Agregar nota..."
                      className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                      onBlur={(e) => updateItem(item.id, { notas: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingItemId(item.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Buscar
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add new item */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">Agregar item</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNewItem()}
              placeholder="Nombre del producto..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              value={newItemQty}
              onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
              min={1}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={addNewItem}
              disabled={!newItemName.trim() || saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {editingItemId && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Buscar Producto</h3>
              <button onClick={() => setEditingItemId(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Buscar por nombre..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400"
                />
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map(product => (
                  <div
                    key={product.id}
                    onClick={() => {
                      updateItem(editingItemId, { productId: product.id });
                      setSearchResults([]);
                      setEditingItemId(null);
                    }}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer"
                  >
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category} - {formatPrice(product.basePrice)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}