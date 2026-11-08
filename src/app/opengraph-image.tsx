import { imagenParaCompartir } from './_og/imagen';

export const alt = 'Ready: tu lista de útiles, lista en minutos. Útiles escolares con entrega en Arequipa.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Imagen() {
  return imagenParaCompartir(size);
}
