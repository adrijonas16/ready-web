'use client';

import { MODO_DEMO } from '@/lib/api-base';

/** Línea del pie que avisa que es una tienda de ejemplo y permite empezar de cero. */
export default function AvisoDemo() {
  if (!MODO_DEMO) return null;
  const reiniciar = async () => {
    const { reiniciarDemo } = await import('@/demo/servidor');
    reiniciarDemo();
    ['token', 'user', 'cart', 'cart_extra'].forEach(k => { try { localStorage.removeItem(k); } catch { /* nada */ } });
    window.location.href = '/';
  };
  return (
    <p className="border-t border-linea py-3 text-center text-xs text-tenue">
      Tienda de demostración: los productos, colegios y pagos son de prueba y no se cobra nada.{' '}
      <button type="button" onClick={reiniciar} className="font-semibold text-primario underline underline-offset-2 hover:text-primario-oscuro">
        Reiniciar la demo
      </button>
    </p>
  );
}
