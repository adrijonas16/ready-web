import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, Search } from 'lucide-react';
import NewsCarousel from '@/components/NewsCarousel';

export const metadata: Metadata = {
  title: 'Ready - Utiles Escolares en Arequipa | Envio a Domicilio',
  description: 'Sube la foto de la lista de útiles de tu colegio y te la armamos completa. Elige económico, estándar o premium y recíbela en casa en Arequipa.',
};

// Ejemplo ilustrativo: una lista escrita y las 3 opciones que se arman con ella
const lineas = ['3 cuad. cuadriculado A4', '1 caja colores x24', '2 gomas en barra', '1 papel lustre', 'témperas x7'];
const paquetes = [
  { nombre: 'Económico', total: 'S/ 51.60', fondo: 'bg-eco-claro', punto: 'bg-eco', nota: 'Lo que pide la lista' },
  { nombre: 'Normal', total: 'S/ 69.80', fondo: 'bg-primario-claro', punto: 'bg-primario', nota: 'Marcas conocidas' },
  { nombre: 'Premium', total: 'S/ 102.50', fondo: 'bg-premium-claro', punto: 'bg-premium', nota: 'Dura todo el año' },
];

function ListaYPaquetes() {
  return (
    <figure className="relative mx-auto h-[400px] w-full max-w-[480px] sm:h-[430px]">
      <div className="papel-rayado sombra-hoja absolute left-0 top-0 w-[62%] -rotate-[4deg] rounded-[6px] pb-6 pl-[50px] pr-4 pt-[14px]">
        <p className="font-mano text-[1.5rem] leading-[38px] text-primario">Lista de útiles</p>
        {lineas.map(l => <p key={l} className="font-mano text-[1.35rem] leading-[52px] text-primario">{l}</p>)}
      </div>
      <div className="absolute bottom-0 right-0 w-[62%] space-y-2.5">
        {paquetes.map((p, i) => (
          <div key={p.nombre}
            className={`animate-slide-up flex items-center gap-3 rounded-2xl border border-linea bg-papel p-3.5 shadow-[0_12px_30px_-16px_rgba(23,33,29,0.35)] ${i === 1 ? 'sm:-translate-x-4' : ''}`}
            style={{ animationDelay: `${300 + i * 180}ms` }}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${p.fondo}`}>
              <span className={`h-3 w-3 rounded-full ${p.punto}`} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold leading-tight">{p.nombre}</span>
              <span className="block truncate text-xs text-tenue">{p.nota}</span>
            </span>
            <span className="text-lg font-extrabold tabular-nums">{p.total}</span>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">Ejemplo: una lista escrita a mano y las opciones Económico, Normal y Premium con su precio total</figcaption>
    </figure>
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
      <section className="papel-cuadriculado overflow-hidden border-b border-linea">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_1fr] [&>*]:min-w-0">
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
            <p className="mt-5 text-sm text-tenue">Funciona con fotos, PDF o Word. Revisamos cada lista antes de que la elijas.</p>
          </div>
          <ListaYPaquetes />
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-[-0.025em]">Cómo funciona</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            { t: 'Toma la foto de la lista', d: 'Elige el colegio y el grado, y sube la foto, el PDF o el Word que te dio el colegio. Puedes subir varias hojas.' },
            { t: 'Elige tu opción', d: 'Cuando revisamos tu lista te avisamos y la ves armada en Económico, Normal y Premium con el precio total. Eliges una y cambias lo que quieras.' },
            { t: 'Forrado, etiquetas y libros', d: 'Forramos los cuadernos del color que pidas, ponemos etiquetas con su nombre, hacemos las carátulas y conseguimos los libros. Te llega todo listo a casa.' },
          ].map((paso, i) => (
            <li key={paso.t} className="border-t-2 border-grafito pt-4">
              <span className="font-mano text-4xl font-bold leading-none text-primario">{i + 1}.</span>
              <h3 className="mt-2 text-xl font-bold">{paso.t}</h3>
              <p className="mt-2 leading-relaxed text-tenue">{paso.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Promociones */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <NewsCarousel />
      </section>

      {/* Cierre */}
      <section className="bg-primario text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.025em]">¿Tienes la lista a la mano?</h2>
            <p className="mt-2 max-w-xl text-white/80">Tómale una foto ahora y en un minuto ves cuánto cuesta completa, en el nivel que prefieras.</p>
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
