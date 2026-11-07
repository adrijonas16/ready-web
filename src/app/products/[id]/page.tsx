'use client';

import { volarAlCarrito } from '@/lib/efectos';
import { API, apiFetch } from '@/lib/api-base';
import { useState, useEffect, use } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, ShoppingCart, Star, Check, Package, Minus, Plus, Truck } from 'lucide-react';
import Link from 'next/link';
import NoEncontrado from '@/components/NoEncontrado';
import { tierLabel, Tier } from '@/lib/lista';
import { descuentoPct, enOferta, precioVenta, redondear } from '@/lib/precio';
import { fechaLarga, fechasEntrega, textoEnvio, useAjustes } from '@/lib/ajustes';


interface VariantValue { id: string; value: string; image_url?: string; price_modifier: number; stock: number; is_active: boolean; color_hex?: string }
interface VariantType { id: string; name: string; values: VariantValue[] }
interface ProductImage { id: string; image_url: string; alt_text?: string; is_primary: boolean }
interface ProductDetail {
  id: string; name: string; description?: string; category: string; brand?: string;
  sku: string; basePrice: number; imageUrl?: string; stock: number; rating: number;
  tier: string; variants: VariantType[]; images: ProductImage[];
  salePrice?: number | null; campaignSlug?: string | null;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, VariantValue>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const ajustes = useAjustes();

