'use client';

import React, { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { Plus, Edit2, Trash2, Percent, Newspaper, Upload, X, Search, ChevronDown, Package, Check } from 'lucide-react';
import { productsApi } from '@/services/api';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'campaigns' | 'news'>('campaigns');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', discountPercent: '0', startDate: '', endDate: '' });
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '', campaignId: '', displayOrder: '0' });
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [campaignProducts, setCampaignProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [c, n] = await Promise.all([
        fetch(`${API}/campaigns`).then(r => r.json()),
        fetch(`${API}/news`).then(r => r.json()),
      ]);
      if (c.success) setCampaigns(c.data);
      if (n.success) setNews(n.data);
    } catch {} finally { setLoading(false); }
  };

  const saveCampaign = async () => {
    const data = { name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'), description: form.description, discountPercent: parseFloat(form.discountPercent), discountFixed: 0, startDate: form.startDate || null, endDate: form.endDate || null };
    if (editId) await fetch(`${API}/campaigns/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    else await fetch(`${API}/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowForm(false); setEditId(null); setForm({ name: '', slug: '', description: '', discountPercent: '0', startDate: '', endDate: '' }); load();
  };

  const saveNews = async () => {
    const data = { title: newsForm.title, content: newsForm.content, imageUrl: newsForm.imageUrl || null, campaignId: newsForm.campaignId || null, displayOrder: parseInt(newsForm.displayOrder), linkUrl: null };
    if (editId) await fetch(`${API}/news/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    else await fetch(`${API}/news`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowForm(false); setEditId(null); setNewsForm({ title: '', content: '', imageUrl: '', campaignId: '', displayOrder: '0' }); load();
  };

  const deleteNews = async (id: string) => { await fetch(`${API}/news/${id}`, { method: 'DELETE' }); load(); };

  const toggleCampaignProducts = async (campaignSlug: string) => {
    if (expandedCampaign === campaignSlug) { setExpandedCampaign(null); return; }
    setExpandedCampaign(campaignSlug);
    // Load campaign products and all products
    const [cpRes, apRes] = await Promise.all([
      fetch(`${API}/campaigns/${campaignSlug}`).then(r => r.json()),
      productsApi.getAll({ limit: 500 }),
    ]);
    if (cpRes.success) setCampaignProducts(cpRes.data.products || []);
    setAllProducts(apRes);
  };

  const addProductToCampaign = async (campaignId: string, productId: string) => {
    await fetch(`${API}/campaigns/${campaignId}/products`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: [productId] })
    });
    if (expandedCampaign) await toggleCampaignProducts(expandedCampaign);
  };

  const removeProductFromCampaign = async (campaignId: string, productId: string) => {
    await fetch(`${API}/campaigns/${campaignId}/products/${productId}`, { method: 'DELETE' });
    if (expandedCampaign) await toggleCampaignProducts(expandedCampaign);
  };

  const campaignProductIds = new Set(campaignProducts.map((p: any) => p.id));
  const filteredAllProducts = allProducts.filter(p =>
    productSearch ? p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.brand?.toLowerCase().includes(productSearch.toLowerCase()) : true
  );

  const uploadNewsImage = async (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    await fetch(`${API}/news/${id}/image`, { method: 'POST', body: fd }); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Campanas y Noticias</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
          <Plus className="h-4 w-4" /> {tab === 'campaigns' ? 'Nueva Campana' : 'Nueva Noticia'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab('campaigns'); setShowForm(false); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 ${tab === 'campaigns' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600'}`}>
          <Percent className="h-3.5 w-3.5" /> Campanas ({campaigns.length})
        </button>
        <button onClick={() => { setTab('news'); setShowForm(false); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 ${tab === 'news' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600'}`}>
          <Newspaper className="h-3.5 w-3.5" /> Noticias ({news.length})
        </button>
      </div>

      {/* Campaign Form */}
      {showForm && tab === 'campaigns' && (
        <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nombre (ej: Black Friday)"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="Slug (auto)"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="number" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: e.target.value})} placeholder="% Descuento"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descripcion"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveCampaign} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Guardar</button>
            <button onClick={() => setShowForm(false)} className="text-neutral-400 text-xs">Cancelar</button>
          </div>
        </div>
      )}

      {/* News Form */}
      {showForm && tab === 'news' && (
        <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 mb-4 space-y-3">
          <input type="text" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} placeholder="Titulo de la noticia"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <textarea value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} placeholder="Contenido..."
            rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={newsForm.imageUrl} onChange={e => setNewsForm({...newsForm, imageUrl: e.target.value})} placeholder="URL imagen (o sube despues)"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <select value={newsForm.campaignId} onChange={e => setNewsForm({...newsForm, campaignId: e.target.value})}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">Sin campana</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={saveNews} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Guardar</button>
            <button onClick={() => setShowForm(false)} className="text-neutral-400 text-xs">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          {/* Campaigns Table */}
          {tab === 'campaigns' && (
            <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Slug</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Descuento</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Periodo</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Estado</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-16">Editar</th>
                </tr></thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <React.Fragment key={c.id}>
                    <tr className={`border-b border-slate-100 hover:bg-blue-50/30 ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-4 py-2 text-sm font-medium text-slate-900">{c.name}</td>
                      <td className="px-4 py-2 text-[10px] font-mono text-neutral-400">{c.slug}</td>
                      <td className="px-4 py-2 text-center"><span className="text-xs font-bold text-red-500">{c.discount_percent}%</span></td>
                      <td className="px-4 py-2 text-[10px] text-neutral-400">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString() : '-'} → {c.end_date ? new Date(c.end_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {c.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => toggleCampaignProducts(c.slug)}
                            className={`p-1.5 rounded-lg transition-colors ${expandedCampaign === c.slug ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            title="Productos"><Package className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { setEditId(c.id); setForm({ name: c.name, slug: c.slug, description: c.description || '', discountPercent: String(c.discount_percent), startDate: c.start_date?.split('T')[0] || '', endDate: c.end_date?.split('T')[0] || '' }); setShowForm(true); }}
                            className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedCampaign === c.slug && (
                      <tr><td colSpan={6} className="px-4 py-3 bg-slate-50/50 border-b border-slate-200">
                        <div className="flex gap-4">
                          {/* Current products */}
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900 mb-2">Productos en esta campana ({campaignProducts.length})</p>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {campaignProducts.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-slate-50 rounded overflow-hidden flex-shrink-0">
                                      {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="h-3 w-3 text-neutral-300 m-auto" />}
                                    </div>
                                    <span className="text-xs text-slate-700 truncate max-w-[150px]">{p.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-red-500 font-bold">{formatPrice(p.sale_price || p.base_price)}</span>
                                    <button onClick={() => removeProductFromCampaign(c.id, p.id)}
                                      className="text-red-300 hover:text-red-500"><X className="h-3 w-3" /></button>
                                  </div>
                                </div>
                              ))}
                              {campaignProducts.length === 0 && <p className="text-[10px] text-neutral-400 text-center py-3">Sin productos</p>}
                            </div>
                          </div>

                          {/* Add products */}
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900 mb-2">Agregar productos</p>
                            <div className="relative mb-2">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-400" />
                              <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                                placeholder="Buscar producto..."
                                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {filteredAllProducts.slice(0, 20).map(p => {
                                const inCampaign = campaignProductIds.has(p.id);
                                return (
                                  <button key={p.id} onClick={() => !inCampaign && addProductToCampaign(c.id, p.id)}
                                    disabled={inCampaign}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors ${inCampaign ? 'bg-green-50 opacity-60' : 'bg-white hover:bg-blue-50'}`}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-slate-50 rounded overflow-hidden flex-shrink-0">
                                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="h-2.5 w-2.5 text-neutral-300 m-auto" />}
                                      </div>
                                      <span className="text-[10px] text-slate-700 truncate max-w-[120px]">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-neutral-400">{formatPrice(p.basePrice)}</span>
                                      {inCampaign && <Check className="h-3 w-3 text-green-500" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </td></tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* News List */}
          {tab === 'news' && (
            <div className="space-y-2">
              {news.map(n => (
                <div key={n.id} className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-4 flex items-center gap-4">
                  {n.image_url ? (
                    <img src={n.image_url} alt="" className="w-20 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <label className="w-20 h-14 rounded-xl bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-blue-50 flex-shrink-0">
                      <Upload className="h-4 w-4 text-slate-400" />
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadNewsImage(n.id, f); }} />
                    </label>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{n.content}</p>
                    {n.campaign_name && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">{n.campaign_name}</span>}
                  </div>
                  <button onClick={() => deleteNews(n.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {news.length === 0 && <p className="text-center py-8 text-neutral-400 text-sm">No hay noticias</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
