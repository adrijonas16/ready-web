'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ordersApi } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { CheckCircle, Package, ShoppingCart, ArrowRight, Loader2, MapPin, Phone, MessageSquare, CreditCard, Lock, FlaskConical, XCircle, Check } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

// ── Payment Method Selector ──
function PaymentMethodSelector({ selected, onSelect }: { selected: string; onSelect: (m: string) => void }) {
  const methods = [
    { id: 'yape', label: 'Yape', icon: 'Y', bg: 'bg-purple-600', border: 'border-purple-200', activeBg: 'bg-purple-50' },
    { id: 'plin', label: 'Plin', icon: 'P', bg: 'bg-green-500', border: 'border-green-200', activeBg: 'bg-green-50' },
    { id: 'card', label: 'Tarjeta', icon: '💳', bg: 'bg-slate-700', border: 'border-slate-200', activeBg: 'bg-slate-50' },
    { id: 'paypal', label: 'PayPal', icon: 'PP', bg: 'bg-sky-800', border: 'border-sky-200', activeBg: 'bg-sky-50' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {methods.map(m => (
        <button key={m.id} type="button" onClick={() => onSelect(m.id)} aria-pressed={selected === m.id}
          className={`p-3 rounded-xl border-2 text-center transition-all duration-150 ${
            selected === m.id ? 'border-primario bg-primario-claro scale-[1.02]' : 'border-transparent bg-fondo hover:border-linea'
          }`}>
          <div className={`w-8 h-8 ${m.bg} rounded-lg flex items-center justify-center text-white text-[10px] font-bold mx-auto mb-1`}>
            {m.icon}
          </div>
          <p className={`text-[11px] font-semibold ${selected === m.id ? 'text-grafito' : 'text-tenue'}`}>{m.label}</p>
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


// ── Pago de prueba: nunca se cobra nada ──
const TARJETA_OK = '4242424242424242';
const TARJETA_RECHAZO = '4000000000000002';
type PasoPago = 'conectando' | 'verificando' | 'aprobado' | 'rechazado';

function QrDePrueba({ color }: { color: string }) {
  // Cuadrícula fija (no es un QR real): solo ilustra el pago con la app
  const celdas = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21, y = Math.floor(i / 21);
    const esquina = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7 && (x === cx || x === cx + 6 || y === cy || y === cy + 6 || (x >= cx + 2 && x <= cx + 4 && y >= cy + 2 && y <= cy + 4));
    if (esquina(0, 0) || esquina(14, 0) || esquina(0, 14)) return true;
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) return false;
    return ((x * 7 + y * 13 + x * y) % 5) < 2;
  });
  return (
    <svg viewBox="-1 -1 23 23" className="mx-auto h-36 w-36 rounded-lg" role="img" aria-label="Código QR de prueba">
      <rect x="-1" y="-1" width="23" height="23" rx="1.5" fill="#FFFFFF" />
      {celdas.map((on, i) => on && <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" fill={color} />)}
    </svg>
  );
}

function ProcesandoPago({ paso, metodo, onCerrar }: { paso: PasoPago; metodo: string; onCerrar: () => void }) {
  const pasos: { id: PasoPago; t: string }[] = [
    { id: 'conectando', t: `Conectando con ${metodo === 'Tarjeta' ? 'el banco' : metodo} (modo prueba)` },
    { id: 'verificando', t: 'Verificando el pago' },
    { id: 'aprobado', t: 'Pago aprobado' },
  ];
  const orden = ['conectando', 'verificando', 'aprobado'];
  const actual = orden.indexOf(paso === 'rechazado' ? 'verificando' : paso);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-aparecer-fondo" role="dialog" aria-modal="true" aria-labelledby="titulo-pago">
      <div className="w-full max-w-sm rounded-2xl bg-papel p-6 shadow-2xl animate-scale-in">
        <h2 id="titulo-pago" className="text-lg font-extrabold">{paso === 'rechazado' ? 'Pago rechazado' : paso === 'aprobado' ? '¡Listo!' : 'Procesando tu pago'}</h2>
        <p className="mt-1 text-sm text-tenue">Pago de prueba: no se cobra nada.</p>
        {paso === 'rechazado' ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>El banco de prueba rechazó la tarjeta {TARJETA_RECHAZO.slice(-4)}. Usa la tarjeta 4242 4242 4242 4242 para que se apruebe.</p>
          </div>
        ) : (
          <ol className="mt-5 space-y-3" aria-live="polite">
            {pasos.map((p, i) => (
              <li key={p.id} className={`flex items-center gap-3 text-sm ${i > actual ? 'text-tenue' : 'font-semibold'}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${i < actual || paso === 'aprobado' ? 'bg-eco text-white' : i === actual ? 'border-2 border-primario' : 'border-2 border-linea'}`}>
                  {i < actual || paso === 'aprobado' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i === actual ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primario" aria-hidden="true" /> : null}
                </span>
                {p.t}
              </li>
            ))}
          </ol>
        )}
        {paso === 'rechazado' && (
          <button type="button" onClick={onCerrar} className="mt-5 w-full rounded-xl bg-primario py-3 text-sm font-bold text-white hover:bg-primario-oscuro">Intentar de nuevo</button>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { user, addNotification } = useAuth();
  const { items, total, clearCart, notasPedido, listaId } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [observations, setObservations] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [pasoPago, setPasoPago] = useState<PasoPago | null>(null);
  const [operacion, setOperacion] = useState('');

  // Si el usuario cambia (p. ej. termina de cargar la sesión), se rellenan sus datos
  const [usuarioPrevio, setUsuarioPrevio] = useState(user);
  if (user !== usuarioPrevio) {
    setUsuarioPrevio(user);
    if (user) {
      setAddress(user.address || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setCardName(user.name || '');
    }
  }

  const formatCardNumber = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  };

  const nombreMetodo: Record<string, string> = { card: 'Tarjeta', yape: 'Yape', plin: 'Plin', paypal: 'PayPal' };
  const usarTarjetaPrueba = (numero = TARJETA_OK) => {
    setCardNumber(numero); setCardExpiry('12/30'); setCardCvv('123'); if (!cardName) setCardName(user?.name || 'Cliente Demo');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { addNotification('Inicia sesión para comprar', 'error'); return; }
    if (!address || !phone || !email) { setError('Completa la dirección, el celular y el correo.'); return; }
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\D/g, '').length < 16) { setError('El número de tarjeta debe tener 16 dígitos. Usa la tarjeta de prueba.'); return; }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry) || cardCvv.length < 3) { setError('Completa el vencimiento (MM/AA) y el CVV.'); return; }
    }

    setLoading(true);
    setError('');
    const espera = (ms: number) => new Promise(r => setTimeout(r, ms));
    setPasoPago('conectando');
    await espera(900);
    setPasoPago('verificando');
    await espera(1100);
    if (paymentMethod === 'card' && cardNumber === TARJETA_RECHAZO) {
      setPasoPago('rechazado');
      setLoading(false);
      return;
    }

    const op = `PRUEBA-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    try {
      const orderData = {
        userId: user.id,
        supplyListId: listaId || undefined,
        items: items.map(item => ({ productId: item.product.id, productName: item.product.name, unitPrice: item.product.basePrice, quantity: item.quantity, notes: item.notes })),
        shippingAddress: address,
        shippingPhone: phone,
        pago: { metodo: nombreMetodo[paymentMethod] ?? paymentMethod, operacion: op, estado: 'APROBADO' },
        contactNotes: [
          `Email: ${email}`,
          `Celular: ${phone}`,
          `Pago de prueba: ${nombreMetodo[paymentMethod] ?? paymentMethod} (operación ${op})`,
          coords ? `GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : '',
          observations,
          ...notasPedido,
        ].filter(Boolean).join('\n') || undefined,
      };
      const result = await ordersApi.create(orderData);
      setPasoPago('aprobado');
      await espera(700);
      setOrderId(result.id);
      setOperacion(op);
      setOrderComplete(true);
      setPasoPago(null);
      clearCart();
      addNotification('¡Pedido confirmado!', 'success');
    } catch (err: unknown) {
      setPasoPago(null);
      setError(err instanceof Error ? err.message : 'No pudimos crear el pedido');
    } finally { setLoading(false); }
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Tu carrito está vacío</h2>
          <Link href="/catalog" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm mt-4 inline-block hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="bg-white rounded-[20px] shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)] p-7 max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-1">¡Casi listo!</h2>
          <p className="text-neutral-400 text-sm mb-5">Inicia sesión para completar tu compra</p>
          <Link href="/login?redirect=/checkout" className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-sm inline-block hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            Iniciar sesión
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">¡Pedido confirmado!</h2>
          <p className="text-neutral-400 text-sm mb-1">Pedido <span className="font-bold text-slate-700">{orderId}</span></p>
          <p className="text-neutral-400 text-sm mb-1">Operación de prueba <span className="font-mono font-semibold text-slate-700">{operacion}</span></p>
          <p className="text-neutral-400 text-sm mb-6">No se cobró nada: es un pago de demostración. Te contactaríamos al {phone}.</p>
          <div className="flex flex-col gap-2.5">
            <Link href={`/orders/${orderId}`} className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
              Ver mi pedido <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/catalog" className="bg-white text-slate-700 px-6 py-3 rounded-xl font-medium text-sm shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2">
              <Package className="h-4 w-4" /> Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Finalizar compra</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}

            {/* Shipping */}
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" /> Datos de envío
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Marca tu ubicación en el mapa</label>
                  <MapPicker onLocationSelect={(lat, lng) => {
                    setCoords({ lat, lng });
                  }} />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Dirección (referencia)</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} required rows={2}
                    placeholder="Calle, número, urbanización, distrito…"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Celular de contacto *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                      placeholder="+51 999 123 456"
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Correo electrónico *</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="tu@correo.com"
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
                placeholder="Algún pedido especial, indicación o producto extra que necesites…"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <p className="text-[10px] text-neutral-400 mt-1">Nuestro equipo verá estas observaciones</p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" /> Método de pago
              </h2>

              <div className="mb-4 flex items-start gap-2 rounded-xl border border-acento bg-acento-claro px-3 py-2.5 text-xs text-slate-800">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p><b>Pago de prueba.</b> Es una tienda de ejemplo: ningún método cobra dinero de verdad.</p>
              </div>

              {/* Payment method selector */}
              <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

              {paymentMethod === 'card' && (
                <CreditCardVisual number={cardNumber} name={cardName.toUpperCase()} expiry={cardExpiry} flipped={cardFlipped} />
              )}

              {paymentMethod === 'card' && <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => usarTarjetaPrueba()} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100">
                    Usar tarjeta de prueba (se aprueba)
                  </button>
                  <button type="button" onClick={() => usarTarjetaPrueba(TARJETA_RECHAZO)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100">
                    Probar un rechazo
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Número de tarjeta</label>
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
                <div className="rounded-xl border border-linea bg-fondo p-4 text-center">
                  <QrDePrueba color="#5B21B6" />
                  <p className="mt-3 text-sm font-bold mb-1">Yape de prueba</p>
                  <p className="text-xs text-tenue">Al confirmar simulamos que escaneaste el código y aprobaste el pago.</p>
                </div>
              )}
              {paymentMethod === 'plin' && (
                <div className="rounded-xl border border-linea bg-fondo p-4 text-center">
                  <QrDePrueba color="#047857" />
                  <p className="mt-3 text-sm font-bold mb-1">Plin de prueba</p>
                  <p className="text-xs text-tenue">Al confirmar simulamos que escaneaste el código y aprobaste el pago.</p>
                </div>
              )}
              {paymentMethod === 'paypal' && (
                <div className="rounded-xl border border-linea bg-fondo p-4 text-center">
                  <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold">PP</div>
                  <p className="text-sm font-bold mb-1">PayPal de prueba</p>
                  <p className="text-xs text-tenue">Al confirmar simulamos el inicio de sesión y el pago en PayPal.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 sticky top-20">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Resumen</h2>

              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Productos del pedido">
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
                  <span className="text-neutral-400">Envío</span>
                  <span className="font-semibold">Gratis</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900">{formatPrice(total)}</span>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <><Lock className="h-4 w-4" /> Pagar {formatPrice(total)} (prueba)</>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-neutral-400">
                <FlaskConical className="h-3 w-3" /> Modo prueba: no se cobra nada
              </div>
            </div>
          </div>
        </form>
        {pasoPago && <ProcesandoPago paso={pasoPago} metodo={nombreMetodo[paymentMethod] ?? paymentMethod} onCerrar={() => setPasoPago(null)} />}
      </div>
    </div>
  );
}
