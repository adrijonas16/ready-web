'use client';

import Link from 'next/link';
import { abrirPreferenciasCookies } from '@/lib/consentimiento';

/** Libro abierto, el ícono habitual del Libro de Reclamaciones en las tiendas del Perú. */
function IconoLibro({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 8.5C13 6.5 8.5 6 4 6.5v18c4.5-.5 9 0 12 2 3-2 7.5-2.5 12-2v-18c-4.5-.5-9 0-12 2z" fill="#B91C1C" />
      <path d="M16 8.5v18" stroke="#fff" strokeWidth="1.6" />
      <path d="M7 11h6M7 14.5h6M7 18h4.5M19 11h6M19 14.5h6M19 18h4.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Columna "Ayuda y legal" del pie: políticas, preferencias de cookies y Libro de Reclamaciones. */
export default function PieLegal() {
  const enlace = 'text-tenue hover:text-primario';
  return (
    <nav aria-label="Ayuda y legal" className="flex flex-col gap-2 text-sm">
      <p className="font-semibold text-grafito">Ayuda y legal</p>
      <Link href="/terminos" className={enlace}>Términos y condiciones</Link>
      <Link href="/privacidad" className={enlace}>Política de privacidad</Link>
      <Link href="/cookies" className={enlace}>Política de cookies</Link>
      <button type="button" onClick={abrirPreferenciasCookies} className={`w-fit cursor-pointer text-left ${enlace}`}>
        Preferencias de cookies
      </button>
      <Link href="/libro-de-reclamaciones"
        className="mt-2 inline-flex w-fit items-center gap-2.5 rounded-xl border border-linea bg-fondo px-3 py-2 font-semibold text-grafito hover:border-grafito">
        <IconoLibro />
        <span className="leading-tight">Libro de<br />Reclamaciones</span>
      </Link>
    </nav>
  );
}
