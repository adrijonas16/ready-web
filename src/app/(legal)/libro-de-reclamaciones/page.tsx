import Link from 'next/link';
import FormularioReclamo from './FormularioReclamo';
import { metadatosPagina } from '@/lib/sitio';
import { jsonLdMigas } from '@/lib/json-ld';

export const metadata = metadatosPagina({
  titulo: 'Libro de Reclamaciones',
  descripcion: 'Libro de Reclamaciones virtual de Ready, conforme al Código de Protección y Defensa del Consumidor. Registra tu reclamo o queja y recibe respuesta en 15 días hábiles.',
  ruta: '/libro-de-reclamaciones',
});

export default function LibroDeReclamaciones() {
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdMigas([['Inicio', '/'], ['Libro de Reclamaciones', '/libro-de-reclamaciones']])) }} />
      <nav aria-label="Ruta" className="text-sm text-tenue">
        <Link href="/" className="hover:text-primario">Inicio</Link> <span aria-hidden="true">/</span> <span aria-current="page">Libro de Reclamaciones</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Libro de Reclamaciones</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-tenue">
        Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N.° 29571), esta tienda cuenta con un Libro de Reclamaciones
        virtual a tu disposición.
      </p>

      <dl className="mt-6 grid gap-x-6 gap-y-1 rounded-2xl border border-linea bg-papel p-5 text-sm sm:grid-cols-[10rem_1fr]">
        <dt className="font-bold">Proveedor</dt><dd>[Razón social] · nombre comercial <span translate="no">Ready</span></dd>
        <dt className="font-bold">RUC</dt><dd>[Número de RUC]</dd>
        <dt className="font-bold">Domicilio</dt><dd>[Dirección], Arequipa, Perú</dd>
        <dt className="font-bold">Fecha</dt><dd>Se registra al enviar la hoja.</dd>
      </dl>

      <FormularioReclamo />

      <p className="mt-8 text-xs leading-relaxed text-tenue">
        Base legal: Ley N.° 29571, Código de Protección y Defensa del Consumidor, y Reglamento del Libro de Reclamaciones (D.S. N.° 011-2011-PCM),
        modificado por el D.S. N.° 101-2022-PCM. El proveedor debe responder en un plazo no mayor de quince (15) días hábiles.
        Las hojas se conservan al menos dos años. Si el consumidor no llena los campos obligatorios, el reclamo se considera no presentado.
      </p>
    </article>
  );
}
