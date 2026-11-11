'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Percent, Newspaper, Upload, X, Search, Package, Check, Image as ImageIcon } from 'lucide-react';
import { productsApi, campaignsApi, newsApi, type Campaign, type NewsItem, type NewsInput } from '@/services/api';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Cargando, Interruptor, Modal, aSlug, botonPrimario, campo, fechaCorta, hoyISO, tarjeta, th, useAvisos } from '../_ui';
import { LARGO, enfocar, primerError, validarEnlace, validarEntero, validarPorcentaje, validarTexto } from '@/lib/validar';
import { validarArchivoImagen } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import Paginador, { usePaginacion } from '@/components/Paginador';

interface FormCampana { name: string; slug: string; slugManual: boolean; description: string; discountPercent: string; startDate: string; endDate: string; isActive: boolean; imageUrl: string }
const campanaVacia: FormCampana = { name: '', slug: '', slugManual: false, description: '', discountPercent: '10', startDate: '', endDate: '', isActive: true, imageUrl: '' };
interface FormNoticia { title: string; content: string; imageUrl: string; linkUrl: string; campaignId: string; displayOrder: string; isActive: boolean }
const noticiaVacia: FormNoticia = { title: '', content: '', imageUrl: '', linkUrl: '', campaignId: '', displayOrder: '0', isActive: true };

const vigencia = (c: Campaign) => {
  const hoy = hoyISO();
  if (!c.isActive) return { texto: 'Inactiva', clase: 'bg-slate-100 text-slate-500' };
  if (c.startDate && c.startDate.slice(0, 10) > hoy) return { texto: 'Programada', clase: 'bg-blue-100 text-blue-700' };
  if (c.endDate && c.endDate.slice(0, 10) < hoy) return { texto: 'Terminó', clase: 'bg-orange-100 text-orange-700' };
  return { texto: 'Activa', clase: 'bg-green-100 text-green-700' };
};

