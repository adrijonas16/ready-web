'use client';

import { ChevronRight, Minus, Plus, Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { ItemVariante, SupplyItem } from '@/lib/types';
import { Tier, currentTier, tierLabel } from '@/lib/lista';
import { ESTILO_NIVEL } from './Paquetes';

/** Un útil: foto, marca, producto, diseño elegido, cantidad y precio. Tocarlo abre las opciones. */
export default function FilaUtil({ item, incluido, qty, precio, variantes, onIncluir, onQty, onAbrir }: {
  item: SupplyItem;
  incluido: boolean;
  qty: number;
  precio: number;
  variantes: ItemVariante[];
  onIncluir: (v: boolean) => void;
  onQty: (q: number) => void;
  onAbrir: () => void;
}) {
  const product = item.matchedProduct;
  const tier: Tier | null = currentTier(item)
    ?? (['economico', 'medio', 'premium'].includes(product?.tier ?? '') ? product!.tier as Tier : null);
  const fotoVariante = variantes.find(v => v.imagen)?.imagen;
  const foto = fotoVariante || product?.imageUrl;

  return (
    <li className={`flex gap-3 py-4 ${incluido ? '' : 'opacity-55'}`}>
      <input type="checkbox" checked={incluido} onChange={e => onIncluir(e.target.checked)}
        aria-label={incluido ? `Ya tengo: ${item.nombreOriginal}` : `Volver a agregar: ${item.nombreOriginal}`}
        className="mt-6 h-5 w-5 shrink-0 cursor-pointer rounded accent-primario" />

      <button onClick={onAbrir} disabled={!incluido} aria-label={`Ver opciones para ${item.nombreOriginal}`}
        className="h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-linea bg-fondo transition-[border-color] hover:border-primario disabled:cursor-default sm:h-20 sm:w-20">
        {foto
          ? <img src={foto} alt="" width={80} height={80} loading="lazy" className="h-full w-full object-contain p-1" />
          : <span className="flex h-full items-center justify-center"><Package className="h-6 w-6 text-tenue/40" aria-hidden="true" /></span>}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <button onClick={onAbrir} disabled={!incluido} className="min-w-0 flex-1 cursor-pointer text-left disabled:cursor-default">
            {product ? (
              <>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {product.brand && <span className="font-bold text-primario">{product.brand}</span>}
                  {tier && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ${ESTILO_NIVEL[tier].fondo}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${ESTILO_NIVEL[tier].punto}`} aria-hidden="true" />{tierLabel(tier)}
                    </span>
                  )}
                </span>
                <span className={`mt-0.5 block font-semibold leading-snug ${incluido ? '' : 'line-through'}`}>{product.name}</span>
                {variantes.length > 0 && (
                  <span className="mt-0.5 block text-sm text-grafito">{variantes.map(v => `${v.tipo}: ${v.valor}`).join(', ')}</span>
                )}
                <span className="mt-0.5 block truncate text-sm text-tenue" title={item.nombreOriginal}>Lista: {item.nombreOriginal}</span>
              </>
            ) : (
              <>
                <span className="block font-semibold leading-snug">{item.nombreOriginal}</span>
                <span className="mt-1 inline-block rounded-full bg-profe-claro px-2 py-0.5 text-xs font-semibold text-profe">Aún no lo tenemos, toca para buscar</span>
              </>
            )}
          </button>
          <span className={`shrink-0 pt-4 text-right font-bold tabular-nums ${incluido ? '' : 'line-through'}`}>
            {product ? formatPrice(precio * qty) : '—'}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button onClick={onAbrir} disabled={!incluido}
            className="inline-flex cursor-pointer items-center gap-0.5 text-sm font-semibold text-primario hover:underline disabled:pointer-events-none disabled:opacity-0">
            Ver opciones <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="ml-auto flex items-center rounded-lg border border-linea bg-papel" aria-label="Cantidad">
            <button onClick={() => onQty(Math.max(1, qty - 1))} disabled={!incluido} className="cursor-pointer p-2 hover:text-primario disabled:opacity-40" aria-label="Uno menos"><Minus className="h-3.5 w-3.5" /></button>
            <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
            <button onClick={() => onQty(Math.min(99, qty + 1))} disabled={!incluido} className="cursor-pointer p-2 hover:text-primario disabled:opacity-40" aria-label="Uno más"><Plus className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </li>
  );
}
