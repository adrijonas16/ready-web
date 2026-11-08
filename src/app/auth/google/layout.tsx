import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Ingresando con Google',
  descripcion: 'Inicio de sesión con Google.',
  ruta: '/login',
  privada: true,
});

/** Solo metadatos: la página es un componente de cliente. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
