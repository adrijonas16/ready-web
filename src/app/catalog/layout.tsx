import { metadatosPagina } from '@/lib/sitio';
import { jsonLdMigas } from '@/lib/json-ld';

export const metadata = metadatosPagina({
  titulo: 'Catálogo de útiles escolares',
  descripcion: 'Cuadernos, colores, plumones, mochilas y más, en opciones económica, normal y premium. Arma tu pedido de útiles con entrega en Arequipa.',
  ruta: '/catalog',
});

/** Metadatos y migas (BreadcrumbList): la página es un componente de cliente. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdMigas([['Inicio', '/'], ['Catálogo', '/catalog']])) }} />
      {children}
    </>
  );
}
