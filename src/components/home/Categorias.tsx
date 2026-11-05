import Link from 'next/link';
import { productos } from '@/demo/catalogo';

// Cada categoría con dos productos del catálogo como imagen; al pasar el mouse se abren en abanico
const CATEGORIAS = [
  { nombre: 'Cuadernos', ids: ['cu-dibujos', 'cu-galaxia'], fondo: 'bg-primario-claro' },
  { nombre: 'Colores', ids: ['co-m', 'pl-p'], fondo: 'bg-acento-claro' },
  { nombre: 'Arte', ids: ['te-m', 'pa-m'], fondo: 'bg-premium-claro' },
  { nombre: 'Escritura', ids: ['la-p', 'lp-m'], fondo: 'bg-eco-claro' },
  { nombre: 'Útiles', ids: ['ti-m', 'ta-m'], fondo: 'bg-primario-claro' },
  { nombre: 'Pegar', ids: ['go-p', 'cs-m'], fondo: 'bg-acento-claro' },
  { nombre: 'Papeles', ids: ['lu-m', 'bl-p'], fondo: 'bg-premium-claro' },
  { nombre: 'Libros', ids: ['li-mat2', 'li-ing2'], fondo: 'bg-eco-claro' },
];
const img = (id: string) => productos.find(p => p.id === id)?.imageUrl;
const cuantos = (cat: string) => productos.filter(p => p.category === cat).length;

export default function Categorias() {
  return (
    <section aria-labelledby="titulo-categorias" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <h2 id="titulo-categorias" className="text-3xl font-extrabold tracking-[-0.02em]">Compra por categoría</h2>
        <Link href="/catalog" className="shrink-0 text-sm font-semibold text-primario hover:underline">Ver todo</Link>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORIAS.map(c => (
          <li key={c.nombre}>
            <Link href={`/catalog?categoria=${encodeURIComponent(c.nombre)}`}
              className="group block overflow-hidden rounded-2xl border border-linea bg-papel transition-[border-color,box-shadow] hover:border-primario/40 hover:shadow-[0_16px_32px_-20px_rgba(15,23,42,0.5)]">
              <div className={`relative h-28 ${c.fondo}`}>
                <img src={img(c.ids[1])} alt="" className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-[30%] -translate-y-1/2 rotate-[10deg] object-contain transition-transform duration-500 ease-out group-hover:translate-x-[5%] group-hover:rotate-[18deg]" />
                <img src={img(c.ids[0])} alt="" className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-[70%] -translate-y-1/2 -rotate-[6deg] object-contain drop-shadow-md transition-transform duration-500 ease-out group-hover:-translate-x-[95%] group-hover:-rotate-[14deg] group-hover:scale-110" />
              </div>
              <div className="flex items-baseline justify-between gap-2 px-4 py-3">
                <span className="font-bold">{c.nombre}</span>
                <span className="text-xs text-tenue">{cuantos(c.nombre)} productos</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
