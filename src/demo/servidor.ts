// "Servidor" de la tienda de demostración. Corre dentro del navegador y guarda todo en
// localStorage, así la página funciona en Vercel sin backend ni base de datos.
// Responde con la misma forma que la API real ({ success, data }).

import {
  productos as catalogo, servicios, variantes as variantesBase, marcas, categorias, secciones, colegios,
  plantillaPrimaria, plantillaPrimaria3, plantillaInicial, plantillaSecundaria, imagenListaEjemplo,
  type Linea, type ProductoDemo, type Tier, type TipoVariante,
} from './catalogo';
import { coincideAlguna } from '@/lib/buscar';
import { aplicarCupon, redondear } from '@/lib/precio';

const CLAVE = 'ready-demo-v1';
const SEG = 1000;
// Tiempos de la demo: la "IA" lee la lista y el administrador la aprueba solo
export const TIEMPO_LECTURA = 6 * SEG;
export const TIEMPO_APROBACION = 14 * SEG;

type Json = Record<string, unknown>;

interface Usuario { id: string; email: string; name: string; role: string; phone?: string; address?: string; documento?: string; createdAt?: string }
interface Grado { id: string; schoolId: string; name: string; year: number }
interface ItemGuardado {
  id: string; nombreOriginal: string; cantidad: number; notas?: string;
  niveles: Partial<Record<Tier, string>>; elegido?: string | null;
  userCustomQuantity?: number | null; userNotas?: string | null;
  agregado?: boolean;
}
interface Lista {
  id: string; userId?: string; schoolId: string; gradeId: string; year: number; imageUrl?: string;
  estado: string; esOficial: boolean; iaEstado: string; iaMensaje?: string; plan?: string | null;
  extras?: string | null; observaciones?: string; userObservaciones?: string;
  estudianteNombre?: string; estudianteGrado?: string; creada: number; fechaValidacion?: number;
  plantilla: Plantilla; items: ItemGuardado[];
  copiaDe?: string;
  /** El admin ya cambió su estado: la demo deja de aprobarla sola */
  tocadaPorAdmin?: boolean;
  fechaInicioRevision?: number;
}
type Plantilla = 'primaria' | 'primaria3' | 'inicial' | 'secundaria';
interface Pedido {
  id: string; userId: string; supplyListId?: string; supplyListIds?: string[]; total: number; status: string;
  shippingAddress: string; shippingPhone: string; contactNotes?: string; createdAt: string;
  pago: { metodo: string; operacion: string; estado: string };
  entrega?: { fecha?: string; franja?: string } | null;
  costoEnvio?: number;
  comprobante?: { tipo: 'boleta' | 'factura'; documento: string; razonSocial?: string } | null;
  cupon?: string | null; descuento?: number;
  items: { id: string; productId: string; productName: string; imageUrl?: string; quantity: number; unitPrice: number; recargo?: number; notes?: string; para?: string | null }[];
  statusHistory: { status: string; notes?: string; createdAt: string }[];
}
interface Ajustes { costoEnvio: number; envioGratisDesde: number | null; whatsapp: string; telefono: string; horarioEntrega: string; diasEntrega: number; zonas?: string }
const AJUSTES_DEMO: Ajustes = { costoEnvio: 8, envioGratisDesde: 150, whatsapp: '51959000111', telefono: '959 000 111', horarioEntrega: 'Lunes a sábado, 9:00 a 18:00', diasEntrega: 2 };
interface Campana { id: string; name: string; slug: string; description?: string; discount_percent: number; discount_fixed: number; start_date?: string | null; end_date?: string | null; is_active: boolean; image_url?: string | null; productIds: string[] }
interface Noticia { id: string; title: string; content?: string; image_url?: string | null; link_url?: string | null; campaign_id?: string | null; campaign_slug?: string | null; display_order?: number; is_active: boolean; created_at: string }
interface Imagen { id: string; imageUrl: string; altText?: string | null; isPrimary: boolean; displayOrder: number }

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
  /** Fotos de cada producto (si falta, se arma con imageUrl) */
  imagenes?: Record<string, Imagen[]>;
  ajustes: Ajustes;
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
      { id: 'u-admin', email: 'admin@ready.pe', name: 'Admin Ready', role: 'ADMIN', phone: '959 000 111', createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
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
      listaOficial('lista-santarosa-3p', 'col-2', '3ro Primaria', 'primaria3'),
      listaOficial('lista-arcoiris-1s', 'col-3', '1ro Secundaria', 'secundaria'),
      listaOficial('lista-sanmartin-4i', 'col-4', 'Inicial - 4 años', 'inicial'),
    ],
    pedidos: [],
    campanas: [{ id: 'camp-1', name: 'Regreso a clases', slug: 'regreso-a-clases', description: '10% en cuadernos y colores', discount_percent: 10, discount_fixed: 0, is_active: true, productIds: ['cu-m', 'cu-dibujos', 'co-m', 'co-p', 'ra-m'] }],
    noticias: [],
    avisos: [],
    ajustes: { ...AJUSTES_DEMO },
  };
}

const PLANTILLAS: Record<Plantilla, Linea[]> = { primaria: plantillaPrimaria, primaria3: plantillaPrimaria3, inicial: plantillaInicial, secundaria: plantillaSecundaria };
const plantillaDe = (gradoNombre: string): Plantilla =>
  /inicial/i.test(gradoNombre) ? 'inicial' : /secundaria/i.test(gradoNombre) ? 'secundaria' : /^(3|4|5|6)/.test(gradoNombre.trim()) ? 'primaria3' : 'primaria';

function crearItems(listaId: string, plantilla: Plantilla): ItemGuardado[] {
  return PLANTILLAS[plantilla].map(([texto, cantidad, niveles, notas], i) => ({ id: `${listaId}-i${i}`, nombreOriginal: texto, cantidad, notas, niveles: { ...niveles } }));
}

// ── Persistencia ──
let estado: Estado | null = null;
function cargar(): Estado {
  if (estado) return estado;
  try {
    const crudo = typeof localStorage !== 'undefined' ? localStorage.getItem(CLAVE) : null;
    if (crudo) {
      const e = JSON.parse(crudo) as Estado;
      if (e.version === 1) { e.ajustes = { ...AJUSTES_DEMO, ...e.ajustes }; return (estado = e); }
    }
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
        libros: l.plantilla === 'primaria' || l.plantilla === 'primaria3' ? [
          { id: 'ia-1', titulo: 'Matemática 2 – Cuaderno de trabajo', editorial: 'Santillana', cantidad: 1, productoId: 'li-mat2', precio: 64.9 },
          { id: 'ia-2', titulo: 'Plan lector: El principito', editorial: 'Norma', cantidad: 1 },
        ] : [],
      });
      cambio = true;
    }
    // Solo se aprueba sola si nadie del equipo la empezó a revisar
    if (l.estado === 'PENDIENTE_REVISION' && !l.tocadaPorAdmin && l.iaEstado === 'LISTO' && edad >= TIEMPO_APROBACION) {
      l.estado = 'VALIDADA';
      l.fechaValidacion = Date.now();
      cambio = true;
      avisar('ListReady', '¡Tu lista fue aprobada! Ya puedes elegir tu paquete.', { userId: l.userId });
    }
  }
  if (cambio) guardar();
}

