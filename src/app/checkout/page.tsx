'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ordersApi } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { CheckCircle, Package, ShoppingCart, ArrowRight, Loader2, MapPin, Phone, MessageSquare, CreditCard, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

// ── Payment Method Selector ──
function PaymentMethodSelector({ selected, onSelect }: { selected: string; onSelect: (m: string) => void }) {
  const methods = [
    { id: 'yape', label: 'Yape', icon: 'Y', bg: 'bg-purple-600', border: 'border-purple-200', activeBg: 'bg-purple-50' },
    { id: 'plin', label: 'Plin', icon: 'P', bg: 'bg-green-500', border: 'border-green-200', activeBg: 'bg-green-50' },
    { id: 'card', label: 'Tarjeta', icon: '💳', bg: 'bg-slate-700', border: 'border-slate-200', activeBg: 'bg-slate-50' },
    { id: 'paypal', label: 'PayPal', icon: 'PP', bg: 'bg-sky-600', border: 'border-sky-200', activeBg: 'bg-sky-50' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {methods.map(m => (
        <button key={m.id} onClick={() => onSelect(m.id)}
          className={`p-3 rounded-xl border-2 text-center transition-all duration-150 ${
            selected === m.id ? `${m.border} ${m.activeBg} scale-[1.02]` : 'border-transparent bg-slate-50 hover:bg-slate-100'
          }`}>
          <div className={`w-8 h-8 ${m.bg} rounded-lg flex items-center justify-center text-white text-[10px] font-bold mx-auto mb-1`}>
            {m.icon}
          </div>
          <p className={`text-[10px] font-medium ${selected === m.id ? 'text-slate-900' : 'text-neutral-400'}`}>{m.label}</p>
        </button>
      ))}
    </div>
  );
}

// ── Interactive Credit Card ──
function CreditCardVisual({ number, name, expiry, flipped }: { number: string; name: string; expiry: string; flipped: boolean }) {
  const formatNumber = (n: string) => {
    const clean = n.replace(/\D/g, '').padEnd(16, '*');
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12, 16)}`;
  };

  return (
    <div className="perspective-[1000px] w-full max-w-sm mx-auto mb-6">
      <div className={`relative w-full h-48 transition-transform duration-500 transform-style-preserve-3d ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}>
        {/* Front */}
        <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-6 text-white shadow-[0px_10px_30px_-5px_rgba(0,0,0,0.3)] backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md opacity-80" />
            <div className="flex gap-1">
              <div className="w-6 h-6 bg-red-500 rounded-full opacity-80" />
              <div className="w-6 h-6 bg-orange-400 rounded-full opacity-80 -ml-3" />
            </div>
          </div>
          <p className="text-xl font-mono tracking-[3px] mb-6">{formatNumber(number)}</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] text-white/50 uppercase mb-0.5">Titular</p>
              <p className="text-sm font-medium tracking-wide">{name || 'TU NOMBRE'}</p>
            </div>
            <div>
              <p className="text-[9px] text-white/50 uppercase mb-0.5">Expira</p>
              <p className="text-sm font-mono">{expiry || 'MM/AA'}</p>
            </div>
          </div>
        </div>
        {/* Back */}
        <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 text-white shadow-[0px_10px_30px_-5px_rgba(0,0,0,0.3)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="w-full h-10 bg-slate-900 mt-8" />
          <div className="px-6 mt-4">
            <div className="flex items-center justify-end gap-3">
              <div className="flex-1 h-8 bg-slate-200 rounded" />
              <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-slate-900 text-xs font-bold">CVV</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, addNotification } = useAuth();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [observations, setObservations] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    if (user) {
      setAddress(user.address || '');
      setPhone(user.phone || '');
      setCardName(user.name || '');
    }
  }, [user]);

  const formatCardNumber = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { addNotification('Debes iniciar sesion', 'error'); return; }
    if (!address || !phone) { setError('Completa direccion y telefono'); return; }
    if (paymentMethod === 'card' && (!cardNumber || cardNumber.replace(/\D/g, '').length < 16)) { setError('Numero de tarjeta invalido'); return; }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        userId: user.id,
        items: items.map(item => ({ productId: item.product.id, quantity: item.quantity, notes: item.notes })),
        shippingAddress: address,
        shippingPhone: phone,
        contactNotes: [
          observations,
          coords ? `GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : '',
        ].filter(Boolean).join('\n') || undefined,
      };
      const result = await ordersApi.create(orderData);
      setOrderId(result.id);
      setOrderComplete(true);
      clearCart();
      addNotification('Pedido confirmado!', 'success');
    } catch (err: any) {
      setError(err.message || 'Error al crear la orden');
    } finally { setLoading(false); }
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Tu carrito esta vacio</h2>
          <Link href="/catalog" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm mt-4 inline-block hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            Ver Catalogo
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="bg-white rounded-[20px] shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)] p-7 max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Casi listo!</h2>
          <p className="text-neutral-400 text-sm mb-5">Inicia sesion para completar tu compra</p>
          <Link href="/login?redirect=/checkout" className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-sm inline-block hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            Iniciar Sesion
          </Link>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="max-w-sm w-full text-center animate-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Pedido Confirmado</h2>
          <p className="text-neutral-400 text-sm mb-1">Pedido <span className="font-bold text-slate-700">#{orderId.slice(0, 8)}</span></p>
          <p className="text-neutral-400 text-sm mb-6">Te contactaremos al {phone}</p>
          <div className="flex flex-col gap-2.5">
            <Link href={`/orders/${orderId}`} className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
              Ver Pedido <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/catalog" className="bg-white text-slate-700 px-6 py-3 rounded-xl font-medium text-sm shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2">
              <Package className="h-4 w-4" /> Seguir Comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Finalizar Compra</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}

            {/* Shipping */}
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" /> Datos de envio
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Selecciona tu ubicacion en el mapa</label>
                  <MapPicker onLocationSelect={(lat, lng) => {
                    setCoords({ lat, lng });
                  }} />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Direccion (referencia)</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} required rows={2}
                    placeholder="Calle, numero, urbanizacion, distrito..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Telefono de contacto</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                      placeholder="+51 999 123 456"
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Observations */}
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" /> Observaciones del pedido
              </h2>
              <textarea value={observations} onChange={e => setObservations(e.target.value)} rows={3}
                placeholder="Algun pedido especial, indicacion adicional, productos extra que necesites..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <p className="text-[10px] text-neutral-400 mt-1">Estas observaciones seran visibles para nuestro equipo</p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" /> Metodo de pago
              </h2>

              {/* Payment method selector */}
              <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

              {paymentMethod === 'card' && (
                <CreditCardVisual number={cardNumber} name={cardName.toUpperCase()} expiry={cardExpiry} flipped={cardFlipped} />
              )}

              {paymentMethod === 'card' && <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Numero de tarjeta</label>
                  <input type="text" value={formatCardNumber(cardNumber)}
                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    onFocus={() => setCardFlipped(false)}
                    placeholder="1234 5678 9012 3456" maxLength={19}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Nombre en la tarjeta</label>
                  <input type="text" value={cardName} onChange={e => setCardName(e.target.value)}
                    onFocus={() => setCardFlipped(false)}
                    placeholder="Como aparece en la tarjeta"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Vencimiento</label>
                    <input type="text" value={cardExpiry}
                      onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                      onFocus={() => setCardFlipped(false)}
                      placeholder="MM/AA" maxLength={5}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">CVV</label>
                    <input type="text" value={cardCvv}
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      onFocus={() => setCardFlipped(true)}
                      onBlur={() => setCardFlipped(false)}
                      placeholder="***" maxLength={4}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>}

              {paymentMethod === 'yape' && (
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">Y</div>
                  <p className="text-sm font-bold text-purple-900 mb-1">Paga con Yape</p>
                  <p className="text-xs text-purple-600">Te enviaremos el QR o numero al confirmar</p>
                </div>
              )}
              {paymentMethod === 'plin' && (
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">P</div>
                  <p className="text-sm font-bold text-green-900 mb-1">Paga con Plin</p>
                  <p className="text-xs text-green-600">Te enviaremos el numero al confirmar</p>
                </div>
              )}
              {paymentMethod === 'paypal' && (
                <div className="bg-sky-50 rounded-xl p-4 text-center">
                  <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold">PP</div>
                  <p className="text-sm font-bold text-sky-900 mb-1">Paga con PayPal</p>
                  <p className="text-xs text-sky-600">Seras redirigido a PayPal al confirmar</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 sticky top-20">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Resumen</h2>

              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-neutral-400">x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 ml-2">{formatPrice(item.product.basePrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Subtotal</span>
                  <span className="font-bold text-slate-900">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Envio</span>
                  <span className="font-medium text-green-600">Gratis</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900">{formatPrice(total)}</span>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <><Lock className="h-4 w-4" /> Confirmar Pedido - {formatPrice(total)}</>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-neutral-400">
                <Lock className="h-3 w-3" /> Pago 100% seguro
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
