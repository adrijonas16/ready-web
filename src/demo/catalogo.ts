// Datos de la tienda de demostración: catálogo, colegios y plantillas de listas.
// Las fotos son dibujos SVG generados aquí, así la demo no depende de ningún servidor.

export type Tier = 'economico' | 'medio' | 'premium';

export interface ProductoDemo {
  id: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  sku: string;
  basePrice: number;
  imageUrl?: string;
  stock: number;
  rating: number;
  tier: Tier;
  isActive?: boolean;
}

export interface ValorVariante {
  id: string;
  value: string;
  color_hex?: string | null;
  image_url?: string | null;
  price_modifier: number;
  stock: number;
  is_active: boolean;
  description?: string | null;
}
export interface TipoVariante { id: string; name: string; values: ValorVariante[] }

/** SVG compacto: sin espacios de más, decimales a 1 cifra y comillas simples. */
const minSvg = (t: string) => t
  .replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><')
  .replace(/\d+\.\d{2,}/g, m => String(Math.round(Number(m) * 10) / 10))
  .replace(/"/g, "'");
/** Dibujos de la demo: clave → SVG. Los sirve app/demo-img/[archivo]/route.ts como archivos estáticos. */
export const dibujos = new Map<string, string>();
/** Clave corta según el contenido (si el dibujo cambia, cambia la dirección y no queda en caché uno viejo) */
const clave = (t: string) => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36) + t.length.toString(36); };
/**
 * Registra el dibujo y devuelve su dirección (/demo-img/<clave>.svg). Así las páginas llevan
 * una ruta corta en vez del SVG completo y el navegador lo guarda en caché.
 */
const svg = (vb: string, cuerpo: string) => {
  const t = minSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${cuerpo}</svg>`);
  const k = clave(t);
  dibujos.set(k, t);
  return `/demo-img/${k}.svg`;
};

const rango = (n: number) => Array.from({ length: n }, (_, i) => i);

// ── Dibujos ──
type Patron = 'liso' | 'rayas' | 'estrellas' | 'dinos' | 'espacio' | 'flores';
export function portada(fondo: string, patron: Patron, texto: string, tinta = '#fff') {
  const pat: Record<Patron, string> = {
    liso: '',
    rayas: rango(8).map(i => `<rect x="20" y="${30 + i * 26}" width="150" height="10" fill="${tinta}" opacity=".25"/>`).join(''),
    estrellas: rango(9).map(i => `<text x="${35 + (i % 3) * 50}" y="${70 + Math.floor(i / 3) * 60}" font-size="30" fill="${tinta}">★</text>`).join(''),
    dinos: rango(6).map(i => `<g transform="translate(${30 + (i % 2) * 70},${45 + Math.floor(i / 2) * 65})" fill="${tinta}"><ellipse cx="25" cy="22" rx="22" ry="13"/><circle cx="48" cy="9" r="8"/><rect x="10" y="30" width="6" height="12"/><rect x="30" y="30" width="6" height="12"/><path d="M3 20 L-8 14 L3 26z"/><path d="M14 9 l5-8 5 8 5-8 5 8" stroke="${tinta}" stroke-width="3" fill="none"/></g>`).join(''),
    espacio: `<circle cx="70" cy="80" r="26" fill="${tinta}" opacity=".9"/><ellipse cx="70" cy="80" rx="44" ry="9" fill="none" stroke="${tinta}" stroke-width="4"/>` + rango(7).map(i => `<circle cx="${30 + i * 21}" cy="${170 + (i % 3) * 22}" r="3" fill="${tinta}"/>`).join('') + `<path d="M120 150 l25-45 l10 30z" fill="${tinta}"/>`,
    flores: rango(6).map(i => { const x = 45 + (i % 2) * 70, y = 60 + Math.floor(i / 2) * 65; return [0, 72, 144, 216, 288].map(a => `<circle cx="${(x + 13 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(y + 13 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="9" fill="${tinta}" opacity=".85"/>`).join('') + `<circle cx="${x}" cy="${y}" r="7" fill="#FFD54A"/>`; }).join(''),
  };
  return svg('0 0 200 260', `<rect x="14" y="6" width="176" height="248" rx="10" fill="${fondo}"/>${pat[patron]}<rect x="40" y="200" width="120" height="34" rx="6" fill="#fff"/><text x="100" y="223" font-family="Arial" font-weight="bold" font-size="15" text-anchor="middle" fill="#333">${texto}</text>${rango(12).map(i => `<circle cx="14" cy="${22 + i * 20}" r="6" fill="none" stroke="#999" stroke-width="3"/>`).join('')}`);
}

