import Link from 'next/link';

/** Dibujo: un cuaderno abierto con una página arrancada y un lápiz. */
export function CuadernoPerdido() {
  return (
    <svg viewBox="0 0 240 180" className="mx-auto h-44 w-auto" role="img" aria-label="Un cuaderno con una hoja arrancada">
      <ellipse cx="120" cy="166" rx="92" ry="8" className="fill-linea" />
      <g transform="rotate(-4 120 90)">
        <rect x="34" y="26" width="86" height="124" rx="6" className="fill-papel stroke-linea" strokeWidth="3" />
        <rect x="120" y="26" width="86" height="124" rx="6" className="fill-papel stroke-linea" strokeWidth="3" />
        {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1="44" x2="110" y1={50 + i * 16} y2={50 + i * 16} className="stroke-cuadricula" strokeWidth="2" />)}
        <path d="M130 40 h66 v20 l-8 6 l6 8 l-9 7 l7 9 l-8 6 l6 9 l-7 7 l5 8 h-58 z" className="fill-fondo stroke-linea" strokeWidth="2" strokeDasharray="4 4" />
        <text x="163" y="102" textAnchor="middle" fontSize="44" fontWeight="800" className="fill-primario" fontFamily="Rubik, sans-serif">?</text>
        {[0, 1, 2, 3, 4, 5, 6].map(i => <circle key={i} cx="120" cy={36 + i * 17} r="3.5" className="fill-tenue" />)}
      </g>
      <g transform="rotate(32 196 54)">
        <rect x="160" y="46" width="64" height="14" rx="2" className="fill-acento" />
        <rect x="224" y="46" width="9" height="14" className="fill-linea" />
        <path d="M160 46 L146 53 L160 60z" fill="#F5D0A9" />
        <path d="M150 51 L146 53 L150 55z" className="fill-grafito" />
      </g>
    </svg>
  );
}

interface Accion { href: string; texto: string }

/**
 * Pantalla amable de "no encontrado" (404). La usa app/not-found.tsx y las páginas de detalle
 * (producto, lista, pedido) cuando el id no existe. Una sola acción principal y dos secundarias.
 */
export default function NoEncontrado({
  titulo = 'No encontramos esta página',
  texto = 'Puede que el enlace esté mal escrito o que la página ya no exista. Te ayudamos a seguir:',
  principal = { href: '/', texto: 'Ir al inicio' },
  secundarias = [{ href: '/lists', texto: 'Buscar la lista de mi colegio' }, { href: '/catalog', texto: 'Ver el catálogo' }],
}: { titulo?: string; texto?: string; principal?: Accion; secundarias?: Accion[] }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      {/* Que los buscadores no indexen los enlaces rotos */}
      <meta name="robots" content="noindex" />
      <CuadernoPerdido />
      <p className="mt-6 font-mano text-3xl text-primario">¡Ups! Esta hoja se perdió</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{titulo}</h1>
      <p className="mt-3 text-tenue">{texto}</p>
      <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Link href={principal.href} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-acento px-5 py-3 font-bold text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro">{principal.texto}</Link>
        {secundarias.map(a => (
          <Link key={a.href} href={a.href} className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-grafito px-5 py-2.5 font-bold hover:bg-papel">{a.texto}</Link>
        ))}
      </div>
    </div>
  );
}
