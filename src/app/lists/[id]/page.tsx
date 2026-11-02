'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listsApi, productsApi } from '@/services/api';
import { ListDetail, Product, SupplyItem } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import StatusBadge from '@/components/StatusBadge';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, MessageSquare, Check, X, Search, Package, Loader2, ShoppingBag, Minus, Plus, RotateCcw, Settings2, Repeat, Info, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Toast from '@/components/Toast';

type Tier = 'economico' | 'medio' | 'premium';

const TIERS: { id: Tier; label: string; hint: string }[] = [
  { id: 'economico', label: 'Económico', hint: 'Cumple la lista al menor precio' },
  { id: 'medio', label: 'Estándar', hint: 'La calidad que piden la mayoría de colegios' },
  { id: 'premium', label: 'Premium', hint: 'Marcas que duran todo el año' },
];

function tierProduct(item: SupplyItem, tier: Tier): Product | undefined {
  if (tier === 'economico') return item.productEconomico;
  if (tier === 'premium') return item.productPremium;
  return item.productMedio;
}

function currentTier(item: SupplyItem): Tier | null {
  const id = item.matchedProductId;
  if (!id) return null;
  if (item.productEconomicoId === id) return 'economico';
  if (item.productMedioId === id) return 'medio';
  if (item.productPremiumId === id) return 'premium';
  return null;
}

