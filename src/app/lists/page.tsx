import { miniProductos } from '@/demo/subconjunto';
import ListasColegios from './ListasColegios';
import type { FotosNivel } from './utiles-nivel';

// Útiles típicos de cada nivel para ilustrar las tarjetas
const UTILES_NIVEL = { inicial: ['cr-m', 'pa-m', 'te-m'], secundaria: ['cu-p', 'lp-m', 're-m'], primaria: ['cu-dibujos', 'co-m', 'ti-m'] };

/** Página de servidor: arma solo las 9 fotos que necesita la lista (el catálogo no viaja al navegador). */
export default function ListsPage() {
  const cat = miniProductos(Object.values(UTILES_NIVEL).flat());
  const fotos = Object.fromEntries(Object.entries(UTILES_NIVEL).map(([k, ids]) => [k, ids.map(id => cat[id]?.imageUrl)])) as unknown as FotosNivel;
  return <ListasColegios fotos={fotos} />;
}
