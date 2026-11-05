'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Check, Package, Plus } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { TIERS } from '@/lib/lista';
import { volarAlCarrito } from '@/lib/efectos';
import { descuentoPct, enOferta, precioVenta } from '@/lib/precio';

const PUNTO_NIVEL: Record<string, string> = { economico: 'bg-eco', medio: 'bg-primario', premium: 'bg-premium' };

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  onClick?: () => void;
  index?: number;
}

/** Tarjeta de producto de tienda: foto, marca, nivel, precio y botón para agregar al carrito. */
export default function ProductCard({ product, showAddToCart = true, onClick }: ProductCardProps) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const enCarrito = items.filter(i => i.product.id === product.id && !i.para).reduce((s, i) => s + i.quantity, 0);
  const oferta = enOferta(product);
  const agotado = product.stock <= 0;
  const nivel = TIERS.find(t => t.id === product.tier);
  const href = `/products/${product.id}`;

  const foto = useRef<HTMLDivElement>(null);
  const tarjeta = useRef<HTMLElement>(null);

  // Inclinación suave siguiendo el puntero (solo con mouse)
  const inclinar = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !tarjeta.current) return;
    const r = tarjeta.current.getBoundingClientRect();
    tarjeta.current.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -6}deg`);
    tarjeta.current.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
  };
  const enderezar = () => { tarjeta.current?.style.setProperty('--rx', '0deg'); tarjeta.current?.style.setProperty('--ry', '0deg'); };

  const agregar = () => {
    volarAlCarrito(foto.current, product.imageUrl);
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const Contenido = (
    <>
      <div ref={foto} className="relative aspect-square overflow-hidden rounded-xl bg-fondo">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} width={300} height={300} loading="lazy"
              className="h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.07] group-hover:-rotate-2" />
          : <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-tenue/40" aria-hidden="true" /></div>}
        {agotado && <span className="absolute left-2 top-2 rounded-full bg-grafito px-2 py-0.5 text-xs font-semibold text-white">Agotado</span>}
        {!agotado && product.stock < 10 && <span className="absolute left-2 top-2 rounded-full bg-acento-claro px-2 py-0.5 text-xs font-semibold text-grafito">Quedan {product.stock}</span>}
        {oferta && <span className="absolute right-2 top-2 rounded-full bg-profe px-2 py-0.5 text-xs font-bold text-white">−{descuentoPct(product)}%</span>}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-xs">
        {nivel && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PUNTO_NIVEL[nivel.id]}`} aria-hidden="true" />}
        <span className="truncate font-semibold text-primario">{product.brand || nivel?.label}</span>
        {nivel && product.brand && <span className="shrink-0 text-tenue">{nivel.label}</span>}
      </div>
      <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-grafito">{product.name}</h3>
    </>
  );

  return (
    <article ref={tarjeta} onPointerMove={inclinar} onPointerLeave={enderezar}
      className="tarjeta-inclinable group flex flex-col rounded-2xl border border-linea bg-papel p-3 hover:border-primario/40 hover:shadow-[0_18px_36px_-18px_rgba(15,23,42,0.5)]">
      {onClick
        ? <button onClick={onClick} className="cursor-pointer text-left">{Contenido}</button>
        : <Link href={href} className="block">{Contenido}</Link>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="min-w-0">
          {oferta && <span className="block truncate text-xs text-tenue line-through tabular-nums"><span className="sr-only">Antes </span>{formatPrice(product.basePrice)}</span>}
          <span className={`block truncate text-base font-bold tabular-nums sm:text-lg ${oferta ? 'text-profe' : ''}`}>{formatPrice(precioVenta(product))}</span>
        </span>
        {showAddToCart && (
          <button onClick={agregar} disabled={agotado} aria-label={`Agregar ${product.name} al carrito`}
            className={`inline-flex h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl px-2.5 sm:px-3 text-sm font-bold transition-[background-color,transform] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
              added ? 'bg-eco text-white' : 'bg-acento text-grafito hover:bg-acento-oscuro'}`}>
            {added
              ? <><Check className="h-4 w-4 animate-check-pop" aria-hidden="true" /><span className="hidden sm:inline">Listo</span></>
              : <><Plus className="h-4 w-4" aria-hidden="true" />{enCarrito > 0 ? enCarrito : <span className="hidden sm:inline">Agregar</span>}</>}
          </button>
        )}
      </div>
    </article>
  );
}
