'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, ShoppingCart, Star, Check, Package, Minus, Plus } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

interface VariantValue { id: string; value: string; image_url?: string; price_modifier: number; stock: number; is_active: boolean; color_hex?: string }
interface VariantType { id: string; name: string; values: VariantValue[] }
interface ProductImage { id: string; image_url: string; alt_text?: string; is_primary: boolean }
interface ProductDetail {
  id: string; name: string; description?: string; category: string; brand?: string;
  sku: string; basePrice: number; imageUrl?: string; stock: number; rating: number;
  tier: string; variants: VariantType[]; images: ProductImage[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem, items } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, VariantValue>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    fetch(`${API}/products/${id}`).then(r => r.json()).then(d => {
      if (d.success) {
        setProduct(d.data);
        setActiveImage(d.data.images?.[0]?.image_url || d.data.imageUrl || '');
        const defaults: Record<string, VariantValue> = {};
        d.data.variants?.forEach((vt: VariantType) => { if (vt.values.length > 0) defaults[vt.id] = vt.values[0]; });
        setSelectedVariants(defaults);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-sky-100 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return <div className="min-h-screen bg-sky-100 flex items-center justify-center"><p className="text-slate-900 font-bold">Producto no encontrado</p></div>;

  const priceModifier = Object.values(selectedVariants).reduce((sum, v) => sum + (v.price_modifier || 0), 0);
  const finalPrice = product.basePrice + priceModifier;

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
    const notes = Object.entries(selectedVariants).map(([_, v]) => v.value).join(', ');
    addItem({ ...product, basePrice: finalPrice } as any, quantity, notes || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="max-w-5xl mx-auto py-6 px-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-neutral-400 hover:text-slate-700 mb-4 text-sm">
          <ArrowLeft className="h-4 w-4" /> Volver al catalogo
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Gallery with vertical thumbnails */}
          <div className="flex gap-3">
            {/* Vertical thumbnails - left side */}
            {allImages.length > 1 && (
              <div className="flex flex-col gap-2 w-16 flex-shrink-0">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(img.url)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 flex-shrink-0 ${
                      activeImage === img.url ? 'border-blue-500 shadow-md shadow-blue-500/20' : 'border-transparent hover:border-slate-300'
                    }`}>
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1">
              <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="aspect-square bg-slate-50 flex items-center justify-center p-6">
                  {activeImage ? (
                    <img src={activeImage} alt={product.name} className="max-w-full max-h-full object-contain rounded-lg" />
                  ) : (
                    <Package className="h-24 w-24 text-neutral-200" />
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
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  product.tier === 'premium' ? 'bg-amber-100 text-amber-700' : product.tier === 'economico' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>{product.tier}</span>
                <span className="text-xs text-neutral-400">{product.category}</span>
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
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{formatPrice(finalPrice)}</span>
                  {priceModifier !== 0 && <span className="text-sm text-neutral-400 line-through">{formatPrice(product.basePrice)}</span>}
                </div>
                <p className="text-xs mt-1">
                  {product.stock > 0 ? <span className="text-green-600 font-medium">En stock ({product.stock})</span> : <span className="text-red-500 font-medium">Agotado</span>}
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
                        <button key={v.id} onClick={() => selectVariant(vt.id, v)} title={v.value}
                          className={`relative w-9 h-9 rounded-full transition-all duration-150 ${
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
                        <button key={v.id} onClick={() => selectVariant(vt.id, v)}
                          className={`rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-2 overflow-hidden ${
                            selectedVariants[vt.id]?.id === v.id ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}>
                          {v.image_url && (
                            <img src={v.image_url} alt={v.value} className="w-8 h-8 object-cover" />
                          )}
                          <span className={`${v.image_url ? 'pr-3 py-1.5' : 'px-4 py-2'}`}>
                            {v.value}
                            {v.price_modifier !== 0 && (
                              <span className={`ml-1 text-[10px] ${selectedVariants[vt.id]?.id === v.id ? 'text-white/70' : 'text-neutral-400'}`}>
                                {v.price_modifier > 0 ? `+${formatPrice(v.price_modifier)}` : formatPrice(v.price_modifier)}
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl border border-blue-500 text-blue-500 flex items-center justify-center hover:bg-blue-50"><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center text-lg font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:shadow-md hover:shadow-blue-500/25"><Plus className="h-4 w-4" /></button>
                </div>
                <button onClick={handleAddToCart} disabled={product.stock === 0}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                    added ? 'bg-green-500 text-white' : product.stock === 0 ? 'bg-slate-200 text-slate-400' : 'bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/25'
                  }`}>
                  {added ? <><Check className="h-4 w-4" /> Agregado</> : <><ShoppingCart className="h-4 w-4" /> Agregar - {formatPrice(finalPrice * quantity)}</>}
                </button>
              </div>

              {/* Selected summary */}
              {Object.keys(selectedVariants).length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] text-neutral-400 mb-1">Tu seleccion:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selectedVariants).map(([typeId, val]) => (
                      <span key={typeId} className="text-[10px] px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                        {product.variants?.find(v => v.id === typeId)?.name}: <span className="font-bold">{val.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shipping info */}
            <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 mt-4">
              <div className="flex items-center gap-3">
                {/* Arequipa flag */}
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative bg-red-600 flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col">
                    <div className="flex-1 bg-red-600" />
                    <div className="flex-1 bg-white" />
                    <div className="flex-1 bg-red-600" />
                  </div>
                  <div className="relative z-10 w-5 h-5 border-2 border-yellow-400 rounded-full bg-white flex items-center justify-center">
                    <span className="text-[6px]">🏔️</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Envio en Arequipa</p>
                  <p className="text-xs text-neutral-400">Entrega en 24-48 horas en la ciudad</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
