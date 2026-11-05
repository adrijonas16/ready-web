// Ilustraciones dibujadas para el inicio. Usan los colores del tema, así funcionan en claro y oscuro.

/** Celular tomando la foto de la lista */
export function FotoLista({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <rect x="20" y="18" width="70" height="92" rx="4" fill="#FFFDF5" stroke="var(--t-linea-fuerte)" transform="rotate(-6 55 64)" />
      {[0, 1, 2, 3, 4].map(i => <rect key={i} x="30" y={34 + i * 14} width={40 - (i % 2) * 12} height="4" rx="2" fill="#93B4F5" transform="rotate(-6 55 64)" />)}
      <g className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <rect x="78" y="10" width="58" height="100" rx="10" fill="var(--t-texto)" />
        <rect x="83" y="18" width="48" height="80" rx="4" fill="var(--t-primario-claro)" />
        <rect x="90" y="30" width="34" height="50" fill="#FFFDF5" />
        {[0, 1, 2].map(i => <rect key={i} x="94" y={38 + i * 11} width="24" height="3" rx="1.5" fill="#93B4F5" />)}
        <path d="M88 26 h8 M88 26 v8 M126 26 h-8 M126 26 v8 M88 84 h8 M88 84 v-8 M126 84 h-8 M126 84 v-8" stroke="var(--t-acento)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="107" cy="104" r="3" fill="var(--t-superficie)" />
      </g>
    </svg>
  );
}

/** Tres tarjetas apiladas: Económico, Normal y Premium */
export function TresOpciones({ className = '' }: { className?: string }) {
  const cartas = [
    { y: 62, c: 'var(--t-eco)', r: -6 },
    { y: 38, c: 'var(--t-primario)', r: 0 },
    { y: 14, c: 'var(--t-premium)', r: 6 },
  ];
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      {cartas.map((k, i) => (
        <g key={i} transform={`rotate(${k.r} 80 ${k.y + 18})`}>
          <g className={`transition-transform duration-500 ${i === 2 ? 'group-hover:-translate-y-2' : i === 0 ? 'group-hover:translate-y-1' : ''}`}>
            <rect x="28" y={k.y} width="104" height="40" rx="10" fill="var(--t-superficie)" stroke="var(--t-linea-fuerte)" />
            <circle cx="46" cy={k.y + 20} r="8" fill={k.c} />
            <rect x="60" y={k.y + 12} width="40" height="5" rx="2.5" fill="var(--t-texto)" opacity=".7" />
            <rect x="60" y={k.y + 23} width="26" height="4" rx="2" fill="var(--t-tenue)" opacity=".6" />
            <rect x="106" y={k.y + 14} width="18" height="10" rx="3" fill={k.c} opacity=".25" />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Cuaderno forrado con etiqueta y una carátula */
export function TodoListo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <rect x="70" y="16" width="56" height="78" rx="4" fill="var(--t-premium)" transform="rotate(8 98 55)" />
      <rect x="34" y="20" width="60" height="84" rx="5" fill="var(--t-primario)" className="transition-transform duration-500 group-hover:-rotate-6" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      <rect x="40" y="24" width="48" height="76" rx="3" fill="#fff" opacity=".18" />
      <rect x="44" y="70" width="40" height="18" rx="4" fill="#fff" />
      <text x="64" y="82.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1E293B" fontFamily="var(--font-mano)">Lucía 2°B</text>
      <path d="M118 74 l8 8 16-18" stroke="var(--t-eco)" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" className="group-hover:animate-check-pop" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
    </svg>
  );
}

/** Mochila llena de útiles para la franja final */
export function Mochila({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g className="animate-flotar" style={{ ['--giro' as string]: '-8deg', transformBox: 'fill-box', transformOrigin: 'center' }}>
        <rect x="70" y="18" width="14" height="70" rx="3" fill="#FACC15" transform="rotate(-14 77 53)" />
        <path d="M70 18 l7 -14 7 14z" fill="#F5D0A9" transform="rotate(-14 77 53)" />
      </g>
      <g className="animate-flotar" style={{ ['--giro' as string]: '10deg', animationDelay: '-2s', transformBox: 'fill-box', transformOrigin: 'center' }}>
        <rect x="112" y="14" width="38" height="56" rx="4" fill="#22C55E" transform="rotate(10 131 42)" />
        <rect x="118" y="44" width="26" height="10" rx="2" fill="#fff" transform="rotate(10 131 42)" />
      </g>
      <path d="M60 70 q40 -38 80 0" stroke="#1E3A8A" strokeWidth="10" fill="none" strokeLinecap="round" />
      <rect x="40" y="66" width="120" height="122" rx="30" fill="#2E62D9" />
      <rect x="58" y="120" width="84" height="54" rx="14" fill="#2552C4" />
      <rect x="58" y="120" width="84" height="12" rx="6" fill="#F6A609" />
      <circle cx="100" cy="98" r="7" fill="#F6A609" />
      <path d="M93 98 l5 5 9 -11" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
