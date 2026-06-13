'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { listsApi, productsApi } from '@/services/api';
import { ListDetail, Product, SupplyItem } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import StatusBadge from '@/components/StatusBadge';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Edit2, MessageSquare, Check, X, Search, Package, Loader2, ChevronRight, Star, ShoppingCart, Minus, Plus, Sparkles, Crown, Coins, Settings2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Toast from '@/components/Toast';

// ── Plan Selector ──
function PlanSelector({ currentPlan, onSelect }: { currentPlan: string; onSelect: (plan: string) => void }) {
  const plans = [
    { id: 'economico', label: 'Economico', icon: Coins, desc: 'Productos basicos, mejor precio', color: 'border-green-500 bg-green-50', active: 'border-green-500 bg-green-500 text-white', badge: '$' },
    { id: 'medio', label: 'Estandar', icon: Star, desc: 'Buena calidad, precio justo', color: 'border-blue-500 bg-blue-50', active: 'border-blue-500 bg-blue-500 text-white', badge: '$$' },
    { id: 'premium', label: 'Premium', icon: Crown, desc: 'Las mejores marcas', color: 'border-amber-500 bg-amber-50', active: 'border-amber-500 bg-amber-500 text-white', badge: '$$$' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {plans.map(p => {
        const Icon = p.icon;
        const selected = currentPlan === p.id;
        return (
          <button key={p.id} onClick={() => onSelect(p.id)}
            className={`p-4 rounded-[20px] border-2 text-left transition-all duration-200 ${selected ? p.active : `${p.color} border-slate-200 hover:${p.color}`}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-5 w-5 ${selected ? 'text-white' : ''}`} />
              <span className={`text-sm font-bold ${selected ? 'text-white' : 'text-slate-900'}`}>{p.label}</span>
            </div>
            <p className={`text-xs ${selected ? 'text-white/80' : 'text-neutral-400'}`}>{p.desc}</p>
            <p className={`text-lg font-bold mt-1 ${selected ? 'text-white' : 'text-slate-900'}`}>{p.badge}</p>
          </button>
        );
      })}
    </div>
  );
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

// ── Main Page ──
export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [data, setData] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [customizingItem, setCustomizingItem] = useState<SupplyItem | null>(null);
  const [plan, setPlan] = useState('medio');
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadList(); }, [id]);

  const loadList = async () => {
    try {
      const result = await listsApi.getById(id);
      setData(result);
      const qtys: Record<string, number> = {};
      result.items.forEach((i: SupplyItem) => { qtys[i.id] = i.userCustomQuantity || i.matchedQuantity || i.cantidad; });
      setLocalQty(qtys);
      if (result.list.plan) setPlan(result.list.plan);
      if (result.list.estudianteNombre) setStudentName(result.list.estudianteNombre);
      if (result.list.estudianteGrado) setStudentGrade(result.list.estudianteGrado);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePlanChange = async (newPlan: string) => {
    setPlan(newPlan);
    setSaving(true);
    try {
      await listsApi.updatePlan(id, { plan: newPlan, estudianteNombre: studentName, estudianteGrado: studentGrade });
      await loadList();
      showToast(`Plan cambiado a ${newPlan}`, 'success');
    } catch { showToast('Error al cambiar plan', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveProduct = async (productId: string, quantity: number) => {
    if (!editingItem) return;
    try {
      await listsApi.updateItem(id, editingItem.id, { productId, cantidad: quantity, userCustomQuantity: quantity });
      await loadList();
      setEditingItem(null);
      showToast('Producto actualizado', 'success');
    } catch { showToast('Error al guardar', 'error'); }
  };

  const handleSaveCustomization = async (itemData: any) => {
    if (!customizingItem) return;
    try {
      await listsApi.updateItem(id, customizingItem.id, itemData);
      await loadList();
      setCustomizingItem(null);
      showToast('Personalizacion guardada', 'success');
    } catch { showToast('Error al guardar', 'error'); }
  };

  const getQty = (item: SupplyItem) => localQty[item.id] || item.userCustomQuantity || item.matchedQuantity || item.cantidad;

  const addAllToCart = () => {
    if (!data) return;
    const assigned = visibleItems.filter(i => i.matchedProduct);
    if (assigned.length === 0) { showToast('No hay productos', 'error'); return; }
    assigned.forEach(item => addItem(item.matchedProduct!, getQty(item), item.userNotas || item.notas, item));
    router.push('/cart');
  };

  const addOneToCart = (item: SupplyItem) => {
    if (!item.matchedProduct) return;
    addItem(item.matchedProduct, getQty(item), item.userNotas || item.notas, item);
    showToast(`${item.matchedProduct.name} agregado`, 'success');
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center py-12"><h2 className="text-lg font-bold text-slate-900">Lista no encontrada</h2></div>;

  // Block access if list is not approved (unless it's the owner viewing their own pending list)
  const isOwner = user && data.list.userId === user.id;
  const isApproved = data.list.estado === 'VALIDADA' || data.list.estado === 'PROCESADA';
  if (!isApproved && !isOwner && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-sky-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Lista en revision</h2>
          <p className="text-neutral-400 text-sm">Esta lista aun no ha sido aprobada.</p>
        </div>
      </div>
    );
  }

  const visibleItems = data.items.filter(i => !hiddenItems.has(i.id));
  const totalEstimado = visibleItems.reduce((s, i) => s + ((i.priceAtMatch || 0) * getQty(i)), 0);
  const matchedCount = visibleItems.filter(i => i.matchedProduct).length;
  const hasCustomizations = visibleItems.some(i => i.forro || i.etiqueta || i.caratula);

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-neutral-400 hover:text-slate-700 mb-4 text-sm">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        {/* Header */}
        <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mb-4">
          {data.list.imageUrl && (
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {data.list.imageUrl.split('|').map((url: string, i: number) => (
                <div key={i} className="rounded-xl overflow-hidden bg-slate-50 max-h-64 flex-shrink-0">
                  <img src={url} alt={`Foto ${i + 1}`} className="max-h-64 object-contain" />
                </div>
              ))}
            </div>
          )}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">{data.list.schoolName}</h1>
              <p className="text-sm text-neutral-400">{data.list.gradeName} - {data.list.year}</p>
            </div>
            <StatusBadge status={data.list.estado} size="lg" />
          </div>
        </div>

        {/* Plan Selector */}
        <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-bold text-slate-900">Elige tu plan</h2>
            </div>
            {saving && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
          </div>
          <PlanSelector currentPlan={plan} onSelect={handlePlanChange} />

          {/* Student info */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Nombre del estudiante</label>
              <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
                onBlur={() => listsApi.updatePlan(id, { plan, estudianteNombre: studentName, estudianteGrado: studentGrade })}
                placeholder="Nombre completo"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Grado / Seccion</label>
              <input type="text" value={studentGrade} onChange={e => setStudentGrade(e.target.value)}
                onBlur={() => listsApi.updatePlan(id, { plan, estudianteNombre: studentName, estudianteGrado: studentGrade })}
                placeholder="Ej: 3ro B"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-4">
          {data.items.filter(item => !hiddenItems.has(item.id)).map((item) => {
            const customized = item.forro || item.etiqueta || item.caratula;
            return (
              <div key={item.id} className={`bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden ${
                item.matchedProduct ? 'border-l-[3px] border-l-green-500' : 'border-l-[3px] border-l-orange-400'
              }`}>
                <div className="p-4">
                  <div className="flex gap-3">
                    {/* Product image */}
                    <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setEditingItem(item)}>
                      {item.matchedProduct?.imageUrl ? (
                        <img src={item.matchedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-neutral-300" /></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-xs text-neutral-400">{item.nombreOriginal}</p>
                          {item.matchedProduct ? (
                            <p className="text-sm font-medium text-slate-900 truncate">{item.matchedProduct.name}</p>
                          ) : (
                            <button onClick={() => setEditingItem(item)} className="text-sm text-blue-500 font-medium flex items-center gap-1">
                              <Search className="h-3 w-3" /> Buscar producto
                            </button>
                          )}
                          {item.matchedProduct && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-neutral-400">{item.matchedProduct.brand}</span>
                              {item.matchedProduct.tier && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                  item.matchedProduct.tier === 'premium' ? 'bg-amber-100 text-amber-700' :
                                  item.matchedProduct.tier === 'economico' ? 'bg-green-100 text-green-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>{item.matchedProduct.tier}</span>
                              )}
                              {item.matchedProduct.rating && (
                                <span className="flex items-center gap-0.5 text-[10px] text-neutral-400">
                                  <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" /> {item.matchedProduct.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Price + quantity always visible */}
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setLocalQty(prev => ({ ...prev, [item.id]: Math.max(1, getQty(item) - 1) }))}
                              className="w-7 h-7 rounded-full border border-blue-500 text-blue-500 flex items-center justify-center text-xs hover:bg-blue-50">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{getQty(item)}</span>
                            <button onClick={() => setLocalQty(prev => ({ ...prev, [item.id]: getQty(item) + 1 }))}
                              className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs hover:shadow-md">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-slate-900 min-w-[60px] text-right">
                            {item.priceAtMatch ? formatPrice(item.priceAtMatch * getQty(item)) : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Customization badges */}
                      {customized && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.forro && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Forro {item.forroColor}</span>}
                          {item.etiqueta && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium">{item.etiqueta}</span>}
                          {item.caratula && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Caratula {item.caratulaCurso}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                    <button onClick={() => setEditingItem(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100">
                      <Edit2 className="h-3 w-3" /> Cambiar
                    </button>
                    <button onClick={() => setCustomizingItem(item)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                        customized ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                      }`}>
                      <Settings2 className="h-3 w-3" /> Personalizar
                    </button>
                    <button onClick={() => setHiddenItems(prev => new Set([...prev, item.id]))}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-400 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors border border-red-100">
                      <X className="h-3 w-3" /> Quitar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hidden items restore */}
        {hiddenItems.size > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-4 mb-4 flex items-center justify-between">
            <p className="text-sm text-orange-700">{hiddenItems.size} producto{hiddenItems.size > 1 ? 's' : ''} quitado{hiddenItems.size > 1 ? 's' : ''} de tu lista</p>
            <button onClick={() => setHiddenItems(new Set())}
              className="text-xs font-medium text-orange-600 hover:text-orange-800 px-3 py-1.5 bg-white rounded-lg border border-orange-200">
              Restaurar todos
            </button>
          </div>
        )}

        {/* Observations */}
        <ObservationBox listId={id} existing={data.list.userObservaciones} onSaved={() => loadList()} />

        {/* Bottom Summary */}
        <div className="bg-white rounded-[30px] shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)] p-4 md:p-6 sticky bottom-4">
          <div className="text-center mb-3">
            <p className="text-xs text-neutral-400">
              {matchedCount}/{visibleItems.length} productos
              {hiddenItems.size > 0 && <span className="text-orange-500"> ({hiddenItems.size} quitados)</span>}
            </p>
            <p className="text-2xl font-bold text-slate-900">{formatPrice(totalEstimado)}</p>
          </div>
          <button onClick={addAllToCart} disabled={matchedCount === 0}
            className="w-full bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            <ShoppingCart className="h-4 w-4" /> Agregar todo al carrito
          </button>
          {studentName && (
            <p className="text-xs text-neutral-400 border-t border-slate-100 pt-3">
              Estudiante: <span className="text-slate-700 font-medium">{studentName}</span>
              {studentGrade && <> - {studentGrade}</>}
              {' '} | Plan: <span className="text-blue-500 font-medium capitalize">{plan}</span>
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      {editingItem && <ProductModal item={editingItem} onSave={handleSaveProduct} onClose={() => setEditingItem(null)} />}
      {customizingItem && <CustomizePanel item={customizingItem} onUpdate={handleSaveCustomization} onClose={() => setCustomizingItem(null)} />}
    </div>
  );
}