const caja = (color: string, texto: string, sub = '') =>
  svg('0 0 200 200', `<rect x="30" y="40" width="140" height="120" rx="14" fill="${color}"/><rect x="30" y="40" width="140" height="34" rx="14" fill="#000" opacity=".12"/><text x="100" y="${sub ? 110 : 118}" font-family="Arial" font-weight="bold" font-size="18" text-anchor="middle" fill="#fff">${texto}</text>${sub ? `<text x="100" y="134" font-family="Arial" font-size="13" text-anchor="middle" fill="#fff" opacity=".85">${sub}</text>` : ''}`);

const COLORES = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7', '#EC4899'];
const colores = (n = 5, punta = '#F5D0A9') =>
  svg('0 0 200 200', rango(n).map(i => `<g transform="rotate(-35 100 100) translate(${24 + i * (130 / n)},40)"><rect width="15" height="100" rx="2" fill="${COLORES[i % COLORES.length]}"/><path d="M0 100 L7.5 122 L15 100z" fill="${punta}"/><path d="M5 116 L7.5 122 L10 116z" fill="${COLORES[i % COLORES.length]}"/></g>`).join(''));

const lapiz = (cuerpo: string) =>
  svg('0 0 200 200', `<g transform="rotate(-35 100 100)"><rect x="40" y="88" width="110" height="24" rx="3" fill="${cuerpo}"/><rect x="150" y="88" width="14" height="24" fill="#CBD5E1"/><rect x="164" y="88" width="10" height="24" rx="3" fill="#F472B6"/><path d="M40 88 L14 100 L40 112z" fill="#F5D0A9"/><path d="M22 96 L14 100 L22 104z" fill="#334155"/></g>`);

const lapicero = (tinta: string) =>
  svg('0 0 200 200', `<g transform="rotate(-35 100 100)"><rect x="40" y="90" width="120" height="20" rx="10" fill="#E2E8F0" stroke="#94A3B8"/><rect x="140" y="86" width="26" height="28" rx="6" fill="${tinta}"/><path d="M40 92 L18 100 L40 108z" fill="#94A3B8"/><circle cx="18" cy="100" r="2" fill="${tinta}"/></g>`);

const regla = svg('0 0 200 200', `<g transform="rotate(-20 100 100)"><rect x="10" y="80" width="180" height="40" rx="4" fill="#FDE68A" stroke="#D97706"/>${rango(17).map(i => `<rect x="${18 + i * 10}" y="80" width="2" height="${i % 5 === 0 ? 18 : 10}" fill="#92400E"/>`).join('')}</g>`);

const tijera = (mango: string) =>
  svg('0 0 200 200', `<path d="M95 100 L170 40 L176 48 L104 108z" fill="#CBD5E1"/><path d="M95 100 L170 160 L176 152 L104 92z" fill="#94A3B8"/><circle cx="62" cy="70" r="26" fill="none" stroke="${mango}" stroke-width="12"/><circle cx="62" cy="130" r="26" fill="none" stroke="${mango}" stroke-width="12"/><circle cx="100" cy="100" r="5" fill="#475569"/>`);

const borrador = (color: string) =>
  svg('0 0 200 200', `<g transform="rotate(-12 100 100)"><rect x="45" y="70" width="110" height="60" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3"/><rect x="85" y="68" width="72" height="64" rx="4" fill="${color}"/></g>`);

const tajador = (color: string) =>
  svg('0 0 200 200', `<rect x="55" y="60" width="90" height="90" rx="18" fill="${color}"/><rect x="70" y="72" width="60" height="30" rx="6" fill="#fff" opacity=".7"/><circle cx="100" cy="87" r="9" fill="#475569"/>`);

const frasco = (color: string, texto: string) =>
  svg('0 0 200 200', `<rect x="72" y="40" width="56" height="22" rx="4" fill="#475569"/><rect x="58" y="60" width="84" height="110" rx="16" fill="${color}"/><rect x="66" y="96" width="68" height="34" rx="4" fill="#fff"/><text x="100" y="119" font-family="Arial" font-weight="bold" font-size="14" text-anchor="middle" fill="#334155">${texto}</text>`);

const cartuchera = (color: string) =>
  svg('0 0 200 200', `<rect x="25" y="70" width="150" height="70" rx="30" fill="${color}"/><path d="M45 72 L155 72" stroke="#fff" stroke-width="4" stroke-dasharray="6 5"/><rect x="146" y="64" width="10" height="22" rx="4" fill="#FBBF24"/>`);

