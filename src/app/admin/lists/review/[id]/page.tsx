'use client';

import { ErrorCampo } from '@/components/form/Campo';
import { LARGO } from '@/lib/validar';
import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { listsApi, productsApi, schoolsApi } from '@/services/api';
import { Grade, ListDetail, Product, School, SupplyItem } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { parseExtras } from '@/lib/lista';
import StatusBadge from '@/components/StatusBadge';
import { ArrowLeft, Check, AlertTriangle, RefreshCw, Search, Plus, Trash2, X, Eye, Coins, Star, Crown, Package, FileText, Save, Ban, RotateCcw, Award, Pencil, ZoomIn, ZoomOut, Sparkles, MessageSquare, BookOpen, Tag, Layers } from 'lucide-react';
import { Modal, añoEscolar, añosElegibles, campo, nombreNivel, useAvisos } from '../../../_ui';

const TIERS = [
  { id: 'economico', label: nombreNivel('economico'), icon: Coins, color: 'green', updateKey: 'ProductEconomicoId' },
  { id: 'medio', label: nombreNivel('medio'), icon: Star, color: 'blue', updateKey: 'ProductMedioId' },
  { id: 'premium', label: nombreNivel('premium'), icon: Crown, color: 'amber', updateKey: 'ProductPremiumId' },
] as const;

type Decision = 'OBSERVADA' | 'RECHAZADA' | 'VALIDADA';

