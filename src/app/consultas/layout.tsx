import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Mis consultas',
  descripcion: 'Productos por los que preguntaste y nuestra respuesta: si lo conseguimos o no.',
  ruta: '/consultas',
  privada: true,
});

/** Solo metadatos: la página es un componente de cliente. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
