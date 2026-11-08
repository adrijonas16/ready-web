import type { Metadata } from 'next';
import NoEncontrado from '@/components/NoEncontrado';

// Next añade <meta name="robots" content="noindex"> a esta página por sí solo
export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'No encontramos esta página. Vuelve al inicio, busca la lista de tu colegio o revisa el catálogo de útiles.',
};

export default function NoEncontrada() {
  return <NoEncontrado />;
}
