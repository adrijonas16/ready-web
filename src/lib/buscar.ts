// Búsqueda sin importar tildes, mayúsculas ni plurales ("lapices" encuentra "Lápiz", "tijeras" encuentra "Tijera").

export const sinTilde = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Raíz aproximada en singular: lápices → lapiz, colores → color, tijeras → tijera. */
export function raiz(palabra: string): string {
  const w = sinTilde(palabra);
  if (w.length > 4 && w.endsWith('ces')) return w.slice(0, -3) + 'z';
  if (w.length > 4 && /[^aeiou]es$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
  return w;
}

/** Palabras útiles de una búsqueda (sin artículos ni números sueltos), ya en raíz. */
export function palabrasDe(q: string): string[] {
  return sinTilde(q).split(/[^a-z0-9ñ]+/).filter(w => w.length > 1 && !/^(de|la|el|los|las|un|una|con|para|y)$/.test(w)).map(raiz);
}

/** true si el texto contiene todas las palabras de la búsqueda. */
export function coincide(texto: string, q: string): boolean {
  const palabras = palabrasDe(q);
  if (palabras.length === 0) return true;
  const t = sinTilde(texto);
  return palabras.every(w => t.includes(w));
}

/** true si el texto contiene alguna de las palabras (para emparejar útiles de una lista). */
export function coincideAlguna(texto: string, q: string): boolean {
  const palabras = palabrasDe(q).filter(w => w.length > 2 && !/^\d+$/.test(w));
  if (palabras.length === 0) return false;
  const t = sinTilde(texto);
  return palabras.some(w => t.includes(w));
}
