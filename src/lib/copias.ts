// Copias personales de listas del colegio guardadas en este navegador.
// Sirve para volver a la versión propia y para reconocer las copias hechas sin iniciar sesión.
const CLAVE = 'ready-copias';

function leer(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch { return {}; }
}

/** Id de la copia propia de una lista del colegio, si existe en este navegador. */
export const copiaDe = (listaId: string): string | undefined => leer()[listaId];

/** true si la lista es una copia hecha en este navegador. */
export const esMiCopia = (listaId: string) => Object.values(leer()).includes(listaId);

export function guardarCopia(original: string, copia: string) {
  try { localStorage.setItem(CLAVE, JSON.stringify({ ...leer(), [original]: copia })); } catch { /* sin almacenamiento */ }
}
