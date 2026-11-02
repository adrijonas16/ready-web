import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, Search } from 'lucide-react';
import NewsCarousel from '@/components/NewsCarousel';

export const metadata: Metadata = {
  title: 'Ready - Utiles Escolares en Arequipa | Envio a Domicilio',
  description: 'Sube la foto de la lista de útiles de tu colegio y te la armamos completa. Elige económico, estándar o premium y recíbela en casa en Arequipa.',
};

// Ejemplo ilustrativo de cómo se ve una lista leída
const ejemplo = [
  { escrito: '3 cuad. cuadriculado A4 x100 h.', producto: 'Cuaderno A4 cuadriculado 100 hojas', nivel: 'Estándar', precio: 19.5 },
  { escrito: '1 caja de colores largos x24', producto: 'Colores largos x24', nivel: 'Premium', precio: 24.9 },
  { escrito: '2 gomas en barra', producto: 'Goma en barra 21 g', nivel: 'Económico', precio: 5.8 },
  { escrito: '1 paquete papel lustre', producto: 'Papel lustre x20 pliegos', nivel: 'Estándar', precio: 5.0 },
  { escrito: 'plumón indeleble negro', producto: 'Plumón indeleble punta gruesa', nivel: 'Estándar', precio: 3.5 },
];

const nivelColor: Record<string, string> = {
  'Económico': 'bg-emerald-50 text-emerald-800',
  'Estándar': 'bg-tinta-claro text-tinta',
  'Premium': 'bg-lapiz-claro text-amber-900',
};

function HojaEjemplo() {
  const total = ejemplo.reduce((s, i) => s + i.precio, 0);
  return (
    <figure className="relative mx-auto w-full max-w-[460px] sm:rotate-[1.2deg]">
      <div className="papel-rayado sombra-hoja rounded-[6px] pl-[56px] pr-4 pt-[14px] pb-4 sm:pr-5">
        <p className="font-mano text-[1.65rem] leading-[38px] text-tinta">Lista de útiles, 2.º de primaria</p>
        <ul>
          {ejemplo.map((item, i) => (
            <li key={item.escrito} className="relative h-[104px] pt-[14px]">
              <span
                aria-hidden="true"
                className="animate-check-pop absolute -left-[46px] top-[18px] text-profe text-2xl font-mano font-bold"
                style={{ animationDelay: `${500 + i * 260}ms` }}
              >
                ✓
              </span>
              <p className="font-mano text-[1.55rem] leading-[38px] text-tinta">{item.escrito}</p>
              <div className="mt-[6px] flex items-center gap-2 text-[13px]">
                <span className="min-w-0 truncate text-grafito">{item.producto}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${nivelColor[item.nivel]}`}>{item.nivel}</span>
                <span className="ml-auto shrink-0 font-semibold tabular-nums">S/ {item.precio.toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex items-baseline justify-between border-t-2 border-grafito pt-3">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-xl font-extrabold tabular-nums">S/ {total.toFixed(2)}</span>
        </div>
      </div>
      <figcaption className="sr-only">Ejemplo de una lista de útiles leída y armada con productos y precios</figcaption>
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
              Leemos cada útil de la lista y te mostramos la opción económica, estándar y premium.
              Tú eliges cuál llevar, quitas lo que ya tienes y lo recibes en casa en Arequipa.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lapiz px-6 py-4 text-base font-bold text-grafito shadow-[inset_0_-4px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-lapiz-oscuro">
                <Camera className="h-5 w-5" aria-hidden="true" /> Subir mi lista
              </Link>
              <Link href="/lists"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-grafito bg-papel px-6 py-4 text-base font-bold text-grafito transition-colors hover:bg-fondo">
                <Search className="h-5 w-5" aria-hidden="true" /> Buscar la lista de mi colegio
              </Link>
            </div>
            <p className="mt-5 text-sm text-tenue">Funciona con fotos, PDF o Word. Tu lista queda armada en alrededor de un minuto.</p>
          </div>
          <HojaEjemplo />
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-[-0.025em]">Cómo funciona</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            { t: 'Toma la foto de la lista', d: 'Elige el colegio y el grado, y sube la foto, el PDF o el Word que te dio el colegio. Puedes subir varias hojas.' },
            { t: 'Arma la lista a tu medida', d: 'Para cada útil eliges económico, estándar o premium. Cambias cantidades, quitas lo que ya tienes y pides forro, etiqueta o carátula.' },
            { t: 'Recíbela en casa', d: 'Preparamos todo el pedido y te lo llevamos a domicilio en Arequipa. Sigues el estado desde tu cuenta.' },
          ].map((paso, i) => (
            <li key={paso.t} className="border-t-2 border-grafito pt-4">
              <span className="font-mano text-4xl font-bold leading-none text-tinta">{i + 1}.</span>
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
      <section className="bg-tinta text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.025em]">¿Tienes la lista a la mano?</h2>
            <p className="mt-2 max-w-xl text-white/80">Tómale una foto ahora y en un minuto ves cuánto cuesta completa, en el nivel que prefieras.</p>
          </div>
          <Link href="/upload"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-lapiz px-6 py-4 font-bold text-grafito shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] hover:bg-lapiz-oscuro">
            <Camera className="h-5 w-5" aria-hidden="true" /> Subir mi lista
          </Link>
        </div>
      </section>
    </div>
  );
}
