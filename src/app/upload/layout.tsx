import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Sube la foto de tu lista',
  descripcion: 'Toma una foto de la lista de útiles de tu colegio y te la armamos completa en tres opciones. Revisión humana incluida.',
  ruta: '/upload',
});

/** Solo metadatos: la página es un componente de cliente. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
