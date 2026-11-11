'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react';
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

type Modo = null | 'nueva' | 'renombrar' | 'borrar';

interface Props {
  /** Id de la lista del colegio */
  originalId: string;
  /** Id de la copia abierta (undefined si se está viendo la lista del colegio) */
  actualId?: string;
  userId?: string;
  /** Nombre del alumno de la copia abierta, tal como está en las etiquetas */
  alumnoActual?: string;
  /** Hay una acción en curso (crear o borrar) */
  ocupado: boolean;
  onNueva: (alumno: string) => void;
  /** Cambia el nombre del alumno de la copia abierta */
  onRenombrar: (alumno: string) => void;
  /** Borra la copia abierta; recibe la lista que se abre después */
  onBorrar: (destino: string) => void;
}

const campoClase = 'w-full rounded-xl border border-linea-fuerte bg-papel px-3 py-2 text-sm focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/30';

export default function CopiasAlumno({ originalId, actualId, userId, alumnoActual, ocupado, onNueva, onRenombrar, onBorrar }: Props) {
  const copias = useCopias(originalId, userId, actualId);
  const [modo, setModo] = useState<Modo>(null);
  const [texto, setTexto] = useState('');
  const campo = useId();

  if (!copias) return null;
  const enCopia = !!actualId;
  // En la lista del colegio sin copias previas no hay nada que elegir: el aviso de "elige tu opción" basta
  if (!enCopia && copias.length === 0) return null;

  const etiquetaDe = (c: Copia, i: number) => (c.id === actualId && alumnoActual?.trim()) || c.alumno || `Copia ${i + 1}`;
  const posActual = copias.findIndex(c => c.id === actualId);
  const nombreActual = posActual >= 0 ? etiquetaDe(copias[posActual], posActual) : 'esta lista';

  const abrir = (m: Modo) => { setModo(m); setTexto(m === 'renombrar' ? alumnoActual?.trim() ?? '' : ''); };
  const cerrar = () => { setModo(null); setTexto(''); };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = texto.trim();
    if (!nombre) return;
    if (modo === 'nueva') onNueva(nombre);
    else if (modo === 'renombrar') { onRenombrar(nombre); cerrar(); }
  };

  // Después de borrar se abre la de otro hijo, o la lista del colegio si no queda ninguna
  const borrar = () => onBorrar(copias.find(c => c.id !== actualId)?.id ?? originalId);

  return (
    <section aria-label="Listas por alumno" className="mb-5 rounded-2xl border border-linea bg-papel px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-sm text-tenue">
          {enCopia ? 'Listas de este grado:' : 'Ya armaste esta lista:'}
        </p>
        <nav aria-label="Elegir alumno" className="contents">
          {copias.map((c, i) => {
            const actual = c.id === actualId;
            return (
              <Link key={c.id} href={`/lists/${c.id}`} aria-current={actual ? 'page' : undefined}
                className={`inline-flex max-w-[14rem] items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  actual ? 'bg-grafito text-papel' : 'border border-linea-fuerte text-slate-900 hover:bg-fondo'
                }`}>
                <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{etiquetaDe(c, i)}</span>
              </Link>
            );
          })}
        </nav>
        {modo === null && (
          <>
            <button type="button" onClick={() => abrir('nueva')} disabled={ocupado}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-primario hover:bg-primario-claro disabled:opacity-50">
              <Plus className="h-4 w-4" aria-hidden="true" /> Otro hijo
            </button>
            {enCopia && (
              <span className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => abrir('renombrar')} disabled={ocupado} aria-label={`Cambiar el nombre de ${nombreActual}`} title="Cambiar nombre"
                  className="rounded-full p-2 text-tenue hover:bg-fondo hover:text-slate-900 disabled:opacity-50">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => abrir('borrar')} disabled={ocupado} aria-label={`Borrar la lista de ${nombreActual}`} title="Borrar esta lista"
                  className="rounded-full p-2 text-tenue hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            )}
          </>
        )}
      </div>

      {(modo === 'nueva' || modo === 'renombrar') && (
        <form onSubmit={enviar} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 basis-56">
            <label htmlFor={campo} className="mb-1 block text-sm font-semibold">
              {modo === 'nueva' ? 'Nombre del alumno' : 'Nuevo nombre del alumno'}
            </label>
            <input id={campo} value={texto} onChange={e => setTexto(e.target.value)} maxLength={60} required autoFocus
              autoComplete="off" placeholder="Ej.: Sofía Pérez" className={campoClase} />
          </div>
          <button type="submit" disabled={ocupado || !texto.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-grafito px-4 py-2 text-sm font-bold text-papel hover:opacity-90 disabled:opacity-50">
            {ocupado && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} {modo === 'nueva' ? 'Armar su lista' : 'Guardar'}
          </button>
          <button type="button" onClick={cerrar} aria-label="Cancelar" className="rounded-xl p-2 text-tenue hover:bg-fondo">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="basis-full text-xs text-tenue">
            {modo === 'nueva'
              ? 'Cada alumno tiene su propia lista y en el pedido llega separado con su nombre. Las demás no cambian.'
              : 'El nombre sale en las etiquetas y separa esta lista en el carrito y en el pedido.'}
          </p>
        </form>
      )}

      {modo === 'borrar' && (
        <div role="alertdialog" aria-labelledby={`${campo}-borrar`} className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-slate-900">
          <p id={`${campo}-borrar`} className="min-w-0 flex-1 basis-56 text-sm">
            ¿Borrar la lista de <b>{nombreActual}</b>? Se quitan sus cambios y lo que tenga en el carrito. Los pedidos ya hechos no cambian.
          </p>
          <button type="button" onClick={borrar} disabled={ocupado} autoFocus
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">
            {ocupado && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Borrar
          </button>
          <button type="button" onClick={cerrar} disabled={ocupado} className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-papel">Cancelar</button>
        </div>
      )}
    </section>
  );
}
