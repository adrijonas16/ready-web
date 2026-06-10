'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package, MessageSquare, Check, ZoomIn } from 'lucide-react';
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
    items.forEach(item => { initialNotes[item.product.id] = item.notes || ''; });
    setEditingNotes(initialNotes);
  }, [items]);

  const handleSaveNotes = (productId: string) => { updateNotes(productId, editingNotes[productId]); };

  const handleClearCart = () => {
    clearCart(); setShowClearConfirm(false); setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Tu carrito esta vacio</h2>
          <p className="text-neutral-400 text-sm mb-8">Explora nuestro catalogo</p>
          <div className="flex gap-3 justify-center">
            <Link href="/lists" className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
              <Package className="h-4 w-4" /> Ver Listas
            </Link>
            <Link href="/catalog" className="bg-white text-slate-700 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] hover:shadow-md transition-shadow">
              <ShoppingBag className="h-4 w-4" /> Catalogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="max-w-6xl mx-auto py-6 px-4">
        {showSuccess && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-slide-down text-sm font-bold">
            <Check className="h-4 w-4 animate-check-pop" /> Carrito limpiado
          </div>
        )}

        {zoomedImage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
            <img src={zoomedImage} alt="Producto" className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl" />
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-slate-900 text-2xl font-bold tracking-tight">Shopping Bag</h1>
          {items.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)} className="text-red-500 hover:text-red-600 flex items-center gap-1.5 text-sm font-medium">
              <Trash2 className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}
        </div>

        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[20px] p-6 max-w-sm w-full shadow-xl animate-scale-in">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Limpiar carrito?</h3>
              <p className="text-neutral-400 text-sm mb-5">Se eliminaran todos los productos.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={handleClearCart} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 transition-colors">Limpiar</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 stagger-children mb-6">
          {items.map((item) => (
            <div key={item.product.id} className="bg-white rounded-[20px] shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10),0px_-1px_30px_-6px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-4 flex gap-4">
                <div className="w-16 h-16 bg-yellow-50 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer"
                  onClick={() => item.product.imageUrl && setZoomedImage(item.product.imageUrl)}>
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-neutral-300" /></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-black truncate">{item.product.name}</h3>
                      <p className="text-xs text-neutral-400">{item.product.brand}</p>
                      <p className="text-sm font-medium text-black mt-1">{formatPrice(item.product.basePrice)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeItem(item.product.id)} className="text-neutral-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      className="w-7 h-7 rounded-full border border-blue-500 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white hover:shadow-md hover:shadow-blue-500/25 transition-shadow">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Promo + Summary */}
        <div className="bg-white rounded-[30px] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.08)] p-6">
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-900 font-semibold text-sm">Subtotal</span>
              <div className="flex items-end gap-1">
                <span className="text-slate-900 font-bold">{formatPrice(total)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-900 font-semibold text-sm">Envio</span>
              <span className="text-slate-900 font-bold">Por calcular</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-900 font-semibold text-sm">Total</span>
              <div className="flex items-end gap-1">
                <span className="text-zinc-500 text-xs">({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="text-slate-900 font-bold text-lg">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {user ? (
            <Link href="/checkout"
              className="w-full bg-blue-500 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
              Proceder al Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link href="/login?redirect=/checkout"
              className="w-full bg-blue-500 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
              Iniciar Sesion para Comprar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
