import type { MetadataRoute } from 'next';
import { productos, LISTAS_OFICIALES } from '@/demo/catalogo';
import { urlAbsoluta } from '@/lib/sitio';

/** Páginas públicas + productos y listas oficiales de la demo (datos estáticos de src/demo/catalogo.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date();
  const pagina = (ruta: string, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], priority: number) =>
    ({ url: urlAbsoluta(ruta), lastModified: hoy, changeFrequency, priority });

  return [
    pagina('/', 'weekly', 1),
    pagina('/catalog', 'daily', 0.9),
    pagina('/lists', 'weekly', 0.9),
    pagina('/upload', 'monthly', 0.8),
    ...LISTAS_OFICIALES.map(([id]) => pagina(`/lists/${id}`, 'weekly', 0.7)),
    ...productos.filter(p => p.isActive !== false).map(p => pagina(`/products/${p.id}`, 'weekly', 0.6)),
    pagina('/terminos', 'yearly', 0.3),
    pagina('/privacidad', 'yearly', 0.3),
    pagina('/cookies', 'yearly', 0.2),
    pagina('/libro-de-reclamaciones', 'yearly', 0.3),
  ];
}
