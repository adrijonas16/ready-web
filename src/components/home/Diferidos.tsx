'use client';

import dynamic from 'next/dynamic';
import { useCercano } from '@/lib/useCercano';

// La vitrina y las promociones están más abajo: su código y sus datos se piden recién
// cuando el cliente se acerca a esa parte del inicio (no compiten con la carga principal).
const Vitrina = dynamic(() => import('@/components/Vitrina'), { ssr: false });
const NewsCarousel = dynamic(() => import('@/components/NewsCarousel'), { ssr: false });

export function VitrinaDiferida() {
  const [ref, cerca] = useCercano<HTMLDivElement>();
  return <div ref={ref}>{cerca && <Vitrina />}</div>;
}

export function PromocionesDiferidas() {
  const [ref, cerca] = useCercano<HTMLDivElement>();
  return <div ref={ref}>{cerca && <NewsCarousel />}</div>;
}
