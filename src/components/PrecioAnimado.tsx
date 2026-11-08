'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/utils';

/**
 * Precio que cuenta hasta el nuevo valor cuando cambia, para que se note cuánto subió o bajó.
 * El conteo escribe directo en el texto (sin volver a dibujar con React en cada cuadro).
 */
export default function PrecioAnimado({ valor, className = '' }: { valor: number; className?: string }) {
  const [cambio, setCambio] = useState<'sube' | 'baja' | null>(null);
  const anterior = useRef(valor);
  const texto = useRef<HTMLSpanElement>(null);
  // React escribe el texto solo la primera vez; luego lo actualiza este componente (textContent)
  const [inicial] = useState(() => formatPrice(valor));

  useEffect(() => {
    const desde = anterior.current;
    anterior.current = valor;
    const el = texto.current;
    if (desde === valor || !el) return;
    let frame = 0, espera: ReturnType<typeof setTimeout> | undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = formatPrice(valor);
      return;
    }
    const inicio = performance.now();
    const duracion = 450;
    let primero = true;
    const paso = (t: number) => {
      if (primero) { primero = false; setCambio(valor > desde ? 'sube' : 'baja'); }
      const p = Math.min(1, (t - inicio) / duracion);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = formatPrice(desde + (valor - desde) * e);
      if (p < 1) frame = requestAnimationFrame(paso);
      else espera = setTimeout(() => setCambio(null), 350);
    };
    frame = requestAnimationFrame(paso);
    return () => { cancelAnimationFrame(frame); clearTimeout(espera); el.textContent = formatPrice(valor); };
  }, [valor]);

  return (
    <span ref={texto} className={`${className} inline-block tabular-nums transition-colors duration-300 ${cambio === 'sube' ? 'text-acento-oscuro' : cambio === 'baja' ? 'text-eco' : ''}`}>
      {inicial}
    </span>
  );
}
