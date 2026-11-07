'use client';

import { useEffect, useRef } from 'react';

import { PIEZAS } from './datos';

/** imagenes: id del producto → foto (la página las pasa; el catálogo no viaja al navegador) */
export default function UtilesFlotantes({ imagenes }: { imagenes: Record<string, string | undefined> }) {
  const capa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = capa.current;
    // Solo en pantallas grandes con mouse (en celular la capa está oculta) y sin "reducir movimiento"
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) return;
    const seccion = el.parentElement!;
    let frame = 0;
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = seccion.getBoundingClientRect();
        el.style.setProperty('--px', String((e.clientX - r.left) / r.width - 0.5));
        el.style.setProperty('--py', String((e.clientY - r.top) / r.height - 0.5));
      });
    };
    seccion.addEventListener('pointermove', mover, { passive: true });
    return () => { seccion.removeEventListener('pointermove', mover); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div ref={capa} className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block" aria-hidden="true">
      {PIEZAS.map((p, i) => {
        const src = imagenes[p.id];
        if (!src) return null;
        return (
          <div key={p.id} className="absolute transition-transform duration-700 ease-out"
            style={{ left: p.x, top: p.y, width: p.t, height: p.t, transform: `translate(calc(var(--px, 0) * ${p.prof}px), calc(var(--py, 0) * ${p.prof}px))` }}>
            <img src={src} alt="" aria-hidden="true" width={p.t} height={p.t} decoding="async" className="h-full w-full animate-flotar object-contain opacity-80 drop-shadow-md"
              style={{ ['--giro' as string]: `${p.giro}deg`, animationDelay: `${-i * 1.1}s` }} />
          </div>
        );
      })}
    </div>
  );
}
