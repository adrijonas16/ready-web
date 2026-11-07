import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Mis listas y pedidos',
  descripcion: 'Tus listas de útiles guardadas y el estado de tus pedidos.',
  ruta: '/my-lists',
  privada: true,
});

/** Solo metadatos: la página es un componente de cliente. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
