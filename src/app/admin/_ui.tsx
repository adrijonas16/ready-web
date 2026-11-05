'use client';

// Piezas compartidas del panel: avisos (toasts), ventana modal, nombres en español y fechas.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { mensajeError } from '@/lib/api-base';
import { TIERS } from '@/lib/lista';

// ── Avisos ──
interface Aviso { id: number; tipo: 'exito' | 'error'; texto: string }
interface Avisos { exito: (texto: string) => void; error: (err: unknown, porDefecto?: string) => void }
const ContextoAvisos = createContext<Avisos>({ exito: () => {}, error: () => {} });
export const useAvisos = () => useContext(ContextoAvisos);

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const n = useRef(0);
  const quitar = useCallback((id: number) => setAvisos(a => a.filter(x => x.id !== id)), []);
  const agregar = useCallback((tipo: Aviso['tipo'], texto: string) => {
    const id = ++n.current;
    setAvisos(a => [...a.slice(-2), { id, tipo, texto }]);
    setTimeout(() => quitar(id), tipo === 'error' ? 7000 : 3500);
  }, [quitar]);
  const api = useMemo<Avisos>(() => ({
    exito: t => agregar('exito', t),
    error: (err, d) => agregar('error', mensajeError(err, d)),
  }), [agregar]);

  return (
    <ContextoAvisos.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col items-end gap-2 pointer-events-none print:hidden">
        {avisos.map(a => (
          <div key={a.id} role={a.tipo === 'error' ? 'alert' : 'status'} data-aviso={a.tipo}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl animate-slide-up max-w-md text-white ${
              a.tipo === 'exito' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-rose-600'}`}>
            {a.tipo === 'exito' ? <CheckCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" /> : <XCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />}
            <p className="text-sm font-medium">{a.texto}</p>
            <button onClick={() => quitar(a.id)} aria-label="Cerrar aviso" className="p-1 hover:bg-white/20 rounded-lg ml-1"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ContextoAvisos.Provider>
  );
}

// ── Ventana modal ──
export function Modal({ titulo, onClose, children, ancho = 'max-w-lg' }: { titulo: string; onClose: () => void; children: ReactNode; ancho?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className={`bg-white rounded-2xl shadow-xl w-full ${ancho} max-h-[92vh] flex flex-col overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm sm:text-base">{titulo}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Interruptor({ activo, onChange, etiqueta }: { activo: boolean; onChange: (v: boolean) => void; etiqueta: string }) {
  return (
    <button type="button" role="switch" aria-checked={activo} onClick={() => onChange(!activo)} className="flex items-center gap-2 text-sm text-slate-700">
      <span className={`relative w-9 h-5 rounded-full transition-colors ${activo ? 'bg-green-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${activo ? 'translate-x-4' : ''}`} />
      </span>
      {etiqueta}
    </button>
  );
}

export function Cargando() {
  return <div className="flex justify-center py-12" role="status" aria-label="Cargando"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
}

// ── Estilos comunes ──
export const tarjeta = 'bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)]';
export const campo = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none';
export const botonPrimario = 'bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow disabled:opacity-50';
export const th = 'text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap';

// ── Niveles de producto (los mismos nombres que ve el cliente) ──
export const NIVELES = TIERS.map(t => ({ id: t.id, label: t.label }));
export const nombreNivel = (t?: string | null) => NIVELES.find(n => n.id === t)?.label ?? 'Sin nivel';
const COLOR_NIVEL: Record<string, string> = { economico: 'bg-green-100 text-green-700', medio: 'bg-blue-100 text-blue-700', premium: 'bg-amber-100 text-amber-700' };
export function NivelBadge({ tier }: { tier?: string | null }) {
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${COLOR_NIVEL[tier ?? ''] ?? 'bg-slate-100 text-slate-600'}`}>{nombreNivel(tier)}</span>;
}

// ── Roles ──
export const ROLES = [
  { id: 'USER', label: 'Cliente' },
  { id: 'OPERATOR', label: 'Operador' },
  { id: 'ADMIN', label: 'Administrador' },
] as const;
export const nombreRol = (r?: string) => ROLES.find(x => x.id === r)?.label ?? 'Cliente';

// ── Fechas ──
/** "2027-03-01" → "01 mar. 2027" sin correr un día por la zona horaria */
export function fechaCorta(v?: string | null): string {
  if (!v) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  const d = m && v.length <= 10 ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Fecha de hoy en hora local como "AAAA-MM-DD" */
export function hoyISO(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

/** Año escolar que usa la tienda: desde octubre ya se venden las listas del año siguiente */
export function añoEscolar(hoy = new Date()) { return hoy.getFullYear() + (hoy.getMonth() >= 9 ? 1 : 0); }
/** Años que se pueden elegir en el panel: el actual y el siguiente */
export function añosElegibles(hoy = new Date()) { const a = hoy.getFullYear(); return [a, a + 1]; }

/** Dirección web sin tildes, ñ ni símbolos */
export const aSlug = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── Permisos del panel ──
/** El operador solo atiende pedidos y listas */
export const RUTAS_OPERADOR = ['/admin', '/admin/orders', '/admin/lists'];
export function puedeVer(rol: string | undefined, ruta: string) {
  if (rol === 'ADMIN') return true;
  if (rol !== 'OPERATOR') return false;
  return ruta === '/admin' || RUTAS_OPERADOR.slice(1).some(r => ruta === r || ruta.startsWith(r + '/'));
}
