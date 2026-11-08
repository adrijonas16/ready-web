import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Listas de útiles por colegio',
  descripcion: 'Encuentra la lista de útiles de tu colegio y grado en Arequipa, ya armada en tres opciones. Ajústala y recíbela en casa.',
  ruta: '/lists',
});

/** Solo metadatos: la página es un componente de cliente. (Las migas van en lists/[id] para no duplicarlas.) */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
