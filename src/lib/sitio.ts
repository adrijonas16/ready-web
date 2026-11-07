import type { Metadata } from 'next';

/** URL pública de la tienda (sin barra final). Única fuente para canonical, sitemap, robots y JSON-LD. */
export const SITIO_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ready-web-gamma.vercel.app').replace(/\/+$/, '');

export const SITIO_NOMBRE = 'Ready';
export const SITIO_LEMA = 'Tu lista de útiles, lista en minutos';
export const SITIO_DESCRIPCION =
  'Útiles escolares en Arequipa: sube la foto de la lista de tu colegio y te la armamos completa en tres opciones (económica, normal y premium), con entrega a domicilio.';

/** URL absoluta a partir de una ruta ("/catalog" → "https://…/catalog"). */
export const urlAbsoluta = (ruta = '/') => `${SITIO_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;

/** Imagen para compartir (la genera app/opengraph-image.tsx). */
const IMAGEN_OG = { url: '/opengraph-image', width: 1200, height: 630, alt: `${SITIO_NOMBRE}: ${SITIO_LEMA}` };

interface OpcionesPagina {
  titulo: string;
  descripcion: string;
  ruta: string;
  /** Páginas de cuenta, carrito, pago…: no se indexan */
  privada?: boolean;
}

/**
 * Metadatos de una página: título, descripción, canonical y Open Graph/Twitter coherentes.
 * openGraph se reemplaza entero al definirlo en un segmento, por eso se arma completo aquí.
 */
export function metadatosPagina({ titulo, descripcion, ruta, privada = false }: OpcionesPagina): Metadata {
  const completo = `${titulo} · ${SITIO_NOMBRE}`;
  return {
    // Título absoluto: una plantilla del padre no atraviesa layouts intermedios que también definen título
    title: { absolute: completo },
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: {
      type: 'website', locale: 'es_PE', siteName: SITIO_NOMBRE, url: ruta,
      title: completo, description: descripcion, images: [IMAGEN_OG],
    },
    twitter: { card: 'summary_large_image', title: completo, description: descripcion, images: [IMAGEN_OG.url] },
    ...(privada ? { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } } : {}),
  };
}

/** Rutas que los buscadores no deben rastrear (robots.txt). */
export const RUTAS_SIN_RASTREO = ['/admin', '/cart', '/checkout', '/profile', '/my-lists', '/orders', '/api', '/demo-api'];

/** Rutas que no deben indexarse (cabecera X-Robots-Tag: noindex). Incluye login y registro, que sí se rastrean. */
export const RUTAS_NOINDEX = [...RUTAS_SIN_RASTREO, '/login', '/register', '/auth', '/send-list'];
