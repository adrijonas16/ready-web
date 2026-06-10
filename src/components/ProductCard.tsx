'use client';

import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { ShoppingCart, Check, Star } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

const bgColors = ['bg-yellow-50', 'bg-green-100', 'bg-orange-200', 'bg-violet-100', 'bg-blue-50', 'bg-pink-50'];

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  onClick?: () => void;
  index?: number;
}

export default function ProductCard({ product, showAddToCart = true, onClick, index = 0 }: ProductCardProps) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const isInCart = items.some((item) => item.product.id === product.id);
  const bgColor = bgColors[index % bgColors.length];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      href={onClick ? '#' : `/products/${product.id}`}
      onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}
      className="group bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.12)] overflow-hidden transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)] cursor-pointer hover:shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)] hover:-translate-y-1 block"
    >
      <div className={`m-3 rounded-2xl ${bgColor} aspect-square relative overflow-hidden`}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            Solo {product.stock}
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            Agotado
          </span>
        )}
      </div>

      <div className="px-4 pb-4 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-black leading-5 tracking-tight line-clamp-2">{product.name}</h3>
          {product.brand && (
            <p className="text-xs text-neutral-400 mt-0.5">{product.brand}</p>
          )}
          <p className="text-sm font-medium text-black mt-1">{formatPrice(product.basePrice)}</p>
        </div>

        <div className="flex flex-col items-end gap-4 ml-3">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-neutral-400">(5.0)</span>
          </div>

          {showAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${
                product.stock === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : added
                  ? 'bg-green-500 text-white scale-110'
                  : isInCart
                  ? 'bg-blue-100 text-blue-500 hover:bg-blue-200'
                  : 'bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/30'
              }`}
            >
              {added ? <Check className="h-4 w-4 animate-check-pop" /> : <ShoppingCart className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
