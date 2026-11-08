// Google Analytics 4 con Consent Mode v2.
// gtag solo se descarga si hay NEXT_PUBLIC_GA_ID y la persona aceptó la analítica.
// Nunca se envían datos personales: ni nombres, ni correos, ni teléfonos, ni direcciones.

import type { Product } from '@/lib/types';

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: Gtag }
}

let cargado = false;
let permitido = false;

/** Descarga gtag.js y lo configura (solo la primera vez). Llamar únicamente con consentimiento. */
export function activarAnalitica() {
  if (!GA_ID || typeof window === 'undefined') return;
  permitido = true;
  if (cargado) { window.gtag?.('consent', 'update', { analytics_storage: 'granted' }); return; }
  cargado = true;
  window.dataLayer = window.dataLayer || [];
  // gtag necesita el objeto `arguments`, no un arreglo
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag() { window.dataLayer!.push(arguments); };
  // Consent Mode v2: todo negado por defecto; solo se concede la analítica (nunca publicidad)
  window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
  vistaPagina(location.pathname);
}

/** Retira el consentimiento: deja de medir y borra las cookies _ga. */
export function desactivarAnalitica() {
  permitido = false;
  ultimaRuta = '';
  if (typeof window === 'undefined') return;
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  const dominio = location.hostname.split('.').slice(-2).join('.');
  document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(n => /^_ga/.test(n)).forEach(n => {
    for (const d of ['', `; domain=${location.hostname}`, `; domain=.${dominio}`]) document.cookie = `${n}=; Max-Age=0; path=/${d}`;
  });
}

/** Envía un evento de GA4. No hace nada si GA no está cargado o no hay consentimiento. */
export function evento(nombre: string, params: Record<string, unknown> = {}) {
  if (!cargado || !permitido || typeof window === 'undefined') return;
  try { window.gtag?.('event', nombre, params); } catch { /* la analítica nunca rompe la tienda */ }
}

/** page_view manual (navegación del lado del cliente). Solo ruta, sin parámetros de búsqueda. */
let ultimaRuta = '';
export function vistaPagina(ruta: string) {
  if (!cargado || !permitido || ruta === ultimaRuta) return;
  ultimaRuta = ruta;
  evento('page_view', { page_location: location.origin + ruta, page_path: ruta, page_title: document.title });
}

// ── Ayudas para eventos de comercio electrónico (moneda: soles) ──

export interface ItemGA { item_id: string; item_name: string; item_brand?: string; item_category?: string; price: number; quantity: number }

export const itemGA = (p: Pick<Product, 'id' | 'name'> & { brand?: string | null; category?: string | null }, precio: number, cantidad = 1): ItemGA => ({
  item_id: p.id, item_name: p.name, ...(p.brand ? { item_brand: p.brand } : {}), ...(p.category ? { item_category: p.category } : {}),
  price: Math.round(precio * 100) / 100, quantity: cantidad,
});

/** Parámetros estándar { currency, value, items } a partir de líneas. */
export const datosItems = (items: ItemGA[], extra: Record<string, unknown> = {}) => ({
  currency: 'PEN', value: Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100, items, ...extra,
});

/** add_payment_info + purchase al confirmarse un pedido. */
export function medirCompra(entrada: { items: { productId: string; productName?: string; quantity: number; unitPrice: number }[]; pago?: { metodo: string }; costoEnvio?: number; cupon?: string }, pedido: { id: string; total: number }) {
  const items = entrada.items.map(i => ({ item_id: i.productId, item_name: i.productName ?? i.productId, price: i.unitPrice, quantity: i.quantity }));
  evento('add_payment_info', datosItems(items, { payment_type: entrada.pago?.metodo ?? 'desconocido', ...(entrada.cupon ? { coupon: entrada.cupon } : {}) }));
  evento('purchase', { ...datosItems(items), value: pedido.total, transaction_id: pedido.id, shipping: entrada.costoEnvio ?? 0, ...(entrada.cupon ? { coupon: entrada.cupon } : {}) });
}
