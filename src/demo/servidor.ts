// "Servidor" de la tienda de demostración. Corre dentro del navegador y guarda todo en
// localStorage, así la página funciona en Vercel sin backend ni base de datos.
// Responde con la misma forma que la API real ({ success, data }).

import {
  productos as catalogo, servicios, variantes as variantesBase, marcas, categorias, secciones, colegios,
  plantillaPrimaria, plantillaInicial, plantillaSecundaria, imagenListaEjemplo,
  type Linea, type ProductoDemo, type Tier, type TipoVariante,
} from './catalogo';

const CLAVE = 'ready-demo-v1';
const SEG = 1000;
// Tiempos de la demo: la "IA" lee la lista y el administrador la aprueba solo
export const TIEMPO_LECTURA = 6 * SEG;
export const TIEMPO_APROBACION = 14 * SEG;

type Json = Record<string, unknown>;

interface Usuario { id: string; email: string; name: string; role: string; phone?: string; address?: string }
interface Grado { id: string; schoolId: string; name: string; year: number }
interface ItemGuardado {
  id: string; nombreOriginal: string; cantidad: number; notas?: string;
  niveles: Partial<Record<Tier, string>>; elegido?: string | null;
  userCustomQuantity?: number | null; userNotas?: string | null;
}
interface Lista {
  id: string; userId?: string; schoolId: string; gradeId: string; year: number; imageUrl?: string;
  estado: string; esOficial: boolean; iaEstado: string; iaMensaje?: string; plan?: string | null;
  extras?: string | null; observaciones?: string; userObservaciones?: string;
  estudianteNombre?: string; estudianteGrado?: string; creada: number; fechaValidacion?: number;
  plantilla: 'primaria' | 'inicial' | 'secundaria'; items: ItemGuardado[];
}
interface Pedido {
  id: string; userId: string; supplyListId?: string; total: number; status: string;
  shippingAddress: string; shippingPhone: string; contactNotes?: string; createdAt: string;
  pago: { metodo: string; operacion: string; estado: string };
  items: { id: string; productId: string; productName: string; imageUrl?: string; quantity: number; unitPrice: number; notes?: string }[];
  statusHistory: { status: string; notes?: string; createdAt: string }[];
}
interface Campana { id: string; name: string; slug: string; description?: string; discount_percent: number; discount_fixed: number; start_date?: string | null; end_date?: string | null; is_active: boolean; image_url?: string | null; productIds: string[] }
interface Noticia { id: string; title: string; content?: string; image_url?: string | null; campaign_slug?: string | null; is_active: boolean; created_at: string }

interface Estado {
  version: 1;
  usuarios: Usuario[];
  productos: ProductoDemo[];
  variantes: Record<string, TipoVariante[]>;
  marcas: { id: string; name: string; logoUrl?: string | null }[];
  categorias: { id: string; name: string }[];
  secciones: typeof secciones;
  colegios: { id: string; name: string; address?: string }[];
  seccionesColegio: Record<string, string[]>;
  grados: Grado[];
  listas: Lista[];
  pedidos: Pedido[];
  campanas: Campana[];
  noticias: Noticia[];
  avisos: { tipo: string; mensaje: string; userId?: string; admin?: boolean }[];
}