  useEffect(() => {
    apiFetch(`${API}/products/${id}`).then(r => r.json()).then(d => {
      if (d.success) {
        setProduct(d.data);
        setActiveImage(d.data.images?.[0]?.image_url || d.data.imageUrl || '');
        const defaults: Record<string, VariantValue> = {};
        // Por defecto, el primer valor activo con stock
        d.data.variants?.forEach((vt: VariantType) => {
          const v = vt.values.find(x => x.is_active && x.stock > 0) ?? vt.values.find(x => x.is_active);
          if (v) defaults[vt.id] = v;
        });
        setSelectedVariants(defaults);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primario border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return (
    <NoEncontrado titulo="No encontramos este producto" texto="Puede que el enlace esté mal escrito o que ya no lo vendamos. Mira otros útiles parecidos en el catálogo."
      principal={{ href: '/catalog', texto: 'Ver el catálogo' }} secundarias={[{ href: '/', texto: 'Ir al inicio' }]} />
  );

  const priceModifier = redondear(Object.values(selectedVariants).reduce((sum, v) => sum + (v.price_modifier || 0), 0));
  const oferta = enOferta(product);
  const finalPrice = redondear(precioVenta(product) + priceModifier);
  const precioSinOferta = redondear(product.basePrice + priceModifier);
  const stockElegido = Math.min(product.stock, ...Object.values(selectedVariants).map(v => v.stock));
  const agotado = stockElegido <= 0;
  const primeraEntrega = fechasEntrega(ajustes.diasEntrega, 1)[0];

  // Build all available images: product gallery + selected variant images
  const allImages: { url: string; label: string }[] = [];
  if (product.images?.length > 0) {
    product.images.forEach(img => allImages.push({ url: img.image_url, label: img.alt_text || 'Foto' }));
  } else if (product.imageUrl) {
    allImages.push({ url: product.imageUrl, label: 'Principal' });
  }
  // Add variant images that aren't already in the list
  Object.values(selectedVariants).forEach(v => {
    if (v.image_url && !allImages.find(i => i.url === v.image_url)) {
      allImages.push({ url: v.image_url, label: v.value });
    }
  });

  const selectVariant = (typeId: string, value: VariantValue) => {
    setSelectedVariants(prev => ({ ...prev, [typeId]: value }));
    if (value.image_url) setActiveImage(value.image_url);
  };

  const handleAddToCart = () => {
    // Cada diseño o color es su propia línea del carrito, con su precio (recargo incluido)
    const notes = Object.entries(selectedVariants).map(([tipo, v]) => `${product!.variants?.find(x => x.id === tipo)?.name ?? 'Opción'}: ${v.value}`).join(', ');
    volarAlCarrito(document.getElementById('foto-producto'), activeImage || product!.imageUrl);
    const imagenVariante = Object.values(selectedVariants).find(v => v.image_url)?.image_url;
    addItem({ ...product!, imageUrl: imagenVariante || product!.imageUrl }, quantity, {
      notes: notes || undefined, unitPrice: finalPrice, listPrice: precioSinOferta, recargo: priceModifier || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-6 px-4">
        <Link href="/catalog" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-tenue hover:text-grafito">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al catálogo
        </Link>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Gallery with vertical thumbnails */}
          <div className="flex gap-3">
            {/* Vertical thumbnails - left side */}
            {allImages.length > 1 && (
              <div className="flex flex-col gap-2 w-16 flex-shrink-0">
                {allImages.map((img, i) => (
                  <button key={i} type="button" onClick={() => setActiveImage(img.url)} aria-pressed={activeImage === img.url}
                    aria-label={`Ver foto ${i + 1} de ${allImages.length}${img.label && !/^(Foto|Principal)$/.test(img.label) ? `: ${img.label}` : ''}`}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 flex-shrink-0 ${
                      activeImage === img.url ? 'border-blue-500 shadow-md shadow-blue-500/20' : 'border-transparent hover:border-slate-300'
                    }`}>
                    <img src={img.url} alt="" aria-hidden="true" width={64} height={64} decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1">
              <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="aspect-square bg-slate-50 flex items-center justify-center p-6">
                  {activeImage ? (
                    <img key={activeImage} id="foto-producto" src={activeImage} alt={product.name} width={480} height={480} fetchPriority="high" decoding="async" className="h-full w-full max-w-full max-h-full object-contain rounded-lg animate-scale-in" />
                  ) : (
                    <Package className="h-24 w-24 text-neutral-200" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div>
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-6">
              {/* Badge + Category */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  product.tier === 'premium' ? 'bg-premium-claro text-premium' : product.tier === 'economico' ? 'bg-eco-claro text-eco' : 'bg-primario-claro text-primario'
                }`}>{tierLabel((['economico', 'medio', 'premium'].includes(product.tier) ? product.tier : 'medio') as Tier)}</span>
                <span className="text-xs text-tenue">{product.category}</span>
                {oferta && <span className="rounded-full bg-profe px-2 py-0.5 text-xs font-bold text-white">−{descuentoPct(product)}% Oferta</span>}
              </div>

              {/* Name + Brand */}
              <h1 className="text-xl font-bold text-slate-900 mb-1">{product.name}</h1>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-neutral-400">{product.brand}</span>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                  ))}
                  <span className="text-xs text-neutral-400 ml-1">({product.rating.toFixed(1)})</span>
                </div>
              </div>

              {product.description && <p className="text-sm text-neutral-400 mb-4">{product.description}</p>}

              {/* Price */}
              <div className="mb-5 pb-5 border-b border-slate-100">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={`text-3xl font-bold ${oferta ? 'text-profe' : 'text-slate-900'}`}>{formatPrice(finalPrice)}</span>
                  {oferta && <span className="text-base text-tenue line-through"><span className="sr-only">Antes </span>{formatPrice(precioSinOferta)}</span>}
                  {priceModifier > 0 && <span className="text-xs text-tenue">incluye {formatPrice(priceModifier)} por el diseño</span>}
                </div>
                <p className="text-xs mt-1">
                  {!agotado ? <span className="text-eco font-medium">En stock ({stockElegido})</span> : <span className="text-profe font-medium">Agotado{Object.keys(selectedVariants).length ? ' en esta opción' : ''}</span>}
                </p>
              </div>

              {/* Variants */}
              {product.variants?.map(vt => (
                <div key={vt.id} className="mb-4">
                  <p className="text-sm font-bold text-slate-900 mb-2">
                    {vt.name}: <span className="font-normal text-blue-500">{selectedVariants[vt.id]?.value}</span>
                  </p>

                  {vt.values.some(v => v.color_hex) ? (
                    <div className="flex flex-wrap gap-2.5">
                      {vt.values.filter(v => v.is_active).map(v => (
                        <button key={v.id} type="button" onClick={() => selectVariant(vt.id, v)} title={v.stock > 0 ? v.value : `${v.value} (agotado)`}
                          aria-label={v.stock > 0 ? v.value : `${v.value}, agotado`} aria-pressed={selectedVariants[vt.id]?.id === v.id} disabled={v.stock <= 0}
                          className={`relative w-11 h-11 rounded-full transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
                            selectedVariants[vt.id]?.id === v.id ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'hover:scale-105 ring-1 ring-slate-200'
                          }`} style={{ backgroundColor: v.color_hex || '#ccc' }}>
                          {selectedVariants[vt.id]?.id === v.id && (
                            <Check className={`h-3.5 w-3.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                              parseInt((v.color_hex || '#fff').slice(1), 16) < 0x808080 ? 'text-white' : 'text-slate-900'
                            }`} />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {vt.values.filter(v => v.is_active).map(v => (
                        <button key={v.id} type="button" onClick={() => selectVariant(vt.id, v)} disabled={v.stock <= 0} aria-pressed={selectedVariants[vt.id]?.id === v.id}
                          className={`min-h-11 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-2 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
                            selectedVariants[vt.id]?.id === v.id ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}>
                          {v.image_url && (
                            <img src={v.image_url} alt="" aria-hidden="true" width={32} height={32} loading="lazy" decoding="async" className="w-8 h-8 object-cover" />
                          )}
                          <span className={`${v.image_url ? 'pr-3 py-1.5' : 'px-4 py-2'}`}>
                            {v.value}
                            {v.price_modifier !== 0 && (
                              <span className={`ml-1 text-[10px] ${selectedVariants[vt.id]?.id === v.id ? 'text-white/70' : 'text-neutral-400'}`}>
                                {v.price_modifier > 0 ? `+${formatPrice(v.price_modifier)}` : formatPrice(v.price_modifier)}
                              </span>
                            )}
                            {v.stock <= 0 && <span className="ml-1 text-xs">(agotado)</span>}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5" role="group" aria-label="Cantidad">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Uno menos" disabled={quantity <= 1}
                    className="w-11 h-11 rounded-xl border border-blue-500 text-blue-500 flex items-center justify-center hover:bg-blue-50 disabled:opacity-40"><Minus className="h-4 w-4" aria-hidden="true" /></button>
                  <span className="w-8 text-center text-lg font-bold" aria-live="polite">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(Math.min(Math.max(1, stockElegido), quantity + 1))} aria-label="Uno más" disabled={quantity >= stockElegido}
                    className="w-11 h-11 rounded-xl border border-blue-500 text-blue-500 flex items-center justify-center hover:bg-blue-50 disabled:opacity-40"><Plus className="h-4 w-4" aria-hidden="true" /></button>
                </div>
                <button type="button" onClick={handleAddToCart} disabled={agotado}
                  className={`min-h-12 flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                    added ? 'bg-eco text-white' : agotado ? 'bg-slate-200 text-tenue' : 'bg-acento text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro'
                  }`}>
                  {added ? <><Check className="h-4 w-4" aria-hidden="true" /> Agregado al carrito</> : agotado ? 'Agotado' : <><ShoppingCart className="h-4 w-4" aria-hidden="true" /> Agregar al carrito · {formatPrice(finalPrice * quantity)}</>}
                </button>
              </div>

              {/* Selected summary */}
              {Object.keys(selectedVariants).length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-tenue mb-1">Tu selección:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selectedVariants).map(([typeId, val]) => (
                      <span key={typeId} className="text-xs px-2 py-1 bg-fondo rounded-full text-slate-600">
                        {product.variants?.find(v => v.id === typeId)?.name}: <span className="font-bold">{val.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Envío (mismo costo que en el carrito y el pago) */}
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mt-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primario-claro text-primario"><Truck className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Envío en Arequipa</p>
                  <p className="text-xs text-tenue">{textoEnvio(ajustes, formatPrice)}. Si lo pides hoy, llega desde el {fechaLarga(primeraEntrega?.valor)}.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
