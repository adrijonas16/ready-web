'use client';

import { useEffect, useRef, useState } from 'react';

/** true cuando el elemento está a menos de `margen` de la pantalla (y se queda en true). */
export function useCercano<T extends Element>(margen = '400px') {
  const ref = useRef<T>(null);
  const [cerca, setCerca] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || cerca) return;
    if (typeof IntersectionObserver === 'undefined') { const t = setTimeout(() => setCerca(true), 0); return () => clearTimeout(t); }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setCerca(true); io.disconnect(); } }, { rootMargin: margen });
    io.observe(el);
    return () => io.disconnect();
  }, [margen, cerca]);
  return [ref, cerca] as const;
}
