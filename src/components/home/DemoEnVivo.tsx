'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import PrecioAnimado from '@/components/PrecioAnimado';
import { productos } from '@/demo/catalogo';
import { formatPrice } from '@/lib/utils';
import type { Tier } from '@/lib/lista';

// Una lista escrita a mano y cómo se arma en cada opción, con productos reales del catálogo
const LINEAS: { texto: string; cantidad: number; ids: Record<Tier, string> }[] = [
  { texto: '3 cuad. cuadriculado A4', cantidad: 3, ids: { economico: 'cu-e', medio: 'cu-dibujos', premium: 'cu-p' } },
  { texto: '1 caja colores x24', cantidad: 1, ids: { economico: 'co-e', medio: 'co-m', premium: 'co-p' } },
  { texto: '2 gomas en barra', cantidad: 2, ids: { economico: 'go-e', medio: 'go-m', premium: 'go-p' } },
  { texto: '1 tijera punta roma', cantidad: 1, ids: { economico: 'ti-e', medio: 'ti-m', premium: 'ti-p' } },
  { texto: '1 témperas x7', cantidad: 1, ids: { economico: 'te-e', medio: 'te-m', premium: 'te-p' } },
];
const NIVELES: { id: Tier; label: string; activo: string }[] = [
  { id: 'economico', label: 'Económico', activo: 'bg-eco text-white' },
  { id: 'medio', label: 'Normal', activo: 'bg-primario text-white' },
  { id: 'premium', label: 'Premium', activo: 'bg-premium text-white' },
];
const prod = (id: string) => productos.find(p => p.id === id)!;
const PASO_LECTURA = 650;

/**
 * Demostración interactiva del hero: la lista escrita se "lee" línea por línea,
 * cada útil aparece armado con su foto y se puede cambiar entre Económico, Normal y Premium.
 */
export default function DemoEnVivo() {
  const [leidas, setLeidas] = useState(0);
  const [nivel, setNivel] = useState<Tier>('medio');
  const [tocado, setTocado] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  const quieto = useRef(false);

  // Lectura línea por línea (o todo de una si se pidió reducir movimiento)
  useEffect(() => {
    quieto.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto.current) { const t = setTimeout(() => setLeidas(LINEAS.length), 0); return () => clearTimeout(t); }
    const timers = LINEAS.map((_, i) => setTimeout(() => setLeidas(i + 1), 700 + i * PASO_LECTURA));
    return () => timers.forEach(clearTimeout);
  }, [vuelta]);

  // Cuando terminó de leer y nadie tocó nada, muestra las tres opciones solas
  useEffect(() => {
    if (tocado || leidas < LINEAS.length || quieto.current) return;
    const orden: Tier[] = ['medio', 'premium', 'economico'];
    const t = setInterval(() => setNivel(n => orden[(orden.indexOf(n) + 1) % orden.length]), 2600);
    return () => clearInterval(t);
  }, [tocado, leidas]);

  const leyendo = leidas < LINEAS.length;
  const total = LINEAS.slice(0, leidas).reduce((s, l) => s + prod(l.ids[nivel]).basePrice * l.cantidad, 0);
  const elegir = (t: Tier) => { setTocado(true); setNivel(t); };
  const repetir = () => { setLeidas(0); setTocado(false); setNivel('medio'); setVuelta(v => v + 1); };

  return (
    <figure className="relative mx-auto h-[460px] w-full max-w-[500px] select-none sm:h-[470px]">
      {/* La hoja escrita a mano, con la línea que se está leyendo resaltada */}
      <div className="papel-rayado sombra-hoja absolute left-0 top-0 w-[60%] -rotate-[4deg] overflow-hidden rounded-[6px] pb-6 pl-[46px] pr-3 pt-[14px]">
        <p className="font-mano text-[1.5rem] leading-[38px] text-primario">Lista de útiles</p>
        {LINEAS.map((l, i) => (
          <p key={l.texto} className={`whitespace-nowrap font-mano text-[1.1rem] leading-[52px] transition-colors sm:text-[1.3rem] duration-300 ${
            i < leidas ? 'text-primario' : 'text-primario/45'}`}>
            <span className={`rounded px-1 transition-colors duration-300 ${i === leidas && leyendo ? 'bg-acento/40' : ''}`}>{l.texto}</span>
            {i < leidas && <span className="ml-1 inline-block animate-check-pop text-eco" aria-hidden="true">✓</span>}
          </p>
        ))}
        {leyendo && (
          <span key={vuelta} aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-acento/35 to-transparent animate-escaneo-hoja" />
        )}
      </div>

      {/* La lista armada */}
      <div className="absolute bottom-0 right-0 w-[78%] rounded-2xl sm:w-[70%] border border-linea bg-papel p-3 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.55)]">
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="flex items-center gap-1.5 text-xs font-bold text-tenue">
            <Sparkles className={`h-3.5 w-3.5 ${leyendo ? 'animate-spin text-acento-oscuro' : 'text-eco'}`} aria-hidden="true" />
            <span aria-live="polite">{leyendo ? `Leyendo… ${leidas}/${LINEAS.length}` : 'Tu lista armada'}</span>
          </p>
          {!leyendo && (
            <button type="button" onClick={repetir} className="rounded-lg p-1 text-tenue hover:bg-fondo hover:text-grafito" aria-label="Ver la demostración de nuevo">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div role="radiogroup" aria-label="Opción de la lista" className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-fondo p-1">
          {NIVELES.map(n => (
            <button key={n.id} type="button" role="radio" aria-checked={nivel === n.id} onClick={() => elegir(n.id)}
              className={`rounded-lg px-1 py-1.5 text-xs font-bold transition-[background-color,color,transform] duration-300 active:scale-95 ${
                nivel === n.id ? `${n.activo} shadow-sm` : 'text-tenue hover:text-grafito'}`}>
              {n.label}
            </button>
          ))}
        </div>

        <ul className="mt-2 space-y-1">
          {LINEAS.map((l, i) => {
            const p = prod(l.ids[nivel]);
            const lista = i < leidas;
            return (
              <li key={l.texto} className={`flex h-10 items-center gap-2 rounded-lg px-1 transition-[opacity,transform] duration-500 ${
                lista ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-linea bg-white">
                  <img key={p.id} src={p.imageUrl} alt="" className="h-8 w-8 animate-voltear object-contain" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                  <span className="block truncate text-[11px] text-tenue">{p.brand} · {l.cantidad} un.</span>
                </span>
                <span className="text-[13px] font-bold tabular-nums">{formatPrice(p.basePrice * l.cantidad)}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-2 flex items-baseline justify-between border-t border-linea px-1 pt-2">
          <span className="text-sm font-semibold text-tenue">Total</span>
          <PrecioAnimado valor={total} className="text-xl font-extrabold tabular-nums" />
        </div>
      </div>
      <figcaption className="sr-only">
        Demostración: una lista escrita a mano se convierte en productos del catálogo; se puede cambiar entre Económico, Normal y Premium para ver el precio total.
      </figcaption>
    </figure>
  );
}
