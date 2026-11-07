import type { MetadataRoute } from 'next';
import { RUTAS_SIN_RASTREO, urlAbsoluta } from '@/lib/sitio';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: RUTAS_SIN_RASTREO }],
    sitemap: urlAbsoluta('/sitemap.xml'),
  };
}
