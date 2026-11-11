'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, UserRound, X } from 'lucide-react';
import { listsApi } from '@/services/api';
import { copiasDe } from '@/lib/copias';
import { parseExtras } from '@/lib/lista';
import type { SupplyList } from '@/lib/types';

interface Copia { id: string; alumno: string | null; creada: string }

const nombreDe = (l: Pick<SupplyList, 'extras' | 'estudianteNombre'>) =>
  parseExtras(l.extras).etiquetas.nombre.trim() || l.estudianteNombre?.trim() || null;

/**
 * Copias propias de una misma lista del colegio (una por hijo).
 * Junta las guardadas en este navegador y, con sesión, las de la cuenta.
 */
function useCopias(originalId: string, userId: string | undefined, actualId: string | undefined) {
  const [copias, setCopias] = useState<Copia[] | null>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      const porId = new Map<string, Copia>();
      if (userId) {
        try {
          const mias = await listsApi.getAll({ userId });
          mias.filter(l => l.copiaDe === originalId)
            .forEach(l => porId.set(l.id, { id: l.id, alumno: nombreDe(l), creada: l.createdAt }));
        } catch { /* sin sesión válida: quedan las del navegador */ }
      }
      const locales = copiasDe(originalId).filter(id => !porId.has(id));
      const detalles = await Promise.allSettled(locales.map(id => listsApi.getById(id)));
      detalles.forEach((r, i) => {
        // Una copia borrada o inaccesible simplemente no se muestra
        if (r.status === 'fulfilled') porId.set(locales[i], { id: locales[i], alumno: nombreDe(r.value.list), creada: r.value.list.createdAt });
      });
      if (vigente) setCopias([...porId.values()].sort((a, b) => a.creada.localeCompare(b.creada)));
    })();
    return () => { vigente = false; };
  }, [originalId, userId, actualId]);

  return copias;
}

interface Props {
  /** Id de la lista del colegio */
  originalId: string;
  /** Id de la copia abierta (undefined si se está viendo la lista del colegio) */
  actualId?: string;
  userId?: string;
  /** Nombre del alumno de la copia abierta, tal como se está escribiendo en las etiquetas */
  alumnoActual?: string;
  creando: boolean;
  onNueva: (alumno: string) => void;
}

export default function CopiasAlumno({ originalId, actualId, userId, alumnoActual, creando, onNueva }: Props) {
  const copias = useCopias(originalId, userId, actualId);
  const [abierto, setAbierto] = useState(false);
  const [alumno, setAlumno] = useState('');
  const campo = useId();

  if (!copias) return null;
  const enCopia = !!actualId;
  // En la lista del colegio sin copias previas no hay nada que elegir: el aviso de "elige tu opción" basta
  if (!enCopia && copias.length === 0) return null;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = alumno.trim();
    if (nombre) onNueva(nombre);
  };

  return (
    <section aria-label="Listas por alumno" className="mb-5 rounded-2xl border border-linea bg-papel px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-sm text-tenue">
          {enCopia ? 'Listas de este grado:' : 'Ya armaste esta lista:'}
        </p>
        <nav aria-label="Elegir alumno" className="contents">
          {copias.map((c, i) => {
            const actual = c.id === actualId;
            const etiqueta = (actual && alumnoActual?.trim()) || c.alumno || `Copia ${i + 1}`;
            return (
              <Link key={c.id} href={`/lists/${c.id}`} aria-current={actual ? 'page' : undefined}
                className={`inline-flex max-w-[14rem] items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  actual ? 'bg-grafito text-papel' : 'border border-linea-fuerte text-slate-900 hover:bg-fondo'
                }`}>
                <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{etiqueta}</span>
              </Link>
            );
          })}
        </nav>
        {!abierto && (
          <button type="button" onClick={() => setAbierto(true)} disabled={creando}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-primario hover:bg-primario-claro disabled:opacity-50">
            <Plus className="h-4 w-4" aria-hidden="true" /> Otro hijo
          </button>
        )}
      </div>

      {abierto && (
        <form onSubmit={enviar} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 basis-56">
            <label htmlFor={campo} className="mb-1 block text-sm font-semibold">Nombre del alumno</label>
            <input id={campo} value={alumno} onChange={e => setAlumno(e.target.value)} maxLength={60} required autoFocus
              autoComplete="off" placeholder="Ej.: Sofía Pérez"
              className="w-full rounded-xl border border-linea-fuerte bg-papel px-3 py-2 text-sm focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/30" />
          </div>
          <button type="submit" disabled={creando || !alumno.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-grafito px-4 py-2 text-sm font-bold text-papel hover:opacity-90 disabled:opacity-50">
            {creando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Armar su lista
          </button>
          <button type="button" onClick={() => { setAbierto(false); setAlumno(''); }} aria-label="Cancelar"
            className="rounded-xl p-2 text-tenue hover:bg-fondo">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="basis-full text-xs text-tenue">
            Cada alumno tiene su propia lista y en el pedido llega separado con su nombre. Las demás no cambian.
          </p>
        </form>
      )}
    </section>
  );
}
