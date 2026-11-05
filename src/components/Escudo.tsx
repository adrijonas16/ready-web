// Escudo dibujado para cada colegio: el color y la figura salen del nombre, así cada colegio tiene el suyo.
const COLORES = ['#2E62D9', '#059669', '#7C3AED', '#DC2626', '#D97706', '#0891B2', '#DB2777'];
const FIGURAS = [
  'M20 10 l3 6 7 1 -5 5 1 7 -6-3 -6 3 1-7 -5-5 7-1z', // estrella
  'M12 26 v-9 l8-6 8 6 v9z M17 26 v-5 h6 v5', // casa
  'M20 9 a8 8 0 1 0 0.1 0z M20 13 v12 M14 19 h12', // globo
  'M12 13 h16 v13 h-16z M12 13 l8 6 8-6', // libro abierto
];

const hash = (s: string) => Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export default function Escudo({ nombre, className = '' }: { nombre: string; className?: string }) {
  const h = hash(nombre);
  const color = COLORES[h % COLORES.length];
  const figura = FIGURAS[(h >> 3) % FIGURAS.length];
  const iniciales = nombre.replace(/^(I\.E\.|Colegio)\s+/i, '').split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <svg viewBox="0 0 40 48" className={className} aria-hidden="true">
      <path d="M4 4 h32 v20 c0 12 -9 19 -16 22 c-7 -3 -16 -10 -16 -22z" fill={color} />
      <path d="M4 4 h32 v20 c0 12 -9 19 -16 22 c-7 -3 -16 -10 -16 -22z" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" transform="translate(2.5 2.5) scale(.875)" />
      <path d={figura} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" transform="translate(0 -1) scale(1)" />
      <text x="20" y="40" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#fff" fontFamily="var(--font-sans)">{iniciales}</text>
    </svg>
  );
}
