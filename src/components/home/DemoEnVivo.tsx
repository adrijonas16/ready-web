'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import PrecioAnimado from '@/components/PrecioAnimado';
import type { MiniProducto } from '@/demo/subconjunto';
import { formatPrice } from '@/lib/utils';
import type { Tier } from '@/lib/lista';

import { LINEAS } from './datos';

const NIVELES: { id: Tier; label: string; activo: string }[] = [
  { id: 'economico', label: 'Económico', activo: 'bg-eco text-white' },
  { id: 'medio', label: 'Normal', activo: 'bg-primario text-white' },
  { id: 'premium', label: 'Premium', activo: 'bg-premium text-white' },
];
const PASO_LECTURA = 650;

/**
 * Demostración interactiva del hero: la lista escrita se "lee" línea por línea,
 * cada útil aparece armado con su foto y se puede cambiar entre Económico, Normal y Premium.
 */
export default function DemoEnVivo({ catalogo }: { catalogo: Record<string, MiniProducto> }) {
  const prod = (id: string) => catalogo[id];
  const [leidas, setLeidas] = useState(0);
  const [nivel, setNivel] = useState<Tier>('medio');
  const [tocado, setTocado] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  const quieto = useRef(false);
  const caja = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);

  // Las animaciones se pausan cuando la demostración no está en pantalla (menos trabajo para el celular)
  useEffect(() => {
    const el = caja.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && document.visibilityState === 'visible'));
    io.observe(el);
    const alCambiar = () => setVisible(document.visibilityState === 'visible' && el.getBoundingClientRect().bottom > 0);
    document.addEventListener('visibilitychange', alCambiar);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', alCambiar); };
  }, []);

  // Lectura línea por línea (o todo de una si se pidió reducir movimiento).
  // Empieza cuando la página terminó de cargar y el navegador está libre, para no competir con lo importante.
  useEffect(() => {
    quieto.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto.current) { const t = setTimeout(() => setLeidas(LINEAS.length), 0); return () => clearTimeout(t); }
    let timers: ReturnType<typeof setTimeout>[] = [];
    let idle = 0;
    const empezar = () => { timers = LINEAS.map((_, i) => setTimeout(() => setLeidas(i + 1), 400 + i * PASO_LECTURA)); };
    const cuandoLibre = () => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(empezar, { timeout: 1500 });
      else timers = [setTimeout(empezar, 300)];
    };
    if (vuelta > 0 || document.readyState === 'complete') cuandoLibre();
    else window.addEventListener('load', cuandoLibre, { once: true });
    return () => {
      window.removeEventListener('load', cuandoLibre);
      if (idle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idle);
      timers.forEach(clearTimeout);
    };
  }, [vuelta]);

  // Cuando terminó de leer y nadie tocó nada, muestra las tres opciones solas
  useEffect(() => {
    if (tocado || leidas < LINEAS.length || quieto.current || !visible) return;
    const orden: Tier[] = ['medio', 'premium', 'economico'];
    const t = setInterval(() => setNivel(n => orden[(orden.indexOf(n) + 1) % orden.length]), 2600);
    return () => clearInterval(t);
  }, [tocado, leidas, visible]);

  const leyendo = leidas < LINEAS.length;
  const total = LINEAS.slice(0, leidas).reduce((s, l) => s + prod(l.ids[nivel]).basePrice * l.cantidad, 0);
  const elegir = (t: Tier) => { setTocado(true); setNivel(t); };
  const repetir = () => { setLeidas(0); setTocado(false); setNivel('medio'); setVuelta(v => v + 1); };

  return (
    <figure ref={caja} className="relative mx-auto h-[460px] w-full max-w-[500px] select-none sm:h-[470px]">
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
          <span key={vuelta} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-10 bottom-[30px] animate-escaneo-hoja">
            <span className="block h-10 bg-gradient-to-b from-transparent via-acento/35 to-transparent" />
          </span>
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
              <li key={l.texto} aria-hidden={!lista || undefined} className={`flex h-10 items-center gap-2 rounded-lg px-1 transition-transform duration-500 ${
                lista ? 'visible translate-x-0' : 'invisible translate-x-6'}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-linea bg-white">
                  <img key={p.id} src={p.imageUrl} alt="" aria-hidden="true" width={32} height={32} decoding="async" className="h-8 w-8 animate-voltear object-contain" />
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