// ── Armado de respuestas ──
const vigente = (c: Campana) => {
  const hoy = Date.now();
  return c.is_active && (!c.start_date || Date.parse(c.start_date) <= hoy) && (!c.end_date || Date.parse(c.end_date) + 86400000 > hoy);
};
/** Producto con salePrice y campaignSlug de la campaña activa más conveniente que lo incluye. */
function conOferta(p: ProductoDemo): ProductoDemo & { salePrice: number | null; campaignSlug: string | null } {
  let mejor: { precio: number; slug: string } | null = null;
  for (const c of cargar().campanas) {
    if (!vigente(c) || !c.productIds.includes(p.id)) continue;
    const precio = Math.max(0, redondear(p.basePrice * (1 - (Number(c.discount_percent) || 0) / 100) - (Number(c.discount_fixed) || 0)));
    if (precio < p.basePrice && (!mejor || precio < mejor.precio)) mejor = { precio, slug: c.slug };
  }
  return { ...p, salePrice: mejor?.precio ?? null, campaignSlug: mejor?.slug ?? null };
}
const precioVentaDe = (p: ProductoDemo) => conOferta(p).salePrice ?? p.basePrice;
const productoBase = (id?: string | null) => (id ? cargar().productos.find(p => p.id === id) : undefined);
const producto = (id?: string | null) => { const p = productoBase(id); return p ? conOferta(p) : undefined; };
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
    forro: false, etiquetaDibujo: false, caratula: false, agregado: !!it.agregado,
  };
}

