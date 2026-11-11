'use client';

import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';
import { apiJson } from '@/lib/api-base';

/** Valores por defecto (los mismos de la demo) mientras carga GET /settings o si falla. */
export const AJUSTES_POR_DEFECTO: Settings = {
  costoEnvio: 8,
  envioGratisDesde: 150,
  whatsapp: '51951237582',
  telefono: '951 237 582',
  horarioEntrega: 'Lunes a sábado, 9:00 a 18:00',
  diasEntrega: 2,
};

let pedido: Promise<Settings> | null = null;
let cargados: Settings | null = null;

export function cargarAjustes(): Promise<Settings> {
  // fetch (no axios): este archivo lo usa el botón de WhatsApp en todas las páginas
  pedido ??= apiJson<Settings>('/settings')
    .then(s => (cargados = { ...AJUSTES_POR_DEFECTO, ...s }))
    .catch(() => { pedido = null; return AJUSTES_POR_DEFECTO; });
  return pedido;
}

/** Configuración pública de la tienda: costo de envío, WhatsApp, días de entrega… */
export function useAjustes({ diferido = false }: { diferido?: boolean } = {}): Settings {
  const [ajustes, setAjustes] = useState<Settings>(cargados ?? AJUSTES_POR_DEFECTO);
  useEffect(() => {
    let vivo = true;
    const cargar = () => cargarAjustes().then(s => { if (vivo) setAjustes(s); });
    // diferido: espera a que el navegador esté libre (mientras tanto usa los valores por defecto)
    if (!diferido || cargados) { cargar(); return () => { vivo = false; }; }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(cargar, { timeout: 4000 }) : window.setTimeout(cargar, 1500);
    return () => { vivo = false; if (w.cancelIdleCallback) w.cancelIdleCallback(id); else clearTimeout(id); };
  }, [diferido]);
  return ajustes;
}

/** Costo del envío para un subtotal (gratis desde envioGratisDesde). */
export function costoEnvio(subtotal: number, s: Settings): number {
  if (subtotal <= 0) return 0;
  if (s.envioGratisDesde != null && subtotal >= s.envioGratisDesde) return 0;
  return s.costoEnvio;
}

/** Texto corto del envío: "S/ 8.00, gratis desde S/ 150.00". */
export function textoEnvio(s: Settings, formato: (n: number) => string): string {
  if (s.costoEnvio <= 0) return 'Envío gratis en Arequipa';
  return s.envioGratisDesde != null
    ? `Envío ${formato(s.costoEnvio)}, gratis desde ${formato(s.envioGratisDesde)}`
    : `Envío ${formato(s.costoEnvio)}`;
}

export const FRANJAS = ['9:00 a 13:00', '14:00 a 18:00'] as const;

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Próximos días hábiles de entrega (lunes a sábado), desde hoy + diasEntrega días hábiles. */
export function fechasEntrega(diasEntrega: number, cuantas = 6, desde = new Date()): { valor: string; dia: string; fecha: string }[] {
  const d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  let faltan = Math.max(1, diasEntrega);
  while (faltan > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) faltan--; }
  const res: { valor: string; dia: string; fecha: string }[] = [];
  while (res.length < cuantas) {
    if (d.getDay() !== 0) {
      res.push({
        valor: iso(d),
        dia: d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''),
        fecha: d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', ''),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return res;
}

/** "jueves 6 de noviembre" a partir de "2026-11-06". */
export function fechaLarga(valor?: string | null, mayuscula = false): string {
  if (!valor) return '';
  const [a, m, d] = valor.split('-').map(Number);
  if (!a || !m || !d) return valor;
  const t = new Date(a, m - 1, d).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  return mayuscula ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/** Enlace de WhatsApp con un mensaje ya escrito. */
export const enlaceWhatsapp = (numero: string, texto?: string) =>
  `https://wa.me/${numero.replace(/\D/g, '')}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
