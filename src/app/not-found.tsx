import type { Metadata } from 'next';
import NoEncontrado from '@/components/NoEncontrado';

export const metadata: Metadata = { title: 'Página no encontrada | Ready' };

export default function NoEncontrada() {
  return <NoEncontrado />;
}