function listaRespuesta(l: Lista) {
  const e = cargar();
  const col = e.colegios.find(c => c.id === l.schoolId);
  const gr = e.grados.find(g => g.id === l.gradeId);
  const usuario = e.usuarios.find(u => u.id === l.userId);
  return {
    id: l.id, userId: l.userId ?? null, schoolId: l.schoolId, schoolName: col?.name ?? 'Colegio', gradeId: l.gradeId, gradeName: gr?.name ?? '',
    year: l.year, imageUrl: l.imageUrl, estado: l.estado, esOficial: l.esOficial, copiaDe: l.copiaDe ?? null, observaciones: l.observaciones, userObservaciones: l.userObservaciones,
    submittedBy: usuario?.name, plan: l.plan ?? null, estudianteNombre: l.estudianteNombre, estudianteGrado: l.estudianteGrado,
    iaEstado: l.iaEstado, iaMensaje: l.iaMensaje, extras: l.extras ?? null,
    fechaSubida: new Date(l.creada).toISOString(), fechaValidacion: l.fechaValidacion ? new Date(l.fechaValidacion).toISOString() : null,
    createdAt: new Date(l.creada).toISOString(), totalItems: l.items.length,
    fechaInicioRevision: l.fechaInicioRevision ? new Date(l.fechaInicioRevision).toISOString() : null,
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

// ── Antispam (igual que el backend): campo trampa "sitioWeb" y tiempo de llenado "_t" en ms ──
export const TIEMPO_MINIMO_FORMULARIO = 2500;
function revisarAntiSpam(b: FormData | Json) {
  const leer = (k: string) => (b instanceof FormData ? b.get(k) : (b as Json)[k]);
  const trampa = leer('sitioWeb');
  if (typeof trampa === 'string' && trampa.trim()) throw new ErrorDemo('No pudimos enviar el formulario. Si eres una persona, recarga la página e inténtalo de nuevo.', 400);
  const t = leer('_t');
  // Sin "_t" se acepta (llamadas del panel); con "_t" debe pasar el tiempo mínimo
  if (t !== undefined && t !== null && t !== '' && !(Number(t) >= TIEMPO_MINIMO_FORMULARIO))
    throw new ErrorDemo('Enviaste el formulario demasiado rápido. Espera unos segundos y vuelve a intentarlo.', 429);
}

const sesion = (u: Usuario) => ({ token: `demo.${u.id}`, user: u });

// ── Permisos (igual que el backend: el panel exige ADMIN u OPERATOR) ──
const esEquipo = (u?: Usuario) => u?.role === 'ADMIN' || u?.role === 'OPERATOR';
function exigirEquipo(u?: Usuario) {
  if (!u) throw new ErrorDemo('Inicia sesión para continuar', 401);
  if (!esEquipo(u)) throw new ErrorDemo('No tienes permiso para hacer esto', 403);
}
function exigirAdmin(u?: Usuario) {
  exigirEquipo(u);
  if (u!.role !== 'ADMIN') throw new ErrorDemo('Solo un administrador puede hacer esto', 403);
}

/** Dirección web sin tildes, ñ ni símbolos: "Útiles de Año Nuevo" → "utiles-de-ano-nuevo" */
const aSlug = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
/** Fecha "AAAA-MM-DD" (o ISO) → "AAAA-MM-DD"; vacío → null. Sin zonas horarias para no correr un día. */
const soloFecha = (v: unknown) => { const t = texto(v)?.trim(); return t ? t.slice(0, 10) : null; };
const cambiaSi = <T,>(v: unknown, actual: T): T => (v === undefined || v === null ? actual : v as T);

// ── Fotos de productos ──
function imagenesDe(prod: ProductoDemo): Imagen[] {
  const e = cargar();
  const guardadas = (e.imagenes ??= {})[prod.id];
  if (guardadas) return guardadas;
  return prod.imageUrl ? [{ id: `img-${prod.id}-0`, imageUrl: prod.imageUrl, altText: prod.name, isPrimary: true, displayOrder: 0 }] : [];
}
function guardarImagenes(prod: ProductoDemo, lista: Imagen[]) {
  const e = cargar();
  lista.forEach((im, i) => { im.displayOrder = i; });
  if (lista.length && !lista.some(im => im.isPrimary)) lista[0].isPrimary = true;
  (e.imagenes ??= {})[prod.id] = lista;
  prod.imageUrl = lista.find(im => im.isPrimary)?.imageUrl;
}
/** Para el detalle: la principal primero, con nombres de ambas formas (la tienda lee image_url) */
const imagenesRespuesta = (prod: ProductoDemo) => [...imagenesDe(prod)].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.displayOrder - b.displayOrder)
  .map(im => ({ ...im, image_url: im.imageUrl, alt_text: im.altText ?? null, is_primary: im.isPrimary }));

// ── Campañas y noticias: camelCase (contrato) y los nombres antiguos que aún lee la tienda ──
const campanaRespuesta = ({ productIds, ...c }: Campana) => ({
  ...c, productCount: productIds.length,
  discountPercent: c.discount_percent, discountFixed: c.discount_fixed, startDate: c.start_date ?? null, endDate: c.end_date ?? null,
  isActive: c.is_active, imageUrl: c.image_url ?? null,
});
function noticiaRespuesta(n: Noticia) {
  const c = n.campaign_id ? cargar().campanas.find(x => x.id === n.campaign_id) : n.campaign_slug ? cargar().campanas.find(x => x.slug === n.campaign_slug) : undefined;
  return {
    ...n, campaign_slug: c?.slug ?? null, campaign_name: c?.name ?? null,
    imageUrl: n.image_url ?? null, linkUrl: n.link_url ?? null, campaignId: c?.id ?? null, campaignName: c?.name ?? null,
    displayOrder: n.display_order ?? 0, isActive: n.is_active, createdAt: n.created_at,
  };
}

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
      if (!u) { u = { id: nuevoId('u'), email, name: email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), role: email.startsWith('admin') ? 'ADMIN' : email.startsWith('operador') ? 'OPERATOR' : 'USER', createdAt: ahora() }; e.usuarios.push(u); guardar(); }
      return sesion(u);
    }
    if (r1 === 'register' && M === 'POST') {
      revisarAntiSpam(b);
      const email = String(bj.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new ErrorDemo('Escribe un correo válido.');
      if (String(bj.password ?? '').length < 8) throw new ErrorDemo('La contraseña debe tener al menos 8 caracteres.');
      if (!String(bj.name ?? '').trim()) throw new ErrorDemo('Escribe tu nombre.');
      if (e.usuarios.some(x => x.email.toLowerCase() === email)) throw new ErrorDemo('Ese correo ya tiene cuenta. Inicia sesión.');
      const u: Usuario = { id: nuevoId('u'), email, name: String(bj.name || 'Cliente').trim().slice(0, 80), role: 'USER', createdAt: ahora() };
      e.usuarios.push(u);
      return cambia(sesion(u));
    }
    if (r1 === 'me') {
      if (!yo) throw new ErrorDemo('Sesión vencida', 401);
      if (M === 'PUT') {
        // Perfil del cliente: nombre, celular, dirección y DNI/RUC (null o ausente = no cambiar)
        const nombre = texto(bj.name)?.trim();
        if (nombre) yo.name = nombre;
        for (const k of ['phone', 'address', 'documento'] as const) if (bj[k] !== undefined && bj[k] !== null) yo[k] = String(bj[k]).trim();
        return cambia(yo);
      }
      return yo;
    }
    if (r1 === 'users' && !r2) { exigirAdmin(yo); return e.usuarios.map(u => ({ ...u, createdAt: u.createdAt ?? null })); }
    if (r1 === 'users' && r3 === 'role') {
      exigirAdmin(yo);
      const u = e.usuarios.find(x => x.id === r2);
      if (!u) throw new ErrorDemo('Usuario no encontrado', 404);
      const rol = String(bj.role);
      if (!['USER', 'OPERATOR', 'ADMIN'].includes(rol)) throw new ErrorDemo('Rol no válido');
      if (u.id === yo!.id && rol !== 'ADMIN') throw new ErrorDemo('No puedes quitarte tu propio rol de administrador', 409);
      u.role = rol; return cambia(true);
    }
  }

  // Colegios y grados
  if (r0 === 'schools') {
    const col = r1 ? e.colegios.find(c => c.id === r1) : undefined;
    if (!r1 && M === 'GET') return e.colegios;
    // El cliente, al subir su lista, crea (o reutiliza) el grado de su colegio: eso sigue abierto a cualquier sesión
    if (M !== 'GET' && !(r2 === 'grades' && !r3 && M === 'POST')) exigirEquipo(yo);
    if (r2 === 'grades' && !r3 && M === 'POST' && !yo) throw new ErrorDemo('Inicia sesión para continuar', 401);
    if (!r1 && M === 'POST') { const c = { id: nuevoId('col'), name: String(bj.name), address: texto(bj.address) }; e.colegios.push(c); e.seccionesColegio[c.id] = e.secciones.map(s => s.id); return cambia(c); }
    if (r1 && !r2 && M === 'GET') return col ?? null;
    if (r1 && !r2 && M === 'PUT') { if (col) Object.assign(col, { name: bj.name ?? col.name, address: bj.address ?? col.address }); return cambia(true); }
    if (r1 && !r2 && M === 'DELETE') {
      const n = e.listas.filter(l => l.schoolId === r1).length;
      if (n) throw new ErrorDemo(`No se puede eliminar: el colegio tiene ${n} ${n === 1 ? 'lista' : 'listas'}. Elimina o mueve esas listas primero.`, 409);
      e.colegios = e.colegios.filter(c => c.id !== r1); e.grados = e.grados.filter(g => g.schoolId !== r1); return cambia(true);
    }
    if (r2 === 'grades' && M === 'GET') return e.grados.filter(g => g.schoolId === r1);
    if (r2 === 'grades' && M === 'POST') {
      const name = String(bj.name), year = Number(bj.year) || new Date().getFullYear();
      let g = e.grados.find(x => x.schoolId === r1 && x.name === name && x.year === year);
      if (!g) { g = { id: nuevoId('gr'), schoolId: r1, name, year }; e.grados.push(g); }
      return cambia(g);
    }
    if (r2 === 'grades' && r3 && M === 'DELETE') {
      const n = e.listas.filter(l => l.gradeId === r3).length;
      if (n) throw new ErrorDemo(`No se puede eliminar: el grado tiene ${n} ${n === 1 ? 'lista' : 'listas'}.`, 409);
      e.grados = e.grados.filter(g => g.id !== r3); return cambia(true);
    }
    if (r2 === 'sections' && M === 'GET') { const ids = e.seccionesColegio[r1] ?? []; return e.secciones.filter(s => ids.includes(s.id)); }
    if (r2 === 'sections' && M === 'PUT') { e.seccionesColegio[r1] = (bj.sectionIds as string[]) ?? []; return cambia(true); }
  }
  if (r0 === 'sections') {
    if (M === 'GET') return [...e.secciones].sort((a, b) => a.sortOrder - b.sortOrder);
    exigirEquipo(yo);
    if (M === 'PUT') {
      const s = e.secciones.find(x => x.id === r1);
      if (!s) throw new ErrorDemo('Grado no encontrado', 404);
      const nombre = String(bj.name ?? s.name).trim();
      if (!nombre) throw new ErrorDemo('Escribe el nombre del grado');
      const anterior = s.name;
      Object.assign(s, { name: nombre, groupName: String(bj.groupName ?? s.groupName), sortOrder: Number(bj.sortOrder ?? s.sortOrder) });
      // Los grados de los colegios con el nombre anterior también se renombran
      if (anterior !== nombre) e.grados.forEach(g => { if (g.name === anterior) g.name = nombre; });
      return cambia(s);
    }
    if (M === 'POST') { const s = { id: nuevoId('sec'), groupName: String(bj.groupName), name: String(bj.name), sortOrder: Number(bj.sortOrder) || 0 }; e.secciones.push(s); return cambia(s); }
    if (M === 'DELETE') { e.secciones = e.secciones.filter(s => s.id !== r1); return cambia(true); }
  }
  if (r0 === 'categories') {
    if (M === 'GET') return e.categorias;
    exigirEquipo(yo);
    const nombre = String(bj.name ?? '').trim();
    if (M === 'POST') {
      if (!nombre) throw new ErrorDemo('Escribe el nombre de la categoría');
      if (e.categorias.some(c => c.name.toLowerCase() === nombre.toLowerCase())) throw new ErrorDemo('Ya existe una categoría con ese nombre', 409);
      const c = { id: nuevoId('cat'), name: nombre }; e.categorias.push(c); return cambia(c);
    }
    const cat = e.categorias.find(c => c.id === r1);
    if (!cat) throw new ErrorDemo('Categoría no encontrada', 404);
    if (M === 'PUT') {
      if (!nombre) throw new ErrorDemo('Escribe el nombre de la categoría');
      if (e.categorias.some(c => c.id !== cat.id && c.name.toLowerCase() === nombre.toLowerCase())) throw new ErrorDemo('Ya existe una categoría con ese nombre', 409);
      e.productos.forEach(x => { if (x.category === cat.name) x.category = nombre; });
      cat.name = nombre; return cambia(cat);
    }
    if (M === 'DELETE') {
      const n = e.productos.filter(x => x.category === cat.name).length;
      if (n) throw new ErrorDemo(`No se puede eliminar "${cat.name}": la usan ${n} ${n === 1 ? 'producto' : 'productos'}. Cámbialos de categoría primero.`, 409);
      e.categorias = e.categorias.filter(c => c.id !== r1); return cambia(true);
    }
  }
  if (r0 === 'brands') {
    if (M === 'GET') return e.marcas;
    exigirEquipo(yo);
    if (M === 'POST' && !r1) {
      const nombre = String(bj.name ?? '').trim();
      if (!nombre) throw new ErrorDemo('Escribe el nombre de la marca');
      if (e.marcas.some(x => x.name.toLowerCase() === nombre.toLowerCase())) throw new ErrorDemo('Ya existe una marca con ese nombre', 409);
      const m = { id: nuevoId('b'), name: nombre, logoUrl: texto(bj.logoUrl) ?? null }; e.marcas.push(m); return cambia(m);
    }
    const m = e.marcas.find(x => x.id === r1);
    if (!m) throw new ErrorDemo('Marca no encontrada', 404);
    if (M === 'PUT' && !r2) {
      const nombre = String(bj.name ?? m.name).trim();
      if (!nombre) throw new ErrorDemo('Escribe el nombre de la marca');
      if (nombre !== m.name) e.productos.forEach(x => { if (x.brand === m.name) x.brand = nombre; });
      m.name = nombre; if (bj.logoUrl !== undefined && bj.logoUrl !== null) m.logoUrl = texto(bj.logoUrl) || null;
      return cambia(m);
    }
    if (M === 'DELETE' && !r2) { e.marcas = e.marcas.filter(x => x.id !== m.id); return cambia(true); }
    if (r2 === 'logo' && b instanceof FormData) { const f = b.get('file') ?? b.get('logo'); if (f instanceof File) m.logoUrl = await leerArchivo(f); return cambia(m); }
  }

  // Campañas y noticias
  if (r0 === 'campaigns') {
    const sinProductos = campanaRespuesta;
    if (!r1 && M === 'GET') return e.campanas.filter(c => query.get('activeOnly') !== 'true' || c.is_active).map(sinProductos);
    const c = r1 ? e.campanas.find(x => x.id === r1 || x.slug === r1) : undefined;
    if (r1 && !r2 && M === 'GET') return c ? { ...sinProductos(c), products: c.productIds.map(id => producto(id)).filter(Boolean) } : null;
    exigirEquipo(yo);
    const unica = (slug: string, id?: string) => { if (e.campanas.some(x => x.slug === slug && x.id !== id)) throw new ErrorDemo('Ya hay una campaña con esa dirección web', 409); return slug; };
    if (!r1 && M === 'POST') {
      const name = String(bj.name ?? '').trim();
      if (!name) throw new ErrorDemo('Escribe el nombre de la campaña');
      const nueva: Campana = {
        id: nuevoId('camp'), name, slug: unica(aSlug(texto(bj.slug) || name)), description: texto(bj.description),
        discount_percent: Number(bj.discountPercent) || 0, discount_fixed: Number(bj.discountFixed) || 0,
        start_date: soloFecha(bj.startDate), end_date: soloFecha(bj.endDate), is_active: bj.isActive === undefined ? true : !!bj.isActive,
        image_url: texto(bj.imageUrl) ?? null, productIds: [],
      };
      e.campanas.push(nueva); return cambia(sinProductos(nueva));
    }
    if (!c) throw new ErrorDemo('Campaña no encontrada', 404);
    if (!r2 && M === 'PUT') {
      Object.assign(c, {
        name: cambiaSi(bj.name, c.name), slug: bj.slug ? unica(aSlug(String(bj.slug)), c.id) : c.slug, description: cambiaSi(bj.description, c.description),
        discount_percent: Number(cambiaSi(bj.discountPercent, c.discount_percent)), discount_fixed: Number(cambiaSi(bj.discountFixed, c.discount_fixed)),
        is_active: bj.isActive === undefined || bj.isActive === null ? c.is_active : !!bj.isActive,
        image_url: bj.imageUrl === undefined ? c.image_url : (texto(bj.imageUrl) || null),
      });
      // Las fechas sí se pueden borrar (null = sin fecha)
      if (bj.startDate !== undefined) c.start_date = soloFecha(bj.startDate);
      if (bj.endDate !== undefined) c.end_date = soloFecha(bj.endDate);
      return cambia(sinProductos(c));
    }
    if (!r2 && M === 'DELETE') { e.campanas = e.campanas.filter(x => x.id !== c.id); e.noticias.forEach(n => { if (n.campaign_id === c.id) n.campaign_id = null; }); return cambia(true); }
    if (r2 === 'products' && M === 'POST') {
      const ids = (Array.isArray(bj.productIds) ? bj.productIds : bj.productId ? [bj.productId] : []).map(String).filter(id => producto(id));
      if (!ids.length) throw new ErrorDemo('Elige al menos un producto');
      ids.forEach(id => { if (!c.productIds.includes(id)) c.productIds.push(id); });
      return cambia(true);
    }
    if (r2 === 'products' && M === 'DELETE') { c.productIds = c.productIds.filter(x => x !== r3); return cambia(true); }
    if (r2 === 'image' && b instanceof FormData) { const f = b.get('file') ?? b.get('image'); if (f instanceof File) c.image_url = await leerArchivo(f); return cambia(sinProductos(c)); }
  }
  if (r0 === 'news') {
    if (!r1 && M === 'GET') return e.noticias.filter(n => query.get('activeOnly') !== 'true' || n.is_active)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)).map(noticiaRespuesta);
    exigirEquipo(yo);
    const campanaDe = (v: unknown) => { const id = texto(v); return id && e.campanas.some(c => c.id === id) ? id : null; };
    if (!r1 && M === 'POST') {
      const title = String(bj.title ?? '').trim();
      if (!title) throw new ErrorDemo('Escribe el título de la noticia');
      const n: Noticia = {
        id: nuevoId('n'), title, content: texto(bj.content), image_url: texto(bj.imageUrl) || null, link_url: texto(bj.linkUrl) || null,
        campaign_id: campanaDe(bj.campaignId), display_order: Number(bj.displayOrder) || 0, is_active: bj.isActive === undefined ? true : !!bj.isActive, created_at: ahora(),
      };
      e.noticias.push(n); return cambia(noticiaRespuesta(n));
    }
    const n = e.noticias.find(x => x.id === r1);
    if (!n) throw new ErrorDemo('Noticia no encontrada', 404);
    if (!r2 && M === 'PUT') {
      Object.assign(n, {
        title: cambiaSi(bj.title, n.title), content: cambiaSi(bj.content, n.content),
        image_url: bj.imageUrl === undefined ? n.image_url : (texto(bj.imageUrl) || null),
        link_url: bj.linkUrl === undefined ? n.link_url : (texto(bj.linkUrl) || null),
        campaign_id: bj.campaignId === undefined ? n.campaign_id : campanaDe(bj.campaignId),
        display_order: Number(cambiaSi(bj.displayOrder, n.display_order ?? 0)),
        is_active: bj.isActive === undefined || bj.isActive === null ? n.is_active : !!bj.isActive,
      });
      if (bj.campaignId !== undefined) n.campaign_slug = null;
      return cambia(noticiaRespuesta(n));
    }
    if (!r2 && M === 'DELETE') { e.noticias = e.noticias.filter(x => x.id !== r1); return cambia(true); }
    if (r2 === 'image' && b instanceof FormData) { const f = b.get('file') ?? b.get('image'); if (f instanceof File) n.image_url = await leerArchivo(f); return cambia(noticiaRespuesta(n)); }
  }

  // Productos y variantes
  if (r0 === 'products') {
    const activos = e.productos.filter(x => x.isActive !== false);
    if (!r1 && M === 'GET') {
      const cat = query.get('category'), marca = query.get('brand');
      // El panel pide también los inactivos y los Servicios
      if (query.get('includeInactive') === 'true' && esEquipo(yo)) return e.productos.filter(x => (!cat || x.category === cat) && (!marca || x.brand === marca));
      let res = activos.filter(x => (cat ? x.category === cat : x.category !== 'Servicios') && (!marca || x.brand === marca));
      const lim = Number(query.get('limit')); if (lim > 0) res = res.slice(0, lim);
      return res.map(conOferta);
    }
    if (r1 === 'search') {
      // Sin importar tildes ni plurales: "lapices" encuentra "Lápiz", "tijeras" encuentra "Tijera"
      const q = query.get('q') || '';
      const cat = query.get('category');
      return activos.filter(x => x.category !== 'Servicios' && (!cat || x.category === cat) && (!q.trim() || coincideAlguna(`${x.name} ${x.brand} ${x.category}`, q))).map(conOferta);
    }
    if (r1 === 'categories') return Array.from(new Set(activos.filter(x => x.category !== 'Servicios').map(x => x.category)));
    const nivel = (v: unknown): Tier | undefined => (v === 'economico' || v === 'medio' || v === 'premium' ? v : undefined);
    if (!r1 && M === 'POST') {
      exigirEquipo(yo);
      const name = String(bj.name ?? '').trim();
      if (!name) throw new ErrorDemo('Escribe el nombre del producto');
      const sku = String(bj.sku || nuevoId('RD').toUpperCase());
      if (e.productos.some(x => x.sku === sku)) throw new ErrorDemo('Ya hay un producto con ese código', 409);
      const x: ProductoDemo = { id: nuevoId('p'), name, description: texto(bj.description), category: String(bj.category || 'Útiles'), brand: texto(bj.brand), sku, basePrice: Number(bj.basePrice) || 0, imageUrl: texto(bj.imageUrl), stock: Number(bj.stock) || 0, rating: 4.5, tier: nivel(bj.tier) ?? 'medio', isActive: bj.isActive === undefined ? true : !!bj.isActive };
      e.productos.push(x); return cambia(x);
    }
    const prod = e.productos.find(x => x.id === r1);
    if (r1 && !r2 && M === 'GET') { if (!prod) throw new ErrorDemo('Producto no encontrado', 404); return { ...conOferta(prod), variants: e.variantes[prod.id] ?? [], images: imagenesRespuesta(prod) }; }
    if (r1 && M !== 'GET') { exigirEquipo(yo); if (!prod) throw new ErrorDemo('Producto no encontrado', 404); }
    if (r1 && !r2 && M === 'PUT' && prod) {
      // Solo los campos del contrato; null o ausente = no cambiar
      const campos = ['name', 'description', 'category', 'brand', 'sku', 'imageUrl', 'attributes'] as const;
      const x = prod as ProductoDemo & { attributes?: string };
      for (const k of campos) if (bj[k] !== undefined && bj[k] !== null) (x as unknown as Json)[k] = String(bj[k]);
      if (bj.basePrice !== undefined && bj.basePrice !== null) x.basePrice = Number(bj.basePrice) || 0;
      if (bj.stock !== undefined && bj.stock !== null) x.stock = Math.max(0, Number(bj.stock) || 0);
      if (nivel(bj.tier)) x.tier = nivel(bj.tier)!;
      if (bj.isActive !== undefined && bj.isActive !== null) x.isActive = !!bj.isActive;
      return cambia(prod);
    }
    if (r1 && !r2 && M === 'DELETE' && prod) { prod.isActive = false; return cambia(true); }
    if (r2 === 'images' && prod) {
      const lista = imagenesDe(prod).map(im => ({ ...im }));
      if (!r3 && M === 'GET') return lista;
      if (!r3 && M === 'POST' && b instanceof FormData) {
        const f = b.get('file') ?? b.get('image');
        if (!(f instanceof File)) throw new ErrorDemo('Elige una imagen');
        const nueva: Imagen = { id: nuevoId('img'), imageUrl: await leerArchivo(f), altText: prod.name, isPrimary: lista.length === 0 || b.get('isPrimary') === 'true', displayOrder: lista.length };
        if (nueva.isPrimary) lista.forEach(im => { im.isPrimary = false; });
        lista.push(nueva); guardarImagenes(prod, lista);
        return cambia(nueva);
      }
      const im = lista.find(x => x.id === r3);
      if (!im) throw new ErrorDemo('Imagen no encontrada', 404);
      if (M === 'DELETE') { guardarImagenes(prod, lista.filter(x => x.id !== im.id)); return cambia(true); }
      if (r4 === 'primary' && M === 'PUT') { lista.forEach(x => { x.isPrimary = x.id === im.id; }); guardarImagenes(prod, lista); return cambia(true); }
    }
    if (r2 === 'variants') {
      const tipos = (e.variantes[r1] ??= []);
      if (!r3 && M === 'GET') return tipos;
      if (r3 === 'types' && !r4 && M === 'POST') { const t = { id: nuevoId('vt'), name: String(bj.name), values: [] }; tipos.push(t); return cambia(t); }
      if (r3 === 'types' && r4 && M === 'POST') { const t = tipos.find(x => x.id === r4); const v = { id: nuevoId('vv'), value: String(bj.value), color_hex: texto(bj.colorHex) ?? null, image_url: null, price_modifier: Number(bj.priceModifier) || 0, stock: Number(bj.stock) || 0, is_active: true }; t?.values.push(v); return cambia(v); }
      if (r3 === 'types' && r4 && M === 'DELETE') { e.variantes[r1] = tipos.filter(x => x.id !== r4); return cambia(true); }
      if (r3 === 'values' && M === 'DELETE') { tipos.forEach(t => { t.values = t.values.filter(v => v.id !== r4); }); return cambia(true); }
      if (r3 === 'values' && M === 'PUT') {
        const v = tipos.flatMap(t => t.values).find(x => x.id === r4);
        if (!v) throw new ErrorDemo('Opción no encontrada', 404);
        const valor = String(cambiaSi(bj.value, v.value)).trim();
        if (!valor) throw new ErrorDemo('Escribe el nombre de la opción');
        Object.assign(v, {
          value: valor, stock: Math.max(0, Number(cambiaSi(bj.stock, v.stock)) || 0), price_modifier: Number(cambiaSi(bj.priceModifier, v.price_modifier)) || 0,
          color_hex: bj.colorHex === undefined ? v.color_hex : (texto(bj.colorHex) || null),
          is_active: bj.isActive === undefined || bj.isActive === null ? v.is_active : !!bj.isActive,
        });
        return cambia(true);
      }
      if (r3 === 'values' && p[5] === 'image' && b instanceof FormData) { const f = b.get('file') ?? b.get('image'); if (f instanceof File) { const url = await leerArchivo(f); tipos.forEach(t => t.values.forEach(v => { if (v.id === r4) v.image_url = url; })); } return cambia(true); }
    }
  }

  // Listas
  if (r0 === 'lists') {
    if (r1 === 'upload' && M === 'POST' && b instanceof FormData) {
      revisarAntiSpam(b);
      const archivo = b.getAll('files').find(f => f instanceof File) as File | undefined;
      const gradeId = String(b.get('gradeId'));
      const gradoNombre = e.grados.find(g => g.id === gradeId)?.name ?? '';
      const l: Lista = {
        id: nuevoId('lista'), userId: texto(b.get('userId')) || yo?.id, schoolId: String(b.get('schoolId')), gradeId, year: Number(b.get('year')),
        imageUrl: archivo && archivo.type.startsWith('image/') ? await leerArchivo(archivo) : imagenListaEjemplo,
        estado: 'PENDIENTE_REVISION', esOficial: false, iaEstado: 'PROCESANDO', creada: Date.now(),
        plantilla: plantillaDe(gradoNombre), items: [],
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
    if (!r2 && M === 'DELETE') { exigirEquipo(yo); e.listas = e.listas.filter(x => x.id !== l.id); return cambia(true); }
    if (!r2 && M === 'PUT') {
      // (admin) Corregir colegio, grado o año
      exigirEquipo(yo);
      const schoolId = texto(bj.schoolId) ?? l.schoolId, gradeId = texto(bj.gradeId) ?? l.gradeId;
      if (!e.colegios.some(c => c.id === schoolId)) throw new ErrorDemo('Colegio no encontrado', 404);
      const g = e.grados.find(x => x.id === gradeId);
      if (!g || g.schoolId !== schoolId) throw new ErrorDemo('Elige un grado de ese colegio');
      const year = bj.year !== undefined && bj.year !== null ? Number(bj.year) : l.year;
      if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new ErrorDemo('Año no válido');
      Object.assign(l, { schoolId, gradeId, year });
      return cambia(listaRespuesta(l));
    }
    if (r2 === 'status') {
      exigirEquipo(yo);
      const estados = ['PENDIENTE_REVISION', 'EN_REVISION', 'OBSERVADA', 'RECHAZADA', 'VALIDADA'];
      const nuevo = String(bj.status);
      if (!estados.includes(nuevo)) throw new ErrorDemo('Estado no válido');
      const obs = texto(bj.observaciones)?.trim();
      if ((nuevo === 'OBSERVADA' || nuevo === 'RECHAZADA') && !obs) throw new ErrorDemo('Escribe el motivo para el cliente');
      l.tocadaPorAdmin = true;
      if (nuevo === 'EN_REVISION' && !l.fechaInicioRevision) l.fechaInicioRevision = Date.now();
      l.estado = nuevo;
      if (obs !== undefined) l.observaciones = obs || undefined;
      if (bj.esOficial !== undefined && bj.esOficial !== null) l.esOficial = !!bj.esOficial;
      if (nuevo === 'VALIDADA') { l.fechaValidacion = Date.now(); avisar('ListReady', '¡Tu lista fue aprobada! Ya puedes elegir tu paquete.', { userId: l.userId }); }
      else if (nuevo === 'OBSERVADA') avisar('ListObserved', `Revisamos tu lista: ${obs}`, { userId: l.userId });
      else if (nuevo === 'RECHAZADA') avisar('ListRejected', `No pudimos aprobar tu lista: ${obs}`, { userId: l.userId });
      return cambia(true);
    }
    if (r2 === 'plan') {
      const nuevo = nivelDe(texto(bj.plan));
      const aplicar = bj.aplicarATodos ?? nuevo !== l.plan;
      l.plan = nuevo; l.estudianteNombre = texto(bj.estudianteNombre) ?? l.estudianteNombre; l.estudianteGrado = texto(bj.estudianteGrado) ?? l.estudianteGrado;
      if (aplicar) l.items.forEach(it => { if (!it.agregado) delete it.elegido; });
      return cambia(true);
    }
    if (r2 === 'extras') { l.extras = JSON.stringify(cuerpo ?? {}); return cambia(true); }
    if (r2 === 'observaciones') {
      revisarAntiSpam(b);
      const texto1 = texto(bj.observacion)?.trim();
      if (!texto1) throw new ErrorDemo('Escribe tu observación');
      if (texto1.length > 500) throw new ErrorDemo('La observación puede tener hasta 500 caracteres');
      l.userObservaciones = [l.userObservaciones, texto1].filter(Boolean).join('\n');
      avisar('NewMessage', 'Un cliente dejó una observación en su lista', { admin: true }); return cambia(true); }
    if (r2 === 'reprocess') { l.iaEstado = 'PROCESANDO'; l.creada = Date.now(); l.items = []; return cambia(true); }
    if (r2 === 'auto-match') { l.items.forEach(it => { delete it.elegido; }); return cambia(true); }
    if (r2 === 'copia' && M === 'POST') {
      const uid = texto(bj.userId) ?? yo?.id;
      // nueva=true: otra copia aunque ya exista una (mellizos, hermanos del mismo grado)
      const previa = uid && !bj.nueva ? e.listas.find(x => x.copiaDe === l.id && x.userId === uid) : undefined;
      if (previa) return { id: previa.id, existente: true };
      const nueva: Lista = {
        ...JSON.parse(JSON.stringify(l)) as Lista, id: nuevoId('lista'), userId: uid, esOficial: false, estado: 'VALIDADA',
        creada: Date.now(), fechaValidacion: Date.now(), copiaDe: l.id, plan: null, userObservaciones: undefined,
      };
      nueva.items = l.items.map((it, i) => ({ ...JSON.parse(JSON.stringify(it)) as ItemGuardado, id: `${nueva.id}-i${i}` }));
      if (bj.plan) { nueva.plan = nivelDe(texto(bj.plan)); nueva.items.forEach(it => { if (!it.agregado) delete it.elegido; }); }
      e.listas.unshift(nueva);
      return cambia({ id: nueva.id, existente: false });
    }
    if (r2 === 'items' && !r3 && M === 'POST') {
      revisarAntiSpam(b);
      const nombre = String(bj.nombreOriginal || '');
      if (!nombre.trim()) throw new ErrorDemo('Escribe el nombre del útil');
      const elegido = bj.productId ? producto(String(bj.productId)) : undefined;
      const porCliente = !!bj.porCliente || !!elegido;
      // Si lo agrega el admin al revisar, se busca un producto parecido como hace la lectura
      const parecido = porCliente ? undefined : responder.buscar(nombre)[0];
      const it: ItemGuardado = {
        id: nuevoId('it'), nombreOriginal: nombre.trim(), cantidad: Number(bj.cantidad) || 1, notas: texto(bj.notas),
        niveles: parecido ? { [parecido.tier]: parecido.id } : {}, agregado: porCliente, ...(porCliente ? { elegido: elegido?.id ?? null } : {}),
      };
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
    const esAdmin = yo?.role === 'ADMIN' || yo?.role === 'OPERATOR';
    if (!r1 && M === 'POST') {
      revisarAntiSpam(b);
      if (!yo) throw new ErrorDemo('Inicia sesión para comprar', 401);
      // El precio lo pone la tienda: precio de venta (con campaña) + recargo del diseño o color
      const items = ((bj.items as Json[]) ?? []).map((x, i) => {
        const pr = productoBase(String(x.productId ?? x.ProductId));
        const base = pr ? precioVentaDe(pr) : Number(x.unitPrice) || 0;
        const recargo = x.recargo !== undefined ? Math.max(0, Number(x.recargo) || 0) : Math.max(0, redondear((Number(x.unitPrice) || base) - base));
        return {
          id: `oi-${i}`, productId: String(x.productId), productName: String(pr?.name ?? x.productName ?? 'Producto'), imageUrl: pr?.imageUrl,
          quantity: Math.max(1, Number(x.quantity) || 1), unitPrice: redondear(base + recargo), recargo: recargo || undefined,
          notes: texto(x.notes), para: texto(x.para) ?? null,
        };
      });
      if (items.length === 0) throw new ErrorDemo('El carrito está vacío');
      for (const it of items) {
        const pr = productoBase(it.productId);
        if (pr && pr.category !== 'Servicios' && pr.stock < it.quantity) throw new ErrorDemo(`Solo quedan ${pr.stock} de ${pr.name}`, 409);
      }
      const subtotal = redondear(items.reduce((s, x) => s + x.unitPrice * x.quantity, 0));
      const cupon = aplicarCupon(texto(bj.cupon), subtotal);
      const a = e.ajustes;
      const costoEnvio = a.envioGratisDesde != null && subtotal >= a.envioGratisDesde ? 0 : a.costoEnvio;
      const pago = (bj.pago as Pedido['pago']) ?? { metodo: 'tarjeta', operacion: nuevoId('OP').toUpperCase(), estado: 'APROBADO' };
      const listas = Array.from(new Set([...((bj.supplyListIds as string[]) ?? []), texto(bj.supplyListId)].filter(Boolean) as string[]));
      const comp = bj.comprobante as Pedido['comprobante'];
      const ped: Pedido = {
        id: `RD-${String(1000 + e.pedidos.length + 1)}`, userId: yo.id, supplyListId: listas[0], supplyListIds: listas,
        total: redondear(subtotal - (cupon?.descuento ?? 0) + costoEnvio), status: 'RECIBIDO',
        shippingAddress: String(bj.shippingAddress || ''), shippingPhone: String(bj.shippingPhone || ''), contactNotes: texto(bj.contactNotes), createdAt: ahora(), pago, items,
        entrega: (bj.entrega as Pedido['entrega']) ?? null, costoEnvio,
        comprobante: comp?.tipo ? { tipo: comp.tipo === 'factura' ? 'factura' : 'boleta', documento: String(comp.documento ?? ''), ...(comp.razonSocial ? { razonSocial: String(comp.razonSocial) } : {}) } : null,
        cupon: cupon?.codigo ?? null, descuento: cupon?.descuento ?? 0,
        statusHistory: [{ status: 'RECIBIDO', notes: `Pago de prueba aprobado (${pago.metodo}, operación ${pago.operacion})`, createdAt: ahora() }],
      };
      // Se descuenta el stock (vuelve si se cancela)
      for (const it of items) { const pr = productoBase(it.productId); if (pr && pr.category !== 'Servicios') pr.stock -= it.quantity; }
      e.pedidos.unshift(ped);
      avisar('NewOrder', `Nuevo pedido ${ped.id}`, { admin: true });
      return cambia(pedidoRespuesta(ped));
    }
    if (r1 === 'stats') {
      exigirEquipo(yo);
      const activos = e.productos.filter(x => x.isActive !== false && x.category !== 'Servicios');
      const validos = e.pedidos.filter(x => x.status !== 'CANCELADO');
      return {
        totalOrders: e.pedidos.length, totalRevenue: validos.reduce((s, x) => s + x.total, 0), pendingOrders: e.pedidos.filter(x => x.status === 'RECIBIDO').length,
        totalProducts: activos.length, lowStockCount: activos.filter(x => x.stock <= 5).length, outOfStockCount: activos.filter(x => x.stock === 0).length,
        totalLists: e.listas.length, pendingLists: e.listas.filter(x => x.estado === 'PENDIENTE_REVISION').length, totalUsers: e.usuarios.length,
        lowStockProducts: activos.filter(x => x.stock <= 10).map(x => ({ name: x.name, stock: x.stock, basePrice: x.basePrice })),
      };
    }
    if (r1 === 'user') {
      if (!yo) throw new ErrorDemo('Inicia sesión', 401);
      if (yo.id !== r2 && !esAdmin) throw new ErrorDemo('No tienes acceso a estos pedidos', 403);
      return e.pedidos.filter(x => x.userId === r2).map(pedidoRespuesta);
    }
    if (!r1 && M === 'GET') { exigirEquipo(yo); return e.pedidos.map(pedidoRespuesta); }
    const ped = e.pedidos.find(x => x.id === r1);
    if (!ped) throw new ErrorDemo('Pedido no encontrado', 404);
    if (yo && yo.id !== ped.userId && !esAdmin) throw new ErrorDemo('Pedido no encontrado', 404);
    if (!r2 && M === 'GET') return pedidoRespuesta(ped);
    if (r2 === 'cancel' && M === 'PUT') {
      if (!yo || (yo.id !== ped.userId && !esAdmin)) throw new ErrorDemo('No puedes cancelar este pedido', 403);
      if (ped.status !== 'RECIBIDO') throw new ErrorDemo('Este pedido ya se está preparando: escríbenos por WhatsApp para cambiarlo.', 409);
      ped.status = 'CANCELADO';
      ped.statusHistory.push({ status: 'CANCELADO', notes: texto(bj.motivo) ?? 'Cancelado por el cliente', createdAt: ahora() });
      for (const it of ped.items) { const pr = productoBase(it.productId); if (pr && pr.category !== 'Servicios') pr.stock += it.quantity; }
      avisar('NewMessage', `El cliente canceló el pedido ${ped.id}`, { admin: true });
      return cambia(pedidoRespuesta(ped));
    }
    if (r2 === 'status') {
      // En la demo el cliente también puede "simular el siguiente paso" de su propio pedido
      if (!yo || (yo.id !== ped.userId && !esEquipo(yo))) throw new ErrorDemo('No tienes permiso para hacer esto', 403);
      const estados = ['RECIBIDO', 'EN_PREPARACION', 'ARMADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'];
      if (!estados.includes(String(bj.status))) throw new ErrorDemo('Estado no válido');
      const antes = ped.status;
      ped.status = String(bj.status); ped.statusHistory.push({ status: ped.status, notes: texto(bj.notes), createdAt: ahora() });
      if (ped.status === 'CANCELADO' && antes !== 'CANCELADO') for (const it of ped.items) { const pr = productoBase(it.productId); if (pr && pr.category !== 'Servicios') pr.stock += it.quantity; }
      avisar('OrderUpdate', `Tu pedido ${ped.id} ahora está: ${ped.status.toLowerCase().replace(/_/g, ' ')}`, { userId: ped.userId });
      return cambia(true);
    }
  }

  if (r0 === 'storage') return { totalBytes: 0, files: 0 };

  // Configuración de la tienda (GET público, PUT solo admin)
  if (r0 === 'settings' && !r1) {
    const actual = (e.ajustes ??= { ...AJUSTES_DEMO });
    if (M === 'GET') return actual;
    if (M === 'PUT') {
      exigirAdmin(yo);
      const num = (v: unknown, d: number) => (v === undefined || v === null || v === '' ? d : Number(v));
      const nuevo: Ajustes = {
        costoEnvio: num(bj.costoEnvio, actual.costoEnvio),
        envioGratisDesde: bj.envioGratisDesde === null || bj.envioGratisDesde === '' ? null : num(bj.envioGratisDesde, actual.envioGratisDesde ?? 0),
        whatsapp: String(cambiaSi(bj.whatsapp, actual.whatsapp)).replace(/\D/g, ''),
        telefono: String(cambiaSi(bj.telefono, actual.telefono)).trim(),
        horarioEntrega: String(cambiaSi(bj.horarioEntrega, actual.horarioEntrega)).trim(),
        diasEntrega: Math.round(num(bj.diasEntrega, actual.diasEntrega)),
        ...(bj.zonas !== undefined || actual.zonas !== undefined ? { zonas: String(cambiaSi(bj.zonas, actual.zonas ?? '')) } : {}),
      };
      if (!Number.isFinite(nuevo.costoEnvio) || nuevo.costoEnvio < 0) throw new ErrorDemo('El costo de envío no es válido');
      if (nuevo.envioGratisDesde !== null && (!Number.isFinite(nuevo.envioGratisDesde) || nuevo.envioGratisDesde < 0)) throw new ErrorDemo('El monto para envío gratis no es válido');
      if (!Number.isFinite(nuevo.diasEntrega) || nuevo.diasEntrega < 0 || nuevo.diasEntrega > 60) throw new ErrorDemo('Los días de entrega no son válidos');
      e.ajustes = nuevo;
      return cambia(nuevo);
    }
  }

  throw new ErrorDemo(`Ruta de demo no encontrada: ${M} /${p.join('/')}`, 404);
}

// Búsqueda reutilizada al agregar útiles a mano
responder.buscar = (q: string): ProductoDemo[] =>
  cargar().productos.filter(x => x.category !== 'Servicios' && x.isActive !== false && coincideAlguna(x.name, q));
