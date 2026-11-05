'use client';

import { useEffect, useRef } from 'react';
import { productos } from '@/demo/catalogo';

// Útiles del catálogo repartidos por los bordes del hero. Se mueven un poco con el puntero.
const PIEZAS = [
  { id: 'la-m', x: '3%', y: '12%', t: 70, giro: -25, prof: 18 },
  { id: 'ti-p', x: '1%', y: '68%', t: 82, giro: 12, prof: 26 },
  { id: 're-e', x: '44%', y: '84%', t: 96, giro: -8, prof: 12 },
  { id: 'cr-m', x: '91%', y: '6%', t: 74, giro: 14, prof: 22 },
  { id: 'bo-m', x: '94%', y: '58%', t: 60, giro: -14, prof: 30 },
  { id: 'pl-p', x: '53%', y: '2%', t: 58, giro: 8, prof: 16 },
];

export default function UtilesFlotantes() {
  const capa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = capa.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
    seccion.addEventListener('pointermove', mover);
    return () => { seccion.removeEventListener('pointermove', mover); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div ref={capa} className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block" aria-hidden="true">
      {PIEZAS.map((p, i) => {
        const prod = productos.find(x => x.id === p.id);
        if (!prod?.imageUrl) return null;
        return (
          <div key={p.id} className="absolute transition-transform duration-700 ease-out"
            style={{ left: p.x, top: p.y, width: p.t, height: p.t, transform: `translate(calc(var(--px, 0) * ${p.prof}px), calc(var(--py, 0) * ${p.prof}px))` }}>
            <img src={prod.imageUrl} alt="" className="h-full w-full animate-flotar object-contain opacity-80 drop-shadow-md"
              style={{ ['--giro' as string]: `${p.giro}deg`, animationDelay: `${-i * 1.1}s` }} />
          </div>
        );
      })}
    </div>
  );
}
