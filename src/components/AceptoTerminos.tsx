'use client';

import { useId } from 'react';
import Link from 'next/link';

interface Props {
  /** Estado de la casilla (componente controlado) */
  checked: boolean;
  onChange: (aceptado: boolean) => void;
  /** Mensaje de error a mostrar debajo (p. ej. tras intentar enviar sin marcar) */
  error?: string | null;
  /** Nombre del campo en el formulario (FormData) */
  name?: string;
  className?: string;
}

/**
 * Casilla obligatoria «Acepto los Términos y la Política de Privacidad».
 * Uso: <AceptoTerminos checked={acepto} onChange={setAcepto} error={intentado && !acepto ? 'Debes aceptar…' : null} />
 * Los enlaces abren en otra pestaña para no perder lo escrito en el formulario.
 */
export default function AceptoTerminos({ checked, onChange, error, name = 'aceptoTerminos', className = '' }: Props) {
  const id = useId();
  const enlace = 'font-semibold text-primario underline underline-offset-2 hover:text-primario-oscuro';
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input id={id} name={name} type="checkbox" required checked={checked} onChange={e => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primario" />
        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-grafito">
          Acepto los{' '}
          <Link href="/terminos" target="_blank" rel="noopener" className={enlace}>Términos y condiciones<span className="sr-only"> (se abre en otra pestaña)</span></Link>
          {' '}y la{' '}
          <Link href="/privacidad" target="_blank" rel="noopener" className={enlace}>Política de privacidad<span className="sr-only"> (se abre en otra pestaña)</span></Link>.
          <span aria-hidden="true" className="text-profe"> *</span>
        </label>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-1 pl-8 text-sm font-semibold text-profe">{error}</p>}
    </div>
  );
}
