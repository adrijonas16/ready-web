import { TriangleAlert } from 'lucide-react';

/** Páginas legales: texto legible (ancho de lectura) y un aviso de demostración fuera del texto legal. */
export default function LayoutLegal({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:py-14">
      <div className="min-w-0">{children}</div>
      <aside aria-label="Aviso sobre estos textos" className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border-2 border-dashed border-acento-oscuro bg-acento-claro p-5 text-grafito">
          <p className="flex items-center gap-2 font-display font-bold">
            <TriangleAlert className="h-5 w-5 shrink-0 text-acento-oscuro" aria-hidden="true" /> Tienda de demostración
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Ready es una tienda de demostración; revisa este texto con un abogado antes de vender de verdad.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Completa también los datos marcados entre corchetes (razón social, RUC, domicilio y correo).
          </p>
        </div>
      </aside>
    </div>
  );
}
