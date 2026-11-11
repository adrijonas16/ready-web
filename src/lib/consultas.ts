// Consultas de producto hechas en este navegador sin iniciar sesión.
// El id es lo único que permite ver la respuesta después, así que se guarda aquí.
import type { Consulta, EstadoConsulta } from '@/lib/types';

const CLAVE = 'ready-consultas';
/** Plazo que se le promete al cliente. Debe coincidir con la API (ConsultasController.Plazo). */
export const HORAS_RESPUESTA = 24;

export function consultasGuardadas(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

export function guardarConsulta(id: string) {
  const ids = [id, ...consultasGuardadas().filter(x => x !== id)].slice(0, 50);
  try { localStorage.setItem(CLAVE, JSON.stringify(ids)); } catch { /* sin almacenamiento */ }
}

export function olvidarConsulta(id: string) {
  try { localStorage.setItem(CLAVE, JSON.stringify(consultasGuardadas().filter(x => x !== id))); } catch { /* nada */ }
}

export const ESTADO_CONSULTA: Record<EstadoConsulta, { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Averiguando', clase: 'bg-acento-claro text-grafito' },
  DISPONIBLE: { texto: 'Sí lo conseguimos', clase: 'bg-eco-claro text-eco' },
  NO_DISPONIBLE: { texto: 'No lo conseguimos', clase: 'bg-profe-claro text-profe' },
};

/** "en 5 h", "en 40 min" o "vencida hace 2 h" respecto al plazo de respuesta. */
export function tiempoRestante(c: Pick<Consulta, 'venceAt'>, ahora = Date.now()): { texto: string; vencida: boolean } {
  const ms = new Date(c.venceAt).getTime() - ahora;
  const abs = Math.abs(ms);
  const horas = Math.floor(abs / 3_600_000);
  const texto = horas >= 1 ? `${horas} h` : `${Math.max(1, Math.round(abs / 60_000))} min`;
  return ms >= 0 ? { texto: `en ${texto}`, vencida: false } : { texto: `vencida hace ${texto}`, vencida: true };
}
