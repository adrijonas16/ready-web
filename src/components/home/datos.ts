// Datos de los adornos del inicio. Van aparte (sin 'use client') para que la página,
// que es de servidor, también los pueda leer y pasar solo las fotos necesarias.
import type { Tier } from '@/lib/lista';

// Una lista escrita a mano y cómo se arma en cada opción, con productos reales del catálogo
export const LINEAS: { texto: string; cantidad: number; ids: Record<Tier, string> }[] = [
  { texto: '3 cuad. cuadriculado A4', cantidad: 3, ids: { economico: 'cu-e', medio: 'cu-dibujos', premium: 'cu-p' } },
  { texto: '1 caja colores x24', cantidad: 1, ids: { economico: 'co-e', medio: 'co-m', premium: 'co-p' } },
  { texto: '2 gomas en barra', cantidad: 2, ids: { economico: 'go-e', medio: 'go-m', premium: 'go-p' } },
  { texto: '1 tijera punta roma', cantidad: 1, ids: { economico: 'ti-e', medio: 'ti-m', premium: 'ti-p' } },
  { texto: '1 témperas x7', cantidad: 1, ids: { economico: 'te-e', medio: 'te-m', premium: 'te-p' } },
];
/** Ids de los productos que usa la demostración */
export const IDS_DEMO = LINEAS.flatMap(l => Object.values(l.ids));

// Útiles del catálogo repartidos por los bordes del hero. Se mueven un poco con el puntero.
export const PIEZAS = [
  { id: 'la-m', x: '3%', y: '12%', t: 70, giro: -25, prof: 18 },
  { id: 'ti-p', x: '1%', y: '68%', t: 82, giro: 12, prof: 26 },
  { id: 're-e', x: '44%', y: '84%', t: 96, giro: -8, prof: 12 },
  { id: 'cr-m', x: '91%', y: '6%', t: 74, giro: 14, prof: 22 },
  { id: 'bo-m', x: '94%', y: '58%', t: 60, giro: -14, prof: 30 },
  { id: 'pl-p', x: '53%', y: '2%', t: 58, giro: 8, prof: 16 },
];