export default function AdminCampaignsPage() {
  const avisos = useAvisos();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'campaigns' | 'news'>('campaigns');
  const [formCampana, setFormCampana] = useState<{ id: string | null; datos: FormCampana } | null>(null);
  const [formNoticia, setFormNoticia] = useState<{ id: string | null; datos: FormNoticia } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string | null>>({});
  /** id, aria-invalid y aria-describedby de un campo del formulario abierto */
  const ac = (id: string) => ({ id, 'aria-invalid': errores[id] ? true : undefined, 'aria-describedby': errores[id] ? `${id}-error` : undefined });
  const [expanded, setExpanded] = useState<Campaign | null>(null);
  const [campaignProducts, setCampaignProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const load = useCallback(() =>
    Promise.all([campaignsApi.getAll(), newsApi.getAll()])
      .then(([c, n]) => { setCampaigns(c); setNews(n); })
      .catch(e => avisos.error(e, 'No pudimos cargar las campañas'))
      .finally(() => setLoading(false)), [avisos]);
  useEffect(() => { load(); }, [load]);

  // ── Campañas ──
  const abrirCampana = (c?: Campaign) => { setErrores({}); setFormCampana({
    id: c?.id ?? null,
    datos: c ? { name: c.name, slug: c.slug, slugManual: true, description: c.description || '', discountPercent: String(c.discountPercent ?? 0), startDate: c.startDate?.slice(0, 10) || '', endDate: c.endDate?.slice(0, 10) || '', isActive: c.isActive, imageUrl: c.imageUrl || '' } : campanaVacia,
  }); };
  const setC = <K extends keyof FormCampana>(k: K, v: FormCampana[K]) => {
    setErrores(e => ({ ...e, [`c-${k}`]: null }));
    setFormCampana(f => f && ({ ...f, datos: { ...f.datos, [k]: v, ...(k === 'name' && !f.datos.slugManual ? { slug: aSlug(String(v)) } : {}) } }));
  };

  const saveCampaign = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!formCampana || guardando) return;
    const d = formCampana.datos;
    const pct = parseFloat(d.discountPercent);
    const slug = aSlug(d.slug || d.name);
    const errs = {
      'c-name': validarTexto(d.name, { campo: 'el nombre de la campaña', min: 3, max: LARGO.nombre }),
      'c-slug': slug && campaigns.some(c => c.slug === slug && c.id !== formCampana.id) ? 'Ya hay una campaña con esa dirección web.' : null,
      'c-description': validarTexto(d.description, { obligatorio: false, max: 200 }),
      'c-discountPercent': validarPorcentaje(d.discountPercent) ?? (pct > 90 ? 'El descuento máximo es 90 %.' : null),
      'c-startDate': null as string | null,
      'c-endDate': d.startDate && d.endDate && d.endDate < d.startDate ? 'La fecha de fin es anterior a la de inicio.' : null,
      'c-imageUrl': d.imageUrl.startsWith('data:') ? null : validarEnlace(d.imageUrl),
    };
    setErrores(errs);
    const primero = primerError(errs);
    if (primero) { enfocar(primero); return; }
    const data = {
      name: d.name.trim(), slug: aSlug(d.slug || d.name), description: d.description.trim() || null, discountPercent: pct, discountFixed: 0,
      startDate: d.startDate || null, endDate: d.endDate || null, isActive: d.isActive, imageUrl: d.imageUrl.trim() || null,
    };
    setGuardando(true);
    try {
      if (formCampana.id) await campaignsApi.update(formCampana.id, data);
      else await campaignsApi.create(data);
      avisos.exito(formCampana.id ? 'Campaña guardada' : `Campaña "${data.name}" creada`);
      setFormCampana(null); load();
    } catch (e) { avisos.error(e, 'No pudimos guardar la campaña'); }
    finally { setGuardando(false); }
  };

  const toggleActive = async (c: Campaign) => {
    try { await campaignsApi.update(c.id, { isActive: !c.isActive }); avisos.exito(c.isActive ? `"${c.name}" desactivada` : `"${c.name}" activada`); load(); }
    catch (e) { avisos.error(e, 'No pudimos cambiar la campaña'); }
  };
  const deleteCampaign = async (c: Campaign) => {
    if (!confirm(`¿Eliminar la campaña "${c.name}"? Sus productos vuelven a su precio normal.`)) return;
    try { await campaignsApi.delete(c.id); avisos.exito('Campaña eliminada'); if (expanded?.id === c.id) setExpanded(null); load(); }
    catch (e) { avisos.error(e, 'No pudimos eliminar la campaña'); }
  };
  const uploadCampaignImage = async (c: Campaign, f: File) => {
    const err = validarArchivoImagen(f);
    if (err) { avisos.error(new Error(err)); return; }
    try { await campaignsApi.uploadImage(c.id, f); avisos.exito('Imagen de la campaña subida'); load(); }
    catch (e) { avisos.error(e, 'No pudimos subir la imagen'); }
  };

  const cargarProductos = useCallback(async (c: Campaign) => {
    try {
      const [cp, ap] = await Promise.all([campaignsApi.getBySlug(c.id), allProducts.length ? Promise.resolve(allProducts) : productsApi.getAll({ includeInactive: true })]);
      setCampaignProducts(cp?.products || []);
      setAllProducts(ap);
    } catch (e) { avisos.error(e, 'No pudimos cargar los productos de la campaña'); }
  }, [allProducts, avisos]);

  const toggleCampaignProducts = (c: Campaign) => {
    if (expanded?.id === c.id) { setExpanded(null); return; }
    setExpanded(c); setProductSearch(''); setCampaignProducts([]);
    cargarProductos(c);
  };
  const addProduct = async (c: Campaign, p: Product) => {
    try { await campaignsApi.addProducts(c.id, [p.id]); avisos.exito(`"${p.name}" agregado a ${c.name}`); await cargarProductos(c); load(); }
    catch (e) { avisos.error(e, 'No pudimos agregar el producto'); }
  };
  const removeProduct = async (c: Campaign, p: Product) => {
    try { await campaignsApi.removeProduct(c.id, p.id); avisos.exito(`"${p.name}" quitado de la campaña`); await cargarProductos(c); load(); }
    catch (e) { avisos.error(e, 'No pudimos quitar el producto'); }
  };

  const campaignProductIds = new Set(campaignProducts.map(p => p.id));
  const pagCampanas = usePaginacion(campaigns, 20);
  const pagNoticias = usePaginacion(news, 20);
  const sinTilde = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const filteredAllProducts = allProducts.filter(p => p.isActive !== false && (!productSearch || sinTilde(`${p.name} ${p.brand ?? ''}`).includes(sinTilde(productSearch))));

  // ── Noticias ──
  const abrirNoticia = (n?: NewsItem) => { setErrores({}); setFormNoticia({
    id: n?.id ?? null,
    datos: n ? { title: n.title, content: n.content || '', imageUrl: n.imageUrl && !n.imageUrl.startsWith('data:') ? n.imageUrl : '', linkUrl: n.linkUrl || '', campaignId: n.campaignId || '', displayOrder: String(n.displayOrder ?? 0), isActive: n.isActive } : noticiaVacia,
  }); };
  const setN = <K extends keyof FormNoticia>(k: K, v: FormNoticia[K]) => {
    setErrores(e => ({ ...e, [`n-${k}`]: null }));
    setFormNoticia(f => f && ({ ...f, datos: { ...f.datos, [k]: v } }));
  };
  const saveNews = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!formNoticia || guardando) return;
    const d = formNoticia.datos;
    const errs = {
      'n-title': validarTexto(d.title, { campo: 'el título de la noticia', min: 3, max: LARGO.titulo }),
      'n-content': validarTexto(d.content, { obligatorio: false, max: LARGO.texto }),
      'n-imageUrl': validarEnlace(d.imageUrl),
      'n-displayOrder': validarEntero(d.displayOrder, { campo: 'el orden', min: 0, max: 999 }),
      'n-linkUrl': validarEnlace(d.linkUrl),
    };
    setErrores(errs);
    const primero = primerError(errs);
    if (primero) { enfocar(primero); return; }
    const actual = news.find(x => x.id === formNoticia.id);
    const data: NewsInput = {
      title: d.title.trim(), content: d.content.trim() || null,
      // Si la imagen se subió como archivo y no se escribió otra URL, se conserva
      imageUrl: d.imageUrl.trim() || (actual?.imageUrl?.startsWith('data:') ? actual.imageUrl : null),
      linkUrl: d.linkUrl.trim() || null, campaignId: d.campaignId || null, displayOrder: parseInt(d.displayOrder) || 0, isActive: d.isActive,
    };
    setGuardando(true);
    try {
      if (formNoticia.id) await newsApi.update(formNoticia.id, data);
      else await newsApi.create(data);
      avisos.exito(formNoticia.id ? 'Noticia guardada' : 'Noticia publicada');
      setFormNoticia(null); load();
    } catch (e) { avisos.error(e, 'No pudimos guardar la noticia'); }
    finally { setGuardando(false); }
  };
  const deleteNews = async (n: NewsItem) => {
    if (!confirm(`¿Eliminar la noticia "${n.title}"?`)) return;
    try { await newsApi.delete(n.id); avisos.exito('Noticia eliminada'); load(); }
    catch (e) { avisos.error(e, 'No pudimos eliminar la noticia'); }
  };
  const uploadNewsImage = async (n: NewsItem, file: File) => {
    try { await newsApi.uploadImage(n.id, file); avisos.exito('Imagen de la noticia subida'); load(); }
    catch (e) { avisos.error(e, 'No pudimos subir la imagen'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900">Campañas y noticias</h1>
        <button onClick={() => tab === 'campaigns' ? abrirCampana() : abrirNoticia()} className={botonPrimario}>
          <Plus className="h-4 w-4" aria-hidden="true" /> {tab === 'campaigns' ? 'Nueva campaña' : 'Nueva noticia'}
        </button>
      </div>

      <div className="flex gap-2 mb-4" role="tablist">
        <button role="tab" aria-selected={tab === 'campaigns'} onClick={() => setTab('campaigns')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 ${tab === 'campaigns' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600'}`}>
          <Percent className="h-3.5 w-3.5" aria-hidden="true" /> Campañas ({campaigns.length})
        </button>
        <button role="tab" aria-selected={tab === 'news'} onClick={() => setTab('news')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 ${tab === 'news' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600'}`}>
          <Newspaper className="h-3.5 w-3.5" aria-hidden="true" /> Noticias ({news.length})
        </button>
      </div>

      {loading ? <Cargando /> : tab === 'campaigns' ? (
        <>
          <div className={`${tarjeta} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  <th className={`${th} w-14`}>Imagen</th>
                  <th className={th}>Nombre</th>
                  <th className={th}>Dirección web</th>
                  <th className={`${th} text-center`}>Descuento</th>
                  <th className={th}>Vigencia</th>
                  <th className={`${th} text-center`}>Productos</th>
                  <th className={`${th} text-center`}>Estado</th>
                  <th className={`${th} text-center`}>Acciones</th>
                </tr></thead>
                <tbody>
                  {pagCampanas.visibles.map((c, i) => {
                    const v = vigencia(c);
                    return (
                      <tr key={c.id} data-campana={c.slug} className={`border-b border-slate-100 hover:bg-blue-50/30 ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                        <td className="px-4 py-2">
                          <label className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-blue-50 overflow-hidden" title="Subir imagen">
                            {c.imageUrl ? <img width={64} height={64} decoding="async" src={c.imageUrl} alt="" aria-hidden="true" className="w-full h-full object-cover" /> : <ImageIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
                            <input type="file" accept="image/*" className="sr-only" aria-label={`Imagen de ${c.name}`} onChange={e => { const f = e.target.files?.[0]; if (f) uploadCampaignImage(c, f); e.target.value = ''; }} />
                          </label>
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-slate-900">{c.name}</td>
                        <td className="px-4 py-2 text-[11px] font-mono text-neutral-400">/catalog?campaign={c.slug}</td>
                        <td className="px-4 py-2 text-center"><span className="text-xs font-bold text-red-500">{c.discountPercent} %</span></td>
                        <td className="px-4 py-2 text-[11px] text-slate-600 whitespace-nowrap" data-vigencia>{c.startDate || c.endDate ? `${fechaCorta(c.startDate)} → ${fechaCorta(c.endDate)}` : 'Sin fechas'}</td>
                        <td className="px-4 py-2 text-center text-xs text-slate-600">{c.productCount ?? 0}</td>
                        <td className="px-4 py-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${v.clase}`}>{v.texto}</span></td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => toggleCampaignProducts(c)} aria-label={`Productos de ${c.name}`} aria-expanded={expanded?.id === c.id}
                              className={`p-1.5 rounded-lg transition-colors ${expanded?.id === c.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title="Productos"><Package className="h-3.5 w-3.5" /></button>
                            <button onClick={() => abrirCampana(c)} aria-label={`Editar ${c.name}`} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => toggleActive(c)} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 whitespace-nowrap">{c.isActive ? 'Desactivar' : 'Activar'}</button>
                            <button onClick={() => deleteCampaign(c)} aria-label={`Eliminar ${c.name}`} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-3"><Paginador {...pagCampanas} onCambiar={pagCampanas.setPagina} nombre="campañas" /></div>
            {campaigns.length === 0 && <p className="p-8 text-center text-neutral-400 text-sm">No hay campañas</p>}
          </div>

          {expanded && (
            <section aria-label={`Productos de ${expanded.name}`} className={`${tarjeta} p-4 mt-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">Productos de “{expanded.name}” · {expanded.discountPercent} % de descuento</h2>
                <button onClick={() => setExpanded(null)} aria-label="Cerrar productos" className="p-1 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 mb-2">En la campaña ({campaignProducts.length})</p>
                  <ul className="space-y-1 max-h-72 overflow-y-auto" data-en-campana>
                    {campaignProducts.map(p => (
                      <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 bg-white rounded overflow-hidden flex-shrink-0">{p.imageUrl && <img decoding="async" src={p.imageUrl} alt="" aria-hidden="true" width={28} height={28} loading="lazy" className="w-full h-full object-cover" />}</div>
                          <span className="text-xs text-slate-700 truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-neutral-400 line-through">{formatPrice(p.basePrice)}</span>
                          <span className="text-[11px] text-red-500 font-bold">{formatPrice(Math.round(p.basePrice * (1 - expanded.discountPercent / 100) * 100) / 100)}</span>
                          <button onClick={() => removeProduct(expanded, p)} aria-label={`Quitar ${p.name}`} className="text-red-300 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      </li>
                    ))}
                    {campaignProducts.length === 0 && <li className="text-[11px] text-neutral-400 text-center py-3">Sin productos todavía</li>}
                  </ul>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 mb-2">Agregar productos</p>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-400" aria-hidden="true" />
                    <input type="search" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar producto…" aria-label="Buscar producto para la campaña"
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <ul className="space-y-1 max-h-64 overflow-y-auto">
                    {filteredAllProducts.slice(0, 30).map(p => {
                      const ya = campaignProductIds.has(p.id);
                      return (
                        <li key={p.id}>
                          <button onClick={() => !ya && addProduct(expanded, p)} disabled={ya} aria-label={ya ? `${p.name} ya está en la campaña` : `Agregar ${p.name}`}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-left transition-colors ${ya ? 'bg-green-50 opacity-60' : 'bg-slate-50 hover:bg-blue-50'}`}>
                            <span className="text-[11px] text-slate-700 truncate">{p.name}</span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[10px] text-neutral-400">{formatPrice(p.basePrice)}</span>
                              {ya ? <Check className="h-3 w-3 text-green-500" aria-hidden="true" /> : <Plus className="h-3 w-3 text-blue-500" aria-hidden="true" />}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="space-y-2">
          {pagNoticias.visibles.map(n => (
            <div key={n.id} data-noticia={n.title} className={`${tarjeta} p-3 sm:p-4 flex items-center gap-3 sm:gap-4`}>
              <label className="relative w-20 h-14 rounded-xl bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-blue-50 flex-shrink-0 overflow-hidden" title="Subir imagen">
                {n.imageUrl ? <img width={64} height={64} decoding="async" src={n.imageUrl} alt="" aria-hidden="true" className="w-full h-full object-cover" /> : <Upload className="h-4 w-4 text-slate-400" aria-hidden="true" />}
                <input type="file" accept="image/*" className="sr-only" aria-label={`Imagen de ${n.title}`} onChange={e => { const f = e.target.files?.[0]; if (f) uploadNewsImage(n, f); e.target.value = ''; }} />
              </label>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{n.title}</p>
                <p className="text-[11px] text-neutral-400 truncate">{n.content}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {n.campaignName && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">{n.campaignName}</span>}
                  {!n.isActive && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">Oculta</span>}
                </div>
              </div>
              <button onClick={() => abrirNoticia(n)} aria-label={`Editar ${n.title}`} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => deleteNews(n)} aria-label={`Eliminar ${n.title}`} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <Paginador {...pagNoticias} onCambiar={pagNoticias.setPagina} nombre="noticias" />
          {news.length === 0 && <p className="text-center py-8 text-neutral-400 text-sm">No hay noticias</p>}
        </div>
      )}

      {formCampana && (
        <Modal titulo={formCampana.id ? 'Editar campaña' : 'Nueva campaña'} onClose={() => setFormCampana(null)}>
          <form onSubmit={saveCampaign} noValidate className="p-4 space-y-3" aria-busy={guardando}>
            <Etiqueta texto="Nombre *" error={errores['c-name']} id="c-name"><input {...ac('c-name')} required maxLength={LARGO.nombre} value={formCampana.datos.name} onChange={e => setC('name', e.target.value)} placeholder="Ej: Regreso a clases" className={campo} autoFocus /></Etiqueta>
            <Etiqueta texto="Dirección web" ayuda={`Se verá en /catalog?campaign=${aSlug(formCampana.datos.slug || formCampana.datos.name) || '…'}`} error={errores['c-slug']} id="c-slug">
              <input {...ac('c-slug')} maxLength={LARGO.corto} value={formCampana.datos.slug} onChange={e => { setErrores(x => ({ ...x, 'c-slug': null })); setFormCampana(f => f && ({ ...f, datos: { ...f.datos, slug: e.target.value, slugManual: true } })); }} onBlur={() => setFormCampana(f => f && ({ ...f, datos: { ...f.datos, slug: aSlug(f.datos.slug) } }))} placeholder="se-arma-sola" className={`${campo} font-mono`} />
            </Etiqueta>
            <Etiqueta texto="Descripción" error={errores['c-description']} id="c-description"><input {...ac('c-description')} maxLength={200} value={formCampana.datos.description} onChange={e => setC('description', e.target.value)} placeholder="Ej: 10 % en cuadernos y colores" className={campo} /></Etiqueta>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Etiqueta texto="Descuento (%)" error={errores['c-discountPercent']} id="c-discountPercent"><input {...ac('c-discountPercent')} type="number" inputMode="decimal" min={0} max={90} step="0.5" required value={formCampana.datos.discountPercent} onChange={e => setC('discountPercent', e.target.value)} className={campo} /></Etiqueta>
              <Etiqueta texto="Desde" error={errores['c-startDate']} id="c-startDate"><input {...ac('c-startDate')} type="date" value={formCampana.datos.startDate} onChange={e => setC('startDate', e.target.value)} className={campo} /></Etiqueta>
              <Etiqueta texto="Hasta" error={errores['c-endDate']} id="c-endDate"><input {...ac('c-endDate')} type="date" value={formCampana.datos.endDate} min={formCampana.datos.startDate || undefined} onChange={e => setC('endDate', e.target.value)} className={campo} /></Etiqueta>
            </div>
            <Etiqueta texto="Imagen (URL)" ayuda="También puedes subir un archivo desde la tabla." error={errores['c-imageUrl']} id="c-imageUrl">
              <input {...ac('c-imageUrl')} type="url" inputMode="url" maxLength={LARGO.url} value={formCampana.datos.imageUrl.startsWith('data:') ? '' : formCampana.datos.imageUrl} onChange={e => setC('imageUrl', e.target.value)} placeholder="https://…" className={campo} />
            </Etiqueta>
            <Interruptor activo={formCampana.datos.isActive} onChange={v => setC('isActive', v)} etiqueta="Campaña activa" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormCampana(null)} className="min-h-10 px-4 py-2 text-sm text-slate-600">Cancelar</button>
              <button type="submit" disabled={guardando} className="min-h-10 bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50">{guardando ? 'Guardando…' : 'Guardar campaña'}</button>
            </div>
          </form>
        </Modal>
      )}

      {formNoticia && (
        <Modal titulo={formNoticia.id ? 'Editar noticia' : 'Nueva noticia'} onClose={() => setFormNoticia(null)}>
          <form onSubmit={saveNews} noValidate className="p-4 space-y-3" aria-busy={guardando}>
            <Etiqueta texto="Título *" error={errores['n-title']} id="n-title"><input {...ac('n-title')} required maxLength={LARGO.titulo} value={formNoticia.datos.title} onChange={e => setN('title', e.target.value)} className={campo} autoFocus /></Etiqueta>
            <Etiqueta texto="Contenido" error={errores['n-content']} id="n-content"><textarea {...ac('n-content')} maxLength={LARGO.texto} value={formNoticia.datos.content} onChange={e => setN('content', e.target.value)} rows={3} className={campo} /></Etiqueta>
            <Etiqueta texto="Imagen (URL)" ayuda="Deja vacío para conservar la imagen subida como archivo." error={errores['n-imageUrl']} id="n-imageUrl">
              <input {...ac('n-imageUrl')} type="url" inputMode="url" maxLength={LARGO.url} value={formNoticia.datos.imageUrl} onChange={e => setN('imageUrl', e.target.value)} placeholder="https://…" className={campo} />
            </Etiqueta>
            {(formNoticia.datos.imageUrl || news.find(x => x.id === formNoticia.id)?.imageUrl) && (
              <img src={formNoticia.datos.imageUrl || news.find(x => x.id === formNoticia.id)?.imageUrl || ''} alt="Vista previa de la imagen" width={192} height={96} className="h-24 rounded-lg object-cover border border-slate-200" />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Etiqueta texto="Campaña">
                <select value={formNoticia.datos.campaignId} onChange={e => setN('campaignId', e.target.value)} className={campo}>
                  <option value="">Sin campaña</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Etiqueta>
              <Etiqueta texto="Orden" error={errores['n-displayOrder']} id="n-displayOrder"><input {...ac('n-displayOrder')} type="number" inputMode="numeric" min={0} max={999} step={1} value={formNoticia.datos.displayOrder} onChange={e => setN('displayOrder', e.target.value)} className={campo} /></Etiqueta>
            </div>
            <Etiqueta texto="Enlace (opcional)" ayuda="Si no hay campaña, el botón de la noticia lleva aquí." error={errores['n-linkUrl']} id="n-linkUrl">
              <input {...ac('n-linkUrl')} maxLength={LARGO.url} value={formNoticia.datos.linkUrl} onChange={e => setN('linkUrl', e.target.value)} placeholder="/catalog o https://…" className={campo} />
            </Etiqueta>
            <Interruptor activo={formNoticia.datos.isActive} onChange={v => setN('isActive', v)} etiqueta="Visible en la tienda" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormNoticia(null)} className="min-h-10 px-4 py-2 text-sm text-slate-600">Cancelar</button>
              <button type="submit" disabled={guardando} className="min-h-10 bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50">{guardando ? 'Guardando…' : 'Guardar noticia'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Etiqueta({ texto, ayuda, error, id, children }: { texto: string; ayuda?: string; error?: string | null; id?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="block text-xs text-slate-700 mb-1">{texto}</span>
        {children}
      </label>
      {error
        ? <p id={id ? `${id}-error` : undefined} className="mt-1 flex items-start gap-1 text-xs text-profe"><AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />{error}</p>
        : ayuda && <p className="text-[11px] text-tenue mt-1">{ayuda}</p>}
    </div>
  );
}
