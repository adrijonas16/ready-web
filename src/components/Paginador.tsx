'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Paginación de una lista que ya está en memoria.
 * `clave` resume los filtros: cuando cambia, se vuelve a la página 1.
 * Si la lista se achica (p. ej. al quitar un elemento), la página se ajusta sola.
 */
export function usePaginacion<T>(items: T[], porPagina: number, clave = '') {
  const [pagina, setPagina] = useState(1);
  const [claveAnterior, setClaveAnterior] = useState(clave);
  if (clave !== claveAnterior) {
    // Ajuste durante el render (patrón recomendado por React para estado derivado de props)
    setClaveAnterior(clave);
    setPagina(1);
  }
  const paginas = Math.max(1, Math.ceil(items.length / porPagina));
  const actual = Math.min(pagina, paginas);
  const visibles = useMemo(() => items.slice((actual - 1) * porPagina, actual * porPagina), [items, actual, porPagina]);
  return { pagina: actual, setPagina, paginas, total: items.length, porPagina, visibles };
}

/** Números a mostrar: 1 … 4 5 6 … 20 */
function numeros(pagina: number, paginas: number): (number | '…')[] {
  if (paginas <= 7) return Array.from({ length: paginas }, (_, i) => i + 1);
  const set = new Set([1, paginas, pagina - 1, pagina, pagina + 1].filter(n => n >= 1 && n <= paginas));
  const orden = [...set].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  orden.forEach((n, i) => { if (i > 0 && n - orden[i - 1] > 1) out.push('…'); out.push(n); });
  return out;
}

const ESTILOS = {
  panel: {
    texto: 'text-xs text-slate-500',
    boton: 'min-w-8 h-8 px-2 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white',
    actual: 'min-w-8 h-8 px-2 rounded-lg text-xs font-bold bg-blue-500 text-white',
  },
  tienda: {
    texto: 'text-sm text-tenue',
    boton: 'min-w-10 h-10 px-3 rounded-xl text-sm font-semibold border border-linea bg-papel hover:bg-fondo disabled:opacity-40 disabled:hover:bg-papel',
    actual: 'min-w-10 h-10 px-3 rounded-xl text-sm font-bold bg-grafito text-papel',
  },
} as const;

/**
 * Paginador accesible: "Mostrando 21–40 de 191", anterior/siguiente y números de página.
 * `anclaId`: al cambiar de página se lleva la vista al comienzo de la lista.
 */
export default function Paginador({ pagina, paginas, total, porPagina, onCambiar, nombre = 'resultados', anclaId, variante = 'panel' }: {
  pagina: number; paginas: number; total: number; porPagina: number;
  onCambiar: (p: number) => void;
  /** Qué se cuenta: "pedidos", "productos"… */
  nombre?: string;
  anclaId?: string;
  variante?: keyof typeof ESTILOS;
}) {
  const e = ESTILOS[variante];
  if (total === 0) return null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);

  const ir = (p: number) => {
    if (p < 1 || p > paginas || p === pagina) return;
    onCambiar(p);
    const ancla = anclaId ? document.getElementById(anclaId) : null;
    if (ancla) ancla.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className={e.texto}>Mostrando {desde}–{hasta} de {total} {nombre}</p>
      {paginas > 1 && (
        <nav aria-label={`Páginas de ${nombre}`} className="flex flex-wrap items-center gap-1">
          <button type="button" onClick={() => ir(pagina - 1)} disabled={pagina === 1} className={`${e.boton} inline-flex items-center gap-1`} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Anterior</span>
          </button>
          {numeros(pagina, paginas).map((n, i) => n === '…'
            ? <span key={`e${i}`} className={`px-1 ${e.texto}`} aria-hidden="true">…</span>
            : (
              <button key={n} type="button" onClick={() => ir(n)} aria-current={n === pagina ? 'page' : undefined}
                aria-label={`Página ${n}`} className={n === pagina ? e.actual : e.boton}>
                {n}
              </button>
            ))}
          <button type="button" onClick={() => ir(pagina + 1)} disabled={pagina === paginas} className={`${e.boton} inline-flex items-center gap-1`} aria-label="Página siguiente">
            <span className="hidden sm:inline">Siguiente</span> <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
      <span className="sr-only" aria-live="polite">{paginas > 1 ? `Página ${pagina} de ${paginas}` : ''}</span>
    </div>
  );
}