const libro = (color: string, titulo: string) =>
  svg('0 0 200 260', `<rect x="30" y="10" width="150" height="240" rx="6" fill="${color}"/><rect x="30" y="10" width="14" height="240" fill="#000" opacity=".15"/><text x="112" y="110" font-family="Arial" font-weight="bold" font-size="22" text-anchor="middle" fill="#fff">${titulo}</text><circle cx="112" cy="170" r="30" fill="#fff" opacity=".25"/>`);

const papel = (colorA: string, colorB: string, texto: string) =>
  svg('0 0 200 200', `<rect x="50" y="40" width="110" height="130" rx="4" fill="${colorB}" transform="rotate(8 105 105)"/><rect x="40" y="35" width="110" height="130" rx="4" fill="${colorA}"/><text x="95" y="108" font-family="Arial" font-weight="bold" font-size="16" text-anchor="middle" fill="#fff">${texto}</text>`);

// ── Catálogo ──
let n = 0;
const P = (id: string, name: string, category: string, brand: string, tier: Tier, basePrice: number, imageUrl: string, description?: string, rating = 4.5): ProductoDemo =>
  ({ id, name, category, brand, tier, basePrice, imageUrl, description, sku: `RD-${String(++n).padStart(3, '0')}`, stock: 40 + (n * 7) % 60, rating, isActive: true });

