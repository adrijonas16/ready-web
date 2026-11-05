import type { Metadata } from 'next';
import Link from 'next/link';
import { productos } from '@/demo/catalogo';
import { Camera, Search, ShoppingBag, ChevronRight } from 'lucide-react';
import Vitrina from '@/components/Vitrina';
import NewsCarousel from '@/components/NewsCarousel';
import DemoEnVivo from '@/components/home/DemoEnVivo';
import UtilesFlotantes from '@/components/home/UtilesFlotantes';
import Categorias from '@/components/home/Categorias';
import { FotoLista, Mochila, TodoListo, TresOpciones } from '@/components/home/Ilustraciones';

export const metadata: Metadata = {
  title: 'Ready - Utiles Escolares en Arequipa | Envio a Domicilio',
  description: 'Sube la foto de la lista de útiles de tu colegio y te la armamos completa. Elige económico, estándar o premium y recíbela en casa en Arequipa.',
};

/** Tres productos del catálogo que se abren en abanico al pasar el mouse */
function AbanicoProductos() {
  const imgs = ['cu-dibujos', 'co-m', 'ti-m'].map(id => productos.find(p => p.id === id)?.imageUrl);
  const pos = ['-rotate-12 -translate-x-10 group-hover:-translate-x-16 group-hover:-rotate-[20deg]', 'z-10 -translate-y-1 group-hover:-translate-y-3 group-hover:scale-110', 'rotate-12 translate-x-10 group-hover:translate-x-16 group-hover:rotate-[20deg]'];
  return (
    <span className="relative flex h-28 w-28 items-center justify-center">
      {imgs.map((src, i) => <img key={i} src={src} alt="" className={`absolute h-24 w-24 object-contain drop-shadow-md transition-transform duration-500 ease-out ${pos[i]}`} />)}
    </span>
  );
}

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Ready - Utiles Escolares',
    description: 'Tienda online de utiles escolares en Arequipa, Peru',
    url: 'https://ready.pe',
    areaServed: { '@type': 'City', name: 'Arequipa', addressCountry: 'PE' },
    priceRange: '$-$$$',
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="papel-cuadriculado relative overflow-hidden border-b border-linea">
        <UtilesFlotantes />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_1fr] [&>*]:min-w-0">
          <div>
            <h1 className="text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] text-grafito sm:text-6xl">
              Sube la foto de la lista del colegio. Nosotros la armamos.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-tenue">
              Con la foto armamos tu lista completa en tres opciones: económica, normal y premium.
              Eliges una, la ajustas a tu gusto y le sumas forrado, etiquetas, carátulas y libros.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-acento px-6 py-4 text-base font-bold text-grafito shadow-[inset_0_-4px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-acento-oscuro">
                <Camera className="h-5 w-5" aria-hidden="true" /> Subir mi lista
              </Link>
              <Link href="/lists"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-grafito bg-papel px-6 py-4 text-base font-bold text-grafito transition-colors hover:bg-fondo">
                <Search className="h-5 w-5" aria-hidden="true" /> Buscar la lista de mi colegio
              </Link>
            </div>
            <p className="mt-5 text-sm text-tenue">
              ¿Prefieres elegir tú?{' '}
              <Link href="/catalog" className="font-semibold text-primario underline underline-offset-2">Arma tu pedido producto por producto</Link>.
            </p>
          </div>
          <DemoEnVivo />
        </div>
      </section>

      {/* Tres formas de comprar */}
      <section aria-labelledby="formas" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <h2 id="formas" className="text-3xl font-extrabold tracking-[-0.02em]">¿Cómo quieres comprar?</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { href: '/upload', Dibujo: FotoLista, icono: Camera, titulo: 'Sube la foto de tu lista', texto: 'La leemos, la revisamos y te la damos armada en Económico, Normal o Premium.', boton: 'Subir mi lista', fondo: 'bg-acento-claro', color: 'text-acento-oscuro' },
            { href: '/lists', Dibujo: TresOpciones, icono: Search, titulo: 'Busca la lista de tu colegio', texto: 'Si otro padre ya la subió y la aprobamos, la eliges y compras al momento.', boton: 'Buscar mi colegio', fondo: 'bg-primario-claro', color: 'text-primario' },
            { href: '/catalog', Dibujo: null, icono: ShoppingBag, titulo: 'Arma tu pedido', texto: 'Elige útil por útil, por categoría o marca, como en cualquier tienda.', boton: 'Ver productos', fondo: 'bg-eco-claro', color: 'text-eco' },
          ].map(f => (
            <li key={f.href}>
              <Link href={f.href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-linea bg-papel p-5 transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-1 hover:border-primario/40 hover:shadow-[0_12px_32px_-20px_rgba(15,23,42,0.5)]">
                <div className={`relative -mx-5 -mt-5 mb-4 flex h-36 items-center justify-center overflow-hidden rounded-t-2xl ${f.fondo}`}>
                  {f.Dibujo ? <f.Dibujo className="h-32 w-auto" /> : <AbanicoProductos />}
                  <span className={`absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-papel/80 ${f.color}`}><f.icono className="h-5 w-5" aria-hidden="true" /></span>
                </div>
                <h3 className="text-xl font-bold">{f.titulo}</h3>
                <p className="mt-1 flex-1 text-tenue">{f.texto}</p>
                <span className="mt-4 inline-flex items-center gap-0.5 font-semibold text-primario">
                  {f.boton} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-[-0.025em]">Cómo funciona con tu lista</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            { Dibujo: FotoLista, t: 'Toma la foto de la lista', d: 'Elige el colegio y el grado, y sube la foto, el PDF o el Word que te dio el colegio. Puedes subir varias hojas.' },
            { Dibujo: TresOpciones, t: 'Elige tu opción', d: 'Cuando revisamos tu lista te avisamos y la ves armada en Económico, Normal y Premium con el precio total. Eliges una y cambias lo que quieras.' },
            { Dibujo: TodoListo, t: 'Forrado, etiquetas y libros', d: 'Forramos los cuadernos del color que pidas, ponemos etiquetas con su nombre, hacemos las carátulas y conseguimos los libros. Te llega todo listo a casa.' },
          ].map((paso, i) => (
            <li key={paso.t} className="group border-t-2 border-grafito pt-4">
              <div className="flex items-end justify-between">
                <span className="font-mano text-4xl font-bold leading-none text-primario">{i + 1}.</span>
                <paso.Dibujo className="-mb-2 h-24 w-auto" />
              </div>
              <h3 className="mt-2 text-xl font-bold">{paso.t}</h3>
              <p className="mt-2 leading-relaxed text-tenue">{paso.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <Categorias />

      <Vitrina />

      {/* Promociones */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <NewsCarousel />
      </section>

      {/* Cierre */}
      <section className="overflow-hidden bg-primario text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Mochila className="hidden h-40 w-40 shrink-0 -my-6 md:block" />
          <div className="md:flex-1">
            <h2 className="text-3xl font-extrabold tracking-[-0.025em]">¿Tienes la lista a la mano?</h2>
            <p className="mt-2 max-w-xl text-white">Tómale una foto ahora. La revisamos y te avisamos cuando puedas elegirla en Económico, Normal o Premium.</p>
          </div>
          <Link href="/upload"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-acento px-6 py-4 font-bold text-grafito shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] hover:bg-acento-oscuro">
            <Camera className="h-5 w-5" aria-hidden="true" /> Subir mi lista
          </Link>
        </div>
      </section>
    </div>
  );
}
