'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Minus, Plus, Package, Search, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { SupplyItem } from '@/lib/types';
import { Tier, TIERS, currentTier, tierLabel, tierProduct } from '@/lib/lista';
import { ESTILO_NIVEL } from './Paquetes';

/** Un útil en una sola fila: incluir, producto, nivel, cantidad y precio. */
export default function FilaUtil({ item, incluido, qty, onIncluir, onQty, onTier, onBuscar }: {
  item: SupplyItem;
  incluido: boolean;
  qty: number;
  onIncluir: (v: boolean) => void;
  onQty: (q: number) => void;
  onTier: (t: Tier) => void;
  onBuscar: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const product = item.matchedProduct;
  const tier = currentTier(item);

  useEffect(() => {
    if (!menu) return;
    const cerrar = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', cerrar); document.removeEventListener('keydown', esc); };
  }, [menu]);

  const stepper = (
    <div className="flex shrink-0 items-center rounded-lg border border-linea bg-papel" aria-label="Cantidad">
      <button onClick={() => onQty(Math.max(1, qty - 1))} disabled={!incluido} className="p-1.5 hover:text-primario disabled:opacity-40" aria-label="Uno menos"><Minus className="h-3.5 w-3.5" /></button>
      <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
      <button onClick={() => onQty(Math.min(99, qty + 1))} disabled={!incluido} className="p-1.5 hover:text-primario disabled:opacity-40" aria-label="Uno más"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );

  return (
    <li className={`flex items-start gap-3 py-3 ${incluido ? '' : 'opacity-55'}`}>
      <input type="checkbox" checked={incluido} onChange={e => onIncluir(e.target.checked)}
        aria-label={incluido ? `Ya tengo: ${item.nombreOriginal}` : `Volver a agregar: ${item.nombreOriginal}`}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-primario sm:mt-3" />

      <div className="hidden h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-linea bg-fondo sm:block">
        {product?.imageUrl
          ? <img src={product.imageUrl} alt="" width={44} height={44} loading="lazy" className="h-full w-full object-cover" />
          : <div className="flex h-full items-center justify-center"><Package className="h-4 w-4 text-tenue/50" aria-hidden="true" /></div>}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <p className={`min-w-0 flex-1 font-semibold leading-snug sm:truncate ${incluido ? '' : 'line-through'}`}>
            {product?.name ?? item.nombreOriginal}
          </p>
          <div className="hidden sm:block">{stepper}</div>
          <span className={`w-[4.5rem] shrink-0 text-right font-bold tabular-nums ${incluido ? '' : 'line-through'}`}>
            {product ? formatPrice(product.basePrice * qty) : '—'}
          </span>
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-sm text-tenue sm:-mt-2">
          {product ? (
            <div ref={ref} className="relative shrink-0">
              <button onClick={() => setMenu(m => !m)} disabled={!incluido} aria-haspopup="menu" aria-expanded={menu}
                className="inline-flex items-center gap-1 rounded-full border border-linea bg-papel px-2 py-0.5 text-xs font-semibold text-grafito hover:border-tenue disabled:pointer-events-none">
                {tier && <span className={`h-1.5 w-1.5 rounded-full ${ESTILO_NIVEL[tier].punto}`} aria-hidden="true" />}
                {tierLabel(tier)} <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </button>
              {menu && (
                <div role="menu" className="absolute left-0 top-7 z-30 w-64 rounded-xl border border-linea bg-papel p-1 shadow-lg">
                  {TIERS.map(t => {
                    const p = tierProduct(item, t.id, true);
                    return (
                      <button key={t.id} role="menuitem" disabled={!p} onClick={() => { onTier(t.id); setMenu(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-fondo disabled:opacity-40">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${ESTILO_NIVEL[t.id].punto}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-grafito">{t.label}</span>
                          <span className="block truncate text-xs text-tenue">{p ? p.name : 'No hay en este nivel'}</span>
                        </span>
                        {p && <span className="shrink-0 text-sm font-semibold tabular-nums text-grafito">{formatPrice(p.basePrice)}</span>}
                        {tier === t.id && <Check className="h-4 w-4 shrink-0 text-primario" aria-hidden="true" />}
                      </button>
                    );
                  })}
                  <button role="menuitem" onClick={() => { onBuscar(); setMenu(false); }}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-linea px-2.5 py-2 text-left text-sm font-semibold text-primario hover:bg-fondo">
                    <Search className="h-3.5 w-3.5" aria-hidden="true" /> Elegir otro producto
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onBuscar} className="shrink-0 rounded-full bg-acento-claro px-2 py-0.5 text-xs font-semibold text-profe">
              No lo tenemos, buscar
            </button>
          )}
          <span className="hidden truncate sm:inline" title={item.nombreOriginal}>{product ? `Lista: ${item.nombreOriginal}` : item.notas}</span>
          <div className="ml-auto sm:hidden">{stepper}</div>
        </div>
      </div>
    </li>
  );
}