export const productos: ProductoDemo[] = [
  // Cuadernos
  P('cu-e', 'Cuaderno A4 cuadriculado 100 h. tapa blanda', 'Cuadernos', 'Justus', 'economico', 4.5, portada('#2E62D9', 'liso', 'Justus'), 'Tapa blanda, papel de 56 g.', 4.2),
  P('cu-m', 'Cuaderno A4 cuadriculado 100 h. tapa dura', 'Cuadernos', 'Standford', 'medio', 6.5, portada('#1D4ED8', 'rayas', 'Standford'), 'Tapa dura plastificada, papel de 70 g que no traspasa.', 4.6),
  P('cu-p', 'Cuaderno A4 cuadriculado 100 h. cosido', 'Cuadernos', 'Layconsa', 'premium', 11.9, portada('#111827', 'liso', 'Layconsa'), 'Hojas cosidas de 80 g, no se desprenden.', 4.8),
  P('cu-dibujos', 'Cuaderno A4 cuadriculado 100 h. Diseños infantiles', 'Cuadernos', 'Standford', 'medio', 7.9, portada('#22A06B', 'dinos', 'Standford'), 'Tapa dura con diseños para niños. Elige el diseño.', 4.7),
  P('cu-galaxia', 'Cuaderno A4 cuadriculado 100 h. Galaxia', 'Cuadernos', 'Alpha', 'medio', 7.5, portada('#312E81', 'espacio', 'Alpha'), 'Tapa dura con diseño espacial.'),
  P('cu-flores', 'Cuaderno A4 cuadriculado 100 h. Flores', 'Cuadernos', 'Justus', 'economico', 5.2, portada('#EC4899', 'flores', 'Justus'), 'Tapa blanda con diseño de flores.'),
  P('cu-estrellas', 'Cuaderno A4 cuadriculado 100 h. Estrellas', 'Cuadernos', 'Alpha', 'economico', 4.9, portada('#F59E0B', 'estrellas', 'Alpha', '#7C2D12'), 'Tapa blanda, diseño de estrellas.'),
  P('cu-premium-dis', 'Cuaderno A4 cuadriculado 100 h. cosido con diseños', 'Cuadernos', 'Layconsa', 'premium', 13.5, portada('#7C3AED', 'estrellas', 'Layconsa'), 'Cosido, papel de 80 g, tapa con diseños.', 4.9),
  P('ra-e', 'Cuaderno A4 rayado 100 h. tapa blanda', 'Cuadernos', 'Justus', 'economico', 4.5, portada('#0EA5E9', 'liso', 'Justus'), 'Rayado, tapa blanda.'),
  P('ra-m', 'Cuaderno A4 rayado 100 h. tapa dura', 'Cuadernos', 'Standford', 'medio', 6.5, portada('#0369A1', 'rayas', 'Standford'), 'Rayado, tapa dura plastificada.'),
  P('ra-p', 'Cuaderno A4 rayado 100 h. cosido', 'Cuadernos', 'Layconsa', 'premium', 11.9, portada('#1E293B', 'rayas', 'Layconsa'), 'Rayado, cosido, papel de 80 g.'),
  P('tr-m', 'Cuaderno triple renglón A4 80 h.', 'Cuadernos', 'Standford', 'medio', 6.9, portada('#DC2626', 'rayas', 'Standford'), 'Para aprender a escribir en primaria.'),
  // Colores y arte
  P('co-e', 'Colores largos x24', 'Colores', 'Artesco', 'economico', 12.9, colores(5), 'Caja de cartón, 24 colores.', 4.1),
  P('co-m', 'Colores largos x24 triangulares', 'Colores', 'Faber-Castell', 'medio', 18.9, colores(6), 'Forma triangular, más fácil de agarrar.', 4.7),
  P('co-p', 'Colores acuarelables x24 con pincel', 'Colores', 'Faber-Castell', 'premium', 32.0, colores(6, '#FDE68A'), 'Se pueden usar con agua como acuarela.', 4.9),
  P('cr-e', 'Crayones gruesos x12', 'Colores', 'Artesco', 'economico', 6.5, caja('#F97316', 'CRAYONES', 'x12')),
  P('cr-m', 'Crayones jumbo x12', 'Colores', 'Faber-Castell', 'medio', 9.9, caja('#EA580C', 'JUMBO', 'x12')),
  P('pl-e', 'Plumones delgados x12', 'Colores', 'Artesco', 'economico', 7.9, caja('#06B6D4', 'PLUMONES', 'x12')),
  P('pl-m', 'Plumones lavables x12', 'Colores', 'Faber-Castell', 'medio', 13.5, caja('#0891B2', 'LAVABLES', 'x12')),
  P('pl-p', 'Plumones doble punta x12', 'Colores', 'Staedtler', 'premium', 24.9, caja('#155E75', 'DOBLE PUNTA', 'x12')),
  P('te-e', 'Témperas x7 colores 15 ml', 'Arte', 'Artesco', 'economico', 8.5, caja('#F59E0B', 'TÉMPERAS', '15 ml')),
  P('te-m', 'Témperas x7 colores 30 ml', 'Arte', 'Vinifan', 'medio', 11.9, caja('#D97706', 'TÉMPERAS', '30 ml')),
  P('te-p', 'Témperas metálicas x6 30 ml', 'Arte', 'Faber-Castell', 'premium', 16.9, caja('#92400E', 'METÁLICAS', 'x6')),
  P('pa-e', 'Plastilina x12 barras', 'Arte', 'Artesco', 'economico', 4.9, caja('#84CC16', 'PLASTILINA')),
  P('pa-m', 'Plastilina no tóxica x12', 'Arte', 'Play-Doh', 'medio', 9.9, caja('#65A30D', 'PLASTILINA', 'no tóxica')),
  // Escritura
  P('la-e', 'Lápiz 2B', 'Escritura', 'Artesco', 'economico', 0.8, lapiz('#F59E0B')),
  P('la-m', 'Lápiz 2B triangular', 'Escritura', 'Faber-Castell', 'medio', 1.5, lapiz('#16A34A')),
  P('la-p', 'Lápiz 2B Noris', 'Escritura', 'Staedtler', 'premium', 2.9, lapiz('#FACC15')),
  P('lp-e', 'Lapicero azul', 'Escritura', 'Pilot', 'economico', 1.2, lapicero('#2563EB')),
  P('lp-m', 'Lapicero azul gel', 'Escritura', 'Faber-Castell', 'medio', 2.5, lapicero('#1D4ED8')),
  P('pi-e', 'Plumón indeleble negro', 'Escritura', 'Artesco', 'economico', 2.5, caja('#1F2937', 'PLUMÓN')),
  P('pi-m', 'Plumón indeleble negro punta gruesa', 'Escritura', 'Faber-Castell', 'medio', 3.5, caja('#111827', 'PLUMÓN', 'punta gruesa')),
  P('pi-p', 'Plumón permanente Sharpie negro', 'Escritura', 'Sharpie', 'premium', 6.9, caja('#030712', 'SHARPIE')),
  // Útiles
  P('bo-e', 'Borrador blanco', 'Útiles', 'Artesco', 'economico', 0.7, borrador('#60A5FA')),
  P('bo-m', 'Borrador blanco sin polvo', 'Útiles', 'Faber-Castell', 'medio', 1.5, borrador('#22C55E')),
  P('bo-p', 'Borrador Mars plastic', 'Útiles', 'Staedtler', 'premium', 2.9, borrador('#2563EB')),
  P('ta-e', 'Tajador simple', 'Útiles', 'Artesco', 'economico', 0.9, tajador('#EF4444')),
  P('ta-m', 'Tajador con depósito', 'Útiles', 'Faber-Castell', 'medio', 3.5, tajador('#3B82F6')),
  P('ta-p', 'Tajador doble con depósito', 'Útiles', 'Maped', 'premium', 6.5, tajador('#8B5CF6')),
  P('ti-e', 'Tijera punta roma', 'Útiles', 'Artesco', 'economico', 2.9, tijera('#F43F5E')),
  P('ti-m', 'Tijera punta roma 13 cm', 'Útiles', 'Maped', 'medio', 5.9, tijera('#3B82F6')),
  P('ti-p', 'Tijera ergonómica zurdo/diestro', 'Útiles', 'Fiskars', 'premium', 12.9, tijera('#F97316')),
  P('re-e', 'Regla 30 cm', 'Útiles', 'Artesco', 'economico', 1.0, regla),
  P('re-m', 'Regla 30 cm flexible', 'Útiles', 'Maped', 'medio', 2.9, regla),
  P('ca-e', 'Cartuchera de tela', 'Útiles', 'Artesco', 'economico', 8.9, cartuchera('#64748B')),
  P('ca-m', 'Cartuchera dos cierres', 'Útiles', 'Totto', 'medio', 24.9, cartuchera('#2563EB')),
  P('ca-p', 'Cartuchera armable', 'Útiles', 'Totto', 'premium', 45.0, cartuchera('#DB2777')),
  P('fo-e', 'Folder A4 con fastener', 'Útiles', 'Vinifan', 'economico', 1.2, caja('#0EA5E9', 'FOLDER')),
  P('fo-m', 'Folder plastificado A4 con fastener', 'Útiles', 'Standford', 'medio', 2.5, caja('#7C3AED', 'FOLDER')),
  // Pegar
  P('go-e', 'Goma en barra 21 g', 'Pegar', 'Artesco', 'economico', 2.9, frasco('#7C3AED', 'GOMA')),
  P('go-m', 'Goma en barra 40 g', 'Pegar', 'UHU', 'medio', 5.5, frasco('#6D28D9', 'UHU')),
  P('go-p', 'Goma en barra 43 g', 'Pegar', 'Pritt', 'premium', 8.9, frasco('#B91C1C', 'PRITT')),
  P('cs-e', 'Cola sintética 250 g', 'Pegar', 'Artesco', 'economico', 4.5, frasco('#F8FAFC', 'COLA')),
  P('cs-m', 'Cola sintética 250 g lavable', 'Pegar', 'Vinifan', 'medio', 6.9, frasco('#E0F2FE', 'COLA')),
  // Papeles
  P('lu-e', 'Papel lustre x10 pliegos', 'Papeles', 'Artesco', 'economico', 2.9, papel('#EC4899', '#22C55E', 'LUSTRE')),
  P('lu-m', 'Papel lustre x20 pliegos', 'Papeles', 'Pepe', 'medio', 5.0, papel('#DB2777', '#3B82F6', 'LUSTRE')),
  P('ct-e', 'Cartulina blanca x10', 'Papeles', 'Artesco', 'economico', 5.5, papel('#94A3B8', '#CBD5E1', 'CARTULINA')),
  P('ct-m', 'Cartulina de colores x10', 'Papeles', 'Pepe', 'medio', 7.5, papel('#F97316', '#8B5CF6', 'COLORES')),
  P('bl-m', 'Block de dibujo A4 20 h.', 'Papeles', 'Standford', 'medio', 6.9, papel('#0EA5E9', '#F8FAFC', 'BLOCK')),
  P('bl-p', 'Block de dibujo A4 Canson 180 g', 'Papeles', 'Canson', 'premium', 14.9, papel('#1E3A8A', '#F8FAFC', 'CANSON')),
  P('bd-e', 'Papel bond A4 x100', 'Papeles', 'Atlas', 'economico', 4.9, papel('#64748B', '#F1F5F9', 'BOND')),
  P('bd-m', 'Papel bond A4 x500 75 g', 'Papeles', 'Chamex', 'medio', 18.9, papel('#0F766E', '#F1F5F9', 'BOND 500')),
  // Libros
  P('li-mat2', 'Matemática 2 – Cuaderno de trabajo', 'Libros', 'Santillana', 'medio', 64.9, libro('#0EA5E9', 'MATE 2')),
  P('li-com2', 'Comunicación 2 – Libro de actividades', 'Libros', 'Santillana', 'medio', 59.9, libro('#E11D48', 'COMU 2')),
  P('li-ing2', 'Inglés Kids 2 – Student Book', 'Libros', 'Oxford', 'premium', 89.0, libro('#16A34A', 'ENGLISH')),
];

