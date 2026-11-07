'use client';

import { SlidersHorizontal } from 'lucide-react';
import { abrirPreferenciasCookies } from '@/lib/consentimiento';

/** Abre el panel de preferencias de cookies. */
export default function BotonPreferencias() {
  return (
    <button type="button" onClick={abrirPreferenciasCookies}
      className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primario px-5 py-2.5 font-bold text-white hover:bg-primario-oscuro">
      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Cambiar preferencias de cookies
    </button>
  );
}
