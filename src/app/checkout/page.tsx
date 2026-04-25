'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ordersApi } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { CheckCircle, Package, ShoppingCart, ArrowRight, Loader2, MapPin, Phone } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loginWithGoogle, addNotification } = useAuth();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');

  useEffect(() => {
    if (user && (user.address || user.phone)) {
      setAddress(user.address || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification('Debes iniciar sesión para completar la compra', 'error');
      return;
    }

    if (!address || !phone) {
      setError('Completa todos los campos de envío');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        userId: user.id,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes
        })),
        shippingAddress: address,
        shippingPhone: phone
      };

      const result = await ordersApi.create(orderData);
      setOrderId(result.id);
      setOrderComplete(true);
      clearCart();
      addNotification('¡Pedido confirmado con éxito!', 'success');
    } catch (err: any) {
      setError(err.message || 'Error al crear la orden');
      addNotification('Error al procesar el pedido', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !orderComplete) {
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
          <p className="text-gray-500 mb-8">¡Agrega productos para continuar!</p>
          <Link href="/catalog" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-shadow inline-flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Ver Catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-yellow-300 rounded-full opacity-30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-pink-300 rounded-full opacity-30 blur-3xl" />
        </div>
        
        <div className="max-w-md w-full text-gray-900 placeholder-gray-400 rounded-3xl shadow-2xl p-8 relative z-10">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              ¡Casi listo!
            </h2>
            <p className="text-gray-600">
              Inicia sesión o regístrate para completar tu compra
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-3">Productos en tu carrito:</p>
              <p className="text-2xl font-bold text-blue-600">{items.length} productos</p>
              <p className="text-lg text-gray-600">Total: {formatPrice(total)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/login?redirect=/checkout"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-xl font-bold hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <span>🔑</span>
              Iniciar Sesión
            </Link>
            
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">Continuar con Google</span>
            </button>
            
            <Link
              href="/register?redirect=/checkout"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-bold hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <span>✨</span>
              Crear Cuenta
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/cart" className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1">
              ← Volver al carrito
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-300 rounded-full opacity-30 blur-3xl" />
        </div>
        
        <div className="max-w-md w-full text-center relative z-10">
          <div className="text-gray-900 placeholder-gray-400 rounded-3xl shadow-2xl p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              ¡Pedido Confirmado! 🎉
            </h2>
            <p className="text-gray-600 mb-2">
              Tu pedido <span className="font-bold text-gray-900">#{orderId.slice(0, 8)}</span> ha sido recibido
            </p>
            <p className="text-gray-500 mb-8">
              Te notificaremos cuando comience a prepararse
            </p>
            <div className="flex flex-col gap-3">
              <Link href={`/orders/${orderId}`} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-shadow inline-flex items-center justify-center gap-2">
                Ver Detalles del Pedido
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/catalog" className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-medium hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2">
                <Package className="h-5 w-5" />
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8 flex items-center gap-3">
        <span className="text-4xl">💳</span>
        Finalizar Compra
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="text-gray-900 placeholder-gray-400 rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Información de envío
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección de entrega
                </label>
                <div className="relative">
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pl-12 text-gray-900 placeholder-gray-400"
                    placeholder="Calle, número, departamento, ciudad..."
                  />
                  <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono de contacto
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pl-12 text-gray-900 placeholder-gray-400"
                    placeholder="+56 9 1234 5678"
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Confirmar Pedido - {formatPrice(total)}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white sticky top-24">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Resumen del Pedido
            </h2>
            
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between items-start text-gray-900 placeholder-gray-400/10 rounded-xl p-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-xs text-white/70">Cantidad: {item.quantity}</p>
                  </div>
                  <span className="font-bold">{formatPrice(item.product.basePrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/20 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Total ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="text-2xl font-bold">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span>🔒</span>
                <span>Pago 100% seguro</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80 mt-2">
                <span>🚚</span>
                <span>Envío a domicilio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}