function TierBadge({ tier }: { tier?: string }) {
  const t = TIERS.find(t => t.id === tier);
  if (!t) return null;
  const colors: Record<string, string> = { green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700' };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${colors[t.color]}`}>{t.label}</span>;
}

// Local editable item for the Items tab
interface EditableItem {
  id: string;
  nombreOriginal: string;
  cantidad: number;
  notas: string;
  isNew?: boolean;
}

export default function ReviewListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const avisos = useAvisos();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [textoObs, setTextoObs] = useState('');
  const [errorObs, setErrorObs] = useState<string | null>(null);
  const [oficial, setOficial] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [colegios, setColegios] = useState<School[]>([]);
  const [grados, setGrados] = useState<Grade[]>([]);
  const [corr, setCorr] = useState({ schoolId: '', gradeId: '', year: añoEscolar() });
  const [data, setData] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'economico' | 'medio' | 'premium'>('items');

  // Local state for items tab - edits stay local until Save
  const [localItems, setLocalItems] = useState<EditableItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Search
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewTier, setPreviewTier] = useState('medio');

  const loadList = useCallback(() =>
    listsApi.getById(id)
      .then(result => {
        setData(result);
        setLocalItems(result.items.map((i: SupplyItem) => ({
          id: i.id, nombreOriginal: i.nombreOriginal, cantidad: i.cantidad, notas: i.notas || '',
        })));
        setHasChanges(false);
        setDeletedIds([]);
      })
      .catch(err => avisos.error(err, 'No pudimos cargar la lista'))
      .finally(() => setLoading(false)), [id, avisos]);

  useEffect(() => { loadList(); }, [loadList]);

  // --- Items tab: local edits ---
  const updateLocal = (idx: number, field: string, value: string | number) => {
    setLocalItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    setHasChanges(true);
  };

  const addLocalItem = () => {
    setLocalItems(prev => [...prev, { id: `new-${Date.now()}`, nombreOriginal: '', cantidad: 1, notas: '', isNew: true }]);
    setHasChanges(true);
  };

  const removeLocalItem = (idx: number) => {
    const item = localItems[idx];
    if (!item.isNew) setDeletedIds(prev => [...prev, item.id]);
    setLocalItems(prev => prev.filter((_, i) => i !== idx));
    setHasChanges(true);
  };

  const saveItems = async () => {
    if (saving) return;
    const vacio = localItems.findIndex(it => !it.isNew && !it.nombreOriginal.trim());
    if (vacio >= 0) { avisos.error(null, `Escribe el nombre del útil ${vacio + 1} o quítalo.`); return; }
    setSaving(true);
    try {
      // Delete removed items
      for (const delId of deletedIds) {
        await listsApi.deleteItem(id, delId);
      }
      // Update existing and create new
      for (const item of localItems) {
        if (item.isNew) {
          if (item.nombreOriginal.trim()) {
            await listsApi.addItem(id, { nombreOriginal: item.nombreOriginal.trim(), cantidad: item.cantidad, notas: item.notas || undefined });
          }
        } else {
          await listsApi.updateItem(id, item.id, {
            nombreOriginal: item.nombreOriginal.trim(),
            cantidad: item.cantidad,
            notas: item.notas?.trim(),
          });
        }
      }
      await loadList();
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      avisos.exito('Útiles guardados');
    } catch (err) { avisos.error(err, 'No pudimos guardar los útiles'); }
    finally { setSaving(false); }
  };

  // --- Status ---
  const MENSAJES: Record<string, string> = {
    EN_REVISION: 'Lista en revisión', OBSERVADA: 'Lista observada: el cliente verá tu mensaje', RECHAZADA: 'Lista rechazada',
    VALIDADA: 'Lista validada', PENDIENTE_REVISION: 'Lista devuelta a pendientes',
  };
  const updateStatus = async (status: string, obs?: string, esOficial?: boolean, mensaje?: string) => {
    setSaving(true);
    try { await listsApi.updateStatus(id, status, obs, esOficial); await loadList(); avisos.exito(mensaje ?? MENSAJES[status] ?? 'Estado guardado'); return true; }
    catch (err) { avisos.error(err, 'No pudimos cambiar el estado'); return false; }
    finally { setSaving(false); }
  };

  const abrirDecision = (d: Decision) => {
    setDecision(d);
    setErrorObs(null);
    setTextoObs(d === 'VALIDADA' ? '' : (data?.list.estado === d ? data?.list.observaciones ?? '' : ''));
    setOficial(!!data?.list.esOficial || (d === 'VALIDADA' && !data?.list.userId));
  };
  const confirmarDecision = async () => {
    if (!decision) return;
    const err = decision !== 'VALIDADA' && textoObs.trim().length < 5 ? 'Escribe el motivo para que el cliente sepa qué corregir.'
      : textoObs.trim().length > 500 ? 'Máximo 500 caracteres.' : null;
    setErrorObs(err);
    if (err) { avisos.error(null, err); document.getElementById('texto-decision')?.focus(); return; }
    if (saving) return;
    if (hasChanges && !confirm('Hay útiles sin guardar. ¿Continuar sin guardarlos?')) return;
    const ok = decision === 'VALIDADA'
      ? await updateStatus('VALIDADA', textoObs.trim() || undefined, oficial, oficial ? 'Lista validada y publicada como oficial del colegio' : 'Lista validada')
      : await updateStatus(decision, textoObs.trim());
    if (ok) setDecision(null);
  };

  const abrirCorreccion = async () => {
    if (!data) return;
    setCorr({ schoolId: data.list.schoolId, gradeId: data.list.gradeId, year: data.list.year });
    setCorrigiendo(true);
    try {
      const [cs, gs] = await Promise.all([schoolsApi.getAll(), schoolsApi.getGrades(data.list.schoolId)]);
      setColegios(cs); setGrados(gs);
    } catch (err) { avisos.error(err, 'No pudimos cargar los colegios'); }
  };
  const cambiarColegio = async (schoolId: string) => {
    setCorr(c => ({ ...c, schoolId, gradeId: '' }));
    try { setGrados(await schoolsApi.getGrades(schoolId)); } catch (err) { avisos.error(err, 'No pudimos cargar los grados'); }
  };
  const guardarCorreccion = async () => {
    if (!corr.gradeId) { avisos.error(null, 'Elige el grado'); return; }
    setSaving(true);
    try { await listsApi.update(id, corr); await loadList(); setCorrigiendo(false); avisos.exito('Colegio, grado y año actualizados'); }
    catch (err) { avisos.error(err, 'No pudimos corregir la lista'); }
    finally { setSaving(false); }
  };

  const quitarDeNivel = async (item: SupplyItem, tierId: string) => {
    const t = TIERS.find(x => x.id === tierId);
    if (!t) return;
    setSaving(true);
    try { await listsApi.updateItem(id, item.id, { [t.updateKey]: null } as Partial<SupplyItem>); await loadList(); avisos.exito(`Producto quitado del nivel ${t.label}`); }
    catch (err) { avisos.error(err, 'No pudimos quitar el producto'); }
    finally { setSaving(false); }
  };

  const deleteList = async () => {
    if (!confirm('¿Eliminar esta lista? No se puede deshacer.')) return;
    try { await listsApi.delete(id); avisos.exito('Lista eliminada'); router.push('/admin/lists'); }
    catch (err) { avisos.error(err, 'No pudimos eliminar la lista'); }
  };

  // --- Auto-match ---
  const runAutoMatch = async () => {
    if (hasChanges) { avisos.error(null, 'Guarda los útiles antes de asignar automáticamente'); return; }
    setSaving(true);
    try { await listsApi.autoMatch(id, true); await loadList(); avisos.exito('Productos asignados automáticamente'); }
    catch (err) { avisos.error(err, 'No pudimos asignar los productos'); }
    finally { setSaving(false); }
  };

  // --- Product search ---
  const openSearch = (item: SupplyItem, tier: string) => {
    setEditingItemId(item.id);
    setEditingTier(tier);
    setSearchProduct(item.nombreOriginal);
    doSearch(item.nombreOriginal, tier);
  };

  const doSearch = async (query?: string, tierFilter?: string) => {
    const q = query || searchProduct;
    if (!q.trim()) return;
    const tier = tierFilter !== undefined ? tierFilter : editingTier;
    try {
      const results = await productsApi.search(q);
      setSearchResults(tier ? results.filter((p: Product) => p.tier === tier) : results);
    } catch (err) { avisos.error(err, 'No pudimos buscar productos'); }
  };

  const assignProduct = async (product: Product) => {
    if (!editingItemId) return;
    setSaving(true);
    const tierConfig = TIERS.find(t => t.id === editingTier);
    try {
      if (tierConfig) {
        await listsApi.updateItem(id, editingItemId, { [tierConfig.updateKey]: product.id });
      } else {
        await listsApi.updateItem(id, editingItemId, { productId: product.id });
      }
      await loadList();
      avisos.exito(`"${product.name}" asignado`);
    } catch (err) { avisos.error(err, 'No pudimos asignar el producto'); }
    finally { setSaving(false); setEditingItemId(null); setSearchResults([]); }
  };

  // --- Helpers ---
  if (loading) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  if (!data) return <div className="text-center py-12"><p className="text-gray-500">Lista no encontrada</p></div>;

  const estado = data.list.estado;
  const validada = estado === 'VALIDADA';
  const canStartReview = estado === 'PENDIENTE_REVISION';
  const extras = parseExtras(data.list.extras);
  const fotos = (data.list.imageUrl ?? '').split('|').filter(Boolean);
  const hayExtras = extras.forro.activo || extras.etiquetas.activo || extras.caratulas.activo || extras.forrarLibros || extras.libros.length > 0;

  const getTierProduct = (item: SupplyItem, tierId: string): Product | undefined => {
    if (tierId === 'economico') return item.productEconomico;
    if (tierId === 'medio') return item.productMedio;
    if (tierId === 'premium') return item.productPremium;
  };
  const getTierPrice = (item: SupplyItem, tierId: string): number => {
    if (tierId === 'economico') return item.priceEconomico || 0;
    if (tierId === 'medio') return item.priceMedio || 0;
    if (tierId === 'premium') return item.pricePremium || 0;
    return 0;
  };
  const getTierTotal = (tierId: string) => data.items.reduce((s, i) => s + getTierPrice(i, tierId) * i.cantidad, 0);
  const getTierAssigned = (tierId: string) => data.items.filter(i => getTierProduct(i, tierId)).length;

  return (
    <div>
      <button onClick={() => router.push('/admin/lists')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="h-5 w-5" /> Volver
      </button>

      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">{data.list.schoolName} – {data.list.gradeName}</h1>
              <StatusBadge status={estado} size="sm" />
              {data.list.esOficial && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 inline-flex items-center gap-1"><Award className="h-3 w-3" aria-hidden="true" /> Lista oficial</span>}
            </div>
            <p className="text-sm text-gray-500">
              Año {data.list.year} · {formatDate(data.list.fechaSubida)} · {data.items.length} útiles
              {data.list.submittedBy && <> · Enviada por <strong className="text-gray-700">{data.list.submittedBy}</strong></>}
            </p>
            {(data.list.estudianteNombre || data.list.estudianteGrado) && (
              <p className="text-sm text-gray-700 mt-0.5" data-alumno>Alumno: <strong>{data.list.estudianteNombre || '—'}</strong>{data.list.estudianteGrado ? ` · ${data.list.estudianteGrado}` : ''}{data.list.plan ? ` · Paquete ${nombreNivel(data.list.plan)}` : ''}</p>
            )}
            {data.list.copiaDe && <p className="text-[11px] text-gray-400 mt-0.5">Copia personal de una lista del colegio</p>}
          </div>
          <button onClick={abrirCorreccion} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline"><Pencil className="h-3 w-3" aria-hidden="true" /> Cambiar colegio, grado o año</button>
        </div>

        {/* Acciones de estado */}
        <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-gray-100">
          {saving && <span className="text-xs text-blue-500 animate-pulse">Guardando…</span>}
          {saved && <span className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" aria-hidden="true" /> Guardado</span>}
          {canStartReview && (
            <button onClick={() => updateStatus('EN_REVISION')} disabled={saving} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Iniciar revisión</button>
          )}
          {!validada && (
            <>
              <button onClick={() => abrirDecision('OBSERVADA')} disabled={saving} className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Observar
              </button>
              <button onClick={() => abrirDecision('RECHAZADA')} disabled={saving} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1">
                <Ban className="h-4 w-4" aria-hidden="true" /> Rechazar
              </button>
              <button onClick={() => abrirDecision('VALIDADA')} disabled={saving} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                <Check className="h-4 w-4" aria-hidden="true" /> Validar y publicar
              </button>
            </>
          )}
          {validada && (
            <>
              <button onClick={() => { if (confirm('¿Reabrir la lista? Vuelve a "En revisión" y el cliente no podrá comprarla hasta que la valides otra vez.')) updateStatus('EN_REVISION', undefined, undefined, 'Lista reabierta: está en revisión'); }}
                disabled={saving} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reabrir
              </button>
              <button onClick={() => updateStatus('VALIDADA', undefined, !data.list.esOficial, data.list.esOficial ? 'Ya no es la lista oficial del colegio' : 'Marcada como lista oficial del colegio')}
                disabled={saving} className="bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 disabled:opacity-50 flex items-center gap-1">
                <Award className="h-4 w-4" aria-hidden="true" /> {data.list.esOficial ? 'Quitar de listas oficiales' : 'Marcar como lista oficial del colegio'}
              </button>
            </>
          )}
          <span className="flex-1" />
          <button onClick={runAutoMatch} disabled={saving} className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Asignar automáticamente
          </button>
          <button onClick={() => setShowPreview(true)} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-1.5">
            <Eye className="h-4 w-4" aria-hidden="true" /> Vista previa
          </button>
          <button onClick={deleteList} className="bg-red-50 text-red-500 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-1.5">
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
          </button>
        </div>

        {/* Mensajes */}
        <div className="mt-3 space-y-2 text-sm">
          {data.list.observaciones && (estado === 'OBSERVADA' || estado === 'RECHAZADA') && (
            <div className={`rounded-lg p-3 ${estado === 'RECHAZADA' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`} data-obs-admin>
              <strong>{estado === 'RECHAZADA' ? 'Motivo del rechazo' : 'Observación enviada al cliente'}:</strong> <span className="whitespace-pre-line">{data.list.observaciones}</span>
            </div>
          )}
          {data.list.userObservaciones && (
            <div className="rounded-lg p-3 bg-blue-50 text-blue-700 flex gap-2" data-obs-cliente>
              <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p><strong>El cliente escribió:</strong> <span className="whitespace-pre-line">{data.list.userObservaciones}</span></p>
            </div>
          )}
          {data.list.iaMensaje && (
            <div className="rounded-lg p-3 bg-purple-50 text-purple-700 flex gap-2" data-ia>
              <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p><strong>Lectura automática:</strong> {data.list.iaMensaje}</p>
            </div>
          )}
        </div>

        {fotos.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {fotos.map((url, i) => (
              <button key={i} onClick={() => { setFoto(url); setZoom(1); }} className="flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80" aria-label={`Ver foto ${i + 1} de la lista en grande`}>
                <img width={72} height={96} src={url} alt={`Foto ${i + 1} de la lista`} className="h-24 object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lo que pidió el cliente además de los útiles */}
      {hayExtras && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4" data-extras>
          <h2 className="text-sm font-bold text-gray-900 mb-2">Pedido del cliente además de los útiles</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            {extras.forro.activo && <li className="flex gap-2"><Layers className="h-4 w-4 text-blue-500 flex-shrink-0" aria-hidden="true" /> Forrar cuadernos: <strong>{extras.forro.color || 'sin color'}</strong></li>}
            {extras.forrarLibros && <li className="flex gap-2"><Layers className="h-4 w-4 text-blue-500 flex-shrink-0" aria-hidden="true" /> Forrar libros</li>}
            {extras.etiquetas.activo && <li className="flex gap-2"><Tag className="h-4 w-4 text-blue-500 flex-shrink-0" aria-hidden="true" /> Etiquetas: <strong>{extras.etiquetas.nombre || '—'}</strong>{extras.etiquetas.grado ? ` · ${extras.etiquetas.grado}` : ''} · diseño {extras.etiquetas.diseno}</li>}
            {extras.caratulas.activo && <li className="flex gap-2"><FileText className="h-4 w-4 text-blue-500 flex-shrink-0" aria-hidden="true" /> Carátulas: {extras.caratulas.cursos.join(', ') || 'sin cursos'}</li>}
            {extras.libros.length > 0 && (
              <li className="sm:col-span-2 flex gap-2"><BookOpen className="h-4 w-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                <span>Libros: {extras.libros.map(l => `${l.titulo}${l.editorial ? ` (${l.editorial})` : ''} ×${l.cantidad}${l.precio ? ` · ${formatPrice(l.precio)}` : ' · por cotizar'}`).join('; ')}</span>
              </li>
            )}
            {(extras.excluidos?.length ?? 0) > 0 && <li className="text-gray-500">Ya tiene {extras.excluidos!.length} útiles (no los compra)</li>}
          </ul>
        </div>
      )}

      {/* Tier summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {TIERS.map(t => {
          const Icon = t.icon;
          const colors: Record<string, string> = { green: 'border-green-200 bg-green-50', blue: 'border-blue-200 bg-blue-50', amber: 'border-amber-200 bg-amber-50' };
          return (
            <div key={t.id} className={`rounded-xl border p-4 ${colors[t.color]}`}>
              <div className="flex items-center gap-2 mb-2"><Icon className="h-4 w-4" /><span className="text-sm font-bold">{t.label}</span></div>
              <p className="text-lg font-bold">{formatPrice(getTierTotal(t.id))}</p>
              <p className="text-[11px] text-gray-500">{getTierAssigned(t.id)}/{data.items.length} asignados</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-4 border-b border-gray-100" role="tablist">
          <button role="tab" aria-selected={activeTab === 'items'} onClick={() => setActiveTab('items')}
            className={`min-w-0 px-1 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center justify-center gap-1.5 ${activeTab === 'items' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <FileText className="h-4 w-4 hidden sm:block" aria-hidden="true" />Útiles{hasChanges && <span className="w-2 h-2 bg-orange-500 rounded-full" aria-label="sin guardar" />}
          </button>
          {TIERS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} role="tab" aria-selected={activeTab === t.id} onClick={() => setActiveTab(t.id)}
                className={`min-w-0 px-1 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center justify-center gap-1.5 ${activeTab === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <Icon className="h-4 w-4 hidden sm:block" aria-hidden="true" /><span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {/* === ITEMS TAB: local edits + save button === */}
          {activeTab === 'items' && (
            <div className="space-y-2">
              {localItems.map((item, i) => (
                <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-400 w-5 text-right font-mono">{i + 1}.</span>
                  <input type="text" value={item.nombreOriginal} aria-label={`Útil ${i + 1}`} maxLength={LARGO.titulo} required aria-invalid={!item.nombreOriginal.trim() || undefined}
                    onChange={(e) => updateLocal(i, 'nombreOriginal', e.target.value)}
                    placeholder="Nombre del útil"
                    className="flex-1 min-w-[160px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none" />
                  <input type="number" inputMode="numeric" value={item.cantidad} min={1} max={999} step={1} aria-label={`Cantidad del útil ${i + 1}`}
                    onChange={(e) => updateLocal(i, 'cantidad', e.target.value === '' ? 1 : Math.min(999, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center bg-white focus:border-blue-500 outline-none" />
                  <input type="text" value={item.notas}
                    onChange={(e) => updateLocal(i, 'notas', e.target.value)}
                    placeholder="Notas…" aria-label={`Notas del útil ${i + 1}`} maxLength={200}
                    className="flex-1 sm:flex-none sm:w-40 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 outline-none" />
                  <button onClick={() => removeLocalItem(i)} aria-label={`Quitar útil ${i + 1}`} className="text-gray-300 hover:text-red-500 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Add new row */}
              <button onClick={addLocalItem} className="w-full p-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 flex items-center justify-center gap-1.5">
                <Plus className="h-4 w-4" aria-hidden="true" /> Agregar útil
              </button>

              {/* Save button */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {hasChanges ? <span className="text-orange-500 font-medium">Hay cambios sin guardar</span> : 'Todo guardado'}
                </p>
                <button onClick={saveItems} disabled={!hasChanges || saving}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 flex items-center gap-2 transition-colors">
                  <Save className="h-4 w-4" aria-hidden="true" /> Guardar útiles
                </button>
              </div>
            </div>
          )}

          {/* === TIER TABS === */}
          {TIERS.map(t => activeTab === t.id && (
            <div key={t.id} className="space-y-2">
              {data.items.map((item, i) => {
                const product = getTierProduct(item, t.id);
                const price = getTierPrice(item, t.id);
                return (
                  <div key={item.id} data-item-nivel={item.nombreOriginal} className={`flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-3 rounded-xl ${product ? 'bg-gray-50' : 'bg-orange-50 border border-orange-200'}`}>
                    <span className="text-xs text-gray-400 w-5 text-right font-mono">{i + 1}.</span>
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                      {product?.imageUrl ? <img width={64} height={64} decoding="async" src={product.imageUrl} alt="" aria-hidden="true" className="w-full h-full object-cover" /> : <Package className="h-5 w-5 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-xs text-gray-400 truncate">{item.nombreOriginal} ×{item.cantidad}</p>
                      {product ? (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <span className="text-[10px] text-gray-400">{product.brand}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-orange-500 font-medium">Sin producto asignado</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 mr-2">
                      {price > 0 ? (
                        <>
                          <p className="text-sm font-bold text-gray-900">{formatPrice(price * item.cantidad)}</p>
                          <p className="text-[10px] text-gray-400">{formatPrice(price)} c/u</p>
                        </>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </div>
                    <button onClick={() => openSearch(item, t.id)}
                      className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1 flex-shrink-0">
                      <Search className="h-3 w-3" aria-hidden="true" /> {product ? 'Cambiar' : 'Asignar'}
                    </button>
                    {product && (
                      <button onClick={() => quitarDeNivel(item, t.id)} disabled={saving} aria-label={`Quitar producto de ${item.nombreOriginal} en ${t.label}`}
                        className="bg-white border border-gray-200 text-red-500 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 flex-shrink-0">Quitar</button>
                    )}
                  </div>
                );
              })}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-500">{getTierAssigned(t.id)}/{data.items.length} productos asignados</span>
                <span className="text-lg font-bold text-gray-900">Total: {formatPrice(getTierTotal(t.id))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Modal */}
      {editingItemId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingItemId(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Buscar producto</h3>
                  {editingTier && <TierBadge tier={editingTier} />}
                </div>
                <button onClick={() => setEditingItemId(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-2">
                <input type="text" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                  aria-label="Buscar producto" placeholder="Buscar…" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" autoFocus />
                <button onClick={() => doSearch()} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"><Search className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setEditingTier(''); doSearch(undefined, ''); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${!editingTier ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>Todos</button>
                {TIERS.map(t => (
                  <button key={t.id} onClick={() => { setEditingTier(t.id); doSearch(undefined, t.id); }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${editingTier === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{t.label}</button>
                ))}
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Busca un producto</p>
              ) : searchResults.map(product => (
                <div key={product.id} onClick={() => assignProduct(product)}
                  className="p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer flex items-center gap-3">
                  {product.imageUrl ? <img width={56} height={56} decoding="async" src={product.imageUrl} alt="" aria-hidden="true" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package className="h-5 w-5 text-gray-300" /></div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                      <TierBadge tier={product.tier} />
                    </div>
                    <p className="text-xs text-gray-500">{product.brand} | {product.category}</p>
                    {product.description && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{product.description}</p>}
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(product.basePrice)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && data && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-900">Vista previa</h3>
                <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-gray-500 mb-3">{data.list.schoolName} - {data.list.gradeName} - {data.list.year}</p>
              <div className="flex gap-2">
                {TIERS.map(t => {
                  const Icon = t.icon;
                  const active = previewTier === t.id;
                  const colors: Record<string, string> = { green: 'bg-green-500 text-white', blue: 'bg-blue-500 text-white', amber: 'bg-amber-500 text-white' };
                  const inactive: Record<string, string> = { green: 'bg-green-50 text-green-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700' };
                  return (
                    <button key={t.id} onClick={() => setPreviewTier(t.id)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 ${active ? colors[t.color] : inactive[t.color]}`}>
                      <Icon className="h-4 w-4" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[55vh]">
              <div className="p-5 space-y-2">
                {data.items.map((item, i) => {
                  const product = getTierProduct(item, previewTier);
                  const price = getTierPrice(item, previewTier);
                  return (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-400 w-5 text-right">{i + 1}.</span>
                      <div className="w-11 h-11 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {product?.imageUrl ? <img width={64} height={64} decoding="async" src={product.imageUrl} alt="" aria-hidden="true" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product?.name || item.nombreOriginal}</p>
                        <p className="text-[10px] text-gray-400">{item.nombreOriginal}{product?.brand ? ` | ${product.brand}` : ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{price > 0 ? formatPrice(price * item.cantidad) : '-'}</p>
                        <p className="text-[10px] text-gray-400">×{item.cantidad}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-5 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{getTierAssigned(previewTier)}/{data.items.length} productos</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(getTierTotal(previewTier))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Observar / rechazar / validar */}
      {decision && (
        <Modal titulo={decision === 'OBSERVADA' ? 'Observar la lista' : decision === 'RECHAZADA' ? 'Rechazar la lista' : 'Validar y publicar'} onClose={() => setDecision(null)}>
          <div className="p-4 space-y-3">
            {decision !== 'VALIDADA' ? (
              <>
                <p className="text-sm text-gray-600">{decision === 'OBSERVADA'
                  ? 'El cliente verá este mensaje y podrá corregir o completar su lista.'
                  : 'El cliente verá el motivo. Úsalo si la foto no es una lista de útiles o no se puede atender.'}</p>
                <label className="block">
                  <span className="block text-xs text-gray-700 mb-1">{decision === 'OBSERVADA' ? 'Observación para el cliente *' : 'Motivo del rechazo *'}</span>
                  <textarea id="texto-decision" value={textoObs} onChange={e => { setTextoObs(e.target.value); setErrorObs(null); }} rows={4} autoFocus className={`${campo} ${errorObs ? '!border-profe' : ''}`}
                    maxLength={500} required aria-invalid={errorObs ? true : undefined} aria-describedby={errorObs ? 'texto-decision-error' : undefined}
                    placeholder={decision === 'OBSERVADA' ? 'Ej: La foto está cortada abajo; envíanos la segunda página.' : 'Ej: La foto no corresponde a una lista de útiles.'} />
                </label>
                <ErrorCampo id="texto-decision" error={errorObs} />
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">El cliente podrá elegir su paquete y comprar.</p>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={oficial} onChange={e => setOficial(e.target.checked)} className="mt-0.5" />
                  <span><strong>Marcar como lista oficial del colegio</strong><br /><span className="text-xs text-gray-500">Aparecerá en “Listas de colegios” para que otros padres de {data.list.schoolName} – {data.list.gradeName} la usen.</span></span>
                </label>
                <label className="block">
                  <span className="block text-xs text-gray-700 mb-1">Nota interna (opcional)</span>
                  <textarea value={textoObs} onChange={e => setTextoObs(e.target.value)} rows={2} maxLength={500} className={campo} />
                </label>
              </>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setDecision(null)} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
              <button onClick={confirmarDecision} disabled={saving}
                className={`px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 ${decision === 'OBSERVADA' ? 'bg-orange-500' : decision === 'RECHAZADA' ? 'bg-red-600' : 'bg-green-600'}`}>
                {decision === 'OBSERVADA' ? 'Enviar observación' : decision === 'RECHAZADA' ? 'Rechazar lista' : 'Validar lista'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Corregir colegio / grado / año */}
      {corrigiendo && (
        <Modal titulo="Cambiar colegio, grado o año" onClose={() => setCorrigiendo(false)}>
          <div className="p-4 space-y-3">
            <label className="block"><span className="block text-xs text-gray-700 mb-1">Colegio</span>
              <select value={corr.schoolId} onChange={e => cambiarColegio(e.target.value)} className={campo}>
                {colegios.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="block text-xs text-gray-700 mb-1">Grado</span>
              <select value={corr.gradeId} onChange={e => { const g = grados.find(x => x.id === e.target.value); setCorr(c => ({ ...c, gradeId: e.target.value, year: g?.year ?? c.year })); }} className={campo}>
                <option value="">Elegir grado</option>
                {grados.map(g => <option key={g.id} value={g.id}>{g.name} ({g.year})</option>)}
              </select>
              {grados.length === 0 && <span className="block text-[11px] text-orange-600 mt-1">Este colegio aún no tiene grados. Agrégalos en Colegios.</span>}
            </label>
            <label className="block"><span className="block text-xs text-gray-700 mb-1">Año escolar</span>
              <select value={corr.year} onChange={e => setCorr(c => ({ ...c, year: Number(e.target.value) }))} className={campo}>
                {Array.from(new Set([...añosElegibles(), data.list.year])).sort().map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCorrigiendo(false)} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
              <button onClick={guardarCorreccion} disabled={saving || !corr.gradeId} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Guardar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Foto de la lista en grande */}
      {foto && (
        <Modal titulo="Foto de la lista" onClose={() => setFoto(null)} ancho="max-w-5xl">
          <div className="flex items-center justify-center gap-2 px-4 py-2 border-b border-gray-100 sticky top-0 bg-white z-10">
            <button onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))} aria-label="Alejar" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ZoomOut className="h-4 w-4" /></button>
            <span className="text-xs text-gray-600 w-12 text-center" aria-live="polite">{Math.round(zoom * 100)} %</span>
            <button onClick={() => setZoom(z => Math.min(4, Math.round((z + 0.25) * 100) / 100))} aria-label="Acercar" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={() => setZoom(1)} className="text-xs text-blue-600 px-2">Ajustar</button>
          </div>
          <div className="overflow-auto max-h-[75vh] bg-gray-50">
            <img src={foto} alt="Foto de la lista" onClick={() => setZoom(z => (z === 1 ? 2 : 1))}
              style={{ width: `${zoom * 100}%`, maxWidth: 'none', cursor: zoom === 1 ? 'zoom-in' : 'zoom-out' }} className="block mx-auto" />
          </div>
        </Modal>
      )}
    </div>
  );
}