export const servicios: ProductoDemo[] = [
  { id: 'srv-forro-cuaderno', name: 'Forrado de cuaderno', sku: 'SRV-FORRO-CUADERNO', imageUrl: portada('#2563EB', 'liso', 'Forrado'), basePrice: 2, category: 'Servicios', stock: 999, rating: 5, tier: 'medio' },
  { id: 'srv-forro-libro', name: 'Forrado de libro', sku: 'SRV-FORRO-LIBRO', imageUrl: portada('#16A34A', 'liso', 'Forrado'), basePrice: 3, category: 'Servicios', stock: 999, rating: 5, tier: 'medio' },
  { id: 'srv-etiqueta', name: 'Etiqueta personalizada', sku: 'SRV-ETIQUETA', imageUrl: caja('#F59E0B', 'Lucía', '2do B'), basePrice: 0.5, category: 'Servicios', stock: 999, rating: 5, tier: 'medio' },
  { id: 'srv-caratula', name: 'Carátula personalizada', sku: 'SRV-CARATULA', imageUrl: libro('#7C3AED', 'MATE'), basePrice: 2.5, category: 'Servicios', stock: 999, rating: 5, tier: 'medio' },
];

const V = (id: string, value: string, extra: Partial<ValorVariante> = {}): ValorVariante =>
  ({ id, value, price_modifier: 0, stock: 30, is_active: true, color_hex: null, image_url: null, ...extra });

