import type { MetadataRoute } from 'next';
import { SITIO_DESCRIPCION, SITIO_NOMBRE } from '@/lib/sitio';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITIO_NOMBRE}: útiles escolares en Arequipa`,
    short_name: SITIO_NOMBRE,
    description: SITIO_DESCRIPCION,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'es-PE',
    dir: 'ltr',
    background_color: '#F8FAFC',
    theme_color: '#1D4ED8',
    categories: ['shopping', 'education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcuts: [
      { name: 'Subir mi lista', url: '/upload' },
      { name: 'Listas de colegios', url: '/lists' },
      { name: 'Catálogo', url: '/catalog' },
    ],
  };
}
