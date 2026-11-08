import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Iniciar sesión',
  descripcion: 'Ingresa a tu cuenta de Ready para ver tus listas y pedidos.',
  ruta: '/login',
  privada: true,
});

/** Solo metadatos: la página es un componente de cliente. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
