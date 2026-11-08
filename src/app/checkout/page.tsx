'use client';

import AceptoTerminos from '@/components/AceptoTerminos';
import { lanzarConfeti } from '@/lib/efectos';
import { useRef, useState } from 'react';
import { agruparPorPara, useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ordersApi, CreateOrderInput } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { CheckCircle, Package, ShoppingCart, ArrowRight, Loader2, MapPin, Phone, MessageSquare, CreditCard, Lock, FlaskConical, XCircle, Check, CalendarDays, FileText, Ticket, Mail, AlertCircle } from 'lucide-react';
import { FRANJAS, costoEnvio, fechaLarga, fechasEntrega, useAjustes } from '@/lib/ajustes';
import { aplicarCupon, redondear } from '@/lib/precio';
import { LARGO, validarCelular, validarCorreo, validarCvv, validarDireccion, validarDni, validarNombre, validarRuc, validarRazonSocial, validarTarjeta, validarTexto, validarVencimiento } from '@/lib/validar';
import { useAntiSpam } from '@/lib/antispam';
import { CampoTrampa } from '@/components/form/Campo';
import { mensajeError } from '@/lib/api-base';
import dynamic from 'next/dynamic';

// Leaflet (mapa) solo se descarga cuando el cliente pide marcar su ubicación
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false, loading: () => <div className="skeleton h-64 w-full rounded-xl" aria-label="Cargando el mapa" /> });

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
    <div className="perspective-[1000px] w-full max-w-sm mx-auto mb-6" aria-hidden="true">
      <div className={`relative w-full aspect-[1.586/1] transition-transform duration-500 transform-style-preserve-3d ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}>
        {/* Front */}
        <div className="absolute inset-0 flex flex-col rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#0F172A] p-5 sm:p-6 text-white shadow-[0px_10px_30px_-5px_rgba(0,0,0,0.3)] backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-7 sm:w-12 sm:h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md opacity-80" />
            <div className="flex gap-1">
              <div className="w-6 h-6 bg-red-500 rounded-full opacity-80" />
              <div className="w-6 h-6 bg-orange-400 rounded-full opacity-80 -ml-3" />
            </div>
          </div>
          <p className="my-auto whitespace-nowrap font-mono text-[clamp(0.9rem,4.4vw,1.25rem)] tracking-[0.12em]">{formatNumber(number)}</p>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-white/60 uppercase mb-0.5">Titular</p>
              <p className="truncate text-sm font-medium tracking-wide">{name || 'TU NOMBRE'}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-white/60 uppercase mb-0.5">Expira</p>
              <p className="whitespace-nowrap text-sm font-mono">{expiry || 'MM/AA'}</p>
            </div>
          </div>
        </div>
        {/* Back */}
        <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-[#334155] via-[#475569] to-[#1E293B] text-white shadow-[0px_10px_30px_-5px_rgba(0,0,0,0.3)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="w-full h-10 bg-[#0F172A] mt-8" />
          <div className="px-6 mt-4">
            <div className="flex items-center justify-end gap-3">
              <div className="flex-1 h-8 bg-slate-200 rounded" />
              <div className="w-12 h-8 bg-[#FFFFFF] rounded flex items-center justify-center text-[#0F172A] text-xs font-bold">CVV</div>
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

// ── Campos del formulario con su error al lado ──
const claseCampo = (error?: string | null) =>
  `w-full rounded-xl border bg-papel px-3 py-2.5 text-base sm:text-sm focus:outline-none focus-visible:ring-2 ${error ? 'border-profe focus-visible:ring-profe/25' : 'border-linea-fuerte focus:border-primario focus-visible:ring-primario/25'}`;

function Campo({ id, etiqueta, obligatorio, error, ayuda, children }: {
  id: string; etiqueta: string; obligatorio?: boolean; error?: string | null; ayuda?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {etiqueta}{obligatorio ? <span className="text-profe" aria-hidden="true"> *</span> : <span className="font-normal text-tenue"> (opcional)</span>}
      </label>
      {children}
      {error
        ? <p id={`${id}-error`} className="mt-1 flex items-start gap-1 text-sm text-profe"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{error}</p>
        : ayuda ? <p id={`${id}-ayuda`} className="mt-1 text-xs text-tenue">{ayuda}</p> : null}
    </div>
  );
}

const Tarjeta = ({ icono, titulo, children }: { icono: React.ReactNode; titulo: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-linea bg-papel p-5">
    <h2 className="mb-4 flex items-center gap-2 font-bold"><span className="text-primario">{icono}</span>{titulo}</h2>
    {children}
  </section>
);

/** Número de operación del pago de prueba */
const nuevaOperacion = () => `PRUEBA-${Date.now().toString(36).toUpperCase().slice(-6)}`;

type Errores = Partial<Record<'address' | 'phone' | 'email' | 'fecha' | 'franja' | 'dni' | 'ruc' | 'razon' | 'observaciones' | 'card' | 'card-name' | 'expiry' | 'cvv', string | null>>;

export default function CheckoutPage() {
  const { user, addNotification, guardarPerfil } = useAuth();
  const { items, total, ahorro, clearCart, notasPedido, listaIds } = useCart();
  const ajustes = useAjustes();
  const formRef = useRef<HTMLFormElement>(null);
  const enviando = useRef(false);
  const anti = useAntiSpam('pedido');
  const [verMapa, setVerMapa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [confirmado, setConfirmado] = useState<{ fecha: string; franja: string; total: number } | null>(null);

  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [observations, setObservations] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const fechas = fechasEntrega(ajustes.diasEntrega);
  const [fecha, setFecha] = useState('');
  const [franja, setFranja] = useState<string>(FRANJAS[0]);
  const fechaElegida = fechas.some(f => f.valor === fecha) ? fecha : fechas[0]?.valor ?? '';
  const docGuardado = user?.documento?.trim() ?? '';
  const [tipoComprobante, setTipoComprobante] = useState<'boleta' | 'factura'>(docGuardado.length === 11 ? 'factura' : 'boleta');
  const [dni, setDni] = useState(docGuardado.length === 8 ? docGuardado : '');
  const [ruc, setRuc] = useState(docGuardado.length === 11 ? docGuardado : '');
  const [razonSocial, setRazonSocial] = useState('');
  const [guardarDatos, setGuardarDatos] = useState(true);
  const [codigoCupon, setCodigoCupon] = useState('');
  const [cupon, setCupon] = useState<string | null>(null);
  const [errorCupon, setErrorCupon] = useState('');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [pasoPago, setPasoPago] = useState<PasoPago | null>(null);
  const [operacion, setOperacion] = useState('');

  // Si el usuario cambia (p. ej. termina de cargar la sesión), se rellenan sus datos del perfil
  const [usuarioPrevio, setUsuarioPrevio] = useState(user);
  if (user !== usuarioPrevio) {
    setUsuarioPrevio(user);
    if (user) {
      if (!address) setAddress(user.address || '');
      if (!phone) setPhone(user.phone || '');
      if (!email) setEmail(user.email || '');
      if (!cardName) setCardName(user.name || '');
      const doc = user.documento?.trim() ?? '';
      if (doc.length === 8 && !dni) setDni(doc);
      if (doc.length === 11 && !ruc) { setRuc(doc); setTipoComprobante('factura'); }
    }
  }

  const cuponAplicado = aplicarCupon(cupon, total);
  const descuento = cuponAplicado?.descuento ?? 0;
  const envio = costoEnvio(total, ajustes);
  const totalPagar = redondear(total - descuento + envio);

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
    setErrores(e => ({ ...e, card: null, 'card-name': null, expiry: null, cvv: null }));
  };

  const validar = (): Errores => ({
    address: validarDireccion(address),
    phone: validarCelular(phone),
    email: validarCorreo(email),
    fecha: fechaElegida ? null : 'Elige el día de entrega.',
    franja: franja ? null : 'Elige el horario de entrega.',
    dni: tipoComprobante === 'boleta' ? validarDni(dni) : null,
    ruc: tipoComprobante === 'factura' ? validarRuc(ruc) : null,
    razon: tipoComprobante === 'factura' ? validarRazonSocial(razonSocial) : null,
    observaciones: validarTexto(observations, { obligatorio: false, max: LARGO.texto }),
    card: paymentMethod === 'card' ? validarTarjeta(cardNumber) : null,
    'card-name': paymentMethod === 'card' ? validarNombre(cardName, 'el nombre como aparece en la tarjeta') : null,
    expiry: paymentMethod === 'card' ? validarVencimiento(cardExpiry) : null,
    cvv: paymentMethod === 'card' ? validarCvv(cardCvv) : null,
  });

  /** Revalida un campo al salir de él (solo si ya mostraba un error o tiene algo escrito). */
  const alSalir = (campo: keyof Errores, valor: string) => {
    if (!valor.trim() && !errores[campo]) return;
    setErrores(e => ({ ...e, [campo]: validar()[campo] }));
  };
  const props = (campo: keyof Errores) => ({
    'aria-invalid': !!errores[campo] || undefined,
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
  });

  const aplicar = () => {
    const c = aplicarCupon(codigoCupon, total);
    if (!codigoCupon.trim()) { setErrorCupon('Escribe el código del cupón.'); return; }
    if (!c) { setErrorCupon('Ese cupón no existe o ya venció.'); setCupon(null); return; }
    setCupon(c.codigo); setErrorCupon('');
  };

  const [acepto, setAcepto] = useState(false);
  const [intentoAceptar, setIntentoAceptar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando.current) return; // sin doble cobro: un solo envío a la vez
    if (!user) { addNotification('Inicia sesión para comprar', 'error'); return; }
    const errs = validar();
    setErrores(errs);
    const primero = (Object.keys(errs) as (keyof Errores)[]).find(k => errs[k]);
    if (primero) {
      setError('');
      const campo = formRef.current?.querySelector<HTMLElement>(`#${primero}`);
      campo?.focus({ preventScroll: true });
      campo?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (!acepto) {
      setIntentoAceptar(true);
      const casilla = formRef.current?.querySelector<HTMLInputElement>('input[name=aceptoTerminos]');
      casilla?.focus({ preventScroll: true });
      casilla?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    enviando.current = true;
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
      enviando.current = false;
      return;
    }

    const op = nuevaOperacion();
    const documento = tipoComprobante === 'factura' ? ruc.trim() : dni.trim();
    try {
      const orderData: CreateOrderInput = {
        userId: user.id,
        supplyListId: listaIds[0],
        supplyListIds: listaIds,
        items: items.map(item => ({
          productId: item.product.id, productName: item.product.name, unitPrice: item.unitPrice, recargo: item.recargo,
          quantity: item.quantity, notes: item.notes, para: item.para,
        })),
        shippingAddress: address.trim(),
        shippingPhone: phone.trim(),
        pago: { metodo: nombreMetodo[paymentMethod] ?? paymentMethod, operacion: op, estado: 'APROBADO' },
        entrega: { fecha: fechaElegida, franja },
        costoEnvio: envio,
        comprobante: { tipo: tipoComprobante, documento, ...(tipoComprobante === 'factura' ? { razonSocial: razonSocial.trim() } : {}) },
        cupon: cuponAplicado?.codigo,
        contactNotes: [
          `Email: ${email.trim()}`,
          `Celular: ${phone.trim()}`,
          `Pago de prueba: ${nombreMetodo[paymentMethod] ?? paymentMethod} (operación ${op})`,
          coords ? `GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : '',
          cuponAplicado ? `Cupón: ${cuponAplicado.codigo} (−${cuponAplicado.porcentaje}%: ${formatPrice(cuponAplicado.descuento)})` : '',
          observations.trim() ? `Observaciones: ${observations.trim()}` : '',
          ...notasPedido.map(n => n.para ? `Por cotizar — ${n.para}: ${n.texto}` : `Por cotizar: ${n.texto}`),
        ].filter(Boolean).join('\n') || undefined,
      };
      const result = await ordersApi.create(orderData, await anti.datos());
      // Se guardan los datos para la próxima compra (perfil del cliente)
      if (guardarDatos && (address.trim() !== (user.address ?? '') || phone.trim() !== (user.phone ?? '') || (documento && documento !== (user.documento ?? '')))) {
        guardarPerfil({ address: address.trim(), phone: phone.trim(), ...(documento ? { documento } : {}) }).catch(() => {});
      }
      setPasoPago('aprobado');
      await espera(700);
      setOrderId(result.id);
      setOperacion(op);
      setConfirmado({ fecha: result.entrega?.fecha ?? fechaElegida, franja: result.entrega?.franja ?? franja, total: result.total ?? totalPagar });
      setOrderComplete(true);
      lanzarConfeti();
      setPasoPago(null);
      clearCart();
      addNotification(`¡Pedido ${result.id} confirmado!`, 'success');
    } catch (err: unknown) {
      setPasoPago(null);
      setError(mensajeError(err, 'No pudimos crear el pedido. Inténtalo de nuevo.'));
      enviando.current = false;
    } finally { setLoading(false); }
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-tenue/40" aria-hidden="true" />
          <h1 className="mb-1 text-xl font-bold">Tu carrito está vacío</h1>
          <p className="text-tenue">Agrega útiles para poder pagar.</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/lists" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-acento text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro px-5 py-3 text-sm font-bold">Buscar la lista de mi colegio</Link>
            <Link href="/catalog" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-grafito px-5 py-2.5 text-sm font-bold hover:bg-papel">Ver el catálogo</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-linea bg-papel p-7 text-center">
          <h1 className="mb-1 text-xl font-bold">¡Casi listo!</h1>
          <p className="mb-5 text-sm text-tenue">Inicia sesión para completar tu compra</p>
          <Link href="/login?redirect=/checkout" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-acento text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro py-3 text-sm font-bold">
            Iniciar sesión para pagar
          </Link>
          <Link href="/register" className="mt-3 inline-block text-sm font-semibold text-primario underline underline-offset-2">Crear una cuenta</Link>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center animate-scale-in">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-eco-claro">
            <CheckCircle className="h-8 w-8 text-eco" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-xl font-bold">¡Pedido confirmado!</h1>
          <p className="mb-1 text-sm text-tenue">Pedido <span className="font-bold text-grafito">{orderId}</span> · {formatPrice(confirmado?.total ?? 0)}</p>
          <p className="mb-1 text-sm text-tenue">Operación de prueba <span className="font-mono font-semibold text-grafito">{operacion}</span></p>
          {confirmado && <p className="mb-1 text-sm text-tenue">Entrega el <b className="text-grafito">{fechaLarga(confirmado.fecha)}</b>, de {confirmado.franja}</p>}
          <p className="mb-6 text-sm text-tenue">No se cobró nada: es un pago de demostración. Te contactaríamos al {phone}.</p>
          <div className="flex flex-col gap-2.5">
            <Link href={`/orders/${orderId}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-acento text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro px-6 py-3 text-sm font-bold">
              Ver mi pedido <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/catalog" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-grafito bg-papel px-6 py-3 text-sm font-bold">
              <Package className="h-4 w-4" aria-hidden="true" /> Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const grupos = agruparPorPara(items);
  const botonPagar = (clase: string) => (
    <button type="submit" form="form-pago" disabled={loading}
      className={`min-h-12 items-center justify-center gap-2 rounded-xl bg-acento px-5 py-3.5 text-sm font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro disabled:opacity-50 ${clase}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
      Pagar {formatPrice(totalPagar)} (prueba)
    </button>
  );

  return (
    <div className="pb-28 lg:pb-12">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-1 text-3xl font-extrabold tracking-tight">Finalizar compra</h1>
        <p className="mb-6 text-sm text-tenue">Los campos con <span className="text-profe">*</span> son obligatorios.</p>

        <form id="form-pago" ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={loading} className="relative grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-4">
            <CampoTrampa {...anti.trampa} />
            {!error && Object.values(errores).some(Boolean) && <div role="alert" className="flex items-start gap-2 rounded-xl border border-profe/40 bg-profe-claro px-4 py-3 text-sm text-profe"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Revisa los datos marcados en rojo.</div>}
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-profe/40 bg-profe-claro px-4 py-3 text-sm text-profe"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}

            <Tarjeta icono={<MapPin className="h-4 w-4" aria-hidden="true" />} titulo="Datos de entrega">
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm font-semibold">Marca tu ubicación en el mapa <span className="font-normal text-tenue">(opcional)</span></p>
                  {verMapa
                    ? <MapPicker onLocationSelect={(lat, lng) => setCoords({ lat, lng })} />
                    : <button type="button" onClick={() => setVerMapa(true)}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-linea-fuerte bg-fondo px-4 py-3 text-sm font-semibold text-primario hover:border-primario">
                        <MapPin className="h-4 w-4" aria-hidden="true" /> Marcar mi ubicación en el mapa
                      </button>}
                  {coords && <p className="mt-1 text-xs text-eco" role="status">Ubicación marcada.</p>}
                </div>
                <Campo id="address" etiqueta="Dirección" obligatorio error={errores.address} ayuda="Calle, número, urbanización, distrito y una referencia.">
                  <textarea id="address" name="address" autoComplete="street-address" value={address} rows={2} maxLength={LARGO.direccion} required
                    onChange={e => setAddress(e.target.value)} onBlur={e => alSalir('address', e.target.value)} {...props('address')}
                    placeholder="Calle, número, urbanización, distrito…" className={claseCampo(errores.address)} />
                </Campo>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="phone" etiqueta="Celular de contacto" obligatorio error={errores.phone} ayuda="9 dígitos; puedes poner +51.">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" aria-hidden="true" />
                      <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={LARGO.celular} required value={phone}
                        onChange={e => setPhone(e.target.value)} onBlur={e => alSalir('phone', e.target.value)} {...props('phone')}
                        placeholder="+51 999 123 456" className={`${claseCampo(errores.phone)} pl-10`} />
                    </div>
                  </Campo>
                  <Campo id="email" etiqueta="Correo electrónico" obligatorio error={errores.email}>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" aria-hidden="true" />
                      <input id="email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={LARGO.correo} required value={email}
                        onChange={e => setEmail(e.target.value)} onBlur={e => alSalir('email', e.target.value)} {...props('email')}
                        placeholder="tu@correo.com" className={`${claseCampo(errores.email)} pl-10`} />
                    </div>
                  </Campo>
                </div>
              </div>
            </Tarjeta>

            <Tarjeta icono={<CalendarDays className="h-4 w-4" aria-hidden="true" />} titulo="Día y hora de entrega">
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">Día <span className="text-profe" aria-hidden="true">*</span></legend>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {fechas.map(f => {
                    const activo = fechaElegida === f.valor;
                    return (
                      <label key={f.valor} className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-2 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-acento ${activo ? 'border-primario bg-primario-claro font-semibold' : 'border-linea hover:border-tenue'}`}>
                        <input type="radio" name="fecha" value={f.valor} checked={activo} onChange={() => setFecha(f.valor)} className="sr-only" id={f === fechas[0] ? 'fecha' : undefined} />
                        <span className="text-xs capitalize text-tenue">{f.dia}</span>
                        <span className="capitalize">{f.fecha}</span>
                      </label>
                    );
                  })}
                </div>
                {errores.fecha && <p id="fecha-error" className="mt-1 text-sm text-profe">{errores.fecha}</p>}
              </fieldset>
              <fieldset className="mt-4">
                <legend className="mb-2 text-sm font-semibold">Horario <span className="text-profe" aria-hidden="true">*</span></legend>
                <div className="grid grid-cols-2 gap-2">
                  {FRANJAS.map(f => (
                    <label key={f} className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-acento ${franja === f ? 'border-primario bg-primario-claro font-semibold' : 'border-linea hover:border-tenue'}`}>
                      <input type="radio" name="franja" value={f} checked={franja === f} onChange={() => setFranja(f)} className="sr-only" />
                      {f}
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="mt-3 text-xs text-tenue">Entregamos {ajustes.horarioEntrega.charAt(0).toLowerCase() + ajustes.horarioEntrega.slice(1)}. El primer día disponible es en {ajustes.diasEntrega} {ajustes.diasEntrega === 1 ? 'día hábil' : 'días hábiles'}.</p>
            </Tarjeta>

            <Tarjeta icono={<FileText className="h-4 w-4" aria-hidden="true" />} titulo="Comprobante">
              <div role="radiogroup" aria-label="Tipo de comprobante" className="mb-4 grid grid-cols-2 gap-2">
                {(['boleta', 'factura'] as const).map(t => (
                  <label key={t} className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 text-center text-sm capitalize transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-acento ${tipoComprobante === t ? 'border-primario bg-primario-claro font-semibold' : 'border-linea hover:border-tenue'}`}>
                    <input type="radio" name="comprobante" value={t} checked={tipoComprobante === t} onChange={() => setTipoComprobante(t)} className="sr-only" />
                    {t === 'boleta' ? 'Boleta' : 'Factura'}
                  </label>
                ))}
              </div>
              {tipoComprobante === 'boleta' ? (
                <Campo id="dni" etiqueta="DNI" error={errores.dni} ayuda="8 dígitos. Si lo dejas vacío, la boleta sale sin DNI.">
                  <input id="dni" name="dni" inputMode="numeric" autoComplete="off" maxLength={8} value={dni}
                    onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))} onBlur={e => alSalir('dni', e.target.value)} {...props('dni')}
                    placeholder="12345678" className={claseCampo(errores.dni)} />
                </Campo>
              ) : (
                <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                  <Campo id="ruc" etiqueta="RUC" obligatorio error={errores.ruc}>
                    <input id="ruc" name="ruc" inputMode="numeric" autoComplete="off" maxLength={11} required value={ruc}
                      onChange={e => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))} onBlur={e => alSalir('ruc', e.target.value)} {...props('ruc')}
                      placeholder="20123456789" className={claseCampo(errores.ruc)} />
                  </Campo>
                  <Campo id="razon" etiqueta="Razón social" obligatorio error={errores.razon}>
                    <input id="razon" name="razon" autoComplete="organization" maxLength={LARGO.titulo} required value={razonSocial}
                      onChange={e => setRazonSocial(e.target.value)} onBlur={e => alSalir('razon', e.target.value)} {...props('razon')}
                      placeholder="Mi Empresa S.A.C." className={claseCampo(errores.razon)} />
                  </Campo>
                </div>
              )}
              <label className="mt-4 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={guardarDatos} onChange={e => setGuardarDatos(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primario" />
                <span>Guardar mi dirección, celular y documento para la próxima compra (<Link href="/profile" className="font-semibold text-primario underline underline-offset-2">Mi perfil</Link>)</span>
              </label>
            </Tarjeta>

            <Tarjeta icono={<MessageSquare className="h-4 w-4" aria-hidden="true" />} titulo="Observaciones del pedido">
              <label htmlFor="observaciones" className="sr-only">Observaciones del pedido</label>
              <textarea id="observaciones" name="observaciones" value={observations} onChange={e => setObservations(e.target.value)} rows={3} maxLength={LARGO.texto}
                onBlur={e => alSalir('observaciones', e.target.value)} {...props('observaciones')}
                aria-describedby={errores.observaciones ? 'observaciones-error' : 'observaciones-ayuda'}
                placeholder="Algún pedido especial, indicación o producto extra que necesites…" className={claseCampo(errores.observaciones)} />
              {errores.observaciones
                ? <p id="observaciones-error" className="mt-1 text-sm text-profe">{errores.observaciones}</p>
                : <p id="observaciones-ayuda" className="mt-1 text-xs text-tenue">Nuestro equipo verá estas observaciones. Máximo {LARGO.texto} caracteres ({observations.length}/{LARGO.texto}).</p>}
            </Tarjeta>

            <Tarjeta icono={<CreditCard className="h-4 w-4" aria-hidden="true" />} titulo="Método de pago">
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-acento bg-acento-claro px-3 py-2.5 text-xs text-slate-800">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p><b>Pago de prueba.</b> Es una tienda de ejemplo: ningún método cobra dinero de verdad.</p>
              </div>

              <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

              {paymentMethod === 'card' && (
                <CreditCardVisual number={cardNumber} name={cardName.toUpperCase()} expiry={cardExpiry} flipped={cardFlipped} />
              )}

              {paymentMethod === 'card' && <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => usarTarjetaPrueba()} className="min-h-10 rounded-lg border border-linea-fuerte bg-fondo px-3 py-1.5 text-xs font-semibold hover:border-tenue">
                    Usar tarjeta de prueba (se aprueba)
                  </button>
                  <button type="button" onClick={() => usarTarjetaPrueba(TARJETA_RECHAZO)} className="min-h-10 rounded-lg border border-linea-fuerte bg-fondo px-3 py-1.5 text-xs font-semibold hover:border-tenue">
                    Probar un rechazo
                  </button>
                </div>
                <Campo id="card" etiqueta="Número de tarjeta" obligatorio error={errores.card}>
                  <input id="card" name="cc-number" type="text" inputMode="numeric" autoComplete="cc-number" required value={formatCardNumber(cardNumber)}
                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    onFocus={() => setCardFlipped(false)} onBlur={e => alSalir('card', e.target.value)} {...props('card')}
                    placeholder="1234 5678 9012 3456" maxLength={19} className={`${claseCampo(errores.card)} font-mono`} />
                </Campo>
                <Campo id="card-name" etiqueta="Nombre en la tarjeta" obligatorio error={errores['card-name']}>
                  <input id="card-name" name="cc-name" type="text" autoComplete="cc-name" required maxLength={LARGO.nombre} value={cardName} onChange={e => setCardName(e.target.value)}
                    onFocus={() => setCardFlipped(false)} onBlur={e => alSalir('card-name', e.target.value)} {...props('card-name')}
                    placeholder="Como aparece en la tarjeta" className={claseCampo(errores['card-name'])} />
                </Campo>
                <div className="grid grid-cols-2 gap-3">
                  <Campo id="expiry" etiqueta="Vencimiento" obligatorio error={errores.expiry}>
                    <input id="expiry" name="cc-exp" type="text" inputMode="numeric" autoComplete="cc-exp" required value={cardExpiry}
                      onChange={e => setCardExpiry(formatExpiry(e.target.value))} onFocus={() => setCardFlipped(false)} onBlur={e => alSalir('expiry', e.target.value)} {...props('expiry')}
                      placeholder="MM/AA" maxLength={5} className={`${claseCampo(errores.expiry)} font-mono`} />
                  </Campo>
                  <Campo id="cvv" etiqueta="CVV" obligatorio error={errores.cvv}>
                    <input id="cvv" name="cc-csc" type="password" inputMode="numeric" autoComplete="cc-csc" required value={cardCvv}
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      onFocus={() => setCardFlipped(true)} onBlur={e => { setCardFlipped(false); alSalir('cvv', e.target.value); }} {...props('cvv')}
                      placeholder="123" maxLength={4} className={`${claseCampo(errores.cvv)} font-mono`} />
                  </Campo>
                </div>
              </div>}

              {paymentMethod === 'yape' && (
                <div className="rounded-xl border border-linea bg-fondo p-4 text-center">
                  <QrDePrueba color="#5B21B6" />
                  <p className="mb-1 mt-3 text-sm font-bold">Yape de prueba</p>
                  <p className="text-xs text-tenue">Al confirmar simulamos que escaneaste el código y aprobaste el pago.</p>
                </div>
              )}
              {paymentMethod === 'plin' && (
                <div className="rounded-xl border border-linea bg-fondo p-4 text-center">
                  <QrDePrueba color="#047857" />
                  <p className="mb-1 mt-3 text-sm font-bold">Plin de prueba</p>
                  <p className="text-xs text-tenue">Al confirmar simulamos que escaneaste el código y aprobaste el pago.</p>
                </div>
              )}
              {paymentMethod === 'paypal' && (
                <div className="rounded-xl border border-linea bg-fondo p-4 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-lg font-bold text-white">PP</div>
                  <p className="mb-1 text-sm font-bold">PayPal de prueba</p>
                  <p className="text-xs text-tenue">Al confirmar simulamos el inicio de sesión y el pago en PayPal.</p>
                </div>
              )}
            </Tarjeta>
          </div>

          {/* Resumen */}
          <aside className="lg:sticky lg:top-20">
            <div className="rounded-2xl border border-linea bg-papel p-5">
              <h2 className="mb-3 font-bold">Resumen</h2>
              <div className="custom-scrollbar mb-4 max-h-64 space-y-3 overflow-y-auto pr-1" tabIndex={0} role="region" aria-label="Productos del pedido">
                {grupos.map(g => (
                  <div key={g.para ?? '-'}>
                    {(grupos.length > 1 || g.para) && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-tenue">{g.para ? `Para ${g.para}` : 'Otros productos'}</p>}
                    <ul className="space-y-1">
                      {g.lineas.map(item => (
                        <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-fondo px-2.5 py-1.5">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium">{item.product.name}</span>
                            <span className="block truncate text-[11px] text-tenue">x{item.quantity}{item.notes ? ` · ${item.notes}` : ''}</span>
                          </span>
                          <span className="shrink-0 text-xs font-bold tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {notasPedido.length > 0 && <p className="rounded-lg bg-acento-claro px-2.5 py-1.5 text-xs text-slate-900">{notasPedido.length} {notasPedido.length === 1 ? 'pendiente' : 'pendientes'} por cotizar (no se cobran ahora)</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="cupon" className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Ticket className="h-4 w-4 text-tenue" aria-hidden="true" /> Cupón de descuento</label>
                {cuponAplicado ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-eco-claro px-3 py-2 text-sm" role="status">
                    <span><Check className="mr-1 inline h-4 w-4 text-eco" aria-hidden="true" /><b>{cuponAplicado.codigo}</b> aplicado: −{cuponAplicado.porcentaje}%</span>
                    <button type="button" onClick={() => { setCupon(null); setCodigoCupon(''); }} className="text-sm font-semibold text-tenue underline hover:text-profe">Quitar</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input id="cupon" name="cupon" maxLength={LARGO.codigo} value={codigoCupon} onChange={e => { setCodigoCupon(e.target.value.toUpperCase()); setErrorCupon(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); aplicar(); } }}
                      aria-invalid={!!errorCupon || undefined} aria-describedby={errorCupon ? 'cupon-error' : undefined}
                      placeholder="Ej.: REGRESO10" autoComplete="off" className={`${claseCampo(errorCupon)} min-w-0 flex-1`} />
                    <button type="button" onClick={aplicar} className="min-h-11 shrink-0 rounded-xl border-2 border-grafito px-3 text-sm font-bold hover:bg-fondo">Aplicar</button>
                  </div>
                )}
                {errorCupon && <p id="cupon-error" className="mt-1 text-sm text-profe">{errorCupon}</p>}
              </div>

              <dl className="mb-4 space-y-2 border-t border-linea pt-3 text-sm">
                <div className="flex justify-between"><dt className="text-tenue">Subtotal</dt><dd className="font-bold tabular-nums">{formatPrice(total)}</dd></div>
                {ahorro > 0 && <div className="flex justify-between text-profe"><dt>Ofertas incluidas</dt><dd className="tabular-nums">−{formatPrice(ahorro)}</dd></div>}
                {cuponAplicado && <div className="flex justify-between text-eco"><dt>Cupón {cuponAplicado.codigo}</dt><dd className="font-semibold tabular-nums">−{formatPrice(descuento)}</dd></div>}
                <div className="flex flex-wrap justify-between"><dt className="text-tenue">Envío</dt><dd className="font-semibold tabular-nums">{envio === 0 ? 'Gratis' : formatPrice(envio)}</dd>
                  {envio > 0 && ajustes.envioGratisDesde != null && <dd className="w-full text-xs text-tenue">Envío gratis desde {formatPrice(ajustes.envioGratisDesde)}.</dd>}</div>
                <div className="flex justify-between border-t border-linea pt-2 text-lg"><dt className="font-bold">Total</dt><dd className="font-extrabold tabular-nums">{formatPrice(totalPagar)}</dd></div>
              </dl>
              <p className="mb-3 text-xs text-tenue">Entrega: <span className="font-semibold text-grafito">{fechaLarga(fechaElegida, true)}</span>, {franja}</p>

              <AceptoTerminos className="mb-3" checked={acepto} onChange={setAcepto}
                error={intentoAceptar && !acepto ? 'Debes aceptar los Términos y la Política de Privacidad.' : null} />
              {botonPagar('hidden w-full lg:flex')}

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-tenue">
                <FlaskConical className="h-3 w-3" aria-hidden="true" /> Modo prueba: no se cobra nada
              </div>
            </div>
          </aside>
        </form>
        {pasoPago && <ProcesandoPago paso={pasoPago} metodo={nombreMetodo[paymentMethod] ?? paymentMethod} onCerrar={() => setPasoPago(null)} />}
      </div>

      {/* Barra fija de pago en celular */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-papel/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-tenue">Total{envio > 0 ? ' con envío' : ', envío gratis'}</p>
            <p className="text-xl font-extrabold tabular-nums">{formatPrice(totalPagar)}</p>
          </div>
          {botonPagar('ml-auto flex shrink-0')}
        </div>
      </div>
    </div>
  );
}