const etiquetaImg = (fondo: string, patron: Patron) => portada(fondo, patron, 'Lucía');

export const variantes: Record<string, TipoVariante[]> = {
  'cu-dibujos': [{ id: 'vt-dib', name: 'Diseño', values: [
    V('v-dino', 'Dinosaurios', { image_url: portada('#22A06B', 'dinos', 'Standford') }),
    V('v-esp', 'Espacio', { image_url: portada('#1E3A8A', 'espacio', 'Standford') }),
    V('v-flo', 'Flores', { image_url: portada('#DB2777', 'flores', 'Standford'), price_modifier: 0.5 }),
    V('v-est', 'Estrellas', { image_url: portada('#F59E0B', 'estrellas', 'Standford', '#7C2D12'), stock: 0 }),
  ] }],
  'cu-m': [{ id: 'vt-tapa', name: 'Color de tapa', values: [
    V('v-azul', 'Azul', { color_hex: '#1D4ED8' }), V('v-rojo', 'Rojo', { color_hex: '#DC2626' }), V('v-verde', 'Verde', { color_hex: '#059669' }),
  ] }],
  'ca-m': [{ id: 'vt-cart', name: 'Color', values: [
    V('v-c-azul', 'Azul', { color_hex: '#2563EB' }), V('v-c-rosa', 'Rosado', { color_hex: '#DB2777' }), V('v-c-negro', 'Negro', { color_hex: '#111827' }),
  ] }],
  'srv-forro-cuaderno': [{ id: 'vt-forro', name: 'Color', values: [
    ['Azul', '#2563EB'], ['Rojo', '#DC2626'], ['Verde', '#16A34A'], ['Amarillo', '#FACC15'], ['Rosado', '#EC4899'], ['Morado', '#7C3AED'], ['Celeste', '#38BDF8'], ['Transparente', '#E2E8F0'],
  ].map(([v, c], i) => V('f' + i, v, { color_hex: c, stock: 999 })) }],
  'srv-etiqueta': [{ id: 'vt-et', name: 'Diseño', values: [
    V('e-lisa', 'Lisa', { stock: 999 }),
    V('e-dino', 'Dinosaurios', { image_url: etiquetaImg('#22A06B', 'dinos'), price_modifier: 0.2, stock: 999 }),
    V('e-esp', 'Espacio', { image_url: etiquetaImg('#1E3A8A', 'espacio'), price_modifier: 0.2, stock: 999 }),
    V('e-flo', 'Flores', { image_url: etiquetaImg('#DB2777', 'flores'), price_modifier: 0.2, stock: 999 }),
  ] }],
  'srv-caratula': [{ id: 'vt-ca', name: 'Curso', values: ['Matemática', 'Comunicación', 'Ciencia y Tecnología', 'Personal Social', 'Inglés', 'Arte', 'Religión', 'Computación'].map((c, i) => V('c' + i, c, { stock: 999 })) }],
};

