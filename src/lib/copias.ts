// Copias personales de listas del colegio guardadas en este navegador.
// Sirve para volver a la versión propia y para reconocer las copias hechas sin iniciar sesión.
// Una familia puede tener varias copias de la misma lista (hermanos o mellizos del mismo grado).
const CLAVE = 'ready-copias';

function leer(): Record<string, string[]> {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) || '{}') as Record<string, string | string[]>;
    return Object.fromEntries(Object.entries(crudo).map(([k, v]) => [k, Array.isArray(v) ? v : [v]]));
  } catch { return {}; }
}

/** Id de la copia propia más reciente de una lista del colegio, si existe en este navegador. */
export const copiaDe = (listaId: string): string | undefined => leer()[listaId]?.at(-1);

/** Todas las copias propias de una lista del colegio. */
export const copiasDe = (listaId: string): string[] => leer()[listaId] ?? [];

/** true si la lista es una copia hecha en este navegador. */
export const esMiCopia = (listaId: string) => Object.values(leer()).some(v => v.includes(listaId));

/** Olvida una copia borrada */
export function quitarCopia(copia: string) {
  const todas = leer();
  const resto = Object.fromEntries(Object.entries(todas).map(([k, v]) => [k, v.filter(x => x !== copia)]).filter(([, v]) => v.length > 0));
  try { localStorage.setItem(CLAVE, JSON.stringify(resto)); } catch { /* sin almacenamiento */ }
}

export function guardarCopia(original: string, copia: string) {
  const todas = leer();
  const lista = (todas[original] ?? []).filter(x => x !== copia);
  try { localStorage.setItem(CLAVE, JSON.stringify({ ...todas, [original]: [...lista, copia] })); } catch { /* sin almacenamiento */ }
}
