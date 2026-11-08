'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { datosItems, evento, itemGA, vistaPagina } from '@/lib/analytics';

/**
 * page_view en cada navegación del lado del cliente y begin_checkout al entrar al pago.
 * No hace nada si GA no está activo (sin NEXT_PUBLIC_GA_ID o sin consentimiento).
 */
export default function Analitica() {
  const ruta = usePathname();
  const { items } = useCart();
  const pagoMedido = useRef(false);

  useEffect(() => { vistaPagina(ruta); }, [ruta]);

  useEffect(() => {
    if (ruta !== '/checkout') { pagoMedido.current = false; return; }
    if (pagoMedido.current || items.length === 0) return;
    pagoMedido.current = true;
    evento('begin_checkout', datosItems(items.map(i => itemGA(i.product, i.unitPrice, i.quantity))));
  }, [ruta, items]);

  return null;
}
