import type { Metadata } from 'next';
import { metadatosPagina } from '@/lib/sitio';
import { jsonLdMigas } from '@/lib/json-ld';

// Los datos viven en el navegador (modo demo), así que el servidor no los conoce: título genérico y canonical propio.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return metadatosPagina({
    titulo: 'Útiles escolares',
    descripcion: 'Detalle del producto: precio en soles con IGV, variantes, stock y entrega a domicilio en Arequipa.',
    ruta: `/products/${encodeURIComponent(id)}`,
  });
}

/** Metadatos y migas (BreadcrumbList): la página es un componente de cliente. */
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdMigas([['Inicio', '/'], ['Catálogo', '/catalog'], ['Producto', `/products/${encodeURIComponent(id)}`]])) }} />
      {children}
    </>
  );
}
