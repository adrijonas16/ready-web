import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Envíanos la lista de útiles',
  descripcion: 'Página para que el colegio suba su lista de útiles de cada grado.',
  ruta: '/colegio',
  privada: true,
});

/** Solo metadatos: la página es un componente de cliente. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
