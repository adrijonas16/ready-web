// Piezas comunes de los formularios: etiqueta, ayuda, error accesible y campo trampa (antispam).
import { AlertCircle } from 'lucide-react';
import { CAMPO_TRAMPA } from '@/lib/antispam';

/** Clase de un input/textarea según tenga error o no. */
export const claseInput = (error?: string | null, extra = '') =>
  `w-full rounded-xl border bg-papel px-3 py-2.5 text-base sm:text-sm text-grafito placeholder:text-tenue focus:outline-none focus-visible:ring-2 disabled:opacity-60 ${
    error ? 'border-profe focus-visible:ring-profe/25' : 'border-linea-fuerte focus:border-primario focus-visible:ring-primario/25'} ${extra}`;

/** Mensaje de error de un campo; su id es `${id}-error` (para aria-describedby). */
export function ErrorCampo({ id, error }: { id: string; error?: string | null }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-1 flex items-start gap-1 text-sm text-profe">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{error}
    </p>
  );
}

/** Etiqueta + campo + ayuda o error. El campo hijo debe tener id={id} y {...ariaCampo(id, error, !!ayuda)}. */
export function Campo({ id, etiqueta, obligatorio, opcional, error, ayuda, className, children }: {
  id: string; etiqueta: React.ReactNode; obligatorio?: boolean; opcional?: boolean; error?: string | null; ayuda?: React.ReactNode;
  className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-grafito">
        {etiqueta}
        {obligatorio && <span className="text-profe" aria-hidden="true"> *</span>}
        {opcional && <span className="font-normal text-tenue"> (opcional)</span>}
      </label>
      {children}
      {error ? <ErrorCampo id={id} error={error} /> : ayuda ? <p id={`${id}-ayuda`} className="mt-1 text-xs text-tenue">{ayuda}</p> : null}
    </div>
  );
}

/** Aviso de error general del formulario (respuesta del servidor). */
export function AvisoError({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <div id={id} role="alert" className="flex items-start gap-2 rounded-xl border border-profe/40 bg-profe-claro px-4 py-3 text-sm text-profe">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{children}</span>
    </div>
  );
}

/**
 * Campo trampa: invisible para las personas (fuera de la pantalla, sin tabulación ni autocompletar).
 * Los bots que llenan todos los campos lo completan y el servidor rechaza el envío.
 */
export function CampoTrampa({ value, onChange, sufijo = '' }: { value: string; onChange: (v: string) => void; sufijo?: string }) {
  const id = `trampa-${CAMPO_TRAMPA}${sufijo ? `-${sufijo}` : ''}`;
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
      <label htmlFor={id}>No llenes este campo si eres una persona</label>
      <input id={id} type="text" name={CAMPO_TRAMPA} tabIndex={-1} autoComplete="off"
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
