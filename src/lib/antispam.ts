'use client';
// Protección simple contra spam en los formularios públicos:
//  1. Campo trampa ("sitioWeb"): oculto para las personas; los bots lo llenan.
//  2. Tiempo mínimo de llenado: el formulario viaja con "_t" (ms desde que se abrió).
//     Si alguien lo envía antes de TIEMPO_MINIMO, el navegador espera lo que falta.
//  3. Límite de envíos por acción guardado en localStorage (marcas de tiempo).
// El servidor (y la demo) rechazan "sitioWeb" lleno y "_t" menor a TIEMPO_MINIMO.

import { useCallback, useEffect, useRef, useState } from 'react';

export const CAMPO_TRAMPA = 'sitioWeb';
export const TIEMPO_MINIMO = 2500;

/** Cuántos envíos por acción se aceptan en la ventana de tiempo. */
const LIMITES: Record<string, { maximo: number; ventanaMs: number }> = {
  registro: { maximo: 3, ventanaMs: 10 * 60_000 },
  'subir-lista': { maximo: 5, ventanaMs: 10 * 60_000 },
  observacion: { maximo: 8, ventanaMs: 10 * 60_000 },
  'agregar-util': { maximo: 20, ventanaMs: 10 * 60_000 },
};

const clave = (accion: string) => `ready-envios-${accion}`;
function leer(accion: string): number[] {
  try { const v = JSON.parse(localStorage.getItem(clave(accion)) || '[]'); return Array.isArray(v) ? v.filter(n => typeof n === 'number') : []; }
  catch { return []; }
}

/** Mensaje si ya se llegó al límite de envíos de esa acción (o null si puede enviar). */
export function revisarLimite(accion: string, ahora = Date.now()): string | null {
  const l = LIMITES[accion];
  if (!l || typeof window === 'undefined') return null;
  const recientes = leer(accion).filter(t => ahora - t < l.ventanaMs);
  if (recientes.length < l.maximo) return null;
  const minutos = Math.max(1, Math.ceil((l.ventanaMs - (ahora - Math.min(...recientes))) / 60_000));
  return `Hiciste varios envíos seguidos. Espera ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} y vuelve a intentarlo.`;
}

/** Anota un envío exitoso. */
export function anotarEnvio(accion: string, ahora = Date.now()) {
  const l = LIMITES[accion];
  if (!l || typeof window === 'undefined') return;
  try { localStorage.setItem(clave(accion), JSON.stringify([...leer(accion).filter(t => ahora - t < l.ventanaMs), ahora])); } catch { /* sin espacio */ }
}

export interface DatosAntiSpam { sitioWeb: string; _t: number }

/**
 * Estado antispam de un formulario. Uso:
 *   const anti = useAntiSpam('registro');
 *   <CampoTrampa {...anti.trampa} />
 *   const err = anti.revisar(); if (err) …; const extra = await anti.datos(); … ; anti.anotar();
 */
export function useAntiSpam(accion: string) {
  const inicio = useRef(0);
  const [valor, setValor] = useState('');
  useEffect(() => { inicio.current = Date.now(); }, []);

  /** Error de límite de envíos (o null). */
  const revisar = useCallback(() => revisarLimite(accion), [accion]);

  /** Datos que viajan con el envío. Si se envió demasiado rápido, espera lo que falta. */
  const datos = useCallback(async (): Promise<DatosAntiSpam> => {
    const desde = inicio.current || Date.now();
    const falta = TIEMPO_MINIMO - (Date.now() - desde);
    if (falta > 0) await new Promise(r => setTimeout(r, falta + 50));
    return { sitioWeb: valor, _t: Date.now() - desde };
  }, [valor]);

  /** Reinicia el reloj (p. ej. después de enviar, para el siguiente mensaje). */
  const reiniciar = useCallback(() => { inicio.current = Date.now(); }, []);
  const anotar = useCallback(() => anotarEnvio(accion), [accion]);

  return { trampa: { value: valor, onChange: setValor }, revisar, datos, anotar, reiniciar };
}

/** Agrega los datos antispam a un FormData. */
export function anexarAntiSpam(fd: FormData, d: DatosAntiSpam) {
  fd.append(CAMPO_TRAMPA, d.sitioWeb);
  fd.append('_t', String(d._t));
  return fd;
}
