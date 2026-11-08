// Preferencias de cookies: se guardan en localStorage con versión y fecha.
// Si cambia lo que medimos (nuevas categorías o proveedores), sube VERSION y el aviso vuelve a salir.

export const CLAVE_CONSENTIMIENTO = 'ready-cookies';
export const VERSION_CONSENTIMIENTO = 1;
/** Evento de ventana cuando cambian las preferencias (detail: Consentimiento). */
export const EVENTO_CONSENTIMIENTO = 'ready:consentimiento';
/** Evento de ventana para volver a abrir el panel de preferencias. */
export const EVENTO_ABRIR_PREFERENCIAS = 'ready:abrir-cookies';

export interface Consentimiento {
  version: number;
  /** ISO 8601 */
  fecha: string;
  necesarias: true;
  analitica: boolean;
}

/** Preferencias vigentes, o null si la persona aún no eligió (o eligió con una versión anterior). */
export function leerConsentimiento(): Consentimiento | null {
  if (typeof window === 'undefined') return null;
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE_CONSENTIMIENTO) ?? 'null') as Consentimiento | null;
    return c && c.version === VERSION_CONSENTIMIENTO ? c : null;
  } catch { return null; }
}

export function guardarConsentimiento(analitica: boolean): Consentimiento {
  const c: Consentimiento = { version: VERSION_CONSENTIMIENTO, fecha: new Date().toISOString(), necesarias: true, analitica };
  try { localStorage.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify(c)); } catch { /* modo privado sin espacio */ }
  window.dispatchEvent(new CustomEvent(EVENTO_CONSENTIMIENTO, { detail: c }));
  return c;
}

/** Abre el panel de preferencias de cookies desde cualquier parte (pie de página, política de cookies…). */
export function abrirPreferenciasCookies() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_PREFERENCIAS));
}