export const marcas = Array.from(new Set(productos.map(p => p.brand!))).sort().map((name, i) => ({ id: 'b' + i, name, logoUrl: null }));
export const categorias = ['Cuadernos', 'Colores', 'Arte', 'Escritura', 'Útiles', 'Pegar', 'Papeles', 'Libros', 'Servicios'].map((name, i) => ({ id: 'cat' + i, name }));

export const secciones = [
  ['Inicial', 'Inicial - 4 años'], ['Inicial', 'Inicial - 5 años'],
  ['Primaria', '1ro Primaria'], ['Primaria', '2do Primaria'], ['Primaria', '3ro Primaria'], ['Primaria', '4to Primaria'], ['Primaria', '5to Primaria'], ['Primaria', '6to Primaria'],
  ['Secundaria', '1ro Secundaria'], ['Secundaria', '2do Secundaria'], ['Secundaria', '3ro Secundaria'], ['Secundaria', '4to Secundaria'], ['Secundaria', '5to Secundaria'],
].map(([groupName, name], i) => ({ id: 'sec' + i, groupName, name, sortOrder: i + 1 }));

// Colegios ficticios de ejemplo
export const colegios = [
  { id: 'col-1', name: 'Colegio Los Álamos', address: 'Av. Ejército 410, Yanahuara' },
  { id: 'col-2', name: 'I.E. Santa Rosa de Lima', address: 'Calle Mercaderes 220, Cercado' },
  { id: 'col-3', name: 'Colegio Arco Iris', address: 'Av. Dolores 150, J. L. Bustamante y Rivero' },
  { id: 'col-4', name: 'Colegio San Martín de Porres', address: 'Av. Lambramani 300, Arequipa' },
];

// Plantilla de lista: [texto como viene en la lista, cantidad, ids por nivel, notas]
/** Listas oficiales con las que arranca la demo: [id, colegio, grado, plantilla]. También las usa el sitemap. */
export const LISTAS_OFICIALES: [string, string, string, 'primaria' | 'primaria3' | 'inicial' | 'secundaria'][] = [
  ['lista-alamos-2p', 'col-1', '2do Primaria', 'primaria'],
  ['lista-alamos-5i', 'col-1', 'Inicial - 5 años', 'inicial'],
  ['lista-santarosa-3p', 'col-2', '3ro Primaria', 'primaria3'],
  ['lista-arcoiris-1s', 'col-3', '1ro Secundaria', 'secundaria'],
  ['lista-sanmartin-4i', 'col-4', 'Inicial - 4 años', 'inicial'],
];

