'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package, MessageSquare, Check, Sparkles, ZoomIn } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function CartPage() {
  const { items, removeItem, updateQuantity, updateNotes, total, clearCart } = useCart();
  const { user } = useAuth();
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const initialNotes: Record<string, string> = {};
    items.forEach(item => {
      initialNotes[item.product.id] = item.notes || '';
    });
    setEditingNotes(initialNotes);
  }, [items]);

  const handleSaveNotes = (productId: string) => {
    updateNotes(productId, editingNotes[productId]);
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-300 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-300 rounded-full opacity-20 blur-3xl" />
        </div>
        
        <div className="text-center relative z-10">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-500 mb-8">¡Explora nuestro catálogo y agrega productos!</p>
          <div className="flex gap-4 justify-center">
            <Link href="/lists" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-purple-500/30 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ver Listas
            </Link>
            <Link href="/catalog" className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Ver Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="h-5 w-5" />
          ¡Carrito limpiado!
        </div>
      )}

      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/80 to-pink-900/80 backdrop-blur-sm flex items-center justify-center z-50 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            alt="Producto"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <span className="text-4xl">🛒</span>
            Tu Carrito
          </h1>
          <p className="text-gray-500 mt-1">{items.length} productos en tu carrito</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-red-500 hover:text-red-600 flex items-center gap-2 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar carrito
          </button>
        )}
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Limpiar carrito?</h3>
            <p className="text-gray-500 mb-6">Se eliminarán todos los productos de tu carrito.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearCart}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex gap-4">
                  <div 
                    className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer relative group"
                    onClick={() => item.product.imageUrl && setZoomedImage(item.product.imageUrl)}
                  >
                    {item.product.imageUrl ? (
                      <>
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{item.product.category}</span>
                          <span>{item.product.brand}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-2xl text-blue-600">{formatPrice(item.product.basePrice * item.quantity)}</p>
                        <p className="text-sm text-gray-400">{formatPrice(item.product.basePrice)} c/u</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-200 shadow-sm"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-200 shadow-sm"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>

                    {item.originalItem?.notas && (
                      <div className="mt-3 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {item.originalItem.notas}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={editingNotes[item.product.id] || ''}
                    onChange={(e) => setEditingNotes(prev => ({ ...prev, [item.product.id]: e.target.value }))}
                    onBlur={() => handleSaveNotes(item.product.id)}
                    placeholder="Agregar nota especial..."
                    className="flex-1 text-sm px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5" />
              <h2 className="font-bold text-lg">Resumen</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-blue-100">Productos</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Cantidad total</span>
                <span className="font-medium">{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>
              <div className="h-px bg-white/20" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {user ? (
              <Link
                href="/checkout"
                className="w-full bg-white text-blue-600 py-4 px-6 rounded-xl font-bold hover:bg-blue-50 flex items-center justify-center gap-2 shadow-lg"
              >
                <span className="text-lg">💳</span>
                Proceder al Checkout
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login?redirect=/checkout"
                  className="w-full bg-white text-blue-600 py-4 px-6 rounded-xl font-bold hover:bg-blue-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  Iniciar Sesión
                </Link>
                <p className="text-center text-sm text-blue-100">
                  ¿No tienes cuenta?{' '}
                  <Link href="/register" className="underline hover:text-white">
                    Regístrate
                  </Link>
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <span>🔒</span>
                <span>Pago 100% seguro</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-100 mt-2">
                <span>🚚</span>
                <span>Envío a domicilio</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <Link href="/catalog" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
          ← Continuar Comprando
        </Link>
        <Link href="/lists" className="text-purple-600 hover:text-purple-700 flex items-center gap-2">
          Ver más listas →
        </Link>
      </div>
    </div>
  );
}