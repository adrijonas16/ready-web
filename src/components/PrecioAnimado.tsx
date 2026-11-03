'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/utils';

/** Precio que cuenta hasta el nuevo valor cuando cambia, para que se note cuánto subió o bajó. */
export default function PrecioAnimado({ valor, className = '' }: { valor: number; className?: string }) {
  const [mostrado, setMostrado] = useState(valor);
  const [cambio, setCambio] = useState<'sube' | 'baja' | null>(null);
  const anterior = useRef(valor);

  useEffect(() => {
    const desde = anterior.current;
    anterior.current = valor;
    if (desde === valor) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    if (reducido) {
      frame = requestAnimationFrame(() => setMostrado(valor));
      return () => cancelAnimationFrame(frame);
    }
    const inicio = performance.now();
    const duracion = 450;
    let primero = true;
    const paso = (t: number) => {
      if (primero) { primero = false; setCambio(valor > desde ? 'sube' : 'baja'); }
      const p = Math.min(1, (t - inicio) / duracion);
      const e = 1 - Math.pow(1 - p, 3);
      setMostrado(desde + (valor - desde) * e);
      if (p < 1) frame = requestAnimationFrame(paso);
      else setTimeout(() => setCambio(null), 350);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valor]);

  return (
    <span className={`${className} inline-block tabular-nums transition-colors duration-300 ${cambio === 'sube' ? 'text-acento-oscuro' : cambio === 'baja' ? 'text-eco' : ''}`}>
      {formatPrice(mostrado)}
    </span>
  );
}