const nuevoId = (prefijo: string) => `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const ahora = () => new Date().toISOString();

function estadoInicial(): Estado {
  const año = new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0);
  const grados: Grado[] = [];
  const grado = (schoolId: string, name: string) => { const g = { id: `gr-${schoolId}-${grados.length}`, schoolId, name, year: año }; grados.push(g); return g; };
  const listaOficial = (id: string, schoolId: string, gradoNombre: string, plantilla: Lista['plantilla']): Lista => ({
    id, schoolId, gradeId: grado(schoolId, gradoNombre).id, year: año, imageUrl: imagenListaEjemplo, estado: 'VALIDADA', esOficial: true,
    iaEstado: 'LISTO', creada: Date.now() - 86400000 * 3, fechaValidacion: Date.now() - 86400000 * 2, plantilla, items: crearItems(id, plantilla),
  });
  const todas = [...catalogo, ...servicios];
  return {
    version: 1,
    usuarios: [
      { id: 'u-admin', email: 'admin@ready.pe', name: 'Admin Ready', role: 'ADMIN', phone: '959 000 111' },
    ],
    productos: todas.map(p => ({ ...p })),
    variantes: JSON.parse(JSON.stringify(variantesBase)),
    marcas: marcas.map(m => ({ ...m })),
    categorias: categorias.map(c => ({ ...c })),
    secciones: secciones.map(s => ({ ...s })),
    colegios: colegios.map(c => ({ ...c })),
    seccionesColegio: Object.fromEntries(colegios.map(c => [c.id, secciones.map(s => s.id)])),
    grados,
    listas: [
      listaOficial('lista-alamos-2p', 'col-1', '2do Primaria', 'primaria'),
      listaOficial('lista-alamos-5i', 'col-1', 'Inicial - 5 años', 'inicial'),
      listaOficial('lista-santarosa-3p', 'col-2', '3ro Primaria', 'primaria'),
      listaOficial('lista-arcoiris-1s', 'col-3', '1ro Secundaria', 'secundaria'),
      listaOficial('lista-sanmartin-4i', 'col-4', 'Inicial - 4 años', 'inicial'),
    ],
    pedidos: [],
    campanas: [{ id: 'camp-1', name: 'Regreso a clases', slug: 'regreso-a-clases', description: '10% en cuadernos y colores', discount_percent: 10, discount_fixed: 0, is_active: true, productIds: ['cu-m', 'cu-dibujos', 'co-m', 'co-p', 'ra-m'] }],
    noticias: [],
    avisos: [],
  };
}

const PLANTILLAS: Record<Lista['plantilla'], Linea[]> = { primaria: plantillaPrimaria, inicial: plantillaInicial, secundaria: plantillaSecundaria };

function crearItems(listaId: string, plantilla: Lista['plantilla']): ItemGuardado[] {
  return PLANTILLAS[plantilla].map(([texto, cantidad, niveles, notas], i) => ({ id: `${listaId}-i${i}`, nombreOriginal: texto, cantidad, notas, niveles: { ...niveles } }));
}

// ── Persistencia ──
let estado: Estado | null = null;
function cargar(): Estado {
  if (estado) return estado;
  try {
    const crudo = typeof localStorage !== 'undefined' ? localStorage.getItem(CLAVE) : null;
    if (crudo) { const e = JSON.parse(crudo) as Estado; if (e.version === 1) return (estado = e); }
  } catch { /* datos dañados: se empieza de cero */ }
  return (estado = estadoInicial());
}
function guardar() {
  if (!estado) return;
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
  catch {
    // Sin espacio: se quitan las fotos subidas y se vuelve a intentar
    estado.listas.forEach(l => { if (l.imageUrl?.startsWith('data:image/jpeg') || l.imageUrl?.startsWith('data:image/png')) l.imageUrl = imagenListaEjemplo; });
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* se queda solo en memoria */ }
  }
}
export function reiniciarDemo() { estado = null; try { localStorage.removeItem(CLAVE); } catch { /* nada */ } }

// ── Avisos (en vez de SignalR) ──
function avisar(tipo: string, mensaje: string, destino: { userId?: string; admin?: boolean }) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ready-demo-aviso', { detail: { tipo, mensaje, ...destino, timestamp: ahora() } }));
}

// ── Avance de las listas con el tiempo (lectura de la IA y aprobación) ──
export function avanzar() {
  const e = cargar();
  let cambio = false;
  for (const l of e.listas) {
    const edad = Date.now() - l.creada;
    if (l.iaEstado === 'PROCESANDO' && edad >= TIEMPO_LECTURA) {
      l.iaEstado = 'LISTO';
      l.items = crearItems(l.id, l.plantilla);
      l.iaMensaje = `Leímos ${l.items.length} útiles. 1 no está en nuestro catálogo; lo revisamos nosotros.`;
      l.extras = JSON.stringify({
        forro: { activo: true, color: 'Azul' }, etiquetas: { activo: false, nombre: '', grado: '', diseno: 'lisa' },
        caratulas: { activo: false, cursos: [] }, forrarLibros: false,
        libros: l.plantilla === 'primaria' ? [
          { id: 'ia-1', titulo: 'Matemática 2 – Cuaderno de trabajo', editorial: 'Santillana', cantidad: 1, productoId: 'li-mat2', precio: 64.9 },
          { id: 'ia-2', titulo: 'Plan lector: El principito', editorial: 'Norma', cantidad: 1 },
        ] : [],
      });
      cambio = true;
    }
    if (l.estado === 'PENDIENTE_REVISION' && l.iaEstado === 'LISTO' && edad >= TIEMPO_APROBACION) {
      l.estado = 'VALIDADA';
      l.fechaValidacion = Date.now();
      cambio = true;
      avisar('ListReady', '¡Tu lista fue aprobada! Ya puedes elegir tu paquete.', { userId: l.userId });
    }
  }
  if (cambio) guardar();
}

// ── Armado de respuestas ──
const producto = (id?: string | null) => (id ? cargar().productos.find(p => p.id === id) : undefined);
const ORDEN: Record<Tier, Tier[]> = { economico: ['economico', 'medio', 'premium'], medio: ['medio', 'economico', 'premium'], premium: ['premium', 'medio', 'economico'] };
const nivelDe = (plan?: string | null): Tier => (plan === 'economico' || plan === 'premium' ? plan : 'medio');

function idElegido(item: ItemGuardado, plan?: string | null) {
  if (item.elegido !== undefined) return item.elegido;
  for (const t of ORDEN[nivelDe(plan)]) if (item.niveles[t]) return item.niveles[t]!;
  return null;
}

function itemRespuesta(l: Lista, it: ItemGuardado) {
  const eco = producto(it.niveles.economico), med = producto(it.niveles.medio), pre = producto(it.niveles.premium);
  const elegido = producto(idElegido(it, l.plan));
  return {
    id: it.id, supplyListId: l.id, nombreOriginal: it.nombreOriginal, nombreDetectado: elegido?.name ?? it.nombreOriginal,
    cantidad: it.cantidad, notas: it.notas, matchedQuantity: it.cantidad, userCustomQuantity: it.userCustomQuantity ?? null, userNotas: it.userNotas ?? null,
    matchedProductId: elegido?.id ?? null, matchedProduct: elegido ?? null, priceAtMatch: elegido?.basePrice ?? null,
    productEconomicoId: eco?.id ?? null, productEconomico: eco ?? null, priceEconomico: eco?.basePrice ?? null,
    productMedioId: med?.id ?? null, productMedio: med ?? null, priceMedio: med?.basePrice ?? null,
    productPremiumId: pre?.id ?? null, productPremium: pre ?? null, pricePremium: pre?.basePrice ?? null,
    forro: false, etiquetaDibujo: false, caratula: false,
  };
}

function listaRespuesta(l: Lista) {
  const e = cargar();
  const col = e.colegios.find(c => c.id === l.schoolId);
  const gr = e.grados.find(g => g.id === l.gradeId);
  const usuario = e.usuarios.find(u => u.id === l.userId);
  return {
    id: l.id, userId: l.userId ?? null, schoolId: l.schoolId, schoolName: col?.name ?? 'Colegio', gradeId: l.gradeId, gradeName: gr?.name ?? '',
    year: l.year, imageUrl: l.imageUrl, estado: l.estado, esOficial: l.esOficial, observaciones: l.observaciones, userObservaciones: l.userObservaciones,
    submittedBy: usuario?.name, plan: l.plan ?? null, estudianteNombre: l.estudianteNombre, estudianteGrado: l.estudianteGrado,
    iaEstado: l.iaEstado, iaMensaje: l.iaMensaje, extras: l.extras ?? null,
    fechaSubida: new Date(l.creada).toISOString(), fechaValidacion: l.fechaValidacion ? new Date(l.fechaValidacion).toISOString() : null,
    createdAt: new Date(l.creada).toISOString(), totalItems: l.items.length,
  };
}

const pedidoRespuesta = (p: Pedido) => {
  const u = cargar().usuarios.find(x => x.id === p.userId);
  return { ...p, userName: u?.name, userEmail: u?.email };
};

// ── Utilidades HTTP ──
export class ErrorDemo extends Error { constructor(message: string, public status = 400) { super(message); } }
const norm = (o: Json) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), v])) as Json;
const texto = (v: unknown) => (v === undefined || v === null ? undefined : String(v));

function usuarioDe(token?: string | null) {
  if (!token) return undefined;
  const id = token.replace(/^Bearer\s+/i, '').replace(/^demo\./, '');
  return cargar().usuarios.find(u => u.id === id);
}

function leerArchivo(f: File): Promise<string> {
  return new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => mal(r.error); r.readAsDataURL(f); });
}

const sesion = (u: Usuario) => ({ token: `demo.${u.id}`, user: u });

// ── Rutas ──
export async function responder(metodo: string, ruta: string, query: URLSearchParams, cuerpo: unknown, token?: string | null): Promise<unknown> {
  avanzar();
  const e = cargar();
  const M = metodo.toUpperCase();
  const b = cuerpo instanceof FormData ? cuerpo : norm((cuerpo as Json) ?? {});
  const bj = b as Json;
  const p = ruta.replace(/\/+$/, '').split('/').filter(Boolean);
  const [r0, r1, r2, r3, r4] = p;
  const yo = usuarioDe(token);
  const cambia = <T,>(v: T) => { guardar(); return v; };

  // Auth
  if (r0 === 'auth') {
    if (r1 === 'login' && M === 'POST') {
      const email = String(bj.email || '').trim().toLowerCase();
      if (!email) throw new ErrorDemo('Escribe tu correo');
      let u = e.usuarios.find(x => x.email.toLowerCase() === email);
      if (!u) { u = { id: nuevoId('u'), email, name: email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), role: email.startsWith('admin') ? 'ADMIN' : 'USER' }; e.usuarios.push(u); guardar(); }
      return sesion(u);
    }
    if (r1 === 'register' && M === 'POST') {
      const email = String(bj.email || '').trim().toLowerCase();
      if (e.usuarios.some(x => x.email.toLowerCase() === email)) throw new ErrorDemo('Ese correo ya tiene cuenta. Inicia sesión.');
      const u: Usuario = { id: nuevoId('u'), email, name: String(bj.name || 'Cliente'), role: 'USER' };
      e.usuarios.push(u);
      return cambia(sesion(u));
    }
    if (r1 === 'me') { if (!yo) throw new ErrorDemo('Sesión vencida', 401); return yo; }
    if (r1 === 'users' && !r2) return e.usuarios;
    if (r1 === 'users' && r3 === 'role') { const u = e.usuarios.find(x => x.id === r2); if (u) u.role = String(bj.role); return cambia(true); }
  }

  // Colegios y grados
  if (r0 === 'schools') {
    const col = r1 ? e.colegios.find(c => c.id === r1) : undefined;
    if (!r1 && M === 'GET') return e.colegios;
    if (!r1 && M === 'POST') { const c = { id: nuevoId('col'), name: String(bj.name), address: texto(bj.address) }; e.colegios.push(c); e.seccionesColegio[c.id] = e.secciones.map(s => s.id); return cambia(c); }
    if (r1 && !r2 && M === 'GET') return col ?? null;
    if (r1 && !r2 && M === 'PUT') { if (col) Object.assign(col, { name: bj.name ?? col.name, address: bj.address ?? col.address }); return cambia(true); }
    if (r1 && !r2 && M === 'DELETE') { e.colegios = e.colegios.filter(c => c.id !== r1); return cambia(true); }
    if (r2 === 'grades' && M === 'GET') return e.grados.filter(g => g.schoolId === r1);
    if (r2 === 'grades' && M === 'POST') {
      const name = String(bj.name), year = Number(bj.year) || new Date().getFullYear();
      let g = e.grados.find(x => x.schoolId === r1 && x.name === name && x.year === year);
      if (!g) { g = { id: nuevoId('gr'), schoolId: r1, name, year }; e.grados.push(g); }
      return cambia(g);
    }
    if (r2 === 'grades' && r3 && M === 'DELETE') { e.grados = e.grados.filter(g => g.id !== r3); return cambia(true); }
    if (r2 === 'sections' && M === 'GET') { const ids = e.seccionesColegio[r1] ?? []; return e.secciones.filter(s => ids.includes(s.id)); }
    if (r2 === 'sections' && M === 'PUT') { e.seccionesColegio[r1] = (bj.sectionIds as string[]) ?? []; return cambia(true); }
  }
  if (r0 === 'sections') {
    if (M === 'GET') return e.secciones;
    if (M === 'POST') { const s = { id: nuevoId('sec'), groupName: String(bj.groupName), name: String(bj.name), sortOrder: Number(bj.sortOrder) || 0 }; e.secciones.push(s); return cambia(s); }
    if (M === 'DELETE') { e.secciones = e.secciones.filter(s => s.id !== r1); return cambia(true); }
  }
  if (r0 === 'categories') {
    if (M === 'GET') return e.categorias;
    if (M === 'POST') { const c = { id: nuevoId('cat'), name: String(bj.name) }; e.categorias.push(c); return cambia(c); }
    if (M === 'DELETE') { e.categorias = e.categorias.filter(c => c.id !== r1); return cambia(true); }
  }
  if (r0 === 'brands') {
    if (M === 'GET') return e.marcas;
    if (M === 'POST' && !r1) { const m = { id: nuevoId('b'), name: String(bj.name), logoUrl: texto(bj.logoUrl) ?? null }; e.marcas.push(m); return cambia(m); }
    if (M === 'PUT') { const m = e.marcas.find(x => x.id === r1); if (m) m.name = String(bj.name); return cambia(true); }
    if (r2 === 'logo' && b instanceof FormData) { const f = b.get('file') ?? b.get('logo'); const m = e.marcas.find(x => x.id === r1); if (m && f instanceof File) m.logoUrl = await leerArchivo(f); return cambia(true); }
  }

  // Campañas y noticias
  if (r0 === 'campaigns') {
    const sinProductos = ({ productIds, ...c }: Campana) => ({ ...c, productCount: productIds.length });
    if (!r1 && M === 'GET') return e.campanas.filter(c => query.get('activeOnly') !== 'true' || c.is_active).map(sinProductos);
    if (!r1 && M === 'POST') { const c: Campana = { id: nuevoId('camp'), name: String(bj.name), slug: String(bj.slug), description: texto(bj.description), discount_percent: Number(bj.discountPercent) || 0, discount_fixed: Number(bj.discountFixed) || 0, start_date: texto(bj.startDate) ?? null, end_date: texto(bj.endDate) ?? null, is_active: true, productIds: [] }; e.campanas.push(c); return cambia(sinProductos(c)); }
    const c = e.campanas.find(x => x.id === r1 || x.slug === r1);
    if (r1 && !r2 && M === 'GET') return c ? { ...sinProductos(c), products: c.productIds.map(id => producto(id)).filter(Boolean) } : null;
    if (r1 && !r2 && M === 'PUT' && c) { Object.assign(c, { name: bj.name ?? c.name, slug: bj.slug ?? c.slug, description: bj.description ?? c.description, discount_percent: Number(bj.discountPercent ?? c.discount_percent) }); return cambia(true); }
    if (r2 === 'products' && M === 'POST' && c) { const id = String(bj.productId); if (!c.productIds.includes(id)) c.productIds.push(id); return cambia(true); }
    if (r2 === 'products' && M === 'DELETE' && c) { c.productIds = c.productIds.filter(x => x !== r3); return cambia(true); }
    if (r2 === 'image') return true;
  }
  if (r0 === 'news') {
    if (!r1 && M === 'GET') return e.noticias.filter(n => query.get('activeOnly') !== 'true' || n.is_active);
    if (!r1 && M === 'POST') { const n: Noticia = { id: nuevoId('n'), title: String(bj.title), content: texto(bj.content), campaign_slug: texto(bj.campaignSlug) ?? null, is_active: true, created_at: ahora() }; e.noticias.push(n); return cambia(n); }
    const n = e.noticias.find(x => x.id === r1);
    if (r1 && !r2 && M === 'PUT' && n) { Object.assign(n, { title: bj.title ?? n.title, content: bj.content ?? n.content, is_active: bj.isActive ?? n.is_active }); return cambia(true); }
    if (r1 && !r2 && M === 'DELETE') { e.noticias = e.noticias.filter(x => x.id !== r1); return cambia(true); }
    if (r2 === 'image' && n && b instanceof FormData) { const f = b.get('file') ?? b.get('image'); if (f instanceof File) n.image_url = await leerArchivo(f); return cambia(true); }
  }

  // Productos y variantes
  if (r0 === 'products') {
    const activos = e.productos.filter(x => x.isActive !== false);
    if (!r1 && M === 'GET') {
      const cat = query.get('category'), marca = query.get('brand');
      let res = activos.filter(x => (cat ? x.category === cat : x.category !== 'Servicios') && (!marca || x.brand === marca));
      const lim = Number(query.get('limit')); if (lim > 0) res = res.slice(0, lim);
      return res;
    }
    if (r1 === 'search') {
      const q = (query.get('q') || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const palabras = q.split(/\s+/).filter(w => w.length > 2 && !/^\d+$/.test(w));
      const cat = query.get('category');
      const sinTilde = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      return activos.filter(x => x.category !== 'Servicios' && (!cat || x.category === cat) && (palabras.length === 0 || palabras.some(w => sinTilde(`${x.name} ${x.brand} ${x.category}`).includes(w.replace(/e?s$/, '')))));
    }
    if (r1 === 'categories') return Array.from(new Set(activos.filter(x => x.category !== 'Servicios').map(x => x.category)));
    if (!r1 && M === 'POST') { const x: ProductoDemo = { id: nuevoId('p'), name: String(bj.name), description: texto(bj.description), category: String(bj.category || 'Útiles'), brand: texto(bj.brand), sku: String(bj.sku || nuevoId('SKU')), basePrice: Number(bj.basePrice) || 0, imageUrl: texto(bj.imageUrl), stock: Number(bj.stock) || 0, rating: 4.5, tier: (bj.tier as Tier) || 'medio', isActive: true }; e.productos.push(x); return cambia(x); }
    const prod = e.productos.find(x => x.id === r1);
    if (r1 && !r2 && M === 'GET') { if (!prod) throw new ErrorDemo('Producto no encontrado', 404); return { ...prod, variants: e.variantes[prod.id] ?? [], images: [] }; }
    if (r1 && !r2 && M === 'PUT' && prod) { const { id: _ignorado, ...resto } = bj; void _ignorado; Object.assign(prod, resto); return cambia(prod); }
    if (r1 && !r2 && M === 'DELETE' && prod) { prod.isActive = false; return cambia(true); }
    if (r2 === 'images') { if (M === 'POST' && prod && b instanceof FormData) { const f = b.get('file') ?? b.get('image'); if (f instanceof File) prod.imageUrl = await leerArchivo(f); guardar(); } return []; }
    if (r2 === 'variants') {
      const tipos = (e.variantes[r1] ??= []);
      if (!r3 && M === 'GET') return tipos;
      if (r3 === 'types' && !r4 && M === 'POST') { const t = { id: nuevoId('vt'), name: String(bj.name), values: [] }; tipos.push(t); return cambia(t); }
      if (r3 === 'types' && r4 && M === 'POST') { const t = tipos.find(x => x.id === r4); const v = { id: nuevoId('vv'), value: String(bj.value), color_hex: texto(bj.colorHex) ?? null, image_url: null, price_modifier: Number(bj.priceModifier) || 0, stock: Number(bj.stock) || 0, is_active: true }; t?.values.push(v); return cambia(v); }
      if (r3 === 'types' && r4 && M === 'DELETE') { e.variantes[r1] = tipos.filter(x => x.id !== r4); return cambia(true); }
      if (r3 === 'values' && M === 'DELETE') { tipos.forEach(t => { t.values = t.values.filter(v => v.id !== r4); }); return cambia(true); }
      if (r3 === 'values' && M === 'PUT') { tipos.forEach(t => t.values.forEach(v => { if (v.id === r4) Object.assign(v, { value: bj.value ?? v.value, stock: bj.stock ?? v.stock, price_modifier: bj.priceModifier ?? v.price_modifier }); })); return cambia(true); }
      if (r3 === 'values' && p[5] === 'image' && b instanceof FormData) { const f = b.get('file') ?? b.get('image'); if (f instanceof File) { const url = await leerArchivo(f); tipos.forEach(t => t.values.forEach(v => { if (v.id === r4) v.image_url = url; })); } return cambia(true); }
    }
  }

  // Listas
  if (r0 === 'lists') {
    if (r1 === 'upload' && M === 'POST' && b instanceof FormData) {
      const archivo = b.getAll('files').find(f => f instanceof File) as File | undefined;
      const gradeId = String(b.get('gradeId'));
      const gradoNombre = e.grados.find(g => g.id === gradeId)?.name ?? '';
      const l: Lista = {
        id: nuevoId('lista'), userId: texto(b.get('userId')) || yo?.id, schoolId: String(b.get('schoolId')), gradeId, year: Number(b.get('year')),
        imageUrl: archivo && archivo.type.startsWith('image/') ? await leerArchivo(archivo) : imagenListaEjemplo,
        estado: 'PENDIENTE_REVISION', esOficial: false, iaEstado: 'PROCESANDO', creada: Date.now(),
        plantilla: /inicial/i.test(gradoNombre) ? 'inicial' : /secundaria/i.test(gradoNombre) ? 'secundaria' : 'primaria', items: [],
      };
      e.listas.unshift(l);
      avisar('NewList', 'Llegó una lista nueva para revisar', { admin: true });
      return cambia({ id: l.id, estado: l.estado, iaEstado: l.iaEstado });
    }
    if (r1 === 'official') return e.listas.filter(l => l.esOficial && l.estado === 'VALIDADA' && (!query.get('schoolId') || l.schoolId === query.get('schoolId')) && (!query.get('gradeId') || l.gradeId === query.get('gradeId'))).map(listaRespuesta);
    if (r1 === 'from-text' && M === 'POST') {
      const l: Lista = { id: nuevoId('lista'), userId: texto(bj.userId), schoolId: String(bj.schoolId), gradeId: String(bj.gradeId), year: Number(bj.year), estado: 'PENDIENTE_REVISION', esOficial: false, iaEstado: 'LISTO', creada: Date.now(), plantilla: 'primaria',
        items: ((bj.items as Json[]) ?? []).map((x, i) => ({ id: `t${Date.now()}-${i}`, nombreOriginal: String(x.nombreOriginal), cantidad: Number(x.cantidad) || 1, notas: texto(x.notas), niveles: {} })) };
      e.listas.unshift(l);
      return cambia({ id: l.id });
    }
    if (!r1 && M === 'GET') {
      const est = query.get('estado'), uid = query.get('userId'), of = query.get('esOficial');
      return e.listas.filter(l => (!est || l.estado === est) && (!uid || l.userId === uid) && (of === null || String(l.esOficial) === of)).map(listaRespuesta);
    }
    const l = e.listas.find(x => x.id === r1);
    if (!l) throw new ErrorDemo('Lista no encontrada', 404);
    if (!r2 && M === 'GET') return { list: listaRespuesta(l), items: l.items.map(it => itemRespuesta(l, it)) };
    if (!r2 && M === 'DELETE') { e.listas = e.listas.filter(x => x.id !== l.id); return cambia(true); }
    if (r2 === 'status') {
      l.estado = String(bj.status); l.observaciones = texto(bj.observaciones) ?? l.observaciones;
      if (l.estado === 'VALIDADA') { l.fechaValidacion = Date.now(); avisar('ListReady', '¡Tu lista fue aprobada! Ya puedes elegir tu paquete.', { userId: l.userId }); }
      return cambia(true);
    }
    if (r2 === 'plan') {
      const nuevo = nivelDe(texto(bj.plan));
      const aplicar = bj.aplicarATodos ?? nuevo !== l.plan;
      l.plan = nuevo; l.estudianteNombre = texto(bj.estudianteNombre) ?? l.estudianteNombre; l.estudianteGrado = texto(bj.estudianteGrado) ?? l.estudianteGrado;
      if (aplicar) l.items.forEach(it => { delete it.elegido; });
      return cambia(true);
    }
    if (r2 === 'extras') { l.extras = JSON.stringify(cuerpo ?? {}); return cambia(true); }
    if (r2 === 'observaciones') { l.userObservaciones = [l.userObservaciones, texto(bj.observacion)].filter(Boolean).join('\n'); avisar('NewMessage', 'Un cliente dejó una observación en su lista', { admin: true }); return cambia(true); }
    if (r2 === 'reprocess') { l.iaEstado = 'PROCESANDO'; l.creada = Date.now(); l.items = []; return cambia(true); }
    if (r2 === 'auto-match') { l.items.forEach(it => { delete it.elegido; }); return cambia(true); }
    if (r2 === 'items' && !r3 && M === 'POST') {
      const nombre = String(bj.nombreOriginal || '');
      const parecido = (responder.buscar(nombre) as ProductoDemo[])[0];
      const it: ItemGuardado = { id: nuevoId('it'), nombreOriginal: nombre, cantidad: Number(bj.cantidad) || 1, notas: texto(bj.notas), niveles: parecido ? { [parecido.tier]: parecido.id } : {} };
      l.items.push(it);
      return cambia(itemRespuesta(l, it));
    }
    const it = l.items.find(x => x.id === r3);
    if (r2 === 'items' && it && M === 'DELETE') { l.items = l.items.filter(x => x !== it); return cambia(true); }
    if (r2 === 'items' && it && M === 'PUT') {
      if (bj.productId !== undefined) it.elegido = texto(bj.productId) ?? null;
      if (bj.productEconomicoId !== undefined) it.niveles.economico = texto(bj.productEconomicoId);
      if (bj.productMedioId !== undefined) it.niveles.medio = texto(bj.productMedioId);
      if (bj.productPremiumId !== undefined) it.niveles.premium = texto(bj.productPremiumId);
      if (bj.userCustomQuantity !== undefined) it.userCustomQuantity = Number(bj.userCustomQuantity) || null;
      if (bj.userNotas !== undefined) it.userNotas = texto(bj.userNotas);
      if (bj.nombreOriginal !== undefined) it.nombreOriginal = String(bj.nombreOriginal);
      if (bj.cantidad !== undefined) it.cantidad = Number(bj.cantidad) || it.cantidad;
      if (bj.notas !== undefined) it.notas = texto(bj.notas);
      return cambia(true);
    }
  }

  // Pedidos (pago de prueba: nunca se cobra nada)
  if (r0 === 'orders') {
    if (!r1 && M === 'POST') {
      const items = ((bj.items as Json[]) ?? []).map((x, i) => {
        const pr = producto(String(x.productId ?? x.ProductId));
        const unit = Number(x.unitPrice ?? pr?.basePrice ?? 0);
        return { id: `oi-${i}`, productId: String(x.productId), productName: String(x.productName ?? pr?.name ?? 'Producto'), imageUrl: pr?.imageUrl, quantity: Number(x.quantity) || 1, unitPrice: unit, notes: texto(x.notes) };
      });
      if (items.length === 0) throw new ErrorDemo('El carrito está vacío');
      const pago = (bj.pago as Pedido['pago']) ?? { metodo: 'tarjeta', operacion: nuevoId('OP').toUpperCase(), estado: 'APROBADO' };
      const ped: Pedido = {
        id: `RD-${String(1000 + e.pedidos.length + 1)}`, userId: String(bj.userId || yo?.id), supplyListId: texto(bj.supplyListId),
        total: Math.round(items.reduce((s, x) => s + x.unitPrice * x.quantity, 0) * 100) / 100, status: 'RECIBIDO',
        shippingAddress: String(bj.shippingAddress || ''), shippingPhone: String(bj.shippingPhone || ''), contactNotes: texto(bj.contactNotes), createdAt: ahora(), pago, items,
        statusHistory: [{ status: 'RECIBIDO', notes: `Pago de prueba aprobado (${pago.metodo}, operación ${pago.operacion})`, createdAt: ahora() }],
      };
      e.pedidos.unshift(ped);
      avisar('NewOrder', `Nuevo pedido ${ped.id}`, { admin: true });
      return cambia(pedidoRespuesta(ped));
    }
    if (r1 === 'stats') {
      const activos = e.productos.filter(x => x.isActive !== false && x.category !== 'Servicios');
      return {
        totalOrders: e.pedidos.length, totalRevenue: e.pedidos.reduce((s, x) => s + x.total, 0), pendingOrders: e.pedidos.filter(x => x.status === 'RECIBIDO').length,
        totalProducts: activos.length, lowStockCount: activos.filter(x => x.stock <= 5).length, outOfStockCount: activos.filter(x => x.stock === 0).length,
        totalLists: e.listas.length, pendingLists: e.listas.filter(x => x.estado === 'PENDIENTE_REVISION').length, totalUsers: e.usuarios.length,
        lowStockProducts: activos.filter(x => x.stock <= 10).map(x => ({ name: x.name, stock: x.stock, basePrice: x.basePrice })),
      };
    }
    if (r1 === 'user') return e.pedidos.filter(x => x.userId === r2).map(pedidoRespuesta);
    if (!r1 && M === 'GET') return e.pedidos.map(pedidoRespuesta);
    const ped = e.pedidos.find(x => x.id === r1);
    if (!ped) throw new ErrorDemo('Pedido no encontrado', 404);
    if (!r2 && M === 'GET') return pedidoRespuesta(ped);
    if (r2 === 'status') {
      ped.status = String(bj.status); ped.statusHistory.push({ status: ped.status, notes: texto(bj.notes), createdAt: ahora() });
      avisar('OrderUpdate', `Tu pedido ${ped.id} ahora está: ${ped.status.toLowerCase().replace(/_/g, ' ')}`, { userId: ped.userId });
      return cambia(true);
    }
  }

  if (r0 === 'storage') return { totalBytes: 0, files: 0 };

  throw new ErrorDemo(`Ruta de demo no encontrada: ${M} /${p.join('/')}`, 404);
}

// Búsqueda reutilizada al agregar útiles a mano
responder.buscar = (q: string) => {
  const sinTilde = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const palabras = sinTilde(q).split(/\s+/).filter(w => w.length > 2 && !/^\d+$/.test(w)).map(w => w.replace(/e?s$/, ''));
  return cargar().productos.filter(x => x.category !== 'Servicios' && x.isActive !== false && palabras.some(w => sinTilde(x.name).includes(w)));
};
