import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Crear cuenta',
  descripcion: 'Crea tu cuenta de Ready para guardar tus listas de útiles y seguir tus pedidos.',
  ruta: '/register',
  privada: true,
});

/** Solo metadatos: la página es un componente de cliente. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