// ── Customization Panel ──
function CustomizePanel({ item, onUpdate, onClose }: {
  item: SupplyItem;
  onUpdate: (data: any) => void;
  onClose: () => void;
}) {
  const [forro, setForro] = useState(item.forro || false);
  const [forroColor, setForroColor] = useState(item.forroColor || '');
  const [etiqueta, setEtiqueta] = useState(item.etiqueta || '');
  const [etiquetaDibujo, setEtiquetaDibujo] = useState(item.etiquetaDibujo || false);
  const [caratula, setCaratula] = useState(item.caratula || false);
  const [caratulaCurso, setCaratulaCurso] = useState(item.caratulaCurso || '');
  const [datosEstudiante, setDatosEstudiante] = useState(item.datosEstudiante || '');
  const [notas, setNotas] = useState(item.userNotas || item.notas || '');

  const colors = ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Rosado', 'Celeste', 'Morado', 'Naranja', 'Transparente'];

  const handleSave = () => {
    onUpdate({ forro, forroColor: forro ? forroColor : null, etiqueta, etiquetaDibujo, caratula, caratulaCurso: caratula ? caratulaCurso : null, datosEstudiante, userNotas: notas });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-[20px] max-w-md w-full max-h-[85vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Personalizar</h3>
              <p className="text-xs text-neutral-400">{item.nombreOriginal}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Forro */}
          <div>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">Forro</span>
              <button onClick={() => setForro(!forro)}
                className={`w-10 h-6 rounded-full transition-colors duration-200 ${forro ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ml-1 ${forro ? 'translate-x-4' : ''}`} />
              </button>
            </label>
            {forro && (
              <div className="mt-3">
                <p className="text-xs text-neutral-400 mb-2">Color del forro</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <button key={c} onClick={() => setForroColor(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${forroColor === c ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Etiqueta */}
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Etiqueta</p>
            <div className="flex gap-2">
              {['Sin etiqueta', 'Con nombre', 'Con dibujo'].map(opt => (
                <button key={opt} onClick={() => {
                  setEtiqueta(opt === 'Sin etiqueta' ? '' : opt);
                  setEtiquetaDibujo(opt === 'Con dibujo');
                }}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    (opt === 'Sin etiqueta' && !etiqueta) || etiqueta === opt
                      ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Caratula */}
          <div>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">Caratula</span>
              <button onClick={() => setCaratula(!caratula)}
                className={`w-10 h-6 rounded-full transition-colors duration-200 ${caratula ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ml-1 ${caratula ? 'translate-x-4' : ''}`} />
              </button>
            </label>
            {caratula && (
              <input type="text" value={caratulaCurso} onChange={e => setCaratulaCurso(e.target.value)}
                placeholder="Nombre del curso (ej: Matematicas)"
                className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            )}
          </div>

          {/* Datos del estudiante */}
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Datos del estudiante</p>
            <textarea value={datosEstudiante} onChange={e => setDatosEstudiante(e.target.value)}
              placeholder="Nombre completo, grado, seccion..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>

          {/* Notas */}
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Observaciones</p>
            <textarea value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Alguna indicacion especial..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
        </div>

        <div className="p-5 border-t border-slate-100">
          <button onClick={handleSave}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-shadow flex items-center justify-center gap-2">
            <Check className="h-4 w-4" /> Guardar personalizacion
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Search Modal ──
function ProductModal({ item, onSave, onClose }: { item: SupplyItem; onSave: (productId: string, quantity: number) => void; onClose: () => void }) {
  const [query, setQuery] = useState(item.nombreDetectado || item.nombreOriginal);
  const [results, setResults] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(item.matchedProductId || null);
  const [quantity, setQuantity] = useState(item.userCustomQuantity || item.matchedQuantity || item.cantidad);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      try { const res = await productsApi.search(query); setResults(res); }
      catch {} finally { setLoading(false); }
    };
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [query]);

  const selected = results.find(p => p.id === selectedId);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-[20px] max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Seleccionar Producto</h2>
              <p className="text-xs text-neutral-400">Para: {item.nombreOriginal}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="h-4 w-4" /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 animate-spin" />}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {results.length === 0 && query && !loading ? (
            <div className="text-center py-8">
              <Package className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-400">Sin resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {results.map(p => (
                <button key={p.id} onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                  className={`text-left rounded-[16px] border-2 overflow-hidden transition-all ${selectedId === p.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100 hover:border-slate-300'}`}>
                  <div className="aspect-square bg-slate-50 relative flex items-center justify-center">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="h-8 w-8 text-neutral-300" />}
                    {selectedId === p.id && <div className="absolute top-2 right-2 p-0.5 bg-blue-500 rounded-full"><Check className="h-3 w-3 text-white" /></div>}
                    {p.tier && (
                      <span className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        p.tier === 'premium' ? 'bg-amber-100 text-amber-700' : p.tier === 'economico' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{p.tier}</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-slate-900 line-clamp-2">{p.name}</p>
                    <p className="text-[10px] text-neutral-400">{p.brand}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-bold text-slate-900">{formatPrice(p.basePrice)}</p>
                      <div className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-neutral-400">{p.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selected && (
              <>
                <span className="text-xs text-neutral-400">Cantidad:</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 h-6 rounded-full border border-blue-500 text-blue-500 flex items-center justify-center text-xs">-</button>
                  <span className="w-5 text-center text-sm font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">+</button>
                </div>
                <span className="text-sm font-bold text-slate-900">{formatPrice(selected.basePrice * quantity)}</span>
              </>
            )}
          </div>
          <button onClick={() => selectedId && onSave(selectedId, quantity)} disabled={!selectedId}
            className="bg-blue-500 text-white px-5 py-2 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-1.5 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            <Check className="h-3.5 w-3.5" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Observations Box ──
function ObservationBox({ listId, existing, onSaved }: { listId: string; existing?: string; onSaved: () => void }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await listsApi.addObservacion(listId, text.trim());
      setText('');
      onSaved();
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mb-4">
      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4 text-blue-500" /> Observaciones
      </h3>
      {existing && (
        <div className="bg-slate-50 rounded-xl p-3 mb-3 text-xs text-slate-600 whitespace-pre-line max-h-32 overflow-y-auto">
          {existing.trim()}
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Escribe una observacion o correccion..."
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        <button onClick={handleSend} disabled={!text.trim() || sending}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
          Enviar
        </button>
      </div>
      <p className="text-[10px] text-neutral-400 mt-1">Si hay un error en la lista, escribe aqui y lo corregiremos</p>
    </div>
  );
}

// ── Mientras la IA lee la lista ──
function LeyendoLista({ imageUrl, startedAt, onTimeout }: { imageUrl?: string; startedAt: number; onTimeout: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const seg = Math.floor((now - startedAt) / 1000);
  const paso = seg < 12 ? 'Leyendo cada línea de la lista…' : seg < 35 ? 'Buscando cada útil en nuestro catálogo…' : 'Calculando las opciones económica, estándar y premium…';
  const primera = imageUrl?.split('|').find(u => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u));

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-[minmax(0,380px)_1fr] md:gap-10 md:py-12">
      <div className="relative order-2 mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-linea bg-papel sombra-hoja md:order-1">
        {primera
          ? <img src={primera} alt="Tu lista de útiles" className="max-h-[520px] w-full object-contain" />
          : <div className="papel-rayado h-[420px]" />}
        <div aria-hidden="true" className="animate-escaneo absolute inset-x-0 h-1 bg-lapiz shadow-[0_0_24px_6px_rgba(255,198,41,0.55)]" />
      </div>
      <div aria-live="polite" className="order-1 md:order-2">
        <h1 className="text-4xl font-extrabold tracking-[-0.03em]">Estamos leyendo tu lista</h1>
        <p className="mt-3 text-lg text-tenue">{onTimeout ? 'Está tardando más de lo normal. Recarga la página en un momento.' : paso}</p>
        <p className="mt-6 max-w-md text-sm text-tenue">
          Suele tomar menos de un minuto. Puedes cerrar esta página: la lista queda guardada en{' '}
          <Link href="/my-lists" className="font-semibold text-tinta underline underline-offset-2">Mis listas</Link>.
        </p>
      </div>
    </div>
  );
}

// ── La lectura falló o se hará a mano ──
function SinLectura({ estado, mensaje, onRetry, retrying }: { estado?: string | null; mensaje?: string; onRetry: () => void; retrying: boolean }) {
  const error = estado === 'ERROR';
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${error ? 'bg-profe-claro text-profe' : 'bg-tinta-claro text-tinta'}`}>
        <Info className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight">{error ? 'No pudimos leer la lista' : 'Tu lista está en revisión'}</h1>
      <p className="mt-3 text-tenue">{mensaje || 'Nuestro equipo la revisará y te avisaremos cuando esté armada.'}</p>
      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        {error && (
          <button onClick={onRetry} disabled={retrying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-tinta px-5 py-3 font-bold text-white hover:bg-tinta-oscuro disabled:opacity-50">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Intentar de nuevo
          </button>
        )}
        <Link href="/upload" className="rounded-xl border-2 border-grafito px-5 py-3 font-bold hover:bg-fondo">Subir otra foto</Link>
      </div>
    </div>
  );
}

// ── Un útil de la lista ──
function FilaUtil({ item, qty, onQty, onTier, onExclude, onChange, onCustomize }: {
  item: SupplyItem;
  qty: number;
  onQty: (q: number) => void;
  onTier: (t: Tier) => void;
  onExclude: () => void;
  onChange: () => void;
  onCustomize: () => void;
}) {
  const product = item.matchedProduct;
  const tier = currentTier(item);
  const opciones = TIERS.map(t => ({ ...t, product: tierProduct(item, t.id) }));
  const hayOpciones = opciones.some(o => o.product);
  const personalizado = item.forro || item.etiqueta || item.caratula;
  const nota = item.userNotas || item.notas;

  return (
    <li className="grid grid-cols-[28px_1fr] gap-x-3 border-b border-linea py-5 last:border-b-0">
      <button onClick={onExclude} aria-label={`Ya tengo: ${item.nombreOriginal}`} title="Ya lo tengo"
        className="mt-1 flex h-6 w-6 items-center justify-center rounded-md border-2 border-tinta bg-tinta text-white hover:bg-tinta-oscuro">
        <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
      </button>

      <div className="min-w-0">
        <p className="font-mano text-[1.6rem] leading-tight text-tinta">{item.nombreOriginal}</p>
        {nota && <p className="mt-0.5 text-sm text-tenue">{nota}</p>}

        {hayOpciones ? (
          <div role="radiogroup" aria-label={`Nivel para ${item.nombreOriginal}`} className="mt-3 grid grid-cols-3 gap-1.5 sm:max-w-md">
            {opciones.map(o => {
              const activo = tier === o.id;
              return (
                <button key={o.id} role="radio" aria-checked={activo} disabled={!o.product} onClick={() => onTier(o.id)}
                  className={`rounded-lg border-2 px-2 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                    activo ? 'border-tinta bg-tinta-claro' : 'border-linea bg-papel hover:border-tenue'
                  }`}>
                  <span className={`block text-xs font-semibold ${activo ? 'text-tinta' : 'text-tenue'}`}>{o.label}</span>
                  <span className="block text-sm font-bold tabular-nums">{o.product ? formatPrice(o.product.basePrice) : 'No hay'}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {product ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-linea bg-papel">
              {product.imageUrl
                ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center"><Package className="h-5 w-5 text-linea" aria-hidden="true" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.95rem] font-semibold">{product.name}</p>
              <p className="truncate text-sm text-tenue">{[product.brand, tier ? null : 'Elegido por ti'].filter(Boolean).join(', ')}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-lapiz-claro px-3 py-2 text-sm text-grafito">
            Aún no tenemos este útil. <button onClick={onChange} className="font-semibold text-tinta underline underline-offset-2">Buscar en el catálogo</button>
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center rounded-lg border border-linea bg-papel" aria-label="Cantidad">
            <button onClick={() => onQty(Math.max(1, qty - 1))} className="p-2 text-grafito hover:text-tinta" aria-label="Uno menos"><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center font-bold tabular-nums">{qty}</span>
            <button onClick={() => onQty(Math.min(99, qty + 1))} className="p-2 text-grafito hover:text-tinta" aria-label="Uno más"><Plus className="h-4 w-4" /></button>
          </div>
          <button onClick={onChange} className="inline-flex items-center gap-1.5 text-sm font-semibold text-tinta hover:underline">
            <Repeat className="h-3.5 w-3.5" aria-hidden="true" /> Cambiar producto
          </button>
          <button onClick={onCustomize} className="inline-flex items-center gap-1.5 text-sm font-semibold text-tinta hover:underline">
            <Settings2 className="h-3.5 w-3.5" aria-hidden="true" /> Forro y etiqueta
          </button>
          <span className="ml-auto text-lg font-extrabold tabular-nums">{product ? formatPrice(product.basePrice * qty) : ''}</span>
        </div>

        {personalizado && (
          <p className="mt-2 text-sm text-tenue">
            {[item.forro && `Forro ${item.forroColor?.toLowerCase() || ''}`.trim(), item.etiqueta && `Etiqueta ${item.etiqueta.toLowerCase()}`, item.caratula && `Carátula ${item.caratulaCurso || ''}`.trim()]
              .filter(Boolean).join('. ')}
          </p>
        )}
      </div>
    </li>
  );
}

// ── Página ──
export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [data, setData] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [customizingItem, setCustomizingItem] = useState<SupplyItem | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [pollStart] = useState(() => Date.now());
  const qtyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadList = useCallback(async () => {
    try {
      const result: ListDetail = await listsApi.getById(id);
      setData(result);
      setLocalQty(prev => {
        const next: Record<string, number> = {};
        result.items.forEach(i => { next[i.id] = prev[i.id] ?? (i.userCustomQuantity || i.matchedQuantity || i.cantidad); });
        return next;
      });
      setStudentName(n => n || result.list.estudianteNombre || '');
      setStudentGrade(g => g || result.list.estudianteGrado || '');
      return result;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadList(); }, [loadList]);

  // Mientras la IA lee la lista, consultar cada 3 s (hasta 4 minutos)
  const procesando = data?.list.iaEstado === 'PROCESANDO';
  const [agotado, setAgotado] = useState(false);
  useEffect(() => {
    if (!procesando || agotado) return;
    const t = setInterval(() => { loadList(); }, 3000);
    const limite = setTimeout(() => setAgotado(true), 4 * 60 * 1000);
    return () => { clearInterval(t); clearTimeout(limite); };
  }, [procesando, agotado, loadList]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  const patchItem = (itemId: string, patch: Partial<SupplyItem>) =>
    setData(d => d ? { ...d, items: d.items.map(i => i.id === itemId ? { ...i, ...patch } : i) } : d);

  const getQty = (item: SupplyItem) => localQty[item.id] ?? (item.userCustomQuantity || item.matchedQuantity || item.cantidad);

  const setQty = (item: SupplyItem, q: number) => {
    setLocalQty(prev => ({ ...prev, [item.id]: q }));
    clearTimeout(qtyTimers.current[item.id]);
    qtyTimers.current[item.id] = setTimeout(() => {
      listsApi.updateItem(id, item.id, { userCustomQuantity: q }).catch(() => {});
    }, 700);
  };

  const elegirNivel = async (item: SupplyItem, tier: Tier) => {
    const p = tierProduct(item, tier);
    if (!p) return;
    const antes = { matchedProductId: item.matchedProductId, matchedProduct: item.matchedProduct, priceAtMatch: item.priceAtMatch };
    patchItem(item.id, { matchedProductId: p.id, matchedProduct: p, priceAtMatch: p.basePrice });
    try {
      await listsApi.updateItem(id, item.id, { productId: p.id });
    } catch {
      patchItem(item.id, antes);
      showToast('No se pudo cambiar el producto', 'error');
    }
  };

  const elegirNivelTodo = async (tier: Tier) => {
    if (!data) return;
    setData({
      ...data,
      list: { ...data.list, plan: tier },
      items: data.items.map(i => {
        const p = tierProduct(i, tier);
        return p ? { ...i, matchedProductId: p.id, matchedProduct: p, priceAtMatch: p.basePrice } : i;
      }),
    });
    setSavingPlan(true);
    try {
      await listsApi.updatePlan(id, { plan: tier, estudianteNombre: studentName, estudianteGrado: studentGrade, aplicarATodos: true });
    } catch {
      showToast('No se pudo guardar el nivel', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleSaveProduct = async (productId: string, quantity: number) => {
    if (!editingItem) return;
    try {
      await listsApi.updateItem(id, editingItem.id, { productId, userCustomQuantity: quantity });
      setLocalQty(prev => ({ ...prev, [editingItem.id]: quantity }));
      await loadList();
      setEditingItem(null);
      showToast('Producto cambiado');
    } catch { showToast('No se pudo guardar', 'error'); }
  };

  const handleSaveCustomization = async (itemData: Partial<SupplyItem>) => {
    if (!customizingItem) return;
    try {
      await listsApi.updateItem(id, customizingItem.id, itemData);
      patchItem(customizingItem.id, itemData);
      setCustomizingItem(null);
      showToast('Forro y etiqueta guardados');
    } catch { showToast('No se pudo guardar', 'error'); }
  };

  const reintentar = async () => {
    setRetrying(true);
    try {
      await listsApi.reprocess(id);
      await loadList();
    } catch { showToast('No se pudo reintentar', 'error'); }
    finally { setRetrying(false); }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-tinta" /></div>;
  if (!data) return <div className="py-20 text-center"><h1 className="text-2xl font-bold">No encontramos esta lista</h1><Link href="/my-lists" className="mt-4 inline-block font-semibold text-tinta">Ver mis listas</Link></div>;

  const isOwner = !!user && data.list.userId === user.id;
  const isApproved = data.list.estado === 'VALIDADA' || data.list.estado === 'PROCESADA';
  if (!isApproved && !isOwner && user?.role !== 'ADMIN') {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Lista en revisión</h1>
        <p className="mt-2 text-tenue">Esta lista todavía no fue aprobada.</p>
      </div>
    );
  }

  if (procesando) return <LeyendoLista imageUrl={data.list.imageUrl} startedAt={pollStart} onTimeout={agotado} />;
  if (data.items.length === 0 && (data.list.iaEstado === 'ERROR' || data.list.iaEstado === 'MANUAL')) {
    return <SinLectura estado={data.list.iaEstado} mensaje={data.list.iaMensaje} onRetry={reintentar} retrying={retrying} />;
  }

  const incluidos = data.items.filter(i => !excluidos.has(i.id));
  const quitados = data.items.filter(i => excluidos.has(i.id));
  const conProducto = incluidos.filter(i => i.matchedProduct);
  const total = conProducto.reduce((s, i) => s + i.matchedProduct!.basePrice * getQty(i), 0);
  const totalNivel = (tier: Tier) => incluidos.reduce((s, i) => {
    const p = tierProduct(i, tier) ?? i.matchedProduct;
    return s + (p ? p.basePrice * getQty(i) : 0);
  }, 0);
  const hayNiveles = data.items.some(i => i.productEconomicoId || i.productMedioId || i.productPremiumId);
  const nivelGlobal = (TIERS.find(t => incluidos.length > 0 && incluidos.every(i => !tierProduct(i, t.id) || currentTier(i) === t.id))?.id) ?? null;
  const imagenes = (data.list.imageUrl || '').split('|').filter(Boolean);

  const agregarAlCarrito = () => {
    if (conProducto.length === 0) { showToast('No hay útiles con producto para agregar', 'error'); return; }
    conProducto.forEach(i => addItem(i.matchedProduct!, getQty(i), i.userNotas || i.notas, i));
    router.push('/cart');
  };

  return (
    <div className="pb-32">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        {/* La lista original, para comparar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-tenue hover:text-grafito">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight">{data.list.schoolName}</h1>
          <p className="text-tenue">{data.list.gradeName}, {data.list.year}</p>
          <div className="mt-2"><StatusBadge status={data.list.estado} size="sm" /></div>

          {imagenes.length > 0 && (
            <div className="mt-5 flex gap-2 overflow-x-auto lg:flex-col">
              {imagenes.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noreferrer"
                  className="block shrink-0 overflow-hidden rounded-xl border border-linea bg-papel sombra-hoja">
                  {/\.(pdf|docx?)(\?|$)/i.test(url)
                    ? <span className="flex h-24 w-40 items-center justify-center text-sm font-semibold text-tinta">Archivo {i + 1}</span>
                    : <img src={url} alt={`Hoja ${i + 1} de la lista original`} className="max-h-72 w-40 object-contain lg:max-h-[420px] lg:w-full" />}
                </a>
              ))}
            </div>
          )}

          {data.list.iaMensaje && (
            <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${data.list.iaEstado === 'DEMO' ? 'bg-lapiz-claro text-grafito' : 'bg-tinta-claro text-tinta'}`}>
              {data.list.iaMensaje}
            </p>
          )}
        </aside>

        <div>
          {/* Nivel para toda la lista */}
          {hayNiveles && (
            <section aria-labelledby="nivel" className="rounded-2xl border border-linea bg-papel p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 id="nivel" className="font-bold">Lleva toda la lista en</h2>
                {savingPlan && <Loader2 className="h-4 w-4 animate-spin text-tinta" aria-label="Guardando" />}
              </div>
              <div role="radiogroup" aria-labelledby="nivel" className="mt-3 grid grid-cols-3 gap-2">
                {TIERS.map(t => {
                  const activo = nivelGlobal === t.id;
                  return (
                    <button key={t.id} role="radio" aria-checked={activo} onClick={() => elegirNivelTodo(t.id)} title={t.hint}
                      className={`rounded-xl border-2 p-3 text-left transition-colors ${activo ? 'border-tinta bg-tinta text-white' : 'border-linea hover:border-tenue'}`}>
                      <span className={`block text-sm font-semibold ${activo ? 'text-white/85' : 'text-tenue'}`}>{t.label}</span>
                      <span className="block text-lg font-extrabold tabular-nums sm:text-xl">{formatPrice(totalNivel(t.id))}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-tenue">También puedes elegir el nivel útil por útil.</p>
            </section>
          )}

          {/* Útiles */}
          <section aria-labelledby="utiles" className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 id="utiles" className="text-2xl font-extrabold tracking-tight">Tu lista</h2>
              <p className="text-sm text-tenue">Desmarca lo que ya tienes</p>
            </div>
            <ul className="mt-2 rounded-2xl border border-linea bg-papel px-4 sm:px-5">
              {incluidos.map(item => (
                <FilaUtil key={item.id} item={item} qty={getQty(item)}
                  onQty={q => setQty(item, q)}
                  onTier={t => elegirNivel(item, t)}
                  onExclude={() => setExcluidos(prev => new Set(prev).add(item.id))}
                  onChange={() => setEditingItem(item)}
                  onCustomize={() => setCustomizingItem(item)} />
              ))}
              {incluidos.length === 0 && <li className="py-8 text-center text-tenue">Quitaste todos los útiles de la lista.</li>}
            </ul>

            {quitados.length > 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-linea p-4 sm:p-5">
                <h3 className="font-bold">Ya los tengo ({quitados.length})</h3>
                <ul className="mt-2 divide-y divide-linea">
                  {quitados.map(item => (
                    <li key={item.id} className="flex items-center gap-3 py-2">
                      <span className="flex-1 truncate font-mano text-xl text-tenue line-through decoration-profe/60">{item.nombreOriginal}</span>
                      <button onClick={() => setExcluidos(prev => { const n = new Set(prev); n.delete(item.id); return n; })}
                        className="shrink-0 text-sm font-semibold text-tinta hover:underline">Volver a agregar</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Datos para etiquetas */}
          <section aria-labelledby="estudiante" className="mt-6 rounded-2xl border border-linea bg-papel p-4 sm:p-5">
            <h2 id="estudiante" className="font-bold">Datos para las etiquetas</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm text-tenue">Nombre del estudiante</span>
                <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
                  onBlur={() => listsApi.updatePlan(id, { plan: data.list.plan || nivelGlobal || 'medio', estudianteNombre: studentName, estudianteGrado: studentGrade, aplicarATodos: false }).catch(() => {})}
                  placeholder="Nombre y apellidos"
                  className="w-full rounded-xl border border-linea px-3 py-2.5 focus:border-tinta focus:outline-none" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-tenue">Grado y sección</span>
                <input type="text" value={studentGrade} onChange={e => setStudentGrade(e.target.value)}
                  onBlur={() => listsApi.updatePlan(id, { plan: data.list.plan || nivelGlobal || 'medio', estudianteNombre: studentName, estudianteGrado: studentGrade, aplicarATodos: false }).catch(() => {})}
                  placeholder="Ej.: 3.º B"
                  className="w-full rounded-xl border border-linea px-3 py-2.5 focus:border-tinta focus:outline-none" />
              </label>
            </div>
          </section>

          <div className="mt-6">
            <ObservationBox listId={id} existing={data.list.userObservaciones} onSaved={() => loadList()} />
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-papel/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm text-tenue">
              {conProducto.length} de {data.items.length} útiles{quitados.length > 0 ? `, ${quitados.length} ya los tienes` : ''}
            </p>
            <p className="text-2xl font-extrabold tabular-nums">{formatPrice(total)}</p>
          </div>
          <button onClick={agregarAlCarrito} disabled={conProducto.length === 0}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-lapiz px-5 py-3.5 font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-lapiz-oscuro disabled:opacity-40 sm:px-7">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Agregar al carrito
          </button>
        </div>
      </div>

      {editingItem && <ProductModal item={editingItem} onSave={handleSaveProduct} onClose={() => setEditingItem(null)} />}
      {customizingItem && <CustomizePanel item={customizingItem} onUpdate={handleSaveCustomization} onClose={() => setCustomizingItem(null)} />}
    </div>
  );
}
