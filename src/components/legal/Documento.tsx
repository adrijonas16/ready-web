import Link from 'next/link';
import { jsonLdMigas } from '@/lib/json-ld';

/** Estilos de texto largo (sin plugin de tipografía): títulos, párrafos, listas y enlaces. */
const PROSA = [
  'text-[0.975rem] leading-relaxed text-grafito',
  '[&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight',
  '[&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold',
  '[&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6',
  '[&_a]:font-semibold [&_a]:text-[var(--t-primario-texto)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:decoration-2',
  '[&_strong]:font-bold [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:border-linea [&_th]:p-2 [&_th]:text-left',
  '[&_td]:border-b [&_td]:border-linea [&_td]:p-2 [&_td]:align-top',
].join(' ');

interface Props {
  titulo: string;
  /** Ruta de la página, para las migas (BreadcrumbList) */
  ruta: string;
  /** Fecha visible de la última actualización (texto) */
  actualizado: string;
  intro?: React.ReactNode;
  /** Índice: [ancla, título] */
  indice?: [string, string][];
  children: React.ReactNode;
}

/** Documento legal con título, fecha, índice y cuerpo. */
export default function Documento({ titulo, ruta, actualizado, intro, indice, children }: Props) {
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdMigas([['Inicio', '/'], [titulo, ruta]])) }} />
      <nav aria-label="Ruta" className="text-sm text-tenue">
        <Link href="/" className="hover:text-primario">Inicio</Link> <span aria-hidden="true">/</span> <span aria-current="page">{titulo}</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{titulo}</h1>
      <p className="mt-2 text-sm text-tenue">Última actualización: {actualizado}</p>
      {intro && <div className="mt-5 text-lg leading-relaxed text-tenue">{intro}</div>}
      {indice && indice.length > 0 && (
        <nav aria-label="Contenido" className="mt-6 rounded-2xl border border-linea bg-papel p-5">
          <p className="font-display font-bold">Contenido</p>
          <ol className="mt-2 grid list-decimal gap-x-8 gap-y-1 pl-5 text-sm sm:grid-cols-2">
            {indice.map(([id, t]) => <li key={id}><a href={`#${id}`} className="text-primario underline-offset-2 hover:underline">{t}</a></li>)}
          </ol>
        </nav>
      )}
      <div className={`mt-4 ${PROSA}`}>{children}</div>
    </article>
  );
}
