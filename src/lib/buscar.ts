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

/** Palabras de una búsqueda de nombres (colegios, marcas…): sin tildes, sin artículos; los números se conservan. */
function palabrasNombre(q: string): string[] {
  return sinTilde(q).split(/[^a-z0-9ñ]+/).filter(w => w && !/^(de|del|la|las|el|los|y|e|i)$/.test(w));
}

/**
 * Filtra y ordena opciones por su texto, pensado para nombres largos como
 * "Alferez FAP Raul J. Leguia Drago": basta con escribir "raul", "drago" o "leguia raul",
 * en cualquier orden, con o sin tildes. Si no hay coincidencias exactas, tolera errores
 * de tipeo ("raup", "leguya") con una búsqueda aproximada.
 */
export function buscarOpciones<T extends { label: string }>(opciones: T[], q: string, textoDe: (o: T) => string = o => o.label): T[] {
  const palabras = palabrasNombre(q);
  if (palabras.length === 0) return opciones;

  const normal = opciones.map((o, i) => {
    const t = sinTilde(textoDe(o));
    const tokens = t.split(/[^a-z0-9ñ]+/).filter(Boolean);
    return { o, i, t, tokens };
  });

  // 1) Todas las palabras aparecen; primero las que empiezan una palabra del nombre
  const exactas = normal
    .filter(x => palabras.every(w => x.t.includes(w)))
    .map(x => {
      let puntos = 0;
      // Palabra completa (0) < comienzo de palabra (1) < en medio de una palabra (3)
      for (const w of palabras) puntos += x.tokens.includes(w) ? 0 : x.tokens.some(tk => tk.startsWith(w)) ? 1 : 3;
      if (x.t.startsWith(palabras[0])) puntos -= 1;
      return { ...x, puntos };
    })
    .sort((a, b) => a.puntos - b.puntos || a.i - b.i);
  if (exactas.length > 0) return exactas.map(x => x.o);

  // 2) Aproximada: cada palabra se parece a alguna palabra del nombre (errores de tipeo)
  return normal
    .map(x => {
      let total = 0;
      for (const w of palabras) {
        const mejor = Math.min(...x.tokens.map(tk => distanciaPrefijo(w, tk)));
        const tolerancia = w.length <= 2 ? 0 : w.length <= 5 ? 1 : 2;
        if (mejor > tolerancia) return null;
        total += mejor;
      }
      return { ...x, total };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.total - b.total || a.i - b.i)
    .map(x => x.o);
}

/**
 * Cuántas letras hay que cambiar para que `w` sea el comienzo de `palabra`
 * (distancia de edición contra el mejor prefijo): "raup" → "raul" = 1, "legu" → "leguia" = 0.
 */
export function distanciaPrefijo(w: string, palabra: string): number {
  const n = w.length, m = palabra.length;
  if (n === 0) return 0;
  let prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = [i];
    for (let j = 1; j <= m; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (w[i - 1] === palabra[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  // El mejor prefijo de la palabra (puede ser toda la palabra o una parte)
  return Math.min(...prev);
}