export type Linea = [string, number, Partial<Record<Tier, string>>, string?];
export const plantillaPrimaria: Linea[] = [
  ['4 cuadernos A4 cuadriculados de 100 h.', 4, { economico: 'cu-e', medio: 'cu-m', premium: 'cu-p' }, 'Forrados de azul'],
  ['2 cuadernos A4 rayados', 2, { economico: 'ra-e', medio: 'ra-m', premium: 'ra-p' }],
  ['1 caja de colores largos x24', 1, { economico: 'co-e', medio: 'co-m', premium: 'co-p' }],
  ['1 caja de crayones x12', 1, { economico: 'cr-e', medio: 'cr-m' }],
  ['3 lápices 2B', 3, { economico: 'la-e', medio: 'la-m', premium: 'la-p' }],
  ['2 borradores blancos', 2, { economico: 'bo-e', medio: 'bo-m', premium: 'bo-p' }],
  ['1 tajador con depósito', 1, { economico: 'ta-e', medio: 'ta-m', premium: 'ta-p' }],
  ['1 tijera punta roma', 1, { economico: 'ti-e', medio: 'ti-m', premium: 'ti-p' }],
  ['1 regla de 30 cm', 1, { economico: 're-e', medio: 're-m' }],
  ['2 gomas en barra grandes', 2, { economico: 'go-e', medio: 'go-m', premium: 'go-p' }],
  ['1 paquete de papel lustre', 1, { economico: 'lu-e', medio: 'lu-m' }],
  ['1 témperas de 7 colores', 1, { economico: 'te-e', medio: 'te-m', premium: 'te-p' }],
  ['1 plumón indeleble negro', 1, { economico: 'pi-e', medio: 'pi-m', premium: 'pi-p' }, 'Marcado con el nombre'],
  ['1 limpiatipo', 1, {}],
];
// 3ro de primaria (I.E. Santa Rosa): más cuadernos, lapicero y plumones, sin crayones ni témperas
export const plantillaPrimaria3: Linea[] = [
  ['6 cuadernos A4 cuadriculados de 100 h.', 6, { economico: 'cu-e', medio: 'cu-m', premium: 'cu-p' }, 'Forrados de rojo'],
  ['3 cuadernos A4 rayados', 3, { economico: 'ra-e', medio: 'ra-m', premium: 'ra-p' }],
  ['1 caja de colores x24', 1, { economico: 'co-e', medio: 'co-m', premium: 'co-p' }],
  ['1 estuche de plumones x12', 1, { economico: 'pl-e', medio: 'pl-m', premium: 'pl-p' }],
  ['2 lápices 2B', 2, { economico: 'la-e', medio: 'la-m', premium: 'la-p' }],
  ['2 lapiceros azules', 2, { economico: 'lp-e', medio: 'lp-m' }],
  ['1 borrador blanco', 1, { economico: 'bo-e', medio: 'bo-m', premium: 'bo-p' }],
  ['1 tajador con depósito', 1, { economico: 'ta-e', medio: 'ta-m', premium: 'ta-p' }],
  ['1 regla de 30 cm', 1, { economico: 're-e', medio: 're-m' }],
  ['1 goma en barra', 1, { economico: 'go-e', medio: 'go-m', premium: 'go-p' }],
  ['1 paquete de cartulinas de colores', 1, { economico: 'ct-e', medio: 'ct-m' }],
  ['1 block de dibujo A4', 1, { medio: 'bl-m', premium: 'bl-p' }],
  ['2 folders con fastener', 2, { economico: 'fo-e', medio: 'fo-m' }],
  ['1 diccionario escolar', 1, {}],
];
export const plantillaInicial: Linea[] = [
  ['1 caja de crayones jumbo', 1, { economico: 'cr-e', medio: 'cr-m' }],
  ['2 cajas de plastilina', 2, { economico: 'pa-e', medio: 'pa-m' }],
  ['1 témperas x7', 1, { economico: 'te-e', medio: 'te-m', premium: 'te-p' }],
  ['1 block de dibujo A4', 1, { medio: 'bl-m', premium: 'bl-p' }],
  ['1 paquete de cartulinas de colores', 1, { economico: 'ct-e', medio: 'ct-m' }],
  ['1 cola sintética', 1, { economico: 'cs-e', medio: 'cs-m' }],
  ['1 tijera punta roma', 1, { economico: 'ti-e', medio: 'ti-m', premium: 'ti-p' }],
  ['1 folder con fastener', 1, { economico: 'fo-e', medio: 'fo-m' }],
];
export const plantillaSecundaria: Linea[] = [
  ['8 cuadernos A4 cuadriculados', 8, { economico: 'cu-e', medio: 'cu-m', premium: 'cu-p' }],
  ['4 cuadernos A4 rayados', 4, { economico: 'ra-e', medio: 'ra-m', premium: 'ra-p' }],
  ['3 lapiceros azules', 3, { economico: 'lp-e', medio: 'lp-m' }],
  ['2 lápices 2B', 2, { economico: 'la-e', medio: 'la-m', premium: 'la-p' }],
  ['1 regla de 30 cm', 1, { economico: 're-e', medio: 're-m' }],
  ['1 paquete papel bond A4', 1, { economico: 'bd-e', medio: 'bd-m' }],
  ['1 cartuchera', 1, { economico: 'ca-e', medio: 'ca-m', premium: 'ca-p' }],
  ['1 calculadora científica', 1, {}],
];

export const imagenListaEjemplo = svg('0 0 600 800',
  `<rect width="600" height="800" fill="#FFFDF5"/>${rango(32).map(i => `<line x1="0" y1="${60 + i * 23}" x2="600" y2="${60 + i * 23}" stroke="#BFDBFE"/>`).join('')}<line x1="70" y1="0" x2="70" y2="800" stroke="#FCA5A5" stroke-width="2"/>` +
  `<text x="300" y="45" font-family="Comic Sans MS, cursive" font-size="26" text-anchor="middle" fill="#1E3A8A">Lista de útiles 2027</text>` +
  plantillaPrimaria.map(([t], i) => `<text x="85" y="${102 + i * 46}" font-family="Comic Sans MS, cursive" font-size="21" fill="#1F2937">• ${t}</text>`).join(''));
