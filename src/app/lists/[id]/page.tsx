'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { listsApi, productsApi } from '@/services/api';
import { ListDetail, Product, SupplyItem } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import StatusBadge from '@/components/StatusBadge';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Edit2, MessageSquare, Check, X, Search, Package, Loader2, ZoomIn, ChevronRight, Star, ShoppingCart, Minus, Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Toast from '@/components/Toast';

interface ProductModalProps {
  item: SupplyItem;
  allProducts: Product[];
  onSave: (productId: string, quantity: number) => void;
  onClose: () => void;
}

function ProductModal({ item, allProducts, onSave, onClose }: ProductModalProps) {
  const [query, setQuery] = useState(item.nombreDetectado || item.nombreOriginal);
  const [results, setResults] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(item.matchedProductId || null);
  const [quantity, setQuantity] = useState(item.userCustomQuantity || item.matchedQuantity || item.cantidad);
  const [loading, setLoading] = useState(false);
  const [zoomedProduct, setZoomedProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      setLoading(true);
      try {
        const res = await productsApi.search(query);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const selectProduct = (product: Product) => {
    setSelectedId(selectedId === product.id ? null : product.id);
  };

  const handleSave = () => {
    if (selectedId) {
      onSave(selectedId, quantity);
    }
  };

  const selectedProduct = results.find(p => p.id === selectedId) || allProducts.find(p => p.id === selectedId);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Seleccionar Producto</h2>
              <p className="text-gray-500 mt-1">
                Para: <span className="font-medium text-gray-700">{item.nombreOriginal}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, marca o categoría..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />}
          </div>

          {selectedId && (
            <div className="mt-4 flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Cantidad:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 bg-white rounded-lg hover:bg-gray-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 bg-white rounded-lg hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1" />
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-bold text-blue-600 text-lg">
                  {formatPrice((selectedProduct?.basePrice || 0) * quantity)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 && query && !loading ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay productos que coincidan con tu búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map(product => (
                <div
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  className={`cursor-pointer rounded-xl border-2 transition-all overflow-hidden ${
                    selectedId === product.id 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomedProduct(product);
                      }}
                      className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white shadow-sm"
                    >
                      <ZoomIn className="h-4 w-4 text-gray-600" />
                    </button>
                    {selectedId === product.id && (
                      <div className="absolute top-2 right-2 p-1 bg-blue-500 rounded-full">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
                    <p className="font-bold text-blue-600 mt-2">{formatPrice(product.basePrice)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-500">{product.stock} disponibles</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              {selectedProduct && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                    {selectedProduct.imageUrl ? (
                      <img src={selectedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">📦</div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(selectedProduct.basePrice)} x {quantity} = 
                      <span className="font-bold text-blue-600 ml-1">
                        {formatPrice(selectedProduct.basePrice * quantity)}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedId}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>

      {zoomedProduct && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/80 to-pink-900/80 backdrop-blur-sm flex items-center justify-center z-[60]"
          onClick={() => setZoomedProduct(null)}
        >
          <button 
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full"
            onClick={() => setZoomedProduct(null)}
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div className="max-w-4xl max-h-[85vh] p-4" onClick={e => e.stopPropagation()}>
            <img 
              src={zoomedProduct.imageUrl || '/placeholder.png'} 
              alt={zoomedProduct.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-white">{zoomedProduct.name}</h3>
              <p className="text-gray-300 mt-1">{zoomedProduct.brand}</p>
              <p className="text-2xl font-bold text-blue-400 mt-2">{formatPrice(zoomedProduct.basePrice)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [data, setData] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentingItem, setCommentingItem] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadList();
    loadProducts();
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

  const loadProducts = async () => {
    try {
      const res = await productsApi.getAll();
      setAllProducts(res);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startEdit = (item: SupplyItem) => {
    setEditingItem(item);
  };

  const handleSaveProduct = async (productId: string, quantity: number) => {
    if (!editingItem) return;
    
    setSaving(true);
    try {
      await listsApi.updateItem(resolvedParams.id, editingItem.id, {
        productId: productId,
        cantidad: quantity,
        userCustomQuantity: quantity
      });
      await loadList();
      setEditingItem(null);
      showToast('Producto actualizado correctamente', 'success');
    } catch (err) {
      console.error('Error saving:', err);
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startComment = (item: SupplyItem) => {
    setCommentingItem(item.id);
    setEditingNotes(item.userNotas || item.notas || '');
  };

  const saveComment = async () => {
    if (!commentingItem) return;
    
    setSaving(true);
    try {
      await listsApi.updateItem(resolvedParams.id, commentingItem, {
        notas: editingNotes,
        userNotas: editingNotes
      });
      await loadList();
      setCommentingItem(null);
      setEditingNotes('');
      showToast('Nota guardada', 'success');
    } catch (err) {
      console.error('Error saving comment:', err);
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cancelComment = () => {
    setCommentingItem(null);
    setEditingNotes('');
  };

  const getDisplayQuantity = (item: SupplyItem) => {
    return item.userCustomQuantity || item.matchedQuantity || item.cantidad;
  };

  const addToCart = () => {
    if (!data) return;
    
    const assignedItems = data.items.filter(i => i.matchedProduct);
    if (assignedItems.length === 0) {
      showToast('No hay productos para agregar', 'error');
      return;
    }
    
    assignedItems.forEach(item => {
      const qty = getDisplayQuantity(item);
      const notes = item.userNotas || item.notas;
      addItem(item.matchedProduct!, qty, notes, item);
    });

    router.push('/cart');
  };

  const addSingleToCart = (item: SupplyItem) => {
    if (!item.matchedProduct) return;
    
    const qty = getDisplayQuantity(item);
    const notes = item.userNotas || item.notas;
    addItem(item.matchedProduct, qty, notes, item);
    showToast(`${item.matchedProduct.name} agregado al carrito`, 'success');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lista no encontrada</h2>
        <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-700">
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5" />
        Volver a listas
      </button>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {data.list.schoolName}
            </h1>
            <p className="text-blue-100">{data.list.gradeName} - Año {data.list.year}</p>
          </div>
          <StatusBadge status={data.list.estado} size="lg" />
        </div>
      </div>

      <div className="space-y-4">
        {data.items.map((item) => (
          <div key={item.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${
            item.matchedProduct ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-400'
          }`}>
            <div className="p-6">
              <div className="flex flex-wrap gap-6">
                <div className="w-full md:w-56">
                  <p className="text-sm text-gray-500 mb-1">Lo que se pide</p>
                  <p className="font-semibold text-gray-900 text-lg">{item.nombreOriginal}</p>
                  {(item.userNotas || item.notas) && (
                    <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {item.userNotas || item.notas}
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <ChevronRight className="h-6 w-6 text-gray-300" />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm text-gray-500 mb-1">Producto asignado</p>
                  {item.matchedProduct ? (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl -m-2"
                      onClick={() => setEditingItem(item)}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative group">
                        {item.matchedProduct.imageUrl ? (
                          <img src={item.matchedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                          <Edit2 className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.matchedProduct.name}</p>
                        <p className="text-sm text-gray-500">{item.matchedProduct.brand}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"
                    >
                      <Search className="h-4 w-4" />
                      Buscar producto
                    </button>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Cantidad</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const newQty = Math.max(1, getDisplayQuantity(item) - 1);
                        await listsApi.updateItem(resolvedParams.id, item.id, { userCustomQuantity: newQty });
                        await loadList();
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-2xl font-bold text-gray-900 w-8 text-center">
                      {getDisplayQuantity(item)}
                    </span>
                    <button
                      onClick={async () => {
                        const newQty = getDisplayQuantity(item) + 1;
                        await listsApi.updateItem(resolvedParams.id, item.id, { userCustomQuantity: newQty });
                        await loadList();
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Precio</p>
                  <span className="text-2xl font-bold text-blue-600">
                    {item.priceAtMatch ? formatPrice(item.priceAtMatch * getDisplayQuantity(item)) : '-'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.matchedProduct && (
                    <button
                      onClick={() => addSingleToCart(item)}
                      className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                      title="Agregar al carrito"
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(item)}
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    title="Cambiar producto"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => startComment(item)}
                    className={`p-3 rounded-xl transition-colors ${
                      item.userNotas || item.notas 
                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title="Agregar nota"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {commentingItem === item.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <label className="text-sm text-gray-600 mb-2 block">
                    Nota para &quot;{item.nombreOriginal}&quot;:
                  </label>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Ej: Necesito marca Faber, color azul..."
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={saveComment}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Guardar nota
                    </button>
                    <button
                      onClick={cancelComment}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-3xl font-bold">{data.items.filter(i => i.matchedProduct).length}</span>
            <span className="text-blue-200"> / {data.items.length}</span>
            <p className="text-sm text-blue-200">productos asignados</p>
          </div>
          <div className="h-12 w-px bg-white/30" />
          <div>
            <span className="text-3xl font-bold">
              {formatPrice(data.items.reduce((sum, i) => sum + ((i.priceAtMatch || 0) * getDisplayQuantity(i)), 0))}
            </span>
            <p className="text-sm text-blue-200">total estimado</p>
          </div>
        </div>
        <button
          onClick={addToCart}
          disabled={!data.items.some(i => i.matchedProduct)}
          className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg"
        >
          <ShoppingCart className="h-5 w-5" />
          Agregar todo al carrito
        </button>
      </div>

      {editingItem && (
        <ProductModal
          item={editingItem}
          allProducts={allProducts}
          onSave={handleSaveProduct}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}