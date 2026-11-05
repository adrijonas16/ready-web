'use client';

import { Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { SupplyItem } from '@/lib/types';
import { Tier, TIERS, tierProduct } from '@/lib/lista';
import PrecioAnimado from '@/components/PrecioAnimado';

export const ESTILO_NIVEL: Record<Tier, { fondo: string; punto: string; anillo: string; boton: string }> = {
  economico: { fondo: 'bg-eco-claro', punto: 'bg-eco', anillo: 'ring-eco', boton: 'bg-eco text-grafito hover:brightness-95' },
  medio: { fondo: 'bg-primario-claro', punto: 'bg-primario', anillo: 'ring-primario', boton: 'bg-primario text-white hover:bg-primario-oscuro' },
  premium: { fondo: 'bg-premium-claro', punto: 'bg-premium', anillo: 'ring-premium', boton: 'bg-premium text-white hover:brightness-110' },
};

export function totalPaquete(items: SupplyItem[], tier: Tier, qty: (i: SupplyItem) => number) {
  return items.reduce((s, i) => {
    // Lo que agregó el cliente cuesta lo mismo en cualquier opción
    const p = i.agregado ? i.matchedProduct : tierProduct(i, tier);
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
          const fotos = items.map(i => tierProduct(i, t.id)?.imageUrl).filter(Boolean).slice(0, 5) as string[];
          return (
            <article key={t.id} className={`group animate-slide-up flex flex-col overflow-hidden rounded-3xl border bg-papel transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.55)] ${eligiendo === t.id ? `animate-elegido border-transparent ring-2 ${e.anillo}` : 'border-linea'}`} style={{ animationDelay: `${TIERS.indexOf(t) * 90}ms` }}>
              <div className={`relative ${e.fondo} px-5 pb-5 pt-4`}>
                {/* Fotos de los útiles de esta opción, en abanico al pasar el mouse */}
                <div className="pointer-events-none absolute bottom-5 right-4 h-12 w-12" aria-hidden="true">
                  {fotos.map((src, k) => (
                    <span key={k} style={{ ['--k' as string]: k, zIndex: 10 - k }}
                      className="absolute right-0 top-0 flex h-12 w-12 translate-x-[calc(var(--k)*-16px)] rotate-[calc((var(--k)-2)*5deg)] items-center justify-center rounded-xl border border-linea bg-white shadow-sm transition-[translate,rotate] duration-500 ease-out group-hover:translate-x-[calc(var(--k)*-26px)] group-hover:-translate-y-1 group-hover:rotate-[calc((var(--k)-2)*9deg)]">
                      <img src={src} alt="" className="h-10 w-10 object-contain" />
                    </span>
                  ))}
                </div>
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
            <PrecioAnimado valor={totalPaquete(items, t.id, qty)} className="block text-base font-extrabold sm:text-lg" />
          </button>
        );
      })}
    </div>
  );
}
