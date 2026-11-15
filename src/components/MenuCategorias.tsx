'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react';
import { etiquetaCategoria, iconoCategoria, urlCatalogo, useArbolCategorias } from '@/lib/categorias';

/**
 * Menú "Categorías" de la cabecera (escritorio): a la izquierda las categorías y, al pasar o enfocar una, a la
 * derecha sus subcategorías con la cantidad de productos. Se cierra con Escape, al hacer clic fuera o al navegar.
 */
export function MenuCategorias() {
  const arbol = useArbolCategorias();
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(0);
  const panelId = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const params = useSearchParams();
  const categoriaActual = pathname === '/catalog' ? params.get('categoria') : null;

  // Al navegar (también entre filtros del catálogo) el menú se cierra
  const ruta = `${pathname}?${params}`;
  const [rutaVista, setRutaVista] = useState(ruta);
  if (ruta !== rutaVista) { setRutaVista(ruta); setAbierto(false); }

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setAbierto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAbierto(false); boton.current?.focus(); } };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', tecla); };
  }, [abierto]);

  const abrir = () => {
    const i = arbol?.findIndex(c => c.nombre === categoriaActual) ?? -1;
    setActiva(i >= 0 ? i : 0);
    setAbierto(a => !a);
  };
  const cat = arbol?.[activa];

  return (
    <div ref={raiz} className="static">
      <button ref={boton} type="button" onClick={abrir} aria-expanded={abierto} aria-controls={panelId}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-[0.95rem] font-medium transition-colors ${abierto ? 'bg-primario-claro text-primario' : 'text-tenue hover:text-grafito'}`}>
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        Categorías
        <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <div id={panelId} hidden={!abierto} className="absolute inset-x-0 top-full border-b border-linea bg-papel shadow-[0_24px_48px_-24px_rgba(15,23,42,0.35)]">
        <div className="mx-auto grid max-w-6xl grid-cols-[17rem_1fr] gap-6 px-6 py-5">
          {/* Categorías */}
          <ul className="border-r border-linea pr-4" aria-label="Categorías">
            {arbol === null
              ? Array.from({ length: 8 }).map((_, i) => <li key={i} className="skeleton my-1.5 h-9 rounded-lg" />)
              : arbol.map((c, i) => {
                const Icono = iconoCategoria(c.nombre);
                return (
                  <li key={c.nombre}>
                    <Link href={urlCatalogo(c.nombre)} onMouseEnter={() => setActiva(i)} onFocus={() => setActiva(i)}
                      aria-current={categoriaActual === c.nombre ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${i === activa ? 'bg-primario-claro text-primario' : 'text-grafito hover:bg-fondo'}`}>
                      <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{etiquetaCategoria(c.nombre)}</span>
                      <ChevronRight className={`h-4 w-4 ${i === activa ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            <li className="mt-2 border-t border-linea pt-2">
              <Link href="/catalog" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primario hover:bg-fondo">
                Ver todo el catálogo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          </ul>

          {/* Subcategorías de la categoría activa */}
          <div aria-live="polite">
            {cat && (
              <>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-lg font-extrabold">{etiquetaCategoria(cat.nombre)}</h2>
                  <Link href={urlCatalogo(cat.nombre)} className="inline-flex items-center gap-1 text-sm font-semibold text-primario hover:underline">
                    Ver los {cat.total} productos <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
                {cat.subcategorias.length > 0 ? (
                  <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-0.5 lg:grid-cols-3" aria-label={`Subcategorías de ${etiquetaCategoria(cat.nombre)}`}>
                    {cat.subcategorias.map(s => (
                      <li key={s.nombre}>
                        <Link href={urlCatalogo(cat.nombre, s.nombre)}
                          className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-grafito hover:bg-fondo hover:text-primario">
                          <span>{s.nombre}</span><span className="text-xs text-tenue tabular-nums">{s.total}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-tenue">Todos los productos de esta categoría están en un solo lugar.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lo mismo para el menú del celular: categorías que se despliegan para mostrar sus subcategorías. */
export function MenuCategoriasMovil({ alElegir }: { alElegir: () => void }) {
  const arbol = useArbolCategorias();
  const [abierto, setAbierto] = useState(false);
  const [desplegada, setDesplegada] = useState<string | null>(null);
  const id = useId();

  return (
    <div>
      <button type="button" onClick={() => setAbierto(a => !a)} aria-expanded={abierto} aria-controls={id}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-medium text-grafito">
        <span className="inline-flex items-center gap-2"><LayoutGrid className="h-4 w-4" aria-hidden="true" /> Categorías</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <ul id={id} hidden={!abierto} className="ml-3 border-l border-linea pl-2">
        {arbol === null && <li className="px-3 py-2 text-sm text-tenue">Cargando…</li>}
        {arbol?.map(c => {
          const Icono = iconoCategoria(c.nombre);
          const subId = `${id}-${c.nombre}`;
          const abiertaEsta = desplegada === c.nombre;
          return (
            <li key={c.nombre}>
              {c.subcategorias.length > 0 ? (
                <button type="button" onClick={() => setDesplegada(abiertaEsta ? null : c.nombre)} aria-expanded={abiertaEsta} aria-controls={subId}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[0.95rem] text-grafito">
                  <Icono className="h-4 w-4 shrink-0 text-tenue" aria-hidden="true" />
                  <span className="flex-1">{etiquetaCategoria(c.nombre)}</span>
                  <ChevronDown className={`h-4 w-4 text-tenue transition-transform ${abiertaEsta ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              ) : (
                <Link href={urlCatalogo(c.nombre)} onClick={alElegir} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.95rem] text-grafito">
                  <Icono className="h-4 w-4 shrink-0 text-tenue" aria-hidden="true" /> {etiquetaCategoria(c.nombre)}
                </Link>
              )}
              {c.subcategorias.length > 0 && (
                <ul id={subId} hidden={!abiertaEsta} className="mb-1 ml-9">
                  <li>
                    <Link href={urlCatalogo(c.nombre)} onClick={alElegir} className="block rounded-lg px-3 py-2 text-sm font-semibold text-primario">
                      Ver todo ({c.total})
                    </Link>
                  </li>
                  {c.subcategorias.map(s => (
                    <li key={s.nombre}>
                      <Link href={urlCatalogo(c.nombre, s.nombre)} onClick={alElegir} className="flex justify-between rounded-lg px-3 py-2 text-sm text-grafito">
                        <span>{s.nombre}</span><span className="text-xs text-tenue">{s.total}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
