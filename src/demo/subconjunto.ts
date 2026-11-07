// Solo para componentes de servidor: toma unos pocos productos del catálogo de la demo
// para pasarlos como props, así el catálogo completo no viaja en el JavaScript de la página.
import { productos } from './catalogo';

export interface MiniProducto { id: string; name: string; brand?: string; basePrice: number; imageUrl?: string }

export function miniProductos(ids: string[]): Record<string, MiniProducto> {
  const r: Record<string, MiniProducto> = {};
  for (const id of new Set(ids)) {
    const p = productos.find(x => x.id === id);
    if (p) r[id] = { id: p.id, name: p.name, brand: p.brand, basePrice: p.basePrice, imageUrl: p.imageUrl };
  }
  return r;
}
