'use client';

import { Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { SupplyItem } from '@/lib/types';
import { Tier, TIERS, tierProduct } from '@/lib/lista';

export const ESTILO_NIVEL: Record<Tier, { fondo: string; punto: string; anillo: string; boton: string }> = {
  economico: { fondo: 'bg-sol-claro', punto: 'bg-sol', anillo: 'ring-sol', boton: 'bg-sol text-grafito hover:brightness-95' },
  medio: { fondo: 'bg-pizarra-claro', punto: 'bg-pizarra', anillo: 'ring-pizarra', boton: 'bg-pizarra text-white hover:bg-pizarra-oscuro' },
  premium: { fondo: 'bg-uva-claro', punto: 'bg-uva', anillo: 'ring-uva', boton: 'bg-uva text-white hover:brightness-110' },
};

export function totalPaquete(items: SupplyItem[], tier: Tier, qty: (i: SupplyItem) => number) {
  return items.reduce((s, i) => {
    const p = tierProduct(i, tier);
    return s + (p ? p.basePrice * qty(i) : 0);
  }, 0);
}

/** Primera vista: la lista ya armada en 3 paquetes para elegir. */
export function ElegirPaquete({ items, qty, onElegir, eligiendo }: {
  items: SupplyItem[];
  qty: (i: SupplyItem) => number;
  onElegir: (t: Tier) => void;
  eligiendo: Tier | null;
}) {
  const conProducto = (t: Tier) => items.filter(i => tierProduct(i, t)).length;

  return (
    <section aria-labelledby="paquetes">
      <h1 id="paquetes" className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Tu lista ya está armada en 3 opciones</h1>
      <p className="mt-2 max-w-2xl text-lg text-tenue">
        Elige una. Después puedes cambiar cualquier útil, quitar lo que ya tienes y agregar forrado, etiquetas, carátulas y libros.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {TIERS.map(t => {
          const e = ESTILO_NIVEL[t.id];
          const muestra = items.map(i => ({ i, p: tierProduct(i, t.id) })).filter(x => x.p).slice(0, 4);
          return (
            <article key={t.id} className="flex flex-col overflow-hidden rounded-3xl border border-linea bg-papel">
              <div className={`${e.fondo} px-5 pb-5 pt-4`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${e.punto}`} aria-hidden="true" />
                  <h2 className="text-xl font-extrabold">{t.label}</h2>
                </div>
                <p className="mt-1 text-sm text-tenue">{t.desc}</p>
                <p className="mt-4 text-4xl font-extrabold tracking-tight tabular-nums">{formatPrice(totalPaquete(items, t.id, qty))}</p>
                <p className="text-sm text-tenue">{conProducto(t.id)} de {items.length} útiles</p>
              </div>
              <ul className="hidden flex-1 space-y-1.5 px-5 py-4 text-sm md:block">
                {muestra.map(({ i, p }) => (
                  <li key={i.id} className="flex gap-2">
                    <span className="min-w-0 flex-1 truncate">{p!.name}</span>
                    <span className="shrink-0 tabular-nums text-tenue">{formatPrice(p!.basePrice * qty(i))}</span>
                  </li>
                ))}
                {items.length > muestra.length && <li className="text-tenue">y {items.length - muestra.length} más</li>}
              </ul>
              <div className="px-5 pb-5 pt-4 md:pt-0">
                <button onClick={() => onElegir(t.id)} disabled={!!eligiendo}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition ${e.boton} disabled:opacity-60`}>
                  {eligiendo === t.id ? 'Armando…' : `Elegir ${t.label}`}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Ya elegido: selector compacto con el total de cada opción. */
export function CambiarPaquete({ items, qty, actual, onElegir }: {
  items: SupplyItem[];
  qty: (i: SupplyItem) => number;
  actual: Tier | null;
  onElegir: (t: Tier) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Opción de la lista" className="grid grid-cols-3 gap-1 rounded-2xl border border-linea bg-papel p-1">
      {TIERS.map(t => {
        const activo = actual === t.id;
        const e = ESTILO_NIVEL[t.id];
        return (
          <button key={t.id} role="radio" aria-checked={activo} onClick={() => onElegir(t.id)}
            className={`rounded-xl px-3 py-2 text-left transition-colors ${activo ? `${e.fondo} ring-2 ring-inset ${e.anillo}` : 'hover:bg-fondo'}`}>
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              {activo ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <span className={`h-2 w-2 rounded-full ${e.punto}`} aria-hidden="true" />}
              {t.label}
            </span>
            <span className="block text-base font-extrabold tabular-nums sm:text-lg">{formatPrice(totalPaquete(items, t.id, qty))}</span>
          </button>
        );
      })}
    </div>
  );
}
